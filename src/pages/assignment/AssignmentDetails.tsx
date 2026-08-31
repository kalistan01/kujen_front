import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Package, Printer, Trash2, Plus, ArrowLeft, FileDown, FileSpreadsheet, Banknote, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import Containers from "./components/Containers";
import Summary from "./components/Summary";
import Record from "./components/Record";
import BasicInfo from "./components/BasicInfo";
import AddContainer from "./components/AddContainer";
import { StatusBadge } from "@/components/StatusBadge";
import AssignmentPrint from "./components/AssignmentPrint";
import AssignmentLogs from "./components/AssignmentLogs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  containerBalance,
  formatMoney,
  todayDateInput,
  type HeldUpRateOption,
} from "./lib/financials";
import { can, canEditField, canManageAssignments, P } from "@/lib/permissions";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";

const AssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const canManage = canManageAssignments();

  const loadAssignment = () => {
    if (!id) return;
    baseUrl
      .get("/assignlorry/" + id)
      .then(async (response) => {
        setLoadError(null);
        setAssignment(response.data.data);
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
    if (payload.data) setAssignment(payload.data);
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
      link.download = `RG-Brothers-BL-${assignment?.blNo || id}.${ext}`;
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
    const previousTitle = document.title;
    document.title = `RG Brothers Logistics - BL ${assignment?.blNo || ""}`.trim();
    const style = document.createElement("style");
    style.setAttribute("data-print-page", "");
    style.textContent =
      "@media print { @page { size: A4 landscape; margin: 8mm; } }";
    document.head.appendChild(style);
    let restored = false;
    const restorePage = () => {
      if (restored) return;
      restored = true;
      document.title = previousTitle;
      style.remove();
    };
    let finished = false;
    const finishPrint = () => {
      if (finished) return;
      finished = true;
      restorePage();
      window.removeEventListener("afterprint", finishPrint);
      setPrintOnlyIds(null);
      onDone?.();
    };
    window.addEventListener("afterprint", finishPrint);
    window.print();
    window.setTimeout(restorePage, 1500);
    window.setTimeout(finishPrint, 120000);
  };

  const displayAssignment = assignment;

  const containers = displayAssignment?.containers || [];
  const payableContainers = containers.filter(
    (c: any) => c?._id && containerBalance(c) > 0
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
      .then((response) => {
        const paidAssignment = response.data?.data;
        if (paidAssignment) setAssignment(paidAssignment);
        toast({
          title: "Balances paid",
          description: `${selectedContainers.length} container${
            selectedContainers.length === 1 ? "" : "s"
          } · ${formatMoney(selectedTotal)}`,
        });
        setIsBulkPayOpen(false);
        setSelectedIds([]);
        if (andPrint) {
          setPrintOnlyIds(paidIds);
          window.setTimeout(() => {
            handlePrint(() => loadAssignment());
          }, 250);
        } else {
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
            onClick={() => navigate("/assignments")}
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/assignments")}
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
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <BasicInfo
            assignment={assignment}
            isBasicDialogOpen={isBasicDialogOpen}
            setIsBasicDialogOpen={setIsBasicDialogOpen}
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
              <div className="flex items-center gap-3">
                {payableContainers.length && canManage && canEditField("balancePaid") ? (
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
                  Containers ({assignment?.containers?.length || 0})
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {payableContainers.length && canManage && canEditField("balancePaid") ? (
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
                {canManage ? (
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
                  <AddContainer setIsDialogOpen={setIsDialogOpen} />
                </DialogContent>
              </Dialog>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              {containers.length ? (
                containers.map((container: any, index: number) => (
                  <Containers
                    key={container._id || index}
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
                    selected={selectedIds.includes(container._id)}
                    onSelect={toggleSelected}
                  />
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No containers added yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:z-20 lg:self-start print:static">
          <Summary assignment={displayAssignment} />
          <Record assignment={displayAssignment} />
        </div>
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
                      Lorry {c.lorryNum || "Unassigned"}
                      {c.capacity ? ` · ${c.capacity} ft` : ""}
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
    </>
  );
};

export default AssignmentDetails;
