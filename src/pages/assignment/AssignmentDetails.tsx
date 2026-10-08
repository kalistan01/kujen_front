import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Package, Printer, Trash2, Plus, ArrowLeft, ArrowUp, FileDown, FileSpreadsheet, Banknote, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { brand, brandFile } from "@/lib/brand";
import baseUrl from "@/api/baseUrl";
import Containers from "./components/Containers";
import Summary from "./components/Summary";
import Record from "./components/Record";
import BasicInfo from "./components/BasicInfo";
import AddContainer from "./components/AddContainer";
import { StatusBadge } from "@/components/StatusBadge";
import AssignmentPrint from "./components/AssignmentPrint";
import AssignmentLogs from "./components/AssignmentLogs";
import AssignmentFilters from "./components/AssignmentFilters";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  containerBalance,
  formatMoney,
  todayDateInput,
  toAmount,
  type HeldUpRateOption,
} from "./lib/financials";
import {
  containerBuyerMatches,
  containerBuyerOption,
  containerCapacity,
  containerDestinationMatches,
  containerDestinationOption,
  containerIsToYard,
  containerLorry,
  containerMatchesOwner,
  containerOwner,
  containerOwnerKey,
  containerSourceId,
  containersGroupedByYardTrip,
  mergePopulatedAssignment,
} from "./lib/containerDisplay";
import { can, canEditField, canEditAssignments, canViewContainers, canAddContainers, canEditContainers, P } from "@/lib/permissions";
import { isAdminUser } from "@/lib/auth";
import { scopeAssignmentContainers } from "@/lib/lorryScope";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";
import {
  containerAfterPayment,
  nextPaint,
  openPrintDialog,
  whenDialogClosed,
} from "./lib/printPage";

