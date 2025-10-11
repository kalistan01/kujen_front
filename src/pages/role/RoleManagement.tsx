import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";
import AddRole from "./AddRole";

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

const mockRoles: Role[] = [
  {
    id: "1",
    roleName: "Admin",
    permission: [1, 2, 3, 4, 5],
    denied: [],
    status: true,
    admin: true,
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    roleName: "Manager",
    permission: [1, 2, 3],
    denied: [4, 5],
    status: true,
    admin: false,
    createdAt: "2024-01-05",
  },
];

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

export const RoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    roleName: "",
    permission: [] as number[],
    denied: [] as number[],
    status: true,
    admin: false,
  });

  const handleAdd = () => {
    setEditingRole(null);
    setIsDialogOpen(true);
  };
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
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsDialogOpen(true);
  };

  const toggleStatus = (id: string, currentStatus: boolean) => {
    baseUrl
      .patch(
        `${currentStatus ? "role/deactivateRole" : "role/activateRole"}`,
        {},
        {
          headers: { roleid: id },
        }
      )
      .then(async (response) => {
        setRoles(
          roles.map((role) =>
            role._id === id ? { ...role, status: !role.status } : role
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
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Role Management
          </h2>
          <p className="text-muted-foreground">
            Manage user roles and permissions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? "Edit Role" : "Add New Role"}
              </DialogTitle>
            </DialogHeader>
            <AddRole
              editingRole={editingRole}
              setRoles={setRoles}
              setIsDialogOpen={setIsDialogOpen}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles ({roles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{role.roleName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permission.map((permId) => {
                        const perm = availablePermissions.find(
                          (p) => p.id === permId
                        );
                        return perm ? (
                          <Badge
                            key={permId}
                            variant="outline"
                            className="text-xs"
                          >
                            {perm.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {role.admin ? (
                      <Badge variant="default" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="default" className="gap-1">
                        <Shield className="h-3 w-3" />
                        staff
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!role.admin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(role._id, role.status)}
                      >
                        <Badge
                          variant={role.status ? "default" : "destructive"}
                        >
                          {role.status ? "Active" : "Inactive"}
                        </Badge>
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(role.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {!role.admin && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
