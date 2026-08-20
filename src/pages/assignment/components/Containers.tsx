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
import { useParams } from "react-router-dom";
import EditContainer from "./EditContainer";
import {
  containerBalance,
  containerChargesTotal,
  containerPaid,
  formatMoney,
  todayDateInput,
} from "../lib/financials";
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
    setStatus(containerId);
    baseUrl
      .patch(`assignlorry/${id}/containers/${container?._id}`, {
        status: containerId,
      })
      .then(async (response) => {
        toast({
          title: "Success",
          description: "Role updated successfully.",
        });
      })
      .catch((error) => {
        console.error(error);
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
          description:
            error?.response?.data?.message || "Could not pay the balance.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setPaying(false);
      });
  };
  const total = containerChargesTotal(container);
  const paid = containerPaid(container);
  const balance = containerBalance(container);

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
          {balance > 0 && container?._id && onSelect ? (
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
          ["Weight", container.weight],
          ["Day Hire", container.dayHire],
          ["Advanced", container.advanced],
          ["Balance Paid", container.balancePaid],
          ["Out Hire", container.outHire],
          ["Other", container.other],
          ["Held Up", container.heldUp],
          ["Agent Fee", container.agentFee],
          ["Transport Commission", container.transportCommission],
          ["Return", container.return],
        ].map(([label, value]) => (
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
            {label === "Advanced" ? (
              <p className="text-xs text-muted-foreground">
                {formatDate(container.advancedDate)}
              </p>
            ) : null}
            {label === "Balance Paid" && container.balancePaid ? (
              <p className="text-xs text-muted-foreground">
                {formatDate(container.balanceDate)}
              </p>
            ) : null}
          </div>
        ))}
      </div>

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
        {balance > 0 ? (
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
