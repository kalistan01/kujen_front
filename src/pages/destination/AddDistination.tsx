import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";

interface Destination {
  _id?: string;
  id?: string;
  type: string;
  location: string;
  createdAt?: string;
  status?: boolean;
}

interface DropDistination {
  id: string;
  type: string;
}

const mockDropDistinations: DropDistination[] = [
  { id: "1", type: "Port" },
  { id: "2", type: "Yard" },
  { id: "3", type: "Store" },
  { id: "4", type: "RCT" },
  { id: "5", type: "Other" },
];

const emptyForm = {
  _id: "",
  type: "",
  location: "",
};

function AddDistination({
  editingDestination,
  setDestinations,
  setEditingDestination,
  setIsDialogOpen,
}: {
  editingDestination: Destination | null;
  setDestinations: React.Dispatch<React.SetStateAction<Destination[]>>;
  setEditingDestination: React.Dispatch<
    React.SetStateAction<Destination | null>
  >;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingDestination) {
      setFormData({
        _id: editingDestination._id || "",
        type: editingDestination.type || "",
        location: editingDestination.location || "",
      });
      return;
    }

    setFormData(emptyForm);
  }, [editingDestination]);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingDestination(null);
  };

  const handleSave = async () => {
    if (!formData.type || !formData.location) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      type: formData.type,
      location: formData.location,
    };
    const destinationId = editingDestination?._id;
    setSaving(true);

    try {
      if (editingDestination) {
        if (!destinationId) {
          toast({
            title: "Error",
            description: "Cannot update this destination because it has no ID.",
            variant: "destructive",
          });
          return;
        }

        const response = await baseUrl.put(
          `/destination/${destinationId}`,
          payload
        );
        const updated = response.data.data;
        setDestinations((prevDestinations) =>
          prevDestinations.map((dest) =>
            dest._id === destinationId ? { ...dest, ...updated } : dest
          )
        );
        toast({
          title: "Success",
          description: "Destination updated successfully.",
        });
      } else {
        const response = await baseUrl.post("/destination", payload);
        const created = response.data.data;
        setDestinations((prev) => [...prev, created]);
        toast({
          title: "Success",
          description: "Destination created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to save destination.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Destination</Label>
        <Select
          value={formData.type}
          onValueChange={(e) => setFormData({ ...formData, type: e })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select destination" />
          </SelectTrigger>
          <SelectContent>
            {mockDropDistinations.map((dest) => (
              <SelectItem key={dest.id} value={dest.type}>
                {dest.type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          placeholder="Enter location"
        />
      </div>

      <div className="flex justify-end gap-2">
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
          {editingDestination ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export default AddDistination;
