import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";

function Field({
  label,
  required,
  children,
  className = "",
  error,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  error?: string;
}) {
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

type FormErrors = {
  ownerName?: string;
  phoneNum?: string;
  companyName?: string;
  address?: string;
  lorryNum?: string;
  capacity?: string;
  form?: string;
};

interface Lorry {
  _id?: string;
  lorryNum: string;
  capacity: string;
  inUse?: boolean;
}

interface LorryOwner {
  id?: string;
  _id?: string;
  ownerName: string;
  phoneNum: string;
  address: string;
  companyName: string;
  lorries: Lorry[];
  createdAt: string;
}

const emptyForm = {
  _id: "",
  ownerName: "",
  phoneNum: "",
  address: "",
  companyName: "",
  lorries: [] as Lorry[],
};

function AddLorryOwner({
  owners = [],
  setOwners,
  setIsDialogOpen,
  editingOwner,
  setEditingOwner,
}: {
  owners?: LorryOwner[];
  setOwners: React.Dispatch<React.SetStateAction<LorryOwner[]>>;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingOwner: React.Dispatch<React.SetStateAction<LorryOwner | null>>;
  editingOwner: LorryOwner | null;
}) {
  const { toast } = useToast();
  const [newLorry, setNewLorry] = useState({
    lorryNum: "",
    capacity: "",
  });
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (editingOwner) {
      setFormData({
        _id: editingOwner._id || "",
        ownerName: editingOwner.ownerName || "",
        phoneNum: editingOwner.phoneNum || "",
        address: editingOwner.address || "",
        companyName: editingOwner.companyName || "",
        lorries: editingOwner.lorries || [],
      });
      setErrors({});
      return;
    }

    setFormData(emptyForm);
    setNewLorry({ lorryNum: "", capacity: "" });
    setErrors({});
  }, [editingOwner]);

  const resetForm = () => {
    setFormData(emptyForm);
    setNewLorry({
      lorryNum: "",
      capacity: "",
    });
    setErrors({});
    setEditingOwner(null);
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

  const isLorryNumberTaken = (lorryNum: string, skipIndex?: number) => {
    const value = lorryNum.trim().toLowerCase();
    if (!value) return null;

    const inForm = formData.lorries.some(
      (lorry, index) =>
        index !== skipIndex && lorry.lorryNum?.trim().toLowerCase() === value
    );
    if (inForm) return "This lorry number is already in the list.";

    const takenElsewhere = owners.some(
      (owner) =>
        owner._id !== editingOwner?._id &&
        owner.lorries?.some(
          (lorry) => lorry.lorryNum?.trim().toLowerCase() === value
        )
    );
    if (takenElsewhere) {
      return `Lorry number "${lorryNum.trim()}" is already registered.`;
    }

    return null;
  };

  const validateOwnerForm = () => {
    const next: FormErrors = {};
    const ownerName = formData.ownerName.trim();
    const companyName = formData.companyName.trim();
    const address = formData.address.trim();
    const phoneNum = formData.phoneNum.trim();

    if (!ownerName) next.ownerName = "Owner name is required.";
    if (!companyName) next.companyName = "Company name is required.";
    if (!address) next.address = "Address is required.";
    if (phoneNum && !/^\+?\d{9,15}$/.test(phoneNum.replace(/[\s-]/g, ""))) {
      next.phoneNum = "Enter a valid phone number (9–15 digits).";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validateOwnerForm()) {
      toast({
        title: "Missing details",
        description: "Please correct the highlighted fields and try again.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ownerName: formData.ownerName.trim(),
      phoneNum: formData.phoneNum.trim(),
      address: formData.address.trim(),
      companyName: formData.companyName.trim(),
      lorries: formData.lorries,
    };

    const ownerId = editingOwner?._id;
    setSaving(true);

    try {
      if (editingOwner) {
        if (!ownerId) {
          const message = "This owner cannot be updated because it has no ID.";
          setErrors({ form: message });
          toast({
            title: "Unable to update",
            description: message,
            variant: "destructive",
          });
          return;
        }

        const response = await baseUrl.put(`/lorry/${ownerId}`, payload);
        const updated = response.data.data;
        setOwners((prev) =>
          prev.map((owner) =>
            owner._id === ownerId ? { ...owner, ...updated } : owner
          )
        );
        toast({
          title: "Success",
          description: "Lorry owner updated successfully.",
        });
      } else {
        const response = await baseUrl.post("/lorry", payload);
        const created: LorryOwner = {
          ...response.data.owner,
          lorries: response.data.lorries || payload.lorries,
        };
        setOwners((prev) => [...prev, created]);
        toast({
          title: "Success",
          description: "Lorry owner created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        editingOwner
          ? "Could not update the lorry owner. Please try again."
          : "Could not create the lorry owner. Please try again."
      );
      setErrors({ form: message });
      toast({
        title: editingOwner ? "Update failed" : "Create failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addLorry = () => {
    const lorryNum = newLorry.lorryNum.trim();
    const capacity = newLorry.capacity.trim();
    const next: FormErrors = {};

    if (!lorryNum) next.lorryNum = "Lorry number is required.";
    if (!capacity) next.capacity = "Capacity is required.";

    if (lorryNum) {
      const takenMessage = isLorryNumberTaken(lorryNum);
      if (takenMessage) next.lorryNum = takenMessage;
    }

    if (Object.keys(next).length) {
      setErrors((prev) => ({ ...prev, ...next }));
      toast({
        title: "Cannot add lorry",
        description: next.lorryNum || next.capacity,
        variant: "destructive",
      });
      return;
    }

    setFormData({
      ...formData,
      lorries: [...formData.lorries, { lorryNum, capacity }],
    });
    setNewLorry({ lorryNum: "", capacity: "" });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.lorryNum;
      delete next.capacity;
      delete next.form;
      return next;
    });
  };

  const removeLorry = (index: number) => {
    const lorry = formData.lorries[index];
    if (editingOwner && lorry?.inUse) {
      const message = `Cannot remove ${lorry.lorryNum || "this lorry"} because it is used in an assignment.`;
      setErrors({ form: message });
      toast({
        title: "Cannot remove lorry",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setFormData({
      ...formData,
      lorries: formData.lorries.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Owner details
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          {errors.form ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 sm:col-span-2">
              {errors.form}
            </p>
          ) : null}
          <Field label="Owner Name" required error={errors.ownerName}>
            <Input
              id="ownerName"
              value={formData.ownerName}
              onChange={(e) => {
                setFormData({ ...formData, ownerName: e.target.value });
                clearError("ownerName");
              }}
              placeholder="Enter owner name"
              className={`h-10 ${errors.ownerName ? "border-destructive" : ""}`}
            />
          </Field>
          <Field label="Phone Number" error={errors.phoneNum}>
            <Input
              id="phoneNum"
              value={formData.phoneNum}
              onChange={(e) => {
                setFormData({ ...formData, phoneNum: e.target.value });
                clearError("phoneNum");
              }}
              placeholder="Enter phone number"
              className={`h-10 ${errors.phoneNum ? "border-destructive" : ""}`}
            />
          </Field>
          <Field
            label="Company Name"
            required
            className="sm:col-span-2"
            error={errors.companyName}
          >
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => {
                setFormData({ ...formData, companyName: e.target.value });
                clearError("companyName");
              }}
              placeholder="Enter company name"
              className={`h-10 ${errors.companyName ? "border-destructive" : ""}`}
            />
          </Field>
          <Field
            label="Address"
            required
            className="sm:col-span-2"
            error={errors.address}
          >
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value });
                clearError("address");
              }}
              placeholder="Enter address"
              rows={3}
              className={errors.address ? "border-destructive" : ""}
            />
          </Field>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Fleet
            </h3>
          </div>
          <Badge variant="secondary">
            {formData.lorries.length}{" "}
            {formData.lorries.length === 1 ? "lorry" : "lorries"}
          </Badge>
        </div>
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Field label="Lorry Number" error={errors.lorryNum}>
              <Input
                placeholder="e.g. WP-1234"
                value={newLorry.lorryNum}
                onChange={(e) => {
                  setNewLorry({ ...newLorry, lorryNum: e.target.value });
                  clearError("lorryNum");
                }}
                className={`h-10 ${errors.lorryNum ? "border-destructive" : ""}`}
              />
            </Field>
            <Field label="Capacity" error={errors.capacity}>
              <Input
                placeholder="e.g. 40 FEET"
                value={newLorry.capacity}
                onChange={(e) => {
                  setNewLorry({ ...newLorry, capacity: e.target.value });
                  clearError("capacity");
                }}
                className={`h-10 ${errors.capacity ? "border-destructive" : ""}`}
              />
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={addLorry}
                className="h-10 w-full bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))] sm:w-10 sm:px-0"
              >
                <Plus className="h-4 w-4" />
                <span className="sm:hidden">Add lorry</span>
              </Button>
            </div>
          </div>

          {formData.lorries.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {formData.lorries.map((lorry, index) => (
                <div
                  key={lorry._id || index}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Truck className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {lorry.lorryNum}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lorry.capacity} FEET
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {lorry.inUse && (
                      <Badge variant="secondary">Assigned</Badge>
                    )}
                    {(!editingOwner || !lorry.inUse) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLorry(index)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
              No lorries added yet.
            </p>
          )}
        </div>
      </section>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setIsDialogOpen(false);
            resetForm();
          }}
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
          ) : editingOwner ? (
            "Update"
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </div>
  );
}

export default AddLorryOwner;
