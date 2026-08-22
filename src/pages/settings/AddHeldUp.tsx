import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CircleDollarSign, Loader2 } from "lucide-react";
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

export interface HeldUpRate {
  _id?: string;
  amount: number;
  date: string;
  status: boolean;
  createdAt?: string;
}

type FormErrors = {
  amount?: string;
  form?: string;
};

function AddHeldUp({
  heldUps,
  setHeldUps,
  setIsDialogOpen,
}: {
  heldUps: HeldUpRate[];
  setHeldUps: React.Dispatch<React.SetStateAction<HeldUpRate[]>>;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    amount: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const hasActive = heldUps.some((item) => item.status);

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
    const amount = Number(formData.amount);

    if (formData.amount.trim() === "" || !Number.isFinite(amount)) {
      next.amount = "Held up amount is required.";
    } else if (amount < 0) {
      next.amount = "Held up amount cannot be negative.";
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

    setSaving(true);
    try {
      const response = await baseUrl.post("/heldup", {
        amount: Number(formData.amount),
      });
      const created = response.data.data as HeldUpRate;
      setHeldUps((prev) => [
        created,
        ...prev.map((item) =>
          item.status ? { ...item, status: false } : item
        ),
      ]);
      toast({
        title: "Success",
        description: hasActive
          ? "Held up added. The previous rate is now inactive."
          : "Held up added successfully.",
      });
      setIsDialogOpen(false);
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        "Could not create the held up rate. Please try again."
      );
      const field: keyof FormErrors = /amount/i.test(message)
        ? "amount"
        : "form";
      setErrors({ [field]: message });
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
    <div className="space-y-5">
      {errors.form ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {errors.form}
        </p>
      ) : null}

      {hasActive ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Saving this will disable the current active held up rate.
        </p>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <CircleDollarSign className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Held up details
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4">
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
              placeholder="Enter held up amount"
              className={`h-10 ${errors.amount ? "border-destructive" : ""}`}
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
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

export default AddHeldUp;
