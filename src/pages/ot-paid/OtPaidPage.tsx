import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import { can, P } from "@/lib/permissions";
import { asList, cn } from "@/lib/utils";
import { formatMoney } from "@/pages/assignment/lib/financials";

type OtStatus = "pending" | "paid" | "approved";

type OtPaidRow = {
  _id: string;
  assignmentId: string;
  blNo?: string;
  cusdecNo?: string;
  date?: string;
  amount?: number;
  lorryOwnerId?: string;
  lorryOwnerName?: string;
  containerNos?: string[];
  status?: OtStatus;
  originalName?: string;
  mimeType?: string;
  hasFile?: boolean;
};

type FilePreview = {
  url: string;
  name: string;
  mimeType: string;
};

function isImageMime(mimeType?: string) {
  return String(mimeType || "").toLowerCase().startsWith("image/");
}

function isPdfMime(mimeType?: string) {
  return String(mimeType || "").toLowerCase().includes("pdf");
}

const STATUS_OPTIONS: { value: OtStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "approved", label: "Approved" },
];

const PENDING_STATUSES = new Set<OtStatus>(["pending", "approved"]);

export function OtPaidPage() {
  const { toast } = useToast();
  const location = useLocation();
  const isPaidTab = location.pathname === "/ot-paid/paid";
  const canEdit = can(P.OT_RECEIPTS_EDIT) && !isPaidTab;
  const [rows, setRows] = useState<OtPaidRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState("");
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const loadRows = () => {
    setLoading(true);
    baseUrl
      .get("/assignlorry/ot-receipts")
      .then((response) => {
        setRows(asList<OtPaidRow>(response.data?.data));
      })
      .catch((error) => {
        setRows([]);
        toast({
          title: "Unable to load OT receipts",
          description: getApiErrorMessage(
            error,
            "Could not load OT receipts. Please try again."
          ),
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRows();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const status = (row.status || "pending") as OtStatus;
      if (isPaidTab) {
        if (status !== "paid") return false;
      } else if (!PENDING_STATUSES.has(status)) {
        return false;
      }
      if (!q) return true;
      const containers = (row.containerNos || []).join(" ");
      return [row.blNo, row.cusdecNo, row.lorryOwnerName, containers, row.date]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [rows, query, isPaidTab]);

  const updateStatus = async (row: OtPaidRow, next: OtStatus) => {
    if (!canEdit || !row.assignmentId || !row._id || busyId) return;
    const previous = row.status || "pending";
    setRows((prev) =>
      prev.map((item) =>
        String(item._id) === String(row._id) ? { ...item, status: next } : item
      )
    );
    setBusyId(String(row._id));
    try {
      const response = await baseUrl.patch(
        `assignlorry/${row.assignmentId}/ot-receipts/${row._id}`,
        { status: next }
      );
      const updated = response.data?.data as OtPaidRow | undefined;
      if (updated?._id) {
        setRows((prev) =>
          prev.map((item) =>
            String(item._id) === String(row._id)
              ? { ...item, ...updated, assignmentId: row.assignmentId }
              : item
          )
        );
      }
      toast({
        title: "Status updated",
        description: `OT receipt marked as ${next}.`,
      });
    } catch (error) {
      setRows((prev) =>
        prev.map((item) =>
          String(item._id) === String(row._id)
            ? { ...item, status: previous }
            : item
        )
      );
      toast({
        title: "Could not update status",
        description: getApiErrorMessage(
          error,
          "Could not update the OT receipt status."
        ),
        variant: "destructive",
      });
    } finally {
      setBusyId("");
    }
  };

  const closePreview = () => {
    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const openFile = async (row: OtPaidRow) => {
    if (!row.hasFile || !row.assignmentId || !row._id || previewLoading) return;
    setPreviewLoading(true);
    try {
      const response = await baseUrl.get(
        `assignlorry/${row.assignmentId}/ot-receipts/${row._id}/file`,
        { responseType: "blob" }
      );
      const blob = response.data as Blob;
      if (blob.type.includes("json")) {
        throw new Error("Could not open this file.");
      }
      const mimeType = row.mimeType || blob.type || "application/octet-stream";
      const url = URL.createObjectURL(blob);
      if (isImageMime(mimeType) || isPdfMime(mimeType)) {
        setPreview((current) => {
          if (current?.url) URL.revokeObjectURL(current.url);
          return {
            url,
            name: row.originalName || "OT receipt",
            mimeType,
          };
        });
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast({
        title: "Could not open file",
        description: getApiErrorMessage(error, "Could not open the receipt file."),
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="OT Paid"
        description={
          isPaidTab
            ? "Paid OT receipts. Status cannot be changed here."
            : "Pending and approved OT receipts ready to mark paid."
        }
      >
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search BL, owner, container..."
            className="h-10 pl-9"
          />
        </div>
      </PageHeader>

      <Card className="overflow-hidden">
        <CardHeader className="space-y-2 border-b border-border/70 bg-muted/30 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <nav className="inline-flex h-8 items-center rounded-md bg-muted p-1 text-muted-foreground">
              <NavLink
                to="/ot-paid"
                end
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-6 items-center rounded-sm px-2.5 text-xs font-medium transition-all",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "hover:text-foreground"
                  )
                }
              >
                OT Pending to Paid
              </NavLink>
              <NavLink
                to="/ot-paid/paid"
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-6 items-center rounded-sm px-2.5 text-xs font-medium transition-all",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "hover:text-foreground"
                  )
                }
              >
                Paid
              </NavLink>
            </nav>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {loading ? "…" : filtered.length} receipt
              {!loading && filtered.length === 1 ? "" : "s"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>BL No</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Lorry owner</TableHead>
                  <TableHead>Containers</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 7 }).map((__, cell) => (
                        <TableCell key={cell}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length ? (
                  filtered.map((row) => (
                    <TableRow key={String(row._id)}>
                      <TableCell className="whitespace-nowrap">
                        {row.date || "—"}
                      </TableCell>
                      <TableCell>
                        {row.assignmentId ? (
                          <Link
                            to={`/assignment/${row.assignmentId}`}
                            className="font-medium text-[hsl(var(--brand-navy))] underline-offset-2 hover:underline"
                          >
                            {row.blNo || "Assignment"}
                          </Link>
                        ) : (
                          row.blNo || "—"
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {formatMoney(row.amount)}
                      </TableCell>
                      <TableCell>{row.lorryOwnerName || "—"}</TableCell>
                      <TableCell className="max-w-[220px]">
                        <span className="line-clamp-2">
                          {(row.containerNos || []).filter(Boolean).join(", ") ||
                            "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {row.hasFile ? (
                          <button
                            type="button"
                            className="text-left text-sm font-medium text-[hsl(var(--brand-navy))] underline-offset-2 hover:underline"
                            onClick={() => openFile(row)}
                          >
                            {row.originalName || "View"}
                          </button>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {canEdit ? (
                          <Select
                            value={row.status || "pending"}
                            disabled={busyId === String(row._id)}
                            onValueChange={(value) =>
                              updateStatus(row, value as OtStatus)
                            }
                          >
                            <SelectTrigger className="ml-auto h-8 w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <StatusBadge status={row.status || "pending"} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      {isPaidTab
                        ? "No paid OT receipts found."
                        : "No pending OT receipts found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(preview)}
        onOpenChange={(next) => {
          if (!next) closePreview();
        }}
      >
        <DialogContent className="max-h-[90vh] min-w-0 overflow-hidden sm:max-w-3xl [&>*]:min-w-0">
          <DialogHeader>
            <DialogTitle className="truncate">
              {preview?.name || "OT receipt"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto rounded-md border border-border bg-muted/30 p-2">
            {preview && isImageMime(preview.mimeType) ? (
              <img
                src={preview.url}
                alt={preview.name}
                className="mx-auto max-h-[66vh] w-auto max-w-full object-contain"
              />
            ) : preview && isPdfMime(preview.mimeType) ? (
              <iframe
                title={preview.name}
                src={preview.url}
                className="h-[66vh] w-full rounded-sm bg-background"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OtPaidPage;
