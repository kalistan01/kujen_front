import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import { can, P } from "@/lib/permissions";
import {
  formatMoney,
  todayDateInput,
  toAmount,
  toDateInput,
} from "../lib/financials";
import { compressUpload } from "../lib/compressFile";

type OtStatus = "pending" | "paid" | "approved";

type OtReceipt = {
  _id: string;
  date?: string;
  amount?: number;
  lorryOwnerId?: string;
  lorryOwnerName?: string;
  containerIds?: string[];
  containerNos?: string[];
  status?: OtStatus;
  originalName?: string;
  mimeType?: string;
  size?: number;
  storageKey?: string;
  hasFile?: boolean;
};

type AssignmentContainer = {
  _id?: string;
  containerNo?: string;
  owner?: string | { _id?: string };
  lorryOwner?: string;
  lorryId?: {
    owner?: string | { _id?: string; ownerName?: string; companyName?: string };
  };
};

type OwnerOption = {
  id: string;
  name: string;
};

const STATUS_OPTIONS: { value: OtStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "approved", label: "Approved" },
];

function ownerIdOf(container: AssignmentContainer) {
  const raw =
    container.owner ||
    (typeof container.lorryId?.owner === "object"
      ? container.lorryId.owner?._id
      : container.lorryId?.owner);
  if (!raw) return "";
  if (typeof raw === "object") return String((raw as { _id?: string })._id || "");
  return String(raw);
}

function ownerNameOf(container: AssignmentContainer) {
  if (container.lorryOwner) return String(container.lorryOwner);
  const owner = container.lorryId?.owner;
  if (owner && typeof owner === "object") {
    return String(owner.ownerName || owner.companyName || "");
  }
  return "";
}

function hasReceiptFile(receipt: OtReceipt) {
  return Boolean(receipt.hasFile || receipt.storageKey || receipt.mimeType);
}

function isImageMime(mimeType?: string) {
  return String(mimeType || "").toLowerCase().startsWith("image/");
}

function isPdfMime(mimeType?: string) {
  return String(mimeType || "").toLowerCase().includes("pdf");
}

type FilePreview = {
  url: string;
  name: string;
  mimeType: string;
};

function ownerIdValue(value: unknown) {
  if (!value) return "";
  if (typeof value === "object") {
    return String((value as { _id?: string })._id || "");
  }
  return String(value);
}

