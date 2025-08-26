(function () {
  console.log("🔄 Interceptor script loaded");
  const originalFetch = window.fetch;

  // Intercept fetch requests
  window.fetch = function (input, init = {}) {
    let url = typeof input === "string" ? input : input.url;

    if (url && url.includes("freelancer.com/api/projects/0.1/projects?limit")) {
      console.log(`🔄 Intercepting fetch: ${url}`);

      return originalFetch(input, init).then((response) => {
        const responseClone = response.clone();
        responseClone
          .json()
          .then((data) => {
            console.log("📊 Freelancer API Response:", data);
          })
          .catch((error) => {
            console.error("❌ Error reading response:", error);
          });

        return response;
      });
    }

    return originalFetch(input, init);
  };

  // Store original XMLHttpRequest methods
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  // Track requests we want to intercept
  const trackedRequests = new WeakSet();

  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    if (url && url.includes("freelancer.com/api/projects/0.1/projects?limit")) {
      console.log(`🔄 Intercepting XHR: ${url}`);
      trackedRequests.add(this);
    }
    return originalXHROpen.call(this, method, url, ...args);
  };

  XMLHttpRequest.prototype.send = function (data) {
    if (trackedRequests.has(this)) {
      const originalOnReadyStateChange = this.onreadystatechange;

      this.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
          try {
            const responseData = JSON.parse(this.responseText);
            console.log(
              "📊 Freelancer XHR Response:",
              responseData.result.projects[0].owner_id
            );
            window.postMessage(
              {
                type: "OWNER_API_INTERCEPTED",
                owner_id: responseData.result.projects[0].owner_id,
              },
              "*"
            );
          } catch (error) {
            console.error("❌ Error parsing XHR response:", error);
          }
        }

        // Call original handler if it exists
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.call(this);
        }
      };
    }

    return originalXHRSend.call(this, data);
  };
})();
