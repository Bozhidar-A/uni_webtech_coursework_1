import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // Adjust the path to your AuthContext

function ProtectedRoute({ children }) {
    const { auth } = useAuth();
    console.log(auth);

    if (!auth.isAuthenticated) {
        // Redirect to login page if not authenticated
        console.log("Not authenticated");
        // return <Navigate to="/login" replace />;
    }

    // Render protected content if authenticated
    return children;
}

export default ProtectedRoute;
