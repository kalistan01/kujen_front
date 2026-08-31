import { getAuthUser, isAdminUser, type AuthUser } from "@/lib/auth";

export const P = {
  USERS_VIEW: 1,
  USERS_ADD: 2,
  USERS_MANAGE: 2,
  LORRIES_VIEW: 3,
  LORRIES_ADD: 4,
  LORRIES_MANAGE: 4,
  ASSIGNMENTS_ADD: 5,
  ASSIGNMENTS_MANAGE: 5,
  DESTINATIONS_VIEW: 6,
  DESTINATIONS_ADD: 7,
  DESTINATIONS_MANAGE: 7,
  ASSIGNMENTS_VIEW: 8,
  ROLES_ADD: 9,
  ROLES_MANAGE: 9,
  LOGS_VIEW: 10,
  ROLES_VIEW: 11,
  USERS_EDIT: 12,
  LORRIES_EDIT: 13,
  DESTINATIONS_EDIT: 14,
  ROLES_EDIT: 15,
  ASSIGNMENTS_EDIT: 16,
  WEIGHT: 20,
  DAY_HIRE: 21,
  ADVANCED: 22,
  ADVANCED_DATE: 23,
  BALANCE_PAID: 24,
  BALANCE_DATE: 25,
  OUT_HIRE: 26,
  OTHER: 27,
  HELD_UP: 28,
  AGENT_FEE: 29,
  TRANSPORT_COMMISSION: 30,
  RETURN: 31,
  FINANCIAL_TOTALS: 32,
  WEIGHT_EDIT: 40,
  DAY_HIRE_EDIT: 41,
  ADVANCED_EDIT: 42,
  ADVANCED_DATE_EDIT: 43,
  BALANCE_PAID_EDIT: 44,
  BALANCE_DATE_EDIT: 45,
  OUT_HIRE_EDIT: 46,
  OTHER_EDIT: 47,
  HELD_UP_EDIT: 48,
  AGENT_FEE_EDIT: 49,
  TRANSPORT_COMMISSION_EDIT: 50,
  RETURN_EDIT: 51,
} as const;

export type PermissionId = (typeof P)[keyof typeof P];

export type PermissionItem = {
  id: number;
  name: string;
  description: string;
  group: "pages" | "fields";
  key?: string;
  editId?: number;
};

export type PageAccessItem = {
  name: string;
  description: string;
  viewId: number;
  addId?: number;
  editId?: number;
};

export const PAGE_ACCESS: PageAccessItem[] = [
  {
    name: "Users",
    description: "Staff accounts",
    viewId: P.USERS_VIEW,
    addId: P.USERS_ADD,
    editId: P.USERS_EDIT,
  },
  {
    name: "Roles",
    description: "Access roles",
    viewId: P.ROLES_VIEW,
    addId: P.ROLES_ADD,
    editId: P.ROLES_EDIT,
  },
  {
    name: "Lorry Owners",
    description: "Owners and vehicles",
    viewId: P.LORRIES_VIEW,
    addId: P.LORRIES_ADD,
    editId: P.LORRIES_EDIT,
  },
  {
    name: "Destinations",
    description: "Routes and held up rates",
    viewId: P.DESTINATIONS_VIEW,
    addId: P.DESTINATIONS_ADD,
    editId: P.DESTINATIONS_EDIT,
  },
  {
    name: "Assignments",
    description: "BLs, containers, and payments",
    viewId: P.ASSIGNMENTS_VIEW,
    addId: P.ASSIGNMENTS_ADD,
    editId: P.ASSIGNMENTS_EDIT,
  },
];

