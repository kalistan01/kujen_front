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
  outHire?: number;
  other?: number;
  heldUp?: number;
  agentFee?: number;
  return?: number;
  ot?: number;
  status?: "pending" | "in-progress" | "completed";
}

function EditContainer({
  setIsDialogOpen,
  editingAssignment,
  setEditingAssignment,
}: {
  setIsDialogOpen: (isOpen: boolean) => void;
  editingAssignment?: Container;
  setEditingAssignment: (assignment: Container | null) => void;
}) {
  const { toast } = useToast();
  const { id } = useParams();
  const [destination, setDestination] = useState([]);
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
    outHire: 0,
    other: 0,
    heldUp: 0,
    agentFee: 0,
    return: 0,
    ot: 0,
    status: "pending" as "pending" | "in-progress" | "completed",
  });

  useEffect(() => {
    setContainers(editingAssignment);
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
      outHire: 0,
      other: 0,
      heldUp: 0,
      agentFee: 0,
      ot: 0,
      return: 0,
      status: "pending" as "pending" | "in-progress" | "completed",
    });
    setEditingAssignment(null);
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

    // setIsDialogOpen(false);
    // resetForm();
  };

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
              <Select
                value={containers.destination}
                onValueChange={(value) => updateContainer("destination", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {destination.map((dest) => (
                    <SelectItem key={dest._id} value={dest._id}>
                      {dest.type} - {dest.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  typeof containers.loadingDate === "string"
                    ? containers.loadingDate.substring(0, 10)
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
              <Label>Day Hire (₹) *</Label>
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
              <Label>Advanced (₹) *</Label>
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
              <Label>Out Hire (₹)</Label>
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
              <Label>Other (₹)</Label>
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
              <Label>Held Up (₹)</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Agent Fee (₹)</Label>
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
              <Label>Return (₹)</Label>
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
