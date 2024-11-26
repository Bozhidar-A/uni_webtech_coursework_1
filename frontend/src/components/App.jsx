import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "../routes/HomePage";
import LoginPage from "../routes/Login";
import { routes } from "../../util/consts";
import FadeLoader from "react-spinners/FadeLoader";
import { useEffect, useState } from "react";
import { AuthProvider } from "./AuthContext";
import "../css/Spinner.css";
import API_OBJ from "../../util/axiosInstance";
import PackagesPage from "../routes/PackagesPage";

export default function App() {
    const [isAPIHealthy, setIsAPIHealthy] = useState(null);

    useEffect(() => {
        const checkAPIHealth = async () => {
            try {
                var res = await API_OBJ.get("/health");
                if (res.status === 200) {
                    setIsAPIHealthy(true);
                }
            } catch (error) {
                console.error("API is not healthy:", error);
                setIsAPIHealthy(false);
            }
        };
        checkAPIHealth();
    }, []);

    if (isAPIHealthy == null) {
        return (
            <div className={"spinner-container"}>
                <FadeLoader color="#36d7b7" />
            </div>
        )
    }

    if (!isAPIHealthy) {
        return (
            <div>
                <h1>API is down. GET OUT🗣️🗣️🗣️</h1>
            </div>
        )
    }


    return (

        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path={routes.home} element={<HomePage />} />
                    {/* {auth.isAuthenticated ? null : <Route path={routes.login} element={<LoginPage />} />}
                {auth.isAuthenticated ? <Route path={routes.packages} element={<PackagesPage />} /> : null} */}
                    <Route path={routes.login} element={<LoginPage />} />
                    <Route path={routes.packages} element={<PackagesPage />} />
                    <Route path="*" element={<Navigate replace to={<h1>404 Page</h1>} />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}