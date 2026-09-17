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
import {
  Plus,
  Edit,
  Search,
  Users,
  Eye,
  RefreshCw,
  KeyRound,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { getAuthUser, isAdminUser } from "@/lib/auth";
import baseUrl from "@/api/baseUrl";
import { Label } from "@/components/ui/label";
import AddUser from "./AddUser";
import {
  DeviceLabel,
  ViewUser,
  formatDateTime,
  formatLastSeen,
  userInitials,
  type DirectoryUser,
} from "./ViewUser";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { can, P } from "@/lib/permissions";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";
import TablePagination from "@/components/TablePagination";
import { Skeleton } from "@/components/ui/skeleton";
import { asList } from "@/lib/utils";

interface User extends DirectoryUser {
  id: string;
  password: string;
}

const PAGE_SIZE = 10;

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const canAdd = can(P.USERS_ADD);
  const canEdit = can(P.USERS_EDIT);
  const canChangePassword = isAdminUser();
  const currentUserId = String(getAuthUser()?._id || "");

  const loadUsers = () => {
    setLoading(true);
    return baseUrl
      .get("/user")
      .then((response) => {
        setUsers(asList<User>(response.data?.data));
      })
      .catch((error) => {
        setUsers([]);
        toast({
          title: "Unable to load users",
          description: getApiErrorMessage(
            error,
            "Could not load users. Please try again."
          ),
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  };

  const handleAdd = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };
  const resetPasswordDialog = () => {
    setPasswordUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setPasswordError("");
    setSavingPassword(false);
  };

  const handleChangePassword = async () => {
    if (!passwordUser?._id) {
      setPasswordError("This user cannot be updated because it has no ID.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setSavingPassword(true);
    setPasswordError("");
    try {
      await baseUrl.patch(`/user/${passwordUser._id}/password`, {
        password: newPassword,
        confirmPassword,
      });
      toast({
        title: "Password updated",
        description: `A new password was set for ${passwordUser.fullName}.`,
      });
      resetPasswordDialog();
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Could not update the password. Please try again."
      );
      setPasswordError(message);
      toast({
        title: "Password update failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleView = (user: User) => {
    setViewingUser(user);
    if (!user._id) return;
    baseUrl
      .get("/user/" + user._id)
      .then((response) => {
        if (!response.data?.data) return;
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
      })
      .catch(() => {});
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingUser(null);
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEntitySync("user", (payload) => {
    setUsers((prev) => upsertById(prev, payload));
    setViewingUser((current) => {
      if (!current || String(current._id) !== String(payload.id)) return current;
      if (payload.action === "deleted" || !payload.data) return current;
      return { ...current, ...payload.data };
    });
  });

  useEntitySync("role", (payload) => {
    const roleId = String(payload.id || "");
    if (!roleId) return;
    const roleName = payload.data?.roleName;
    const roleStatus =
      payload.action === "deleted" ? false : payload.data?.status !== false;
    const patchUser = (user: User) =>
      String(user.roleId) === roleId
        ? {
            ...user,
            roleName: roleName || user.roleName,
            roleStatus,
          }
        : user;
    setUsers((prev) => prev.map(patchUser));
    setViewingUser((current) => (current ? patchUser(current) : current));
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
      .then(() => {
        setUsers((prev) =>
          prev.map((user) =>
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
    return users.filter((user) =>
      [
        user.fullName,
        user.email,
        user.roleName,
        user.roleStatus === false ? "inactive" : "active",
        user.lastLoginDevice,
        user.lastLoginIp,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [users, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE) || 1);
  const currentPage = Math.min(page, pages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Manage staff accounts and the roles assigned to them."
      >
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="user-directory-search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            readOnly
            data-lpignore="true"
            data-1p-ignore="true"
            value={query}
            onFocus={(e) => e.currentTarget.removeAttribute("readOnly")}
            onBlur={(e) => e.currentTarget.setAttribute("readOnly", "true")}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search users..."
            className="h-10 pl-9"
          />
        </div>
        {canAdd || canEdit ? (
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            {canAdd ? (
              <DialogTrigger asChild>
                <Button
                  onClick={handleAdd}
                  className="gap-2 bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
                >
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
            ) : null}
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
              {isDialogOpen ? (
                <AddUser
                  setEditingUser={setEditingUser}
                  editingUser={editingUser}
                  users={users}
                  setUsers={setUsers}
                  setIsDialogOpen={setIsDialogOpen}
                />
              ) : null}
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
          {loading ? (
            <div className="space-y-3 px-4 py-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No users found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {query.trim()
                  ? "Try a different search."
                  : "Add a staff member to get started."}
              </p>
              {!query.trim() ? (
                <Button variant="outline" className="mt-4" onClick={loadUsers}>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((user, index) => (
                    <TableRow key={user._id || user.id || index}>
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
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant="secondary">{user.roleName || "—"}</Badge>
                          {user.roleName ? (
                            <StatusBadge status={user.roleStatus !== false} />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          {canEdit && user?.roleName !== "admin" ? (
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
                      <TableCell className="max-w-[220px] text-sm text-muted-foreground">
                        <DeviceLabel
                          device={user.lastLoginDevice}
                          empty="No login yet"
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(user.createdAt)}
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
                          {canChangePassword &&
                          user._id &&
                          String(user._id) !== currentUserId ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPasswordUser(user);
                                setNewPassword("");
                                setConfirmPassword("");
                                setShowNewPassword(false);
                                setPasswordError("");
                              }}
                            >
                              <KeyRound className="h-4 w-4" />
                              Password
                            </Button>
                          ) : null}
                          {canEdit ? (
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
      <Dialog
        open={Boolean(passwordUser)}
        onOpenChange={(open) => {
          if (!open) resetPasswordDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Set a new password for {passwordUser?.fullName || "this user"}.
            </p>
          </DialogHeader>
          <form
            className="space-y-4"
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              handleChangePassword();
            }}
          >
            {passwordError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {passwordError}
              </p>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="admin-set-password">New password</Label>
              <div className="relative">
                <Input
                  id="admin-set-password"
                  name="admin-set-password"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="At least 6 characters"
                  className="h-10 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 p-0 text-muted-foreground"
                  onClick={() => setShowNewPassword((open) => !open)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-confirm-password">Confirm password</Label>
              <Input
                id="admin-confirm-password"
                name="admin-confirm-password"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError("");
                }}
                placeholder="Re-enter password"
                className="h-10"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetPasswordDialog}
                disabled={savingPassword}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingPassword}
                className="bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save password"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
