import { useEffect, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Contact } from "lucide-react";
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

export interface Buyer {
  _id?: string;
  name: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

type FormErrors = {
  name?: string;
  address?: string;
  form?: string;
};

const emptyForm = {
  name: "",
  address: "",
};

function AddBuyer({
  editingBuyer,
  buyers = [],
  setBuyers,
  setEditingBuyer,
  setIsDialogOpen,
}: {
  editingBuyer: Buyer | null;
  buyers?: Buyer[];
  setBuyers: React.Dispatch<React.SetStateAction<Buyer[]>>;
  setEditingBuyer: React.Dispatch<React.SetStateAction<Buyer | null>>;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (editingBuyer) {
      setFormData({
        name: editingBuyer.name || "",
        address: editingBuyer.address || "",
      });
      setErrors({});
      return;
    }
    setFormData(emptyForm);
    setErrors({});
  }, [editingBuyer]);

  const resetForm = () => {
    setFormData(emptyForm);
    setErrors({});
    setEditingBuyer(null);
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
    const name = formData.name.trim();
    const address = formData.address.trim();

    if (!name) next.name = "Name is required.";
    else if (name.length > 120) {
      next.name = "Name cannot be longer than 120 characters.";
    }

    if (!address) next.address = "Address is required.";
    else if (address.length > 500) {
      next.address = "Address cannot be longer than 500 characters.";
    }

    if (name) {
      const taken = buyers.some(
        (item) =>
          item._id !== editingBuyer?._id &&
          item.name?.trim().toLowerCase() === name.toLowerCase()
      );
      if (taken) next.name = `A buyer named "${name}" already exists.`;
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
      name: formData.name.trim(),
      address: formData.address.trim(),
    };
    const buyerId = editingBuyer?._id;
    setSaving(true);

    try {
      if (editingBuyer) {
        if (!buyerId) {
          const message = "This buyer cannot be updated because it has no ID.";
          setErrors({ form: message });
          toast({
            title: "Unable to update",
            description: message,
            variant: "destructive",
          });
          return;
        }

        const response = await baseUrl.put(`/buyer/${buyerId}`, payload);
        const updated = response.data.data;
        setBuyers((prev) =>
          prev.map((item) =>
            item._id === buyerId ? { ...item, ...updated } : item
          )
        );
        toast({
          title: "Success",
          description: "Buyer updated successfully.",
        });
      } else {
        const response = await baseUrl.post("/buyer", payload);
        const created = response.data.data;
        setBuyers((prev) =>
          [...prev, created].sort((a, b) =>
            String(a.name || "").localeCompare(String(b.name || ""))
          )
        );
        toast({
          title: "Success",
          description: "Buyer created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        editingBuyer
          ? "Could not update the buyer. Please try again."
          : "Could not create the buyer. Please try again."
      );
      const field: keyof FormErrors = /address/i.test(message)
        ? "address"
        : /name/i.test(message)
          ? "name"
          : "form";
      setErrors({ [field]: message });
      toast({
        title: editingBuyer ? "Update failed" : "Create failed",
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
          <Contact className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Buyer details
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4">
          <Field label="Name" required error={errors.name}>
            <Input
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                clearError("name");
              }}
              placeholder="Enter buyer name"
              className={`h-10 ${errors.name ? "border-destructive" : ""}`}
            />
          </Field>
          <Field label="Address" required error={errors.address}>
            <Textarea
              value={formData.address}
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value });
                clearError("address");
              }}
              placeholder="Enter address"
              className={`min-h-[96px] ${errors.address ? "border-destructive" : ""}`}
            />
          </Field>
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
          ) : editingBuyer ? (
            "Update"
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </div>
  );
}

export default AddBuyer;