const CONTAINER_STATUSES = [
  { value: "all", label: "All status" },
  { value: "advanced", label: "Advanced" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const AssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const listPath =
    typeof location.state === "object" &&
    location.state &&
    "from" in location.state &&
    typeof (location.state as { from?: unknown }).from === "string"
      ? (location.state as { from: string }).from
      : "/assignments";
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBasicDialogOpen, setIsBasicDialogOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [assignment, setAssignment] = useState<any | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [heldUpRates, setHeldUpRates] = useState<HeldUpRateOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkPayOpen, setIsBulkPayOpen] = useState(false);
  const [bulkPayDate, setBulkPayDate] = useState(todayDateInput());
  const [bulkPaying, setBulkPaying] = useState<"pay" | "print" | false>(false);
  const [printOnlyIds, setPrintOnlyIds] = useState<string[] | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [advancedFilter, setAdvancedFilter] = useState("all");
  const [owner, setOwner] = useState("all");
  const [destination, setDestination] = useState<string[]>([]);
  const [buyer, setBuyer] = useState<string[]>([]);
  const [containerOut, setContainerOut] = useState<string[]>([]);
  const [yardFilter, setYardFilter] = useState("all");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 280);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const canManage = canEditAssignments();
  const canSeeContainers = canViewContainers();
  const canCreateContainer = canAddContainers();
  const canChangeContainers = canEditContainers();

  const patchLocalContainer = (containerId: string, patch: Record<string, unknown>) => {
    setAssignment((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        containers: (previous.containers || []).map((container: any) =>
          String(container?._id) === String(containerId)
            ? { ...container, ...patch }
            : container
        ),
      };
    });
  };

  const loadAssignment = () => {
    if (!id) return;
    baseUrl
      .get("/assignlorry/" + id)
      .then(async (response) => {
        setLoadError(null);
        setAssignment(scopeAssignmentContainers(response.data.data));
      })
      .catch((error) => {
        setAssignment(null);
        const description = getApiErrorMessage(
          error,
          "Could not load this assignment. Please try again."
        );
        setLoadError(description);
        toast({
          title: "Unable to load assignment",
          description,
          variant: "destructive",
        });
      });
  };

  useEffect(() => {
    setAssignment(null);
    setLoadError(null);
  }, [id]);

  useEffect(() => {
    loadAssignment();
  }, [id, isDialogOpen, isBasicDialogOpen, open]);

  useEffect(() => {
    baseUrl
      .get("/heldup")
      .then((response) => {
        setHeldUpRates(response.data?.data || []);
      })
      .catch(() => {
        setHeldUpRates([]);
      });
  }, []);

  useEntitySync("assignment", (payload) => {
    if (String(payload.id) !== String(id)) return;
    if (payload.action === "deleted") {
      navigate("/assignments", { replace: true });
      return;
    }
    if (payload.data) setAssignment(scopeAssignmentContainers(payload.data));
  });

  useEntitySync("heldup", (payload) => {
    setHeldUpRates((prev) => {
      if (payload.action === "created" && payload.data) {
        return [
          payload.data,
          ...prev.map((item) => ({ ...item, status: false })),
        ];
      }
      return upsertById(prev, payload);
    });
  });

  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const downloadExport = async (type: "pdf" | "excel") => {
    if (!id || exporting) return;
    setExporting(type);
    try {
      const response = await baseUrl.get(`/assignlorry/${id}/export/${type}`, {
        responseType: "blob",
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
      link.download = `${brandFile(`BL-${assignment?.blNo || id}`)}.${ext}`;
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

  const handlePrint = (onDone?: () => void) => {
    openPrintDialog(
      `${brand.name} - BL ${assignment?.blNo || ""}`.trim(),
      () => {
        setPrintOnlyIds(null);
        onDone?.();
      }
    );
  };

  const displayAssignment = assignment;

  const containers = displayAssignment?.containers || [];
  const ownerOptions = useMemo(() => {
    const names = new Map<string, string>();
    containers.forEach((container: any) => {
      const label = containerOwner(container);
      const value =
        container.lorryId?.owner?._id ||
        container.lorryId?.owner ||
        containerOwnerKey(container);
      if (value && label && label !== "—") {
        names.set(String(value), String(label).toUpperCase());
      }
    });
    return [...names.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [containers]);
  const destinationOptions = useMemo(() => {
    const items = new Map<string, string>();
    containers.forEach((container: any) => {
      const option = containerDestinationOption(container);
      if (option?.value) items.set(option.value, option.label);
    });
    return [...items.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [containers]);
  const buyerOptions = useMemo(() => {
    const items = new Map<string, string>();
    containers.forEach((container: any) => {
      const option = containerBuyerOption(container);
      if (option?.value) items.set(option.value, option.label);
    });
    return [...items.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [containers]);
  const hasContainerFilters = Boolean(
    query.trim() ||
      statusFilter !== "all" ||
      balanceFilter !== "all" ||
      advancedFilter !== "all" ||
      owner !== "all" ||
      destination.length ||
      buyer.length ||
      containerOut.length ||
      yardFilter !== "all"
  );
  const filteredContainers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return containers.filter((container: any) => {
      if (statusFilter !== "all" && (container.status || "pending") !== statusFilter) {
        return false;
      }
      if (balanceFilter === "unpaid" && containerBalance(container) <= 0) return false;
      if (advancedFilter === "yes" && toAmount(container?.advanced) <= 0) return false;
      if (owner !== "all" && !containerMatchesOwner(container, owner)) return false;
      if (
        destination.length > 0 &&
        !destination.some((value) => containerDestinationMatches(container, value))
      ) {
        return false;
      }
      if (
        buyer.length > 0 &&
        !buyer.some((value) => containerBuyerMatches(container, value))
      ) {
        return false;
      }
      if (
        containerOut.length > 0 &&
        !containerOut.includes(String(container?.containerOut || ""))
      ) {
        return false;
      }
      if (yardFilter === "yes" && !containerIsToYard(container, containers)) return false;
      if (yardFilter === "no" && containerIsToYard(container, containers)) return false;
      if (q && !String(container.containerNo || "").toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [
    containers,
    query,
    statusFilter,
    balanceFilter,
    advancedFilter,
    owner,
    destination,
    buyer,
    containerOut,
    yardFilter,
  ]);
  const clearModalFilters = () => {
    setStatusFilter("all");
    setBalanceFilter("all");
    setAdvancedFilter("all");
    setOwner("all");
    setDestination([]);
    setBuyer([]);
    setContainerOut([]);
    setYardFilter("all");
  };
  const clearContainerFilters = () => {
    setQuery("");
    clearModalFilters();
  };
  const containerGroups = containersGroupedByYardTrip(filteredContainers);
  const onwardSourceIds = new Set(
    containers
      .map((container: any) => containerSourceId(container))
      .filter(Boolean)
  );
  const payableContainers = filteredContainers.filter(
    (c: any) =>
      c?._id &&
      containerBalance(c) > 0 &&
      (c.status !== "completed" || isAdminUser())
  );
  const selectedContainers = payableContainers.filter((c: any) =>
    selectedIds.includes(c._id)
  );
  const selectedTotal = selectedContainers.reduce(
    (sum: number, c: any) => sum + containerBalance(c),
    0
  );
  const allPayableSelected =
    payableContainers.length > 0 &&
    payableContainers.every((c: any) => selectedIds.includes(c._id));

  const toggleSelected = (containerId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked
        ? prev.includes(containerId)
          ? prev
          : [...prev, containerId]
        : prev.filter((id) => id !== containerId)
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? payableContainers.map((c: any) => c._id) : []);
  };

  const handleBulkPay = (andPrint = false) => {
    if (!id || bulkPaying || !selectedContainers.length) return;
    const paidIds = selectedContainers.map((c: any) => String(c._id));
    setBulkPaying(andPrint ? "print" : "pay");
    baseUrl
      .patch(`/assignlorry/${id}/pay-balances`, {
        containerIds: paidIds,
        balanceDate: bulkPayDate || todayDateInput(),
      })
      .then(async (response) => {
        const paidAssignment = response.data?.data;
        const balanceDate = bulkPayDate || todayDateInput();
        setAssignment((prev) => {
          const merged = mergePopulatedAssignment(prev, paidAssignment);
          if (!merged) return merged;
          return {
            ...merged,
            containers: (merged.containers || []).map((container: any) => {
              if (!paidIds.includes(String(container?._id))) return container;
              const previous = (prev?.containers || []).find(
                (item: any) => String(item?._id) === String(container?._id)
              );
              return containerAfterPayment(previous, container, balanceDate);
            }),
          };
        });
        toast({
          title: "Balances paid",
          description: `${selectedContainers.length} container${
            selectedContainers.length === 1 ? "" : "s"
          } · ${formatMoney(selectedTotal)}`,
        });
        setSelectedIds([]);
        if (andPrint) {
          setPrintOnlyIds(paidIds);
          setIsBulkPayOpen(false);
          await whenDialogClosed();
          await nextPaint();
          handlePrint(() => loadAssignment());
        } else {
          setIsBulkPayOpen(false);
          loadAssignment();
        }
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

  const resetDeleteForm = () => {
    setAdminEmail("");
    setAdminPassword("");
    setShowAdminPassword(false);
    setDeleting(false);
  };

  const handleDeleteDialog = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) resetDeleteForm();
  };

  const confrimDelete = () => {
    if (!id || !adminEmail.trim() || !adminPassword || deleting) return;
    setDeleting(true);
    baseUrl
      .delete("/assignlorry/" + id, {
        data: {
          email: adminEmail.trim(),
          password: adminPassword,
        },
      })
      .then(async () => {
        setIsEditDialogOpen(false);
        resetDeleteForm();
        toast({
          title: "Assignment Deleted",
          description: "Assignment has been successfully deleted.",
          variant: "destructive",
        });
        navigate("/assignments");
      })
      .catch((error) => {
        toast({
          title: "Delete failed",
          description: getApiErrorMessage(
            error,
            "Could not delete the assignment. Please try again."
          ),
          variant: "destructive",
        });
      })
      .finally(() => {
        setDeleting(false);
      });
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(listPath)}
            className="h-9 w-9 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Assignment not found</h1>
            <p className="text-sm text-muted-foreground">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4 print:hidden">
      <div className="sticky top-[calc(3rem+1px)] z-[28] -mx-3 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-3 py-2.5 backdrop-blur-xl lg:-mx-3.5 lg:px-3.5 print:static print:mx-0 print:border-0 print:bg-transparent print:px-0 print:py-0">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(listPath)}
            className="h-9 w-9 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold tracking-tight">
                {assignment?.blNo || "Assignment"}
              </h1>
              <StatusBadge status={assignment?.status} />
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {assignment?.item || "—"}
            </p>
          </div>
        </div>
        <div className="flex flex-nowrap items-center justify-end gap-2">
          {canSeeContainers ? (
            <AssignmentFilters
              className="w-auto shrink-0 flex-nowrap"
              query={query}
              onQueryChange={setQuery}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              statuses={CONTAINER_STATUSES}
              fromDate=""
              onFromDateChange={() => undefined}
              toDate=""
              onToDateChange={() => undefined}
              showDates={false}
              filtersInModal
              hasFilters={hasContainerFilters}
              onClear={clearContainerFilters}
              onClearModal={clearModalFilters}
              placeholder="Search container number"
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
              buyer={buyer}
              onBuyerChange={setBuyer}
              buyers={buyerOptions}
              containerOut={containerOut}
              onContainerOutChange={setContainerOut}
              yardFilter={yardFilter}
              onYardFilterChange={setYardFilter}
            />
          ) : null}
          {canSeeContainers ? (
            <span
              aria-hidden
              className="mx-4 h-6 w-px shrink-0 bg-border"
            />
          ) : null}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePrint()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadExport("pdf")}
              disabled={!assignment || exporting === "pdf"}
            >
              <FileDown className="h-4 w-4" />
              {exporting === "pdf" ? "PDF..." : "PDF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadExport("excel")}
              disabled={!assignment || exporting === "excel"}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exporting === "excel" ? "Excel..." : "Excel"}
            </Button>
            {canManage ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <BasicInfo
            assignment={assignment}
            isBasicDialogOpen={isBasicDialogOpen}
            setIsBasicDialogOpen={setIsBasicDialogOpen}
            onSaved={(patch: Record<string, unknown>) =>
              setAssignment((previous: any) =>
                previous ? { ...previous, ...patch } : previous
              )
            }
          />

          {canSeeContainers ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
              <div className="flex items-center gap-3">
                {payableContainers.length && canChangeContainers && canEditField("balancePaid") ? (
                  <Checkbox
                    checked={allPayableSelected}
                    onCheckedChange={(checked) =>
                      toggleSelectAll(Boolean(checked))
                    }
                    aria-label="Select all containers with balance"
                  />
                ) : null}
                <CardTitle className="flex items-center text-base">
                  <Package className="mr-2 h-4 w-4 text-amber-600" />
                  Containers ({hasContainerFilters
                    ? `${filteredContainers.length} of ${assignment?.containerCount ?? containers.length}`
                    : assignment?.containerCount ?? containers.length})
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {payableContainers.length && canChangeContainers && canEditField("balancePaid") ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!selectedContainers.length}
                    onClick={() => {
                      setBulkPayDate(todayDateInput());
                      setIsBulkPayOpen(true);
                    }}
                  >
                    <Banknote className="h-4 w-4" />
                    Pay selected
                    {selectedContainers.length
                      ? ` (${selectedContainers.length})`
                      : ""}
                  </Button>
                ) : null}
                {canCreateContainer ? (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Container
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Add Container</DialogTitle>
                  </DialogHeader>
                  <AddContainer
                    setIsDialogOpen={setIsDialogOpen}
                    onSaved={loadAssignment}
                  />
                </DialogContent>
              </Dialog>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              {containerGroups.length ? (
                containerGroups.map((group: any[], groupIndex: number) => (
                  <div
                    key={group.map((container) => container._id).join("-") || groupIndex}
                    className={
                      group.length > 1
                        ? "space-y-3 rounded-xl border border-[hsl(var(--brand-navy))]/20 bg-[hsl(var(--brand-navy))]/5 p-2"
                        : undefined
                    }
                  >
                    {group.map((container: any, index: number) => (
                      <Containers
                        key={container._id || `${groupIndex}-${index}`}
                        container={container}
                        heldUpRates={heldUpRates}
                        setOpen={setOpen}
                        onPaid={() => {
                          setSelectedIds((prev) =>
                            prev.filter((cid) => cid !== container._id)
                          );
                          loadAssignment();
                        }}
                        onChanged={loadAssignment}
                        onLocalUpdate={patchLocalContainer}
                        selected={selectedIds.includes(container._id)}
                        onSelect={toggleSelected}
                        hasOnwardTrip={onwardSourceIds.has(String(container._id))}
                        fclDueDate={assignment?.fclDueDate}
                      />
                    ))}
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {hasContainerFilters
                    ? "No containers match these filters."
                    : "No containers added yet."}
                </p>
              )}
            </CardContent>
          </Card>
          ) : null}
        </div>

        {canSeeContainers ? (
        <div className="space-y-4 lg:sticky lg:top-32 lg:z-20 lg:self-start print:static">
          <Summary assignment={displayAssignment} />
          <Record assignment={displayAssignment} />
        </div>
        ) : null}
      </div>

      {can(P.LOGS_VIEW) ? (
        <AssignmentLogs
          assignmentId={id}
          refreshKey={assignment?.updatedAt}
        />
      ) : null}

      <Dialog open={isBulkPayOpen} onOpenChange={setIsBulkPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay selected balances</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
              {selectedContainers.map((c: any) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono font-semibold">
                      {c.containerNo || "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Lorry {containerLorry(c)}
                      {containerCapacity(c)
                        ? ` · ${containerCapacity(c)} ft`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold">
                    {formatMoney(containerBalance(c))}
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
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBulkPayOpen(false)}
                disabled={Boolean(bulkPaying)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleBulkPay(false)}
                disabled={
                  Boolean(bulkPaying) ||
                  !selectedContainers.length ||
                  !bulkPayDate
                }
              >
                {bulkPaying === "pay" ? "Paying..." : "Pay"}
              </Button>
              <Button
                type="button"
                onClick={() => handleBulkPay(true)}
                disabled={
                  Boolean(bulkPaying) ||
                  !selectedContainers.length ||
                  !bulkPayDate
                }
              >
                <Printer className="h-4 w-4" />
                {bulkPaying === "print" ? "Paying..." : "Pay and Print"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={handleDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the assignment and cannot be undone.
            An administrator must confirm with their email and password.
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Admin email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="off"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={deleting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Admin password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showAdminPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="pr-10"
                  disabled={deleting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                  onClick={() => setShowAdminPassword((open) => !open)}
                  disabled={deleting}
                >
                  {showAdminPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confrimDelete()}
              disabled={
                deleting || !adminEmail.trim() || !adminPassword
              }
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    {displayAssignment && (
      <AssignmentPrint
        assignment={displayAssignment}
        containerIds={printOnlyIds}
        title={printOnlyIds?.length ? "Balance payment" : undefined}
      />
    )}
    {showScrollTop ? (
      <Button
        type="button"
        size="icon"
        className="fixed bottom-5 right-5 z-40 h-10 w-10 rounded-full shadow-lg print:hidden"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    ) : null}
    </>
  );
};

export default AssignmentDetails;