export const PAGE_PERMISSIONS: PermissionItem[] = [
  { id: P.USERS_VIEW, name: "View Users", description: "Open the users page", group: "pages" },
  { id: P.USERS_ADD, name: "Add Users", description: "Create staff accounts", group: "pages" },
  { id: P.USERS_EDIT, name: "Edit Users", description: "Update, disable, and reset users", group: "pages" },
  { id: P.ROLES_VIEW, name: "View Roles", description: "Open the roles page", group: "pages" },
  { id: P.ROLES_ADD, name: "Add Roles", description: "Create access roles", group: "pages" },
  { id: P.ROLES_EDIT, name: "Edit Roles", description: "Update and activate roles", group: "pages" },
  { id: P.LORRIES_VIEW, name: "View Lorry Owners", description: "Open the lorry owners page", group: "pages" },
  { id: P.LORRIES_ADD, name: "Add Lorry Owners", description: "Create owners and fleets", group: "pages" },
  { id: P.LORRIES_EDIT, name: "Edit Lorry Owners", description: "Update owners and vehicles", group: "pages" },
  { id: P.DESTINATIONS_VIEW, name: "View Destinations", description: "Open settings, destinations, and held up rates", group: "pages" },
  { id: P.DESTINATIONS_ADD, name: "Add Destinations", description: "Create routes and held up rates", group: "pages" },
  { id: P.DESTINATIONS_EDIT, name: "Edit Destinations", description: "Update and disable routes", group: "pages" },
  { id: P.ASSIGNMENTS_VIEW, name: "View Assignments", description: "Open assignments and details", group: "pages" },
  { id: P.ASSIGNMENTS_ADD, name: "Add Assignments", description: "Create assignments", group: "pages" },
  { id: P.ASSIGNMENTS_EDIT, name: "Edit Assignments", description: "Update, pay, and delete assignments", group: "pages" },
  { id: P.LOGS_VIEW, name: "View Logs", description: "Open the activity log", group: "pages" },
];

export const PAGE_EXTRA_PERMISSIONS: PermissionItem[] = [
  { id: P.LOGS_VIEW, name: "View Logs", description: "Open the activity log", group: "pages" },
];

const LEGACY_ADD_TO_EDIT: Array<[number, number]> = [
  [P.USERS_ADD, P.USERS_EDIT],
  [P.LORRIES_ADD, P.LORRIES_EDIT],
  [P.DESTINATIONS_ADD, P.DESTINATIONS_EDIT],
  [P.ROLES_ADD, P.ROLES_EDIT],
  [P.ASSIGNMENTS_ADD, P.ASSIGNMENTS_EDIT],
];

export const FIELD_PERMISSIONS: PermissionItem[] = [
  { id: P.WEIGHT, name: "Weight", description: "Container weight", group: "fields", key: "weight", editId: P.WEIGHT_EDIT },
  { id: P.DAY_HIRE, name: "Day Hire", description: "Day hire amount", group: "fields", key: "dayHire", editId: P.DAY_HIRE_EDIT },
  { id: P.ADVANCED, name: "Advanced", description: "Advance payment", group: "fields", key: "advanced", editId: P.ADVANCED_EDIT },
  { id: P.ADVANCED_DATE, name: "Advanced Date", description: "Advance payment date", group: "fields", key: "advancedDate", editId: P.ADVANCED_DATE_EDIT },
  { id: P.BALANCE_PAID, name: "Balance Paid", description: "Balance payment", group: "fields", key: "balancePaid", editId: P.BALANCE_PAID_EDIT },
  { id: P.BALANCE_DATE, name: "Balance Date", description: "Balance payment date", group: "fields", key: "balanceDate", editId: P.BALANCE_DATE_EDIT },
  { id: P.OUT_HIRE, name: "Out Hire", description: "Out hire amount", group: "fields", key: "outHire", editId: P.OUT_HIRE_EDIT },
  { id: P.OTHER, name: "Other", description: "Other charges", group: "fields", key: "other", editId: P.OTHER_EDIT },
  { id: P.HELD_UP, name: "Held Up", description: "Held up amount", group: "fields", key: "heldUp", editId: P.HELD_UP_EDIT },
  { id: P.AGENT_FEE, name: "Agent Fee", description: "Agent commission", group: "fields", key: "agentFee", editId: P.AGENT_FEE_EDIT },
  { id: P.TRANSPORT_COMMISSION, name: "Transport Commission", description: "Transport commission", group: "fields", key: "transportCommission", editId: P.TRANSPORT_COMMISSION_EDIT },
  { id: P.RETURN, name: "Return", description: "Return amount", group: "fields", key: "return", editId: P.RETURN_EDIT },
  { id: P.FINANCIAL_TOTALS, name: "Totals", description: "Total, paid, and remaining amounts", group: "fields", key: "totals" },
];

export const FIELD_EDIT_PERMISSIONS: PermissionItem[] = FIELD_PERMISSIONS.filter(
  (item) => item.editId
).map((item) => ({
  id: item.editId as number,
  name: `Edit ${item.name}`,
  description: `Change ${item.description.toLowerCase()}`,
  group: "fields" as const,
  key: item.key,
}));

export const ALL_PERMISSIONS: PermissionItem[] = [
  ...PAGE_PERMISSIONS,
  ...FIELD_PERMISSIONS,
  ...FIELD_EDIT_PERMISSIONS,
];

