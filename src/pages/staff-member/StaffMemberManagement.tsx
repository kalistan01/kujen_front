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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Eye, Plus, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import AddStaffMember, {
  type AccountOption,
  type StaffMember,
} from "./AddStaffMember";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { can, P } from "@/lib/permissions";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";
import { asList } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function linkedLabel(member: StaffMember) {
  const user = member.userId;
  if (!user) return null;
  if (typeof user === "string") return "Linked account";
  return user.fullName || user.email || "Linked account";
}

export const StaffMemberManagement = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const canAdd = can(P.STAFF_MEMBERS_ADD);
  const canEdit = can(P.STAFF_MEMBERS_EDIT);

  useEffect(() => {
    setLoading(true);
    baseUrl
      .get("/staff-member")
      .then((response) => {
        setStaffMembers(asList<StaffMember>(response.data?.data));
      })
      .catch((error) => {
        setStaffMembers([]);
        toast({
          title: "Unable to load staff",
          description: getApiErrorMessage(
            error,
            "Could not load staff members. Please try again."
          ),
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    baseUrl
      .get("/user")
      .then((response) => {
        setAccounts(asList<AccountOption>(response.data?.data));
      })
      .catch(() => {
        setAccounts([]);
      });
  }, []);

  useEntitySync("staff-member", (payload) => {
    setStaffMembers((prev) => upsertById(prev, payload));
    setViewingStaff((current) => {
      if (!current || String(current._id) !== String(payload.id)) return current;
      if (payload.action === "deleted" || !payload.data) return null;
      return { ...current, ...payload.data };
    });
  });

  const handleAdd = () => {
    setEditingStaff(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (member: StaffMember) => {
    setViewingStaff(null);
    setEditingStaff(member);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingStaff(null);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staffMembers;
    return staffMembers.filter((item) => {
      const linked = linkedLabel(item) || "";
      return [item.name, item.phone, item.notes, linked]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [staffMembers, query]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Staff"
        description="People marked for attendance, with or without a login."
      >
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search staff..."
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
                  Add Staff
                </Button>
              </DialogTrigger>
            ) : null}
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingStaff ? "Edit Staff" : "Add Staff"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {editingStaff
                    ? "Update staff details and optional login link."
                    : "Add a team member for attendance."}
                </p>
              </DialogHeader>
              {isDialogOpen ? (
                <AddStaffMember
                  setIsDialogOpen={setIsDialogOpen}
                  editingStaff={editingStaff}
                  staffMembers={staffMembers}
                  setStaffMembers={setStaffMembers}
                  setEditingStaff={setEditingStaff}
                  accountOptions={accounts}
                />
              ) : null}
            </DialogContent>
          </Dialog>
        ) : null}
      </PageHeader>

      <Dialog
        open={Boolean(viewingStaff)}
        onOpenChange={(open) => {
          if (!open) setViewingStaff(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Staff member</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Details for attendance tracking.
            </p>
          </DialogHeader>
          {viewingStaff ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Name
                </p>
                <p className="mt-1 text-sm font-semibold">{viewingStaff.name}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Phone
                </p>
                <p className="mt-1 text-sm">{viewingStaff.phone || "—"}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Linked account
                </p>
                <p className="mt-1 text-sm">{linkedLabel(viewingStaff) || "None"}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Status
                </p>
                <p className="mt-1 text-sm">
                  {viewingStaff.status === false ? "Inactive" : "Active"}
                </p>
                {viewingStaff.notes ? (
                  <>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {viewingStaff.notes}
                    </p>
                  </>
                ) : null}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewingStaff(null)}>
                  Close
                </Button>
                {canEdit ? (
                  <Button
                    onClick={() => handleEdit(viewingStaff)}
                    className="bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-muted/30 py-4">
          <CardTitle className="flex items-center justify-between text-base font-semibold">
            <span>Staff</span>
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 px-4 py-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No staff found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add staff members who may or may not have login accounts.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item, i) => (
                  <TableRow key={item._id || i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                          <Users className="h-4 w-4" />
                        </span>
                        <span className="font-semibold">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.phone || "—"}
                    </TableCell>
                    <TableCell>
                      {linkedLabel(item) ? (
                        <Badge variant="secondary">{linkedLabel(item)}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Non-user
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === false ? "outline" : "secondary"
                        }
                      >
                        {item.status === false ? "Inactive" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingStaff(item)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        {canEdit ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
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
    </div>
  );
};
