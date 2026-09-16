import { getAuthUser, isAdminUser, type AuthUser } from "@/lib/auth";
import { containerOwnerId } from "@/pages/assignment/lib/containerDisplay";

function ownerIdOf(value: unknown) {
  if (!value) return "";
  if (typeof value === "object") {
    const item = value as { _id?: unknown; id?: unknown };
    return String(item._id || item.id || "");
  }
  return String(value);
}

export function allowedLorryOwnerIds(
  user: AuthUser | null = getAuthUser()
): string[] | null {
  if (!user || isAdminUser(user)) return null;
  const ids = (user.allowedLorryOwners || [])
    .map((id) => ownerIdOf(id))
    .filter(Boolean);
  const restricted =
    Boolean(user.restrictLorryOwners) ||
    (user.restrictLorryOwners == null && ids.length > 0);
  if (!restricted) return null;
  return ids;
}

export function isLorryOwnerAllowed(
  ownerId: unknown,
  user: AuthUser | null = getAuthUser()
) {
  const allowed = allowedLorryOwnerIds(user);
  if (!allowed) return true;
  return allowed.includes(ownerIdOf(ownerId));
}

export function scopeLorryOwners<T extends { _id?: unknown; id?: unknown }>(
  owners: T[],
  user: AuthUser | null = getAuthUser()
) {
  const allowed = allowedLorryOwnerIds(user);
  if (!allowed) return owners;
  return owners.filter((owner) => allowed.includes(ownerIdOf(owner._id || owner.id)));
}

export function scopeAssignmentContainers<T extends { containers?: any[] }>(
  assignment: T,
  user: AuthUser | null = getAuthUser()
): T {
  const allowed = allowedLorryOwnerIds(user);
  if (!allowed || !assignment) return assignment;
  return {
    ...assignment,
    containers: (assignment.containers || []).filter((container) => {
      const ownerId = containerOwnerId(container);
      return ownerId && allowed.includes(ownerId);
    }),
  };
}

export function scopeAssignments<T extends { containers?: any[] }>(
  assignments: T[],
  user: AuthUser | null = getAuthUser()
) {
  const allowed = allowedLorryOwnerIds(user);
  if (!allowed) return assignments;
  return assignments.map((assignment) =>
    scopeAssignmentContainers(assignment, user)
  );
}
