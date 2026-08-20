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
import baseUrl from "@/api/baseUrl";
import AddDistination from "./AddDistination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";

interface Destination {
  _id?: string;
  id: string;
  type: string;
  location: string;
  createdAt: string;
  status: boolean;
}

const mockDestinations: Destination[] = [
  {
    id: "1",
    type: "Air",
    location: "Mumbai",
    createdAt: "2023-10-01",
    status: true,
  },
];

export const DestinationManagement = () => {
  const [destinations, setDestinations] =
    useState<Destination[]>(mockDestinations);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDestination, setEditingDestination] =
    useState<Destination | null>(null);
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    baseUrl
      .get("/destination")
      .then(async (response) => {
        setDestinations(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const handleAdd = () => {
    setEditingDestination(null);
    setIsDialogOpen(true);
  };
  const handleEdit = (destination: Destination) => {
    setEditingDestination(destination);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingDestination(null);
    }
  };

  const toggleStatus = (id: string, currentStatus: boolean) => {
    baseUrl
      .delete(`destination/${id}`, {
        headers: { status: currentStatus ? 0 : 1 },
      })
      .then(async () => {
        setDestinations(
          destinations.map((role) =>
            role._id === id ? { ...role, status: !role.status } : role
          )
        );
        toast({
          title: "Success",
          description: "Destination updated successfully.",
        });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter((destination) =>
      [destination.type, destination.location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [destinations, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Destinations"
        description="Manage routes, locations, and delivery points."
      >
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search routes..."
            className="h-10 pl-9"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button
              onClick={handleAdd}
              className="gap-2 bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
            >
              <Plus className="h-4 w-4" />
              Add Route
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDestination ? "Edit Route" : "Add New Route"}
              </DialogTitle>
            </DialogHeader>
            <AddDistination
              setIsDialogOpen={setIsDialogOpen}
              editingDestination={editingDestination}
              setDestinations={setDestinations}
              setEditingDestination={setEditingDestination}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-muted/30 py-4">
          <CardTitle className="flex items-center justify-between text-base font-semibold">
            <span>Routes</span>
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <MapPin className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No destinations found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a route to start planning deliveries.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead>Route</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((destination, i) => (
                  <TableRow key={destination._id || i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <span className="font-semibold">{destination.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{destination.location}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:bg-transparent"
                        onClick={() =>
                          toggleStatus(destination._id, destination.status)
                        }
                      >
                        <StatusBadge status={destination.status} />
                      </Button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(destination.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(destination)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
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
