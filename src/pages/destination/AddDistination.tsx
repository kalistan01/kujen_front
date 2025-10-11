import React, { useEffect, useState } from "react";
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
  id: string;
  type: string;
  location: string;
  createdAt: string;
}

const mockDestinations: Destination[] = [
  {
    id: "1",
    type: "Air",
    location: "Mumbai",
    createdAt: "2023-10-01",
  },
];
interface DropDistination {
  id: string;
  type: string;
}

const mockDropDistinations: DropDistination[] = [
  {
    id: "1",
    type: "Port",
  },
  {
    id: "2",
    type: "Yard",
  },
  {
    id: "3",
    type: "Store",
  },
  {
    id: "4",
    type: "Other",
  },
];
function AddDistination({
  editingDestination,
  setDestinations,
  setEditingDestination,
  setIsDialogOpen,
}: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    _id: "",
    type: "",
    location: "",
  });
  const resetForm = () => {
    setFormData({
      _id: "",
      type: "",
      location: "",
    });
    setEditingDestination(null);
  };
  useEffect(() => {
    if (editingDestination) {
      setFormData({
        _id: editingDestination._id,
        type: editingDestination.type,
        location: editingDestination.location,
      });
    }

    return () => {
      resetForm();
    };
  }, [editingDestination]);
  const handleSave = () => {
    if (!formData.type || !formData.location) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (editingDestination) {
      baseUrl
        .put("/destination/" + editingDestination._id, formData)
        .then(async (response) => {
          setDestinations((prevDestinations) =>
            prevDestinations.map((dest) =>
              dest._id === editingDestination._id
                ? { ...dest, type: formData.type, location: formData.location }
                : dest
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
    } else {
      const newDestination: Destination = {
        id: Date.now().toString(),
        type: formData.type,
        location: formData.location,
        createdAt: new Date().toISOString(),
      };
      setDestinations((prevRoles) => [...prevRoles, newDestination]);

      baseUrl
        .post("/destination", newDestination)
        .then(async (response) => {
          toast({
            title: "Success",
            description: "Destination created successfully.",
          });
        })
        .catch((error) => {
          console.error(error);
        });
    }

    setIsDialogOpen(false);
    resetForm();
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
        <Label htmlFor="start">Location *</Label>
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
        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {editingDestination ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export default AddDistination;
