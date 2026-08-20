import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EditDetail from "./EditDetail";
import { StatusBadge } from "@/components/StatusBadge";
import { canManageAssignments } from "@/lib/permissions";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function BasicInfo({
  assignment,
  isBasicDialogOpen,
  setIsBasicDialogOpen,
}: any) {
  const [editingAssignment, seteditingAssignment] = useState<any>();

  const handleOpenEdit = () => {
    setIsBasicDialogOpen(true);
    seteditingAssignment(assignment);
  };

  const fields = [
    { label: "BL Number", value: assignment?.blNo || "—" },
    {
      label: "Cusdec Date",
      value: assignment?.cusdecDate
        ? formatDate(assignment.cusdecDate)
        : "—",
    },
    { label: "Cusdec Number", value: assignment?.cusdecNo || "—" },
    { label: "Registration Number", value: assignment?.regNo || "—" },
    { label: "Item", value: assignment?.item || "N/A" },
    { label: "Exporter", value: assignment?.exporter || "N/A" },
    { label: "Importer", value: assignment?.importer || "N/A" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
        <CardTitle className="text-base">Basic Information</CardTitle>
        {canManageAssignments() ? (
        <Dialog open={isBasicDialogOpen} onOpenChange={setIsBasicDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              onClick={handleOpenEdit}
              variant="outline"
              size="sm"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Assignment</DialogTitle>
            </DialogHeader>
            <EditDetail
              setIsDialogOpen={setIsBasicDialogOpen}
              editingAssignment={editingAssignment}
              setEditingAssignment={seteditingAssignment}
            />
          </DialogContent>
        </Dialog>
        ) : null}
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {fields.map((field) => (
            <div key={field.label}>
              <p className="text-xs text-muted-foreground">{field.label}</p>
              <p className="text-sm font-medium">{field.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/70 pt-3 text-sm">
          <span className="text-xs text-muted-foreground">Status</span>
          <span className="inline-flex items-center gap-1.5">
            <StatusBadge status="in-progress" />
            {assignment?.["in-progress"] ?? 0}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <StatusBadge status="pending" />
            {assignment?.pending ?? 0}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <StatusBadge status="completed" />
            {assignment?.completed ?? 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default BasicInfo;
