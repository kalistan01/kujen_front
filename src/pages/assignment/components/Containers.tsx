import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Banknote, Edit } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import baseUrl from "@/api/baseUrl";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { useParams } from "react-router-dom";
import EditContainer from "./EditContainer";
import {
  containerChargesTotal,
  formatMoney,
  todayDateInput,
  CHARGE_FIELDS,
  roundMoney,
  toAmount,
} from "../lib/financials";
import { canSeeField, canManageAssignments } from "@/lib/permissions";
interface ContainerType {
  _id?: string;
  containerNo?: string;
  vocNo?: string;
  lorryNum?: string;
  capacity?: number;
  updatedAt?: string;
  updatedBy?: string;
  createdAt?: string;
  createdBy?: string;
  lorryOwner?: string;
  destinationlocation?: string;
  loadingDate?: string | Date;
  demoundDate?: string | Date;
  weight?: number;
  dayHire?: number;
  advanced?: number;
  advancedDate?: string | Date;
  balancePaid?: number;
  balanceDate?: string | Date;
  outHire?: number;
  other?: number;
  heldUp?: number;
  heldUpExtraDays?: number;
  heldUpRate?: number;
  agentFee?: number;
  transportCommission?: number;
  return?: number;
  status?: "pending" | "in-progress" | "completed";
}

