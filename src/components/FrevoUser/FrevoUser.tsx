import React, { useState, useEffect, useCallback } from "react";
import styles from "./FrevoUser.module.css";
import {
  fetchJobOwnerDetails,
  getCachedJobOwnerDetails,
  type CachedJobOwnerDetails,
} from "../../utils/auth";
import logger from "../../utils/logger";

interface FrevoUserProps {
  packageType?: "basic" | "plus" | "premium";
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
  const [hasCachedData, setHasCachedData] = useState(false);
  const [isCheckingCache, setIsCheckingCache] = useState(true);
  const [isComponentVisible, setIsComponentVisible] = useState(false);

  const shouldShowUsername = actualUserData?.name !== actualUserData?.username;
  const isBasicPlan = packageType === "basic";
  const isPremiumPlan = packageType === "plus" || packageType === "premium";

  // Reusable function to get project data and check cache
  const getProjectDataAndCheckCache = useCallback(async (): Promise<{
    projectData: {
      id: string;
      owner_id: string;
      preview_description: string;
      title: string;
      seo_url: string;
      type: string;
      timestamp: number;
    } | null;
    cachedData: CachedJobOwnerDetails | null;
  }> => {
    try {
      // Extract SEO URL path from current URL
      const currentUrl = window.location.href;
      const urlParts = currentUrl.split("/projects/");

      if (urlParts.length < 2) {
        logger.log("❌ Could not find '/projects/' in current page URL");
        return { projectData: null, cachedData: null };
      }

      const projectPath = urlParts[1];
      const pathSegments = projectPath.split("/");

      if (pathSegments.length < 2) {
        logger.log("❌ Could not extract SEO URL path from current page URL");
        return { projectData: null, cachedData: null };
      }

      const seoUrlPath = pathSegments.slice(0, -1).join("/");

      // Get project data to extract job ID and owner ID
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
      const jobId = projectData.id;

      // Check if we have cached data
      const cachedData = await getCachedJobOwnerDetails(jobId, ownerId);

      return { projectData, cachedData };
    } catch (error) {
      logger.error("❌ Error getting project data:", error);
      return { projectData: null, cachedData: null };
    }
  }, []);

  // Auto-fetch function for premium users
  const handleAutoFetch = useCallback(async () => {
    try {
      setIsLoadingDetails(true);

      // Use the reusable function to get project data
      const { projectData } = await getProjectDataAndCheckCache();

      if (!projectData) {
        throw new Error("Could not get project data");
      }

      const ownerId = projectData.owner_id;
      const jobId = projectData.id;

      logger.log("🔄 Project data retrieved:", projectData);
      logger.log(
        "🔄 Auto-fetching job owner details for ID:",
        ownerId,
        "Job ID:",
        jobId
      );

      const response = await fetchJobOwnerDetails(ownerId, jobId);
      logger.log("✅ Job owner details auto-fetched:", response);

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
        logger.log("📤 FrevoUser sending jobs view event:", message);
        if (typeof chrome !== "undefined" && chrome.runtime) {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              logger.error(
                "❌ Error sending jobs view event:",
                chrome.runtime.lastError
              );
            } else {
              logger.log("✅ Jobs view event sent successfully:", response);
            }
          });
        }

