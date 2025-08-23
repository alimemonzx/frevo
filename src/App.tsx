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
  const [minStarRating, setMinStarRating] = useState<number>(0);

  // Load initial state from Chrome storage
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(
        ["enabled", "openAIKey", "minStarRating"],
        (data) => {
          setIsEnabled(data.enabled || false);
          setOpenAIKey(data.openAIKey || "");
          setMinStarRating(data.minStarRating || 0);
          setIsLoading(false);
        }
      );
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
                  minStarRating: minStarRating,
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

  const handleStarRatingChange = (value: number) => {
    setMinStarRating(value);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.set({ minStarRating: value }, () => {
        // Send updated rating to content script if filter is enabled
        if (isEnabled) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              try {
                chrome.tabs
                  .sendMessage(tabs[0].id, {
                    action: "update-rating",
                    minStarRating: value,
                  })
                  .catch((error) => {
                    console.log("Content script not ready yet:", error.message);
                  });
              } catch (error) {
                console.log("Error sending message to content script:", error);
              }
            }
          });
        }
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

        {/* Star Rating Slider - Only show when filter is enabled */}
        {isEnabled && (
          <div className="border-t border-gray-100 pt-6 mt-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <StarIcon className="w-4 h-4 mr-2 text-yellow-500" />
                  Minimum Star Rating
                </label>
                <span className="text-sm font-semibold text-gray-900">
                  {minStarRating.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={minStarRating}
                onChange={(e) =>
                  handleStarRatingChange(parseFloat(e.target.value))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${
                    (minStarRating / 5) * 100
                  }%, #e5e7eb ${(minStarRating / 5) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.0</span>
                <span>5.0</span>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Only show projects with {minStarRating.toFixed(1)}+ star ratings
            </p>
          </div>
        )}

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
