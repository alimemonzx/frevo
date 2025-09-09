import React, { useState } from "react";
import styles from "./FrevoUser.module.css";
import { fetchJobOwnerDetails } from "../../utils/auth";

interface FrevoUserProps {
  packageType?: "basic" | "premium" | "pro";
  ownerId: string | null;
}

const FrevoUser: React.FC<FrevoUserProps> = ({
  packageType = "basic",
  ownerId,
}) => {
  const defaultImage =
    "https://media.istockphoto.com/id/1337144146/vector/default-avatar-profile-icon-vector.jpg?s=612x612&w=0&k=20&c=BIbFwuv7FxTWvh5S3vB6bkT0Qv8Vn8N5Ffseq84ClGI=";

  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [actualUserData, setActualUserData] = useState<{
    image: string;
    name: string;
    username: string;
  } | null>(null);

  const shouldShowUsername = actualUserData?.name !== actualUserData?.username;
  const isBasicPlan = packageType === "basic";

  // Owner ID is passed as prop from content script when intercepted

  const handleEyeClick = async () => {
    console.log("👁️ Eye button clicked!", {
      ownerId,
      isRevealed,
      isLoadingDetails,
    });

    if (!ownerId) {
      console.log("❌ No owner ID available yet - waiting for interceptor");
      return;
    }

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
      console.log("🔄 Fetching job owner details for ID:", ownerId);

      const response = await fetchJobOwnerDetails(ownerId);
      console.log("✅ Job owner details fetched:", response);

      if (response.success) {
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

        // Send jobs view event to background script
        const message = {
          type: "JOBS_VIEW_EVENT",
          data: {
            usageType: "user_detail_views",
            usage: response.usage,
            ownerId: ownerId,
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
            {isBasicPlan && !isRevealed ? "@sampleuser" : `@${displayUsername}`}
          </span>
        )}
      </div>
    </div>
  );
};

export default FrevoUser;
