import { getAuthUser, isAdminUser, type AuthUser } from "@/lib/auth";

export const P = {
  USERS_VIEW: 1,
  USERS_MANAGE: 2,
  LORRIES_VIEW: 3,
  LORRIES_MANAGE: 4,
  ASSIGNMENTS_MANAGE: 5,
  DESTINATIONS_VIEW: 6,
  DESTINATIONS_MANAGE: 7,
  ASSIGNMENTS_VIEW: 8,
  ROLES_MANAGE: 9,
  LOGS_VIEW: 10,
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
} as const;

export type PermissionId = (typeof P)[keyof typeof P];

export type PermissionItem = {
  id: number;
  name: string;
  description: string;
  group: "pages" | "fields";
  key?: string;
};

export const PAGE_PERMISSIONS: PermissionItem[] = [
  { id: P.USERS_VIEW, name: "View Users", description: "Open the users page", group: "pages" },
  { id: P.USERS_MANAGE, name: "Manage Users", description: "Add, edit, and disable users", group: "pages" },
  { id: P.ROLES_MANAGE, name: "Manage Roles", description: "Create and edit access roles", group: "pages" },
  { id: P.LORRIES_VIEW, name: "View Lorry Owners", description: "Open the lorry owners page", group: "pages" },
  { id: P.LORRIES_MANAGE, name: "Manage Lorry Owners", description: "Add and edit owners and vehicles", group: "pages" },
  { id: P.DESTINATIONS_VIEW, name: "View Destinations", description: "Open settings, destinations, and held up rates", group: "pages" },
  { id: P.DESTINATIONS_MANAGE, name: "Manage Destinations", description: "Add, edit, and disable routes", group: "pages" },
  { id: P.ASSIGNMENTS_VIEW, name: "View Assignments", description: "Open assignments and details", group: "pages" },
  { id: P.ASSIGNMENTS_MANAGE, name: "Manage Assignments", description: "Create, edit, pay, and delete assignments", group: "pages" },
  { id: P.LOGS_VIEW, name: "View Logs", description: "Open the activity log", group: "pages" },
];

export const FIELD_PERMISSIONS: PermissionItem[] = [
  { id: P.WEIGHT, name: "Weight", description: "Container weight", group: "fields", key: "weight" },
  { id: P.DAY_HIRE, name: "Day Hire", description: "Day hire amount", group: "fields", key: "dayHire" },
  { id: P.ADVANCED, name: "Advanced", description: "Advance payment", group: "fields", key: "advanced" },
  { id: P.ADVANCED_DATE, name: "Advanced Date", description: "Advance payment date", group: "fields", key: "advancedDate" },
  { id: P.BALANCE_PAID, name: "Balance Paid", description: "Balance payment", group: "fields", key: "balancePaid" },
  { id: P.BALANCE_DATE, name: "Balance Date", description: "Balance payment date", group: "fields", key: "balanceDate" },
  { id: P.OUT_HIRE, name: "Out Hire", description: "Out hire amount", group: "fields", key: "outHire" },
  { id: P.OTHER, name: "Other", description: "Other charges", group: "fields", key: "other" },
  { id: P.HELD_UP, name: "Held Up", description: "Held up amount", group: "fields", key: "heldUp" },
  { id: P.AGENT_FEE, name: "Agent Fee", description: "Agent commission", group: "fields", key: "agentFee" },
  { id: P.TRANSPORT_COMMISSION, name: "Transport Commission", description: "Transport commission", group: "fields", key: "transportCommission" },
  { id: P.RETURN, name: "Return", description: "Return amount", group: "fields", key: "return" },
  { id: P.FINANCIAL_TOTALS, name: "Totals", description: "Total, paid, and remaining amounts", group: "fields", key: "totals" },
];

export const ALL_PERMISSIONS: PermissionItem[] = [
  ...PAGE_PERMISSIONS,
  ...FIELD_PERMISSIONS,
];

export const ALL_PERMISSION_IDS = ALL_PERMISSIONS.map((item) => item.id);

export const DEFAULT_STAFF_PERMISSIONS = [
  P.LORRIES_VIEW,
  P.DESTINATIONS_VIEW,
  P.ASSIGNMENTS_VIEW,
  ...FIELD_PERMISSIONS.map((item) => item.id),
];

const MUST_GRANT = new Set<number>([
  P.USERS_VIEW,
  P.USERS_MANAGE,
  P.LORRIES_MANAGE,
  P.ASSIGNMENTS_MANAGE,
  P.DESTINATIONS_MANAGE,
  P.ROLES_MANAGE,
  P.LOGS_VIEW,
]);

export const FIELD_KEY_TO_ID: Record<string, number> = Object.fromEntries(
  FIELD_PERMISSIONS.filter((item) => item.key && item.key !== "totals").map(
    (item) => [item.key as string, item.id]
  )
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

export function canManageAssignments(user: AuthUser | null = getAuthUser()) {
  return can(P.ASSIGNMENTS_MANAGE, user);
}

export function omitHiddenContainerFields<T extends Record<string, any>>(container: T): T {
  const next = { ...container };
  for (const [key, id] of Object.entries(FIELD_KEY_TO_ID)) {
    if (!can(id) && key in next) {
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
