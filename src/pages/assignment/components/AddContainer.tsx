
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import { useParams } from "react-router-dom";
import DestinationSelect, {
  type DestinationOption,
} from "./DestinationSelect";
import { todayDateInput, applyHeldUpToContainer, type HeldUpRateOption } from "../lib/financials";
import { formatVocNo } from "../lib/voc";
import { omitHiddenContainerFields } from "@/lib/permissions";
import { FieldGate } from "@/components/RequirePermission";
import {
  firstErrorMessage,
  mapContainerApiError,
  validateContainer,
  type ContainerFieldErrors,
} from "../lib/validate";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";
interface Container {
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
  heldUpExtraDays?: number;
  heldUpRate?: number;
  agentFee?: number;
  transportCommission?: number;
  return?: number;
  ot?: number;
  status?: "pending" | "in-progress" | "completed";
}

function AddContainer({
  setIsDialogOpen,
}: {
  setIsDialogOpen: (isOpen: boolean) => void;
}) {
  const { toast } = useToast();
  const { id } = useParams();
  const [destination, setDestination] = useState<DestinationOption[]>([]);
  const [lorries, setLorries] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ContainerFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [heldUpRates, setHeldUpRates] = useState<HeldUpRateOption[]>([]); 
  const intialstate :Container ={
    containerNo: "",
    vocNo: formatVocNo(1),
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
  };
  const [containers, setContainers] = useState<Container>(intialstate);



  const resetForm = () => {
    setContainers(intialstate);
  };
  const updateContainer = (field: string, value: string | number) => {
    setContainers((prev) =>
      applyHeldUpToContainer({ ...prev, [field]: value }, heldUpRates)
    );
    setErrors((prev) => {
      if (!prev[field as keyof ContainerFieldErrors]) return prev;
      const next = { ...prev };
      delete next[field as keyof ContainerFieldErrors];
      return next;
    });
    if (formError) setFormError("");
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
        const vocNo = response.data?.next || formatVocNo(1);
        setContainers((prev) => ({ ...prev, vocNo }));
      })
      .catch(() => {
        setContainers((prev) => ({ ...prev, vocNo: formatVocNo(1) }));
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
    setContainers((prev) => applyHeldUpToContainer(prev, heldUpRates));
  }, [heldUpRates]);
  const handleSave = async () => {
    if (!id) {
      const message = "This assignment cannot be updated because it has no ID.";
      setFormError(message);
      toast({
        title: "Unable to add container",
        description: message,
        variant: "destructive",
      });
      return;
    }

    const nextErrors = validateContainer(containers);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast({
        title: "Missing details",
        description:
          firstErrorMessage(nextErrors) ||
          "Please correct the highlighted fields and try again.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await baseUrl.post(
        `assignlorry/${id}/containers`,
        omitHiddenContainerFields({
          ...containers,
          destination: containers.destination || undefined,
        })
      );
      toast({
        title: "Success",
        description: "Container added successfully.",
      });
      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        "Could not add the container. Please try again."
      );
      const field = mapContainerApiError(message);
      if (field === "form") setFormError(message);
      else setErrors({ [field]: message });
      toast({
        title: "Create failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {formError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {formError}
        </p>
      ) : null}
      <div className="space-y-4">
        <div className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Container Number *</Label>
              <Input
                value={containers.containerNo}
                onChange={(e) => updateContainer("containerNo", e.target.value)}
                placeholder="Enter container number"
                className={errors.containerNo ? "border-destructive" : ""}
              />
              {errors.containerNo ? (
                <p className="text-xs font-medium text-destructive">
                  {errors.containerNo}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>VOC Number</Label>
              <Input
                value={containers.vocNo}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Assign Lorry *</Label>
              <Select
                value={containers.lorryId}
                onValueChange={(value) => updateContainer("lorryId", value)}
              >
                <SelectTrigger
                  className={errors.lorryId ? "border-destructive" : ""}
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
              {errors.lorryId ? (
                <p className="text-xs font-medium text-destructive">
                  {errors.lorryId}
                </p>
              ) : null}
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
            <div className="space-y-1.5">
              <Label>Loading Date *</Label>
              <Input
                type="date"
                value={
                  typeof containers.loadingDate === "string"
                    ? containers.loadingDate.substring(0, 10)
                    : ""
                }
                onChange={(e) => updateContainer("loadingDate", e.target.value)}
                className={errors.loadingDate ? "border-destructive" : ""}
              />
              {errors.loadingDate ? (
                <p className="text-xs font-medium text-destructive">
                  {errors.loadingDate}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Demount Date *</Label>
              <Input
                type="date"
                value={
                  typeof containers.demoundDate === "string"
                    ? containers.demoundDate.substring(0, 10)
                    : ""
                }
                onChange={(e) => updateContainer("demoundDate", e.target.value)}
                className={errors.demoundDate ? "border-destructive" : ""}
              />
              {errors.demoundDate ? (
                <p className="text-xs font-medium text-destructive">
                  {errors.demoundDate}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FieldGate field="weight">
              <div className="space-y-1.5">
                <Label>Weight (kg) *</Label>
                <Input
                  type="number"
                  value={containers.weight || ""}
                  onChange={(e) =>
                    updateContainer("weight", parseFloat(e.target.value) || 0)
                  }
                  placeholder="Enter weight"
                  className={errors.weight ? "border-destructive" : ""}
                />
                {errors.weight ? (
                  <p className="text-xs font-medium text-destructive">
                    {errors.weight}
                  </p>
                ) : null}
              </div>
            </FieldGate>
            <FieldGate field="dayHire">
              <div className="space-y-1.5">
                <Label>Day Hire (Rs) *</Label>
                <Input
                  type="number"
                  value={containers.dayHire || ""}
                  onChange={(e) =>
                    updateContainer("dayHire", parseFloat(e.target.value) || 0)
                  }
                  placeholder="Enter day hire"
                  className={errors.dayHire ? "border-destructive" : ""}
                />
                {errors.dayHire ? (
                  <p className="text-xs font-medium text-destructive">
                    {errors.dayHire}
                  </p>
                ) : null}
              </div>
            </FieldGate>
            <FieldGate field="advanced">
              <div className="space-y-1.5">
                <Label>Advanced (Rs) *</Label>
                <Input
                  type="number"
                  value={containers.advanced || ""}
                  onChange={(e) =>
                    updateContainer("advanced", parseFloat(e.target.value) || 0)
                  }
                  placeholder="Enter advanced amount"
                  className={errors.advanced ? "border-destructive" : ""}
                />
                {errors.advanced ? (
                  <p className="text-xs font-medium text-destructive">
                    {errors.advanced}
                  </p>
                ) : null}
              </div>
            </FieldGate>
            <FieldGate field="advancedDate">
              <div>
                <Label>Advanced Date *</Label>
                <Input
                  type="date"
                  value={containers.advancedDate || todayDateInput()}
                  onChange={(e) =>
                    updateContainer("advancedDate", e.target.value)
                  }
                />
              </div>
            </FieldGate>
            <FieldGate field="outHire">
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
            </FieldGate>
            <FieldGate field="other">
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
            </FieldGate>
            <FieldGate field="heldUp">
              <div>
                <Label>Held Up (Rs)</Label>
                <Input
                  type="number"
                  readOnly
                  value={containers.heldUp || ""}
                  placeholder="Auto from dates"
                  className="bg-muted/50"
                />
                {(containers.heldUpExtraDays || 0) > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {containers.heldUpExtraDays} extra day
                    {containers.heldUpExtraDays === 1 ? "" : "s"} after the first
                    day
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Charged after one day from loading to demount
                  </p>
                )}
              </div>
            </FieldGate>
            <FieldGate field="agentFee">
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
            </FieldGate>
            <FieldGate field="transportCommission">
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
            </FieldGate>
            <FieldGate field="return">
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
            </FieldGate>
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
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </div>
  );
}

export default AddContainer;
