// Authentication utility functions for Chrome extension
import { API_ENDPOINTS } from "./config";
import logger from "./logger";

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
  package_type: "basic" | "plus" | "premium";
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
    logger.error("Error checking authentication:", error);
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
    logger.error("Error getting current user:", error);
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
    logger.error("Error getting auth token:", error);
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
    logger.log("✅ Auth data stored successfully");
  } catch (error) {
    logger.error("Error storing auth data:", error);
    throw error;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await chrome.storage.local.remove(["authToken", "user", "lastAuthTime"]);
    logger.log("✅ Auth data cleared successfully");
  } catch (error) {
    logger.error("Error clearing auth data:", error);
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
 * Authenticate with backend using Google ID token
 */
export const authenticateWithBackend = async (
  idToken: string
): Promise<{
  token: string;
  user: User;
}> => {
  try {
    logger.log("🔄 Authenticating with backend...");

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
    logger.log("✅ Backend authentication successful");

    return {
      token: result.token || result.accessToken || result.jwt,
      user: result.user,
    };
  } catch (error) {
    logger.error("❌ Backend authentication error:", error);
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
    logger.log("🔄 Fetching user profile...");

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
    logger.log("✅ User profile fetched successfully");

    return result;
  } catch (error) {
    logger.error("❌ Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Fetch job owner details from backend with caching
 */
export const fetchJobOwnerDetails = async (
  ownerId: string,
  jobId?: string
): Promise<JobOwnerResponse> => {
  try {
    // If jobId is provided, check cache first
    if (jobId) {
      const cachedData = await getCachedJobOwnerDetails(jobId, ownerId);
      if (cachedData) {
        logger.log("✅ Using cached job owner details for job:", jobId);
        logger.log("💰 Saved API call - using local cache");
        return {
          success: true,
          job_owner: cachedData.job_owner,
          usage: cachedData.usage,
        };
      } else {
        logger.log("🔄 No cache found for job:", jobId, "- making API call");
      }
    }

    logger.log("🔄 Fetching job owner details for ownerId:", ownerId);

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
    logger.log("✅ Job owner details fetched successfully");

    // Cache the result if jobId is provided and request was successful
    if (jobId && result.success && result.job_owner && result.usage) {
      logger.log("💾 Caching job owner details for future use");
      await cacheJobOwnerDetails(
        jobId,
        ownerId,
        result.job_owner,
        result.usage
      );
    }

    return result;
  } catch (error) {
    logger.error("❌ Error fetching job owner details:", error);
    throw error;
  }
};

/**
 * Check if freelancer profile has already been saved
 */
export const isFreelancerProfileSaved = async (): Promise<boolean> => {
  try {
    const result = await chrome.storage.local.get(["freelancerProfileSaved"]);
    return result.freelancerProfileSaved === true;
  } catch (error) {
    logger.error("Error checking freelancer profile save status:", error);
    return false;
  }
};

/**
 * Mark freelancer profile as saved
 */
export const markFreelancerProfileSaved = async (): Promise<void> => {
  try {
    await chrome.storage.local.set({
      freelancerProfileSaved: true,
      freelancerProfileSavedAt: Date.now(),
    });
    logger.log("✅ Freelancer profile marked as saved");
  } catch (error) {
    logger.error("Error marking freelancer profile as saved:", error);
    throw error;
  }
};

/**
 * Save freelancer profile data to backend
 */
export const saveFreelancerProfile = async (profileData: {
  role: string;
  username: string;
  email: string;
  city: string;
  country: string;
  name: string;
  description?: string;
}): Promise<{ success: boolean; message?: string }> => {
  try {
    logger.log("🔄 Saving freelancer profile...", profileData);

    const response = await makeAuthenticatedRequest(
      API_ENDPOINTS.FREELANCER_PROFILE,
      {
        method: "POST",
        body: JSON.stringify(profileData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      // Handle 409 - Profile already exists (this is not really an error)
      if (response.status === 409) {
        logger.log("ℹ️ Freelancer profile already exists, marking as saved");
        await markFreelancerProfileSaved();
        return { success: true, message: "Profile already exists" };
      }

      throw new Error(
        `Failed to save freelancer profile: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    logger.log("✅ Freelancer profile saved successfully");

    // Mark as saved in storage
    await markFreelancerProfileSaved();

    return result;
  } catch (error) {
    logger.error("❌ Error saving freelancer profile:", error);
    throw error;
  }
};

/**
 * Cache management for job owner details
 */
export interface CachedJobOwnerDetails {
  job_owner: JobOwnerDetails;
  usage: {
    used: number;
    limit: number;
    remaining: number;
  };
  cached_at: number;
  job_id: string;
  owner_id: string;
}

/**
 * Check if cache should be cleared (daily reset)
 */
export const shouldClearJobOwnerCache = async (): Promise<boolean> => {
  try {
    const result = await chrome.storage.local.get(["lastCacheClearDate"]);
    const lastClearDate = result.lastCacheClearDate;
    const today = new Date().toDateString();

    if (!lastClearDate || lastClearDate !== today) {
      return true;
    }
    return false;
  } catch (error) {
    logger.error("Error checking cache clear date:", error);
    return true; // Clear cache on error to be safe
  }
};

/**
 * Clear job owner cache and update clear date
 */
export const clearJobOwnerCache = async (): Promise<void> => {
  try {
    await chrome.storage.local.remove(["jobOwnerCache"]);
    await chrome.storage.local.set({
      lastCacheClearDate: new Date().toDateString(),
    });
    logger.log("✅ Job owner cache cleared for new day");
  } catch (error) {
    logger.error("Error clearing job owner cache:", error);
    throw error;
  }
};

/**
 * Get cached job owner details
 */
export const getCachedJobOwnerDetails = async (
  jobId: string,
  ownerId: string
): Promise<CachedJobOwnerDetails | null> => {
  try {
    // Check if cache should be cleared first
    if (await shouldClearJobOwnerCache()) {
      await clearJobOwnerCache();
      return null;
    }

    const result = await chrome.storage.local.get(["jobOwnerCache"]);
    const cache = result.jobOwnerCache || {};
    const cacheKey = `${jobId}_${ownerId}`;

    const cachedData = cache[cacheKey];
    if (cachedData) {
      logger.log("✅ Found cached job owner details for:", cacheKey);
      logger.log(
        "📊 Cache entry age:",
        Math.round((Date.now() - cachedData.cached_at) / 1000),
        "seconds"
      );
      return cachedData;
    }

    return null;
  } catch (error) {
    logger.error("Error getting cached job owner details:", error);
    return null;
  }
};

/**
 * Cache job owner details
 */
export const cacheJobOwnerDetails = async (
  jobId: string,
  ownerId: string,
  jobOwner: JobOwnerDetails,
  usage: { used: number; limit: number; remaining: number }
): Promise<void> => {
  try {
    const result = await chrome.storage.local.get(["jobOwnerCache"]);
    const cache = result.jobOwnerCache || {};
    const cacheKey = `${jobId}_${ownerId}`;

    cache[cacheKey] = {
      job_owner: jobOwner,
      usage: usage,
      cached_at: Date.now(),
      job_id: jobId,
      owner_id: ownerId,
    };

    await chrome.storage.local.set({ jobOwnerCache: cache });
    logger.log("✅ Job owner details cached for:", cacheKey);
  } catch (error) {
    logger.error("Error caching job owner details:", error);
    // Don't throw error as caching failure shouldn't break the main flow
  }
};

/**
 * Get cache statistics
 */
export const getJobOwnerCacheStats = async (): Promise<{
  totalEntries: number;
  lastClearDate: string | null;
  cacheSize: number;
}> => {
  try {
    const result = await chrome.storage.local.get([
      "jobOwnerCache",
      "lastCacheClearDate",
    ]);
    const cache = result.jobOwnerCache || {};
    const totalEntries = Object.keys(cache).length;
    const cacheSize = JSON.stringify(cache).length;

    return {
      totalEntries,
      lastClearDate: result.lastCacheClearDate || null,
      cacheSize,
    };
  } catch (error) {
    logger.error("Error getting cache stats:", error);
    return {
      totalEntries: 0,
      lastClearDate: null,
      cacheSize: 0,
    };
  }
};

/**
 * Manually clear job owner cache (for debugging or manual reset)
 */
export const manualClearJobOwnerCache = async (): Promise<void> => {
  try {
    await chrome.storage.local.remove(["jobOwnerCache", "lastCacheClearDate"]);
    logger.log("✅ Job owner cache manually cleared");
  } catch (error) {
    logger.error("Error manually clearing job owner cache:", error);
    throw error;
  }
};

/**
 * Get all cached job owner details (for debugging)
 */
export const getAllCachedJobOwnerDetails = async (): Promise<
  Record<string, CachedJobOwnerDetails>
> => {
  try {
    const result = await chrome.storage.local.get(["jobOwnerCache"]);
    return result.jobOwnerCache || {};
  } catch (error) {
    logger.error("Error getting all cached job owner details:", error);
    return {};
  }
};

/**
 * Automatically enable the extension after successful authentication
 */
export const enableExtensionAfterLogin = async (): Promise<void> => {
  try {
    await chrome.storage.sync.set({ enabled: true });
    logger.log("✅ Extension automatically enabled after login");
    logger.log("🎉 Extension is now active! You can start using all features.");
  } catch (error) {
    logger.error("❌ Error enabling extension after login:", error);
    throw error;
  }
};
