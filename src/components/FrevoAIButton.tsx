// src/components/FrevoComponents.tsx
import React, { useState } from "react";
import styled, { keyframes } from "styled-components";

// Animations
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Styled Components
const IconSvg = styled.svg<{ $isSpinning?: boolean }>`
  width: 1rem;
  height: 1rem;
  animation: ${(props) => (props.$isSpinning ? spin : "none")} 1s linear
    infinite;
`;

// Lightning Icon Component
export const LightningIcon: React.FC = () => (
  <IconSvg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </IconSvg>
);

// Spinner Icon Component
export const SpinnerIcon: React.FC = () => (
  <IconSvg $isSpinning viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </IconSvg>
);

// Styled Button Component
const StyledButton = styled.button<{
  $variant: "primary" | "secondary";
  $size: "sm" | "md" | "lg";
  $isLoading: boolean;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  border-radius: 0.375rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  color: white;

  /* Size variants */
  ${(props) => {
    switch (props.$size) {
      case "sm":
        return `
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        `;
      case "lg":
        return `
          padding: 0.75rem 1.5rem;
          font-size: 1.125rem;
        `;
      default:
        return `
          padding: 0.5rem 1rem;
          font-size: 1rem;
        `;
    }
  }}

  /* Color variants */
  ${(props) => {
    switch (props.$variant) {
      case "secondary":
        return `
          background: linear-gradient(to right, #6b7280, #4b5563);
          &:hover {
            background: linear-gradient(to right, #4b5563, #374151);
          }
        `;
      default:
        return `
          background: linear-gradient(to right, #8b5cf6, #2563eb);
          &:hover {
            background: linear-gradient(to right, #7c3aed, #1d4ed8);
          }
        `;
    }
  }}
  
  &:hover {
    transform: translateY(-0.125rem);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

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

  return (
    <StyledButton
      onClick={handleClick}
      disabled={isLoading}
      $variant={variant}
      $size={size}
      $isLoading={isLoading}
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
    </StyledButton>
  );
};

// Export all components as default
export default {
  FrevoAIButton,
  LightningIcon,
  SpinnerIcon,
};
