import { useEffect, useState } from "react";
import baseUrl from "@/api/baseUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  firstErrorMessage,
  validateAssignmentBasic,
  type AssignmentBasicErrors,
} from "../lib/validate";

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

function toDateInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
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
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<AssignmentBasicErrors>({});
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
    if (!editingAssignment) return;
    setFormData({
      blNo: editingAssignment.blNo || "",
      cusdecDate: toDateInput(editingAssignment.cusdecDate),
      cusdecNo: editingAssignment.cusdecNo || "",
      regNo: editingAssignment.regNo || "",
      item: editingAssignment.item || "",
      exporter: editingAssignment.exporter || "",
      importer: editingAssignment.importer || "",
    });
    setErrors({});
  }, [editingAssignment]);

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
    setErrors({});
    setEditingAssignment(null);
  };

  const clearError = (field: keyof AssignmentBasicErrors) => {
    setErrors((prev) => {
      if (!prev[field] && !prev.form) return prev;
      const next = { ...prev };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  const handleSave = async () => {
    const nextErrors = validateAssignmentBasic(formData);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast({
        title: "Missing details",
        description:
          firstErrorMessage(nextErrors) ||
          "Please correct the highlighted fields and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!editingAssignment?._id) {
      const message = "This assignment cannot be updated because it has no ID.";
      setErrors({ form: message });
      toast({
        title: "Unable to update",
        description: message,
        variant: "destructive",
      });
      return;
    }

    const payload = {
      blNo: formData.blNo.trim(),
      cusdecDate: formData.cusdecDate,
      cusdecNo: formData.cusdecNo.trim(),
      regNo: formData.regNo.trim(),
      item: formData.item.trim(),
      exporter: formData.exporter.trim(),
      importer: formData.importer.trim(),
    };

    setSaving(true);
    try {
      await baseUrl.patch(`assignlorry/${editingAssignment._id}`, payload);
      toast({
        title: "Success",
        description: "Assignment updated successfully.",
      });
      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        "Could not update the assignment. Please try again."
      );
      const field: keyof AssignmentBasicErrors = /bl/i.test(message)
        ? "blNo"
        : /cusdec date/i.test(message)
          ? "cusdecDate"
          : /cusdec/i.test(message)
            ? "cusdecNo"
            : /reg/i.test(message)
              ? "regNo"
              : "form";
      setErrors({ [field]: message });
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {errors.form ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {errors.form}
        </p>
      ) : null}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="blNo">BL Number *</Label>
            <Input
              id="blNo"
              value={formData.blNo}
              onChange={(e) => {
                setFormData({ ...formData, blNo: e.target.value });
                clearError("blNo");
              }}
              placeholder="Enter BL number"
              className={errors.blNo ? "border-destructive" : ""}
            />
            {errors.blNo ? (
              <p className="text-xs font-medium text-destructive">
                {errors.blNo}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cusdecDate">Cusdec Date *</Label>
            <Input
              id="cusdecDate"
              type="date"
              value={formData.cusdecDate}
              onChange={(e) => {
                setFormData({ ...formData, cusdecDate: e.target.value });
                clearError("cusdecDate");
              }}
              className={errors.cusdecDate ? "border-destructive" : ""}
            />
            {errors.cusdecDate ? (
              <p className="text-xs font-medium text-destructive">
                {errors.cusdecDate}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cusdecNo">Cusdec Number *</Label>
            <Input
              id="cusdecNo"
              value={formData.cusdecNo}
              onChange={(e) => {
                setFormData({ ...formData, cusdecNo: e.target.value });
                clearError("cusdecNo");
              }}
              placeholder="Enter cusdec number"
              className={errors.cusdecNo ? "border-destructive" : ""}
            />
            {errors.cusdecNo ? (
              <p className="text-xs font-medium text-destructive">
                {errors.cusdecNo}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="regNo">Registration Number *</Label>
            <Input
              id="regNo"
              value={formData.regNo}
              onChange={(e) => {
                setFormData({ ...formData, regNo: e.target.value });
                clearError("regNo");
              }}
              placeholder="Enter registration number"
              className={errors.regNo ? "border-destructive" : ""}
            />
            {errors.regNo ? (
              <p className="text-xs font-medium text-destructive">
                {errors.regNo}
              </p>
            ) : null}
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
        <Button
          variant="outline"
          onClick={() => setIsDialogOpen(false)}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Update"
          )}
        </Button>
      </div>
    </div>
  );
}

export default EditDetail;
