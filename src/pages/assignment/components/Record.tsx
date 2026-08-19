import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const nameOf = (value: any) =>
  typeof value === "object" ? value?.fullName || "—" : value || "—";

function Record({ assignment }: any) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Record</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Created by</p>
          <p className="font-medium">{nameOf(assignment?.createdBy)}</p>
          <p className="text-xs text-muted-foreground">
            {assignment?.createdAt ? formatDateTime(assignment.createdAt) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Updated by</p>
          <p className="font-medium">{nameOf(assignment?.updatedBy)}</p>
          <p className="text-xs text-muted-foreground">
            {assignment?.updatedAt ? formatDateTime(assignment.updatedAt) : "—"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default Record;
