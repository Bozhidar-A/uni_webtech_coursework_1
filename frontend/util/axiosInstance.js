import axios from "axios";

// Create a main Axios instance for your primary API calls
export const instanceAPI = axios.create({
  baseURL: "https://api.example.com",
});

// Create a list to hold the request queue
const refreshAndRetryQueue = [];

// Flag to prevent multiple token refresh requests
let isRefreshing = false;

// Interceptor to add token to requests
instanceAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instanceAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops
    originalRequest._retryCount = originalRequest._retryCount || 0;
    if (originalRequest._retryCount >= 3) {
      // Force logout after 3 failed refresh attempts
      handleLocalStorageKill();
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        originalRequest._retryCount++;

        try {
          // Refresh the access token using a separate API call
          const newAccessToken = await refreshTokenViaAPI();

          // Update local storage with new token
          localStorage.setItem("accessToken", newAccessToken);

          // Update the default headers with the new access token
          instanceAPI.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${newAccessToken}`;

          // Retry all queued requests with the new token
          refreshAndRetryQueue.forEach(({ config, resolve }) => {
            instanceAPI
              .request({
                ...config,
                headers: {
                  ...config.headers,
                  Authorization: `Bearer ${newAccessToken}`,
                },
              })
              .then(resolve);
          });

          // Clear the queue
          refreshAndRetryQueue.length = 0;

          // Retry the original request
          return instanceAPI(originalRequest);
        } catch (refreshError) {
          // If refresh fails, handle logout
          handleLocalStorageKill();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Add the original request to the queue
      return new Promise((resolve) => {
        refreshAndRetryQueue.push({ config: originalRequest, resolve });
      });
    }

    // Return a Promise rejection for non-401 errors
    return Promise.reject(error);
  }
);

// Dedicated function to refresh token via API
async function refreshTokenViaAPI() {
  try {
    // Retrieve the refresh token from storage
    const refreshToken = localStorage.getItem("refreshToken");

    // Make an API call to the refresh token endpoint
    const response = await instanceAPI.post("/refresh", {
      refreshToken: refreshToken,
    });

    // Extract the new access token from the response
    const { accessToken } = response.data;

    if (!accessToken) {
      throw new Error("No access token received");
    }

    return accessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
}

// Logout handling function
function handleLocalStorageKill() {
  // Clear tokens from local storage
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export default instanceAPI;
