// Background service worker for Frevo Extension

chrome.runtime.onInstalled.addListener(() => {
  // Set default value to 20 (matching the UI)
  chrome.storage.local.set({ jobsPerPage: 20 });
  console.log("✅ Extension installed with default jobsPerPage: 20");
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Received message:", message);

  // Handle jobs per page setting
  if (message.type === "SET_JOBS_PER_PAGE") {
    const value = Math.max(1, Math.min(100, parseInt(message.value))); // Ensure 1-100 range

    chrome.storage.local.set({ jobsPerPage: value }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "❌ Error setting jobsPerPage:",
          chrome.runtime.lastError
        );
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        console.log(`✅ Successfully set jobsPerPage to: ${value}`);
        sendResponse({ success: true, value: value });
      }
    });

    return true; // Keep message channel open for async response
  }

  if (message.type === "GET_JOBS_PER_PAGE") {
    chrome.storage.local.get(["jobsPerPage"], (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          "❌ Error getting jobsPerPage:",
          chrome.runtime.lastError
        );
        sendResponse({ value: 20, error: chrome.runtime.lastError.message });
      } else {
        const value =
          result.jobsPerPage !== undefined ? result.jobsPerPage : 20;
        console.log(`📊 Retrieved jobsPerPage: ${value}`);
        sendResponse({ value: value });
      }
    });

    return true; // Keep message channel open for async response
  }

  if (message.type === "LOG_INTERCEPT") {
    console.log("🔄 API Intercepted:", message.data);
    sendResponse({ success: true });
  }

  // Handle jobs view event from content script
  if (message.type === "JOBS_VIEW_EVENT") {
    // Get current user data from sync storage
    chrome.storage.sync.get(["user"], (result) => {
      if (chrome.runtime.lastError) {
        console.error("❌ Error getting user data:", chrome.runtime.lastError);
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      if (result.user) {
        console.log("👁️ User data found:", result.user);
        console.log("👁️ Message data found:", message.data);
        // Update the user's usage data in sync storage
        const updatedUser = {
          ...result.user,
          daily_usage: {
            ...result.user.daily_usage,
            [message.data.usageType]: message.data.usage,
          },
        };

        // Store updated user data back to sync storage
        chrome.storage.sync.set({ user: updatedUser }, () => {
          if (chrome.runtime.lastError) {
            console.error(
              "❌ Error updating user usage in sync storage:",
              chrome.runtime.lastError
            );
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else {
            console.log("✅ User usage updated in sync storage successfully");
            sendResponse({ success: true });
          }
        });
      } else {
        console.log("❌ No user data found in sync storage");
        sendResponse({ success: false, error: "No user data found" });
      }
    });

    return true; // Keep message channel open for async response
  }

  // Default response for unknown message types
  sendResponse({ success: false, error: "Unknown message type" });
});
