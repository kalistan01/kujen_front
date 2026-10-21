import { useEffect, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Users } from "lucide-react";
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

export type LinkedUser = {
  _id: string;
  fullName?: string;
  email?: string;
  status?: boolean;
};

export interface StaffMember {
  _id?: string;
  name: string;
  phone?: string;
  notes?: string;
  userId?: LinkedUser | string | null;
  status?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AccountOption = {
  _id: string;
  fullName: string;
  email: string;
  status?: boolean;
};

type FormErrors = {
  name?: string;
  phone?: string;
  notes?: string;
  userId?: string;
  form?: string;
};

const emptyForm = {
  name: "",
  phone: "",
  notes: "",
  userId: "",
  status: true,
};

const NONE_USER = "__none__";

function linkedUserId(value: StaffMember["userId"]) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || "";
}

function AddStaffMember({
  editingStaff,
  staffMembers = [],
  setStaffMembers,
  setEditingStaff,
  setIsDialogOpen,
  accountOptions = [],
}: {
  editingStaff: StaffMember | null;
  staffMembers?: StaffMember[];
  setStaffMembers: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  setEditingStaff: React.Dispatch<React.SetStateAction<StaffMember | null>>;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  accountOptions?: AccountOption[];
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (editingStaff) {
      setFormData({
        name: editingStaff.name || "",
        phone: editingStaff.phone || "",
        notes: editingStaff.notes || "",
        userId: linkedUserId(editingStaff.userId),
        status: editingStaff.status !== false,
      });
      setErrors({});
      return;
    }
    setFormData(emptyForm);
    setErrors({});
  }, [editingStaff]);

  const resetForm = () => {
    setFormData(emptyForm);
    setErrors({});
    setEditingStaff(null);
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

  const availableAccounts = accountOptions.filter((account) => {
    if (!account._id) return false;
    if (account.status === false) return false;
    const taken = staffMembers.some((member) => {
      const id = linkedUserId(member.userId);
      if (!id || id !== account._id) return false;
      return member._id !== editingStaff?._id;
    });
    return !taken;
  });

  const validateForm = () => {
    const next: FormErrors = {};
    const name = formData.name.trim();
    const phone = formData.phone.trim();
    const notes = formData.notes.trim();

    if (!name) next.name = "Name is required.";
    else if (name.length > 120) {
      next.name = "Name cannot be longer than 120 characters.";
    }

    if (phone.length > 40) {
      next.phone = "Phone cannot be longer than 40 characters.";
    }
    if (notes.length > 500) {
      next.notes = "Notes cannot be longer than 500 characters.";
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
      phone: formData.phone.trim(),
      notes: formData.notes.trim(),
      userId: formData.userId || null,
      status: formData.status,
    };
    const staffId = editingStaff?._id;
    setSaving(true);

    try {
      if (editingStaff) {
        if (!staffId) {
          const message =
            "This staff member cannot be updated because it has no ID.";
          setErrors({ form: message });
          toast({
            title: "Unable to update",
            description: message,
            variant: "destructive",
          });
          return;
        }

        const response = await baseUrl.put(`/staff-member/${staffId}`, payload);
        const updated = response.data.data as StaffMember;
        setStaffMembers((prev) =>
          prev.map((item) =>
            item._id === staffId ? { ...item, ...updated } : item
          )
        );
        toast({
          title: "Success",
          description: "Staff member updated successfully.",
        });
      } else {
        const response = await baseUrl.post("/staff-member", payload);
        const created = response.data.data as StaffMember;
        setStaffMembers((prev) =>
          [...prev, created].sort((a, b) =>
            String(a.name || "").localeCompare(String(b.name || ""))
          )
        );
        toast({
          title: "Success",
          description: "Staff member created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        editingStaff
          ? "Could not update the staff member. Please try again."
          : "Could not create the staff member. Please try again."
      );
      const field: keyof FormErrors = /phone/i.test(message)
        ? "phone"
        : /note/i.test(message)
          ? "notes"
          : /user/i.test(message)
            ? "userId"
            : /name/i.test(message)
              ? "name"
              : "form";
      setErrors({ [field]: message });
      toast({
        title: editingStaff ? "Update failed" : "Create failed",
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
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Staff details
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
              placeholder="Enter staff name"
              className={`h-10 ${errors.name ? "border-destructive" : ""}`}
            />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <Input
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                clearError("phone");
              }}
              placeholder="Optional phone"
              className={`h-10 ${errors.phone ? "border-destructive" : ""}`}
            />
          </Field>
          <Field label="Linked user account" error={errors.userId}>
            <Select
              value={formData.userId || NONE_USER}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  userId: value === NONE_USER ? "" : value,
                });
                clearError("userId");
              }}
            >
              <SelectTrigger
                className={`h-10 text-sm ${errors.userId ? "border-destructive" : ""}`}
              >
                <SelectValue placeholder="No login account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_USER}>No login account</SelectItem>
                {availableAccounts.map((account) => (
                  <SelectItem key={account._id} value={account._id}>
                    {account.fullName}
                    {account.email ? ` (${account.email})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Optional. Link a login user when this person also has an account.
            </p>
          </Field>
          <Field label="Notes" error={errors.notes}>
            <Textarea
              value={formData.notes}
              onChange={(e) => {
                setFormData({ ...formData, notes: e.target.value });
                clearError("notes");
              }}
              placeholder="Optional notes"
              className={`min-h-[80px] ${errors.notes ? "border-destructive" : ""}`}
            />
          </Field>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive staff are hidden from the daily roster.
              </p>
            </div>
            <Switch
              checked={formData.status}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, status: checked })
              }
            />
          </div>
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
          ) : editingStaff ? (
            "Update"
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </div>
  );
}

export default AddStaffMember;
