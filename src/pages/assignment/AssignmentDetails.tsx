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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Edit, Printer, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";
import Containers from "./components/Containers";
import Summary from "./components/Summary";
import Record from "./components/Record";
import BasicInfo from "./components/BasicInfo";
import AddContainer from "./components/AddContainer";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBasicDialogOpen, setIsBasicDialogOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const [assignment, setAssignment] = useState<any | null>(null);
  useEffect(() => {
    baseUrl
      .get("/assignlorry/" + id)
      .then(async (response) => {
        setAssignment(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [isDialogOpen, isBasicDialogOpen, open]);

  const handlePrint = () => {
    window.print();
    toast({
      title: "Print Initiated",
      description: "Assignment details are being prepared for printing.",
    });
  };

  const handleDelete = () => {
    // Mock delete functionality
    setIsEditDialogOpen(true);
  };
  const confrimDelete = () => {
    baseUrl
      .delete("/assignlorry/" + id)
      .then(async (response) => {
        setIsEditDialogOpen(false);
        toast({
          title: "Assignment Deleted",
          description: "Assignment has been successfully deleted.",
          variant: "destructive",
        });
        navigate("/assignments");
      })
      .catch((error) => {
        console.error(error);
      });
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
            <BasicInfo
              assignment={assignment}
              isBasicDialogOpen={isBasicDialogOpen}
              setIsBasicDialogOpen={setIsBasicDialogOpen}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Container Assignments ({assignment?.containers?.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {assignment?.containers?.map((container, index) => (
                  <Containers
                    key={index}
                    container={container}
                    setOpen={setOpen}
                  />
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold"></h3>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Container
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>add Container</DialogTitle>
                  </DialogHeader>
                  <AddContainer setIsDialogOpen={setIsDialogOpen} />
                </DialogContent>
              </Dialog>
            </div>
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
            <DialogTitle>Delete Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>Confirm Delete</div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => confrimDelete()}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentDetails;
