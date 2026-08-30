import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { SocketProvider } from "./context/SocketProvider";
const API_URL = import.meta.env.VITE_API_URL;

const PrivateRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/check`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
          }
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking session...
      </div>
    );
  }

  return isAuthenticated ? (
    <SocketProvider>
      <Layout />
    </SocketProvider>
  ) : (
    <Navigate to="/login" />
  );
};

export default PrivateRoute;
