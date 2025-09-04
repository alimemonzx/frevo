import React, { useState, useEffect } from "react";
import styled from "styled-components";

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  width: 24rem;
  max-width: 90vw;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const CloseButton = styled.button`
  color: #9ca3af;
  transition: color 0.2s ease-in-out;
  border: none;
  background: none;
  cursor: pointer;

  &:hover {
    color: #4b5563;
  }
`;

const CloseIcon = styled.svg`
  width: 1.5rem;
  height: 1.5rem;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div``;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  transition: all 0.2s ease-in-out;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #a855f7;
    border-color: transparent;
  }
`;

const TestButton = styled.button`
  width: 100%;
  background: linear-gradient(to right, #8b5cf6, #2563eb);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: linear-gradient(to right, #7c3aed, #1d4ed8);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AlertBox = styled.div<{ $type: "error" | "success" }>`
  border-radius: 0.375rem;
  padding: 0.75rem;
  border: 1px solid;

  ${(props) =>
    props.$type === "error"
      ? `
    background-color: #fef2f2;
    border-color: #fecaca;
  `
      : `
    background-color: #f0fdf4;
    border-color: #bbf7d0;
  `}
`;

const AlertText = styled.p<{ $type: "error" | "success" }>`
  font-size: 0.875rem;
  margin: 0;

  ${(props) =>
    props.$type === "error"
      ? `
    color: #b91c1c;
  `
      : `
    color: #15803d;
  `}
`;

const ResponseLabel = styled.p`
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  margin-top: 0;
  color: #15803d;
`;

const ResponseText = styled.p`
  font-size: 0.875rem;
  color: #16a34a;
  margin: 0;
`;

interface OpenAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpenAIModal: React.FC<OpenAIModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Load saved API key from storage
      chrome.storage.sync.get(["openai_api_key"], (data) => {
        if (data.openai_api_key) {
          setApiKey(data.openai_api_key);
        }
      });
    }
  }, [isOpen]);

  const saveApiKey = () => {
    chrome.storage.sync.set({ openai_api_key: apiKey }, () => {
      console.log("API key saved");
    });
  };

  const callOpenAI = async () => {
    if (!apiKey.trim()) {
      setError("Please enter your OpenAI API key");
      return;
    }

    setIsLoading(true);
    setError("");
    setResponse("");

    try {
      const apiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: "Hello",
              },
            ],
            max_tokens: 50,
          }),
        }
      );

      if (!apiResponse.ok) {
        throw new Error(`API call failed: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      setResponse(data.choices[0]?.message?.content || "No response received");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Frevo AI Settings</ModalTitle>
          <CloseButton onClick={onClose}>
            <CloseIcon fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </CloseIcon>
          </CloseButton>
        </ModalHeader>

        <FormContainer>
          <InputGroup>
            <Label>OpenAI API Key</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={saveApiKey}
              placeholder="sk-..."
            />
          </InputGroup>

          <TestButton
            onClick={callOpenAI}
            disabled={isLoading || !apiKey.trim()}
          >
            {isLoading ? "Calling OpenAI..." : "Test API Call"}
          </TestButton>

          {error && (
            <AlertBox $type="error">
              <AlertText $type="error">{error}</AlertText>
            </AlertBox>
          )}

          {response && (
            <AlertBox $type="success">
              <ResponseLabel>Response:</ResponseLabel>
              <ResponseText>{response}</ResponseText>
            </AlertBox>
          )}
        </FormContainer>
      </ModalContent>
    </ModalOverlay>
  );
};
