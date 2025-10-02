// src/components/FrevoAIButton.tsx
import React, { useState } from "react";
import styles from "./FrevoAIButton.module.css";
import { API_ENDPOINTS } from "../../utils/config";
import { makeAuthenticatedRequest } from "../../utils/auth";
import logger from "../../utils/logger";

// TypeScript interfaces for conversational proposal generation
interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ProposalGenerateRequest {
  jobTitle: string;
  jobDescription: string;
  jobRequirements?: string;
  budget?: string;
  timeline?: string;
  conversationHistory?: ConversationMessage[];
}

interface ProposalGenerateResponse {
  success: boolean;
  type: "question" | "proposal";
  message: string;
  conversationHistory: ConversationMessage[];
  proposal?: {
    id: number;
    text: string;
    job_title: string;
    created_at: string;
  };
  usage: {
    used: number;
    limit: number;
    remaining: number;
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
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >([]);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);

  // Generate proposal function using conversational backend
  const generateProposal = async (userMessage?: string): Promise<void> => {
    if (!jobTitle || !jobDescription) {
      alert(
        "Job title and description are required. Please refresh the page and try again."
      );
      throw new Error("Missing required job information");
    }

    try {
      // Prepare conversation history for API request
      const currentHistory = [...conversationHistory];

      // If user provided a message, add it to the conversation
      if (userMessage) {
        currentHistory.push({ role: "user", content: userMessage });
      }

      const requestBody: ProposalGenerateRequest = {
        jobTitle,
        jobDescription,
        ...(jobRequirements && { jobRequirements }),
        ...(budget && { budget }),
        ...(timeline && { timeline }),
        conversationHistory: currentHistory,
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

      if (data.success) {
        // Update conversation history
        setConversationHistory(data.conversationHistory);

        // Update messages for display
        setMessages(data.conversationHistory);

        if (data.type === "proposal" && data.proposal) {
          // Final proposal generated
          setIsGeneratingProposal(false);

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
        } else if (data.type === "question") {
          // AI is asking questions, continue conversation
          setIsGeneratingProposal(true);
          logger.log("🤖 AI is asking questions, waiting for user response");
        }
      } else {
        throw new Error("Failed to generate proposal");
      }
    } catch (error) {
      logger.error("Error calling proposal generation API:", error);
      setIsGeneratingProposal(false);

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

  const handleToggleSidebar = () => {
    logger.log("🚀 Frevo floating button clicked - toggling sidebar");
    setIsOpen((prev) => !prev);
  };

  const handleSendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    setInputText("");
    setIsLoading(true);

    try {
      // Start or continue the conversational proposal generation
      await generateProposal(trimmed);
    } catch {
      // Add error message to conversation
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "There was an error generating the proposal. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartProposal = async () => {
    setIsLoading(true);
    setIsGeneratingProposal(true);

    try {
      // Start the conversational proposal generation without user message
      await generateProposal();
    } catch {
      setIsGeneratingProposal(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "There was an error starting the proposal generation. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Removed explicit generate button; Send will trigger generation

  const buttonClasses = [
    styles.frevoButton,
    styles[variant],
    styles[size],
  ].join(" ");

  return (
    <>
      {/* Floating trigger button */}
      <div className={styles.floatingContainer}>
        <button
          className={buttonClasses}
          onClick={handleToggleSidebar}
          disabled={isLoading}
          aria-label="Toggle Frevo AI chat sidebar"
        >
          {isLoading ? (
            <>
              <SpinnerIcon />
              <span>Working...</span>
            </>
          ) : (
            <>
              <LightningIcon />
              <span>Frevo</span>
            </>
          )}
        </button>
      </div>

      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
      />

      {/* Slide-in sidebar */}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Frevo AI chat"
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>Frevo AI</div>
          <button
            className={styles.closeBtn}
            onClick={() => setIsOpen(false)}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>
        <div className={styles.chatBody}>
          <div className={styles.chatMessages}>
            {messages.length === 0 && !isGeneratingProposal && (
              <div className={styles.welcomeMessage}>
                <p>👋 Hi! I'm Frevo AI, your proposal assistant.</p>
                <p>
                  I'll ask you a few questions about this job to create a
                  personalized proposal.
                </p>
                <button
                  className={styles.startButton}
                  onClick={handleStartProposal}
                  disabled={isLoading}
                >
                  {isLoading ? "Starting..." : "Start Proposal Generation"}
                </button>
              </div>
            )}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`${styles.message} ${
                  m.role === "user"
                    ? styles.messageUser
                    : styles.messageAssistant
                }`}
              >
                {m.content}
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.messageAssistant}`}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>
        </div>
        {messages.length > 0 && (
          <div className={styles.chatInput}>
            <input
              className={styles.inputField}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                isGeneratingProposal
                  ? "Answer the AI's questions..."
                  : "Type your message..."
              }
              disabled={isLoading}
            />
            <button
              className={styles.actionButton}
              onClick={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
            >
              Send
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

// Export all components as default
export default {
  FrevoAIButton,
  LightningIcon,
  SpinnerIcon,
};
