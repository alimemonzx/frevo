// import { createRoot } from "react-dom/client";
// import FrevoUser from "./components/FrevoUser";
import logger from "./utils/logger";

// Function to inject the interceptor script
function injectInterceptor() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("interceptor.js");
  script.onload = function () {
    logger.log("✅ API interceptor script injected successfully");
    this.remove(); // Clean up the script element after loading
  };
  script.onerror = function () {
    logger.error("❌ Failed to inject API interceptor script");
    this.remove();
  };

  (document.head || document.documentElement).appendChild(script);
}

// Inject the interceptor script
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectInterceptor);
} else {
  injectInterceptor();
}
