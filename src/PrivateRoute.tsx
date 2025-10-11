import React from "react";
import { Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";


const PrivateRoute: React.FC = () => {
  const token = localStorage.getItem("token");
  if (token !== null && token?.length > 10) {
    return <Layout />;
  } else {
    return <Navigate to="/login" />;
  }
};

export default PrivateRoute;
