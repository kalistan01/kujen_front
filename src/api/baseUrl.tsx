import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";

// Retrieve the token and accessPermission from localStorage
const token: string | null = localStorage.getItem("token");

const API_URL = import.meta.env.VITE_API_URL;
// Create Axios instance with base URL and headers
const baseUrl: AxiosInstance = axios.create({
  baseURL:API_URL,
  headers: {
    Authorization: `Bearer ${token || ""}`,
    "Content-Type": "application/json; charset=utf-8",
  },
  withCredentials:true
});


// Response interceptor to handle unauthorized responses
baseUrl.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default baseUrl;
