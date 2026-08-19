import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import baseUrl from "@/api/baseUrl";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import EditContainer from "./EditContainer";
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
  outHire?: number;
  other?: number;
  heldUp?: number;
  agentFee?: number;
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
function Containers({
  container,
  setOpen,
}: {
  container: ContainerType;
  setOpen: (isOpen: boolean) => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
  const total =
    (container.weight || 0) +
    (container.dayHire || 0) +
    (container.outHire || 0) +
    (container.other || 0) +
    (container.heldUp || 0) +
    (container.return || 0) +
    (container.agentFee || 0);
  const paid = container.advanced || 0;
  const balance = total - paid;

  const statusTone =
    status === "completed"
      ? "border-l-emerald-500"
      : status === "in-progress"
        ? "border-l-sky-500"
        : "border-l-amber-500";

  return (
    <div className={`space-y-3 rounded-lg border border-l-4 border-border/80 p-4 ${statusTone}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-semibold">{container?.containerNo}</p>
          <p className="text-xs text-muted-foreground">VOC {container?.vocNo}</p>
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
          ["Out Hire", container.outHire],
          ["Other", container.other],
          ["Held Up", container.heldUp],
          ["Agent Fee", container.agentFee],
          ["Return", container.return],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
              className={
                label === "Advanced"
                  ? "font-medium text-emerald-600"
                  : "font-medium"
              }
            >
              ₹{Number(value || 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-border/70 pt-2 text-sm">
        <p>
          <span className="text-muted-foreground">Total </span>
          <span className="font-semibold">₹{total.toLocaleString()}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Paid </span>
          <span className="font-semibold text-emerald-600">
            ₹{Number(paid).toLocaleString()}
          </span>
        </p>
        <p>
          <span className="text-muted-foreground">Balance </span>
          <span className="font-bold">₹{balance.toLocaleString()}</span>
        </p>
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
