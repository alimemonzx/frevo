import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { StatusCard } from "./components/StatusCard";
import { OpenAIKeyInput } from "./components/OpenAIKeyInput";
import { InfoSection } from "./components/InfoSection";
import { Footer } from "./components/Footer";
import { FilterIcon, StarIcon, LoadingSpinner } from "./components/Icons";

function App() {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [openAIKey, setOpenAIKey] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);

  // Load initial state from Chrome storage
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(["enabled", "openAIKey"], (data) => {
        setIsEnabled(data.enabled || false);
        setOpenAIKey(data.openAIKey || "");
        setIsLoading(false);
      });
    } else {
      // Fallback for development
      setIsLoading(false);
    }
  }, []);

  const toggleFilter = async () => {
    setIsTransitioning(true);
    const newState = !isEnabled;

    // Add a small delay for smooth animation
    setTimeout(() => {
      setIsEnabled(newState);
      setIsTransitioning(false);
    }, 150);

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.set({ enabled: newState }, () => {
        // Send message to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            try {
              chrome.tabs
                .sendMessage(tabs[0].id, {
                  action: newState ? "enable" : "disable",
                })
                .catch((error) => {
                  console.log("Content script not ready yet:", error.message);
                });
            } catch (error) {
              console.log("Error sending message to content script:", error);
            }
          }
        });
      });
    }
  };

  const handleOpenAIKeyChange = (value: string) => {
    setOpenAIKey(value);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.set({ openAIKey: value });
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 w-80 animate-fade-in">
      <Header FilterIcon={FilterIcon} />

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-4">
        <StatusCard
          isEnabled={isEnabled}
          isLoading={isLoading}
          isTransitioning={isTransitioning}
          onToggle={toggleFilter}
          LoadingSpinner={LoadingSpinner}
        />

        <div className="border-t border-gray-100 pt-6 mt-6">
          <OpenAIKeyInput
            openAIKey={openAIKey}
            showKey={showKey}
            onKeyChange={handleOpenAIKeyChange}
            onToggleShowKey={() => setShowKey(!showKey)}
          />
        </div>
      </div>

      <InfoSection StarIcon={StarIcon} />

      <Footer />
    </div>
  );
}

export default App;
