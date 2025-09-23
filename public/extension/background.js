// Background service worker for Frevo Extension

// Load logger utility
const logger = (() => {
  // Simple logger that respects development/production mode
  // In production builds, this will be silent
  const isDev = false; // This should be set to true in development builds

  return {
    log: (...args) => isDev && logger.log(...args),
    info: (...args) => isDev && console.info(...args),
    warn: (...args) => isDev && console.warn(...args),
    error: (...args) => isDev && logger.error(...args),
    debug: (...args) => isDev && console.debug(...args),
  };
})();

chrome.runtime.onInstalled.addListener(() => {
  // Set default value to 20 (matching the UI)
  chrome.storage.local.set({ jobsPerPage: 20 });
  logger.log("✅ Extension installed with default jobsPerPage: 20");
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logger.log("📨 Received message:", message);

  // Handle jobs per page setting
  if (message.type === "SET_JOBS_PER_PAGE") {
    const value = Math.max(1, Math.min(100, parseInt(message.value))); // Ensure 1-100 range

    chrome.storage.local.set({ jobsPerPage: value }, () => {
      if (chrome.runtime.lastError) {
        logger.error("❌ Error setting jobsPerPage:", chrome.runtime.lastError);
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        logger.log(`✅ Successfully set jobsPerPage to: ${value}`);
        sendResponse({ success: true, value: value });
      }
    });

    return true; // Keep message channel open for async response
  }

  if (message.type === "GET_JOBS_PER_PAGE") {
    chrome.storage.local.get(["jobsPerPage"], (result) => {
      if (chrome.runtime.lastError) {
        logger.error("❌ Error getting jobsPerPage:", chrome.runtime.lastError);
        sendResponse({ value: 20, error: chrome.runtime.lastError.message });
      } else {
        const value =
          result.jobsPerPage !== undefined ? result.jobsPerPage : 20;
        logger.log(`📊 Retrieved jobsPerPage: ${value}`);
        sendResponse({ value: value });
      }
    });

    return true; // Keep message channel open for async response
  }

  if (message.type === "LOG_INTERCEPT") {
    logger.log("🔄 API Intercepted:", message.data);
    sendResponse({ success: true });
  }

  // Handle project data storage from interceptor
  if (message.type === "STORE_PROJECT_DATA") {
    const projectData = message.projectData;

    // Get existing project data hashmap
    chrome.storage.local.get(["projectDataMap"], (result) => {
      if (chrome.runtime.lastError) {
        logger.error(
          "❌ Error getting project data map:",
          chrome.runtime.lastError
        );
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      // Initialize hashmap if it doesn't exist
      const projectDataMap = result.projectDataMap || {};

      // Store project data using project ID as key
      projectDataMap[projectData.id] = {
        id: projectData.id,
        owner_id: projectData.owner_id,
        preview_description: projectData.preview_description,
        title: projectData.title,
        seo_url: projectData.seo_url,
        type: projectData.type,
        timestamp: projectData.timestamp,
      };

      // Save updated hashmap
      chrome.storage.local.set({ projectDataMap }, () => {
        if (chrome.runtime.lastError) {
          logger.error(
            "❌ Error storing project data:",
            chrome.runtime.lastError
          );
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          logger.log(`✅ Project data stored for ID: ${projectData.id}`);
          logger.log(
            `📊 Total projects in map: ${Object.keys(projectDataMap).length}`
          );
          sendResponse({ success: true });
        }
      });
    });

    return true; // Keep message channel open for async response
  }

  // Handle getting project data by SEO URL path
  if (message.type === "GET_PROJECT_DATA_BY_SEO_URL") {
    const seoUrlPath = message.seoUrlPath;

    logger.log("🔍 Looking for project with SEO URL path:", seoUrlPath);

    // Get project data from hashmap
    chrome.storage.local.get(["projectDataMap"], (result) => {
      if (chrome.runtime.lastError) {
        logger.error(
          "❌ Error getting project data map:",
          chrome.runtime.lastError
        );
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      const projectDataMap = result.projectDataMap || {};

      // Loop through all projects to find matching seo_url
      let foundProject = null;
      let foundProjectId = null;

      for (const [projectId, projectData] of Object.entries(projectDataMap)) {
        if (projectData.seo_url === seoUrlPath) {
          foundProject = projectData;
          foundProjectId = projectId;
          break;
        }
      }

      if (foundProject) {
        logger.log(
          `✅ Found project data for SEO URL: ${seoUrlPath} (Project ID: ${foundProjectId})`
        );
        sendResponse({
          success: true,
          projectData: foundProject,
        });
      } else {
        logger.log(`❌ No project data found for SEO URL: ${seoUrlPath}`);
        logger.log(
          "📊 Available projects in map:",
          Object.keys(projectDataMap).map((id) => ({
            id: id,
            seo_url: projectDataMap[id].seo_url,
          }))
        );
        sendResponse({
          success: false,
          error: "Project data not found for SEO URL",
        });
      }
    });

    return true; // Keep message channel open for async response
  }

  // Handle jobs view event from content script
  if (message.type === "JOBS_VIEW_EVENT") {
    // Get current user data from sync storage
    chrome.storage.sync.get(["user"], (result) => {
      if (chrome.runtime.lastError) {
        logger.error("❌ Error getting user data:", chrome.runtime.lastError);
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      if (result.user) {
        logger.log("👁️ User data found:", result.user);
        logger.log("👁️ Message data found:", message.data);

        // Log all project data if available
        if (message.data.projectData) {
          logger.log("📋 Project data included in view event:", {
            id: message.data.projectData.id,
            title: message.data.projectData.title,
            owner_id: message.data.projectData.owner_id,
            seo_url: message.data.projectData.seo_url,
            type: message.data.projectData.type,
          });
        }
        // Update the user's usage data in sync storage
        const updatedUser = {
          ...result.user,
          daily_usage: {
            ...(result.user.daily_usage || {}),
            [message.data.usageType]: message.data.usage,
          },
        };

        // Store updated user data back to sync storage
        chrome.storage.sync.set({ user: updatedUser }, () => {
          if (chrome.runtime.lastError) {
            logger.error(
              "❌ Error updating user usage in sync storage:",
              chrome.runtime.lastError
            );
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else {
            logger.log("✅ User usage updated in sync storage successfully");
            sendResponse({ success: true });
          }
        });
      } else {
        logger.log("❌ No user data found in sync storage");
        sendResponse({ success: false, error: "No user data found" });
      }
    });

    return true; // Keep message channel open for async response
  }

  // Handle upgrade page request
  if (message.type === "OPEN_UPGRADE_PAGE") {
    // Open the extension popup or redirect to upgrade page
    chrome.tabs.create({
      url: chrome.runtime.getURL("index.html") + "#/upgrade",
    });
    sendResponse({ success: true });
    return true;
  }

  // Default response for unknown message types
  sendResponse({ success: false, error: "Unknown message type" });
});
