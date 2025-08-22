import React, { useState, useEffect } from "react";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
      <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw] shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Frevo AI Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={saveApiKey}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={callOpenAI}
            disabled={isLoading || !apiKey.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-2 px-4 rounded-md font-medium hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? "Calling OpenAI..." : "Test API Call"}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {response && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-green-700 text-sm font-medium mb-1">
                Response:
              </p>
              <p className="text-green-600 text-sm">{response}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
