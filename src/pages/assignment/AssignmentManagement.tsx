import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Plus,
  Eye,
  Search,
  Package,
  ClipboardList,
  FileDown,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import baseUrl from "@/api/baseUrl";
import AddAssignment from "./AddAssignment";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import TablePagination from "@/components/TablePagination";

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const parseDay = (value: string, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date;
};

export const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAdd = () => {
    setEditingAssignment(null);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    baseUrl
      .get("/assignlorry")
      .then(async (response) => {
        setAssignments(response.data.data || []);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [isDialogOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = parseDay(fromDate);
    const to = parseDay(toDate, true);

    return assignments.filter((assignment) => {
      if (status !== "all" && assignment.status !== status) return false;
      if (q) {
        const match = [
          assignment.blNo,
          assignment.item,
          assignment.exporter,
          assignment.importer,
          assignment.status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
        if (!match) return false;
      }
      if (from || to) {
        const date = assignment.cusdecDate
          ? new Date(assignment.cusdecDate)
          : null;
        if (!date || Number.isNaN(date.getTime())) return false;
        if (from && date < from) return false;
        if (to && date > to) return false;
      }
      return true;
    });
  }, [assignments, query, status, fromDate, toDate]);

  useEffect(() => {
    setPage(1);
  }, [query, status, fromDate, toDate]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  const currentPage = Math.min(page, pages);
  const paged = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const hasFilters = Boolean(query.trim() || status !== "all" || fromDate || toDate);

  const downloadExport = async (type: "pdf" | "excel") => {
    if (exporting) return;
    setExporting(type);
    try {
      const response = await baseUrl.get(`/assignlorry/export/${type}`, {
        responseType: "blob",
        params: {
          q: query.trim() || undefined,
          status: status !== "all" ? status : undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
        },
      });
      const contentType = String(response.headers["content-type"] || "");
      if (contentType.includes("application/json")) {
        throw new Error("Export failed");
      }
      const blob = new Blob([response.data], { type: contentType });
      const ext = type === "pdf" ? "pdf" : "xlsx";
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `RG-Brothers-Assignments.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast({
        title: "Export failed",
        description: "Could not download the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Track bill of lading records, containers, and shipment status."
      >
        <Button
          variant="outline"
          onClick={() => downloadExport("pdf")}
          disabled={exporting === "pdf"}
          className="h-10"
        >
          <FileDown className="h-4 w-4" />
          {exporting === "pdf" ? "PDF..." : "PDF"}
        </Button>
        <Button
          variant="outline"
          onClick={() => downloadExport("excel")}
          disabled={exporting === "excel"}
          className="h-10"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {exporting === "excel" ? "Excel..." : "Excel"}
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleAdd}
              className="h-10 gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden border-border bg-card p-0 text-card-foreground sm:max-w-4xl sm:rounded-xl [&>button]:text-primary-foreground [&>button]:hover:bg-primary-foreground/10 [&>button]:hover:text-primary-foreground">
            <DialogHeader className="border-b border-primary-foreground/15 bg-primary px-6 py-4 text-left">
              <DialogTitle className="text-xl tracking-tight text-primary-foreground">
                {editingAssignment ? "Edit Assignment" : "Add New Assignment"}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/75">
                Enter BL details, then add containers, lorry, and charges.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto bg-card px-6 py-5">
              <AddAssignment
                setIsDialogOpen={setIsDialogOpen}
                setAssignments={setAssignments}
                assignments={assignments}
                setEditingAssignment={setEditingAssignment}
                editingAssignment={editingAssignment}
              />
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="overflow-hidden">
        <CardHeader className="space-y-4 border-b border-border/70 bg-muted/30 py-4">
          <CardTitle className="flex items-center justify-between text-base font-semibold">
            <span>Shipment directory</span>
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search BL, item, exporter..."
                className="h-9 bg-background pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-[140px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
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
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 text-muted-foreground"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setFromDate("");
                  setToDate("");
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No assignments found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasFilters
                  ? "Try a different search or filter."
                  : "Create an assignment to start tracking shipments."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead>BL Number</TableHead>
                  <TableHead>Cusdec Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Containers</TableHead>
                  <TableHead>Exporter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((assignment, index: number) => {
                  const containers = assignment.containers || [];
                  return (
                    <TableRow key={assignment._id || index}>
                      <TableCell>
                        <span className="inline-flex rounded-md border border-[hsl(var(--brand-navy))]/15 bg-[hsl(var(--brand-navy))]/8 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-[hsl(var(--brand-navy))] dark:border-white/10 dark:bg-white/10 dark:text-white">
                          {assignment.blNo || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(assignment.cusdecDate)}
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[180px] truncate font-medium">
                          {assignment.item || "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Package className="h-3.5 w-3.5 text-amber-600" />
                            <span className="font-medium text-foreground">
                              {containers.length}
                            </span>
                            container{containers.length !== 1 ? "s" : ""}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {containers.slice(0, 3).map((c: any, i: number) => (
                              <span
                                key={c._id || i}
                                className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/40 px-2 py-1"
                              >
                                <span className="font-mono text-[11px] font-medium">
                                  {c.containerNo}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {c.lorryId?.lorryNum || "Unassigned"}
                                </span>
                              </span>
                            ))}
                            {containers.length > 3 && (
                              <span className="inline-flex items-center rounded-md px-1.5 text-[11px] text-muted-foreground">
                                +{containers.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-muted-foreground">
                        {assignment.exporter || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={assignment.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/assignment/${assignment._id}`)
                          }
                          className="gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <TablePagination
            page={currentPage}
            pages={pages}
            total={filtered.length}
            limit={pageSize}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
};
