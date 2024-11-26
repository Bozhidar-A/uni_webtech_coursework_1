import { createContext, useContext, useEffect, useState, useCallback } from "react";
import API_OBJ from "../../util/axiosInstance";
import { routes } from "../../util/consts";
import FadeLoader from "react-spinners/FadeLoader";
import { useNavigate } from "react-router-dom";
import "../css/Spinner.css";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        isLoading: true,
        accessToken: localStorage.getItem("accessToken"),
        refreshToken: localStorage.getItem("refreshToken"),
        username: localStorage.getItem("username"),
    });

    const HandleLogout = useCallback(() => {
        // Remove tokens from local storage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("username");

        // Reset auth state
        setAuthState({
            isAuthenticated: false,
            isLoading: false,
            accessToken: null,
            refreshToken: null,
            username: null
        });

        // Redirect to login page
        navigate('/login');
    }, [navigate]);

    const HandleLogin = async (username, password) => {
        try {
            const response = await API_OBJ.post(routes.login, {
                username,
                password
            });

            const { accessToken, refreshToken, username: returnedUsername } = response.data;

            // Update local storage
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("username", returnedUsername);

            // Update auth state
            setAuthState({
                isAuthenticated: true,
                isLoading: false,
                accessToken,
                refreshToken,
                username: returnedUsername
            });

            return true;
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    useEffect(() => {
        // Function to check and validate authentication
        const verifyAuthentication = async () => {
            try {
                // If no tokens, immediately stop loading
                if (!authState.accessToken && !authState.refreshToken) {
                    setAuthState(prev => ({
                        ...prev,
                        isLoading: false,
                        isAuthenticated: false
                    }));
                    return;
                }

                // Use verify token route to validate current token
                try {
                    const resVerify = await API_OBJ.get(routes.verifyToken);

                    if (resVerify.status === 200) {
                        // Token is valid, set authenticated
                        setAuthState(prev => ({
                            ...prev,
                            isAuthenticated: true,
                            isLoading: false
                        }));
                    } else {
                        //just force to catch
                        throw new Error("Invalid token");
                    }
                } catch (validationError) {
                    // Token validation failed, attempt to refresh
                    try {
                        const response = await API_OBJ.post(routes.refreshToken, {
                            refreshToken: authState.refreshToken,
                            username: authState.username
                        });

                        const {
                            accessToken,
                            refreshToken,
                            username = authState.username
                        } = response.data;

                        // Update tokens in local storage
                        localStorage.setItem("accessToken", accessToken);
                        localStorage.setItem("refreshToken", refreshToken);

                        // Update auth state
                        setAuthState({
                            isAuthenticated: true,
                            isLoading: false,
                            accessToken,
                            refreshToken,
                            username
                        });
                    } catch (refreshError) {
                        // Refresh failed - force logout
                        HandleLogout();
                    }
                }
            } catch (error) {
                console.error("Authentication check failed", error);
                HandleLogout();
            }
        };

        verifyAuthentication();
    }, [HandleLogout, authState.refreshToken, authState.accessToken, authState.username]);

    // If still loading, render a loading component
    if (authState.isLoading) {
        return (
            <div className="spinner-container">
                <FadeLoader color="#36d7b7" />
            </div>
        );
    }

    return (
        <AuthContext.Provider
            value={{
                authState,
                Login: HandleLogin,
                Logout: HandleLogout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}