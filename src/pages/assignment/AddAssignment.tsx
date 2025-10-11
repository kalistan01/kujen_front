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
import {
  Plus,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";
interface Container {
  id: string;
  containerNo: string;
  vocNo: string;
  lorryId: string;
  loadingDate: string;
  demoundDate: string;
  destination: string;
  status: string;
  weight: number;
  dayHire: number;
  advanced: number;
  outHire: number;
  other: number;
  heldUp: number;
  agentFee: number;
  return: number;
  ot: number;
}
interface Assignment {
  id: string;
  blNo: string;
  cusdecDate: string;
  cusdecNo: string;
  regNo: string;
  item: string;
  exporter: string;
  importer: string;
  containers: Container[];
  createdAt: string;
  createdBy: string;
  updatedBy: string;
  status?: string;
}
function AddAssignment({
  setIsDialogOpen,
  editingAssignment,
  setAssignments,
  setEditingAssignment,
  assignments,
}: {
  setIsDialogOpen: (isOpen: boolean) => void;
  editingAssignment?: any;
  setAssignments: (assignments: Assignment[]) => void;
  assignments: Assignment[];
  setEditingAssignment: (assignment: Assignment | null) => void;
}) {
  const [destination, setDestination] = useState([]);
  const [lorries, setLorries] = useState([]);
  const [formData, setFormData] = useState({
    blNo: "",
    cusdecDate: "",
    cusdecNo: "",
    regNo: "",
    item: "",
    exporter: "",
    importer: "",
  });
  const [containers, setContainers] = useState<Omit<Container, "id">[]>([
    {
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
    },
  ]);
  const { toast } = useToast();
  const addContainer = () => {
    setContainers([
      ...containers,
      {
        containerNo: "",
        vocNo: "",
        lorryId: "",
        loadingDate: "",
        demoundDate: "",
        destination: "",
        status: "",
        weight: 0,
        dayHire: 0,
        advanced: 0,
        outHire: 0,
        other: 0,
        heldUp: 0,
        agentFee: 0,
        return: 0,
        ot: 0,
      },
    ]);
  };
  const removeContainer = (index: number) => {
    if (containers.length > 1) {
      setContainers(containers.filter((_, i) => i !== index));
    }
  };

  const updateContainer = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updatedContainers = containers.map((container, i) =>
      i === index ? { ...container, [field]: value } : container
    );
    setContainers(updatedContainers);
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
    // Validate basic form data
    if (
      !formData.blNo ||
      !formData.cusdecDate ||
      !formData.cusdecNo ||
      !formData.regNo
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required basic fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate containers
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      if (
        !container.containerNo ||
        !container.vocNo ||
        !container.lorryId ||
        !container.loadingDate ||
        !container.demoundDate ||
        container.weight <= 0 ||
        container.dayHire <= 0 ||
        container.advanced <= 0
      ) {
        toast({
          title: "Validation Error",
          description: `Please fill in all required fields for container ${
            i + 1
          }.`,
          variant: "destructive",
        });
        return;
      }
    }
    const resetForm = () => {
      setFormData({
        blNo: "",
        cusdecDate: "",
        cusdecNo: "",
        regNo: "",
        item: "",
        exporter: "",
        importer: "",
      });
      setContainers([
        {
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
        },
      ]);
      setEditingAssignment(null);
    };
    const processedContainers: Container[] = containers.map(
      (container, index) => ({
        id: editingAssignment
          ? editingAssignment.containers[index]?.id ||
            Date.now().toString() + index
          : Date.now().toString() + index,
        ...container,
      })
    );

    if (editingAssignment) {
      setAssignments(
        assignments.map((assignment) =>
          assignment.id === editingAssignment.id
            ? {
                ...assignment,
                ...formData,
                containers: processedContainers,
                ot: containers.map((c) => ({ containerNo: c.containerNo })),
                updatedBy: "Current User",
              }
            : assignment
        )
      );
      toast({
        title: "Success",
        description: "Assignment updated successfully.",
      });
    } else {
      const newAssignment: Assignment = {
        id: Date.now().toString(),
        ...formData,
        containers: processedContainers,
        createdAt: new Date().toISOString().split("T")[0],
        createdBy: "Current User",
        updatedBy: "Current User",
      };

      baseUrl
        .post("/assignlorry", newAssignment)
        .then(async (response) => {
          toast({
            title: "Success",
            description: "Lorry owner created successfully.",
          });
        })
        .catch((error) => {
          console.error(error);
        });
    }

    setIsDialogOpen(false);
    resetForm();
  };
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="blNo">BL Number *</Label>
            <Input
              id="blNo"
              value={formData.blNo}
              onChange={(e) =>
                setFormData({ ...formData, blNo: e.target.value })
              }
              placeholder="Enter BL number"
            />
          </div>
          <div>
            <Label htmlFor="cusdecDate">Cusdec Date *</Label>
            <Input
              id="cusdecDate"
              type="date"
              value={formData.cusdecDate}
              onChange={(e) =>
                setFormData({ ...formData, cusdecDate: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cusdecNo">Cusdec Number *</Label>
            <Input
              id="cusdecNo"
              value={formData.cusdecNo}
              onChange={(e) =>
                setFormData({ ...formData, cusdecNo: e.target.value })
              }
              placeholder="Enter cusdec number"
            />
          </div>
          <div>
            <Label htmlFor="regNo">Registration Number *</Label>
            <Input
              id="regNo"
              value={formData.regNo}
              onChange={(e) =>
                setFormData({ ...formData, regNo: e.target.value })
              }
              placeholder="Enter registration number"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="item">Item</Label>
            <Input
              id="item"
              value={formData.item}
              onChange={(e) =>
                setFormData({ ...formData, item: e.target.value })
              }
              placeholder="Enter item description"
            />
          </div>
          <div>
            <Label htmlFor="exporter">Exporter</Label>
            <Input
              id="exporter"
              value={formData.exporter}
              onChange={(e) =>
                setFormData({ ...formData, exporter: e.target.value })
              }
              placeholder="Enter exporter name"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="importer">Importer</Label>
          <Input
            id="importer"
            value={formData.importer}
            onChange={(e) =>
              setFormData({ ...formData, importer: e.target.value })
            }
            placeholder="Enter importer name"
          />
        </div>
      </div>

      {/* Container Information */}
      <div className="space-y-4">
        <div className="flex justify-start items-center">
          <h3 className="text-lg font-semibold">
            Containers ({containers.length})
          </h3>
    
        </div>

        {containers.map((container, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Container {index + 1}</h4>
              {containers.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeContainer(index)}
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Container Number *</Label>
                <Input
                  value={container.containerNo}
                  onChange={(e) =>
                    updateContainer(index, "containerNo", e.target.value)
                  }
                  placeholder="Enter container number"
                />
              </div>
              <div>
                <Label>VOC Number *</Label>
                <Input
                  value={container.vocNo}
                  onChange={(e) =>
                    updateContainer(index, "vocNo", e.target.value)
                  }
                  placeholder="Enter VOC number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assign Lorry *</Label>
                <Select
                  value={container.lorryId}
                  onValueChange={(value) =>
                    updateContainer(index, "lorryId", value)
                  }
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
                  value={container.destination}
                  onValueChange={(value) =>
                    updateContainer(index, "destination", value)
                  }
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
                  value={container.loadingDate}
                  onChange={(e) =>
                    updateContainer(index, "loadingDate", e.target.value)
                  }
                />
              </div>
              <div>
                <Label>Demound Date *</Label>
                <Input
                  type="date"
                  value={container.demoundDate}
                  onChange={(e) =>
                    updateContainer(index, "demoundDate", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Weight (kg) *</Label>
                <Input
                  type="number"
                  value={container.weight || ""}
                  onChange={(e) =>
                    updateContainer(
                      index,
                      "weight",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="Enter weight"
                />
              </div>
              <div>
                <Label>Day Hire (₹) *</Label>
                <Input
                  type="number"
                  value={container.dayHire || ""}
                  onChange={(e) =>
                    updateContainer(
                      index,
                      "dayHire",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="Enter day hire"
                />
              </div>
              <div>
                <Label>Advanced (₹) *</Label>
                <Input
                  type="number"
                  value={container.advanced || ""}
                  onChange={(e) =>
                    updateContainer(
                      index,
                      "advanced",
                      parseFloat(e.target.value) || 0
                    )
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
                  value={container.outHire || ""}
                  onChange={(e) =>
                    updateContainer(
                      index,
                      "outHire",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="Enter out hire"
                />
              </div>
              <div>
                <Label>Other (₹)</Label>
                <Input
                  type="number"
                  value={container.other || ""}
                  onChange={(e) =>
                    updateContainer(
                      index,
                      "other",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="Enter other amount"
                />
              </div>
              <div>
                <Label>Held Up (₹)</Label>
                <Input
                  type="number"
                  value={container.heldUp || ""}
                  onChange={(e) =>
                    updateContainer(
                      index,
                      "heldUp",
                      parseFloat(e.target.value) || 0
                    )
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
                  value={container.agentFee || ""}
                  onChange={(e) =>
                    updateContainer(
                      index,
                      "agentFee",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="Enter agent fee"
                />
              </div>
              <div>
                <Label>Return (₹)</Label>
                <Input
                  type="number"
                  value={container.return || ""}
                  onChange={(e) =>
                    updateContainer(
                      index,
                      "return",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="Enter return amount"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={container.status}
                onValueChange={(value: Container["status"]) =>
                  updateContainer(index, "status", value)
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
        ))}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
           
          </h3>
          <Button
            type="button"
            onClick={addContainer}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Container
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {editingAssignment ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export default AddAssignment;
