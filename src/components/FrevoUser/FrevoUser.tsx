import React, { useState } from "react";
import styles from "./FrevoUser.module.css";
import { fetchJobOwnerDetails } from "../../utils/auth";

interface FrevoUserProps {
  packageType?: "basic" | "premium" | "pro";
}

const FrevoUser: React.FC<FrevoUserProps> = ({ packageType = "basic" }) => {
  const defaultImage =
    "https://media.istockphoto.com/id/1337144146/vector/default-avatar-profile-icon-vector.jpg?s=612x612&w=0&k=20&c=BIbFwuv7FxTWvh5S3vB6bkT0Qv8Vn8N5Ffseq84ClGI=";

  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [actualUserData, setActualUserData] = useState<{
    image: string;
    name: string;
    username: string;
  } | null>(null);

  const shouldShowUsername = actualUserData?.name !== actualUserData?.username;
  const isBasicPlan = packageType === "basic";

  const handleEyeClick = async () => {
    console.log("👁️ Eye button clicked!", {
      isRevealed,
      isLoadingDetails,
    });

    if (isRevealed) {
      console.log("❌ Already revealed");
      return;
    }

    if (isLoadingDetails) {
      console.log("❌ Already loading");
      return;
    }

    try {
      setIsLoadingDetails(true);

      // Extract SEO URL path from current URL using split
      // Example: https://www.freelancer.com/projects/android/Taxi-App-enhancement-new-features/details
      // Extract: "android/Taxi-App-enhancement-new-features"
      const currentUrl = window.location.href;
      console.log("🌐 Current URL:", currentUrl);

      // Split URL by "/projects/" and take the second part
      const urlParts = currentUrl.split("/projects/");
      console.log("🔍 URL parts after splitting by '/projects/':", urlParts);

      if (urlParts.length < 2) {
        throw new Error("Could not find '/projects/' in current page URL");
      }

      // Split the remaining part by "/" and take everything except the last part (which is "details")
      const projectPath = urlParts[1];
      console.log("🔍 Project path:", projectPath);

      const pathSegments = projectPath.split("/");
      console.log("🔍 Path segments:", pathSegments);

      if (pathSegments.length < 2) {
        throw new Error("Could not extract SEO URL path from current page URL");
      }

      // Remove the last segment (usually "details") and join the rest
      const seoUrlPath = pathSegments.slice(0, -1).join("/");
      console.log("🔍 Extracted SEO URL path:", seoUrlPath);

      const projectData = await new Promise<{
        id: string;
        owner_id: string;
        preview_description: string;
        title: string;
        seo_url: string;
        type: string;
        timestamp: number;
      }>((resolve, reject) => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
          chrome.runtime.sendMessage(
            {
              type: "GET_PROJECT_DATA_BY_SEO_URL",
              seoUrlPath: seoUrlPath,
            },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (response.success && response.projectData) {
                resolve(response.projectData);
              } else {
                reject(new Error(response.error || "No project data found"));
              }
            }
          );
        } else {
          reject(new Error("Chrome runtime not available"));
        }
      });

      const ownerId = projectData.owner_id;

      console.log("🔄 Project data retrieved:", projectData);
      console.log("🔄 Fetching job owner details for ID:", ownerId);

      const response = await fetchJobOwnerDetails(ownerId);
      console.log("✅ Job owner details fetched:", response);

      if (response.success && response.job_owner) {
        const avatarUrl = response.job_owner.avatar;
        const processedAvatarUrl = avatarUrl
          ? avatarUrl.startsWith("//")
            ? `https:${avatarUrl}`
            : avatarUrl
          : defaultImage;

        setActualUserData({
          image: processedAvatarUrl,
          name: response.job_owner.public_name,
          username: response.job_owner.username,
        });
        setIsRevealed(true);

        // Send jobs view event to background script with all project data
        const message = {
          type: "JOBS_VIEW_EVENT",
          data: {
            usageType: "user_detail_views",
            usage: response.usage || { used: 0, limit: 0, remaining: 0 },
            ownerId: ownerId,
            projectData: projectData, // Include all project data
            timestamp: Date.now(),
          },
        };
        console.log("📤 FrevoUser sending jobs view event:", message);
        if (typeof chrome !== "undefined" && chrome.runtime) {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                "❌ Error sending jobs view event:",
                chrome.runtime.lastError
              );
            } else {
              console.log("✅ Jobs view event sent successfully:", response);
            }
          });
        }

        console.log("✅ User details revealed, usage updated:", response.usage);
      } else {
        // Check if it's a 429 error (rate limit exceeded)
        if (
          response.error &&
          response.message &&
          response.usage &&
          response.limit
        ) {
          console.log("🚫 Daily limit exceeded:", response);
          setUpgradeMessage(response.message);
          setShowUpgradePopup(true);
          setIsLoadingDetails(false);
          return;
        }
        throw new Error("API returned unsuccessful response");
      }
    } catch (error) {
      console.error("❌ Failed to fetch user details:", error);
      setIsLoadingDetails(false); // Only set loading to false on error
    }
  };

  // Use actual data if available, otherwise use default placeholder
  const displayImage = actualUserData?.image || defaultImage;
  const displayName = actualUserData?.name || "Loading...";
  const displayUsername = actualUserData?.username || "loading";

  return (
    <>
      <div className={styles.userContainer}>
        <div className={styles.imageContainer}>
          <img
            className={`${styles.userImage} ${
              isBasicPlan && !isRevealed ? styles.blurred : ""
            }`}
            src={displayImage}
            alt={`${displayName}`}
          />
          {isBasicPlan && !isRevealed && (
            <div className={styles.eyeIcon} onClick={handleEyeClick}>
              {isLoadingDetails ? (
                <div className={styles.loadingSpinner}></div>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </div>
          )}
        </div>
        <div className={styles.userInfo}>
          <span
            className={`${styles.userName} ${
              isBasicPlan && !isRevealed ? styles.blurred : ""
            }`}
          >
            {isBasicPlan && !isRevealed ? "Sample User" : displayName}
          </span>
          {shouldShowUsername && (
            <span
              className={`${styles.username} ${
                isBasicPlan && !isRevealed ? styles.blurred : ""
              }`}
            >
              {isBasicPlan && !isRevealed
                ? "@sampleuser"
                : `@${displayUsername}`}
            </span>
          )}
        </div>
      </div>

      {/* Upgrade Popup */}
      {showUpgradePopup && (
        <div
          className={styles.popupOverlay}
          onClick={() => setShowUpgradePopup(false)}
        >
          <div
            className={styles.popupContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.popupHeader}>
              <div className={styles.popupIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3 className={styles.popupTitle}>Upgrade Required</h3>
            </div>
            <p className={styles.popupMessage}>{upgradeMessage}</p>
            <div className={styles.popupActions}>
              <button
                className={styles.upgradeButton}
                onClick={() => {
                  // Open extension popup or upgrade page
                  if (typeof chrome !== "undefined" && chrome.runtime) {
                    chrome.runtime.sendMessage({ type: "OPEN_UPGRADE_PAGE" });
                  }
                  setShowUpgradePopup(false);
                }}
              >
                Upgrade Now
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => setShowUpgradePopup(false)}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FrevoUser;
