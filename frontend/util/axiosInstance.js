import axios from "axios";
import { routes } from "./consts";

const API_OBJ = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}:${import.meta.env.VITE_API_PORT}`,
    timeout: 10000 // 10 seconds timeout
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers = [];

// Add a request interceptor
API_OBJ.interceptors.request.use(
    async (config) => {
        const accessToken = localStorage.getItem("accessToken");

        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
API_OBJ.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check for network errors or timeout
        if (axios.isCancel(error) || error.code === 'ECONNABORTED') {
            console.error('Request timeout or network error');
            return Promise.reject(error);
        }

        // If the error is due to an unauthorized request and we haven't already tried to refresh
        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
            // Prevent infinite refresh loops
            if (originalRequest._refreshAttempted) {
                // If refresh has already been attempted, force logout
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("username");
                window.location.href = '/login';
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // If a refresh is already in progress, wait for it
                return new Promise((resolve, reject) => {
                    refreshSubscribers.push({
                        resolve: (newToken) => {
                            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                            originalRequest._refreshAttempted = true;
                            resolve(API_OBJ(originalRequest));
                        },
                        reject
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");
                const username = localStorage.getItem("username");

                // Call your backend refresh token endpoint with timeout
                const response = await API_OBJ.post(`${routes.refreshToken}`, {
                    refreshToken,
                    username  // Pass username to ensure context
                }, {
                    timeout: 5000 // 5 seconds timeout for refresh
                });

                const {
                    accessToken,
                    refreshToken: newRefreshToken = refreshToken,
                    username: returnedUsername = username
                } = response.data;

                // Update tokens in local storage - use existing values if not provided
                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", newRefreshToken);
                localStorage.setItem("username", returnedUsername);

                // Update original request with new token
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                originalRequest._refreshAttempted = true;

                // Resolve all waiting requests with new token
                refreshSubscribers.forEach(({ resolve }) => resolve(accessToken));
                refreshSubscribers = [];

                return API_OBJ(originalRequest);
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);

                // Reject all waiting requests
                refreshSubscribers.forEach(({ reject }) => reject(refreshError));
                refreshSubscribers = [];

                // Clear tokens and redirect to login
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("username");
                window.location.href = '/login';

                // Throw error to be caught by the caller
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default API_OBJ;