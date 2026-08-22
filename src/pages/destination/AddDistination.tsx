import { useEffect, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";
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

interface Destination {
  _id?: string;
  id?: string;
  type: string;
  location: string;
  createdAt?: string;
  status?: boolean;
}

interface DropDistination {
  id: string;
  type: string;
}

type FormErrors = {
  type?: string;
  location?: string;
  form?: string;
};

const mockDropDistinations: DropDistination[] = [
  { id: "1", type: "Port" },
  { id: "2", type: "Yard" },
  { id: "3", type: "Store" },
  { id: "4", type: "RCT" },
  { id: "5", type: "Other" },
];

const emptyForm = {
  _id: "",
  type: "",
  location: "",
};

function AddDistination({
  editingDestination,
  destinations = [],
  setDestinations,
  setEditingDestination,
  setIsDialogOpen,
}: {
  editingDestination: Destination | null;
  destinations?: Destination[];
  setDestinations: React.Dispatch<React.SetStateAction<Destination[]>>;
  setEditingDestination: React.Dispatch<
    React.SetStateAction<Destination | null>
  >;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (editingDestination) {
      setFormData({
        _id: editingDestination._id || "",
        type: editingDestination.type || "",
        location: editingDestination.location || "",
      });
      setErrors({});
      return;
    }

    setFormData(emptyForm);
    setErrors({});
  }, [editingDestination]);

  const resetForm = () => {
    setFormData(emptyForm);
    setErrors({});
    setEditingDestination(null);
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
    const type = formData.type.trim();
    const location = formData.location.trim();

    if (!type) next.type = "Please select a destination type.";
    if (!location) next.location = "Location is required.";

    if (type && location) {
      const taken = destinations.some(
        (destination) =>
          destination._id !== editingDestination?._id &&
          destination.type?.trim().toLowerCase() === type.toLowerCase() &&
          destination.location?.trim().toLowerCase() === location.toLowerCase()
      );
      if (taken) {
        next.location = `A ${type} destination at "${location}" already exists.`;
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
      type: formData.type.trim(),
      location: formData.location.trim(),
    };
    const destinationId = editingDestination?._id;
    setSaving(true);

    try {
      if (editingDestination) {
        if (!destinationId) {
          const message =
            "This destination cannot be updated because it has no ID.";
          setErrors({ form: message });
          toast({
            title: "Unable to update",
            description: message,
            variant: "destructive",
          });
          return;
        }

        const response = await baseUrl.put(
          `/destination/${destinationId}`,
          payload
        );
        const updated = response.data.data;
        setDestinations((prevDestinations) =>
          prevDestinations.map((dest) =>
            dest._id === destinationId ? { ...dest, ...updated } : dest
          )
        );
        toast({
          title: "Success",
          description: "Destination updated successfully.",
        });
      } else {
        const response = await baseUrl.post("/destination", payload);
        const created = response.data.data;
        setDestinations((prev) => [...prev, created]);
        toast({
          title: "Success",
          description: "Destination created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        editingDestination
          ? "Could not update the destination. Please try again."
          : "Could not create the destination. Please try again."
      );
      const field: keyof FormErrors = /type/i.test(message)
        ? "type"
        : /location|already exists/i.test(message)
          ? "location"
          : "form";
      setErrors({ [field]: message });
      toast({
        title: editingDestination ? "Update failed" : "Create failed",
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
            Route details
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4">
          <Field label="Destination Type" required error={errors.type}>
            <Select
              value={formData.type}
              onValueChange={(value) => {
                setFormData({ ...formData, type: value });
                clearError("type");
              }}
            >
              <SelectTrigger
                className={`h-10 ${errors.type ? "border-destructive" : ""}`}
              >
                <SelectValue placeholder="Select destination type" />
              </SelectTrigger>
              <SelectContent>
                {mockDropDistinations.map((dest) => (
                  <SelectItem key={dest.id} value={dest.type}>
                    {dest.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Location" required error={errors.location}>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => {
                setFormData({ ...formData, location: e.target.value });
                clearError("location");
              }}
              placeholder="Enter location"
              className={`h-10 ${errors.location ? "border-destructive" : ""}`}
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
          ) : editingDestination ? (
            "Update"
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </div>
  );
}

export default AddDistination;
