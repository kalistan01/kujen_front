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
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import DestinationSelect, {
  type DestinationOption,
} from "./components/DestinationSelect";
import { todayDateInput, applyHeldUpToContainer, applyHeldUpToContainers, type HeldUpRateOption } from "./lib/financials";
import { formatVocNo } from "./lib/voc";
import { canSeeField, omitHiddenContainerFields } from "@/lib/permissions";
import {
  firstErrorMessage,
  mapContainerApiError,
  validateAssignmentBasic,
  validateContainer,
  type AssignmentBasicErrors,
  type ContainerFieldErrors,
} from "./lib/validate";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";

function Field({
  label,
  required,
  children,
  className = "",
  field,
  error,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  field?: string;
  error?: string;
}) {
  if (field && !canSeeField(field)) return null;
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : null}
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
  heldUpExtraDays?: number;
  heldUpRate?: number;
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

function emptyContainer(vocNo: string): Omit<Container, "id"> {
  return {
    containerNo: "",
    vocNo,
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
    status: "pending",
  };
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
  const [lorries, setLorries] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<AssignmentBasicErrors>({});
  const [containerErrors, setContainerErrors] = useState<
    ContainerFieldErrors[]
  >([]);
  const [nextVoc, setNextVoc] = useState(1);
  const [heldUpRates, setHeldUpRates] = useState<HeldUpRateOption[]>([]);
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
    emptyContainer(formatVocNo(1)),
  ]);
  const { toast } = useToast();
  const assignVocNumbers = (list: Omit<Container, "id">[], start = nextVoc) =>
    list.map((container, index) => ({
      ...container,
      vocNo: formatVocNo(start + index),
    }));
  const addContainer = () => {
    setContainers((prev) =>
      assignVocNumbers([
        ...prev,
        applyHeldUpToContainer(
          emptyContainer(formatVocNo(nextVoc + prev.length)),
          heldUpRates
        ),
      ])
    );
  };
  const removeContainer = (index: number) => {
    if (containers.length > 1) {
      setContainers(assignVocNumbers(containers.filter((_, i) => i !== index)));
    }
  };

  const updateContainer = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updatedContainers = containers.map((container, i) =>
      i === index
        ? applyHeldUpToContainer({ ...container, [field]: value }, heldUpRates)
        : container
    );
    setContainers(updatedContainers);
    setContainerErrors((prev) => {
      if (!prev[index]?.[field as keyof ContainerFieldErrors] && !errors.form) {
        return prev;
      }
      const next = [...prev];
      next[index] = { ...next[index] };
      delete next[index][field as keyof ContainerFieldErrors];
      return next;
    });
    if (errors.form) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.form;
        return next;
      });
    }
  };
  useEffect(() => {
    baseUrl
      .get("/destination")
      .then(async (response) => {
        setDestination(response.data.data);
      })
      .catch((error) => {
        toast({
          title: "Unable to load destinations",
          description: getApiErrorMessage(
            error,
            "Could not load destinations. Please try again."
          ),
          variant: "destructive",
        });
      });
    baseUrl
      .get("/lorry/lorry")
      .then(async (response) => {
        setLorries(response.data.data);
      })
      .catch((error) => {
        toast({
          title: "Unable to load lorries",
          description: getApiErrorMessage(
            error,
            "Could not load lorries. Please try again."
          ),
          variant: "destructive",
        });
      });
    baseUrl
      .get("/assignlorry/next-voc")
      .then((response) => {
        const nextNumber = Number(response.data?.nextNumber) || 1;
        setNextVoc(nextNumber);
        setContainers((prev) =>
          prev.map((container, index) => ({
            ...container,
            vocNo: formatVocNo(nextNumber + index),
          }))
        );
      })
      .catch(() => {
        setNextVoc(1);
      });
    baseUrl
      .get("/heldup")
      .then((response) => {
        setHeldUpRates(response.data?.data || []);
      })
      .catch(() => {
        setHeldUpRates([]);
      });
  }, []);
  useEntitySync("destination", (payload) => {
    setDestination((prev) => upsertById(prev, payload));
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
  useEffect(() => {
    setContainers((prev) => applyHeldUpToContainers(prev, heldUpRates));
  }, [heldUpRates]);
  const handleSave = async () => {
    const basicErrors = validateAssignmentBasic(formData);
    const blNo = formData.blNo.trim();
    if (blNo) {
      const taken = assignments.some(
        (assignment: any) =>
          assignment._id !== editingAssignment?._id &&
          assignment.id !== editingAssignment?.id &&
          assignment.blNo?.trim().toLowerCase() === blNo.toLowerCase()
      );
      if (taken) {
        basicErrors.blNo = `BL number "${blNo}" already exists.`;
      }
    }

    const nextContainerErrors = containers.map((container, index) => {
      const fieldErrors = validateContainer(container);
      const number = container.containerNo.trim().toLowerCase();
      if (number) {
        const duplicate = containers.some(
          (other, otherIndex) =>
            otherIndex !== index &&
            other.containerNo.trim().toLowerCase() === number
        );
        if (duplicate) {
          fieldErrors.containerNo = `Container number "${container.containerNo.trim()}" is already in this assignment.`;
        }
      }
      return fieldErrors;
    });

    const hasContainerErrors = nextContainerErrors.some(
      (item) => Object.keys(item).length > 0
    );
    setErrors(basicErrors);
    setContainerErrors(nextContainerErrors);

    if (Object.keys(basicErrors).length || hasContainerErrors) {
      const containerMessage = nextContainerErrors
        .map((item, index) => {
          const message = firstErrorMessage(item);
          return message ? `Container ${index + 1}: ${message}` : null;
        })
        .find(Boolean);
      toast({
        title: "Missing details",
        description:
          firstErrorMessage(basicErrors) ||
          containerMessage ||
          "Please correct the highlighted fields and try again.",
        variant: "destructive",
      });
      return;
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
        applyHeldUpToContainer(emptyContainer(formatVocNo(nextVoc)), heldUpRates),
      ]);
      setErrors({});
      setContainerErrors([]);
      setEditingAssignment(null);
    };
    const processedContainers: Container[] = containers.map(
      (container, index) => ({
        id: editingAssignment
          ? editingAssignment.containers[index]?.id ||
            Date.now().toString() + index
          : Date.now().toString() + index,
        ...omitHiddenContainerFields({
          ...container,
          destination: container.destination || undefined,
        }),
      })
    );

    setSaving(true);
    try {
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
          blNo,
          cusdecNo: formData.cusdecNo.trim(),
          regNo: formData.regNo.trim(),
          containers: processedContainers,
          createdAt: new Date().toISOString().split("T")[0],
          createdBy: "Current User",
          updatedBy: "Current User",
        };

        await baseUrl.post("/assignlorry", newAssignment);
        toast({
          title: "Success",
          description: "Assignment created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        editingAssignment
          ? "Could not update the assignment. Please try again."
          : "Could not create the assignment. Please try again."
      );
      const containerField = mapContainerApiError(message);
      if (containerField !== "form") {
        setContainerErrors((prev) => {
          const next = [...prev];
          if (!next[0]) next[0] = {};
          next[0] = { ...next[0], [containerField]: message };
          return next;
        });
      } else {
        setErrors({ form: message });
      }
      toast({
        title: editingAssignment ? "Update failed" : "Create failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-5">
      {errors.form ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {errors.form}
        </p>
      ) : null}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Basic information</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="BL Number" required error={errors.blNo}>
            <Input
              id="blNo"
              value={formData.blNo}
              onChange={(e) => {
                setFormData({ ...formData, blNo: e.target.value });
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.blNo;
                  delete next.form;
                  return next;
                });
              }}
              placeholder="Enter BL number"
              className={`h-10 ${errors.blNo ? "border-destructive" : ""}`}
            />
          </Field>
          <Field label="Cusdec Date" required error={errors.cusdecDate}>
            <Input
              id="cusdecDate"
              type="date"
              value={formData.cusdecDate}
              onChange={(e) => {
                setFormData({ ...formData, cusdecDate: e.target.value });
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.cusdecDate;
                  delete next.form;
                  return next;
                });
              }}
              className={`h-10 ${errors.cusdecDate ? "border-destructive" : ""}`}
            />
          </Field>
          <Field label="Cusdec Number" required error={errors.cusdecNo}>
            <Input
              id="cusdecNo"
              value={formData.cusdecNo}
              onChange={(e) => {
                setFormData({ ...formData, cusdecNo: e.target.value });
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.cusdecNo;
                  delete next.form;
                  return next;
                });
              }}
              placeholder="Enter cusdec number"
              className={`h-10 ${errors.cusdecNo ? "border-destructive" : ""}`}
            />
          </Field>
          <Field label="Registration Number" required error={errors.regNo}>
            <Input
              id="regNo"
              value={formData.regNo}
              onChange={(e) => {
                setFormData({ ...formData, regNo: e.target.value });
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.regNo;
                  delete next.form;
                  return next;
                });
              }}
              placeholder="Enter registration number"
              className={`h-10 ${errors.regNo ? "border-destructive" : ""}`}
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
                <Field
                  label="Container Number"
                  required
                  error={containerErrors[index]?.containerNo}
                >
                  <Input
                    value={container.containerNo}
                    onChange={(e) =>
                      updateContainer(index, "containerNo", e.target.value)
                    }
                    placeholder="Enter container number"
                    className={`h-10 ${containerErrors[index]?.containerNo ? "border-destructive" : ""}`}
                  />
                </Field>
                <Field label="VOC Number">
                  <Input
                    value={container.vocNo}
                    readOnly
                    className="h-10 bg-muted"
                  />
                </Field>
                <Field
                  label="Assign Lorry"
                  required
                  error={containerErrors[index]?.lorryId}
                >
                  <Select
                    value={container.lorryId}
                    onValueChange={(value) =>
                      updateContainer(index, "lorryId", value)
                    }
                  >
                    <SelectTrigger
                      className={`h-10 ${containerErrors[index]?.lorryId ? "border-destructive" : ""}`}
                    >
                      <SelectValue placeholder="Select lorry" />
                    </SelectTrigger>
                    <SelectContent>
                      {lorries.map((lorry) => (
                        <SelectItem key={lorry._id} value={lorry._id}>
                          {lorry.lorryNum} - {lorry.capacity} -{" "}
                          {lorry.owner?.ownerName}
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
                <Field
                  label="Loading Date"
                  required
                  error={containerErrors[index]?.loadingDate}
                >
                  <Input
                    type="date"
                    value={container.loadingDate}
                    onChange={(e) =>
                      updateContainer(index, "loadingDate", e.target.value)
                    }
                    className={`h-10 ${containerErrors[index]?.loadingDate ? "border-destructive" : ""}`}
                  />
                </Field>
                <Field
                  label="Demount Date"
                  required
                  error={containerErrors[index]?.demoundDate}
                >
                  <Input
                    type="date"
                    value={container.demoundDate}
                    onChange={(e) =>
                      updateContainer(index, "demoundDate", e.target.value)
                    }
                    className={`h-10 ${containerErrors[index]?.demoundDate ? "border-destructive" : ""}`}
                  />
                </Field>
              </div>

              {[
                "weight",
                "dayHire",
                "advanced",
                "advancedDate",
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
                  <Field
                    label="Weight (kg)"
                    required
                    field="weight"
                    error={containerErrors[index]?.weight}
                  >
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
                      className={`h-10 ${containerErrors[index]?.weight ? "border-destructive" : ""}`}
                    />
                  </Field>
                  <Field
                    label="Day Hire (Rs)"
                    required
                    field="dayHire"
                    error={containerErrors[index]?.dayHire}
                  >
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
                      className={`h-10 ${containerErrors[index]?.dayHire ? "border-destructive" : ""}`}
                    />
                  </Field>
                  <Field
                    label="Advanced (Rs)"
                    required
                    field="advanced"
                    error={containerErrors[index]?.advanced}
                  >
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
                      className={`h-10 ${containerErrors[index]?.advanced ? "border-destructive" : ""}`}
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
                      readOnly
                      value={container.heldUp || ""}
                      placeholder="Auto from dates"
                      className="h-10 bg-muted/50"
                    />
                    {(container.heldUpExtraDays || 0) > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {container.heldUpExtraDays} extra day
                        {container.heldUpExtraDays === 1 ? "" : "s"} after the
                        first day
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Charged after one day from loading to demount
                      </p>
                    )}
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
        <Button
          variant="outline"
          onClick={() => setIsDialogOpen(false)}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : editingAssignment ? (
            "Update"
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </div>
  );
}

export default AddAssignment;
