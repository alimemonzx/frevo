// src/components/FrevoAIButton.tsx
import React, { useState } from "react";
import styles from "./FrevoAIButton.module.css";
import { API_ENDPOINTS } from "../../utils/config";
import { makeAuthenticatedRequest } from "../../utils/auth";
import logger from "../../utils/logger";

// TypeScript interfaces for proposal generation
interface ProposalGenerateRequest {
  jobTitle: string;
  jobDescription: string;
  jobRequirements?: string;
  budget?: string;
  timeline?: string;
}

interface ProposalGenerateResponse {
  success: boolean;
  proposal: {
    id: string;
    text: string;
    job_title: string;
    created_at: string;
  };
  usage: {
    used: string;
    limit: string;
    remaining: string;
  };
}

// Lightning Icon Component
export const LightningIcon: React.FC = () => (
  <svg
    className={styles.iconSvg}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

// Spinner Icon Component
export const SpinnerIcon: React.FC = () => (
  <svg
    className={`${styles.iconSvg} ${styles.spinning}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

// Props interface for FrevoButton
interface FrevoButtonProps {
  jobTitle?: string;
  jobDescription?: string;
  jobRequirements?: string;
  budget?: string;
  timeline?: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

// Main Frevo Button Component
export const FrevoAIButton: React.FC<FrevoButtonProps> = ({
  jobTitle = "",
  jobDescription = "",
  jobRequirements = "",
  budget = "",
  timeline = "",
  variant = "primary",
  size = "md",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Generate proposal function using backend
  const generateProposal = async (): Promise<void> => {
    if (!jobTitle || !jobDescription) {
      alert(
        "Job title and description are required. Please refresh the page and try again."
      );
      throw new Error("Missing required job information");
    }

    try {
      const requestBody: ProposalGenerateRequest = {
        jobTitle,
        jobDescription,
        ...(jobRequirements && { jobRequirements }),
        ...(budget && { budget }),
        ...(timeline && { timeline }),
      };

      const response = await makeAuthenticatedRequest(
        API_ENDPOINTS.PROPOSAL_GENERATE,
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data: ProposalGenerateResponse = await response.json();

      if (data.success && data.proposal) {
        const textarea = document.querySelector("#descriptionTextArea");
        if (textarea) {
          (textarea as HTMLTextAreaElement).value = data.proposal.text;
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
          textarea.dispatchEvent(new Event("change", { bubbles: true }));
          (textarea as HTMLTextAreaElement).focus();
          logger.log("✅ Proposal generated and pasted into textarea");
          logger.log("📊 Usage stats:", data.usage);
        } else {
          logger.log("❌ Textarea not found");
        }
      } else {
        throw new Error("Failed to generate proposal");
      }
    } catch (error) {
      logger.error("Error calling proposal generation API:", error);

      // Handle authentication errors specifically
      if (
        error instanceof Error &&
        error.message.includes("No authentication token")
      ) {
        alert(
          "Please log in to use Frevo AI. Click the user profile to authenticate."
        );
      } else {
        alert("Error generating proposal. Please try again later.");
      }

      throw error;
    }
  };

  const handleClick = async () => {
    logger.log("🚀 Frevo button clicked!");
    setIsLoading(true);

    try {
      await generateProposal();
    } catch (error) {
      logger.error("Error in proposal generation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClasses = [
    styles.frevoButton,
    styles[variant],
    styles[size],
  ].join(" ");

  return (
    <div className={styles.buttonContainer}>
      <button
        className={buttonClasses}
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <SpinnerIcon />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <LightningIcon />
            <span>Write with Frevo</span>
          </>
        )}
      </button>
    </div>
  );
};

// Export all components as default
export default {
  FrevoAIButton,
  LightningIcon,
  SpinnerIcon,
};
