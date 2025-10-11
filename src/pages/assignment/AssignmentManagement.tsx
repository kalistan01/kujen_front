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
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import baseUrl from "@/api/baseUrl";
import AddAssignment from "./AddAssignment";

interface Container {
  id: string;
  containerNo: string;
  vocNo: string;
  loadingDate: string;
  demoundDate: string;
  destination: string;
  weight: number;
  dayHire: number;
  advanced: number;
  outHire: number;
  other: number;
  heldUp: number;
  agentFee: number;
  return: number;
  lorryId: { lorryNum: string; capacity: string } | string | null;
  status?: "pending" | "in-progress" | "completed";
}

interface Assignment {
  id: string;
  blNo: string;
  cusdecDate: string;
  cusdecNo: string;
  regNo: string;
  item: string;
  exporter: string;
  importer: string;
  containers: Container[];
  createdAt: string;
  createdBy: string;
  updatedBy: string;
  status: string;
}


const mockLorries = [
  { id: "1", lorryNum: "MH12AB1234", capacity: "20 tons" },
  { id: "2", lorryNum: "MH12CD5678", capacity: "15 tons" },
  { id: "3", lorryNum: "MH14EF9012", capacity: "25 tons" },
];

export const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(
    null
  );
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    blNo: "",
    cusdecDate: "",
    cusdecNo: "",
    regNo: "",
    item: "",
    exporter: "",
    importer: "",
  });

  const [containers, setContainers] = useState<Omit<Container, "id">[]>([
    {
      containerNo: "",
      vocNo: "",
      lorryId: "",
      loadingDate: "",
      demoundDate: "",
      destination: "",
      weight: 0,
      dayHire: 0,
      advanced: 0,
      outHire: 0,
      other: 0,
      heldUp: 0,
      agentFee: 0,
      return: 0,
    },
  ]);



  const handleAdd = () => {

    setIsDialogOpen(true);
  };

  const handleEdit = (assignment: Assignment) => {
    setFormData({
      blNo: assignment.blNo,
      cusdecDate: assignment.cusdecDate,
      cusdecNo: assignment.cusdecNo,
      regNo: assignment.regNo,
      item: assignment.item,
      exporter: assignment.exporter,
      importer: assignment.importer,
    });

    // Load all containers for editing
    setContainers(
      assignment.containers.map((container) => ({
        containerNo: container.containerNo,
        vocNo: container.vocNo,
        lorryId: container.lorryId,
        loadingDate: container.loadingDate,
        demoundDate: container.demoundDate,
        destination: container.destination,
        weight: container.weight,
        dayHire: container.dayHire,
        advanced: container.advanced,
        outHire: container.outHire,
        other: container.other,
        heldUp: container.heldUp,
        agentFee: container.agentFee,
        return: container.return,
        status: container.status,
      }))
    );

    setEditingAssignment(assignment);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setAssignments(assignments.filter((assignment) => assignment.id !== id));
    toast({
      title: "Success",
      description: "Assignment deleted successfully.",
    });
  };

  useEffect(() => {
    baseUrl
      .get("/assignlorry")
      .then(async (response) => {
        if (response.data.data.length > 0) setAssignments(response.data.data);
        console.log(response.data.data);
        
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);
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
              {assignments.map((assignment, index:number) => (
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
                          .map((c: any, i: number ) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="font-mono">{c.containerNo}</span>
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0"
                                >
                                  {
                                    c.lorryId ? c?.lorryId?.lorryNum : "Unassigned"
                                  }
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
                        onClick={() => navigate(`/assignment/${assignment._id}`)}
                        className="gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(assignment)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(assignment.id)}
                        className="gap-1 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
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
