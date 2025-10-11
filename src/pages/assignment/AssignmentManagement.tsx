import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Package, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import baseUrl from "@/api/baseUrl";
import AddAssignment from "./AddAssignment";

export const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const navigate = useNavigate();

  const handleAdd = () => {
    setIsDialogOpen(true);
  };

  useEffect(() => {
    baseUrl
      .get("/assignlorry")
      .then(async (response) => {
        if (response.data.data.length > 0) setAssignments(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [isDialogOpen]);
  const getStatusColor = (status: any) => {
    switch (status) {
      case "pending":
        return "destructive";
      case "in-progress":
        return "default";
      case "completed":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Assignment Management
          </h2>
          <p className="text-muted-foreground">
            Manage lorry assignments and deliveries
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAssignment ? "Edit Assignment" : "Add New Assignment"}
              </DialogTitle>
            </DialogHeader>
            <AddAssignment
              setIsDialogOpen={setIsDialogOpen}
              setAssignments={setAssignments}
              assignments={assignments}
              setEditingAssignment={setEditingAssignment}
              editingAssignment={editingAssignment}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignments ({assignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BL Number</TableHead>
                <TableHead>Cusdec Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Containers</TableHead>
                <TableHead>Exporter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {assignment.blNo}
                  </TableCell>
                  <TableCell>{assignment.cusdecDate}</TableCell>
                  <TableCell>{assignment.item || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary" className="w-fit">
                          {assignment.containers.length} Container
                          {assignment.containers.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {assignment.containers
                          .map((c: any, i: number) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="font-mono">{c.containerNo}</span>
                              <Badge
                                variant="outline"
                                className="text-xs px-1 py-0"
                              >
                                {c.lorryId
                                  ? c?.lorryId?.lorryNum
                                  : "Unassigned"}
                              </Badge>
                            </div>
                          ))
                          .slice(0, 3)}
                        {assignment.containers.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{assignment.containers.length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{assignment.exporter || "N/A"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        getStatusColor(assignment.status) as
                          | "default"
                          | "destructive"
                          | "secondary"
                          | "outline"
                      }
                    >
                      {assignment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(`/assignment/${assignment._id}`)
                        }
                        className="gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
