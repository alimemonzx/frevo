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
  const [jobsPerPage, setJobsPerPage] = useState<number>(20);

  // Load initial state from Chrome storage
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(
        ["enabled", "openAIKey", "minStarRating", "jobsPerPage"],
        (data) => {
          setIsEnabled(data.enabled || false);
          setOpenAIKey(data.openAIKey || "");
          // Use last selected rating or default to 0
          setMinStarRating(
            data.minStarRating !== undefined ? data.minStarRating : 0
          );
          setJobsPerPage(
            data.jobsPerPage !== undefined ? data.jobsPerPage : 20
          );
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

  const handleJobsPerPageChange = (value: number) => {
    setJobsPerPage(value);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.set({ jobsPerPage: value }, () => {
        // Send updated jobs per page to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            try {
              chrome.tabs
                .sendMessage(tabs[0].id, {
                  action: "update-jobs-per-page",
                  jobsPerPage: value,
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

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 w-[700px] animate-fade-in">
      {/* Header with Status */}
      <div className="flex items-center justify-between mb-3">
        <Header FilterIcon={FilterIcon} />
        <StatusCard
          isEnabled={isEnabled}
          isLoading={isLoading}
          isTransitioning={isTransitioning}
          onToggle={toggleFilter}
          LoadingSpinner={LoadingSpinner}
        />
      </div>

      {/* Main Content - Horizontal Layout */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 mb-3">
        <div className="flex gap-4">
          {/* Left Column - Filter Controls */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Filter Controls
            </h3>

            {/* Jobs per page input */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-700 block mb-2">
                Jobs per page
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={jobsPerPage}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 1 && value <= 100) {
                    handleJobsPerPageChange(value);
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="20"
              />
              <p className="text-xs text-gray-600 mt-1">
                Maximum 100 jobs per page
              </p>
            </div>

            {/* Star Rating Slider - Only show when filter is enabled */}
            {isEnabled && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700 flex items-center">
                    <StarIcon className="w-3 h-3 mr-1 text-yellow-500" />
                    Min Rating
                  </label>
                  <span className="text-xs font-semibold text-gray-900">
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
                <p className="text-xs text-gray-600 mt-2">
                  Show projects with {minStarRating.toFixed(1)}+ stars
                </p>
              </div>
            )}
          </div>

          {/* Right Column - AI Settings */}
          <div className="flex-1 border-l border-gray-100 pl-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              AI Assistant
            </h3>
            <OpenAIKeyInput
              openAIKey={openAIKey}
              showKey={showKey}
              onKeyChange={handleOpenAIKeyChange}
              onToggleShowKey={() => setShowKey(!showKey)}
            />
          </div>
        </div>
      </div>

      {/* Info Section */}
      <InfoSection StarIcon={StarIcon} />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
