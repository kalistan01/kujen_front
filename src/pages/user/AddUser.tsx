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
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2, Shield, UserRound } from "lucide-react";
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

interface User {
  id: string;
  _id?: string;
  fullName: string;
  email: string;
  status: boolean;
  password: string;
  roleId: string;
  roleName: string;
  createdAt: string;
}

interface Role {
  id: string;
  _id?: string;
  roleName: string;
  permission: number[];
  denied: number[];
  status: boolean;
  admin: boolean;
  createdAt: string;
}

type FormErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  roleId?: string;
  form?: string;
};

const emptyForm = {
  fullName: "",
  _id: "",
  email: "",
  password: "",
  roleId: "",
  status: true,
};

function AddUser({
  setEditingUser,
  editingUser,
  users = [],
  setUsers,
  setIsDialogOpen,
}: {
  setEditingUser: React.Dispatch<React.SetStateAction<User | null>>;
  editingUser: User | null;
  users?: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState(emptyForm);
  const isAdminUser = editingUser?.roleName === "admin";

  const resetForm = () => {
    setFormData(emptyForm);
    setErrors({});
    setShowPassword(false);
    setEditingUser(null);
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

  useEffect(() => {
    if (editingUser) {
      setFormData({
        _id: editingUser._id || "",
        fullName: editingUser.fullName || "",
        email: editingUser.email || "",
        password: "",
        roleId: editingUser.roleId || "",
        status: editingUser.status,
      });
      setErrors({});
      return;
    }

    setFormData(emptyForm);
    setErrors({});
    setShowPassword(false);
  }, [editingUser]);

  useEffect(() => {
    baseUrl
      .get("/role/findRole")
      .then(async (response) => {
        setRoles(response.data.data || []);
      })
      .catch((error) => {
        const message = getApiErrorMessage(
          error,
          "Could not load roles. Please try again."
        );
        setErrors((prev) => ({ ...prev, form: message }));
        toast({
          title: "Unable to load roles",
          description: message,
          variant: "destructive",
        });
      });
  }, []);

  const validateForm = () => {
    const next: FormErrors = {};
    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (!fullName) next.fullName = "Full name is required.";

    if (!editingUser) {
      if (!email) {
        next.email = "Email is required.";
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        next.email = "Enter a valid email address.";
      } else {
        const taken = users.some(
          (user) => user.email?.trim().toLowerCase() === email.toLowerCase()
        );
        if (taken) {
          next.email = `A user with email "${email}" already exists.`;
        }
      }

      if (!password) {
        next.password = "Password is required.";
      } else if (password.length < 6) {
        next.password = "Password must be at least 6 characters.";
      }
    }

    if (!isAdminUser && !formData.roleId) {
      next.roleId = "Please select a role.";
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

    const roleName =
      roles.find((role) => role._id === formData.roleId)?.roleName ||
      editingUser?.roleName ||
      "";

    setSaving(true);

    try {
      if (editingUser) {
        if (!editingUser._id) {
          const message = "This user cannot be updated because it has no ID.";
          setErrors({ form: message });
          toast({
            title: "Unable to update",
            description: message,
            variant: "destructive",
          });
          return;
        }

        const payload = {
          fullName: formData.fullName.trim(),
          status: formData.status,
          roleId: formData.roleId,
        };

        await baseUrl.put("/user/" + editingUser._id, payload);
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === editingUser._id
              ? { ...user, ...payload, roleName }
              : user
          )
        );
        toast({
          title: "Success",
          description: "User updated successfully.",
        });
      } else {
        const payload = {
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          roleId: formData.roleId,
          status: formData.status,
        };

        const response = await baseUrl.post("/user", payload);
        const created = response.data?.data;
        setUsers((prevUsers) => [
          ...prevUsers,
          {
            id: created?._id || Date.now().toString(),
            password: "",
            ...payload,
            ...created,
            roleName: created?.roleName || roleName,
          },
        ]);
        toast({
          title: "Success",
          description: "User created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        editingUser
          ? "Could not update the user. Please try again."
          : "Could not create the user. Please try again."
      );
      const field: keyof FormErrors = /email/i.test(message)
        ? "email"
        : /password/i.test(message)
          ? "password"
          : /role/i.test(message)
            ? "roleId"
            : /full name|name is required/i.test(message)
              ? "fullName"
              : "form";
      setErrors({ [field]: message });
      toast({
        title: editingUser ? "Update failed" : "Create failed",
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
          <UserRound className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Account details
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4">
          <Field label="Full Name" required error={errors.fullName}>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
                clearError("fullName");
              }}
              placeholder="Enter full name"
              className={`h-10 ${errors.fullName ? "border-destructive" : ""}`}
            />
          </Field>
          {!editingUser && (
            <Field label="Email" required error={errors.email}>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  clearError("email");
                }}
                placeholder="you@rgbrothers.com"
                className={`h-10 ${errors.email ? "border-destructive" : ""}`}
              />
            </Field>
          )}
          {!editingUser && (
            <Field label="Password" required error={errors.password}>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    clearError("password");
                  }}
                  placeholder="Enter password"
                  className={`h-10 pr-12 ${errors.password ? "border-destructive" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 p-0 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Field>
          )}
        </div>
      </section>

      {!isAdminUser && (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Access
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4">
            <Field label="Role" required error={errors.roleId}>
              <Select
                value={formData.roleId}
                onValueChange={(value) => {
                  setFormData({ ...formData, roleId: value });
                  clearError("roleId");
                }}
              >
                <SelectTrigger
                  className={`h-10 ${errors.roleId ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => role._id)
                    .map((role) => (
                      <SelectItem key={role._id} value={role._id!}>
                        {role.roleName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-3 py-3">
              <div>
                <p className="text-sm font-medium">Active status</p>
                <p className="text-xs text-muted-foreground">
                  Inactive users cannot sign in.
                </p>
              </div>
              <Checkbox
                id="status"
                checked={formData.status}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, status: checked as boolean })
                }
              />
            </div>
          </div>
        </section>
      )}

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
          ) : editingUser ? (
            "Update"
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </div>
  );
}

export default AddUser;
