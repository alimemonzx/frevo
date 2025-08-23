// Content script for Frevo Extension
console.log("🚀 Frevo Extension content script loaded");

// Extension state variables
let filterEnabled = false;
let minStarRating = 0;
let jobsPerPage = 20; // Default to 20
let frevoButtonInjected = false;
let projectDescription = "";
let currentUrl = window.location.href;
let observer = null;

// Inject the pagination script
const injectPaginationScript = () => {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("inject.js");
  script.onload = function () {
    console.log("📊 Pagination script injected successfully");
    // Send current jobsPerPage value to injected script
    setTimeout(() => {
      window.postMessage(
        {
          type: "UPDATE_JOBS_PER_PAGE",
          value: jobsPerPage,
        },
        "*"
      );
    }, 100);
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
};

// Check if we're on a project detail page
const isDetailPage = () => {
  const path = window.location.pathname;
  const isDetail = path.includes("/details") && path.split("/").length > 2;
  console.log("🔍 URL Check:", {
    path,
    isDetail,
    pathSegments: path.split("/"),
  });
  return isDetail;
};

// Check if we're on the search/projects page
const isSearchPage = () => {
  const path = window.location.pathname;
  const isSearch = path.includes("/search/projects");
  console.log("🔍 Search Page Check:", {
    path,
    isSearch,
  });
  return isSearch;
};

// Extract project description from the page
const extractProjectDescription = () => {
  const descriptionElement = document.querySelector(".ProjectDescription");
  if (descriptionElement) {
    const description =
      descriptionElement.textContent || descriptionElement.innerText || "";
    projectDescription = description.trim();
    console.log(
      "📝 Extracted project description:",
      projectDescription.substring(0, 100) + "..."
    );
  } else {
    console.log("❌ Project description element not found");
    projectDescription = "";

    // Retry after a short delay in case content loads dynamically
    setTimeout(() => {
      if (!projectDescription) {
        const retryElement = document.querySelector(".ProjectDescription");
        if (retryElement) {
          const description =
            retryElement.textContent || retryElement.innerText || "";
          projectDescription = description.trim();
          console.log(
            "📝 Retry successful - extracted project description:",
            description.substring(0, 100) + "..."
          );
        }
      }
    }, 1000);
  }
};

// Remove existing Frevo button and reset state
const cleanupFrevoButton = () => {
  const existingFrevoButton = document.querySelector(
    '[data-frevo-button="true"]'
  );
  if (existingFrevoButton) {
    existingFrevoButton.remove();
  }

  frevoButtonInjected = false;
  projectDescription = "";

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  console.log("🧹 Cleaned up Frevo button and reset state");
};

// Create the Frevo button with Shadow DOM
const createFrevoButton = () => {
  const hostElement = document.createElement("div");
  hostElement.style.cssText = "display: inline-block;";
  hostElement.setAttribute("data-frevo-button", "true");

  const shadow = hostElement.attachShadow({ mode: "closed" });

  const customStyle = document.createElement("style");
  customStyle.textContent = `
      button {
        border: none;
        background: none;
        cursor: pointer;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        color: inherit;
        padding: 0;
        margin: 0;
      }

      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      .rounded-md { border-radius: 0.375rem; }

      .animate-spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `;

  const button = document.createElement("button");
  button.innerHTML = `
      <div class="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-md shadow-lg overflow-hidden">
        <!-- Lightning icon -->
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        <span class="relative z-10">Write with Frevo</span>
      </div>
    `;

  // Add click handler
  button.addEventListener("click", async () => {
    console.log("🚀 Frevo button clicked!");

    chrome.storage.sync.get(["openAIKey"], async (data) => {
      const apiKey = data.openAIKey;

      if (!apiKey) {
        alert(
          "Please enter your OpenAI API key in the Frevo extension popup first."
        );
        return;
      }

      if (!projectDescription) {
        extractProjectDescription();
        if (!projectDescription) {
          alert(
            "Could not find project description. Please refresh the page and try again."
          );
          return;
        }
      }

      // Show loading state
      button.disabled = true;
      const originalText = button.innerHTML;
      button.innerHTML = `
        <div class="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-md shadow-lg overflow-hidden">
          <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          <span class="relative z-10">Generating...</span>
        </div>
      `;

      try {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content:
                    "You are an expert proposal writer specialized in Freelancer.com projects. When the user sends a project description, write a professional, persuasive proposal in plain text with no markdown, no placeholders, and no personal tags. Express genuine interest in the project, explain why the freelancer is the best fit by highlighting relevant skills and experience (use any realistic number above 5 for years of experience), and outline a clear approach to tackle the project. Keep the proposal concise, strictly around 1100 characters, client-focused, and end only with 'Best regards.'",
                },
                {
                  role: "user",
                  content: `Write a proposal for the following Freelancer.com project. Keep it under 300 words.
                      Project description:
                      ${projectDescription}`,
                },
              ],
              max_tokens: 1000,
              temperature: 0.7,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`);
        }

        const data = await response.json();
        const proposal = data.choices[0]?.message?.content;

        if (proposal) {
          const textarea = document.querySelector("#descriptionTextArea");
          if (textarea) {
            textarea.value = proposal;
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
            textarea.dispatchEvent(new Event("change", { bubbles: true }));
            textarea.focus();
            console.log("✅ Proposal pasted into textarea");
          } else {
            console.log("❌ Textarea not found, showing modal instead");
            showProposalModal(proposal);
          }
        }
      } catch (error) {
        console.error("Error calling OpenAI:", error);
        alert(
          "Error generating proposal. Please check your API key and try again."
        );
      } finally {
        button.disabled = false;
        button.innerHTML = originalText;
      }
    });
  });

  shadow.appendChild(customStyle);
  shadow.appendChild(button);

  return hostElement;
};

// Inject Frevo button next to the existing AI button
const injectFrevoButton = () => {
  if (frevoButtonInjected) return;

  const aiButton = document.querySelector(".AIButton");
  console.log("🔍 Looking for AI button:", aiButton);

  if (aiButton && aiButton.parentElement) {
    const frevoButton = createFrevoButton();

    const bidContainer = aiButton.closest("app-bid-description-button");
    if (bidContainer && bidContainer.parentElement) {
      const parentContainer = bidContainer.parentElement;
      parentContainer.style.display = "flex";
      parentContainer.style.alignItems = "center";
      parentContainer.style.gap = "8px";

      parentContainer.insertBefore(frevoButton, bidContainer.nextSibling);
      frevoButtonInjected = true;
      console.log(
        "✨ Frevo button injected successfully as sibling to bid container!"
      );
    } else {
      aiButton.parentElement.insertBefore(frevoButton, aiButton.nextSibling);
      frevoButtonInjected = true;
      console.log("✨ Frevo button injected successfully!");
    }
  } else {
    console.log("❌ AI button not found or has no parent element");
  }
};

// Filter projects based on minimum star rating
const filterProjectsByRating = () => {
  if (!filterEnabled) return;

  if (!isSearchPage()) {
    console.log("🔍 Not on search page, skipping star rating filter");
    return;
  }

  console.log(`⭐ Filtering projects with minimum rating: ${minStarRating}`);

  const ratedElements = document.querySelectorAll("[data-rating]");

  ratedElements.forEach((el) => {
    const ratingAttr = el.getAttribute("data-rating");
    const rating = parseFloat(ratingAttr) || 0;

    let itemContainer = el.closest("a") || el.closest(".ProjectCard");

    if (!itemContainer) {
      const possibleContainers = el.closest(
        '[class*="project"], [class*="Project"], [class*="item"], [class*="Item"]'
      );
      if (
        possibleContainers &&
        !possibleContainers.classList.contains("Container")
      ) {
        itemContainer = possibleContainers;
      }
    }

    if (itemContainer) {
      if (rating < minStarRating) {
        itemContainer.style.display = "none";
        console.log(
          `🚫 Hidden project with rating ${rating} (below ${minStarRating})`
        );
      } else {
        itemContainer.style.display = "";
        console.log(
          `✅ Showing project with rating ${rating} (above ${minStarRating})`
        );
      }
    }
  });
};

// Restore all hidden projects when filter is disabled
const restoreAllProjects = () => {
  console.log("🔄 Restoring all hidden projects...");

  const ratedElements = document.querySelectorAll("[data-rating]");

  ratedElements.forEach((el) => {
    let itemContainer = el.closest("a") || el.closest(".ProjectCard");

    if (!itemContainer) {
      const possibleContainers = el.closest(
        '[class*="project"], [class*="Project"], [class*="item"], [class*="Item"]'
      );
      if (
        possibleContainers &&
        !possibleContainers.classList.contains("Container")
      ) {
        itemContainer = possibleContainers;
      }
    }

    if (itemContainer) {
      itemContainer.style.display = "";
    }
  });

  console.log("✅ All projects restored");
};

// Check for URL changes
const checkUrlChange = () => {
  const newUrl = window.location.href;
  if (newUrl !== currentUrl) {
    console.log("🔄 URL changed from", currentUrl, "to", newUrl);
    currentUrl = newUrl;

    cleanupFrevoButton();

    if (isDetailPage()) {
      console.log("🎯 URL changed to detail page, re-initializing Frevo...");
      setTimeout(() => {
        initializeFrevo();
      }, 500);
    }

    if (isSearchPage() && filterEnabled) {
      console.log("🔄 URL changed to search page, applying filter...");
      setTimeout(() => {
        filterProjectsByRating();
      }, 1000);
    }
  }
};

// Set up URL change detection
const setupUrlChangeDetection = () => {
  setInterval(checkUrlChange, 1000);

  window.addEventListener("popstate", () => {
    console.log("📱 Popstate event detected");
    setTimeout(checkUrlChange, 100);
  });

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(history, args);
    console.log("📱 PushState event detected");
    setTimeout(checkUrlChange, 100);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args);
    console.log("📱 ReplaceState event detected");
    setTimeout(checkUrlChange, 100);
  };

  console.log("🔍 URL change detection set up");
};

// Initialize Frevo features
const initializeFrevo = () => {
  if (isDetailPage()) {
    console.log("🎯 On detail page, setting up Frevo button...");

    extractProjectDescription();
    injectFrevoButton();

    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          if (!projectDescription) {
            extractProjectDescription();
          }

          if (!frevoButtonInjected) {
            injectFrevoButton();
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
};

// Get initial jobsPerPage value from storage
chrome.storage.local.get(["jobsPerPage"], (result) => {
  jobsPerPage = result.jobsPerPage !== undefined ? result.jobsPerPage : 20;
  console.log(`📊 Initial jobsPerPage: ${jobsPerPage}`);
});

// Load filter state
chrome.storage.sync.get(["enabled", "minStarRating"], (syncData) => {
  console.log("Content script loaded, checking filter state...");
  filterEnabled = syncData.enabled || false;
  minStarRating =
    syncData.minStarRating !== undefined ? syncData.minStarRating : 0;

  if (filterEnabled && isSearchPage()) {
    console.log(
      `Filter enabled with minimum rating: ${minStarRating}, applying initial filter...`
    );
    filterProjectsByRating();
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.jobsPerPage) {
    const newValue = changes.jobsPerPage.newValue;
    console.log(
      `🔄 jobsPerPage changed: ${changes.jobsPerPage.oldValue} → ${newValue}`
    );
    jobsPerPage = newValue;

    // Update the injected script
    window.postMessage(
      {
        type: "UPDATE_JOBS_PER_PAGE",
        value: newValue,
      },
      "*"
    );
  }
});

// Listen for messages from injected script
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "API_INTERCEPTED") {
    // Forward to background script for logging
    chrome.runtime.sendMessage({
      type: "LOG_INTERCEPT",
      data: event.data,
    });
  }
});

// Initialize pagination script injection
injectPaginationScript();

// Initialize everything
initializeFrevo();
setupUrlChangeDetection();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Received message:", message);

  if (message.action === "enable") {
    filterEnabled = true;
    minStarRating =
      message.minStarRating !== undefined ? message.minStarRating : 0;
    console.log(`✅ Filter enabled with minimum rating: ${minStarRating}`);
    if (isSearchPage()) {
      filterProjectsByRating();
    }
  } else if (message.action === "disable") {
    filterEnabled = false;
    console.log("❌ Filter disabled");
    if (isSearchPage()) {
      restoreAllProjects();
    }
  } else if (message.action === "update-rating") {
    minStarRating =
      message.minStarRating !== undefined ? message.minStarRating : 0;
    console.log(`⭐ Updated minimum star rating to: ${minStarRating}`);
    if (filterEnabled && isSearchPage()) {
      filterProjectsByRating();
    }
  } else if (message.action === "update-pagination") {
    const newValue = message.jobsPerPage;
    console.log(`📊 Received pagination update from popup: ${newValue}`);
    jobsPerPage = newValue;

    // Immediately update the injected script
    window.postMessage(
      {
        type: "UPDATE_JOBS_PER_PAGE",
        value: newValue,
      },
      "*"
    );

    console.log(`✅ Updated injected script with pagination: ${newValue}`);
  } else if (message.action === "inject-frevo") {
    if (isDetailPage()) {
      cleanupFrevoButton();
      injectFrevoButton();
      console.log("🚀 Frevo button force injected");
    }
  }

  sendResponse({ success: true });
});

console.log("🌐 Current URL:", window.location.href);
console.log(
  "🔍 Is Freelancer domain:",
  window.location.hostname.includes("freelancer.com")
);
