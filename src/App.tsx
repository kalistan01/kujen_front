import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AssignmentDetails from "./pages/assignment/AssignmentDetails";
import { Dashboard } from "./components/Dashboard";
import { AssignmentManagement } from "./pages/assignment/AssignmentManagement";
import { LorryOwnerManagement } from "./pages/lorry/LorryOwnerManagement";
import { RoleManagement } from "./pages/role/RoleManagement";
import { UserManagement } from "./pages/user/UserManagement";
import PrivateRoute from "./PrivateRoute";
import { DestinationManagement } from "./pages/destination/DestinationManagement";
import { LogsPage } from "./pages/logs/LogsPage";

const queryClient = new QueryClient();
const token: string | null = localStorage.getItem("token");
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="logistics-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
              <Route path="/" element={<PrivateRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/assignments" element={<AssignmentManagement />} />
                <Route
                  path="/destinations"
                  element={<DestinationManagement />}
                />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/roles" element={<RoleManagement />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route
                  path="/lorry-owners"
                  element={<LorryOwnerManagement />}
                />
                <Route path="/assignment/:id" element={<AssignmentDetails />} />
              </Route>
           <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
