import React, { useEffect } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";
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
const availablePermissions = [
  { id: 1, name: "View Users", description: "Can view user information" },
  {
    id: 2,
    name: "Manage Users",
    description: "Can add, edit, and delete users",
  },
  { id: 3, name: "View Lorries", description: "Can view lorry information" },
  {
    id: 4,
    name: "Manage Lorries",
    description: "Can add, edit, and delete lorries",
  },
  {
    id: 5,
    name: "Manage Assignments",
    description: "Can create and modify assignments",
  },
];
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
    permission: [] as number[],
    denied: [] as number[],
    status: true,
    admin: false,
  });
  const resetForm = () => {
    setFormData({
      roleName: "",
      permission: [],
      denied: [],
      status: true,
      admin: false,
    });
  };
  useEffect(() => {
    if (editingRole) {
      setFormData({
        roleName: editingRole.roleName,
        permission: editingRole.permission,
        denied: editingRole.denied,
        status: editingRole.status,
        admin: editingRole.admin,
      });
    }
    return () => {
      resetForm();
    };
  }, [editingRole]);

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        permission: [...formData.permission, permissionId],
        denied: formData.denied.filter((id) => id !== permissionId),
      });
    } else {
      setFormData({
        ...formData,
        permission: formData.permission.filter((id) => id !== permissionId),
        denied: [...formData.denied, permissionId],
      });
    }
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
    if (editingRole) {
      baseUrl
        .patch("/role/updateRole", formData,{
            headers: { roleid: editingRole._id },
        })
        .then(async (response) => {
          setRoles((prevRoles) =>
            prevRoles.map((role) =>
              role._id === editingRole._id ? { ...role, ...formData } : role
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
        ...formData,
        createdAt: new Date().toISOString().split("T")[0],
      };
      baseUrl
        .post("/role/addRole", newRole)
        .then(async (response) => {
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
      <div>
        <Label>Permissions</Label>
        <div className="space-y-3 mt-2 max-h-48 overflow-y-auto">
          {availablePermissions.map((permission) => (
            <div key={permission.id} className="flex items-start space-x-3">
              <Checkbox
                id={`permission-${permission.id}`}
                checked={formData.permission.includes(permission.id)}
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
      <div className="flex items-center space-x-2">
        <Checkbox
          id="admin"
          checked={formData.admin}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, admin: checked as boolean })
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
