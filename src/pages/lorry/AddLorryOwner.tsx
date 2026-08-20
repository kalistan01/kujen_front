import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";

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

const emptyForm = {
  _id: "",
  ownerName: "",
  phoneNum: "",
  address: "",
  companyName: "",
  lorries: [] as Lorry[],
};

function AddLorryOwner({
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
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingOwner) {
      setFormData({
        _id: editingOwner._id || "",
        ownerName: editingOwner.ownerName || "",
        phoneNum: editingOwner.phoneNum || "",
        address: editingOwner.address || "",
        companyName: editingOwner.companyName || "",
        lorries: editingOwner.lorries || [],
      });
      return;
    }

    setFormData(emptyForm);
    setNewLorry({ lorryNum: "", capacity: "" });
  }, [editingOwner]);

  const resetForm = () => {
    setFormData(emptyForm);
    setNewLorry({
      lorryNum: "",
      capacity: "",
    });
    setEditingOwner(null);
  };

  const handleSave = async () => {
    if (!formData.ownerName || !formData.address || !formData.companyName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ownerName: formData.ownerName,
      phoneNum: formData.phoneNum,
      address: formData.address,
      companyName: formData.companyName,
      lorries: formData.lorries,
    };

    const ownerId = editingOwner?._id;
    setSaving(true);

    try {
      if (editingOwner) {
        if (!ownerId) {
          toast({
            title: "Error",
            description: "Cannot update this owner because it has no ID.",
            variant: "destructive",
          });
          return;
        }

        const response = await baseUrl.put(`/lorry/${ownerId}`, payload);
        const updated = response.data.data;
        setOwners((prev) =>
          prev.map((owner) =>
            owner._id === ownerId ? { ...owner, ...updated } : owner
          )
        );
        toast({
          title: "Success",
          description: "Lorry owner updated successfully.",
        });
      } else {
        const response = await baseUrl.post("/lorry", payload);
        const created: LorryOwner = {
          ...response.data.owner,
          lorries: response.data.lorries || payload.lorries,
        };
        setOwners((prev) => [...prev, created]);
        toast({
          title: "Success",
          description: "Lorry owner created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to save lorry owner.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
    const lorry = formData.lorries[index];
    if (editingOwner && lorry?.inUse) {
      toast({
        title: "Cannot delete",
        description: "This lorry is used in an assignment.",
        variant: "destructive",
      });
      return;
    }

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
            <Button type="button" onClick={addLorry} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {formData.lorries.length > 0 && (
            <div className="space-y-1">
              {formData.lorries.map((lorry, index) => (
                <div
                  key={lorry._id || index}
                  className="flex items-center justify-between bg-muted p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span className="font-medium">{lorry.lorryNum}</span>
                    <Badge variant="outline">{lorry.capacity}</Badge>
                    {lorry.inUse && (
                      <Badge variant="secondary">Assigned</Badge>
                    )}
                  </div>
                  {(!editingOwner || !lorry.inUse) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLorry(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setIsDialogOpen(false);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {editingOwner ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export default AddLorryOwner;
