import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ShieldCheck, Truck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/user/user-login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/";
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[hsl(var(--brand-navy))] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <img
            src="/logo.png"
            alt="RG Brothers"
            className="h-11 w-11 rounded-lg object-cover ring-1 ring-white/15"
          />
          <div>
            <p className="text-lg font-bold leading-tight">RG Brothers</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              Logistics
            </p>
          </div>
        </div>

        <div className="relative max-w-md space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Move cargo with clarity and control.
          </h1>
          <p className="text-base text-white/65">
            A professional workspace for assignments, fleet owners,
            destinations, and your operations team.
          </p>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <Truck className="h-5 w-5 text-sky-200" />
              <span className="text-sm">Fleet and assignment tracking</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-sky-200" />
              <span className="text-sm">Role-based access for staff</span>
            </div>
          </div>
        </div>

        <p className="relative text-sm text-white/40">
          © {new Date().getFullYear()} RG Brothers. All rights reserved.
        </p>
      </div>

      <div className="relative flex items-center justify-center bg-background p-6">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img
              src="/logo.png"
              alt="RG Brothers"
              className="h-11 w-11 rounded-lg object-cover"
            />
            <div>
              <p className="font-bold">RG Brothers</p>
              <p className="text-xs text-muted-foreground">Logistics</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-shell">
            <div className="mb-8 space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to continue to the RG Brothers dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@rgbrothers.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="h-11 w-full bg-[hsl(var(--brand-navy))] font-semibold text-white hover:bg-[hsl(var(--brand-navy-muted))]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
