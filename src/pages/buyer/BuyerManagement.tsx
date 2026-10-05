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
import { Contact, Edit, Eye, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import AddBuyer, { type Buyer } from "./AddBuyer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { can, P } from "@/lib/permissions";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";
import { asList } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export const BuyerManagement = () => {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [viewingBuyer, setViewingBuyer] = useState<Buyer | null>(null);
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const canAdd = can(P.BUYERS_ADD);
  const canEdit = can(P.BUYERS_EDIT);

  useEffect(() => {
    setLoading(true);
    baseUrl
      .get("/buyer")
      .then((response) => {
        setBuyers(asList<Buyer>(response.data?.data));
      })
      .catch((error) => {
        setBuyers([]);
        toast({
          title: "Unable to load buyers",
          description: getApiErrorMessage(
            error,
            "Could not load buyers. Please try again."
          ),
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  useEntitySync("buyer", (payload) => {
    setBuyers((prev) => upsertById(prev, payload));
    setViewingBuyer((current) => {
      if (!current || String(current._id) !== String(payload.id)) return current;
      if (payload.action === "deleted" || !payload.data) return null;
      return { ...current, ...payload.data };
    });
  });

  const handleAdd = () => {
    setEditingBuyer(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (buyer: Buyer) => {
    setViewingBuyer(null);
    setEditingBuyer(buyer);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingBuyer(null);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return buyers;
    return buyers.filter((item) =>
      [item.name, item.address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [buyers, query]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Buyers"
        description="Keep buyer names and addresses."
      >
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search buyers..."
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
                  Add Buyer
                </Button>
              </DialogTrigger>
            ) : null}
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingBuyer ? "Edit Buyer" : "Add Buyer"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {editingBuyer
                    ? "Update the buyer name and address."
                    : "Enter the buyer name and address."}
                </p>
              </DialogHeader>
              {isDialogOpen ? (
                <AddBuyer
                  setIsDialogOpen={setIsDialogOpen}
                  editingBuyer={editingBuyer}
                  buyers={buyers}
                  setBuyers={setBuyers}
                  setEditingBuyer={setEditingBuyer}
                />
              ) : null}
            </DialogContent>
          </Dialog>
        ) : null}
      </PageHeader>

      <Dialog
        open={Boolean(viewingBuyer)}
        onOpenChange={(open) => {
          if (!open) setViewingBuyer(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buyer</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Name and address for this buyer.
            </p>
          </DialogHeader>
          {viewingBuyer ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Name
                </p>
                <p className="mt-1 text-sm font-semibold">{viewingBuyer.name}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Address
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {viewingBuyer.address}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewingBuyer(null)}>
                  Close
                </Button>
                {canEdit ? (
                  <Button
                    onClick={() => handleEdit(viewingBuyer)}
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
            <span>Buyers</span>
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
              <Contact className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No buyers found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a buyer with a name and address.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item, i) => (
                  <TableRow key={item._id || i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                          <Contact className="h-4 w-4" />
                        </span>
                        <span className="font-semibold">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[360px]">
                      <span className="line-clamp-2 whitespace-pre-wrap text-sm">
                        {item.address}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingBuyer(item)}
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
