import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Users,
  MapPin,
  ClipboardList,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavLink, Outlet } from "react-router-dom";
const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: ClipboardList },
  { id: "users", label: "Users", icon: Users },
  { id: "roles", label: "Roles", icon: Shield },
  { id: "lorry-owners", label: "Lorry Owners", icon: Truck },
  { id: "destinations", label: "Destinations", icon: MapPin },
  { id: "assignments", label: "Assignments", icon: ClipboardList },
];
export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                LogiFlow
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="text-sm text-muted-foreground">
              Welcome back, Admin
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        >
          <div className="flex flex-col h-full pt-16 lg:pt-0">
            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    to={item.id === "dashboard" ? "/" : `/${item.id}`}
                    key={item.id}
                    className={({ isActive }) => `
                      flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-medium
                      ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </aside>
        <main className="flex-1 p-2 lg:pl-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
