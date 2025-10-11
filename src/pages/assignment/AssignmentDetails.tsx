import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Edit,
  Printer,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";
import Containers from "./components/Containers";
import Summary from "./components/Summary";
import Record from "./components/Record";
import BasicInfo from "./components/BasicInfo";

interface Container {
  id: string;
  containerNo: string;
  vocNo: string;
  lorryId: string;
  loadingDate: string;
  demoundDate: string;
  destination: { id: string; location: string; amount: number };
  weight: number;
  dayHire: number;
  advanced: number;
  outHire: number;
  other: number;
  heldUp: number;
  agentFee: number;
  return: number;
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
  ot: { containerNo: string }[];
  status: "pending" | "in-progress" | "completed";
  createdAt: string;
  createdBy: string;
  updatedBy: string;
  updatedAt: string;
}

// Mock data - replace with actual data fetching

const AssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [assignment, setAssignment] = useState<any | null>(null);
  useEffect(() => {
    baseUrl
      .get("/assignlorry/" + id)
      .then(async (response) => {
        console.log(response.data.data);
        setAssignment(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // const calculateTotal = () => {
  //   return container.dayHire + container.outHire + container.other + container.agentFee + container.return - container.heldUp;
  // };

  const handlePrint = () => {
    window.print();
    toast({
      title: "Print Initiated",
      description: "Assignment details are being prepared for printing.",
    });
  };

  const handleDelete = () => {
    // Mock delete functionality
    toast({
      title: "Assignment Deleted",
      description: "Assignment has been successfully deleted.",
      variant: "destructive",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-2">
      <div className="max-w-88xl mx-auto space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold">Assignment Details</h1>
              {/* <p className="text-muted-foreground">
                BL Number: {assignment?.blNo}
              </p> */}
            </div>
          </div>
          <Badge
            variant={
              assignment?.status === "completed"
                ? "default"
                : assignment?.status === "in-progress"
                ? "secondary"
                : "outline"
            }
            className="text-sm px-3 py-1"
          >
            {assignment?.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BasicInfo assignment={assignment} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Container Assignments ({assignment?.containers?.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {assignment?.containers?.map((container, index) => (
                  <Containers key={index} container={container} />
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Summary assignment={assignment} />

            <Record assignment={assignment} />

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Assignment
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handlePrint}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Details
                </Button>
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Assignment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={assignment?.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setIsEditDialogOpen(false);
                  toast({
                    title: "Success",
                    description: "Assignment updated successfully.",
                  });
                }}
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentDetails;
