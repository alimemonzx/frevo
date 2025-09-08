import React, { useState } from "react";
import styles from "./FrevoUser.module.css";

interface FrevoUserProps {
  image: string;
  name: string;
  username: string;
  packageType?: "basic" | "premium" | "pro";
  onViewDetails?: () => Promise<{
    job_owner: { avatar: string; public_name: string; username: string };
  }>;
}

const FrevoUser: React.FC<FrevoUserProps> = ({
  image,
  name,
  username,
  packageType = "premium",
  onViewDetails,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [actualUserData, setActualUserData] = useState<{
    image: string;
    name: string;
    username: string;
  } | null>(null);

  const shouldShowUsername =
    (actualUserData?.name || name) !== (actualUserData?.username || username);
  const isBasicPlan = packageType === "basic";

  const handleEyeClick = async () => {
    if (onViewDetails && !isRevealed && !isLoadingDetails) {
      try {
        setIsLoadingDetails(true);
        const response = await onViewDetails();
        setActualUserData({
          image: response.job_owner.avatar,
          name: response.job_owner.public_name,
          username: response.job_owner.username,
        });
        setIsRevealed(true);
        // Don't set loading to false here - the eye icon will disappear because isRevealed is true
      } catch (error) {
        console.error("Failed to fetch user details:", error);
        setIsLoadingDetails(false); // Only set loading to false on error
      }
    }
  };

  // Use actual data if available, otherwise use props
  const displayImage = actualUserData?.image || image;
  const displayName = actualUserData?.name || name;
  const displayUsername = actualUserData?.username || username;

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
