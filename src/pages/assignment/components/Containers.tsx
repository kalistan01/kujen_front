import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Truck,
  MapPin,
  Calendar,
  Weight,
  User,
  Plus,
  Edit,
} from "lucide-react";
import baseUrl from "@/api/baseUrl";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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

interface ContainersProps {
  container: ContainerType;
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
function Containers({ container }: ContainersProps) {
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
  const handleAdd = () => {
    setIsDialogOpen(true);
  };
  const handleOpenEdit = () => {
    setIsDialogOpen(true);
    seteditingAssignment(container);
  };
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Container Number</p>
          <p className="font-semibold">{container?.containerNo}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">VOC Number</p>
          <p className="font-semibold">{container?.vocNo}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Assigned Lorry</p>
          <p className="font-semibold flex items-center">
            <Truck className="w-4 h-4 mr-1" />
            {container?.lorryNum || "Unassigned"}
            &nbsp;-&nbsp;
            <Weight className="w-4 h-4 mr-1" />
            {container?.capacity} feet ({container?.lorryOwner.toUpperCase()})
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Destination</p>
          <p className="font-semibold flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {container?.destinationlocation}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Loading Date</p>
          <p className="font-semibold flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(container?.loadingDate)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">demount Date</p>
          <p className="font-semibold flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(container?.demoundDate)}
          </p>
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-4 gap-4 text-sm">
        {/* Weight */}
        <div>
          <p className="text-muted-foreground">Weight</p>
          <p className="font-semibold">₹{container.weight?.toLocaleString()}</p>
        </div>

        {/* Day Hire */}
        <div>
          <p className="text-muted-foreground">Day Hire</p>
          <p className="font-semibold">
            ₹{container.dayHire?.toLocaleString()}
          </p>
        </div>

        {/* Advanced */}
        <div>
          <p className="text-muted-foreground">Advanced</p>
          <p className="font-semibold text-green-600">
            ₹{container.advanced?.toLocaleString()}
          </p>
        </div>

        {/* Out Hire */}
        <div>
          <p className="text-muted-foreground">Out Hire</p>
          <p className="font-semibold">
            ₹{container.outHire?.toLocaleString()}
          </p>
        </div>

        {/* Other */}
        <div>
          <p className="text-muted-foreground">Other</p>
          <p className="font-semibold">₹{container.other?.toLocaleString()}</p>
        </div>

        {/* Held Up */}
        <div>
          <p className="text-muted-foreground">Held Up</p>
          <p className="font-semibold">₹{container.heldUp?.toLocaleString()}</p>
        </div>

        {/* Agent Fee */}
        <div>
          <p className="text-muted-foreground">Agent Fee</p>
          <p className="font-semibold">
            ₹{container.agentFee?.toLocaleString()}
          </p>
        </div>

        {/* Return */}
        <div>
          <p className="text-muted-foreground">Return</p>
          <p className="font-semibold">₹{container.return?.toLocaleString()}</p>
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div></div>
        <div>
          <p className="text-muted-foreground">TOTAL</p>
          <p className="font-semibold">
            ₹
            {(container.weight || 0) +
              (container.dayHire || 0) +
              (container.outHire || 0) +
              (container.other || 0) +
              (container.heldUp || 0) +
              (container.return || 0) +
              (container.agentFee || 0)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">PAID</p>
          <p className="font-semibold">₹{container.advanced}</p>
        </div>
        <div>
          <p className="text-muted-foreground">BALANCE</p>
          <p className="font-semibold">
            ₹{" "}
            {(container.weight || 0) +
              (container.dayHire || 0) +
              (container.outHire || 0) +
              (container.other || 0) +
              (container.return || 0) +
              (container.heldUp || 0) +
              (container.agentFee || 0) -
              (container.advanced || 0)}
          </p>
        </div>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          defaultValue={container?.status}
          onValueChange={(value: "pending" | "in-progress" | "completed") => {
            toggleStatus(value);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="flex items-center justify-end gap-6 pt-4">
          <div>
            <p className="text-sm text-muted-foreground flex items-center">
              <User className="w-3 h-3 mr-1" />
              Created by
            </p>
            <p className="font-semibold">{container?.createdBy}</p>
            {container?.createdAt && (
              <p className="text-xs text-muted-foreground">
                {formatDateTime(container?.createdAt)}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center">
              <User className="w-3 h-3 mr-1" />
              Updated by
            </p>
            <p className="font-semibold">{container?.updatedBy}</p>
            {container?.updatedAt && (
              <p className="text-xs text-muted-foreground">
                {formatDateTime(container?.updatedAt)}
              </p>
            )}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenEdit} className="gap-2">
                <Edit className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Assignment</DialogTitle>
              </DialogHeader>
              <EditContainer
                setIsDialogOpen={setIsDialogOpen}
                editingAssignment={editingAssignment}
                setEditingAssignment={seteditingAssignment}
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

export default Containers;
