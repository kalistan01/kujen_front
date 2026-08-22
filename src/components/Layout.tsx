import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Users,
  ClipboardList,
  Shield,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getAuthUser, userInitials } from "@/lib/auth";
import { can, P } from "@/lib/permissions";

const API_URL = import.meta.env.VITE_API_URL;

const allMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/", permission: null },
  { id: "users", label: "Users", icon: Users, path: "/users", permission: [P.USERS_VIEW, P.USERS_MANAGE] },
  { id: "roles", label: "Roles", icon: Shield, path: "/roles", permission: [P.ROLES_MANAGE] },
  {
    id: "lorry-owners",
    label: "Lorry Owners",
    icon: Truck,
    path: "/lorry-owners",
    permission: [P.LORRIES_VIEW, P.LORRIES_MANAGE],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
    permission: [P.DESTINATIONS_VIEW, P.DESTINATIONS_MANAGE],
  },
  {
    id: "assignments",
    label: "Assignments",
    icon: ClipboardList,
    path: "/assignments",
    permission: [P.ASSIGNMENTS_VIEW, P.ASSIGNMENTS_MANAGE],
  },
  {
    id: "logs",
    label: "Logs",
    icon: ScrollText,
    path: "/logs",
    permission: [P.LOGS_VIEW],
  },
];

export const Layout = () => {
  const user = getAuthUser();
  const menuItems = useMemo(
    () =>
      allMenuItems.filter(
        (item) =>
          !item.permission || item.permission.some((id) => can(id, user))
      ),
    [user]
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
    }
  };

  const currentItem = useMemo(() => {
    if (location.pathname.startsWith("/assignment/")) {
      return { label: "Assignment Details" };
    }
    return (
      menuItems.find((item) =>
        item.path === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(item.path)
      ) ?? menuItems[0]
    );
  }, [location.pathname, menuItems]);

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[250px] max-w-[250px] flex-col overflow-hidden print:hidden",
          "bg-sidebar text-sidebar-foreground",
          "transition-transform duration-300 ease-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="pointer-events-none absolute -right-16 top-24 h-56 w-56 rounded-full bg-sidebar-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative border-b border-sidebar-border px-3 py-5">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="RG Brothers"
              className="h-11 w-11 rounded-lg bg-white object-cover ring-1 ring-sidebar-foreground/40"
            />
            <div className="min-w-0">
              <h1 className="truncate text-[17px] font-bold leading-tight tracking-tight text-sidebar-foreground">
                RG Brothers
              </h1>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/80">
                Logistics
              </p>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 space-y-1 overflow-y-auto px-2 py-4">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/75">
            Operations
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                to={item.path}
                key={item.id}
                end={item.path === "/"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-inner"
                      : "text-sidebar-foreground/85 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-sidebar-primary" />
                    )}
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "bg-sidebar-foreground/10 text-sidebar-foreground group-hover:bg-sidebar-foreground/15"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="relative border-t border-sidebar-border p-2.5">
          <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              {userInitials(user?.fullName || "AD")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {user?.fullName || "Administrator"}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/75">
                {user?.roleName || "RG Brothers"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={loggingOut}
              className="h-8 w-8 shrink-0 text-sidebar-foreground/80 hover:bg-destructive/15 hover:text-destructive"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[250px] print:pl-0">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 text-foreground backdrop-blur-xl print:hidden">
          <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen((open) => !open)}
                className="shrink-0 text-foreground lg:hidden"
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  RG Brothers
                </p>
                <h2 className="truncate text-lg font-semibold leading-tight tracking-tight text-foreground">
                  {currentItem.label}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 gap-2 rounded-full px-2.5"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {userInitials(user?.fullName || "AD")}
                    </span>
                    <span className="hidden pr-1 text-sm font-medium sm:inline">
                      {user?.fullName?.split(" ")[0] || "Admin"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">
                      {user?.fullName || "Administrator"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.roleName || user?.email || "RG Brothers"}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {loggingOut ? "Signing out..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-5 print:p-0">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
