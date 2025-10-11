import React, { useEffect, useState } from "react";
import baseUrl from "@/api/baseUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
interface Assignment {
  _id: string;
  blNo: string;
  cusdecDate: string;
  cusdecNo: string;
  regNo: string;
  item: string;
  exporter: string;
  importer: string;
}
function EditDetail({
  setIsDialogOpen,
  editingAssignment,
  setEditingAssignment,
}: {
  setIsDialogOpen: (isOpen: boolean) => void;
  editingAssignment?: Assignment;
  setEditingAssignment: (assignment: Assignment | null) => void;
}) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    blNo: "",
    cusdecDate: "",
    cusdecNo: "",
    regNo: "",
    item: "",
    exporter: "",
    importer: "",
  });
  useEffect(() => {
    setFormData({
      blNo:editingAssignment.blNo,
      cusdecDate:editingAssignment.cusdecDate,
      cusdecNo:editingAssignment.cusdecNo,
      regNo:editingAssignment.regNo,
      item:editingAssignment.item,
      exporter:editingAssignment.exporter,
      importer:editingAssignment.importer,
    });
  }, []);

  const resetForm = () => {
    setFormData({
      blNo: "",
      cusdecDate: "",
      cusdecNo: "",
      regNo: "",
      item: "",
      exporter: "",
      importer: "",
    });
    setEditingAssignment(null);
  };
  const handleSave = () => {
    baseUrl
      .patch(`assignlorry/${editingAssignment._id}`, formData)
      .then(async (response) => {
        toast({
          title: "Success",
          description: "Role updated successfully.",
        });
      })
      .catch((error) => {
        console.error(error);
      });

    setIsDialogOpen(false);
    resetForm();
  };
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="blNo">BL Number *</Label>
            <Input
              id="blNo"
              value={formData.blNo}
              onChange={(e) =>
                setFormData({ ...formData, blNo: e.target.value })
              }
              placeholder="Enter BL number"
            />
          </div>
          <div>
            <Label htmlFor="cusdecDate">Cusdec Date *</Label>
            <Input
              id="cusdecDate"
              type="date"
              value={formData.cusdecDate}
              onChange={(e) =>
                setFormData({ ...formData, cusdecDate: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cusdecNo">Cusdec Number *</Label>
            <Input
              id="cusdecNo"
              value={formData.cusdecNo}
              onChange={(e) =>
                setFormData({ ...formData, cusdecNo: e.target.value })
              }
              placeholder="Enter cusdec number"
            />
          </div>
          <div>
            <Label htmlFor="regNo">Registration Number *</Label>
            <Input
              id="regNo"
              value={formData.regNo}
              onChange={(e) =>
                setFormData({ ...formData, regNo: e.target.value })
              }
              placeholder="Enter registration number"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="item">Item</Label>
            <Input
              id="item"
              value={formData.item}
              onChange={(e) =>
                setFormData({ ...formData, item: e.target.value })
              }
              placeholder="Enter item description"
            />
          </div>
          <div>
            <Label htmlFor="exporter">Exporter</Label>
            <Input
              id="exporter"
              value={formData.exporter}
              onChange={(e) =>
                setFormData({ ...formData, exporter: e.target.value })
              }
              placeholder="Enter exporter name"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="importer">Importer</Label>
          <Input
            id="importer"
            value={formData.importer}
            onChange={(e) =>
              setFormData({ ...formData, importer: e.target.value })
            }
            placeholder="Enter importer name"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {editingAssignment ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export default EditDetail;
