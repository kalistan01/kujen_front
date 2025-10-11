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
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Truck, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";
import AddLorryOwner from "./AddLorryOwner";

interface Lorry {
  lorryNum: string;
  capacity: string;
}

interface LorryOwner {
  id: string;
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
  const { toast } = useToast();




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
    setIsDialogOpen(true);
  };

  const handleEdit = (owner: LorryOwner) => {
    setEditingOwner(owner);
    setIsDialogOpen(true);
  };





  const handleDelete = (id: string) => {
    setOwners(owners.filter((owner) => owner.id !== id));
    toast({
      title: "Success",
      description: "Lorry owner deleted successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Lorry Owner Management
          </h2>
          <p className="text-muted-foreground">
            Manage lorry owners and their fleet
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Owner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
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
      </div>

      <div className="grid gap-6">
        {owners?.map((owner,i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {owner.companyName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Owner: {owner.ownerName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(owner)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(owner.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {owner.phoneNum || "No phone number"}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {owner.address}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Fleet ({owner?.lorries?.length} lorries)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                  {owner.lorries?.map((lorry, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-muted rounded"
                    >
                      <Truck className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-sm">
                          {lorry.lorryNum}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {lorry.capacity} FEET
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
