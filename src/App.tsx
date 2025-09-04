import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Header } from "./components/Header";
import { StatusCard } from "./components/StatusCard";
import { OpenAIKeyInput } from "./components/OpenAIKeyInput";
import { InfoSection } from "./components/InfoSection";
import { Footer } from "./components/Footer";
import { FilterIcon, StarIcon, LoadingSpinner } from "./components/Icons";
import GoogleAuth from "./components/GoogleAuth";
import UserProfile from "./components/UserProfile";

// User type
interface User {
  email: string;
  name: string;
  picture: string;
}

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Styled Components
const AppContainer = styled.div`
  background: linear-gradient(to bottom right, #eff6ff, #ffffff, #eef2ff);
  padding: 1rem;
  width: 700px;
  animation: ${fadeIn} 0.3s ease-in-out;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const MainContent = styled.div`
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid #f3f4f6;
  padding: 1rem;
  margin-bottom: 0.75rem;
`;

const ContentGrid = styled.div`
  display: flex;
  gap: 1rem;
`;

const LeftColumn = styled.div`
  flex: 1;
`;

const RightColumn = styled.div`
  flex: 1;
  border-left: 1px solid #f3f4f6;
  padding-left: 1rem;
`;

const SectionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
  margin-top: 0;
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

const InputHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
`;

const ResetButton = styled.button`
  font-size: 0.75rem;
  color: #2563eb;
  font-weight: 500;
  border: none;
  background: none;
  cursor: pointer;

  &:hover {
    color: #1d4ed8;
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const NumberInput = styled.input`
  flex: 1;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  transition: all 0.2s ease-in-out;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #3b82f6;
    border-color: transparent;
  }
`;

const SaveButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  background-color: #16a34a;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease-in-out;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #15803d;
  }
`;

const HelpText = styled.p`
  font-size: 0.75rem;
  color: #4b5563;
  margin-top: 0.5rem;
  margin-bottom: 0;
`;

const RatingContainer = styled.div``;

const RatingHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const RatingLabel = styled.label`
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
`;

