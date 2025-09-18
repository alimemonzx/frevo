import { createRoot, type Root } from "react-dom/client";
import { FrevoAIButton } from "./components/FrevoAiButton/FrevoAIButton";
import FrevoUser from "./components/FrevoUser/FrevoUser";
import {
  fetchUserProfile,
  getAuthToken,
  saveFreelancerProfile,
  isFreelancerProfileSaved,
  shouldClearJobOwnerCache,
  clearJobOwnerCache,
  type UserProfile,
} from "./utils/auth";

// Using CSS modules for extension-compatible styling!

interface JobDetails {
  title: string;
  description: string;
  requirements: string;
  budget: string;
  timeline: string;
}

interface ExtensionState {
  filterEnabled: boolean;
  minStarRating: number;
  jobsPerPage: number;
  frevoButtonInjected: boolean;
  frevoUserInjected: boolean;
  jobDetails: JobDetails;
  currentUrl: string;
  observer: MutationObserver | null;
  scriptInjected: boolean;
  isInitializing: boolean;
  reactRoot: Root | null;
  userReactRoot: Root | null;
  shadowRoot: ShadowRoot | null;
  userShadowRoot: ShadowRoot | null;
  userProfile: UserProfile | null;
  isUserProfileLoading: boolean;
}

class ExtensionStateManager {
  private state: ExtensionState = {
    filterEnabled: false,
    minStarRating: 0,
    jobsPerPage: 20,
    frevoButtonInjected: false,
    frevoUserInjected: false,
    jobDetails: {
      title: "",
      description: "",
      requirements: "",
      budget: "",
      timeline: "",
    },
    currentUrl: window.location.href,
    observer: null,
    scriptInjected: false,
    isInitializing: false,
    reactRoot: null,
    userReactRoot: null,
    shadowRoot: null,
    userShadowRoot: null,
    userProfile: null,
    isUserProfileLoading: false,
  };