export const ALL_PERMISSION_IDS = ALL_PERMISSIONS.map((item) => item.id);

export const DEFAULT_STAFF_PERMISSIONS = [
  P.LORRIES_VIEW,
  P.DESTINATIONS_VIEW,
  P.ASSIGNMENTS_VIEW,
  ...FIELD_PERMISSIONS.map((item) => item.id),
  ...FIELD_EDIT_PERMISSIONS.map((item) => item.id),
];

const MUST_GRANT = new Set<number>([
  P.USERS_VIEW,
  P.USERS_ADD,
  P.USERS_EDIT,
  P.LORRIES_ADD,
  P.LORRIES_EDIT,
  P.ASSIGNMENTS_ADD,
  P.ASSIGNMENTS_EDIT,
  P.DESTINATIONS_ADD,
  P.DESTINATIONS_EDIT,
  P.ROLES_ADD,
  P.ROLES_EDIT,
  P.ROLES_VIEW,
  P.LOGS_VIEW,
]);

export const FIELD_KEY_TO_ID: Record<string, number> = Object.fromEntries(
  FIELD_PERMISSIONS.filter((item) => item.key && item.key !== "totals").map(
    (item) => [item.key as string, item.id]
  )
);

export const FIELD_KEY_TO_EDIT_ID: Record<string, number> = Object.fromEntries(
  FIELD_PERMISSIONS.filter((item) => item.key && item.editId).map((item) => [
    item.key as string,
    item.editId as number,
  ])
);

const toIdList = (value: unknown) =>
  (Array.isArray(value) ? value : [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

export function can(id: number, user: AuthUser | null = getAuthUser()) {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  const denied = toIdList(user.denied);
  const permission = toIdList(user.permission);
  if (denied.includes(id)) return false;
  if (permission.includes(id)) return true;
  for (const [addId, editId] of LEGACY_ADD_TO_EDIT) {
    if (id === editId && permission.includes(addId) && !denied.includes(editId)) {
      return true;
    }
  }
  return !MUST_GRANT.has(id);
}

export function canAny(ids: number[], user: AuthUser | null = getAuthUser()) {
  return ids.some((id) => can(id, user));
}

export function canSeeField(key: string, user: AuthUser | null = getAuthUser()) {
  if (key === "totals" || key === "total" || key === "paid" || key === "remaining" || key === "balance") {
    return can(P.FINANCIAL_TOTALS, user);
  }
  const id = FIELD_KEY_TO_ID[key];
  if (!id) return true;
  return can(id, user);
}

export function canEditField(key: string, user: AuthUser | null = getAuthUser()) {
  if (key === "totals" || key === "total" || key === "paid" || key === "remaining" || key === "balance") {
    return false;
  }
  if (!canSeeField(key, user)) return false;
  const id = FIELD_KEY_TO_EDIT_ID[key];
  if (!id) return true;
  return can(id, user);
}

export function canAddAssignments(user: AuthUser | null = getAuthUser()) {
  return can(P.ASSIGNMENTS_ADD, user);
}

export function canEditAssignments(user: AuthUser | null = getAuthUser()) {
  return can(P.ASSIGNMENTS_EDIT, user);
}

export function canManageAssignments(user: AuthUser | null = getAuthUser()) {
  return canEditAssignments(user);
}

export function fieldLockProps(key: string, extraClass = "") {
  const locked = !canEditField(key);
  return {
    disabled: locked,
    className: [extraClass, locked ? "bg-muted" : ""].filter(Boolean).join(" "),
  };
}

export function omitHiddenContainerFields<T extends Record<string, any>>(container: T): T {
  const next = { ...container };
  for (const key of Object.keys(FIELD_KEY_TO_ID)) {
    if (!canEditField(key) && key in next) {
      delete next[key];
    }
  }
  return next;
}

export function hydrateRolePermissions(
  permission: number[] = [],
  denied: number[] = []
) {
  const allowed = new Set(permission.map(Number));
  const blocked = new Set(denied.map(Number));
  for (const [addId, editId] of LEGACY_ADD_TO_EDIT) {
    if (allowed.has(addId) && !blocked.has(editId) && !allowed.has(editId)) {
      allowed.add(editId);
    }
  }
  const nextPermission = ALL_PERMISSION_IDS.filter((id) => {
    if (blocked.has(id)) return false;
    if (allowed.has(id)) return true;
    return !MUST_GRANT.has(id);
  });
  return {
    permission: nextPermission,
    denied: ALL_PERMISSION_IDS.filter((id) => !nextPermission.includes(id)),
  };
}
