import React, { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import {  Eye, EyeOff } from "lucide-react";

import baseUrl from "@/api/baseUrl";
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
function AddUser({
  setEditingUser,
  editingUser,
  setUsers,
  setIsDialogOpen,
}: {
  setEditingUser: React.Dispatch<React.SetStateAction<User | null>>;
  editingUser: User | null;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    _id: "",
    email: "",
    password: "",
    roleId: "",
    status: true,
  });
  const resetForm = () => {
    setFormData({
      fullName: "",
      _id: "",
      email: "",
      password: "",
      roleId: "",
      status: true,
    });
    setEditingUser(null);
  };
  useEffect(() => {
    if (editingUser) {
      setFormData({
        _id: editingUser?._id,
        fullName: editingUser.fullName,
        email: editingUser.email,
        password: "",
        roleId: editingUser.roleId,
        status: editingUser.status,
      });
    }

    return () => {
      resetForm();
    };
  }, [editingUser]);

  useEffect(() => {
    baseUrl
      .get("/role/findRole")
      .then(async (response) => {
        setRoles(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);
  const handleSave = () => {
    const roleName =
      roles.find((r) => r._id === formData.roleId)?.roleName || "";

    if (editingUser) {
      if (!formData.fullName || !formData.roleId) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      baseUrl
        .put("/user/" + editingUser._id, formData)
        .then(async (response) => {
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user._id === editingUser._id
                ? { ...user, ...formData, roleName }
                : user
            )
          );
          toast({
            title: "Success",
            description: "User updated successfully.",
          });
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      if (
        !formData.fullName ||
        !formData.email ||
        !formData.password ||
        !formData.roleId
      ) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      const newUser: User = {
        id: Date.now().toString(),
        ...formData,
        roleName,
        createdAt: new Date().toISOString().split("T")[0],
      };

      baseUrl
        .post("/user", newUser)
        .then(async (response) => {
          setUsers((prevUsers) => [...prevUsers, newUser]);
          toast({
            title: "Success",
            description: "User created successfully.",
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
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) =>
            setFormData({ ...formData, fullName: e.target.value })
          }
          placeholder="Enter full name"
        />
      </div>
      {!editingUser && (
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="Enter email address"
          />
        </div>
      )}
      {!editingUser && (
        <div>
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Enter password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
      {editingUser?.roleName !== "admin" && (
        <div>
          <Label htmlFor="role">Role *</Label>
          <Select
            value={formData.roleId}
            onValueChange={(value) =>
              setFormData({ ...formData, roleId: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role._id} value={role._id}>
                  {role.roleName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {editingUser?.roleName !== "admin" && (
        <div className="flex items-center space-x-2">
          <input
            id="status"
            type="checkbox"
            checked={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.checked })
            }
            className="rounded border-border"
          />
          <Label htmlFor="status">Active Status</Label>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {editingUser ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export default AddUser;