  private urlCheckInterval: number | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.start());
    } else {
      this.start();
    }
  }

  private async start() {
    try {
      await this.loadStorageData();

      // Initialize cache system (check if daily clear is needed)
      await this.initializeCacheSystem();

      // Check if extension is enabled before proceeding
      if (!this.state.filterEnabled) {
        console.log("🔒 Extension is disabled, skipping initialization");
        return;
      }

      await this.loadUserProfile();
      this.setupEventListeners();
      this.setupUrlChangeDetection();
      this.injectPaginationScript();

      if (this.isDetailPage()) {
        await this.initializeFrevo();
      }

      if (this.isSearchPage() && this.state.filterEnabled) {
        await this.filterProjectsByRating();
      }

      console.log("✅ Frevo Extension with aligned buttons initialized");
    } catch (error) {
      console.error("❌ Extension initialization failed:", error);
    }
  }

  private async loadStorageData(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(["jobsPerPage"], (localResult) => {
        this.state.jobsPerPage = localResult.jobsPerPage ?? 20;

        chrome.storage.sync.get(["enabled", "minStarRating"], (syncResult) => {
          this.state.filterEnabled = syncResult.enabled ?? false;
          this.state.minStarRating = syncResult.minStarRating ?? 0;
          resolve();
        });
      });
    });
  }

  private async initializeCacheSystem(): Promise<void> {
    try {
      // Check if cache should be cleared (daily reset)
      if (await shouldClearJobOwnerCache()) {
        await clearJobOwnerCache();
        console.log("🔄 Job owner cache cleared for new day");
      } else {
        console.log("✅ Job owner cache is up to date");
      }
    } catch (error) {
      console.error("❌ Error initializing cache system:", error);
      // Don't throw error as cache initialization failure shouldn't break the extension
    }
  }

  private async loadUserProfile(): Promise<void> {
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        console.log("No auth token available, skipping user profile load");
        return;
      }

      this.state.isUserProfileLoading = true;
      const profileResponse = await fetchUserProfile();
      this.state.userProfile = profileResponse.user;
      console.log("✅ User profile loaded:", this.state.userProfile);
    } catch (error) {
      console.error("❌ Failed to load user profile:", error);
    } finally {
      this.state.isUserProfileLoading = false;
    }
  }

  private async checkAndHandleFreelancerProfileSave(responseData: {
    result?: {
      chosen_role?: string;
      username?: string;
      email?: string;
      id?: string;
      location?: {
        city?: string;
        country?: {
          name?: string;
        };
      };
      public_name?: string;
      profile_description?: string;
    };
  }): Promise<void> {
    try {
      // Check if freelancer profile has already been saved
      const alreadySaved = await isFreelancerProfileSaved();
      if (alreadySaved) {
        console.log(
          "🔄 Freelancer profile already saved, skipping POST request"
        );
        return;
      }

      // If not saved, proceed with the save
      await this.handleFreelancerProfileSave(responseData);
    } catch (error) {
      console.error(
        "❌ Failed to check freelancer profile save status:",
        error
      );
    }
  }

  private async handleFreelancerProfileSave(responseData: {
    result?: {
      chosen_role?: string;
      username?: string;
      email?: string;
      id?: string;
      location?: {
        city?: string;
        country?: {
          name?: string;
        };
      };
      public_name?: string;
      profile_description?: string;
    };
  }): Promise<void> {
    try {
      // Check if user is authenticated
      const authToken = await getAuthToken();
      if (!authToken) {
        console.log(
          "No auth token available, skipping freelancer profile save"
        );
        return;
      }

      // Extract user data from the response
      const userData = responseData.result;
      if (!userData) {
        console.log(
          "No user data found in response, skipping freelancer profile save"
        );
        return;
      }

      // Map the response data to the API body format
      const profileData = {
        role: userData.chosen_role || "freelancer",
        username: userData.username || "",
        email: userData.email || "",
        city: userData.location?.city || "",
        country: userData.location?.country?.name || "",
        name: userData.public_name || userData.username || "",
        description: userData.profile_description || "",
        freelancer_id: userData.id || "",
      };

      console.log("🔄 Saving freelancer profile with data:", profileData);

      // Call the API to save the profile
      const result = await saveFreelancerProfile(profileData);
      console.log("✅ Freelancer profile saved successfully:", result);
    } catch (error) {
      // Check if it's a 409 error (profile already exists)
      if (error instanceof Error && error.message.includes("409")) {
        console.log("ℹ️ Freelancer profile already exists, no action needed");
      } else {
        console.error("❌ Failed to save freelancer profile:", error);
      }
    }
  }

  private isDetailPage(): boolean {
    const path = window.location.pathname;
    return path.includes("/details") && path.split("/").length > 2;
  }

  private isSearchPage(): boolean {
    const path = window.location.pathname;
    return path.includes("/search/projects");
  }

  private async extractJobDetails(): Promise<JobDetails> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 10;

      const findJobDetails = () => {
        attempts++;

        // Extract job title - using the actual Freelancer.com selectors
        const titleElement =
          document.querySelector("app-project-title h1 span") ||
          document.querySelector("app-project-title h1") ||
          document.querySelector(".ProjectDetailsCard-title") ||
          document.querySelector("h1");
        const title = titleElement?.textContent?.trim() || "";

        // Extract job description
        const descriptionElement = document.querySelector(
          ".ProjectDescription"
        );
        const description = descriptionElement?.textContent?.trim() || "";

        // Extract job requirements (look for common requirement selectors)
        const requirementsElement =
          document.querySelector(".ProjectRequirements") ||
          document.querySelector(".requirements") ||
          document.querySelector("[data-testid='requirements']");
        const requirements = requirementsElement?.textContent?.trim() || "";

        // Extract budget information - using the actual Freelancer.com selectors
        const budgetElement =
          document.querySelector(
            "app-project-details-budget .ProjectViewDetails-budget p"
          ) ||
          document.querySelector("app-project-details-budget p") ||
          document.querySelector(".ProjectViewDetails-budget p") ||
          document.querySelector(".ProjectBudget") ||
          document.querySelector(".budget");
        const budget = budgetElement?.textContent?.trim() || "";

        // Extract timeline information - look for bidding end time or duration
        const timelineElement =
          document.querySelector(
            "app-project-details-budget fl-relative-time span"
          ) ||
          document.querySelector("fl-relative-time span") ||
          document.querySelector(".ProjectTimeline") ||
          document.querySelector(".timeline") ||
          document.querySelector("[data-testid='timeline']") ||
          document.querySelector(".duration");
        const timeline = timelineElement?.textContent?.trim() || "";

        const jobDetails: JobDetails = {
          title,
          description,
          requirements,
          budget,
          timeline,
        };

        // Debug logging to help troubleshoot extraction
        console.log("🔍 Job extraction attempt", attempts, ":", {
          title: title ? `"${title}"` : "NOT FOUND",
          description: description
            ? `"${description.substring(0, 100)}..."`
            : "NOT FOUND",
          budget: budget ? `"${budget}"` : "NOT FOUND",
          timeline: timeline ? `"${timeline}"` : "NOT FOUND",
        });

        // If we have at least title and description, we can proceed
        if (title && description) {
          this.state.jobDetails = jobDetails;
          console.log("✅ Job details extracted successfully:", jobDetails);
          resolve(jobDetails);
        } else if (attempts < maxAttempts) {
          setTimeout(findJobDetails, 500);
        } else {
          console.log(
            "❌ Could not find complete job details after 10 attempts"
          );
          console.log("📋 Final extraction result:", jobDetails);
          // Still resolve with what we have
          this.state.jobDetails = jobDetails;
          resolve(jobDetails);
        }
      };

      findJobDetails();
    });
  }

  // 🎯 ALIGN BUTTONS BY MODIFYING THE PARENT CONTAINER
  private alignButtonsInRow(parentContainer: Element): void {
    // Style the parent container to be a flex row
    if (parentContainer instanceof HTMLElement) {
      parentContainer.style.display = "flex";
      parentContainer.style.alignItems = "center";
      parentContainer.style.gap = "8px";
      parentContainer.style.flexWrap = "wrap";
    }

    // Also ensure the existing AI button has consistent styling
    const aiButton = parentContainer.querySelector(
      "app-bid-description-button"
    );
    if (aiButton instanceof HTMLElement) {
      aiButton.style.flexShrink = "0"; // Prevent shrinking
    }
  }

  // 🎨 INJECT CSS MODULES INTO SHADOW DOM
  private async injectCSSModules(shadowRoot: ShadowRoot): Promise<void> {
    try {
      // Try to fetch the CSS file from extension assets
      const possiblePaths = ["assets/style.css", "assets/style"];

      for (const path of possiblePaths) {
        try {
          const cssUrl = chrome.runtime.getURL(path);
          const response = await fetch(cssUrl);
          if (response.ok) {
            const css = await response.text();
            const cssStyle = document.createElement("style");
            cssStyle.textContent = css;
            shadowRoot.appendChild(cssStyle);
            console.log("✅ CSS modules loaded successfully from:", path);
            return;
          }
        } catch {
          // Continue to next path
        }
      }

      console.log(
        "⚠️ CSS modules file not found, components will use fallback styles"
      );
    } catch (error) {
      console.log("⚠️ Error loading CSS modules:", error);
    }
  }

  // 🚀 CREATE SHADOW DOM WITH PROPER BUTTON ALIGNMENT
  private createShadowContainer(parentElement: Element): {
    container: HTMLElement;
    shadowRoot: ShadowRoot;
    mountPoint: HTMLElement;
  } {
    // First, align the parent container
    this.alignButtonsInRow(parentElement);

    // Create container element
    const container = document.createElement("div");
    container.setAttribute("data-frevo-button", "true");
    // 🎯 IMPORTANT: Remove margin-left, let flex gap handle spacing
    container.style.cssText = "display: inline-block; flex-shrink: 0;";

    // 🎯 CREATE SHADOW DOM - COMPLETE ISOLATION!
    const shadowRoot = container.attachShadow({ mode: "open" });
    this.state.shadowRoot = shadowRoot;

    // Create mount point inside shadow DOM
    const mountPoint = document.createElement("div");
    mountPoint.id = "frevo-react-root";

    // 🔥 CSS FOR SHADOW DOM - Including CSS modules and base styles!
    const style = document.createElement("style");
    style.textContent = `
      /* Reset and base styles for shadow DOM */
      :host {
        all: initial;
        display: inline-block;
      }

      * {
        box-sizing: border-box;
      }

      /* Additional alignment and sizing styles */
      #frevo-react-root {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
      }

      /* Match the height and style of the native AI button */
      #frevo-react-root button {
        height: 40px; /* Match typical button height */
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        vertical-align: middle;
      }
    `;

    // Inject CSS modules styles into shadow DOM
    this.injectCSSModules(shadowRoot);

    // Add styles and mount point to shadow DOM
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(mountPoint);

    // Insert container into parent
    const aiButton = parentElement.querySelector("app-bid-description-button");
    if (aiButton?.nextSibling) {
      parentElement.insertBefore(container, aiButton.nextSibling);
    } else {
      parentElement.appendChild(container);
    }

    return { container, shadowRoot, mountPoint };
  }

  // 🚀 INJECT BUTTON WITH PROPER ALIGNMENT
  private async injectFrevoButton(): Promise<void> {
    if (this.state.frevoButtonInjected) return;

    const aiButton = document.querySelector("app-bid-description-button");
    if (!aiButton?.parentElement) {
      console.log("❌ app-bid-description-button not found");
      return;
    }

    console.log("✅ Injecting Frevo button with proper alignment");

    try {
      // Create shadow DOM container with alignment
      const { mountPoint } = this.createShadowContainer(aiButton.parentElement);

      // Create React root inside shadow DOM
      const root = createRoot(mountPoint);
      this.state.reactRoot = root;

      // 🎯 RENDER REACT WITH CONSISTENT BUTTON HEIGHT AND STYLING
      root.render(
        <div style={{ display: "flex", alignItems: "center" }}>
          <FrevoAIButton
            jobTitle={this.state.jobDetails.title}
            jobDescription={this.state.jobDetails.description}
            jobRequirements={this.state.jobDetails.requirements}
            budget={this.state.jobDetails.budget}
            timeline={this.state.jobDetails.timeline}
          />
        </div>
      );

      this.state.frevoButtonInjected = true;
      console.log("✅ Button rendered with perfect alignment!");
    } catch (error) {
      console.error("❌ Failed to inject aligned Frevo button:", error);
      this.cleanupFrevoButton();
    }
  }

  // 🔍 POLL FOR ELEMENT AND INJECT WHEN FOUND
  private pollForElementAndInject(): void {
    console.log("🔄 Starting polling for ProjectDetailsCard-title element...");

    const startTime = Date.now();
    const maxDuration = 20000; // 20 seconds
    const pollInterval = 250; // Check every 250ms

    const poll = () => {
      // Check if we've exceeded the time limit
      if (Date.now() - startTime > maxDuration) {
        console.log(
          "❌ Polling timeout: ProjectDetailsCard-title not found after 20 seconds"
        );
        return;
      }

      // Check if already injected
      if (this.state.frevoUserInjected) {
        console.log("✅ FrevoUser already injected, stopping poll");
        return;
      }

      // Try to find the element
      const element = this.findProjectTitleElement();
      if (element) {
        console.log("✅ Element found! Injecting FrevoUser...");
        this.injectFrevoUserWithElement(element);
        return;
      }

      // Continue polling
      setTimeout(poll, pollInterval);
    };

    // Start polling
    poll();
  }

  // 🔍 FIND PROJECT TITLE ELEMENT WITH MULTIPLE SELECTORS
  private findProjectTitleElement(): Element | null {
    const selectors = [
      ".ProjectDetailsCard-title.ng-star-inserted",
      ".ProjectDetailsCard-title",
      "[class*='ProjectDetailsCard-title']",
      "[class*='project-title']",
      "[class*='ProjectTitle']",
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`✅ Found project title with selector: ${selector}`);
        return element;
      }
    }

    return null;
  }

  private async injectFrevoUserWithElement(
    projectTitle: Element
  ): Promise<void> {
    if (this.state.frevoUserInjected) return;

    console.log("✅ Injecting FrevoUser component with shadow DOM");

    try {
      // Create container element similar to FrevoButton
      const container = document.createElement("div");
      container.setAttribute("data-frevo-user", "true");
      container.style.cssText = "display: block; margin-top: 10px;";

      // Create shadow DOM for isolation
      const shadowRoot = container.attachShadow({ mode: "open" });
      this.state.userShadowRoot = shadowRoot;

      // Create mount point inside shadow DOM
      const mountPoint = document.createElement("div");
      mountPoint.id = "frevo-user-root";

      // Add styles to shadow DOM
      const style = document.createElement("style");
      style.textContent = `
        :host {
          all: initial;
          display: block;
        }
        * {
          box-sizing: border-box;
        }
        #frevo-user-root {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `;

      // Inject CSS modules styles into shadow DOM
      this.injectCSSModules(shadowRoot);

      // Add styles and mount point to shadow DOM
      shadowRoot.appendChild(style);
      shadowRoot.appendChild(mountPoint);

      // Create React root inside shadow DOM
      const root = createRoot(mountPoint);
      this.state.userReactRoot = root;

      // Render FrevoUser component without ownerId (will be retrieved from storage when needed)
      root.render(
        <FrevoUser packageType={this.state.userProfile?.package_type} />
      );

      // Insert right after the ProjectDetailsCard-title element
      projectTitle.insertAdjacentElement("afterend", container);

      this.state.frevoUserInjected = true;
      console.log(
        "✅ FrevoUser component injected successfully with shadow DOM"
      );
    } catch (error) {
      console.error("❌ Failed to inject FrevoUser component:", error);
      this.cleanupFrevoUser();
    }
  }

  private async cleanupFrevoButton(): Promise<void> {
    try {
      // Cleanup React root
      if (this.state.reactRoot) {
        this.state.reactRoot.unmount();
        this.state.reactRoot = null;
      }

      // Remove Shadow DOM container
      const existingButton = document.querySelector(
        '[data-frevo-button="true"]'
      );
      if (existingButton) {
        // Also restore parent container styling if needed
        const parentContainer = existingButton.parentElement;
        existingButton.remove();

        // Reset parent container styling (optional)
        if (parentContainer instanceof HTMLElement) {
          // You might want to restore original styling here
          // For now, we'll leave the flex styling as it generally improves the layout
        }
      }

      // Cleanup observer
      if (this.state.observer) {
        this.state.observer.disconnect();
        this.state.observer = null;
      }

      // Reset state
      this.state.frevoButtonInjected = false;
      this.state.jobDetails = {
        title: "",
        description: "",
        requirements: "",
        budget: "",
        timeline: "",
      };
      this.state.isInitializing = false;
      this.state.shadowRoot = null;
    } catch (error) {
      console.error("❌ Error during cleanup:", error);
    }
  }

  private async cleanupFrevoUser(): Promise<void> {
    try {
      // Cleanup React root (same pattern as FrevoButton)
      if (this.state.userReactRoot) {
        this.state.userReactRoot.unmount();
        this.state.userReactRoot = null;
      }

      // Remove Shadow DOM container (same pattern as FrevoButton)
      const existingUser = document.querySelector('[data-frevo-user="true"]');
      if (existingUser) {
        existingUser.remove();
      }

      // Reset state
      this.state.frevoUserInjected = false;
      this.state.userShadowRoot = null;

      console.log("✅ FrevoUser component cleaned up");
    } catch (error) {
      console.error("❌ Error cleaning up FrevoUser:", error);
    }
  }

  private async filterProjectsByRating(): Promise<void> {
    if (!this.state.filterEnabled || !this.isSearchPage()) return;

    const ratedElements = document.querySelectorAll("[data-rating]");
    ratedElements.forEach((el) => {
      const ratingAttr = el.getAttribute("data-rating");
      const rating = parseFloat(ratingAttr || "0");

      const itemContainer =
        el.closest("a") ||
        el.closest(".ProjectCard") ||
        el.closest('[class*="project"], [class*="Project"]');

      if (itemContainer && !itemContainer.classList.contains("Container")) {
        (itemContainer as HTMLElement).style.display =
          rating < this.state.minStarRating ? "none" : "";
      }
    });
  }

  private async restoreAllProjects(): Promise<void> {
    const ratedElements = document.querySelectorAll("[data-rating]");
    ratedElements.forEach((el) => {
      const itemContainer =
        el.closest("a") ||
        el.closest(".ProjectCard") ||
        el.closest('[class*="project"], [class*="Project"]');

      if (itemContainer && !itemContainer.classList.contains("Container")) {
        (itemContainer as HTMLElement).style.display = "";
      }
    });
  }

  private checkUrlChange(): void {
    const newUrl = window.location.href;
    if (newUrl !== this.state.currentUrl) {
      this.state.currentUrl = newUrl;
      this.cleanupFrevoButton();
      this.cleanupFrevoUser();

      if (this.isDetailPage()) {
        setTimeout(() => this.initializeFrevo(), 500);
      }

      if (this.isSearchPage() && this.state.filterEnabled) {
        setTimeout(() => this.filterProjectsByRating(), 1000);
      }
    }
  }

  private setupUrlChangeDetection(): void {
    // Reduce interval for faster SPA navigation detection
    this.urlCheckInterval = window.setInterval(
      () => this.checkUrlChange(),
      500 // More frequent checking for better SPA support
    ) as number;

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      setTimeout(() => this.checkUrlChange(), 100);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      setTimeout(() => this.checkUrlChange(), 100);
    };

    window.addEventListener("popstate", () => {
      setTimeout(() => this.checkUrlChange(), 100);
    });

    // Add additional navigation event listeners for better SPA support
    window.addEventListener("hashchange", () => {
      setTimeout(() => this.checkUrlChange(), 100);
    });

    // Listen for Angular router navigation events (freelancer.com uses Angular)
    window.addEventListener("locationchange", () => {
      setTimeout(() => this.checkUrlChange(), 100);
    });
  }

  private async initializeFrevo(): Promise<void> {
    if (this.state.isInitializing) return;
    this.state.isInitializing = true;

    if (!this.isDetailPage()) {
      this.state.isInitializing = false;
      return;
    }

    console.log("🎯 Initializing Frevo with button alignment");

    try {
      await this.extractJobDetails();
      await this.injectFrevoButton();
      // Inject FrevoUser immediately - it will get ownerId from storage when needed
      this.pollForElementAndInject();
      this.setupDOMObserver();
    } catch (error) {
      console.error("❌ Failed to initialize Frevo:", error);
    } finally {
      this.state.isInitializing = false;
    }
  }

  private setupDOMObserver(): void {
    let debounceTimer: number | null = null;

    this.state.observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = window.setTimeout(() => {
        // Handle FrevoButton injection (same as before)
        if (!this.state.frevoButtonInjected) {
          this.injectFrevoButton();
        }
        if (
          !this.state.jobDetails.title ||
          !this.state.jobDetails.description
        ) {
          this.extractJobDetails();
        }
        // Handle FrevoUser injection if not already injected
        if (!this.state.frevoUserInjected) {
          this.pollForElementAndInject();
        }
      }, 250) as number;
    });

    this.state.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private injectPaginationScript(): void {
    if (this.state.scriptInjected) return;

    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("inject.js");
    script.onload = () => {
      setTimeout(() => {
        window.postMessage(
          {
            type: "UPDATE_JOBS_PER_PAGE",
            value: this.state.jobsPerPage,
          },
          "*"
        );
      }, 100);
      script.remove();
    };

    (document.head || document.documentElement).appendChild(script);
    this.state.scriptInjected = true;
  }

  private setupEventListeners(): void {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "local" && changes.jobsPerPage) {
        this.state.jobsPerPage = changes.jobsPerPage.newValue;
        window.postMessage(
          {
            type: "UPDATE_JOBS_PER_PAGE",
            value: changes.jobsPerPage.newValue,
          },
          "*"
        );
      }
    });

    window.addEventListener("message", (event) => {
      if (event.source !== window) return;

      switch (event.data.type) {
        case "API_INTERCEPTED":
          chrome.runtime.sendMessage({
            type: "LOG_INTERCEPT",
            data: event.data,
          });
          break;
        case "REQUEST_JOBS_PER_PAGE":
          window.postMessage(
            {
              type: "UPDATE_JOBS_PER_PAGE",
              value: this.state.jobsPerPage,
            },
            "*"
          );
          break;
        case "PROJECT_DATA_INTERCEPTED":
          console.log("🔄 Project data intercepted:", event.data.projectData);
          // Forward project data to background script for storage
          chrome.runtime.sendMessage({
            type: "STORE_PROJECT_DATA",
            projectData: event.data.projectData,
          });
          break;
        case "SELF_API_INTERCEPTED":
          console.log("🔄 Self API intercepted with profile_description=true");
          console.log("📊 Original URL:", event.data.originalUrl);
          console.log("📊 Modified URL:", event.data.modifiedUrl);
          console.log("📊 Response Data:", event.data.responseData);

          // Check if freelancer profile has already been saved before handling
          this.checkAndHandleFreelancerProfileSave(event.data.responseData);
          break;
        case "SPA_NAVIGATION":
          // Handle SPA navigation events from injected script
          console.log("🚀 SPA navigation detected");
          setTimeout(() => this.checkUrlChange(), 100);
          break;
      }
    });

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      this.handleExtensionMessage(message, sendResponse);
      return true;
    });

    window.addEventListener("beforeunload", () => this.cleanup());

    // Add additional event listeners for better SPA support
    // Listen for Angular router events if available
    if (typeof window !== "undefined") {
      // Try to hook into Angular router if it exists
      const checkForAngularRouter = () => {
        try {
          // Check if Angular is available
          const windowAny = window as unknown as Record<string, unknown>;
          if (windowAny.ng && (windowAny.ng as Record<string, unknown>).probe) {
            console.log("🔍 Angular detected, setting up router hooks");
            // Set up a more aggressive polling for navigation changes
            setInterval(() => {
              const currentUrl = window.location.href;
              if (currentUrl !== this.state.currentUrl) {
                console.log("🚀 Angular navigation detected via polling");
                this.checkUrlChange();
              }
            }, 100); // Very frequent checking
          }
        } catch {
          // Angular not available or error accessing it
          console.log("ℹ️ Angular router hooks not available");
        }
      };

      // Check for Angular after DOM is loaded
      setTimeout(checkForAngularRouter, 1000);
    }
  }

  private async handleExtensionMessage(
    message: { action: string; minStarRating?: number; jobsPerPage?: number },
    sendResponse: (response: { success: boolean; error?: string }) => void
  ): Promise<void> {
    try {
      switch (message.action) {
        case "enable":
          this.state.filterEnabled = true;
          this.state.minStarRating = message.minStarRating ?? 0;
          if (this.isSearchPage()) {
            await this.filterProjectsByRating();
          }
          break;

        case "disable":
          this.state.filterEnabled = false;
          // Clean up all injected components
          await this.cleanupFrevoButton();
          await this.cleanupFrevoUser();
          if (this.isSearchPage()) {
            await this.restoreAllProjects();
          }
          console.log("🔒 Extension disabled - all features turned off");
          break;

        case "disable-and-reload":
          // Complete cleanup and prepare for reload
          this.state.filterEnabled = false;
          this.state.minStarRating = 0;
          this.state.jobsPerPage = 20;
          this.state.jobDetails = {
            title: "",
            description: "",
            requirements: "",
            budget: "",
            timeline: "",
          };

          // Cleanup any injected components
          await this.cleanupFrevoButton();
          await this.cleanupFrevoUser();

          // Restore all projects if on search page
          if (this.isSearchPage()) {
            await this.restoreAllProjects();
          }

          // Clear any intervals or observers
          this.cleanup();

          console.log("🔄 Extension disabled - page will reload");
          break;

        case "update-rating":
          this.state.minStarRating = message.minStarRating ?? 0;
          if (this.state.filterEnabled && this.isSearchPage()) {
            await this.filterProjectsByRating();
          }
          break;

        case "update-pagination":
          this.state.jobsPerPage = message.jobsPerPage ?? 20;
          window.postMessage(
            {
              type: "UPDATE_JOBS_PER_PAGE",
              value: message.jobsPerPage,
            },
            "*"
          );
          break;

        case "inject-frevo":
          if (this.isDetailPage()) {
            await this.cleanupFrevoButton();
            setTimeout(async () => {
              await this.extractJobDetails();
              await this.injectFrevoButton();
            }, 100);
          }
          break;
      }

      sendResponse({ success: true });
    } catch (error) {
      console.error("❌ Error handling message:", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private cleanup(): void {
    this.cleanupFrevoButton();
    this.cleanupFrevoUser();
    if (this.urlCheckInterval) {
      clearInterval(this.urlCheckInterval);
      this.urlCheckInterval = null;
    }
  }
}

// Initialize extension
if (
  typeof window !== "undefined" &&
  !(window as unknown as Record<string, unknown>).__FREVO_EXTENSION_LOADED__
) {
  (window as unknown as Record<string, unknown>).__FREVO_EXTENSION_LOADED__ =
    true;
  new ExtensionStateManager();
}
