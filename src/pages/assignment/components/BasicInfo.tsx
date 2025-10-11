import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Calendar, FileText, Building, Ship } from "lucide-react";
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
function BasicInfo({ assignment }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">BL Number</p>
            <p className="font-semibold">{assignment?.blNo}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cusdec Date</p>
            <p className="font-semibold flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(assignment?.cusdecDate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cusdec Number</p>
            <p className="font-semibold">{assignment?.cusdecNo}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Registration Number</p>
            <p className="font-semibold">{assignment?.regNo}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Item</p>
            <p className="font-semibold">{assignment?.item || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant="outline">
              in-progress {assignment?.["in-progress"]}
            </Badge>
            <Badge variant="outline">pending {assignment?.pending}</Badge>
            <Badge variant="outline">completed {assignment?.completed}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground flex items-center">
              <Ship className="w-3 h-3 mr-1" />
              Exporter
            </p>
            <p className="font-semibold">{assignment?.exporter || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center">
              <Building className="w-3 h-3 mr-1" />
              Importer
            </p>
            <p className="font-semibold">{assignment?.importer || "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default BasicInfo;
