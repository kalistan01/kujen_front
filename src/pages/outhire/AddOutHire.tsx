import { useEffect, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";

function Field({
  label,
  required,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
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

export interface OutHire {
  _id?: string;
  location: string;
  distanceKm: number;
  amount: number;
  status?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

type FormErrors = {
  location?: string;
  distanceKm?: string;
  amount?: string;
  form?: string;
};

export function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const emptyForm = {
  _id: "",
  location: "",
  distanceKm: "",
  amount: "",
};

function AddOutHire({
  editingOutHire,
  outHires = [],
  setOutHires,
  setEditingOutHire,
  setIsDialogOpen,
}: {
  editingOutHire: OutHire | null;
  outHires?: OutHire[];
  setOutHires: React.Dispatch<React.SetStateAction<OutHire[]>>;
  setEditingOutHire: React.Dispatch<React.SetStateAction<OutHire | null>>;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (editingOutHire) {
      setFormData({
        _id: editingOutHire._id || "",
        location: editingOutHire.location || "",
        distanceKm:
          editingOutHire.distanceKm === undefined ||
          editingOutHire.distanceKm === null
            ? ""
            : String(editingOutHire.distanceKm),
        amount:
          editingOutHire.amount === undefined || editingOutHire.amount === null
            ? ""
            : String(editingOutHire.amount),
      });
      setErrors({});
      return;
    }

    setFormData(emptyForm);
    setErrors({});
  }, [editingOutHire]);

  const resetForm = () => {
    setFormData(emptyForm);
    setErrors({});
    setEditingOutHire(null);
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => {
      if (!prev[field] && !prev.form) return prev;
      const next = { ...prev };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  const validateForm = () => {
    const next: FormErrors = {};
    const location = formData.location.trim();
    const distanceKm = Number(formData.distanceKm);
    const amount = Number(formData.amount);

    if (!location) next.location = "Location is required.";

    if (formData.distanceKm.trim() === "" || !Number.isFinite(distanceKm)) {
      next.distanceKm = "Distance is required.";
    } else if (distanceKm < 0) {
      next.distanceKm = "Distance cannot be negative.";
    }

    if (formData.amount.trim() === "" || !Number.isFinite(amount)) {
      next.amount = "Amount is required.";
    } else if (amount < 0) {
      next.amount = "Amount cannot be negative.";
    }

    if (location && Number.isFinite(distanceKm)) {
      const taken = outHires.some(
        (item) =>
          item._id !== editingOutHire?._id &&
          item.location?.trim().toLowerCase() === location.toLowerCase() &&
          Number(item.distanceKm) === distanceKm
      );
      if (taken) {
        next.distanceKm = `An out hire for "${location}" at ${distanceKm} km already exists.`;
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Missing details",
        description: "Please correct the highlighted fields and try again.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      location: formData.location.trim(),
      distanceKm: Number(formData.distanceKm),
      amount: Number(formData.amount),
    };
    const outHireId = editingOutHire?._id;
    setSaving(true);

    try {
      if (editingOutHire) {
        if (!outHireId) {
          const message =
            "This out hire cannot be updated because it has no ID.";
          setErrors({ form: message });
          toast({
            title: "Unable to update",
            description: message,
            variant: "destructive",
          });
          return;
        }

        const response = await baseUrl.put(`/outhire/${outHireId}`, payload);
        const updated = response.data.data;
        setOutHires((prev) =>
          prev.map((item) =>
            item._id === outHireId ? { ...item, ...updated } : item
          )
        );
        toast({
          title: "Success",
          description: "Out hire updated successfully.",
        });
      } else {
        const response = await baseUrl.post("/outhire", payload);
        const created = response.data.data;
        setOutHires((prev) => [...prev, created]);
        toast({
          title: "Success",
          description: "Out hire created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        editingOutHire
          ? "Could not update the out hire. Please try again."
          : "Could not create the out hire. Please try again."
      );
      const field: keyof FormErrors = /location/i.test(message)
        ? "location"
        : /distance/i.test(message)
          ? "distanceKm"
          : /amount/i.test(message)
            ? "amount"
            : "form";
      setErrors({ [field]: message });
      toast({
        title: editingOutHire ? "Update failed" : "Create failed",
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
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Out hire details
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4">
          <Field label="Location" required error={errors.location}>
            <Input
              value={formData.location}
              onChange={(e) => {
                setFormData({ ...formData, location: e.target.value });
                clearError("location");
              }}
              placeholder="Enter location"
              className={`h-10 ${errors.location ? "border-destructive" : ""}`}
            />
          </Field>
          <Field label="Distance (km)" required error={errors.distanceKm}>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={formData.distanceKm}
              onChange={(e) => {
                setFormData({ ...formData, distanceKm: e.target.value });
                clearError("distanceKm");
              }}
              placeholder="Enter distance in km"
              className={`h-10 ${errors.distanceKm ? "border-destructive" : ""}`}
            />
          </Field>
          <Field label="Amount (Rs)" required error={errors.amount}>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={formData.amount}
              onChange={(e) => {
                setFormData({ ...formData, amount: e.target.value });
                clearError("amount");
              }}
              placeholder="Enter amount"
              className={`h-10 ${errors.amount ? "border-destructive" : ""}`}
            />
          </Field>
          {editingOutHire ? (
            <Field label="Updated">
              <p className="flex h-10 items-center text-sm text-foreground">
                {formatDateTime(
                  editingOutHire.updatedAt || editingOutHire.createdAt
                )}
              </p>
            </Field>
          ) : null}
        </div>
      </section>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setIsDialogOpen(false);
            resetForm();
          }}
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
          ) : editingOutHire ? (
            "Update"
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </div>
  );
}

export default AddOutHire;
