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

    // Intercept users/self API endpoint and add profile_description=true
    if (
      url &&
      url.includes("freelancer.com/api/users/0.1/self?status=true") &&
      !url.includes("profile_description=true")
    ) {
      console.log(`🔄 Intercepting self API: ${url}`);

      // Add profile_description=true to the URL
      const urlObj = new URL(url);
      urlObj.searchParams.set("profile_description", "true");
      const modifiedUrl = urlObj.toString();

      console.log(`🔄 Modified URL: ${modifiedUrl}`);

      // Make the request with modified URL
      return originalFetch(modifiedUrl, init).then((response) => {
        const responseClone = response.clone();
        responseClone
          .json()
          .then((data) => {
            console.log("📊 Self API Response with profile_description:", data);

            // Send message to content script (content script will handle storage logic)
            window.postMessage(
              {
                type: "SELF_API_INTERCEPTED",
                originalUrl: url,
                modifiedUrl: modifiedUrl,
                responseData: data,
              },
              "*"
            );
          })
          .catch((error) => {
            console.error("❌ Error reading self API response:", error);
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

    // Modify self API URL to include profile_description=true
    if (
      url &&
      url.includes("freelancer.com/api/users/0.1/self?status=true") &&
      !url.includes("profile_description=true")
    ) {
      console.log(`🔄 Intercepting self XHR: ${url}`);

      const urlObj = new URL(url);
      urlObj.searchParams.set("profile_description", "true");
      const modifiedUrl = urlObj.toString();

      console.log(`🔄 Modified XHR URL: ${modifiedUrl}`);
      trackedRequests.add(this);

      return originalXHROpen.call(this, method, modifiedUrl, ...args);
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

            // Check if this is a self API response
            if (
              this.responseURL &&
              this.responseURL.includes(
                "freelancer.com/api/users/0.1/self?status=true"
              )
            ) {
              console.log(
                "📊 Self XHR Response with profile_description:",
                responseData
              );

              // Send message to content script (content script will handle storage logic)
              window.postMessage(
                {
                  type: "SELF_API_INTERCEPTED",
                  originalUrl: this.responseURL,
                  modifiedUrl: this.responseURL, // URL was already modified in open()
                  responseData: responseData,
                },
                "*"
              );
            } else {
              // Handle project data (existing logic)
              console.log("📊 Freelancer XHR Response:", responseData.result);

              // Extract all required project data
              const projectData = responseData.result.projects[0];
              const extractedData = {
                id: projectData.id,
                owner_id: projectData.owner_id,
                preview_description: projectData.preview_description,
                title: projectData.title,
                seo_url: projectData.seo_url,
                type: projectData.type,
                timestamp: Date.now(),
              };

              console.log("📊 Extracted project data:", extractedData);

              window.postMessage(
                {
                  type: "PROJECT_DATA_INTERCEPTED",
                  projectData: extractedData,
                },
                "*"
              );
            }
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
