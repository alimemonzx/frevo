/**
 * Configuration utility for managing environment-based settings
 */

// Get the base URL from environment variables
export const getBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!baseUrl) {
    // Removed logger to avoid circular dependency during module initialization
    console.warn(
      "VITE_API_BASE_URL not found in environment variables, falling back to production URL"
    );
    return "https://frevo.app";
  }

  return baseUrl;
};

// Get the current environment
export const getEnvironment = (): string => {
  return import.meta.env.VITE_APP_ENV || "production";
};

// Check if we're in development mode
export const isDevelopment = (): boolean => {
  return getEnvironment() === "development";
};

// Check if we're in production mode
export const isProduction = (): boolean => {
  return getEnvironment() === "production";
};

// API endpoints configuration
export const API_ENDPOINTS = {
  GOOGLE_SIGNIN: `${getBaseUrl()}/api/auth/google-signin`,
  USER_PROFILE: `${getBaseUrl()}/api/users/profile`,
  JOB_OWNER_DETAILS: `${getBaseUrl()}/api/users/job-owner-details`,
  USAGE_STATS: `${getBaseUrl()}/api/user/usage`,
  PROPOSAL_GENERATE: `${getBaseUrl()}/api/proposals/generate`,
  FREELANCER_PROFILE: `${getBaseUrl()}/api/users/freelancer-profile`,
} as const;

// Log configuration on startup (only in development)
// Moved to runtime to avoid circular dependency
if (isDevelopment()) {
  console.log("🔧 Configuration loaded:", {
    baseUrl: getBaseUrl(),
    environment: getEnvironment(),
    endpoints: API_ENDPOINTS,
  });
}
