import { useEffect, useState, type ReactNode } from "react";
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
  Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";
import DestinationSelect, {
  type DestinationOption,
} from "./components/DestinationSelect";
import { todayDateInput } from "./lib/financials";
import { canSeeField, omitHiddenContainerFields } from "@/lib/permissions";

function Field({
  label,
  required,
  children,
  className = "",
  field,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  field?: string;
}) {
  if (field && !canSeeField(field)) return null;
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
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
  advancedDate: string;
  balancePaid: number;
  balanceDate: string;
  outHire: number;
  other: number;
  heldUp: number;
  agentFee: number;
  transportCommission: number;
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
  const [destination, setDestination] = useState<DestinationOption[]>([]);
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
        ...omitHiddenContainerFields(container),
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
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Basic information</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="BL Number" required>
            <Input
              id="blNo"
              value={formData.blNo}
              onChange={(e) =>
                setFormData({ ...formData, blNo: e.target.value })
              }
              placeholder="Enter BL number"
              className="h-10"
            />
          </Field>
          <Field label="Cusdec Date" required>
            <Input
              id="cusdecDate"
              type="date"
              value={formData.cusdecDate}
              onChange={(e) =>
                setFormData({ ...formData, cusdecDate: e.target.value })
              }
              className="h-10"
            />
          </Field>
          <Field label="Cusdec Number" required>
            <Input
              id="cusdecNo"
              value={formData.cusdecNo}
              onChange={(e) =>
                setFormData({ ...formData, cusdecNo: e.target.value })
              }
              placeholder="Enter cusdec number"
              className="h-10"
            />
          </Field>
          <Field label="Registration Number" required>
            <Input
              id="regNo"
              value={formData.regNo}
              onChange={(e) =>
                setFormData({ ...formData, regNo: e.target.value })
              }
              placeholder="Enter registration number"
              className="h-10"
            />
          </Field>
          <Field label="Item">
            <Input
              id="item"
              value={formData.item}
              onChange={(e) =>
                setFormData({ ...formData, item: e.target.value })
              }
              placeholder="Enter item description"
              className="h-10"
            />
          </Field>
          <Field label="Exporter">
            <Input
              id="exporter"
              value={formData.exporter}
              onChange={(e) =>
                setFormData({ ...formData, exporter: e.target.value })
              }
              placeholder="Enter exporter name"
              className="h-10"
            />
          </Field>
          <Field label="Importer" className="sm:col-span-2 lg:col-span-1">
            <Input
              id="importer"
              value={formData.importer}
              onChange={(e) =>
                setFormData({ ...formData, importer: e.target.value })
              }
              placeholder="Enter importer name"
              className="h-10"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">
            Containers ({containers.length})
          </h3>
        </div>

        {containers.map((container, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
              <p className="text-sm font-semibold text-foreground">Container {index + 1}</p>
              {containers.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeContainer(index)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-4 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Container Number" required>
                  <Input
                    value={container.containerNo}
                    onChange={(e) =>
                      updateContainer(index, "containerNo", e.target.value)
                    }
                    placeholder="Enter container number"
                    className="h-10"
                  />
                </Field>
                <Field label="VOC Number" required>
                  <Input
                    value={container.vocNo}
                    onChange={(e) =>
                      updateContainer(index, "vocNo", e.target.value)
                    }
                    placeholder="Enter VOC number"
                    className="h-10"
                  />
                </Field>
                <Field label="Assign Lorry" required>
                  <Select
                    value={container.lorryId}
                    onValueChange={(value) =>
                      updateContainer(index, "lorryId", value)
                    }
                  >
                    <SelectTrigger className="h-10">
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
                </Field>
                <Field label="Destination">
                  <DestinationSelect
                    destinations={destination}
                    value={container.destination}
                    onChange={(value) =>
                      updateContainer(index, "destination", value)
                    }
                    onCreated={(dest) =>
                      setDestination((prev) => [...prev, dest])
                    }
                  />
                </Field>
                <Field label="Loading Date" required>
                  <Input
                    type="date"
                    value={container.loadingDate}
                    onChange={(e) =>
                      updateContainer(index, "loadingDate", e.target.value)
                    }
                    className="h-10"
                  />
                </Field>
                <Field label="Demount Date" required>
                  <Input
                    type="date"
                    value={container.demoundDate}
                    onChange={(e) =>
                      updateContainer(index, "demoundDate", e.target.value)
                    }
                    className="h-10"
                  />
                </Field>
              </div>

              {[
                "weight",
                "dayHire",
                "advanced",
                "advancedDate",
                "balancePaid",
                "balanceDate",
                "outHire",
                "other",
                "heldUp",
                "agentFee",
                "transportCommission",
                "return",
              ].some((key) => canSeeField(key)) ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Charges
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Weight (kg)" required field="weight">
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
                      className="h-10"
                    />
                  </Field>
                  <Field label="Day Hire (Rs)" required field="dayHire">
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
                      className="h-10"
                    />
                  </Field>
                  <Field label="Advanced (Rs)" required field="advanced">
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
                      className="h-10"
                    />
                  </Field>
                  <Field label="Advanced Date" required field="advancedDate">
                    <Input
                      type="date"
                      value={container.advancedDate || todayDateInput()}
                      onChange={(e) =>
                        updateContainer(index, "advancedDate", e.target.value)
                      }
                      className="h-10"
                    />
                  </Field>
                  <Field label="Balance Paid (Rs)" field="balancePaid">
                    <Input
                      type="number"
                      value={container.balancePaid || ""}
                      onChange={(e) =>
                        updateContainer(
                          index,
                          "balancePaid",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Enter balance paid"
                      className="h-10"
                    />
                  </Field>
                  <Field label="Balance Date" field="balanceDate">
                    <Input
                      type="date"
                      value={container.balanceDate || todayDateInput()}
                      onChange={(e) =>
                        updateContainer(index, "balanceDate", e.target.value)
                      }
                      className="h-10"
                    />
                  </Field>
                  <Field label="Out Hire (Rs)" field="outHire">
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
                      className="h-10"
                    />
                  </Field>
                  <Field label="Other (Rs)" field="other">
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
                      className="h-10"
                    />
                  </Field>
                  <Field label="Held Up (Rs)" field="heldUp">
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
                      className="h-10"
                    />
                  </Field>
                  <Field label="Agent Fee (Rs)" field="agentFee">
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
                      className="h-10"
                    />
                  </Field>
                  <Field label="Transport Commission (Rs)" field="transportCommission">
                    <Input
                      type="number"
                      value={container.transportCommission || ""}
                      onChange={(e) =>
                        updateContainer(
                          index,
                          "transportCommission",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Enter transport commission"
                      className="h-10"
                    />
                  </Field>
                  <Field label="Return (Rs)" field="return">
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
                      className="h-10"
                    />
                  </Field>
                  <Field label="Status">
                    <Select
                      value={container.status}
                      onValueChange={(value: Container["status"]) =>
                        updateContainer(index, "status", value)
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
              ) : null}
            </div>
          </div>
        ))}

        <Button
          type="button"
          onClick={addContainer}
          variant="outline"
          size="sm"
          className="h-9 w-full"
        >
          <Plus className="h-4 w-4" />
          Add Container
        </Button>
      </section>

      <div className="sticky bottom-0 -mx-6 -mb-5 flex justify-end gap-2 border-t border-border bg-card/95 px-6 py-4 backdrop-blur">
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
