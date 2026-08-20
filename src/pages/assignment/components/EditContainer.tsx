import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";
import { useParams } from "react-router-dom";
import DestinationSelect, {
  type DestinationOption,
} from "./DestinationSelect";
import { todayDateInput, toDateInput, containerBalance, containerChargesTotal, containerPaid, formatMoney, toAmount } from "../lib/financials";
interface Container {
  _id?: string;
  containerNo?: string;
  vocNo?: string;
  lorryNum?: string;
  lorryId?: string;
  destination?: string;
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
  advancedDate?: string;
  balancePaid?: number;
  balanceDate?: string;
  outHire?: number;
  other?: number;
  heldUp?: number;
  agentFee?: number;
  transportCommission?: number;
  return?: number;
  ot?: number;
  status?: "pending" | "in-progress" | "completed";
}

function EditContainer({
  setIsDialogOpen,
  editingAssignment,
}: {
  setIsDialogOpen: (isOpen: boolean) => void;
  editingAssignment?: Container;
}) {
  const { toast } = useToast();
  const { id } = useParams();
  const [destination, setDestination] = useState<DestinationOption[]>([]);
  const [lorries, setLorries] = useState([]);
  const [containers, setContainers] = useState<Container>({
    containerNo: "",
    vocNo: "",
    lorryId: "",
    loadingDate: "",
    demoundDate: "",
    destination: "",
    weight: 0,
    dayHire: 0,
    advanced: 0,
    advancedDate: todayDateInput(),
    balancePaid: 0,
    balanceDate: todayDateInput(),
    outHire: 0,
    other: 0,
    heldUp: 0,
    agentFee: 0,
    transportCommission: 0,
    return: 0,
    ot: 0,
    status: "pending" as "pending" | "in-progress" | "completed",
  });

  useEffect(() => {
    if (!editingAssignment) return;
    setContainers({
      ...editingAssignment,
      advancedDate: toDateInput(editingAssignment.advancedDate),
      balanceDate: toDateInput(editingAssignment.balanceDate),
    });
  }, [editingAssignment]);

  const resetForm = () => {
    setContainers({
      containerNo: "",
      vocNo: "",
      lorryId: "",
      loadingDate: "",
      demoundDate: "",
      destination: "",
      weight: 0,
      dayHire: 0,
      advanced: 0,
      advancedDate: todayDateInput(),
      balancePaid: 0,
      balanceDate: todayDateInput(),
      outHire: 0,
      other: 0,
      heldUp: 0,
      agentFee: 0,
      transportCommission: 0,
      ot: 0,
      return: 0,
      status: "pending" as "pending" | "in-progress" | "completed",
    });
    // setEditingAssignment(null);
    
  };
  const updateContainer = (field: string, value: string | number) => {
    setContainers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  useEffect(() => {
    baseUrl
      .get("/destination")
      .then(async (response) => {
        setDestination(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
    baseUrl
      .get("/lorry/lorry")
      .then(async (response) => {
        setLorries(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);
  const handleSave = () => {

    baseUrl
      .put(`assignlorry/${id}/containers/${containers?._id}`, containers)
      .then(async (response) => {
        toast({
          title: "Success",
          description: "Role updated successfully.",
        });
      })
      .catch((error) => {
        console.error(error);
      });

    setIsDialogOpen(false);
    resetForm();
  };

  const total = containerChargesTotal(containers);
  const paid = containerPaid(containers);
  const remaining = containerBalance(containers);
  const balanceDue = Math.max(
    0,
    total - toAmount(containers.advanced)
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Container Number *</Label>
              <Input
                value={containers.containerNo}
                onChange={(e) => updateContainer("containerNo", e.target.value)}
                placeholder="Enter container number"
              />
            </div>
            <div>
              <Label>VOC Number *</Label>
              <Input
                value={containers.vocNo}
                onChange={(e) => updateContainer("vocNo", e.target.value)}
                placeholder="Enter VOC number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assign Lorry *</Label>
              <Select
                value={containers.lorryId}
                onValueChange={(value) => updateContainer("lorryId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lorry" />
                </SelectTrigger>
                <SelectContent>
                  {lorries.map((lorry) => (
                    <SelectItem key={lorry._id} value={lorry._id}>
                      {lorry.lorryNum} - {lorry.capacity} -{" "}
                      {lorry.owner.ownerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Destination</Label>
              <DestinationSelect
                destinations={destination}
                value={containers.destination}
                onChange={(value) => updateContainer("destination", value)}
                onCreated={(dest) =>
                  setDestination((prev) => [...prev, dest])
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Loading Date *</Label>
              <Input
                type="date"
                value={
                  typeof containers.loadingDate === "string"
                    ? containers.loadingDate.substring(0, 10)
                    : ""
                }
                onChange={(e) => updateContainer("loadingDate", e.target.value)}
              />
            </div>
            <div>
              <Label>Demound Date *</Label>
              <Input
                type="date"
                value={
                  typeof containers.demoundDate === "string"
                    ? containers.demoundDate.substring(0, 10)
                    : ""
                }
                onChange={(e) => updateContainer("demoundDate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Weight (kg) *</Label>
              <Input
                type="number"
                value={containers.weight || ""}
                onChange={(e) =>
                  updateContainer("weight", parseFloat(e.target.value) || 0)
                }
                placeholder="Enter weight"
              />
            </div>
            <div>
              <Label>Day Hire (Rs) *</Label>
              <Input
                type="number"
                value={containers.dayHire || ""}
                onChange={(e) =>
                  updateContainer("dayHire", parseFloat(e.target.value) || 0)
                }
                placeholder="Enter day hire"
              />
            </div>
            <div>
              <Label>Advanced (Rs) *</Label>
              <Input
                type="number"
                value={containers.advanced || ""}
                onChange={(e) =>
                  updateContainer("advanced", parseFloat(e.target.value) || 0)
                }
                placeholder="Enter advanced amount"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Advanced Date *</Label>
              <Input
                type="date"
                value={toDateInput(containers.advancedDate)}
                onChange={(e) =>
                  updateContainer("advancedDate", e.target.value)
                }
              />
            </div>
            <div>
              <Label>Balance (Rs)</Label>
              <Input
                type="number"
                value={balanceDue}
                readOnly
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Remaining (Rs)</Label>
              <Input
                type="number"
                value={remaining}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Balance Paid (Rs)</Label>
              <Input
                type="number"
                value={containers.balancePaid || ""}
                onChange={(e) =>
                  updateContainer(
                    "balancePaid",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder={balanceDue ? String(balanceDue) : "Enter balance paid"}
              />
            </div>
            <div>
              <Label>Balance Date</Label>
              <Input
                type="date"
                value={toDateInput(containers.balanceDate)}
                onChange={(e) =>
                  updateContainer("balanceDate", e.target.value)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Out Hire (Rs)</Label>
              <Input
                type="number"
                value={containers.outHire || ""}
                onChange={(e) =>
                  updateContainer("outHire", parseFloat(e.target.value) || 0)
                }
                placeholder="Enter out hire"
              />
            </div>
            <div>
              <Label>Other (Rs)</Label>
              <Input
                type="number"
                value={containers.other || ""}
                onChange={(e) =>
                  updateContainer("other", parseFloat(e.target.value) || 0)
                }
                placeholder="Enter other amount"
              />
            </div>
            <div>
              <Label>Held Up (Rs)</Label>
              <Input
                type="number"
                value={containers.heldUp || ""}
                onChange={(e) =>
                  updateContainer("heldUp", parseFloat(e.target.value) || 0)
                }
                placeholder="Enter held up amount"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Agent Fee (Rs)</Label>
              <Input
                type="number"
                value={containers.agentFee || ""}
                onChange={(e) =>
                  updateContainer("agentFee", parseFloat(e.target.value) || 0)
                }
                placeholder="Enter agent fee"
              />
            </div>
            <div>
              <Label>Transport Commission (Rs)</Label>
              <Input
                type="number"
                value={containers.transportCommission || ""}
                onChange={(e) =>
                  updateContainer(
                    "transportCommission",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="Enter transport commission"
              />
            </div>
            <div>
              <Label>Return (Rs)</Label>
              <Input
                type="number"
                value={containers.return || ""}
                onChange={(e) =>
                  updateContainer("return", parseFloat(e.target.value) || 0)
                }
                placeholder="Enter return amount"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={containers.status}
              onValueChange={(value: Container["status"]) =>
                updateContainer("status", value)
              }
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
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
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
          <span className="font-bold">{formatMoney(remaining)}</span>
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Update</Button>
      </div>
    </div>
  );
}

export default EditContainer;
