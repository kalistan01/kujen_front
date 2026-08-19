import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Package, Printer, Trash2, Plus, ArrowLeft, FileDown, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";
import Containers from "./components/Containers";
import Summary from "./components/Summary";
import Record from "./components/Record";
import BasicInfo from "./components/BasicInfo";
import AddContainer from "./components/AddContainer";
import { StatusBadge } from "@/components/StatusBadge";
import AssignmentPrint from "./components/AssignmentPrint";

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

  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const downloadExport = async (type: "pdf" | "excel") => {
    if (!id || exporting) return;
    setExporting(type);
    try {
      const response = await baseUrl.get(`/assignlorry/${id}/export/${type}`, {
        responseType: "blob",
      });
      const contentType = String(response.headers["content-type"] || "");
      if (contentType.includes("application/json")) {
        throw new Error("Export failed");
      }
      const blob = new Blob([response.data], { type: contentType });
      const ext = type === "pdf" ? "pdf" : "xlsx";
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `RG-Brothers-BL-${assignment?.blNo || id}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast({
        title: "Export failed",
        description: "Could not download the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const handlePrint = () => {
    const previousTitle = document.title;
    document.title = `RG Brothers - BL ${assignment?.blNo || ""}`.trim();
    window.print();
    document.title = previousTitle;
  };

  const confrimDelete = () => {
    baseUrl
      .delete("/assignlorry/" + id)
      .then(async () => {
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
    <>
    <div className="space-y-4 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/assignments")}
            className="h-9 w-9 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold tracking-tight">
                {assignment?.blNo || "Assignment"}
              </h1>
              <StatusBadge status={assignment?.status} />
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {assignment?.item || "—"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadExport("pdf")}
            disabled={!assignment || exporting === "pdf"}
          >
            <FileDown className="h-4 w-4" />
            {exporting === "pdf" ? "PDF..." : "PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadExport("excel")}
            disabled={!assignment || exporting === "excel"}
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exporting === "excel" ? "Excel..." : "Excel"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <BasicInfo
            assignment={assignment}
            isBasicDialogOpen={isBasicDialogOpen}
            setIsBasicDialogOpen={setIsBasicDialogOpen}
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
              <CardTitle className="flex items-center text-base">
                <Package className="mr-2 h-4 w-4 text-amber-600" />
                Containers ({assignment?.containers?.length || 0})
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Container
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Add Container</DialogTitle>
                  </DialogHeader>
                  <AddContainer setIsDialogOpen={setIsDialogOpen} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              {assignment?.containers?.length ? (
                assignment.containers.map((container, index) => (
                  <Containers
                    key={container._id || index}
                    container={container}
                    setOpen={setOpen}
                  />
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No containers added yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Summary assignment={assignment} />
          <Record assignment={assignment} />
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the assignment and cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => confrimDelete()}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    {assignment && <AssignmentPrint assignment={assignment} />}
    </>
  );
};

export default AssignmentDetails;
