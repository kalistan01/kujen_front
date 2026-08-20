import React, { useEffect } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
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

function splitPermissions(allowed: number[]) {
  const permission = Array.from(new Set(allowed));
  const denied = ALL_PERMISSION_IDS.filter((id) => !permission.includes(id));
  return { permission, denied };
}

function AddRole({
  editingRole,
  setRoles,
  setIsDialogOpen,
}: {
  editingRole?: Role;
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    roleName: "",
    permission: DEFAULT_STAFF_PERMISSIONS as number[],
    denied: ALL_PERMISSION_IDS.filter(
      (id) => !DEFAULT_STAFF_PERMISSIONS.includes(id)
    ),
    status: true,
    admin: false,
  });
  const resetForm = () => {
    setFormData({
      roleName: "",
      permission: [...DEFAULT_STAFF_PERMISSIONS],
      denied: ALL_PERMISSION_IDS.filter(
        (id) => !DEFAULT_STAFF_PERMISSIONS.includes(id)
      ),
      status: true,
      admin: false,
    });
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
    }
    return () => {
      resetForm();
    };
  }, [editingRole]);

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    const nextAllowed = checked
      ? [...formData.permission, permissionId]
      : formData.permission.filter((id) => id !== permissionId);
    setFormData({
      ...formData,
      ...splitPermissions(nextAllowed),
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

  const handleSave = () => {
    if (!formData.roleName) {
      toast({
        title: "Validation Error",
        description: "Please enter a role name.",
        variant: "destructive",
      });
      return;
    }
    const payload = formData.admin
      ? {
          ...formData,
          permission: [...ALL_PERMISSION_IDS],
          denied: [] as number[],
        }
      : formData;
    if (editingRole) {
      baseUrl
        .patch("/role/updateRole", payload, {
          headers: { roleid: editingRole._id },
        })
        .then(async () => {
          setRoles((prevRoles) =>
            prevRoles.map((role) =>
              role._id === editingRole._id ? { ...role, ...payload } : role
            )
          );
          toast({
            title: "Success",
            description: "Role updated successfully.",
          });
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      const newRole: Role = {
        id: Date.now().toString(),
        ...payload,
        createdAt: new Date().toISOString().split("T")[0],
      };
      baseUrl
        .post("/role/addRole", newRole)
        .then(async () => {
          setRoles((prevRoles) => [...prevRoles, newRole]);
          toast({
            title: "Success",
            description: "Role created successfully.",
          });
        })
        .catch((error) => {
          console.error(error);
        });
    }
    setIsDialogOpen(false);
    resetForm();
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
      <div>
        <Label htmlFor="roleName">Role Name *</Label>
        <Input
          id="roleName"
          value={formData.roleName}
          onChange={(e) =>
            setFormData({ ...formData, roleName: e.target.value })
          }
          placeholder="Enter role name"
        />
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
        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {editingRole ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export default AddRole;
