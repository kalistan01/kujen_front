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
import { Plus, Edit, Truck, Phone, MapPin, Search } from "lucide-react";
import baseUrl from "@/api/baseUrl";
import AddLorryOwner from "./AddLorryOwner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { can } from "@/lib/permissions";
import { P } from "@/lib/permissions";

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

export const LorryOwnerManagement = () => {
  const [owners, setOwners] = useState<LorryOwner[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<LorryOwner | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    baseUrl
      .get("/lorry")
      .then(async (response) => {
        setOwners(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

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
    return owners.filter((owner) =>
      [owner.companyName, owner.ownerName, owner.phoneNum, owner.address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [owners, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lorry Owners"
        description="Manage owners, companies, and the vehicles in each fleet."
      >
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search owners..."
            className="h-10 pl-9"
          />
        </div>
        {can(P.LORRIES_MANAGE) ? (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button
              onClick={handleAdd}
              className="gap-2 bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
            >
              <Plus className="h-4 w-4" />
              Add Owner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingOwner ? "Edit Lorry Owner" : "Add New Lorry Owner"}
              </DialogTitle>
            </DialogHeader>
            <AddLorryOwner
              owners={owners}
              setOwners={setOwners}
              setIsDialogOpen={setIsDialogOpen}
              editingOwner={editingOwner}
              setEditingOwner={setEditingOwner}
            />
          </DialogContent>
        </Dialog>
        ) : null}
      </PageHeader>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Truck className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">No lorry owners found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add an owner to start building your fleet directory.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filtered.map((owner, i) => (
            <Card key={owner._id || owner.id || i} className="overflow-hidden">
              <CardHeader className="border-b border-border/70 bg-muted/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-white">
                      <Truck className="h-5 w-5" />
                    </span>
                    <div>
                      <CardTitle className="text-lg">
                        {owner.companyName}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Owner: {owner.ownerName}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {can(P.LORRIES_MANAGE) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(owner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="mb-5 grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {owner.phoneNum || "No phone number"}
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {owner.address}
                  </div>
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">Fleet</p>
                  <Badge variant="secondary">
                    {owner?.lorries?.length || 0} lorries
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {owner.lorries?.map((lorry, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-xl border border-border/70 p-3"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                        <Truck className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold">
                          {lorry.lorryNum}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {lorry.capacity} FEET
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
