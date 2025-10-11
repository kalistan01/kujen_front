import { useEffect, useState } from "react";
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
import { Plus, Edit, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";
import AddDistination from "./AddDistination";
import { Badge } from "@/components/ui/badge";
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
    setIsDialogOpen(true);
  };
  const handleEdit = (destination: Destination) => {
    setEditingDestination(destination);
    setIsDialogOpen(true);
  };

  const toggleStatus = (id: string, currentStatus: boolean) => {
    baseUrl
      .delete(`destination/${id}`, {
        headers: { status: currentStatus ? 0 : 1 },
      })
      .then(async (response) => {
        setDestinations(
          destinations.map((role) =>
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
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Destination Management
          </h2>
          <p className="text-muted-foreground">Manage routes and pricing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="gap-2">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Routes ({destinations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {destinations.map((destination, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{destination.type}</span>
                    </div>
                  </TableCell>

                  <TableCell>{destination.location}</TableCell>
                  <TableCell>
                    {new Date(destination.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggleStatus(destination._id, destination.status)
                      }
                    >
                      <Badge
                        variant={destination.status ? "default" : "destructive"}
                      >
                        {destination.status ? "Active" : "Inactive"}
                      </Badge>
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(destination)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