function OtReceipts({
  assignment,
  onAssignmentPatch,
}: {
  assignment: any;
  onAssignmentPatch?: (patch: Record<string, unknown>) => void;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const canAdd = can(P.OT_RECEIPTS_ADD);
  const canEdit = can(P.OT_RECEIPTS_EDIT);
  const canView =
    can(P.OT_RECEIPTS_VIEW) || canAdd || canEdit;

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState("");
  const [date, setDate] = useState(todayDateInput());
  const [amount, setAmount] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [containerIds, setContainerIds] = useState<string[]>([]);
  const [status, setStatus] = useState<OtStatus>("pending");
  const [file, setFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState("");
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const assignmentId = String(assignment?._id || "");

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);
  const receipts: OtReceipt[] = Array.isArray(assignment?.otReceipts)
    ? assignment.otReceipts
    : [];
  const otTotal = useMemo(
    () => receipts.reduce((sum, item) => sum + toAmount(item.amount), 0),
    [receipts]
  );
  const isEditing = Boolean(editingId);

  const containers: AssignmentContainer[] = useMemo(
    () =>
      (Array.isArray(assignment?.containers) ? assignment.containers : []).filter(
        (item: AssignmentContainer) => item && item._id && item.containerNo
      ),
    [assignment?.containers]
  );

  const owners: OwnerOption[] = useMemo(() => {
    const map = new Map<string, string>();
    for (const container of containers) {
      const id = ownerIdOf(container);
      if (!id) continue;
      if (!map.has(id)) map.set(id, ownerNameOf(container) || "Unknown owner");
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [containers]);

  const containerOptions = useMemo(() => {
    if (!ownerId) return containers;
    return containers.filter((item) => ownerIdOf(item) === ownerId);
  }, [containers, ownerId]);

  if (!canView) return null;

  const resetForm = () => {
    setEditingId("");
    setDate(todayDateInput());
    setAmount("");
    setOwnerId("");
    setContainerIds([]);
    setStatus("pending");
    setFile(null);
    setExistingFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const openAddModal = () => {
    resetForm();
    setOpen(true);
  };

  const openEditModal = (receipt: OtReceipt) => {
    setEditingId(String(receipt._id));
    setDate(toDateInput(receipt.date) || todayDateInput());
    setAmount(
      receipt.amount == null || Number.isNaN(Number(receipt.amount))
        ? ""
        : String(receipt.amount)
    );
    setOwnerId(ownerIdValue(receipt.lorryOwnerId));
    setContainerIds(
      (receipt.containerIds || []).map((id) => String(id)).filter(Boolean)
    );
    setStatus((receipt.status as OtStatus) || "pending");
    setFile(null);
    setExistingFileName(receipt.originalName || "");
    if (fileRef.current) fileRef.current.value = "";
    setOpen(true);
  };

  const onOwnerChange = (nextOwnerId: string) => {
    setOwnerId(nextOwnerId);
    setContainerIds((prev) =>
      prev.filter((id) => {
        const container = containers.find((item) => String(item._id) === id);
        return container ? ownerIdOf(container) === nextOwnerId : false;
      })
    );
  };

  const toggleContainer = (containerId: string, checked: boolean) => {
    const container = containers.find((item) => String(item._id) === containerId);
    if (!container) return;
    const nextOwner = ownerIdOf(container);
    if (!nextOwner) {
      toast({
        title: "Missing owner",
        description: "This container has no lorry owner assigned.",
        variant: "destructive",
      });
      return;
    }

    if (checked) {
      if (ownerId && ownerId !== nextOwner) {
        toast({
          title: "Different owner",
          description: "Select containers from the same lorry owner only.",
          variant: "destructive",
        });
        return;
      }
      setOwnerId(nextOwner);
      setContainerIds((prev) =>
        prev.includes(containerId) ? prev : [...prev, containerId]
      );
      return;
    }

    const nextIds = containerIds.filter((id) => id !== containerId);
    setContainerIds(nextIds);
    if (!nextIds.length) setOwnerId("");
  };

  const submit = async () => {
    if (!assignmentId || saving) return;
    const parsedAmount = toAmount(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0 || amount === "") {
      toast({
        title: "Amount required",
        description: "Enter a valid amount.",
        variant: "destructive",
      });
      return;
    }
    if (!ownerId) {
      toast({
        title: "Owner required",
        description: "Select a lorry owner or a container.",
        variant: "destructive",
      });
      return;
    }
    if (!containerIds.length) {
      toast({
        title: "Containers required",
        description: "Select at least one container.",
        variant: "destructive",
      });
      return;
    }
    if (!isEditing && !file) {
      toast({
        title: "File required",
        description: "Upload an image or PDF receipt.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        date,
        amount: parsedAmount,
        lorryOwnerId: ownerId,
        containerIds,
        status,
      };
      if (file) {
        const prepared = await compressUpload(file, 0, { kind: "document" });
        payload.name = prepared.name;
        payload.mimeType = prepared.mimeType;
        payload.data = prepared.data;
      }

      if (isEditing) {
        const response = await baseUrl.patch(
          `assignlorry/${assignmentId}/ot-receipts/${editingId}`,
          payload
        );
        const updated = response.data?.data as OtReceipt | undefined;
        if (updated?._id) {
          onAssignmentPatch?.({
            otReceipts: receipts.map((item) =>
              String(item._id) === String(editingId)
                ? { ...item, ...updated }
                : item
            ),
          });
        }
        toast({
          title: "OT receipt updated",
          description: "The receipt changes are saved.",
        });
      } else {
        const response = await baseUrl.post(
          `assignlorry/${assignmentId}/ot-receipts`,
          payload
        );
        const created = response.data?.data as OtReceipt | undefined;
        if (created?._id) {
          onAssignmentPatch?.({
            otReceipts: [...receipts, created],
          });
        }
        toast({
          title: "OT receipt added",
          description: "The receipt is saved on this assignment.",
        });
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: isEditing
          ? "Could not update OT receipt"
          : "Could not add OT receipt",
        description: getApiErrorMessage(
          error,
          error instanceof Error
            ? error.message
            : "Could not save the OT receipt. Please try again."
        ),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (receiptId: string, next: OtStatus) => {
    if (!assignmentId || !canEdit || statusBusyId) return;
    const previousStatus =
      receipts.find((item) => String(item._id) === String(receiptId))?.status ||
      "pending";
    onAssignmentPatch?.({
      otReceipts: receipts.map((item) =>
        String(item._id) === String(receiptId)
          ? { ...item, status: next }
          : item
      ),
    });
    setStatusBusyId(receiptId);
    try {
      const response = await baseUrl.patch(
        `assignlorry/${assignmentId}/ot-receipts/${receiptId}`,
        {
          status: next,
        }
      );
      const updated = response.data?.data as OtReceipt | undefined;
      if (updated?._id) {
        onAssignmentPatch?.({
          otReceipts: receipts.map((item) =>
            String(item._id) === String(receiptId)
              ? { ...item, ...updated }
              : item
          ),
        });
      }
      toast({
        title: "Status updated",
        description: `OT receipt marked as ${next}.`,
      });
    } catch (error) {
      onAssignmentPatch?.({
        otReceipts: receipts.map((item) =>
          String(item._id) === String(receiptId)
            ? { ...item, status: previousStatus }
            : item
        ),
      });
      toast({
        title: "Could not update status",
        description: getApiErrorMessage(
          error,
          "Could not update the OT receipt status."
        ),
        variant: "destructive",
      });
    } finally {
      setStatusBusyId("");
    }
  };

  const closePreview = () => {
    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const openFile = async (receipt: OtReceipt) => {
    if (!assignmentId || !hasReceiptFile(receipt) || previewLoading) return;
    setPreviewLoading(true);
    try {
      const response = await baseUrl.get(
        `assignlorry/${assignmentId}/ot-receipts/${receipt._id}/file`,
        { responseType: "blob" }
      );
      const blob = response.data as Blob;
      if (blob.type.includes("json")) {
        throw new Error("Could not open this file.");
      }
      const mimeType = receipt.mimeType || blob.type || "application/octet-stream";
      const url = URL.createObjectURL(blob);
      if (isImageMime(mimeType) || isPdfMime(mimeType)) {
        setPreview((current) => {
          if (current?.url) URL.revokeObjectURL(current.url);
          return {
            url,
            name: receipt.originalName || "OT receipt",
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
    <>
      <Card className="border-[hsl(var(--brand-navy))]/20 bg-[hsl(var(--brand-navy))]/8 shadow-sm dark:border-white/10 dark:bg-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
          <CardTitle className="text-base">OT RECEIPT</CardTitle>
          {canAdd ? (
            <Button type="button" size="sm" onClick={openAddModal}>
              <Plus className="mr-1 h-4 w-4" />
              ADD OT
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          {receipts.length ? (
            <>
              {receipts.map((receipt) => (
                <div
                  key={String(receipt._id)}
                  className="space-y-2 rounded-md border border-border/70 bg-background/70 p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {formatMoney(receipt.amount)} · {receipt.date || "—"}
                      </p>
                      <p className="text-muted-foreground">
                        {receipt.lorryOwnerName || "—"}
                      </p>
                      <p className="text-muted-foreground">
                        {(receipt.containerNos || []).filter(Boolean).join(", ") ||
                          "—"}
                      </p>
                      {hasReceiptFile(receipt) ? (
                        <button
                          type="button"
                          className="text-left text-xs font-medium text-[hsl(var(--brand-navy))] underline-offset-2 hover:underline"
                          onClick={() => openFile(receipt)}
                        >
                          {receipt.originalName || "View file"}
                        </button>
                      ) : null}
                    </div>
                    <div className="flex min-w-[120px] flex-col items-end gap-2">
                      {canEdit ? (
                        <>
                          <Select
                            value={receipt.status || "pending"}
                            disabled={statusBusyId === String(receipt._id)}
                            onValueChange={(value) =>
                              updateStatus(String(receipt._id), value as OtStatus)
                            }
                          >
                            <SelectTrigger className="h-8">
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
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => openEditModal(receipt)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </>
                      ) : (
                        <p className="text-right capitalize text-muted-foreground">
                          {receipt.status || "pending"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border/70 pt-3 text-sm">
                <span className="font-medium text-muted-foreground">OT Total</span>
                <span className="font-bold">{formatMoney(otTotal)}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No OT receipts yet.</p>
          )}
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

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (saving) return;
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit OT" : "Add OT"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="ot-date">Date</Label>
              <Input
                id="ot-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ot-file">File</Label>
              <Input
                id="ot-file"
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <p className="text-xs text-muted-foreground">{file.name}</p>
              ) : existingFileName ? (
                <p className="text-xs text-muted-foreground">
                  Current file: {existingFileName}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ot-amount">Amount</Label>
              <Input
                id="ot-amount"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Lorry owner</Label>
              <Select
                value={ownerId || undefined}
                onValueChange={onOwnerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lorry owner" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Container numbers</Label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-border p-2">
                {containerOptions.length ? (
                  containerOptions.map((container) => {
                    const id = String(container._id);
                    const checked = containerIds.includes(id);
                    return (
                      <label
                        key={id}
                        className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            toggleContainer(id, value === true)
                          }
                        />
                        <span>{container.containerNo}</span>
                      </label>
                    );
                  })
                ) : (
                  <p className="px-1 py-2 text-sm text-muted-foreground">
                    {ownerId
                      ? "No containers for this owner."
                      : "No containers on this assignment."}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Select containers first to auto-fill the lorry owner.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as OtStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={submit}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default OtReceipts;
