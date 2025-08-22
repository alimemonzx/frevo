(function () {
  console.log("🎯 Content script loaded on:", window.location.href);
  let filterEnabled = false;
  let intervalId = null;
  let frevoButtonInjected = false;
  let projectDescription = "";
  let currentUrl = window.location.href;
  let observer = null;

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

  // Extract project description from the page
  const extractProjectDescription = () => {
    const descriptionElement = document.querySelector(".ProjectDescription");
    if (descriptionElement) {
      // Get the text content, removing extra whitespace
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

  // Show proposal modal
  const showProposalModal = (proposal) => {
    // Create modal container
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    `;

    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #1f2937; font-size: 24px; font-weight: 600;">✨ Your Frevo-Generated Proposal</h2>
        <button id="closeModal" style="background: none; border: none; cursor: pointer; font-size: 24px; color: #6b7280;">&times;</button>
      </div>
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6; line-height: 1.6; color: #374151;">
        ${proposal.replace(/\n/g, "<br>")}
      </div>
      <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: flex-end;">
        <button id="copyProposal" style="
          background: #8b5cf6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        ">Copy to Clipboard</button>
        <button id="closeModalBtn" style="
          background: #6b7280;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        ">Close</button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add event listeners
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector("#closeModal").addEventListener("click", closeModal);
    modal.querySelector("#closeModalBtn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // Copy to clipboard functionality
    modal.querySelector("#copyProposal").addEventListener("click", () => {
      navigator.clipboard.writeText(proposal).then(() => {
        const copyBtn = modal.querySelector("#copyProposal");
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        copyBtn.style.background = "#10b981";
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.background = "#8b5cf6";
        }, 2000);
      });
    });
  };

  // Remove existing Frevo button and reset state
  const cleanupFrevoButton = () => {
    // Remove any existing Frevo button
    const existingFrevoButton = document.querySelector(
      '[data-frevo-button="true"]'
    );
    if (existingFrevoButton) {
      existingFrevoButton.remove();
    }

    // Reset state
    frevoButtonInjected = false;
    projectDescription = "";

    // Disconnect existing observer
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    console.log("🧹 Cleaned up Frevo button and reset state");
  };

  // Create the Frevo button with Shadow DOM and Tailwind CSS
  const createFrevoButton = () => {
    // Create the host element
    const hostElement = document.createElement("div");
    hostElement.style.cssText = "display: inline-block;";
    hostElement.setAttribute("data-frevo-button", "true");

    // Create shadow root
    const shadow = hostElement.attachShadow({ mode: "closed" });

    // Add Tailwind CSS link to shadow DOM
    const tailwindLink = document.createElement("link");
    tailwindLink.rel = "stylesheet";
    tailwindLink.href = chrome.runtime.getURL("assets/style.css");

    // Add custom styles for button reset and missing Tailwind classes
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
        
        /* Missing Tailwind classes */
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .rounded-md { border-radius: 0.375rem; }
        
        /* Loading animation */
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

    // Create the button with Tailwind classes
    const button = document.createElement("button");
    button.innerHTML = `
        <div class="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-md shadow-lg overflow-hidden">
          <!-- Lightning icon -->
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          
          <!-- Text -->
          <span class="relative z-10">Write with Frevo</span>
        </div>
      `;

    // Add click handler
    button.addEventListener("click", async () => {
      console.log("🚀 Frevo button clicked!");

      // Get OpenAI API key from storage
      chrome.storage.sync.get(["openAIKey"], async (data) => {
        const apiKey = data.openAIKey;

        if (!apiKey) {
          alert(
            "Please enter your OpenAI API key in the Frevo extension popup first."
          );
          return;
        }

        // Check if we have a project description
        if (!projectDescription) {
          // Try to extract it again
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
          // Make OpenAI API call
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
            // Find the textarea and paste the proposal
            const textarea = document.querySelector("#descriptionTextArea");
            if (textarea) {
              // Set the value and trigger change events
              textarea.value = proposal;
              textarea.dispatchEvent(new Event("input", { bubbles: true }));
              textarea.dispatchEvent(new Event("change", { bubbles: true }));

              // Focus on the textarea
              textarea.focus();

              console.log("✅ Proposal pasted into textarea");
            } else {
              console.log("❌ Textarea not found, showing modal instead");
              showProposalModal(proposal);
            }
          } else {
            console.log("❌ No proposal generated from OpenAI");
          }
        } catch (error) {
          console.error("Error calling OpenAI:", error);
          alert(
            "Error generating proposal. Please check your API key and try again."
          );
        } finally {
          // Restore button state
          button.disabled = false;
          button.innerHTML = originalText;
        }
      });
    });

    // Assemble shadow DOM
    shadow.appendChild(tailwindLink);
    shadow.appendChild(customStyle);
    shadow.appendChild(button);

    return hostElement;
  };

  // Inject Frevo button next to the existing AI button
  const injectFrevoButton = () => {
    if (frevoButtonInjected) return;

    // Look for the existing AI button
    const aiButton = document.querySelector(".AIButton");
    console.log("🔍 Looking for AI button:", aiButton);

    if (aiButton && aiButton.parentElement) {
      const frevoButton = createFrevoButton();

      // Find the app-bid-description-button container
      const bidContainer = aiButton.closest("app-bid-description-button");
      if (bidContainer && bidContainer.parentElement) {
        // Ensure the parent container has flex layout
        const parentContainer = bidContainer.parentElement;
        parentContainer.style.display = "flex";
        parentContainer.style.alignItems = "center";
        parentContainer.style.gap = "8px";

        // Insert the Frevo button as a sibling to the app-bid-description-button
        parentContainer.insertBefore(frevoButton, bidContainer.nextSibling);
        frevoButtonInjected = true;
        console.log(
          "✨ Frevo button injected successfully as sibling to bid container!"
        );
      } else {
        // Fallback to original method
        aiButton.parentElement.insertBefore(frevoButton, aiButton.nextSibling);
        frevoButtonInjected = true;
        console.log("✨ Frevo button injected successfully!");
      }
    } else {
      console.log("❌ AI button not found or has no parent element");
    }
  };

  // No need to inject global styles with Shadow DOM
  const initializeStyles = () => {
    // Shadow DOM handles all styling internally
    console.log("🎨 Shadow DOM will handle all styling");
  };

  const removeZeroRated = () => {
    if (!filterEnabled) return;
    const zeroRated = document.querySelectorAll('[data-rating="0"]');
    zeroRated.forEach((el) => {
      let itemContainer = el.closest(
        "a, .ProjectCard, .Container, .ng-star-inserted"
      );
      if (itemContainer) {
        itemContainer.remove();
      }
    });
  };

  // Check for URL changes
  const checkUrlChange = () => {
    const newUrl = window.location.href;
    if (newUrl !== currentUrl) {
      console.log("🔄 URL changed from", currentUrl, "to", newUrl);
      currentUrl = newUrl;

      // Clean up existing button and state
      cleanupFrevoButton();

      // Re-initialize if we're on a detail page
      if (isDetailPage()) {
        console.log("🎯 URL changed to detail page, re-initializing Frevo...");
        setTimeout(() => {
          initializeFrevo();
        }, 500); // Small delay to ensure DOM is ready
      }
    }
  };

  // Set up URL change detection
  const setupUrlChangeDetection = () => {
    // Check for URL changes periodically
    setInterval(checkUrlChange, 1000);

    // Listen for popstate events (browser back/forward)
    window.addEventListener("popstate", () => {
      console.log("📱 Popstate event detected");
      setTimeout(checkUrlChange, 100);
    });

    // Listen for pushstate/replacestate events
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

  // Load initial state
  chrome.storage.sync.get(["enabled"], (data) => {
    console.log("Content script loaded, checking filter state...");
    filterEnabled = data.enabled || false;
    if (filterEnabled) {
      console.log("Filter enabled, starting interval...");
      intervalId = setInterval(removeZeroRated, 2000);
    }
  });

  // Initialize Frevo features
  const initializeFrevo = () => {
    initializeStyles();

    if (isDetailPage()) {
      console.log("🎯 On detail page, setting up Frevo button...");

      // Extract project description
      extractProjectDescription();

      // Try to inject immediately
      injectFrevoButton();

      // Set up a mutation observer to catch dynamic content
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            // Re-extract project description if content changes
            if (!projectDescription) {
              extractProjectDescription();
            }

            // Inject button if not already injected
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

  // Run initialization
  initializeFrevo();

  // Set up URL change detection
  setupUrlChangeDetection();

  // Listen for toggle from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📨 Received message:", message);
    if (message.action === "enable") {
      filterEnabled = true;
      if (!intervalId) intervalId = setInterval(removeZeroRated, 2000);
      console.log("✅ Filter enabled");
    } else if (message.action === "disable") {
      filterEnabled = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      console.log("❌ Filter disabled");
    } else if (message.action === "inject-frevo") {
      // Force inject Frevo button (for testing)
      if (isDetailPage()) {
        cleanupFrevoButton();
        initializeStyles();
        injectFrevoButton();
        console.log("🚀 Frevo button force injected");
      }
    }
    sendResponse({ success: true });
  });
})();
