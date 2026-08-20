import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Search } from "lucide-react";
import baseUrl from "@/api/baseUrl";
import { PageHeader } from "@/components/PageHeader";
import { isAdminUser } from "@/lib/auth";
import TablePagination from "@/components/TablePagination";

type ActivityLog = {
  _id: string;
  action: string;
  module: string;
  method: string;
  path: string;
  statusCode?: number;
  success?: boolean;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  summary?: string;
  createdAt: string;
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const LogsPage = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const hasFilters = Boolean(
    query.trim() || module !== "all" || fromDate || toDate
  );

  const fetchLogs = (overrides?: {
    q?: string;
    module?: string;
    from?: string;
    to?: string;
    page?: number;
  }) => {
    setLoading(true);
    const nextQuery = overrides?.q ?? query;
    const nextModule = overrides?.module ?? module;
    const nextFrom = overrides?.from ?? fromDate;
    const nextTo = overrides?.to ?? toDate;
    const nextPage = overrides?.page ?? page;
    baseUrl
      .get("/logs", {
        params: {
          q: nextQuery.trim() || undefined,
          module: nextModule !== "all" ? nextModule : undefined,
          from: nextFrom || undefined,
          to: nextTo || undefined,
          page: nextPage,
          limit,
        },
      })
      .then((response) => {
        setLogs(response.data.data || []);
        setTotal(response.data.total || 0);
        setPages(response.data.pages || 1);
        setPage(response.data.page || nextPage);
      })
      .catch((error) => {
        console.error(error);
        setLogs([]);
        setTotal(0);
        setPages(1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAdminUser()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs"
        description="Activity history for every create, update, delete, login, and export action."
      />

      <Card className="overflow-hidden">
        <CardHeader className="space-y-4 border-b border-border bg-muted/40 py-4">
          <CardTitle className="flex items-center justify-between text-base font-semibold">
            <span>Activity log</span>
            <Badge variant="secondary">{total}</Badge>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search action, user, BL..."
                className="h-9 bg-background pl-9"
              />
            </div>
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger className="h-9 w-[150px] bg-background">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                <SelectItem value="auth">auth</SelectItem>
                <SelectItem value="assignment">assignment</SelectItem>
                <SelectItem value="user">user</SelectItem>
                <SelectItem value="role">role</SelectItem>
                <SelectItem value="lorry">lorry</SelectItem>
                <SelectItem value="destination">destination</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 w-[150px] bg-background"
              aria-label="From date"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 w-[150px] bg-background"
              aria-label="To date"
            />
            <Button
              size="sm"
              className="h-9"
              onClick={() => {
                setPage(1);
                fetchLogs({ page: 1 });
              }}
              disabled={loading}
            >
              {loading ? "Loading..." : "Apply"}
            </Button>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 text-muted-foreground"
                onClick={() => {
                  setQuery("");
                  setModule("all");
                  setFromDate("");
                  setToDate("");
                  setPage(1);
                  fetchLogs({ q: "", module: "all", from: "", to: "", page: 1 });
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <ScrollText className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No logs found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Actions across the app will appear here for admins.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{log.actorName || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.actorRole || log.actorEmail || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {log.module}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          log.success
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/25 dark:bg-rose-500/15 dark:text-rose-300"
                        }
                      >
                        {log.statusCode || (log.success ? "OK" : "Failed")}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[360px] whitespace-normal text-muted-foreground">
                      {log.summary || log.path}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePagination
            page={page}
            pages={pages}
            total={total}
            limit={limit}
            onPageChange={(next) => {
              setPage(next);
              fetchLogs({ page: next });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsPage;
