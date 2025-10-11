import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, User } from "lucide-react";

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
function Record({ assignment }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Record Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground flex items-center">
            <User className="w-3 h-3 mr-1" />
            Created by
          </p>
          <p className="font-semibold">{assignment?.createdBy}</p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(assignment?.createdAt)}
          </p>
        </div>
        <Separator />
        <div>
          <p className="text-sm text-muted-foreground flex items-center">
            <User className="w-3 h-3 mr-1" />
            Updated by
          </p>
          <p className="font-semibold">{assignment?.updatedBy}</p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(assignment?.updatedAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default Record;
