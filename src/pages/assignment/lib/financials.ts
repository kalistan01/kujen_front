export const CHARGE_FIELDS = [
  { key: "weight", label: "Weight" },
  { key: "dayHire", label: "Day Hire" },
  { key: "outHire", label: "Out Hire" },
  { key: "other", label: "Other" },
  { key: "heldUp", label: "Held Up" },
  { key: "return", label: "Return" },
] as const;

export const COMMISSION_FIELDS = [
  { key: "agentFee", label: "Agent Fee" },
  { key: "transportCommission", label: "Transport Commission" },
] as const;

export type ChargeKey = (typeof CHARGE_FIELDS)[number]["key"];
export type CommissionKey = (typeof COMMISSION_FIELDS)[number]["key"];

export const toAmount = (value: unknown) => {
  if (typeof value === "object" && value !== null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const formatMoney = (value?: number) =>
  `Rs ${toAmount(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const todayDateInput = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

export const toDateInput = (value?: string | Date | null) => {
  if (!value) return todayDateInput();
  if (typeof value === "string") {
    const part = value.substring(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(part) ? part : todayDateInput();
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, "0"),
      String(value.getDate()).padStart(2, "0"),
    ].join("-");
  }
  return todayDateInput();
};

export const containerChargesTotal = (container: any = {}) =>
  roundMoney(
    CHARGE_FIELDS.reduce((sum, field) => sum + toAmount(container[field.key]), 0)
  );

export const getAssignmentFinancials = (containers: any[] = []) => {
  const charges = CHARGE_FIELDS.reduce(
    (acc, field) => {
      acc[field.key] = roundMoney(
        containers.reduce((sum, c) => sum + toAmount(c?.[field.key]), 0)
      );
      return acc;
    },
    {} as Record<ChargeKey, number>
  );

  const commissions = COMMISSION_FIELDS.reduce(
    (acc, field) => {
      acc[field.key] = roundMoney(
        containers.reduce((sum, c) => sum + toAmount(c?.[field.key]), 0)
      );
      return acc;
    },
    {} as Record<CommissionKey, number>
  );

  const total = roundMoney(
    CHARGE_FIELDS.reduce((sum, field) => sum + charges[field.key], 0)
  );
  const commissionTotal = roundMoney(
    COMMISSION_FIELDS.reduce((sum, field) => sum + commissions[field.key], 0)
  );
  const advanced = roundMoney(
    containers.reduce((sum, c) => sum + toAmount(c?.advanced), 0)
  );
  const balancePaid = roundMoney(
    containers.reduce((sum, c) => sum + toAmount(c?.balancePaid), 0)
  );
  const paid = roundMoney(advanced + balancePaid);

  return {
    charges,
    commissions,
    total,
    commissionTotal,
    advanced,
    balancePaid,
    paid,
    remaining: roundMoney(total - paid),
  };
};

export const containerPaid = (container: any = {}) =>
  roundMoney(toAmount(container.advanced) + toAmount(container.balancePaid));

export const containerBalance = (container: any = {}) =>
  roundMoney(containerChargesTotal(container) - containerPaid(container));
