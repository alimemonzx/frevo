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
      // Load sync settings (filter, API key, etc.)
      chrome.storage.sync.get(
        ["enabled", "openAIKey", "minStarRating"],
        (syncData) => {
          setIsEnabled(syncData.enabled || false);
          setOpenAIKey(syncData.openAIKey || "");
          setMinStarRating(
            syncData.minStarRating !== undefined ? syncData.minStarRating : 0
          );

          // Load local settings (pagination) - default to 20 now
          chrome.storage.local.get(["jobsPerPage"], (localData) => {
            setJobsPerPage(
              localData.jobsPerPage !== undefined ? localData.jobsPerPage : 20
            );
            setIsLoading(false);
          });
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

  // Fixed - Proper storage verification and refresh timing
  const handleJobsPerPageChange = async (value: number) => {
    console.log(`🎯 User wants to set pagination to: ${value}`);

    if (typeof chrome !== "undefined" && chrome.storage) {
      try {
        // Step 1: Update local state immediately
        setJobsPerPage(value);

        // Step 2: Use Promise to ensure storage write completes
        await new Promise<void>((resolve, reject) => {
          chrome.storage.local.set({ jobsPerPage: value }, () => {
            if (chrome.runtime.lastError) {
              console.error("❌ Storage error:", chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            } else {
              console.log(`✅ Storage write completed: ${value}`);
              resolve();
            }
          });
        });

        // Step 3: Verify the value was actually stored
        const verification = await new Promise<number>((resolve) => {
          chrome.storage.local.get(["jobsPerPage"], (result) => {
            const storedValue = result.jobsPerPage;
            console.log(`🔍 Verification read: ${storedValue}`);
            resolve(storedValue);
          });
        });

        if (verification === value) {
          console.log(`✅ Verification successful: ${verification}`);

          // Step 4: Send message to content script to update injected script
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(
                tabs[0].id,
                {
                  action: "update-pagination",
                  jobsPerPage: value,
                },
                (response) => {
                  console.log(
                    `📤 Message sent to content script: ${value}`,
                    response
                  );

                  // Step 5: Wait a moment for the injected script to receive the update
                  setTimeout(() => {
                    console.log(
                      `🔄 Refreshing page with new pagination: ${value}`
                    );
                    chrome.tabs.reload(tabs[0].id!);
                    window.close();
                  }, 300); // Increased delay to ensure message is processed
                }
              );
            }
          });
        } else {
          console.error(
            `❌ Verification failed. Expected: ${value}, Got: ${verification}`
          );
          throw new Error("Storage verification failed");
        }
      } catch (error) {
        console.error("❌ Error updating pagination:", error);
        alert("Failed to update pagination. Please try again.");
      }
    }
  };

  const resetPagination = async () => {
    const defaultValue = 20;
    console.log(`🔄 Resetting pagination to default: ${defaultValue}`);

    try {
      await handleJobsPerPageChange(defaultValue);
    } catch (error) {
      console.error("❌ Error resetting pagination:", error);
      alert("Failed to reset pagination. Please try again.");
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700">
                  Jobs per page
                </label>
                <button
                  onClick={resetPagination}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Reset to 20
                </button>
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={jobsPerPage}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= 100) {
                      setJobsPerPage(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Save and refresh on Enter key
                    if (e.key === "Enter") {
                      if (jobsPerPage >= 1 && jobsPerPage <= 100) {
                        handleJobsPerPageChange(jobsPerPage);
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="20"
                />
                <button
                  onClick={() => handleJobsPerPageChange(jobsPerPage)}
                  className="px-4 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>💾</span>
                  Save
                </button>
              </div>

              <p className="text-xs text-gray-600 mt-2">
                Click <strong>Save</strong> or press <strong>Enter</strong> to
                apply changes and refresh the page automatically.
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
