import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import {
  ALL_PERMISSION_IDS,
  DEFAULT_STAFF_PERMISSIONS,
  FIELD_PERMISSIONS,
  PAGE_ACCESS,
  PAGE_EXTRA_PERMISSIONS,
  hydrateRolePermissions,
  type PageAccessItem,
  type PermissionItem,
} from "@/lib/permissions";

interface Role {
  id: string;
  _id?: string;
  roleName: string;
  permission: number[];
  denied: number[];
  status: boolean;
  admin: boolean;
  createdAt: string;
}

type FormErrors = {
  roleName?: string;
  form?: string;
};

function splitPermissions(allowed: number[]) {
  const permission = Array.from(new Set(allowed));
  const denied = ALL_PERMISSION_IDS.filter((id) => !permission.includes(id));
  return { permission, denied };
}

const emptyForm = {
  roleName: "",
  permission: [...DEFAULT_STAFF_PERMISSIONS] as number[],
  denied: ALL_PERMISSION_IDS.filter(
    (id) => !DEFAULT_STAFF_PERMISSIONS.includes(id)
  ),
  status: true,
  admin: false,
};

function AddRole({
  editingRole,
  roles = [],
  setRoles,
  setIsDialogOpen,
}: {
  editingRole?: Role | null;
  roles?: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      ...emptyForm,
      permission: [...DEFAULT_STAFF_PERMISSIONS],
      denied: ALL_PERMISSION_IDS.filter(
        (id) => !DEFAULT_STAFF_PERMISSIONS.includes(id)
      ),
    });
    setErrors({});
  };

  useEffect(() => {
    if (editingRole) {
      const access = hydrateRolePermissions(
        editingRole.permission,
        editingRole.denied
      );
      setFormData({
        roleName: editingRole.roleName,
        permission: access.permission,
        denied: access.denied,
        status: editingRole.status,
        admin: editingRole.admin,
      });
      setErrors({});
      return;
    }

    resetForm();
  }, [editingRole]);

  const applyAllowed = (nextAllowed: number[]) => {
    setFormData({
      ...formData,
      ...splitPermissions(nextAllowed),
    });
    setErrors((prev) => {
      if (!prev.form) return prev;
      const next = { ...prev };
      delete next.form;
      return next;
    });
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    const nextAllowed = checked
      ? [...formData.permission, permissionId]
      : formData.permission.filter((id) => id !== permissionId);
    applyAllowed(nextAllowed);
  };

  const handlePageAccess = (
    page: PageAccessItem,
    which: "view" | "add" | "edit",
    checked: boolean
  ) => {
    const next = new Set(formData.permission);
    if (which === "view") {
      if (checked) {
        next.add(page.viewId);
      } else {
        next.delete(page.viewId);
        if (page.addId) next.delete(page.addId);
        if (page.editId) next.delete(page.editId);
      }
    } else if (which === "add" && page.addId) {
      if (checked) {
        next.add(page.viewId);
        next.add(page.addId);
      } else {
        next.delete(page.addId);
      }
    } else if (which === "edit" && page.editId) {
      if (checked) {
        next.add(page.viewId);
        next.add(page.editId);
      } else {
        next.delete(page.editId);
      }
    }
    applyAllowed([...next]);
  };

  const handleFieldAccess = (
    viewId: number,
    editId: number | undefined,
    which: "view" | "edit",
    checked: boolean
  ) => {
    const next = new Set(formData.permission);
    if (which === "view") {
      if (checked) {
        next.add(viewId);
      } else {
        next.delete(viewId);
        if (editId) next.delete(editId);
      }
    } else if (editId) {
      if (checked) {
        next.add(viewId);
        next.add(editId);
      } else {
        next.delete(editId);
      }
    }
    applyAllowed([...next]);
  };

  const handleGroupToggle = (items: PermissionItem[], checked: boolean) => {
    const ids = items.map((item) => item.id);
    const nextAllowed = checked
      ? Array.from(new Set([...formData.permission, ...ids]))
      : formData.permission.filter((id) => !ids.includes(id));
    setFormData({
      ...formData,
      ...splitPermissions(nextAllowed),
    });
  };

  const validateForm = () => {
    const next: FormErrors = {};
    const roleName = formData.roleName.trim();

    if (!roleName) {
      next.roleName = "Role name is required.";
    } else {
      const taken = roles.some(
        (role) =>
          role._id !== editingRole?._id &&
          role.roleName?.trim().toLowerCase() === roleName.toLowerCase()
      );
      if (taken) {
        next.roleName = `Role name "${roleName}" already exists.`;
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Missing details",
        description: "Please correct the highlighted fields and try again.",
        variant: "destructive",
      });
      return;
    }

    const payload = formData.admin
      ? {
          ...formData,
          roleName: formData.roleName.trim(),
          permission: [...ALL_PERMISSION_IDS],
          denied: [] as number[],
        }
      : {
          ...formData,
          roleName: formData.roleName.trim(),
        };

    setSaving(true);

    try {
      if (editingRole) {
        if (!editingRole._id) {
          const message = "This role cannot be updated because it has no ID.";
          setErrors({ form: message });
          toast({
            title: "Unable to update",
            description: message,
            variant: "destructive",
          });
          return;
        }

        await baseUrl.patch("/role/updateRole", {
          ...payload,
          roleid: editingRole._id,
        });
        setRoles((prevRoles) =>
          prevRoles.map((role) =>
            String(role._id) === String(editingRole._id)
              ? { ...role, ...payload, _id: role._id, status: payload.status === true }
              : role
          )
        );
        toast({
          title: "Success",
          description: "Role updated successfully.",
        });
      } else {
        const response = await baseUrl.post("/role/addRole", payload);
        const created = response.data?.data;
        setRoles((prevRoles) => [
          ...prevRoles,
          created || {
            id: Date.now().toString(),
            ...payload,
            createdAt: new Date().toISOString().split("T")[0],
          },
        ]);
        toast({
          title: "Success",
          description: "Role created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        editingRole
          ? "Could not update the role. Please try again."
          : "Could not create the role. Please try again."
      );
      const isNameError = /role name/i.test(message);
      setErrors(isNameError ? { roleName: message } : { form: message });
      toast({
        title: editingRole ? "Update failed" : "Create failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderPageAccess = () => {
    const isChecked = (id: number) =>
      formData.admin || formData.permission.includes(id);
    const viewIds = PAGE_ACCESS.map((page) => page.viewId);
    const addIds = PAGE_ACCESS.map((page) => page.addId).filter(
      (id): id is number => Boolean(id)
    );
    const editIds = PAGE_ACCESS.map((page) => page.editId).filter(
      (id): id is number => Boolean(id)
    );
    const allView = viewIds.every((id) => formData.permission.includes(id));
    const allAdd = addIds.every((id) => formData.permission.includes(id));
    const allEdit = editIds.every((id) => formData.permission.includes(id));

    const toggleColumn = (
      ids: number[],
      checked: boolean,
      extras: number[] = []
    ) => {
      const next = new Set(formData.permission);
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      if (checked) extras.forEach((id) => next.add(id));
      if (!checked && extras.length) extras.forEach((id) => next.delete(id));
      applyAllowed([...next]);
    };

    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Pages</Label>
        </div>
        <div className="overflow-hidden rounded-lg border border-border/70">
          <table className="w-full text-sm">
            <thead className="bg-muted/80">
              <tr className="border-b border-border/70">
                <th className="px-3 py-2 text-left font-medium">Page</th>
                <th className="w-[4.5rem] px-2 py-2 text-center font-medium">
                  <div className="flex flex-col items-center gap-1">
                    <span>View</span>
                    {!formData.admin ? (
                      <Checkbox
                        checked={allView}
                        onCheckedChange={(checked) =>
                          toggleColumn(
                            viewIds,
                            checked === true,
                            checked === true ? [] : [...addIds, ...editIds]
                          )
                        }
                        aria-label="Toggle all page view"
                      />
                    ) : null}
                  </div>
                </th>
                <th className="w-[4.5rem] px-2 py-2 text-center font-medium">
                  <div className="flex flex-col items-center gap-1">
                    <span>Add</span>
                    {!formData.admin ? (
                      <Checkbox
                        checked={allAdd}
                        onCheckedChange={(checked) =>
                          toggleColumn(
                            addIds,
                            checked === true,
                            checked === true ? viewIds : []
                          )
                        }
                        aria-label="Toggle all page add"
                      />
                    ) : null}
                  </div>
                </th>
                <th className="w-[4.5rem] px-2 py-2 text-center font-medium">
                  <div className="flex flex-col items-center gap-1">
                    <span>Edit</span>
                    {!formData.admin ? (
                      <Checkbox
                        checked={allEdit}
                        onCheckedChange={(checked) =>
                          toggleColumn(
                            editIds,
                            checked === true,
                            checked === true ? viewIds : []
                          )
                        }
                        aria-label="Toggle all page edit"
                      />
                    ) : null}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {PAGE_ACCESS.map((page) => (
                <tr
                  key={page.viewId}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-3 py-2">
                    <div className="font-medium">{page.name}</div>
                    <p className="text-xs text-muted-foreground">
                      {page.description}
                    </p>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <Checkbox
                      checked={isChecked(page.viewId)}
                      disabled={formData.admin}
                      onCheckedChange={(checked) =>
                        handlePageAccess(page, "view", checked === true)
                      }
                      aria-label={`View ${page.name}`}
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    {page.addId ? (
                      <Checkbox
                        checked={isChecked(page.addId)}
                        disabled={formData.admin}
                        onCheckedChange={(checked) =>
                          handlePageAccess(page, "add", checked === true)
                        }
                        aria-label={`Add ${page.name}`}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {page.editId ? (
                      <Checkbox
                        checked={isChecked(page.editId)}
                        disabled={formData.admin}
                        onCheckedChange={(checked) =>
                          handlePageAccess(page, "edit", checked === true)
                        }
                        aria-label={`Edit ${page.name}`}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderGroup = (title: string, items: PermissionItem[]) => {
    const allChecked = items.every((item) =>
      formData.permission.includes(item.id)
    );
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>{title}</Label>
          {!formData.admin && (
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => handleGroupToggle(items, !allChecked)}
            >
              {allChecked ? "Clear" : "Select all"}
            </button>
          )}
        </div>
        <div className="max-h-48 space-y-3 overflow-y-auto rounded-lg border border-border/70 p-3">
          {items.map((permission) => (
            <div key={permission.id} className="flex items-start space-x-3">
              <Checkbox
                id={`permission-${permission.id}`}
                checked={
                  formData.admin || formData.permission.includes(permission.id)
                }
                disabled={formData.admin}
                onCheckedChange={(checked) =>
                  handlePermissionChange(permission.id, checked as boolean)
                }
              />
              <div className="flex-1">
                <Label
                  htmlFor={`permission-${permission.id}`}
                  className="text-sm font-medium"
                >
                  {permission.name}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {permission.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFieldPermissions = () => {
    const viewIds = FIELD_PERMISSIONS.map((item) => item.id);
    const editIds = FIELD_PERMISSIONS.map((item) => item.editId).filter(
      (id): id is number => Boolean(id)
    );
    const allView = viewIds.every((id) => formData.permission.includes(id));
    const allEdit = editIds.every((id) => formData.permission.includes(id));
    const isChecked = (id: number) =>
      formData.admin || formData.permission.includes(id);

    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Assignment fields</Label>
          {!formData.admin && (
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() =>
                handleGroupToggle(
                  [
                    ...FIELD_PERMISSIONS,
                    ...FIELD_PERMISSIONS.filter((item) => item.editId).map(
                      (item) => ({
                        ...item,
                        id: item.editId as number,
                      })
                    ),
                  ],
                  !(allView && allEdit)
                )
              }
            >
              {allView && allEdit ? "Clear" : "Select all"}
            </button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border/70">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80">
              <tr className="border-b border-border/70">
                <th className="px-3 py-2 text-left font-medium">Field</th>
                <th className="w-[4.5rem] px-2 py-2 text-center font-medium">
                  <div className="flex flex-col items-center gap-1">
                    <span>View</span>
                    {!formData.admin ? (
                      <Checkbox
                        checked={allView}
                        onCheckedChange={(checked) => {
                          const next = new Set(formData.permission);
                          viewIds.forEach((id) =>
                            checked ? next.add(id) : next.delete(id)
                          );
                          if (!checked) {
                            editIds.forEach((id) => next.delete(id));
                          }
                          applyAllowed([...next]);
                        }}
                        aria-label="Toggle all field view"
                      />
                    ) : null}
                  </div>
                </th>
                <th className="w-[4.5rem] px-2 py-2 text-center font-medium">
                  <div className="flex flex-col items-center gap-1">
                    <span>Edit</span>
                    {!formData.admin ? (
                      <Checkbox
                        checked={allEdit}
                        onCheckedChange={(checked) => {
                          const next = new Set(formData.permission);
                          if (checked) {
                            viewIds.forEach((id) => next.add(id));
                            editIds.forEach((id) => next.add(id));
                          } else {
                            editIds.forEach((id) => next.delete(id));
                          }
                          applyAllowed([...next]);
                        }}
                        aria-label="Toggle all field edit"
                      />
                    ) : null}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {FIELD_PERMISSIONS.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-3 py-2">
                    <div className="font-medium">{item.name}</div>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <Checkbox
                      id={`field-view-${item.id}`}
                      checked={isChecked(item.id)}
                      disabled={formData.admin}
                      onCheckedChange={(checked) =>
                        handleFieldAccess(
                          item.id,
                          item.editId,
                          "view",
                          checked === true
                        )
                      }
                      aria-label={`View ${item.name}`}
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    {item.editId ? (
                      <Checkbox
                        id={`field-edit-${item.editId}`}
                        checked={isChecked(item.editId)}
                        disabled={formData.admin}
                        onCheckedChange={(checked) =>
                          handleFieldAccess(
                            item.id,
                            item.editId,
                            "edit",
                            checked === true
                          )
                        }
                        aria-label={`Edit ${item.name}`}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {errors.form ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {errors.form}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="roleName">Role Name *</Label>
        <Input
          id="roleName"
          value={formData.roleName}
          onChange={(e) => {
            setFormData({ ...formData, roleName: e.target.value });
            setErrors((prev) => {
              if (!prev.roleName && !prev.form) return prev;
              const next = { ...prev };
              delete next.roleName;
              delete next.form;
              return next;
            });
          }}
          placeholder="Enter role name"
          className={errors.roleName ? "border-destructive" : ""}
        />
        {errors.roleName ? (
          <p className="text-xs font-medium text-destructive">
            {errors.roleName}
          </p>
        ) : null}
      </div>
      {renderPageAccess()}
      {renderGroup("Logs", PAGE_EXTRA_PERMISSIONS)}
      {renderFieldPermissions()}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="admin"
          checked={formData.admin}
          onCheckedChange={(checked) =>
            setFormData({
              ...formData,
              admin: checked as boolean,
              ...(checked
                ? { permission: [...ALL_PERMISSION_IDS], denied: [] }
                : {}),
            })
          }
        />
        <Label htmlFor="admin">Admin Role</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="status"
          checked={formData.status}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, status: checked === true })
          }
        />
        <Label htmlFor="status">Active Status</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setIsDialogOpen(false)}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : editingRole ? (
            "Update"
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </div>
  );
}

export default AddRole;
