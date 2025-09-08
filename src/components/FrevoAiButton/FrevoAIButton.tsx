// src/components/FrevoAIButton.tsx
import React, { useState } from "react";
import styles from "./FrevoAIButton.module.css";

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
  projectDescription?: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

// Main Frevo Button Component
export const FrevoAIButton: React.FC<FrevoButtonProps> = ({
  projectDescription = "",
  variant = "primary",
  size = "md",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Generate proposal function using backend
  const generateProposal = async (description: string): Promise<void> => {
    if (!description) {
      alert(
        "Could not find project description. Please refresh the page and try again."
      );
      throw new Error("No project description");
    }

    try {
      // Call your backend API instead of OpenAI directly
      const response = await fetch(
        "https://your-backend-url.com/api/generate-proposal",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectDescription: description,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Backend API call failed: ${response.status}`);
      }

      const data = await response.json();
      const proposal = data.proposal;

      if (proposal) {
        const textarea = document.querySelector("#descriptionTextArea");
        if (textarea) {
          (textarea as HTMLTextAreaElement).value = proposal;
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
          textarea.dispatchEvent(new Event("change", { bubbles: true }));
          (textarea as HTMLTextAreaElement).focus();
          console.log("✅ Proposal pasted into textarea");
        } else {
          console.log("❌ Textarea not found");
        }
      }
    } catch (error) {
      console.error("Error calling backend:", error);
      alert("Error generating proposal. Please try again later.");
      throw error;
    }
  };

  const handleClick = async () => {
    console.log("🚀 Frevo button clicked!");
    setIsLoading(true);

    try {
      await generateProposal(projectDescription);
    } catch (error) {
      console.error("Error in proposal generation:", error);
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
