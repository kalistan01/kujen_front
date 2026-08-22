import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollText } from "lucide-react";
import baseUrl from "@/api/baseUrl";
import TablePagination from "@/components/TablePagination";
import { LogDetails } from "@/pages/logs/logDetails";

type ActivityLog = {
  _id: string;
  action: string;
  actorName?: string;
  actorRole?: string;
  actorEmail?: string;
  summary?: string;
  statusCode?: number;
  success?: boolean;
  payload?: Record<string, unknown> | null;
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

function AssignmentLogs({
  assignmentId,
  refreshKey,
}: {
  assignmentId?: string;
  refreshKey?: string | number;
}) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 10;

  const fetchLogs = (nextPage = page) => {
    if (!assignmentId) return;
    setLoading(true);
    baseUrl
      .get(`/logs/assignment/${assignmentId}`, {
        params: { page: nextPage, limit },
      })
      .then((response) => {
        setLogs(response.data.data || []);
        setTotal(response.data.total || 0);
        setPages(response.data.pages || 1);
        setPage(response.data.page || nextPage);
      })
      .catch(() => {
        setLogs([]);
        setTotal(0);
        setPages(1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, refreshKey]);

  if (!assignmentId) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/70 bg-muted/30 py-3">
        <CardTitle className="flex items-center text-base">
          <ScrollText className="mr-2 h-4 w-4 text-muted-foreground" />
          Activity log
        </CardTitle>
        <Badge variant="secondary">{total}</Badge>
      </CardHeader>
      <CardContent className="p-0">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <ScrollText className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="font-medium">
              {loading ? "Loading logs..." : "No activity yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Changes to this assignment will appear here.
            </p>
          </div>
        ) : (
          <Table className="[&_th]:h-8 [&_td]:py-2">
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
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
                  <TableCell className="max-w-[420px] whitespace-normal text-muted-foreground">
                    <LogDetails log={log} />
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
            fetchLogs(next);
          }}
        />
      </CardContent>
    </Card>
  );
}

export default AssignmentLogs;