        logger.log(
          "✅ User details auto-revealed, usage updated:",
          response.usage
        );
      } else {
        // Check if it's a 429 error (rate limit exceeded)
        if (
          response.error &&
          response.message &&
          response.usage &&
          response.limit
        ) {
          logger.log("🚫 Daily limit exceeded:", response);
          setUpgradeMessage(response.message);
          setShowUpgradePopup(true);
          setIsLoadingDetails(false);
          return;
        }
        throw new Error("API returned unsuccessful response");
      }
    } catch (error) {
      logger.error("❌ Failed to auto-fetch user details:", error);
      setIsLoadingDetails(false);
    }
  }, [getProjectDataAndCheckCache]);

  // Check for cached data on component mount
  useEffect(() => {
    const checkCachedData = async () => {
      try {
        setIsCheckingCache(true);

        // For basic plan users, hide component initially
        if (isBasicPlan) {
          logger.log("🔒 Basic plan user - component hidden initially");
          setIsComponentVisible(false);
          setHasCachedData(false);
          setIsCheckingCache(false);
          return;
        }

        // For premium plan users, show component and auto-load data
        if (isPremiumPlan) {
          logger.log("⭐ Premium plan user - auto-loading data");
          setIsComponentVisible(true);
          setIsLoadingDetails(true);
        }

        const { projectData, cachedData } = await getProjectDataAndCheckCache();

        if (!projectData) {
          setHasCachedData(false);
          if (isPremiumPlan) {
            setIsLoadingDetails(false);
          }
          return;
        }

        if (cachedData) {
          logger.log(
            "✅ Found cached data on component mount - showing immediately"
          );
          logger.log(
            "💰 No eye icon needed - user data already available from cache"
          );
          setHasCachedData(true);
          setIsRevealed(true);
          setIsComponentVisible(true);

          const avatarUrl = cachedData.job_owner.avatar;
          const processedAvatarUrl = avatarUrl
            ? avatarUrl.startsWith("//")
              ? `https:${avatarUrl}`
              : avatarUrl
            : defaultImage;

          setActualUserData({
            image: processedAvatarUrl,
            name: cachedData.job_owner.public_name,
            username: cachedData.job_owner.username,
          });
        } else {
          logger.log(
            "❌ No cached data found - will show eye icon and blur effect"
          );
          logger.log(
            "👁️ User will need to click eye icon to fetch data (uses daily usage)"
          );
          setHasCachedData(false);

          // For premium users, auto-fetch data if no cache
          if (isPremiumPlan) {
            logger.log("🔄 Premium user - auto-fetching data since no cache");
            await handleAutoFetch();
          }
        }
      } catch (error) {
        logger.error("❌ Error checking cached data:", error);
        setHasCachedData(false);
        if (isPremiumPlan) {
          setIsLoadingDetails(false);
        }
      } finally {
        setIsCheckingCache(false);
      }
    };

    checkCachedData();
  }, [
    isBasicPlan,
    isPremiumPlan,
    handleAutoFetch,
    getProjectDataAndCheckCache,
  ]);

  const handleEyeClick = async () => {
    logger.log("👁️ Eye button clicked!", {
      isRevealed,
      isLoadingDetails,
      hasCachedData,
      isBasicPlan,
    });

    // For basic plan users, show the component when eye is clicked
    if (isBasicPlan && !isComponentVisible) {
      logger.log("🔓 Basic plan user - showing component on eye click");
      setIsComponentVisible(true);
      setIsLoadingDetails(true);
      await handleAutoFetch();
      return;
    }

    if (isRevealed) {
      logger.log("❌ Already revealed");
      return;
    }

    if (isLoadingDetails) {
      logger.log("❌ Already loading");
      return;
    }

    if (hasCachedData) {
      logger.log("❌ Already have cached data, no need to fetch");
      return;
    }

    try {
      setIsLoadingDetails(true);

      // Use the reusable function to get project data
      const { projectData } = await getProjectDataAndCheckCache();

      if (!projectData) {
        throw new Error("Could not get project data");
      }

      const ownerId = projectData.owner_id;
      const jobId = projectData.id;

      logger.log("🔄 Project data retrieved:", projectData);
      logger.log(
        "🔄 Fetching job owner details for ID:",
        ownerId,
        "Job ID:",
        jobId
      );

      const response = await fetchJobOwnerDetails(ownerId, jobId);
      logger.log("✅ Job owner details fetched:", response);

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
        logger.log("📤 FrevoUser sending jobs view event:", message);
        if (typeof chrome !== "undefined" && chrome.runtime) {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              logger.error(
                "❌ Error sending jobs view event:",
                chrome.runtime.lastError
              );
            } else {
              logger.log("✅ Jobs view event sent successfully:", response);
            }
          });
        }

        logger.log("✅ User details revealed, usage updated:", response.usage);
      } else {
        // Check if it's a 429 error (rate limit exceeded)
        if (
          response.error &&
          response.message &&
          response.usage &&
          response.limit
        ) {
          logger.log("🚫 Daily limit exceeded:", response);
          setUpgradeMessage(response.message);
          setShowUpgradePopup(true);
          setIsLoadingDetails(false);
          return;
        }
        throw new Error("API returned unsuccessful response");
      }
    } catch (error) {
      logger.error("❌ Failed to fetch user details:", error);
      setIsLoadingDetails(false); // Only set loading to false on error
    }
  };

  // Use actual data if available, otherwise use default placeholder
  const displayImage = actualUserData?.image || defaultImage;
  const displayName =
    actualUserData?.name || (isCheckingCache ? "Checking..." : "Loading...");
  const displayUsername =
    actualUserData?.username || (isCheckingCache ? "checking" : "loading");

  // Determine if we should show blur effect and eye icon
  const shouldShowBlurAndEye = isBasicPlan && !isRevealed && !hasCachedData;

  // Determine if we should show blur effect and spinner for premium users during auto-fetch
  const shouldShowBlurAndSpinner =
    (isPremiumPlan && isLoadingDetails && !isRevealed) || shouldShowBlurAndEye;

  return (
    <>
      <div className={styles.userContainer}>
        <div className={styles.imageContainer}>
          <img
            className={`${styles.userImage} ${
              shouldShowBlurAndSpinner ? styles.blurred : ""
            }`}
            src={displayImage}
            alt={`${displayName}`}
          />
          {shouldShowBlurAndSpinner && (
            <div
              className={styles.eyeIcon}
              onClick={shouldShowBlurAndEye ? handleEyeClick : undefined}
            >
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
              shouldShowBlurAndSpinner ? styles.blurred : ""
            }`}
          >
            {shouldShowBlurAndEye ? "Sample User" : displayName}
          </span>
          {shouldShowUsername && (
            <span
              className={`${styles.username} ${
                shouldShowBlurAndSpinner ? styles.blurred : ""
              }`}
            >
              {shouldShowBlurAndEye ? "@sampleuser" : `@${displayUsername}`}
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
