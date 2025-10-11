import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus,  Trash2, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";
interface Lorry {
  lorryNum: string;
  capacity: string;
}
interface LorryOwner {
  id: string;
  _id?: string;
  ownerName: string;
  phoneNum: string;
  address: string;
  companyName: string;
  lorries: Lorry[];
  createdAt: string;
}
function AddLorryOwner({
  owners,
  setOwners,
  setIsDialogOpen,
  editingOwner,
  setEditingOwner,
}: {
  owners: LorryOwner[];
  setOwners: React.Dispatch<React.SetStateAction<LorryOwner[]>>;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingOwner: React.Dispatch<React.SetStateAction<LorryOwner | null>>;
  editingOwner: LorryOwner | null;
}) {
  const { toast } = useToast();
  const [newLorry, setNewLorry] = useState({
    lorryNum: "",
    capacity: "",
  });
  const [formData, setFormData] = useState({
    _id: "",
    ownerName: "",
    phoneNum: "",
    address: "",
    companyName: "",
    lorries: [] as Lorry[],
  });
  useEffect(() => {
    if (editingOwner) {
      setFormData({
        _id: editingOwner._id,
        ownerName: editingOwner.ownerName,
        phoneNum: editingOwner.phoneNum,
        address: editingOwner.address,
        companyName: editingOwner.companyName,
        lorries: editingOwner.lorries,
      });
    }

    return () => {
      resetForm();
    };
  }, [editingOwner]);

  const handleSave = () => {
    if (!formData.ownerName || !formData.address || !formData.companyName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (editingOwner) {
      setOwners(
        owners.map((owner) =>
          owner.id === editingOwner.id ? { ...owner, ...formData } : owner
        )
      );
      baseUrl
        .put("/lorry/" + editingOwner._id, formData)
        .then(async (response) => {
          toast({
            title: "Success",
            description: "Lorry owner updated successfully.",
          });
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      const newOwner: LorryOwner = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setOwners([...owners, newOwner]);
      baseUrl
        .post("/lorry", newOwner)
        .then(async (response) => {
          toast({
            title: "Success",
            description: "Lorry owner created successfully.",
          });
        })
        .catch((error) => {
          console.error(error);
        });
    }
    setIsDialogOpen(false);
    resetForm();
  };
  const resetForm = () => {
    setFormData({
      _id: "",
      ownerName: "",
      phoneNum: "",
      address: "",
      companyName: "",
      lorries: [],
    });
    setNewLorry({
      lorryNum: "",
      capacity: "",
    });
    setEditingOwner(null);
  };
  const addLorry = () => {
    if (!newLorry.lorryNum || !newLorry.capacity) {
      toast({
        title: "Validation Error",
        description: "Please fill in lorry number and capacity.",
        variant: "destructive",
      });
      return;
    }

    setFormData({
      ...formData,
      lorries: [...formData.lorries, { ...newLorry }],
    });
    setNewLorry({ lorryNum: "", capacity: "" });
  };

  const removeLorry = (index: number) => {
    setFormData({
      ...formData,
      lorries: formData.lorries.filter((_, i) => i !== index),
    });
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ownerName">Owner Name *</Label>
          <Input
            id="ownerName"
            value={formData.ownerName}
            onChange={(e) =>
              setFormData({ ...formData, ownerName: e.target.value })
            }
            placeholder="Enter owner name"
          />
        </div>
        <div>
          <Label htmlFor="phoneNum">Phone Number</Label>
          <Input
            id="phoneNum"
            value={formData.phoneNum}
            onChange={(e) =>
              setFormData({ ...formData, phoneNum: e.target.value })
            }
            placeholder="Enter phone number"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) =>
            setFormData({ ...formData, companyName: e.target.value })
          }
          placeholder="Enter company name"
        />
      </div>

      <div>
        <Label htmlFor="address">Address *</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          placeholder="Enter address"
          rows={3}
        />
      </div>

      <div className="border-t pt-4">
        <Label className="text-base font-semibold">Lorries</Label>
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Lorry Number"
              value={newLorry.lorryNum}
              onChange={(e) =>
                setNewLorry({ ...newLorry, lorryNum: e.target.value })
              }
            />
            <Input
              placeholder="Capacity"
              value={newLorry.capacity}
              onChange={(e) =>
                setNewLorry({ ...newLorry, capacity: e.target.value })
              }
            />
            <Button onClick={addLorry} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {formData.lorries.length > 0 && (
            <div className="space-y-1">
              {formData.lorries.map((lorry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-muted p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span className="font-medium">{lorry.lorryNum}</span>
                    <Badge variant="outline">{lorry.capacity}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLorry(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {editingOwner ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export default AddLorryOwner;
