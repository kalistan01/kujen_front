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
import { Plus, Edit, Shield, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import AddRole from "./AddRole";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PAGE_PERMISSIONS, can, P } from "@/lib/permissions";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";
import TablePagination from "@/components/TablePagination";
import { Skeleton } from "@/components/ui/skeleton";
import { asList } from "@/lib/utils";

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

const PAGE_SIZE = 10;

function formatCreatedAt(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const RoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const canAdd = can(P.ROLES_ADD);
  const canEdit = can(P.ROLES_EDIT);

  const handleAdd = () => {
    setEditingRole(null);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingRole(null);
  };

  const loadRoles = () => {
    setLoading(true);
    return baseUrl
      .get("/role/findRole")
      .then((response) => {
        setRoles(asList<Role>(response.data?.data));
      })
      .catch((error) => {
        setRoles([]);
        toast({
          title: "Unable to load roles",
          description: getApiErrorMessage(
            error,
            "Could not load roles. Please try again."
          ),
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEntitySync("role", (payload) => {
    setRoles((prev) => upsertById(prev, payload));
  });

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsDialogOpen(true);
  };

  const toggleStatus = (id: string | undefined, currentStatus: boolean) => {
    if (!id) {
      toast({
        title: "Unable to update",
        description: "This role cannot be updated because it has no ID.",
        variant: "destructive",
      });
      return;
    }

    const nextStatus = !currentStatus;
    baseUrl
      .patch(
        nextStatus ? "/role/activateRole" : "/role/deactivateRole",
        { roleid: id, status: nextStatus }
      )
      .then((response) => {
        const updated = response.data?.data;
        setRoles((prev) =>
          prev.map((role) =>
            String(role._id) === String(id)
              ? { ...role, ...updated, status: updated?.status ?? nextStatus }
              : role
          )
        );
        toast({
          title: "Success",
          description: currentStatus
            ? "Role deactivated successfully."
            : "Role activated successfully.",
        });
      })
      .catch((error) => {
        toast({
          title: currentStatus ? "Deactivate failed" : "Activate failed",
          description: getApiErrorMessage(
            error,
            currentStatus
              ? "Could not deactivate the role. Please try again."
              : "Could not activate the role. Please try again."
          ),
          variant: "destructive",
        });
      });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((role) => role.roleName?.toLowerCase().includes(q));
  }, [roles, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE) || 1);
  const currentPage = Math.min(page, pages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

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
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search roles..."
            className="h-10 pl-9"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          {canAdd ? (
            <DialogTrigger asChild>
              <Button
                onClick={handleAdd}
                className="gap-2 bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
              >
                <Plus className="h-4 w-4" />
                Add Role
              </Button>
            </DialogTrigger>
          ) : null}
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? "Edit Role" : "Add New Role"}
              </DialogTitle>
            </DialogHeader>
            {isDialogOpen ? (
              <AddRole
                editingRole={editingRole}
                roles={roles}
                setRoles={setRoles}
                setIsDialogOpen={setIsDialogOpen}
              />
            ) : null}
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
          {loading ? (
            <div className="space-y-3 px-4 py-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Shield className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No roles found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {query.trim()
                  ? "Try a different search."
                  : "Create a role to define staff permissions."}
              </p>
              {!query.trim() ? (
                <Button variant="outline" className="mt-4" onClick={loadRoles}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload
                </Button>
              ) : null}
            </div>
          ) : (
            <>
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
                  {paged.map((role, index) => {
                    const allowed = new Set(role.permission || []);
                    const namedPermissions = PAGE_PERMISSIONS.filter((perm) =>
                      allowed.has(perm.id)
                    );

                    return (
                      <TableRow key={role._id || role.id || index}>
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
                                : `${(role.permission || []).length} permissions`}
                            </Badge>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {namedPermissions.map((perm) => (
                                <Badge
                                  key={perm.id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {perm.name}
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
                          {!role.admin && canEdit ? (
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
                          {formatCreatedAt(role.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {!role.admin && canEdit && (
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
              <TablePagination
                page={currentPage}
                pages={pages}
                total={filtered.length}
                limit={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
