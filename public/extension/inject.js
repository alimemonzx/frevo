// Simple injected script for Freelancer Pagination Modifier
(function () {
  console.log("🔄 Simple Pagination injected script loaded");

  // Default value - will be updated by content script
  let jobsPerPage = 20;
  let hasReceivedUpdate = false;

  // Function to calculate page number from offset and old limit
  function calculatePage(offset, oldLimit) {
    if (!offset || !oldLimit || oldLimit === 0) return 1;
    return Math.floor(offset / oldLimit) + 1;
  }

  // Function to calculate new offset from page and new limit
  function calculateNewOffset(page, newLimit) {
    return Math.max(0, (page - 1) * newLimit);
  }

  // Function to modify URL parameters
  function modifyUrlParams(originalUrl, newLimit) {
    try {
      const url = new URL(originalUrl);

      // Get current limit and offset
      const oldLimit = parseInt(url.searchParams.get("limit")) || 20; // Default to 20
      const oldOffset = parseInt(url.searchParams.get("offset")) || 0;

      // Calculate which page user is on
      const currentPage = calculatePage(oldOffset, oldLimit);

      // Calculate new offset for the same page with new limit
      const newOffset = calculateNewOffset(currentPage, newLimit);

      // Update parameters
      url.searchParams.set("limit", newLimit.toString());
      url.searchParams.set("offset", newOffset.toString());

      console.log(
        `📊 Page ${currentPage}: ${oldLimit}×${oldOffset} → ${newLimit}×${newOffset} (using jobsPerPage: ${newLimit})`
      );

      return url.toString();
    } catch (error) {
      console.error("❌ Error modifying URL:", error);
      return originalUrl;
    }
  }

  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch
  window.fetch = function (input, init = {}) {
    let url = typeof input === "string" ? input : input.url;

    // Check if this is the Freelancer API we want to modify
    if (
      url &&
      url.includes("freelancer.com/api/projects/0.1/projects/active")
    ) {
      console.log(`🔄 Intercepting fetch: ${url}`);
      console.log(
        `🎯 Current jobsPerPage value: ${jobsPerPage}, hasReceivedUpdate: ${hasReceivedUpdate}`
      );

      // Modify the URL with new pagination
      const modifiedUrl = modifyUrlParams(url, jobsPerPage);

      if (modifiedUrl !== url) {
        console.log("✅ Modified fetch URL");

        // Update the input
        if (typeof input === "string") {
          input = modifiedUrl;
        } else {
          input = new Request(modifiedUrl, input);
        }

        // Notify content script
        window.postMessage(
          {
            type: "API_INTERCEPTED",
            original: url,
            modified: modifiedUrl,
          },
          "*"
        );
      }
    }

    return originalFetch(input, init);
  };

  // Store original XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    if (
      url &&
      url.includes("freelancer.com/api/projects/0.1/projects/active")
    ) {
      console.log(`🔄 Intercepting XHR: ${url}`);
      console.log(
        `🎯 Current jobsPerPage value: ${jobsPerPage}, hasReceivedUpdate: ${hasReceivedUpdate}`
      );

      const modifiedUrl = modifyUrlParams(url, jobsPerPage);

      if (modifiedUrl !== url) {
        console.log("✅ Modified XHR URL");
        url = modifiedUrl;

        // Notify content script
        window.postMessage(
          {
            type: "API_INTERCEPTED",
            original: arguments[1],
            modified: url,
          },
          "*"
        );
      }
    }

    return originalXHROpen.call(this, method, url, ...args);
  };

  // Listen for jobsPerPage updates from the extension
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data.type === "UPDATE_JOBS_PER_PAGE") {
      const newValue = event.data.value;
      console.log(
        `📥 Injected Script - Received update: ${jobsPerPage} → ${newValue}`
      );
      jobsPerPage = newValue;
      hasReceivedUpdate = true;
      console.log(
        `📊 Injected Script - Updated jobsPerPage to: ${jobsPerPage}`
      );
    }
  });

  // Try to get the value from storage directly as backup
  setTimeout(() => {
    if (!hasReceivedUpdate) {
      console.log(
        "⚠️ No update received from content script, trying direct storage access..."
      );

      // This won't work in injected context, but we can try
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.get(["jobsPerPage"], (result) => {
          if (result.jobsPerPage && result.jobsPerPage !== jobsPerPage) {
            console.log(`🔄 Direct storage read: ${result.jobsPerPage}`);
            jobsPerPage = result.jobsPerPage;
            hasReceivedUpdate = true;
          }
        });
      }
    }
  }, 500);

  console.log("🎯 Simple pagination interceptor ready");
})();
