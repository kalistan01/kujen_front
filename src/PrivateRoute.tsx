import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
const API_URL = import.meta.env.VITE_API_URL;

const PrivateRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/check`, {
          method: "GET",
          credentials: "include", // 👈 Required to send cookies
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
          }
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Or a spinner
  }

  return isAuthenticated ? <Layout /> : <Navigate to="/login" />;
};

export default PrivateRoute;
