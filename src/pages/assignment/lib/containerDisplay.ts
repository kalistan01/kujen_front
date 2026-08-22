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
      label: dest.type
        ? `${dest.type} - ${dest.location}`
        : dest.location || dest._id,
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
