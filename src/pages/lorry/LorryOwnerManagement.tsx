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
import { Plus, Edit, Truck, Phone, MapPin, Search } from "lucide-react";
import baseUrl from "@/api/baseUrl";
import AddLorryOwner from "./AddLorryOwner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { can } from "@/lib/permissions";
import { P, canViewLorryOwnerDetails } from "@/lib/permissions";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";
import { asList } from "@/lib/utils";
import { isLorryOwnerAllowed, scopeLorryOwners } from "@/lib/lorryScope";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";

interface Lorry {
  _id?: string;
  lorryNum: string;
  capacity: string;
  inUse?: boolean;
}

interface LorryOwner {
  id?: string;
  _id?: string;
  ownerName: string;
  phoneNum: string;
  address: string;
  companyName: string;
  lorries: Lorry[];
  createdAt: string;
}

function formatCapacity(capacity?: string) {
  const value = String(capacity || "").trim();
  if (!value) return "—";
  if (/feet/i.test(value)) return value;
  return `${value} FEET`;
}

function OwnerCard({
  owner,
  search,
  canEdit,
  canSeeOwnerDetails,
  onEdit,
}: {
  owner: LorryOwner;
  search: string;
  canEdit: boolean;
  canSeeOwnerDetails: boolean;
  onEdit: (owner: LorryOwner) => void;
}) {
  const lorries = owner.lorries || [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70 bg-muted/20 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-brand text-white">
              <Truck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-sm leading-tight">
                {owner.companyName}
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {owner.ownerName}
              </p>
              <Badge variant="secondary" className="mt-1.5">
                {lorries.length} lorries
              </Badge>
            </div>
          </div>
          {canEdit ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 shrink-0 p-0"
              onClick={() => onEdit(owner)}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {canSeeOwnerDetails ? (
          <div className="space-y-1.5 border-b border-border/70 p-3">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{owner.phoneNum || "No phone"}</span>
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{owner.address || "No address"}</span>
            </p>
          </div>
        ) : null}
        {lorries.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No lorries in this fleet yet.
          </p>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Lorry no</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lorries.map((lorry, index) => {
                  const matched =
                    Boolean(search) &&
                    String(lorry.lorryNum || "")
                      .toLowerCase()
                      .includes(search);
                  return (
                    <TableRow
                      key={lorry._id || `${lorry.lorryNum}-${index}`}
                      className={matched ? "bg-amber-500/10" : undefined}
                    >
                      <TableCell className="font-semibold">
                        {lorry.lorryNum}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatCapacity(lorry.capacity)}
                      </TableCell>
                      <TableCell>
                        {lorry.inUse ? (
                          <Badge variant="secondary">Assigned</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Available
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const LorryOwnerManagement = () => {
  const [owners, setOwners] = useState<LorryOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<LorryOwner | null>(null);
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const canAdd = can(P.LORRIES_ADD);
  const canEdit = can(P.LORRIES_EDIT);
  const canSeeOwnerDetails = canViewLorryOwnerDetails();

  useEntitySync("lorry", (payload) => {
    setOwners((prev) => {
      const ownerId = String(payload.id || payload.data?._id || "");
      if (ownerId && !isLorryOwnerAllowed(ownerId)) {
        return prev.filter((row) => String(row._id || row.id) !== ownerId);
      }
      return scopeLorryOwners(upsertById(prev, payload));
    });
  });

  useEffect(() => {
    setLoading(true);
    baseUrl
      .get("/lorry")
      .then((response) => {
        setOwners(scopeLorryOwners(asList<LorryOwner>(response.data?.data)));
      })
      .catch((error) => {
        setOwners([]);
        toast({
          title: "Unable to load lorry owners",
          description: getApiErrorMessage(
            error,
            "Could not load lorry owners. Please try again."
          ),
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const handleAdd = () => {
    setEditingOwner(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (owner: LorryOwner) => {
    setEditingOwner(owner);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingOwner(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return owners;
    return owners.filter((owner) => {
      const fields = [
        owner.companyName,
        owner.ownerName,
        ...(canSeeOwnerDetails ? [owner.phoneNum, owner.address] : []),
        ...(owner.lorries || []).map((lorry) => lorry.lorryNum),
      ];
      return fields
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [owners, query, canSeeOwnerDetails]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Lorry Owners"
        description="Every owner and every lorry is listed. Search by owner, company, or lorry number."
      >
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search owner, company, or lorry no..."
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
                  Add Owner
                </Button>
              </DialogTrigger>
            ) : null}
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {editingOwner ? "Edit Lorry Owner" : "Add New Lorry Owner"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {editingOwner
                    ? "Update owner details and the full fleet list."
                    : "Add an owner, then add lorries one by one. Press Enter to add quickly."}
                </p>
              </DialogHeader>
              {isDialogOpen ? (
                <AddLorryOwner
                  owners={owners}
                  setOwners={setOwners}
                  setIsDialogOpen={setIsDialogOpen}
                  editingOwner={editingOwner}
                  setEditingOwner={setEditingOwner}
                />
              ) : null}
            </DialogContent>
          </Dialog>
        ) : null}
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Truck className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">No lorry owners found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {query.trim()
                ? "Try a different owner, company, or lorry number."
                : "Add an owner to start building your fleet directory."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((owner) => (
            <OwnerCard
              key={String(owner._id || owner.id)}
              owner={owner}
              search={query.trim().toLowerCase()}
              canEdit={canEdit}
              canSeeOwnerDetails={canSeeOwnerDetails}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};