const RatingValue = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #111827;
`;

const RangeInput = styled.input`
  width: 100%;
  height: 0.5rem;
  border-radius: 0.5rem;
  appearance: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fbbf24;
    cursor: pointer;
    border: 2px solid #f59e0b;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease-in-out;
  }

  &::-webkit-slider-thumb:hover {
    background: #f59e0b;
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const RangeLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const RatingDescription = styled.p`
  font-size: 0.75rem;
  color: #4b5563;
  margin-top: 0.5rem;
  margin-bottom: 0;
`;

const DisabledMessage = styled.div`
  padding: 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  text-align: center;
`;

const DisabledText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
`;

const EnableText = styled.p`
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
`;

function App() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Extension state
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [openAIKey, setOpenAIKey] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [minStarRating, setMinStarRating] = useState<number>(0);
  const [jobsPerPage, setJobsPerPage] = useState<number>(20);

  // Load initial state from Chrome storage
  useEffect(() => {
    const loadData = async () => {
      if (typeof chrome !== "undefined" && chrome.storage) {
        // Load authentication state first
        chrome.storage.sync.get(["user"], (authData) => {
          if (authData.user) {
            setUser(authData.user);
          }
          setIsAuthLoading(false);

          // Only load extension settings if user is authenticated
          if (authData.user) {
            // Load sync settings (filter, API key, etc.)
            chrome.storage.sync.get(
              ["enabled", "openAIKey", "minStarRating"],
              (syncData) => {
                setIsEnabled(syncData.enabled || false);
                setOpenAIKey(syncData.openAIKey || "");
                setMinStarRating(
                  syncData.minStarRating !== undefined
                    ? syncData.minStarRating
                    : 0
                );

                // Load local settings (pagination) - default to 20 now
                chrome.storage.local.get(["jobsPerPage"], (localData) => {
                  setJobsPerPage(
                    localData.jobsPerPage !== undefined
                      ? localData.jobsPerPage
                      : 20
                  );
                  setIsLoading(false);
                });
              }
            );
          } else {
            setIsLoading(false);
          }
        });
      } else {
        // Fallback for development
        setIsAuthLoading(false);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleFilter = async () => {
    setIsTransitioning(true);
    const newState = !isEnabled;

    if (typeof chrome !== "undefined" && chrome.storage) {
      if (newState) {
        // Enabling the filter - save state and reload page
        chrome.storage.sync.set({ enabled: newState }, () => {
          // Send message to content script and reload
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              try {
                chrome.tabs
                  .sendMessage(tabs[0].id, {
                    action: "enable",
                    minStarRating: minStarRating,
                  })
                  .catch((error) => {
                    console.log("Content script not ready yet:", error.message);
                  })
                  .finally(() => {
                    // Reload page after enabling
                    setTimeout(() => {
                      chrome.tabs.reload(tabs[0].id!);
                      window.close();
                    }, 200);
                  });
              } catch (error) {
                console.log("Error sending message to content script:", error);
                // Reload even if message fails
                setTimeout(() => {
                  chrome.tabs.reload(tabs[0].id!);
                  window.close();
                }, 200);
              }
            }
          });
        });
      } else {
        // Disabling the filter - clear everything and reload
        await clearAllDataAndReload();
      }
    }
  };

  const clearAllDataAndReload = async () => {
    try {
      // Clear extension storage but preserve OpenAI key
      if (typeof chrome !== "undefined" && chrome.storage) {
        // Preserve the OpenAI key before clearing
        const currentOpenAIKey = await new Promise<string>((resolve) => {
          chrome.storage.sync.get(["openAIKey"], (data) => {
            resolve(data.openAIKey || "");
          });
        });

        // Clear sync storage except OpenAI key
        await new Promise<void>((resolve) => {
          chrome.storage.sync.clear(() => {
            // Restore the OpenAI key
            chrome.storage.sync.set({ openAIKey: currentOpenAIKey }, () => {
              console.log("✅ Sync storage cleared (OpenAI key preserved)");
              resolve();
            });
          });
        });

        // Clear local storage
        await new Promise<void>((resolve) => {
          chrome.storage.local.clear(() => {
            console.log("✅ Local storage cleared");
            resolve();
          });
        });

        // Reset local state (but keep OpenAI key)
        setIsEnabled(false);
        setMinStarRating(0);
        setJobsPerPage(20);
        // Don't reset the OpenAI key - keep it as is
        setIsTransitioning(false);

        // Send disable message to content script and reload page
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            try {
              chrome.tabs
                .sendMessage(tabs[0].id, {
                  action: "disable-and-reload",
                })
                .catch((error) => {
                  console.log(
                    "Content script not ready, reloading anyway:",
                    error.message
                  );
                })
                .finally(() => {
                  // Reload the page to ensure clean state
                  setTimeout(() => {
                    chrome.tabs.reload(tabs[0].id!);
                    window.close(); // Close the popup
                  }, 200);
                });
            } catch (error) {
              console.log("Error sending message, reloading anyway:", error);
              // Reload even if message fails
              setTimeout(() => {
                chrome.tabs.reload(tabs[0].id!);
                window.close();
              }, 200);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error clearing data:", error);
      setIsTransitioning(false);
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

  // Authentication functions
  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.set({ user: userData }, () => {
        console.log("✅ User authenticated and saved");
      });
    }
  };

  const handleAuthError = (error: string) => {
    console.error("❌ Authentication error:", error);
    // You could show a toast or error message here
  };

  const handleLogout = async () => {
    setUser(null);

    if (typeof chrome !== "undefined") {
      // Clear Chrome identity token first
      if (chrome.identity) {
        try {
          // Get current token and remove it
          chrome.identity.getAuthToken({ interactive: false }, (token) => {
            if (token) {
              chrome.identity.removeCachedAuthToken({ token }, () => {
                console.log("✅ Auth token cleared");
              });
            }
          });
        } catch (error) {
          console.log("Note: Could not clear auth token:", error);
        }
      }

      if (chrome.storage) {
        // Remove user from storage but keep OpenAI key
        const currentOpenAIKey = await new Promise<string>((resolve) => {
          chrome.storage.sync.get(["openAIKey"], (data) => {
            resolve(data.openAIKey || "");
          });
        });

        chrome.storage.sync.clear(() => {
          // Restore only the OpenAI key
          chrome.storage.sync.set({ openAIKey: currentOpenAIKey }, () => {
            console.log("✅ User logged out, OpenAI key preserved");
          });
        });

        // Clear local storage
        chrome.storage.local.clear(() => {
          console.log("✅ Local storage cleared");
        });

        // Reset extension state
        setIsEnabled(false);
        setMinStarRating(0);
        setJobsPerPage(20);

        // Reload the current tab to clean up any injected content
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.reload(tabs[0].id);
            window.close();
          }
        });
      }
    }
  };

  // Show loading screen while checking authentication
  if (isAuthLoading) {
    return (
      <AppContainer>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "200px",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <LoadingSpinner />
          <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Loading...
          </span>
        </div>
      </AppContainer>
    );
  }

  // Show authentication screen if not logged in
  if (!user) {
    return (
      <AppContainer>
        <GoogleAuth
          onAuthSuccess={handleAuthSuccess}
          onAuthError={handleAuthError}
        />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      {/* User Profile */}
      <UserProfile user={user} onLogout={handleLogout} />

      {/* Header with Status */}
      <HeaderSection>
        <Header FilterIcon={FilterIcon} />
        <StatusCard
          isEnabled={isEnabled}
          isLoading={isLoading}
          isTransitioning={isTransitioning}
          onToggle={toggleFilter}
          LoadingSpinner={LoadingSpinner}
        />
      </HeaderSection>

      {/* Main Content - Horizontal Layout */}
      <MainContent>
        <ContentGrid>
          {/* Left Column - Filter Controls */}
          <LeftColumn>
            <SectionTitle>Filter Controls</SectionTitle>

            {/* Jobs per page input - Always visible */}
            <InputGroup>
              <InputHeader>
                <Label>Jobs per page</Label>
                <ResetButton onClick={resetPagination}>Reset to 20</ResetButton>
              </InputHeader>
              <InputRow>
                <NumberInput
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
                  placeholder="20"
                />
                <SaveButton
                  onClick={() => handleJobsPerPageChange(jobsPerPage)}
                >
                  <span>💾</span>
                  Save
                </SaveButton>
              </InputRow>

              <HelpText>
                Click <strong>Save</strong> or press <strong>Enter</strong> to
                apply changes and refresh the page automatically.
              </HelpText>
            </InputGroup>

            {/* Star Rating Slider - Only show when filter is enabled */}
            {isEnabled ? (
              <RatingContainer>
                <RatingHeader>
                  <RatingLabel>
                    <StarIcon />
                    <span style={{ marginLeft: "0.25rem", color: "#f59e0b" }}>
                      Min Rating
                    </span>
                  </RatingLabel>
                  <RatingValue>{minStarRating.toFixed(1)}</RatingValue>
                </RatingHeader>
                <RangeInput
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={minStarRating}
                  onChange={(e) =>
                    handleStarRatingChange(parseFloat(e.target.value))
                  }
                  style={{
                    background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${
                      (minStarRating / 5) * 100
                    }%, #e5e7eb ${(minStarRating / 5) * 100}%, #e5e7eb 100%)`,
                  }}
                />
                <RangeLabels>
                  <span>0.0</span>
                  <span>5.0</span>
                </RangeLabels>
                <RatingDescription>
                  Show projects with {minStarRating.toFixed(1)}+ stars
                </RatingDescription>
              </RatingContainer>
            ) : (
              <DisabledMessage>
                <DisabledText>🔒 Star Rating Filter Disabled</DisabledText>
                <EnableText>
                  Turn on the extension to filter projects by star rating
                </EnableText>
              </DisabledMessage>
            )}
          </LeftColumn>

          {/* Right Column - AI Settings */}
          <RightColumn>
            <SectionTitle>AI Assistant</SectionTitle>
            {isEnabled ? (
              <OpenAIKeyInput
                openAIKey={openAIKey}
                showKey={showKey}
                onKeyChange={handleOpenAIKeyChange}
                onToggleShowKey={() => setShowKey(!showKey)}
              />
            ) : (
              <DisabledMessage>
                <DisabledText>🤖 AI Assistant Disabled</DisabledText>
                <EnableText>
                  Turn on the extension to use AI proposal generation
                </EnableText>
              </DisabledMessage>
            )}
          </RightColumn>
        </ContentGrid>
      </MainContent>

      {/* Info Section */}
      {isEnabled && <InfoSection StarIcon={StarIcon} />}

      {/* Footer */}
      <Footer />
    </AppContainer>
  );
}

export default App;