export const formatDate = (date?: string | Date) => {
  if (!date) return "-"; // fallback if date is missing
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
type ContainersProps = {
  container: ContainerType;
  setOpen: (isOpen: boolean) => void;
  onPaid?: () => void;
  selected?: boolean;
  onSelect?: (containerId: string, checked: boolean) => void;
};

function Containers({
  container,
  setOpen,
  onPaid,
  selected = false,
  onSelect,
}: ContainersProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payDate, setPayDate] = useState(todayDateInput());
  const [paying, setPaying] = useState(false);
  const [editingAssignment, seteditingAssignment] = useState({});

  const { toast } = useToast();
  const { id } = useParams();
  const [status, setStatus] = useState<"pending" | "in-progress" | "completed">(
    container?.status || "pending"
  );
  const toggleStatus = (
    containerId: "pending" | "in-progress" | "completed"
  ) => {
    const previous = status;
    setStatus(containerId);
    baseUrl
      .patch(`assignlorry/${id}/containers/${container?._id}`, {
        status: containerId,
      })
      .then(async () => {
        toast({
          title: "Success",
          description: "Container status updated successfully.",
        });
      })
      .catch((error) => {
        setStatus(previous);
        toast({
          title: "Update failed",
          description: getApiErrorMessage(
            error,
            "Could not update the container status. Please try again."
          ),
          variant: "destructive",
        });
      });
  };
  useEffect(() => {
    setOpen(isDialogOpen);
  }, [isDialogOpen]);

  const handleOpenEdit = () => {
    setIsDialogOpen(true);
    seteditingAssignment(container);
  };
  const handlePayBalance = () => {
    if (!id || !container?._id || paying || balance <= 0) return;
    setPaying(true);
    baseUrl
      .patch(`assignlorry/${id}/containers/${container._id}/balance`, {
        balanceDate: payDate || todayDateInput(),
      })
      .then(() => {
        toast({
          title: "Balance paid",
          description: `${formatMoney(balance)} recorded for ${payDate || todayDateInput()}.`,
        });
        setIsPayOpen(false);
        onPaid?.();
      })
      .catch((error) => {
        toast({
          title: "Payment failed",
          description: getApiErrorMessage(
            error,
            "Could not pay the balance. Please try again."
          ),
          variant: "destructive",
        });
      })
      .finally(() => {
        setPaying(false);
      });
  };
  const visibleCharges = CHARGE_FIELDS.filter((field) => canSeeField(field.key));
  const total = containerChargesTotal(container, visibleCharges);
  const paid = roundMoney(
    (canSeeField("advanced") ? toAmount(container.advanced) : 0) +
      (canSeeField("balancePaid") ? toAmount(container.balancePaid) : 0)
  );
  const balance = roundMoney(total - paid);
  const canManage = canManageAssignments();

  const statusTone =
    status === "completed"
      ? "border-l-emerald-500"
      : status === "in-progress"
        ? "border-l-sky-500"
        : "border-l-amber-500";

  return (
    <div className={`space-y-3 rounded-lg border border-l-4 border-border/80 p-4 ${statusTone}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          {balance > 0 && container?._id && onSelect && canManage ? (
            <Checkbox
              className="mt-1"
              checked={selected}
              onCheckedChange={(checked) =>
                onSelect(container._id as string, Boolean(checked))
              }
              aria-label={`Select ${container.containerNo || "container"}`}
            />
          ) : null}
          <div>
            <p className="font-mono text-sm font-semibold">{container?.containerNo}</p>
            <p className="text-xs text-muted-foreground">VOC {container?.vocNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage ? (
          <Select
            defaultValue={container?.status}
            onValueChange={(value: "pending" | "in-progress" | "completed") => {
              toggleStatus(value);
            }}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          ) : (
            <span className="text-xs capitalize text-muted-foreground">
              {(status || "pending").replace(/-/g, " ")}
            </span>
          )}
          {canManage ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                onClick={handleOpenEdit}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Edit Container</DialogTitle>
              </DialogHeader>
              <EditContainer
                setIsDialogOpen={setIsDialogOpen}
                editingAssignment={editingAssignment}
              />
            </DialogContent>
          </Dialog>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Assigned Lorry</p>
          <p className="font-medium">
            {container?.lorryNum || "Unassigned"}
            {container?.capacity ? ` · ${container.capacity} ft` : ""}
            {container?.lorryOwner ? ` (${container.lorryOwner.toUpperCase()})` : ""}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Destination</p>
          <p className="font-medium">{container?.destinationlocation || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Loading / Demount</p>
          <p className="font-medium">
            {formatDate(container?.loadingDate)} / {formatDate(container?.demoundDate)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
        {[
          canSeeField("weight") ? ["Weight", container.weight, "weight"] : null,
          canSeeField("dayHire") ? ["Day Hire", container.dayHire, "dayHire"] : null,
          canSeeField("advanced") ? ["Advanced", container.advanced, "advanced"] : null,
          canSeeField("balancePaid") ? ["Balance Paid", container.balancePaid, "balancePaid"] : null,
          canSeeField("outHire") ? ["Out Hire", container.outHire, "outHire"] : null,
          canSeeField("other") ? ["Other", container.other, "other"] : null,
          canSeeField("heldUp") ? ["Held Up", container.heldUp, "heldUp"] : null,
          canSeeField("agentFee") ? ["Agent Fee", container.agentFee, "agentFee"] : null,
          canSeeField("transportCommission")
            ? ["Transport Commission", container.transportCommission, "transportCommission"]
            : null,
          canSeeField("return") ? ["Return", container.return, "return"] : null,
        ]
          .filter(Boolean)
          .map((row) => {
            const [label, value] = row as [string, number, string];
            return (
          <div key={String(label)}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
              className={
                label === "Advanced" || label === "Balance Paid"
                  ? "font-medium text-emerald-600"
                  : "font-medium"
              }
            >
              {formatMoney(value)}
            </p>
            {label === "Advanced" && canSeeField("advancedDate") ? (
              <p className="text-xs text-muted-foreground">
                {formatDate(container.advancedDate)}
              </p>
            ) : null}
            {label === "Held Up" && Number(container.heldUpExtraDays) > 0 ? (
              <p className="text-xs text-muted-foreground">
                {container.heldUpExtraDays} extra day
                {Number(container.heldUpExtraDays) === 1 ? "" : "s"} ×{" "}
                {formatMoney(container.heldUpRate)}
              </p>
            ) : null}
            {label === "Balance Paid" && container.balancePaid && canSeeField("balanceDate") ? (
              <p className="text-xs text-muted-foreground">
                {formatDate(container.balanceDate)}
              </p>
            ) : null}
          </div>
            );
          })}
      </div>

      {canSeeField("totals") ? (
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-2 text-sm">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <p>
            <span className="text-muted-foreground">Total </span>
            <span className="font-semibold">{formatMoney(total)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Paid </span>
            <span className="font-semibold text-emerald-600">
              {formatMoney(paid)}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Balance </span>
            <span className="font-bold">{formatMoney(balance)}</span>
          </p>
        </div>
        {balance > 0 && canManage && canSeeField("balancePaid") ? (
          <Dialog
            open={isPayOpen}
            onOpenChange={(open) => {
              setIsPayOpen(open);
              if (open) setPayDate(todayDateInput());
            }}
          >
            <DialogTrigger asChild>
              <Button type="button" size="sm" className="h-8">
                <Banknote className="h-3.5 w-3.5" />
                Pay Balance
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Pay balance</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Amount</Label>
                  <Input value={formatMoney(balance)} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPayOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handlePayBalance}
                    disabled={paying || !payDate}
                  >
                    {paying ? "Paying..." : "Pay"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
      ) : null}

      <div className="flex flex-wrap gap-x-5 text-xs text-muted-foreground">
        <span>
          Created by {typeof container?.createdBy === "object" ? (container as any).createdBy?.fullName : container?.createdBy}{" "}
          {container?.createdAt ? `· ${formatDateTime(container.createdAt)}` : ""}
        </span>
        <span>
          Updated by {typeof container?.updatedBy === "object" ? (container as any).updatedBy?.fullName : container?.updatedBy}{" "}
          {container?.updatedAt ? `· ${formatDateTime(container.updatedAt)}` : ""}
        </span>
      </div>
    </div>
  );
}

export default Containers;
