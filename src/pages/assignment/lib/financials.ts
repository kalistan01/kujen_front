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

export const formatMoney = (value?: number) => {
  const amount = roundMoney(toAmount(value));
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return `Rs ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
};

export const todayDateInput = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

export const toDateKey = (value?: string | Date | null) => {
  if (!value) return "";
  if (typeof value === "string") {
    const part = value.substring(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

export const toDateInput = (value?: string | Date | null) =>
  toDateKey(value) || todayDateInput();

export type HeldUpRateOption = {
  amount?: number;
  date?: string;
  status?: boolean;
  createdAt?: string;
};

export const extraHeldUpDays = (
  loadingDate?: string | Date | null,
  demountDate?: string | Date | null
) => {
  const start = toDateKey(loadingDate);
  const end = toDateKey(demountDate);
  if (!start || !end) return 0;
  const [ay, am, ad] = start.split("-").map(Number);
  const [by, bm, bd] = end.split("-").map(Number);
  const diff = Math.round(
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000
  );
  return Math.max(0, diff - 1);
};

export const pickHeldUpRate = (
  rates: HeldUpRateOption[] = [],
  loadingDate?: string | Date | null
) => {
  const list = [...rates].sort((a, b) => {
    const byDate = String(b.date || "").localeCompare(String(a.date || ""));
    if (byDate) return byDate;
    return (
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
    );
  });
  const key = toDateKey(loadingDate);
  if (key) {
    const match = list.find((item) => String(item.date || "") <= key);
    if (match) return toAmount(match.amount);
  }
  const active = list.find((item) => item.status);
  return toAmount(active?.amount);
};

export const heldUpFromDates = (
  loadingDate?: string | Date | null,
  demountDate?: string | Date | null,
  rate = 0
) => {
  const extraDays = extraHeldUpDays(loadingDate, demountDate);
  const dailyRate = toAmount(rate);
  return {
    extraDays,
    rate: dailyRate,
    amount: roundMoney(extraDays * dailyRate),
  };
};

export const applyHeldUpToContainer = <T extends Record<string, any>>(
  container: T,
  rates: HeldUpRateOption[] = []
) => {
  const calc = heldUpFromDates(
    container?.loadingDate,
    container?.demoundDate,
    pickHeldUpRate(rates, container?.loadingDate)
  );
  return {
    ...container,
    heldUp: calc.amount,
    heldUpExtraDays: calc.extraDays,
    heldUpRate: calc.rate,
  };
};

export const applyHeldUpToContainers = <T extends Record<string, any>>(
  containers: T[] = [],
  rates: HeldUpRateOption[] = []
) => containers.map((container) => applyHeldUpToContainer(container, rates));

export const containerChargesTotal = (
  container: any = {},
  fields: readonly { key: string }[] = CHARGE_FIELDS
) =>
  roundMoney(
    fields.reduce((sum, field) => sum + toAmount(container[field.key]), 0)
  );

export const getAssignmentFinancials = (
  containers: any[] = [],
  options?: {
    chargeFields?: readonly { key: ChargeKey; label: string }[];
    commissionFields?: readonly { key: CommissionKey; label: string }[];
  }
) => {
  const chargeFields = options?.chargeFields ?? CHARGE_FIELDS;
  const commissionFields = options?.commissionFields ?? COMMISSION_FIELDS;
  const charges = CHARGE_FIELDS.reduce(
    (acc, field) => {
      acc[field.key] = roundMoney(
        chargeFields.some((item) => item.key === field.key)
          ? containers.reduce((sum, c) => sum + toAmount(c?.[field.key]), 0)
          : 0
      );
      return acc;
    },
    {} as Record<ChargeKey, number>
  );

  const commissions = COMMISSION_FIELDS.reduce(
    (acc, field) => {
      acc[field.key] = roundMoney(
        commissionFields.some((item) => item.key === field.key)
          ? containers.reduce((sum, c) => sum + toAmount(c?.[field.key]), 0)
          : 0
      );
      return acc;
    },
    {} as Record<CommissionKey, number>
  );

  const total = roundMoney(
    chargeFields.reduce((sum, field) => sum + charges[field.key as ChargeKey], 0)
  );
  const commissionTotal = roundMoney(
    commissionFields.reduce(
      (sum, field) => sum + commissions[field.key as CommissionKey],
      0
    )
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
