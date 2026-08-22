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
import { Plus, Edit, Search, Users, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import AddUser from "./AddUser";
import {
  DeviceList,
  userDevices,
  ViewUser,
  formatLastSeen,
  userInitials,
  type DirectoryUser,
} from "./ViewUser";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { can } from "@/lib/permissions";
import { P } from "@/lib/permissions";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";

interface User extends DirectoryUser {
  id: string;
  password: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  const handleAdd = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };
  const handleView = (user: User) => {
    setViewingUser(user);
    if (!user._id) return;
    baseUrl
      .get("/user/" + user._id)
      .then((response) => {
        if (response.data?.data) {
          setViewingUser((current) =>
            current && current._id === user._id
              ? { ...current, ...response.data.data }
              : current
          );
          setUsers((prev) =>
            prev.map((row) =>
              row._id === user._id ? { ...row, ...response.data.data } : row
            )
          );
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    baseUrl
      .get("/user")
      .then(async (response) => {
        setUsers(response.data.data);
      })
      .catch((error) => {
        toast({
          title: "Unable to load users",
          description: getApiErrorMessage(
            error,
            "Could not load users. Please try again."
          ),
          variant: "destructive",
        });
      });
  }, []);

  useEntitySync("user", (payload) => {
    setUsers((prev) => upsertById(prev, payload));
    setViewingUser((current) => {
      if (!current || String(current._id) !== String(payload.id)) return current;
      if (payload.action === "deleted" || !payload.data) return current;
      return { ...current, ...payload.data };
    });
  });

  const toggleStatus = (id: string | undefined, status: boolean) => {
    if (!id) {
      toast({
        title: "Unable to update",
        description: "This user cannot be updated because it has no ID.",
        variant: "destructive",
      });
      return;
    }

    baseUrl
      .delete("/user/" + id, {
        headers: {
          status: status ? 0 : 1,
        },
      })
      .then(async () => {
        setUsers(
          users.map((user) =>
            user._id === id ? { ...user, status: !user.status } : user
          )
        );

        toast({
          title: "Success",
          description: status
            ? "User deactivated successfully."
            : "User activated successfully.",
        });
      })
      .catch((error) => {
        toast({
          title: status ? "Deactivate failed" : "Activate failed",
          description: getApiErrorMessage(
            error,
            status
              ? "Could not deactivate the user. Please try again."
              : "Could not activate the user. Please try again."
          ),
          variant: "destructive",
        });
      });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const deviceText = userDevices(user)
        .flatMap((item) => [item.device, item.ip, item.userAgent])
        .filter(Boolean)
        .join(" ");
      return [user.fullName, user.email, user.roleName, deviceText]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [users, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage staff accounts and the roles assigned to them."
      >
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="h-10 pl-9"
          />
        </div>
        {can(P.USERS_MANAGE) ? (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleAdd}
              className="gap-2 bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
            >
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Add New User"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {editingUser
                  ? "Update this staff member's name, role, and access."
                  : "Create a staff account and assign a role."}
              </p>
            </DialogHeader>
            <AddUser
              setEditingUser={setEditingUser}
              editingUser={editingUser}
              users={users}
              setUsers={setUsers}
              setIsDialogOpen={setIsDialogOpen}
            />
          </DialogContent>
        </Dialog>
        ) : null}
      </PageHeader>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-muted/30 py-4">
          <CardTitle className="flex items-center justify-between text-base font-semibold">
            <span>Team directory</span>
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No users found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a staff member to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user, index) => (
                  <TableRow key={user._id || index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-xs font-bold text-white">
                          {userInitials(user.fullName)}
                        </span>
                        <span className="font-semibold">{user.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.roleName}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        {can(P.USERS_MANAGE) && user?.roleName !== "admin" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 hover:bg-transparent"
                            onClick={() => toggleStatus(user._id, user.status)}
                          >
                            <StatusBadge status={user.status} />
                          </Button>
                        ) : (
                          <StatusBadge status={user.status} />
                        )}
                        {user.status ? (
                          user.online ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Online
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Last seen {formatLastSeen(user.lastSeen)}
                            </span>
                          )
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                      <DeviceList user={user} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(user)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        {can(P.USERS_MANAGE) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(viewingUser)}
        onOpenChange={(open) => {
          if (!open) setViewingUser(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Account, presence, and last login device.
            </p>
          </DialogHeader>
          {viewingUser ? <ViewUser user={viewingUser} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};
