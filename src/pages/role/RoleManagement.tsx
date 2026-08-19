import { useEffect, useMemo, useState } from "react";
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
import { Plus, Edit, Shield, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";
import AddRole from "./AddRole";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";

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
  const [query, setQuery] = useState("");
  const { toast } = useToast();

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
      .then(async () => {
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((role) =>
      role.roleName?.toLowerCase().includes(q)
    );
  }, [roles, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Control what staff can see and change across the system."
      >
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles..."
            className="h-10 pl-9"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleAdd}
              className="gap-2 bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
            >
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
      </PageHeader>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-muted/30 py-4">
          <CardTitle className="flex items-center justify-between text-base font-semibold">
            <span>Access roles</span>
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Shield className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No roles found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a role to define staff permissions.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead>Role Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((role, index) => {
                  const namedPermissions = role.permission
                    .map((permId) =>
                      availablePermissions.find((p) => p.id === permId)
                    )
                    .filter(Boolean);

                  return (
                    <TableRow key={role._id || index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--brand-navy))] text-white">
                            <Shield className="h-4 w-4" />
                          </span>
                          <span className="font-semibold">{role.roleName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {role.admin || namedPermissions.length === 0 ? (
                          <Badge variant="secondary">
                            {role.admin
                              ? "Full access"
                              : `${role.permission.length} permissions`}
                          </Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {namedPermissions.map((perm) => (
                              <Badge
                                key={perm!.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {perm!.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="gap-1 capitalize"
                        >
                          <Shield className="h-3 w-3" />
                          {role.admin ? "Admin" : "Staff"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!role.admin ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 hover:bg-transparent"
                            onClick={() => toggleStatus(role._id, role.status)}
                          >
                            <StatusBadge status={role.status} />
                          </Button>
                        ) : (
                          <StatusBadge status={role.status} />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(role.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {!role.admin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(role)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
