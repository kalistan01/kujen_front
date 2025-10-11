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
import { Plus, Edit} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import baseUrl from "@/api/baseUrl";
import AddUser from "./AddUser";
interface User {
  id: string;
  _id?: string;
  fullName: string;
  email: string;
  status: boolean;
  password: string;
  roleId: string;
  roleName: string;
  createdAt: string;
}
export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();
  const handleAdd = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };
  useEffect(() => {
    baseUrl
      .get("/user")
      .then(async (response) => {
        setUsers(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const toggleStatus = (id: string, status: boolean) => {
    baseUrl
      .delete("/user/" + id, {
        headers: {
          status: status ? 0 : 1,
        },
      })
      .then(async (response) => {
        setUsers(
          users.map((user) =>
            user._id === id ? { ...user, status: !user.status } : user
          )
        );

        toast({
          title: "Success",
          description: "User status updated successfully.",
        });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            User Management
          </h2>
          <p className="text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Add New User"}
              </DialogTitle>
            </DialogHeader>
            <AddUser
              setEditingUser={setEditingUser}
              editingUser={editingUser}
              setUsers={setUsers}
              setIsDialogOpen={setIsDialogOpen}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.roleName}</Badge>
                  </TableCell>
                  <TableCell>
                    {user?.roleName !== "admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(user._id, user.status)}
                      >
                        <Badge
                          variant={user.status ? "default" : "destructive"}
                        >
                          {user.status ? "Active" : "Inactive"}
                        </Badge>
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
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
