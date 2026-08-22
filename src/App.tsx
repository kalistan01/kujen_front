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
import { SettingsPage } from "./pages/settings/Settings";
import { LogsPage } from "./pages/logs/LogsPage";
import RequirePermission from "./components/RequirePermission";
import { P } from "./lib/permissions";

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
                <Route
                  path="/assignments"
                  element={
                    <RequirePermission ids={[P.ASSIGNMENTS_VIEW, P.ASSIGNMENTS_MANAGE]}>
                      <AssignmentManagement />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <RequirePermission ids={[P.DESTINATIONS_VIEW, P.DESTINATIONS_MANAGE]}>
                      <SettingsPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/destinations"
                  element={
                    <RequirePermission ids={[P.DESTINATIONS_VIEW, P.DESTINATIONS_MANAGE]}>
                      <Navigate to="/settings" replace />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <RequirePermission ids={[P.USERS_VIEW, P.USERS_MANAGE]}>
                      <UserManagement />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/roles"
                  element={
                    <RequirePermission ids={[P.ROLES_MANAGE]}>
                      <RoleManagement />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/logs"
                  element={
                    <RequirePermission ids={[P.LOGS_VIEW]}>
                      <LogsPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/lorry-owners"
                  element={
                    <RequirePermission ids={[P.LORRIES_VIEW, P.LORRIES_MANAGE]}>
                      <LorryOwnerManagement />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/assignment/:id"
                  element={
                    <RequirePermission ids={[P.ASSIGNMENTS_VIEW, P.ASSIGNMENTS_MANAGE]}>
                      <AssignmentDetails />
                    </RequirePermission>
                  }
                />
              </Route>
           <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
