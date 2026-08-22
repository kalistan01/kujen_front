import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import {
  ALL_PERMISSION_IDS,
  DEFAULT_STAFF_PERMISSIONS,
  FIELD_PERMISSIONS,
  PAGE_PERMISSIONS,
  hydrateRolePermissions,
  type PermissionItem,
} from "@/lib/permissions";

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
  roleName?: string;
  form?: string;
};

function splitPermissions(allowed: number[]) {
  const permission = Array.from(new Set(allowed));
  const denied = ALL_PERMISSION_IDS.filter((id) => !permission.includes(id));
  return { permission, denied };
}

const emptyForm = {
  roleName: "",
  permission: [...DEFAULT_STAFF_PERMISSIONS] as number[],
  denied: ALL_PERMISSION_IDS.filter(
    (id) => !DEFAULT_STAFF_PERMISSIONS.includes(id)
  ),
  status: true,
  admin: false,
};

function AddRole({
  editingRole,
  roles = [],
  setRoles,
  setIsDialogOpen,
}: {
  editingRole?: Role | null;
  roles?: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      ...emptyForm,
      permission: [...DEFAULT_STAFF_PERMISSIONS],
      denied: ALL_PERMISSION_IDS.filter(
        (id) => !DEFAULT_STAFF_PERMISSIONS.includes(id)
      ),
    });
    setErrors({});
  };

  useEffect(() => {
    if (editingRole) {
      const access = hydrateRolePermissions(
        editingRole.permission,
        editingRole.denied
      );
      setFormData({
        roleName: editingRole.roleName,
        permission: access.permission,
        denied: access.denied,
        status: editingRole.status,
        admin: editingRole.admin,
      });
      setErrors({});
      return;
    }

    resetForm();
  }, [editingRole]);

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    const nextAllowed = checked
      ? [...formData.permission, permissionId]
      : formData.permission.filter((id) => id !== permissionId);
    setFormData({
      ...formData,
      ...splitPermissions(nextAllowed),
    });
    setErrors((prev) => {
      if (!prev.form) return prev;
      const next = { ...prev };
      delete next.form;
      return next;
    });
  };

  const handleGroupToggle = (items: PermissionItem[], checked: boolean) => {
    const ids = items.map((item) => item.id);
    const nextAllowed = checked
      ? Array.from(new Set([...formData.permission, ...ids]))
      : formData.permission.filter((id) => !ids.includes(id));
    setFormData({
      ...formData,
      ...splitPermissions(nextAllowed),
    });
  };

  const validateForm = () => {
    const next: FormErrors = {};
    const roleName = formData.roleName.trim();

    if (!roleName) {
      next.roleName = "Role name is required.";
    } else {
      const taken = roles.some(
        (role) =>
          role._id !== editingRole?._id &&
          role.roleName?.trim().toLowerCase() === roleName.toLowerCase()
      );
      if (taken) {
        next.roleName = `Role name "${roleName}" already exists.`;
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

    const payload = formData.admin
      ? {
          ...formData,
          roleName: formData.roleName.trim(),
          permission: [...ALL_PERMISSION_IDS],
          denied: [] as number[],
        }
      : {
          ...formData,
          roleName: formData.roleName.trim(),
        };

    setSaving(true);

    try {
      if (editingRole) {
        if (!editingRole._id) {
          const message = "This role cannot be updated because it has no ID.";
          setErrors({ form: message });
          toast({
            title: "Unable to update",
            description: message,
            variant: "destructive",
          });
          return;
        }

        await baseUrl.patch("/role/updateRole", payload, {
          headers: { roleid: editingRole._id },
        });
        setRoles((prevRoles) =>
          prevRoles.map((role) =>
            role._id === editingRole._id ? { ...role, ...payload } : role
          )
        );
        toast({
          title: "Success",
          description: "Role updated successfully.",
        });
      } else {
        const response = await baseUrl.post("/role/addRole", payload);
        const created = response.data?.data;
        setRoles((prevRoles) => [
          ...prevRoles,
          created || {
            id: Date.now().toString(),
            ...payload,
            createdAt: new Date().toISOString().split("T")[0],
          },
        ]);
        toast({
          title: "Success",
          description: "Role created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        editingRole
          ? "Could not update the role. Please try again."
          : "Could not create the role. Please try again."
      );
      const isNameError = /role name/i.test(message);
      setErrors(isNameError ? { roleName: message } : { form: message });
      toast({
        title: editingRole ? "Update failed" : "Create failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderGroup = (title: string, items: PermissionItem[]) => {
    const allChecked = items.every((item) =>
      formData.permission.includes(item.id)
    );
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>{title}</Label>
          {!formData.admin && (
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => handleGroupToggle(items, !allChecked)}
            >
              {allChecked ? "Clear" : "Select all"}
            </button>
          )}
        </div>
        <div className="max-h-48 space-y-3 overflow-y-auto rounded-lg border border-border/70 p-3">
          {items.map((permission) => (
            <div key={permission.id} className="flex items-start space-x-3">
              <Checkbox
                id={`permission-${permission.id}`}
                checked={
                  formData.admin || formData.permission.includes(permission.id)
                }
                disabled={formData.admin}
                onCheckedChange={(checked) =>
                  handlePermissionChange(permission.id, checked as boolean)
                }
              />
              <div className="flex-1">
                <Label
                  htmlFor={`permission-${permission.id}`}
                  className="text-sm font-medium"
                >
                  {permission.name}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {permission.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {errors.form ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {errors.form}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="roleName">Role Name *</Label>
        <Input
          id="roleName"
          value={formData.roleName}
          onChange={(e) => {
            setFormData({ ...formData, roleName: e.target.value });
            setErrors((prev) => {
              if (!prev.roleName && !prev.form) return prev;
              const next = { ...prev };
              delete next.roleName;
              delete next.form;
              return next;
            });
          }}
          placeholder="Enter role name"
          className={errors.roleName ? "border-destructive" : ""}
        />
        {errors.roleName ? (
          <p className="text-xs font-medium text-destructive">
            {errors.roleName}
          </p>
        ) : null}
      </div>
      {renderGroup("Pages", PAGE_PERMISSIONS)}
      {renderGroup("Assignment fields", FIELD_PERMISSIONS)}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="admin"
          checked={formData.admin}
          onCheckedChange={(checked) =>
            setFormData({
              ...formData,
              admin: checked as boolean,
              ...(checked
                ? { permission: [...ALL_PERMISSION_IDS], denied: [] }
                : {}),
            })
          }
        />
        <Label htmlFor="admin">Admin Role</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="status"
          checked={formData.status}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, status: checked as boolean })
          }
        />
        <Label htmlFor="status">Active Status</Label>
      </div>
      <div className="flex justify-end gap-2">
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
          ) : editingRole ? (
            "Update"
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </div>
  );
}

export default AddRole;
