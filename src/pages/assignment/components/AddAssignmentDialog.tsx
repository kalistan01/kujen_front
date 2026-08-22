import { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import AddAssignment from "../AddAssignment";

function AddAssignmentDialog({
  open,
  onOpenChange,
  onAdd,
  assignments,
  setAssignments,
  editingAssignment,
  setEditingAssignment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
  assignments: any[];
  setAssignments: Dispatch<SetStateAction<any[]>>;
  editingAssignment: any | null;
  setEditingAssignment: Dispatch<SetStateAction<any | null>>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={onAdd} className="h-8 gap-2">
          <Plus className="h-4 w-4" />
          Add Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden border-border bg-card p-0 text-card-foreground sm:max-w-4xl sm:rounded-xl [&>button]:text-primary-foreground [&>button]:hover:bg-primary-foreground/10 [&>button]:hover:text-primary-foreground">
        <DialogHeader className="border-b border-primary-foreground/15 bg-primary px-6 py-4 text-left">
          <DialogTitle className="text-xl tracking-tight text-primary-foreground">
            {editingAssignment ? "Edit Assignment" : "Add New Assignment"}
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/75">
            Enter BL details, then add containers, lorry, and charges.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto bg-card px-6 py-5">
          <AddAssignment
            setIsDialogOpen={onOpenChange}
            setAssignments={setAssignments}
            assignments={assignments}
            setEditingAssignment={setEditingAssignment}
            editingAssignment={editingAssignment}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddAssignmentDialog;
