// src/components/FrevoComponents.tsx
import React, { useState } from "react";

// Lightning Icon Component
export const LightningIcon: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <svg
    className={className}
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
export const SpinnerIcon: React.FC<{ className?: string }> = ({
  className = "w-4 h-4 animate-spin",
}) => (
  <svg
    className={className}
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

  // Generate proposal function inside the component
  const generateProposal = async (description: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Access chrome extension APIs
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.sync.get(["openAIKey"], async (data) => {
          const apiKey = data.openAIKey;

          if (!apiKey) {
            alert(
              "Please enter your OpenAI API key in the Frevo extension popup first."
            );
            reject(new Error("No API key"));
            return;
          }

          if (!description) {
            alert(
              "Could not find project description. Please refresh the page and try again."
            );
            reject(new Error("No project description"));
            return;
          }

          try {
            const response = await fetch(
              "https://api.openai.com/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                  model: "gpt-4o",
                  messages: [
                    {
                      role: "system",
                      content:
                        "You are an expert proposal writer specialized in Freelancer.com projects. When the user sends a project description, write a professional, persuasive proposal in plain text with no markdown, no placeholders, and no personal tags. Express genuine interest in the project, explain why the freelancer is the best fit by highlighting relevant skills and experience (use any realistic number above 5 for years of experience), and outline a clear approach to tackle the project. Keep the proposal concise, strictly around 1100 characters, client-focused, and end only with 'Best regards.'",
                    },
                    {
                      role: "user",
                      content: `Write a proposal for the following Freelancer.com project. Keep it under 300 words.
                        Project description:
                        ${description}`,
                    },
                  ],
                  max_tokens: 1000,
                  temperature: 0.7,
                }),
              }
            );

            if (!response.ok) {
              throw new Error(`API call failed: ${response.status}`);
            }

            const data = await response.json();
            const proposal = data.choices[0]?.message?.content;

            if (proposal) {
              const textarea = document.querySelector("#descriptionTextArea");
              if (textarea) {
                (textarea as HTMLTextAreaElement).value = proposal;
                textarea.dispatchEvent(new Event("input", { bubbles: true }));
                textarea.dispatchEvent(new Event("change", { bubbles: true }));
                (textarea as HTMLTextAreaElement).focus();
                console.log("✅ Proposal pasted into textarea");
                resolve();
              } else {
                console.log("❌ Textarea not found");
                resolve();
              }
            }
          } catch (error) {
            console.error("Error calling OpenAI:", error);
            alert(
              "Error generating proposal. Please check your API key and try again."
            );
            reject(error);
          }
        });
      } else {
        reject(new Error("Chrome extension API not available"));
      }
    });
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

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  // Variant classes
  const variantClasses = {
    primary:
      "bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700",
    secondary:
      "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700",
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        relative inline-flex items-center gap-2 
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        text-white font-semibold rounded-md shadow-lg 
        hover:-translate-y-0.5 active:translate-y-0 
        disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
        transition-all duration-200
      `
        .trim()
        .replace(/\s+/g, " ")}
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
  );
};

// Export all components as default
export default {
  FrevoAIButton,
  LightningIcon,
  SpinnerIcon,
};
