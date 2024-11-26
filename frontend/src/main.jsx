import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./routes/Home";
import { AuthProvider } from "./components/AuthContext";
import { isAPIDown } from "../util/axiosInstance";

const root = document.getElementById("root");


ReactDOM.createRoot(root).render(
  <>
    {
      isAPIDown ? <h1>API is down. GET OUT🗣️🗣️🗣️</h1> : <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    }
  </>

);
