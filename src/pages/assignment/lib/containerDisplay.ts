import { canSeeField } from "@/lib/permissions";
import {
  CHARGE_FIELDS,
  COMMISSION_FIELDS,
  containerChargesTotal,
  roundMoney,
  toAmount,
} from "./financials";

export function containerLorry(container: any) {
  return container?.lorryNum || container?.lorryId?.lorryNum || "Unassigned";
}

function isPopulatedRef(value: any) {
  return Boolean(value && typeof value === "object" && (value._id || value.lorryNum || value.location));
}

export function mergePopulatedAssignment(previous: any, updated: any) {
  if (!updated) return previous;
  if (!previous) return updated;
  const previousById = new Map(
    (previous.containers || []).map((container: any) => [
      String(container?._id),
      container,
    ])
  );
  return {
    ...previous,
    ...updated,
    containers: (updated.containers || []).map((container: any) => {
      const prev = previousById.get(String(container?._id));
      if (!prev) return container;
      return {
        ...prev,
        ...container,
        lorryId: isPopulatedRef(container.lorryId) ? container.lorryId : prev.lorryId,
        lorryNum: container.lorryNum || prev.lorryNum,
        capacity: container.capacity || prev.capacity,
        lorryOwner: container.lorryOwner || prev.lorryOwner,
        destination: isPopulatedRef(container.destination)
          ? container.destination
          : prev.destination,
        destinationlocation:
          container.destinationlocation || prev.destinationlocation,
        destinationtype: container.destinationtype || prev.destinationtype,
        sourceContainerId:
          container.sourceContainerId || prev.sourceContainerId,
        tripKind: container.tripKind || prev.tripKind,
      };
    }),
  };
}

export function containerCapacity(container: any) {
  return container?.capacity || container?.lorryId?.capacity;
}

export function containerOwner(container: any) {
  const owner = container?.lorryId?.owner;
  if (owner && typeof owner === "object") {
    return owner.ownerName || owner.companyName;
  }
  return (
    container?.lorryOwner ||
    (typeof owner === "string" ? owner : undefined)
  );
}

export function containerOwnerId(container: any) {
  const owner = container?.lorryId?.owner;
  if (owner && typeof owner === "object" && owner._id) return String(owner._id);
  if (typeof owner === "string") return owner;
  return "";
}

export function containerMatchesOwner(container: any, value: string) {
  if (!value || value === "all") return true;
  const id = containerOwnerId(container);
  if (id && id === value) return true;
  return containerOwnerKey(container) === String(value).trim().toLowerCase();
}

export function containerSourceId(container: any) {
  const value = container?.sourceContainerId;
  if (!value) return "";
  if (typeof value === "object") return String(value._id || "");
  return String(value);
}

export function containerTripKind(container: any) {
  if (container?.tripKind === "yard" || container?.tripKind === "onward") {
    return container.tripKind;
  }
  if (containerSourceId(container)) return "onward";
  return "";
}

export function containerIsToYard(container: any) {
  return containerTripKind(container) === "yard";
}

export function orderContainersWithStoreTrips(containers: any[] = []) {
  const list = containers.filter(Boolean);
  const byId = new Map(
    list
      .filter((container) => container?._id)
      .map((container) => [String(container._id), container])
  );
  const childrenBySource = new Map<string, any[]>();
  for (const container of list) {
    const sourceId = containerSourceId(container);
    if (!sourceId || !byId.has(sourceId)) continue;
    const group = childrenBySource.get(sourceId) || [];
    group.push(container);
    childrenBySource.set(sourceId, group);
  }
  const placed = new Set<string>();
  const ordered: any[] = [];
  for (const container of list) {
    const id = String(container?._id || "");
    if (id && placed.has(id)) continue;
    const sourceId = containerSourceId(container);
    if (sourceId && byId.has(sourceId)) continue;
    ordered.push(container);
    if (id) placed.add(id);
    for (const child of childrenBySource.get(id) || []) {
      const childId = String(child?._id || "");
      if (childId && placed.has(childId)) continue;
      ordered.push(child);
      if (childId) placed.add(childId);
    }
  }
  for (const container of list) {
    const id = String(container?._id || "");
    if (id && placed.has(id)) continue;
    ordered.push(container);
    if (id) placed.add(id);
  }
  return ordered;
}

export function containersGroupedByYardTrip(containers: any[] = []) {
  const ordered = orderContainersWithStoreTrips(containers);
  const groups: any[][] = [];
  for (let index = 0; index < ordered.length; index += 1) {
    const current = ordered[index];
    const next = ordered[index + 1];
    const currentId = String(current?._id || "");
    if (next && currentId && containerSourceId(next) === currentId) {
      groups.push([current, next]);
      index += 1;
    } else {
      groups.push([current]);
    }
  }
  return groups;
}

export function containerDestination(container: any) {
  return (
    container?.destinationlocation || container?.destination?.location || "—"
  );
}

export function containerOwnerKey(container: any) {
  return String(containerOwner(container) || "")
    .trim()
    .toLowerCase();
}

export function containerDestinationOption(container: any) {
  const dest = container?.destination;
  if (dest && typeof dest === "object" && (dest._id || dest.location)) {
    return {
      value: String(dest._id || dest.location),
      label: dest.location || dest._id,
    };
  }
  const location = container?.destinationlocation;
  if (location) return { value: String(location), label: String(location) };
  if (typeof dest === "string" && dest) return { value: dest, label: dest };
  return null;
}

export function containerDestinationMatches(container: any, value: string) {
  if (!value || value === "all") return true;
  const dest = container?.destination;
  if (dest && typeof dest === "object") {
    return dest._id === value || dest.location === value;
  }
  if (typeof dest === "string") return dest === value;
  return container?.destinationlocation === value;
}

export const CONTAINER_CHARGE_COLUMNS = [
  { key: "weight", label: "Weight" },
  { key: "dayHire", label: "Day Hire" },
  { key: "advanced", label: "Advanced" },
  { key: "balancePaid", label: "Balance Paid" },
  ...CHARGE_FIELDS.filter(
    (field) => field.key !== "weight" && field.key !== "dayHire"
  ),
  ...COMMISSION_FIELDS,
] as const;

export function visibleChargeColumns() {
  return CONTAINER_CHARGE_COLUMNS.filter((field) => canSeeField(field.key));
}

export function containerMoney(container: any) {
  const visibleCharges = CHARGE_FIELDS.filter((field) =>
    canSeeField(field.key)
  );
  const total = containerChargesTotal(container, visibleCharges);
  const paid = roundMoney(
    (canSeeField("advanced") ? toAmount(container.advanced) : 0) +
      (canSeeField("balancePaid") ? toAmount(container.balancePaid) : 0)
  );
  return {
    total,
    paid,
    balance: roundMoney(total - paid),
  };
}
