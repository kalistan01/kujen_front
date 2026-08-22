import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote, FileDown, FileSpreadsheet, Printer } from "lucide-react";
import baseUrl from "@/api/baseUrl";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { canManageAssignments, canSeeField } from "@/lib/permissions";
import {
  containerCapacity,
  containerDestination,
  containerDestinationMatches,
  containerDestinationOption,
  containerLorry,
  containerMatchesOwner,
  containerOwner,
  containerOwnerKey,
} from "./lib/containerDisplay";
import { parseDay } from "./lib/dates";
import {
  containerBalance,
  formatMoney,
  toAmount,
  todayDateInput,
} from "./lib/financials";
import AddAssignmentDialog from "./components/AddAssignmentDialog";
import AssignmentFilters from "./components/AssignmentFilters";
import AssignmentTable from "./components/AssignmentTable";
import ContainerListPrint from "./components/ContainerListPrint";
import ContainerListTable from "./components/ContainerListTable";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";

const CONTAINER_STATUSES = [
  { value: "all", label: "All status" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [advancedFilter, setAdvancedFilter] = useState("all");
  const [owner, setOwner] = useState("all");
  const [destination, setDestination] = useState("all");
  const [lorryOwners, setLorryOwners] = useState<any[]>([]);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [tab, setTab] = useState("assignments");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkPayOpen, setIsBulkPayOpen] = useState(false);
  const [bulkPayDate, setBulkPayDate] = useState(todayDateInput());
  const [bulkPaying, setBulkPaying] = useState(false);
  const pageSize = 10;
  const { toast } = useToast();
  const canPay =
    canManageAssignments() && canSeeField("balancePaid");

  const handleAdd = () => {
    setEditingAssignment(null);
    setIsDialogOpen(true);
  };

  const loadAssignments = () =>
    baseUrl
      .get("/assignlorry")
      .then((response) => {
        setAssignments(response.data.data || []);
      })
      .catch((error) => {
        toast({
          title: "Unable to load assignments",
          description: getApiErrorMessage(
            error,
            "Could not load assignments. Please try again."
          ),
          variant: "destructive",
        });
      });

  useEffect(() => {
    loadAssignments();
  }, [isDialogOpen]);

  useEffect(() => {
    baseUrl
      .get("/lorry")
      .then((response) => {
        setLorryOwners(response.data?.data || []);
      })
      .catch(() => {
        setLorryOwners([]);
      });
  }, []);

  useEntitySync("assignment", (payload) => {
    setAssignments((prev) => upsertById(prev, payload));
  });

  useEntitySync("lorry", (payload) => {
    setLorryOwners((prev) => upsertById(prev, payload));
  });

  const ownerOptions = useMemo(() => {
    const names = new Map<string, string>();
    lorryOwners.forEach((item: any) => {
      const label = item.ownerName || item.companyName;
      const value = item._id || item.id;
      if (value && label) names.set(String(value), String(label).toUpperCase());
    });
    assignments.forEach((assignment) => {
      (assignment.containers || []).forEach((container: any) => {
        const label = containerOwner(container);
        const value =
          container.lorryId?.owner?._id ||
          container.lorryId?.owner ||
          containerOwnerKey(container);
        if (value && label) names.set(String(value), String(label).toUpperCase());
      });
    });
    return [...names.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [assignments, lorryOwners]);

  const destinationOptions = useMemo(() => {
    const items = new Map<string, string>();
    assignments.forEach((assignment) => {
      (assignment.containers || []).forEach((container: any) => {
        const option = containerDestinationOption(container);
        if (option?.value) items.set(option.value, option.label);
      });
    });
    return [...items.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [assignments]);

  const matchesExtraFilters = (container: any) => {
    if (balanceFilter === "unpaid" && containerBalance(container) <= 0) {
      return false;
    }
    if (advancedFilter === "yes" && toAmount(container?.advanced) <= 0) {
      return false;
    }
    if (owner !== "all" && !containerMatchesOwner(container, owner)) {
      return false;
    }
    if (destination !== "all" && !containerDestinationMatches(container, destination)) {
      return false;
    }
    return true;
  };

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
      const containers = assignment.containers || [];
      if (
        (balanceFilter === "unpaid" ||
          advancedFilter === "yes" ||
          owner !== "all" ||
          destination !== "all") &&
        !containers.some((container: any) => matchesExtraFilters(container))
      ) {
        return false;
      }
      return true;
    });
  }, [
    assignments,
    query,
    status,
    fromDate,
    toDate,
    balanceFilter,
    advancedFilter,
    owner,
    destination,
  ]);

  const filteredContainers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = parseDay(fromDate);
    const to = parseDay(toDate, true);

    return assignments.flatMap((assignment) =>
      (assignment.containers || [])
        .filter((container: any) => {
          if (
            status !== "all" &&
            (container.status || "pending") !== status
          ) {
            return false;
          }
          if (!matchesExtraFilters(container)) return false;
          if (q) {
            const match = [
              assignment.blNo,
              assignment.item,
              assignment.exporter,
              assignment.importer,
              container.containerNo,
              container.vocNo,
              containerLorry(container),
              containerOwner(container),
              containerDestination(container),
              container.status,
            ]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(q));
            if (!match) return false;
          }
          if (from || to) {
            const date = container.loadingDate
              ? new Date(container.loadingDate)
              : assignment.cusdecDate
                ? new Date(assignment.cusdecDate)
                : null;
            if (!date || Number.isNaN(date.getTime())) return false;
            if (from && date < from) return false;
            if (to && date > to) return false;
          }
          return true;
        })
        .map((container: any) => ({ assignment, container }))
    );
  }, [
    assignments,
    query,
    status,
    fromDate,
    toDate,
    balanceFilter,
    advancedFilter,
    owner,
    destination,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    query,
    status,
    fromDate,
    toDate,
    tab,
    balanceFilter,
    advancedFilter,
    owner,
    destination,
  ]);

  const isContainersTab = tab === "containers";
  const listTotal = isContainersTab ? filteredContainers.length : filtered.length;
  const pages = Math.max(1, Math.ceil(listTotal / pageSize) || 1);
  const currentPage = Math.min(page, pages);
  const paged = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const pagedContainers = filteredContainers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const hasFilters = Boolean(
    query.trim() ||
      status !== "all" ||
      fromDate ||
      toDate ||
      balanceFilter !== "all" ||
      advancedFilter !== "all" ||
      owner !== "all" ||
      destination !== "all"
  );

  const allContainerRows = useMemo(
    () =>
      assignments.flatMap((assignment) =>
        (assignment.containers || []).map((container: any) => ({
          assignment,
          container,
        }))
      ),
    [assignments]
  );
  const selectedRows = useMemo(
    () =>
      allContainerRows.filter((row) =>
        selectedIds.includes(row.container?._id)
      ),
    [allContainerRows, selectedIds]
  );
  const payableSelectedRows = selectedRows.filter(
    (row) => containerBalance(row.container) > 0
  );
  const selectedTotal = payableSelectedRows.reduce(
    (sum, row) => sum + containerBalance(row.container),
    0
  );

  const toggleSelected = (containerId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked
        ? prev.includes(containerId)
          ? prev
          : [...prev, containerId]
        : prev.filter((id) => id !== containerId)
    );
  };

  const toggleSelectPage = (containerIds: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return [...new Set([...prev, ...containerIds])];
      }
      return prev.filter((id) => !containerIds.includes(id));
    });
  };

  const handleBulkPay = () => {
    if (bulkPaying || !payableSelectedRows.length) return;
    const groups = new Map<string, string[]>();
    payableSelectedRows.forEach((row) => {
      const assignmentId = row.assignment?._id;
      const containerId = row.container?._id;
      if (!assignmentId || !containerId) return;
      const ids = groups.get(assignmentId) || [];
      ids.push(containerId);
      groups.set(assignmentId, ids);
    });
    if (!groups.size) return;

    setBulkPaying(true);
    Promise.all(
      [...groups.entries()].map(([assignmentId, containerIds]) =>
        baseUrl.patch(`/assignlorry/${assignmentId}/pay-balances`, {
          containerIds,
          balanceDate: bulkPayDate || todayDateInput(),
        })
      )
    )
      .then(() => {
        toast({
          title: "Balances paid",
          description: `${payableSelectedRows.length} container${
            payableSelectedRows.length === 1 ? "" : "s"
          } · ${formatMoney(selectedTotal)}`,
        });
        setIsBulkPayOpen(false);
        setSelectedIds([]);
        return loadAssignments();
      })
      .catch((error) => {
        toast({
          title: "Payment failed",
          description: getApiErrorMessage(
            error,
            "Could not pay the balances. Please try again."
          ),
          variant: "destructive",
        });
      })
      .finally(() => {
        setBulkPaying(false);
      });
  };

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
        description: getApiErrorMessage(
          error,
          "Could not download the file. Please try again."
        ),
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const handlePrintSelected = () => {
    if (!selectedRows.length) {
      toast({
        title: "Select containers",
        description: "Choose one or more rows to print.",
      });
      return;
    }
    const previousTitle = document.title;
    document.title = "RG-Brothers-Containers";
    window.print();
    document.title = previousTitle;
  };

  const downloadSelectedPdf = async () => {
    if (!selectedRows.length || exporting) {
      if (!selectedRows.length) {
        toast({
          title: "Select containers",
          description: "Choose one or more rows to download as PDF.",
        });
      }
      return;
    }
    setExporting("pdf");
    try {
      const response = await baseUrl.post(
        "/assignlorry/export/containers/pdf",
        { containerIds: selectedRows.map((row) => row.container._id) },
        { responseType: "blob" }
      );
      const contentType = String(response.headers["content-type"] || "");
      if (contentType.includes("application/json")) {
        throw new Error("Export failed");
      }
      const blob = new Blob([response.data], { type: contentType || "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "RG-Brothers-Containers.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast({
        title: "Export failed",
        description: getApiErrorMessage(
          error,
          "Could not download the PDF. Please try again."
        ),
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
    <div className="space-y-3 print:hidden">
      <PageHeader
        title="Assignments"
        description="Track bill of lading records, containers, and shipment status."
        className="gap-2 sm:items-center"
      >
        <Button
          variant="outline"
          onClick={() => downloadExport("pdf")}
          disabled={exporting === "pdf"}
          className="h-8"
        >
          <FileDown className="h-4 w-4" />
          {exporting === "pdf" ? "PDF..." : "PDF"}
        </Button>
        <Button
          variant="outline"
          onClick={() => downloadExport("excel")}
          disabled={exporting === "excel"}
          className="h-8"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {exporting === "excel" ? "Excel..." : "Excel"}
        </Button>
        {canManageAssignments() ? (
          <AddAssignmentDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onAdd={handleAdd}
            assignments={assignments}
            setAssignments={setAssignments}
            editingAssignment={editingAssignment}
            setEditingAssignment={setEditingAssignment}
          />
        ) : null}
      </PageHeader>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value);
          setPage(1);
          if (value === "assignments" && status === "in-progress") {
            setStatus("all");
          }
        }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row flex-wrap items-center gap-2 space-y-0 border-b border-border/70 bg-muted/30 px-3 py-2">
            <TabsList className="h-8">
              <TabsTrigger value="assignments" className="h-6 px-2.5 text-xs">
                Assignments
              </TabsTrigger>
              <TabsTrigger value="containers" className="h-6 px-2.5 text-xs">
                Containers
              </TabsTrigger>
            </TabsList>
            <AssignmentFilters
              query={query}
              onQueryChange={setQuery}
              status={status}
              onStatusChange={setStatus}
              fromDate={fromDate}
              onFromDateChange={setFromDate}
              toDate={toDate}
              onToDateChange={setToDate}
              hasFilters={hasFilters}
              placeholder={
                isContainersTab
                  ? "Search BL, container, VOC, lorry..."
                  : "Search BL, item, exporter..."
              }
              statuses={isContainersTab ? CONTAINER_STATUSES : undefined}
              balanceFilter={balanceFilter}
              onBalanceFilterChange={setBalanceFilter}
              advancedFilter={advancedFilter}
              onAdvancedFilterChange={setAdvancedFilter}
              owner={owner}
              onOwnerChange={setOwner}
              owners={ownerOptions}
              destination={destination}
              onDestinationChange={setDestination}
              destinations={destinationOptions}
              onClear={() => {
                setQuery("");
                setStatus("all");
                setFromDate("");
                setToDate("");
                setBalanceFilter("all");
                setAdvancedFilter("all");
                setOwner("all");
                setDestination("all");
                setPage(1);
              }}
            >
              <div className="ml-auto flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled={!selectedRows.length}
                  onClick={handlePrintSelected}
                >
                  <Printer className="h-4 w-4" />
                  Print
                  {selectedRows.length ? ` (${selectedRows.length})` : ""}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled={!selectedRows.length || exporting === "pdf"}
                  onClick={downloadSelectedPdf}
                >
                  <FileDown className="h-4 w-4" />
                  {exporting === "pdf" && selectedRows.length
                    ? "PDF..."
                    : "PDF"}
                  {selectedRows.length && exporting !== "pdf"
                    ? ` (${selectedRows.length})`
                    : ""}
                </Button>
                {canPay ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={!payableSelectedRows.length}
                    onClick={() => {
                      setBulkPayDate(todayDateInput());
                      setIsBulkPayOpen(true);
                    }}
                  >
                    <Banknote className="h-4 w-4" />
                    Pay selected
                    {payableSelectedRows.length
                      ? ` (${payableSelectedRows.length})`
                      : ""}
                  </Button>
                ) : null}
                <Badge variant="secondary">{listTotal}</Badge>
              </div>
            </AssignmentFilters>
          </CardHeader>
          <CardContent className="p-0">
            <TabsContent value="assignments" className="mt-0">
              <AssignmentTable
                assignments={paged}
                total={filtered.length}
                hasFilters={hasFilters}
                page={currentPage}
                pages={pages}
                pageSize={pageSize}
                onPageChange={setPage}
                selectedIds={selectedIds}
                onSelect={toggleSelected}
                onSelectPage={toggleSelectPage}
              />
            </TabsContent>
            <TabsContent value="containers" className="mt-0">
              <ContainerListTable
                rows={pagedContainers}
                total={filteredContainers.length}
                hasFilters={hasFilters}
                page={currentPage}
                pages={pages}
                pageSize={pageSize}
                onPageChange={setPage}
                canSelect
                selectedIds={selectedIds}
                onSelect={toggleSelected}
                onSelectPage={toggleSelectPage}
              />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <Dialog open={isBulkPayOpen} onOpenChange={setIsBulkPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay selected balances</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
              {payableSelectedRows.map((row) => (
                <div
                  key={row.container._id}
                  className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono font-semibold">
                      {row.container.containerNo || "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      BL {row.assignment.blNo || "—"} · Lorry{" "}
                      {containerLorry(row.container)}
                      {containerCapacity(row.container)
                        ? ` · ${containerCapacity(row.container)} ft`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold">
                    {formatMoney(containerBalance(row.container))}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">{formatMoney(selectedTotal)}</span>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={bulkPayDate}
                onChange={(e) => setBulkPayDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBulkPayOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleBulkPay}
                disabled={
                  bulkPaying || !payableSelectedRows.length || !bulkPayDate
                }
              >
                {bulkPaying ? "Paying..." : "Pay"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    <ContainerListPrint rows={selectedRows} />
    </>
  );
};
