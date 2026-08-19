import baseUrl from "@/api/baseUrl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Truck,
  Users,
  MapPin,
  ClipboardList,
  TrendingUp,
  Package,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const activities = [
  {
    title: "New lorry owner registered",
    time: "2 hours ago",
    tone: "bg-sky-500",
  },
  {
    title: "Assignment completed",
    time: "4 hours ago",
    tone: "bg-amber-500",
  },
  {
    title: "New destination added",
    time: "6 hours ago",
    tone: "bg-emerald-500",
  },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    {
      title: "Total Users",
      value: "24",
      icon: Users,
      href: "/users",
      accent: "from-sky-500 to-blue-600",
      iconWrap: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    },
    {
      title: "Lorry Owners",
      value: "12",
      icon: Truck,
      href: "/lorry-owners",
      accent: "from-amber-400 to-orange-500",
      iconWrap: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    },
    {
      title: "Destinations",
      value: "18",
      icon: MapPin,
      href: "/destinations",
      accent: "from-emerald-500 to-teal-600",
      iconWrap: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    },
    {
      title: "Active Assignments",
      value: "8",
      icon: Package,
      href: "/assignments",
      accent: "from-violet-500 to-indigo-600",
      iconWrap: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    },
  ]);

  useEffect(() => {
    baseUrl
      .get("/dashboard/topcount")
      .then(async (response) => {
        setStats((prevStats) =>
          prevStats.map((stat) => {
            switch (stat.title) {
              case "Total Users":
                return { ...stat, value: response.data.count.user };
              case "Lorry Owners":
                return { ...stat, value: response.data.count.lorryOwner };
              case "Destinations":
                return { ...stat, value: response.data.count.distination };
              case "Active Assignments":
                return { ...stat, value: response.data.count.assignent };
              default:
                return stat;
            }
          })
        );
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const actions = [
    {
      label: "Add User",
      hint: "Create a staff account",
      icon: Users,
      href: "/users",
      tone: "text-sky-600 bg-sky-500/10",
    },
    {
      label: "Add Owner",
      hint: "Register a fleet owner",
      icon: Truck,
      href: "/lorry-owners",
      tone: "text-amber-600 bg-amber-500/10",
    },
    {
      label: "Add Destination",
      hint: "Set a delivery route",
      icon: MapPin,
      href: "/destinations",
      tone: "text-emerald-600 bg-emerald-500/10",
    },
    {
      label: "New Assignment",
      hint: "Plan a shipment",
      icon: Package,
      href: "/assignments",
      tone: "text-violet-600 bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-[hsl(var(--brand-navy))] px-6 py-7 text-white shadow-shell">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-sky-400/15 blur-3xl" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
          RG Brothers
        </p>
        <h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
          Operations overview
        </h2>
        <p className="mt-2 max-w-lg text-sm text-white/65">
          Track people, fleet, routes, and assignments from one professional
          logistics workspace.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.title}
              type="button"
              onClick={() => navigate(stat.href)}
              className="text-left"
            >
              <Card className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`}
                />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="mt-2 text-3xl font-bold tracking-tight">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconWrap}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    View details
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-3"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-[hsl(var(--brand-navy))]" />
              Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    className="rounded-xl border border-border/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--brand-navy))]/40 hover:bg-muted/40"
                    onClick={() => navigate(action.href)}
                  >
                    <div
                      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${action.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold">{action.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {action.hint}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
