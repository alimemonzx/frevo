import { createRoot, type Root } from "react-dom/client";
import { FrevoAIButton } from "./components/FrevoAiButton/FrevoAIButton";
import FrevoUser from "./components/FrevoUser/FrevoUser";
import {
  fetchUserProfile,
  fetchJobOwnerDetails,
  getAuthToken,
  type UserProfile,
} from "./utils/auth";

// Using CSS modules for extension-compatible styling!

interface ExtensionState {
  filterEnabled: boolean;
  minStarRating: number;
  jobsPerPage: number;
  frevoButtonInjected: boolean;
  projectDescription: string;
  currentUrl: string;
  observer: MutationObserver | null;
  scriptInjected: boolean;
  isInitializing: boolean;
  reactRoot: Root | null;
  shadowRoot: ShadowRoot | null;
  userProfile: UserProfile | null;
  isUserProfileLoading: boolean;
}

class ExtensionStateManager {
  private state: ExtensionState = {
    filterEnabled: false,
    minStarRating: 0,
    jobsPerPage: 20,
    frevoButtonInjected: false,
    projectDescription: "",
    currentUrl: window.location.href,
    observer: null,
    scriptInjected: false,
    isInitializing: false,
    reactRoot: null,
    shadowRoot: null,
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

  private isDetailPage(): boolean {
    const path = window.location.pathname;
    return path.includes("/details") && path.split("/").length > 2;
  }

  private isSearchPage(): boolean {
    const path = window.location.pathname;
    return path.includes("/search/projects");
  }

  private async extractProjectDescription(): Promise<string> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 10;

      const findDescription = () => {
        attempts++;
        const descriptionElement = document.querySelector(
          ".ProjectDescription"
        );

        if (descriptionElement) {
          const description = descriptionElement.textContent?.trim() || "";
          this.state.projectDescription = description;
          resolve(description);
        } else if (attempts < maxAttempts) {
          setTimeout(findDescription, 500);
        } else {
          resolve("");
        }
      };

      findDescription();
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
          <FrevoAIButton projectDescription={this.state.projectDescription} />
        </div>
      );

      this.state.frevoButtonInjected = true;
      console.log("✅ Button rendered with perfect alignment!");
    } catch (error) {
      console.error("❌ Failed to inject aligned Frevo button:", error);
      this.cleanupFrevoButton();
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
      this.state.projectDescription = "";
      this.state.isInitializing = false;
      this.state.shadowRoot = null;
    } catch (error) {
      console.error("❌ Error during cleanup:", error);
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

      if (this.isDetailPage()) {
        setTimeout(() => this.initializeFrevo(), 500);
      }

      if (this.isSearchPage() && this.state.filterEnabled) {
        setTimeout(() => this.filterProjectsByRating(), 1000);
      }
    }
  }

  private setupUrlChangeDetection(): void {
    this.urlCheckInterval = window.setInterval(
      () => this.checkUrlChange(),
      2000
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
      await this.extractProjectDescription();
      await this.injectFrevoButton();
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
        if (!this.state.frevoButtonInjected) {
          this.injectFrevoButton();
        }
        if (!this.state.projectDescription) {
          this.extractProjectDescription();
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

  private async injectFrevoUserWithBackendData(ownerId?: string) {
    // Look for the ProjectDetailsCard-title element
    const projectTitle = document.querySelector(
      ".ProjectDetailsCard-title.ng-star-inserted"
    );

    if (!projectTitle || projectTitle.querySelector("#extension-analyzer")) {
      return;
    }

    const container = document.createElement("div");
    container.id = "extension-analyzer";

    // 🎯 CREATE SHADOW DOM WITH PROPER STYLING
    const shadowRoot = container.attachShadow({ mode: "open" });

    // 🔥 CSS FOR SHADOW DOM - Including CSS modules and base styles!
    const style = document.createElement("style");
    style.textContent = `
    /* Reset and base styles for shadow DOM */
    :host {
      all: initial;
      display: block;
    }

    * {
      box-sizing: border-box;
    }

    /* Additional styles for FrevoUser component */
    #frevo-user-root {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  `;

    // Inject CSS modules styles into shadow DOM
    this.injectCSSModules(shadowRoot);

    // Create mount point inside shadow DOM
    const mountPoint = document.createElement("div");
    mountPoint.id = "frevo-user-root";

    // Add styles and mount point to shadow DOM
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(mountPoint);

    // Create React root inside shadow DOM with styles
    const root = createRoot(mountPoint);

    // Handle job owner details fetching
    const handleViewDetails = async () => {
      if (!ownerId) {
        throw new Error("Owner ID not available");
      }

      try {
        const jobOwnerResponse = await fetchJobOwnerDetails(ownerId);
        console.log("✅ Job owner details fetched:", jobOwnerResponse);

        // Update usage in the extension popup
        chrome.runtime.sendMessage({
          type: "UPDATE_USAGE",
          usageType: "profile_views",
        });

        return jobOwnerResponse;
      } catch (error) {
        console.error("❌ Failed to fetch job owner details:", error);
        throw error;
      }
    };

    // Use placeholder data initially - real data will be fetched when eye icon is clicked
    root.render(
      <FrevoUser
        image={chrome.runtime.getURL("avatar.jpg")}
        name="Loading..."
        username="loading"
        packageType={this.state.userProfile?.package_type}
        onViewDetails={handleViewDetails}
      />
    );

    // Insert right after the ProjectDetailsCard-title element
    projectTitle.insertAdjacentElement("afterend", container);
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
        case "OWNER_API_INTERCEPTED":
          // No longer using intercepted data - will use backend APIs only
          console.log(
            "🔄 Owner API intercepted, owner ID:",
            event.data.owner_id
          );
          this.injectFrevoUserWithBackendData(event.data.owner_id);
          break;
      }
    });

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      this.handleExtensionMessage(message, sendResponse);
      return true;
    });

    window.addEventListener("beforeunload", () => this.cleanup());
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
          if (this.isSearchPage()) {
            await this.restoreAllProjects();
          }
          break;

        case "disable-and-reload":
          // Complete cleanup and prepare for reload
          this.state.filterEnabled = false;
          this.state.minStarRating = 0;
          this.state.jobsPerPage = 20;
          this.state.projectDescription = "";

          // Cleanup any injected components
          await this.cleanupFrevoButton();

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
              await this.extractProjectDescription();
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
    if (this.urlCheckInterval) {
      clearInterval(this.urlCheckInterval);
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
