// Authentication utility functions for Chrome extension
export interface User {
  email: string;
  name: string;
  picture: string;
  id?: string;
  // Additional fields from backend
  createdAt?: string;
  lastLogin?: string;
  usageCount?: number;
}

export interface UserProfile {
  id: number;
  google_id: string;
  email: string;
  name: string;
  picture: string;
  package_type: "basic" | "premium" | "pro";
  subscription_status: "active" | "inactive" | "cancelled";
  created_at: string;
  updated_at: string;
  daily_usage: {
    proposals: {
      used: number;
      limit: number;
      remaining: number;
    };
    user_detail_views: {
      used: number;
      limit: number;
      remaining: number;
    };
  };
}

export interface JobOwnerDetails {
  avatar: string;
  public_name: string;
  username: string;
  owner_id: string;
}

export interface JobOwnerResponse {
  success: boolean;
  job_owner?: JobOwnerDetails;
  usage?: {
    used: number;
    limit: number;
    remaining: number;
  };
  // Error response fields
  error?: string;
  message?: string;
  limit?: number;
}

export interface AuthData {
  authToken: string;
  user: User;
  lastAuthTime: number;
}

/**
 * Check if user is currently authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const result = await chrome.storage.local.get([
      "authToken",
      "lastAuthTime",
    ]);

    if (!result.authToken || !result.lastAuthTime) {
      return false;
    }

    // Check if auth is still valid (less than 24 hours old)
    const authAge = Date.now() - result.lastAuthTime;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (authAge >= maxAge) {
      // Auth expired, clear storage
      await clearAuthData();
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

/**
 * Get current user data from storage
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const result = await chrome.storage.local.get(["user"]);
    return result.user || null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

/**
 * Get auth token from storage
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const result = await chrome.storage.local.get(["authToken"]);
    return result.authToken || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

/**
 * Store authentication data
 */
export const storeAuthData = async (
  authToken: string,
  user: User
): Promise<void> => {
  try {
    await chrome.storage.local.set({
      authToken,
      user,
      lastAuthTime: Date.now(),
    });
    console.log("✅ Auth data stored successfully");
  } catch (error) {
    console.error("Error storing auth data:", error);
    throw error;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await chrome.storage.local.remove(["authToken", "user", "lastAuthTime"]);
    console.log("✅ Auth data cleared successfully");
  } catch (error) {
    console.error("Error clearing auth data:", error);
    throw error;
  }
};

/**
 * Make authenticated API request to backend
 */
export const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const authToken = await getAuthToken();

  if (!authToken) {
    throw new Error("No authentication token available");
  }

  const headers = {
    Authorization: `Bearer ${authToken}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

/**
 * Backend API endpoints
 */
export const API_ENDPOINTS = {
  GOOGLE_SIGNIN: "http://localhost:3000/api/auth/google-signin",
  USER_PROFILE: "http://localhost:3000/api/users/profile",
  JOB_OWNER_DETAILS: "http://localhost:3000/api/users/job-owner-details",
  USAGE_STATS: "http://localhost:3000/api/user/usage",
} as const;

/**
 * Authenticate with backend using Google ID token
 */
export const authenticateWithBackend = async (
  idToken: string
): Promise<{
  token: string;
  user: User;
}> => {
  try {
    console.log("🔄 Authenticating with backend...");

    const response = await fetch(API_ENDPOINTS.GOOGLE_SIGNIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Backend authentication failed: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log("✅ Backend authentication successful");

    return {
      token: result.token || result.accessToken || result.jwt,
      user: result.user,
    };
  } catch (error) {
    console.error("❌ Backend authentication error:", error);
    throw error;
  }
};

/**
 * Fetch user profile from backend
 */
export const fetchUserProfile = async (): Promise<{
  success: boolean;
  user: UserProfile;
}> => {
  try {
    console.log("🔄 Fetching user profile...");

    const response = await makeAuthenticatedRequest(
      API_ENDPOINTS.USER_PROFILE,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch user profile: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log("✅ User profile fetched successfully");

    return result;
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Fetch job owner details from backend
 */
export const fetchJobOwnerDetails = async (
  ownerId: string
): Promise<JobOwnerResponse> => {
  try {
    console.log("🔄 Fetching job owner details for ownerId:", ownerId);

    const response = await makeAuthenticatedRequest(
      API_ENDPOINTS.JOB_OWNER_DETAILS,
      {
        method: "POST",
        body: JSON.stringify({ ownerId }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      // Handle 429 (rate limit) responses specially
      if (response.status === 429) {
        try {
          const errorData = JSON.parse(errorText);
          return {
            success: false,
            error: errorData.error,
            message: errorData.message,
            limit: errorData.limit,
            usage:
              typeof errorData.usage === "number"
                ? {
                    used: errorData.usage,
                    limit: errorData.limit,
                    remaining: 0,
                  }
                : errorData.usage,
          };
        } catch {
          // If JSON parsing fails, return a generic error
          return {
            success: false,
            error: "Rate limit exceeded",
            message:
              "You have reached your daily limit. Please try again later or upgrade your plan.",
            limit: 20,
            usage: { used: 20, limit: 20, remaining: 0 },
          };
        }
      }

      throw new Error(
        `Failed to fetch job owner details: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log("✅ Job owner details fetched successfully");

    return result;
  } catch (error) {
    console.error("❌ Error fetching job owner details:", error);
    throw error;
  }
};
