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
import { Badge } from "@/components/ui/badge";
import { canEditAssignments, canViewContainers } from "@/lib/permissions";
import { containerSourceId, containerTripKind } from "../lib/containerDisplay";

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
  onSaved,
}: any) {
  const [editingAssignment, seteditingAssignment] = useState<any>();

  const handleOpenEdit = () => {
    setIsBasicDialogOpen(true);
    seteditingAssignment(assignment);
  };

  const containers = assignment?.containers || [];
  const countStatus = (value: string) =>
    containers.filter(
      (container: { status?: string }) =>
        (container?.status || "pending") === value
    ).length;
  const onwardSourceIds = new Set(
    containers
      .map((container: any) => containerSourceId(container))
      .filter(Boolean)
  );
  const yardCount = containers.filter(
    (container: any) =>
      containerTripKind(container) === "yard" &&
      !onwardSourceIds.has(String(container?._id || ""))
  ).length;

  const fields = [
    { label: "BL Number", value: assignment?.blNo || "—" },
    {
      label: "Cusdec Date",
      value: assignment?.cusdecDate
        ? formatDate(assignment.cusdecDate)
        : "—",
    },
    {
      label: "FCL Due Date",
      value: assignment?.fclDueDate
        ? formatDate(assignment.fclDueDate)
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
        {canEditAssignments() ? (
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
              onSaved={onSaved}
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
        {canViewContainers() ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/70 pt-3 text-sm">
          <span className="text-xs text-muted-foreground">Status</span>
          <span className="inline-flex items-center gap-1.5">
            <StatusBadge status="in-progress" />
            {countStatus("in-progress")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <StatusBadge status="pending" />
            {countStatus("pending")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <StatusBadge status="advanced" />
            {countStatus("advanced")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <StatusBadge status="completed" />
            {countStatus("completed")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Badge className="border-transparent bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy))]">
              At yard
            </Badge>
            {yardCount}
          </span>
        </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default BasicInfo;
