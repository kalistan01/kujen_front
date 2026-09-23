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
import { Plus, Edit, MapPin, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import AddOutHire, { type OutHire } from "./AddOutHire";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { can, P } from "@/lib/permissions";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";
import { asList } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const formatAmount = (value?: number) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDistance = (value?: number) =>
  `${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })} km`;

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

export const OutHireManagement = () => {
  const [outHires, setOutHires] = useState<OutHire[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOutHire, setEditingOutHire] = useState<OutHire | null>(null);
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const canAdd = can(P.DESTINATIONS_ADD);
  const canEdit = can(P.DESTINATIONS_EDIT);

  useEffect(() => {
    setLoading(true);
    baseUrl
      .get("/outhire")
      .then((response) => {
        setOutHires(asList<OutHire>(response.data?.data));
      })
      .catch((error) => {
        setOutHires([]);
        toast({
          title: "Unable to load out hires",
          description: getApiErrorMessage(
            error,
            "Could not load out hires. Please try again."
          ),
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  useEntitySync("outhire", (payload) => {
    setOutHires((prev) => upsertById(prev, payload));
  });

  const handleAdd = () => {
    setEditingOutHire(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (outHire: OutHire) => {
    setEditingOutHire(outHire);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingOutHire(null);
    }
  };

  const toggleStatus = (id: string | undefined, currentStatus: boolean) => {
    if (!id) {
      toast({
        title: "Unable to update",
        description: "This out hire cannot be updated because it has no ID.",
        variant: "destructive",
      });
      return;
    }

    baseUrl
      .delete(`outhire/${id}`, {
        headers: { status: currentStatus ? 0 : 1 },
      })
      .then(() => {
        setOutHires((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, status: !item.status } : item
          )
        );
        toast({
          title: "Success",
          description: currentStatus
            ? "Out hire deactivated successfully."
            : "Out hire activated successfully.",
        });
      })
      .catch((error) => {
        toast({
          title: currentStatus ? "Deactivate failed" : "Activate failed",
          description: getApiErrorMessage(
            error,
            currentStatus
              ? "Could not deactivate the out hire. Please try again."
              : "Could not activate the out hire. Please try again."
          ),
          variant: "destructive",
        });
      });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return outHires;
    return outHires.filter((item) =>
      [
        item.location,
        String(item.distanceKm ?? ""),
        String(item.amount ?? ""),
        item.status ? "active" : "inactive",
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [outHires, query]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Out Hires"
        description="Manage out hire rates by location and distance."
      >
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search out hires..."
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
                  Add Out Hire
                </Button>
              </DialogTrigger>
            ) : null}
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingOutHire ? "Edit Out Hire" : "Add Out Hire"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {editingOutHire
                    ? "Update location, distance, and amount."
                    : "Add a location, distance in km, and amount."}
                </p>
              </DialogHeader>
              {isDialogOpen ? (
                <AddOutHire
                  setIsDialogOpen={setIsDialogOpen}
                  editingOutHire={editingOutHire}
                  outHires={outHires}
                  setOutHires={setOutHires}
                  setEditingOutHire={setEditingOutHire}
                />
              ) : null}
            </DialogContent>
          </Dialog>
        ) : null}
      </PageHeader>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-muted/30 py-4">
          <CardTitle className="flex items-center justify-between text-base font-semibold">
            <span>Out Hire Rates</span>
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* ~25 rows visible, then scroll */}
          <div className="max-h-[min(70vh,calc(2.5rem+25*3.25rem))] overflow-auto">
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
                <MapPin className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="font-medium">No out hires found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add an out hire rate with location, distance, and amount.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableHead>Location</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item, i) => (
                    <TableRow key={item._id || i}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                            <MapPin className="h-4 w-4" />
                          </span>
                          <span className="font-semibold">{item.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDistance(item.distanceKm)}</TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(item.amount)}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 hover:bg-transparent"
                            onClick={() =>
                              toggleStatus(item._id, Boolean(item.status))
                            }
                          >
                            <StatusBadge status={Boolean(item.status)} />
                          </Button>
                        ) : (
                          <StatusBadge status={Boolean(item.status)} />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatCreatedAt(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
