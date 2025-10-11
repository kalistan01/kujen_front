import baseUrl from "@/api/baseUrl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Truck,
  Users,
  MapPin,
  ClipboardList,
  TrendingUp,
  Package,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    {
      title: "Total Users",
      value: "24",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Lorry Owners",
      value: "12",
      icon: Truck,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Destinations",
      value: "18",
      icon: MapPin,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Active Assignments",
      value: "8",
      icon: Package,
      color: "text-warning",
      bgColor: "bg-warning/10",
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Dashboard Overview
        </h2>
        <p className="text-muted-foreground">
          Welcome to your logistics management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    New lorry owner registered
                  </p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Assignment completed</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New destination added</p>
                  <p className="text-xs text-muted-foreground">6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button
                className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
                onClick={() => navigate("/users")}
              >
                <Users className="h-8 w-8 text-primary mb-2" />
                <p className="font-medium text-sm">Add User</p>
              </button>
              <button
                className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
                onClick={() => navigate("/lorry-owners")}
              >
                <Truck className="h-8 w-8 text-accent mb-2" />
                <p className="font-medium text-sm">Add Owner</p>
              </button>
              <button
                className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
                onClick={() => navigate("/destinations")}
              >
                <MapPin className="h-8 w-8 text-success mb-2" />
                <p className="font-medium text-sm">Add Destination</p>
              </button>
              <button
                className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
                onClick={() => navigate("/assignments")}
              >
                <Package className="h-8 w-8 text-warning mb-2" />
                <p className="font-medium text-sm">New Assignment</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
