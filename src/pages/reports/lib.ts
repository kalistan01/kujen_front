import {
  containerCapacity,
  containerDestination,
  containerLorry,
  containerMoney,
  containerOwner,
  containerOwnerId,
} from "@/pages/assignment/lib/containerDisplay";
import { parseDay } from "@/pages/assignment/lib/dates";
import {
  applyHeldUpToContainers,
  CHARGE_FIELDS,
  extraHeldUpDays,
  formatMoney,
  toAmount,
  type HeldUpRateOption,
} from "@/pages/assignment/lib/financials";
import { canSeeField } from "@/lib/permissions";

export type ContainerRow = {
  assignment: any;
  container: any;
};

export type GroupMoney = {
  total: number;
  paid: number;
  remaining: number;
  weight: number;
  dayHire: number;
  heldUp: number;
  advanced: number;
  balancePaid: number;
};

export function idOf(value: unknown) {
  if (!value) return "";
  if (typeof value === "object") {
    const item = value as { _id?: unknown; id?: unknown };
    return String(item._id || item.id || "");
  }
  return String(value);
}

export function rowDate(row: ContainerRow) {
  return row.container?.loadingDate || row.assignment?.cusdecDate || null;
}

export function inDateRange(value: unknown, fromDate: string, toDate: string) {
  const from = parseDay(fromDate);
  const to = parseDay(toDate, true);
  if (!from && !to) return true;
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function buildContainerRows(
  assignments: any[] = [],
  rates: HeldUpRateOption[] = []
): ContainerRow[] {
  return assignments.flatMap((assignment) => {
    const containers = applyHeldUpToContainers(
      assignment?.containers || [],
      rates
    );
    return containers
      .filter((container: any) => container && (container.containerNo || container._id))
      .map((container: any) => ({ assignment, container }));
  });
}

export function filterRows(
  rows: ContainerRow[],
  query: string,
  fromDate: string,
  toDate: string
) {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (!inDateRange(rowDate(row), fromDate, toDate)) return false;
    if (!q) return true;
    const hay = [
      row.assignment?.blNo,
      row.assignment?.item,
      row.assignment?.exporter,
      row.assignment?.importer,
      row.assignment?.cusdecNo,
      row.assignment?.regNo,
      row.container?.containerNo,
      row.container?.vocNo,
      containerLorry(row.container),
      containerOwner(row.container),
      containerDestination(row.container),
      row.container?.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function emptyMoney(): GroupMoney {
  return {
    total: 0,
    paid: 0,
    remaining: 0,
    weight: 0,
    dayHire: 0,
    heldUp: 0,
    advanced: 0,
    balancePaid: 0,
  };
}

export function addMoney(target: GroupMoney, container: any): GroupMoney {
  const money = containerMoney(container);
  target.total += money.total;
  target.paid += money.paid;
  target.remaining += money.balance;
  target.weight += toAmount(container?.weight);
  target.dayHire += toAmount(container?.dayHire);
  target.heldUp += toAmount(container?.heldUp);
  target.advanced += toAmount(container?.advanced);
  target.balancePaid += toAmount(container?.balancePaid);
  return target;
}

export function assignmentOverview(rows: ContainerRow[]) {
  const assignmentIds = new Set(
    rows.map((row) => idOf(row.assignment)).filter(Boolean)
  );
  const status = { pending: 0, "in-progress": 0, advanced: 0, completed: 0 };
  const money = emptyMoney();
  rows.forEach((row) => {
    const key = (row.container?.status || "pending") as keyof typeof status;
    if (key in status) status[key] += 1;
    else status.pending += 1;
    addMoney(money, row.container);
  });
  return {
    assignments: assignmentIds.size,
    containers: rows.length,
    status,
    money,
  };
}

export function outstandingRows(rows: ContainerRow[]) {
  return rows
    .filter((row) => containerMoney(row.container).balance > 0)
    .sort(
      (a, b) =>
        containerMoney(b.container).balance - containerMoney(a.container).balance
    );
}

export type NamedGroup = {
  key: string;
  label: string;
  containers: number;
  assignments: number;
  money: GroupMoney;
};

function groupBy(
  rows: ContainerRow[],
  keyOf: (row: ContainerRow) => string,
  labelOf: (row: ContainerRow) => string
): NamedGroup[] {
  const map = new Map<string, NamedGroup & { assignmentIds: Set<string> }>();
  rows.forEach((row) => {
    const key = keyOf(row) || "unknown";
    const current = map.get(key) || {
      key,
      label: labelOf(row) || "—",
      containers: 0,
      assignments: 0,
      money: emptyMoney(),
      assignmentIds: new Set<string>(),
    };
    current.containers += 1;
    current.assignmentIds.add(idOf(row.assignment) || row.assignment?.blNo || "");
    addMoney(current.money, row.container);
    if (!current.label || current.label === "—") current.label = labelOf(row) || "—";
    map.set(key, current);
  });
  return [...map.values()]
    .map(({ assignmentIds, ...item }) => ({
      ...item,
      assignments: [...assignmentIds].filter(Boolean).length,
    }))
    .sort((a, b) => b.containers - a.containers);
}

export function byDestination(rows: ContainerRow[]) {
  return groupBy(
    rows,
    (row) =>
      idOf(row.container?.destination) ||
      containerDestination(row.container) ||
      "unknown",
    (row) => containerDestination(row.container)
  );
}

export function byExporter(rows: ContainerRow[]) {
  return groupBy(
    rows,
    (row) => String(row.assignment?.exporter || "unknown").trim().toLowerCase(),
    (row) => row.assignment?.exporter || "—"
  );
}

export function byImporter(rows: ContainerRow[]) {
  return groupBy(
    rows,
    (row) => String(row.assignment?.importer || "unknown").trim().toLowerCase(),
    (row) => row.assignment?.importer || "—"
  );
}

export function heldUpRows(rows: ContainerRow[]) {
  return rows
    .map((row) => {
      const extraDays = extraHeldUpDays(
        row.container?.loadingDate,
        row.container?.demoundDate
      );
      return { ...row, extraDays, heldUp: toAmount(row.container?.heldUp) };
    })
    .filter((row) => row.extraDays > 0 || row.heldUp > 0)
    .sort((a, b) => b.heldUp - a.heldUp || b.extraDays - a.extraDays);
}

export function monthlySeries(rows: ContainerRow[]) {
  const map = new Map<
    string,
    {
      key: string;
      label: string;
      containers: number;
      assignments: Set<string>;
      total: number;
      paid: number;
      remaining: number;
    }
  >();
  rows.forEach((row) => {
    const value = rowDate(row);
    if (!value) return;
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const current = map.get(key) || {
      key,
      label: date.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
      containers: 0,
      assignments: new Set<string>(),
      total: 0,
      paid: 0,
      remaining: 0,
    };
    const money = containerMoney(row.container);
    current.containers += 1;
    current.assignments.add(idOf(row.assignment) || row.assignment?.blNo || "");
    current.total += money.total;
    current.paid += money.paid;
    current.remaining += money.balance;
    map.set(key, current);
  });
  return [...map.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item) => ({
      key: item.key,
      label: item.label,
      containers: item.containers,
      assignments: [...item.assignments].filter(Boolean).length,
      total: item.total,
      paid: item.paid,
      remaining: item.remaining,
    }));
}

export type LorryStat = {
  key: string;
  lorryNum: string;
  capacity: string;
  ownerName: string;
  companyName: string;
  ownerId: string;
  trips: number;
  lastDate: string;
  money: GroupMoney;
  destinations: number;
};

export type OwnerStat = {
  key: string;
  ownerName: string;
  companyName: string;
  phoneNum: string;
  lorries: number;
  usedLorries: number;
  trips: number;
  money: GroupMoney;
};

function lorryMatchKey(container: any) {
  return idOf(container?.lorryId) || containerLorry(container);
}

export function byLorry(owners: any[], rows: ContainerRow[]): LorryStat[] {
  const trips = new Map<string, ContainerRow[]>();

  rows.forEach((row) => {
    const id = idOf(row.container?.lorryId);
    const num = containerLorry(row.container);
    const keys = [id, num !== "Unassigned" ? num : ""].filter(Boolean);
    if (!keys.length) return;
    const existing = keys.map((key) => trips.get(key)).find(Boolean);
    const list = existing ? existing : [];
    keys.forEach((key) => {
      const other = trips.get(key);
      if (other && other !== list) {
        other.forEach((item) => {
          if (!list.includes(item)) list.push(item);
        });
      }
      trips.set(key, list);
    });
    if (!list.includes(row)) list.push(row);
  });

  const seen = new Set<string>();
  const stats: LorryStat[] = [];

  owners.forEach((owner) => {
    (owner.lorries || []).forEach((lorry: any) => {
      const id = idOf(lorry);
      const num = String(lorry.lorryNum || "");
      const list = trips.get(id) || trips.get(num) || [];
      seen.add(id);
      seen.add(num);
      const dests = new Set(
        list.map((row) => containerDestination(row.container)).filter(Boolean)
      );
      const last = list
        .map((row) => String(rowDate(row) || ""))
        .sort()
        .at(-1);
      const money = emptyMoney();
      list.forEach((row) => addMoney(money, row.container));
      stats.push({
        key: id || num,
        lorryNum: num || "—",
        capacity: String(lorry.capacity || containerCapacity(list[0]?.container) || ""),
        ownerName: owner.ownerName || "",
        companyName: owner.companyName || "",
        ownerId: idOf(owner),
        trips: list.length,
        lastDate: last || "",
        money,
        destinations: dests.size,
      });
    });
  });

  rows.forEach((row) => {
    const key = lorryMatchKey(row.container);
    if (!key || key === "Unassigned" || seen.has(key) || seen.has(containerLorry(row.container))) {
      return;
    }
    const list = trips.get(key) || [row];
    seen.add(key);
    const money = emptyMoney();
    list.forEach((item) => addMoney(money, item.container));
    const dests = new Set(
      list.map((item) => containerDestination(item.container)).filter(Boolean)
    );
    const last = list
      .map((item) => String(rowDate(item) || ""))
      .sort()
      .at(-1);
    stats.push({
      key,
      lorryNum: containerLorry(row.container),
      capacity: String(containerCapacity(row.container) || ""),
      ownerName: containerOwner(row.container) || "",
      companyName: "",
      ownerId: containerOwnerId(row.container),
      trips: list.length,
      lastDate: last || "",
      money,
      destinations: dests.size,
    });
  });

  return stats.sort((a, b) => b.trips - a.trips || a.lorryNum.localeCompare(b.lorryNum));
}

export function byOwner(owners: any[], rows: ContainerRow[]): OwnerStat[] {
  const lorryStats = byLorry(owners, rows);
  const map = new Map<string, OwnerStat>();

  owners.forEach((owner) => {
    const key = idOf(owner) || owner.ownerName;
    map.set(key, {
      key,
      ownerName: owner.ownerName || "—",
      companyName: owner.companyName || "",
      phoneNum: owner.phoneNum || "",
      lorries: (owner.lorries || []).length,
      usedLorries: 0,
      trips: 0,
      money: emptyMoney(),
    });
  });

  lorryStats.forEach((lorry) => {
    const key =
      lorry.ownerId ||
      String(lorry.ownerName || "unknown").trim().toLowerCase();
    const current = map.get(key) || {
      key,
      ownerName: lorry.ownerName || "—",
      companyName: lorry.companyName || "",
      phoneNum: "",
      lorries: 0,
      usedLorries: 0,
      trips: 0,
      money: emptyMoney(),
    };
    if (lorry.trips > 0) current.usedLorries += 1;
    current.trips += lorry.trips;
    current.money.total += lorry.money.total;
    current.money.paid += lorry.money.paid;
    current.money.remaining += lorry.money.remaining;
    current.money.weight += lorry.money.weight;
    current.money.dayHire += lorry.money.dayHire;
    current.money.heldUp += lorry.money.heldUp;
    current.money.advanced += lorry.money.advanced;
    current.money.balancePaid += lorry.money.balancePaid;
    if (!map.has(key)) current.lorries += 1;
    map.set(key, current);
  });

  return [...map.values()].sort(
    (a, b) => b.trips - a.trips || a.ownerName.localeCompare(b.ownerName)
  );
}

export function fleetOverview(owners: any[], lorryStats: LorryStat[]) {
  const lorries = owners.reduce(
    (sum, owner) => sum + (owner.lorries || []).length,
    0
  );
  const used = lorryStats.filter((item) => item.trips > 0).length;
  const money = emptyMoney();
  lorryStats.forEach((item) => {
    money.total += item.money.total;
    money.paid += item.money.paid;
    money.remaining += item.money.remaining;
    money.heldUp += item.money.heldUp;
    money.dayHire += item.money.dayHire;
  });
  const capacities = new Map<string, number>();
  lorryStats.forEach((item) => {
    const cap = item.capacity || "—";
    capacities.set(cap, (capacities.get(cap) || 0) + 1);
  });
  return {
    owners: owners.length,
    lorries,
    used,
    idle: Math.max(0, lorryStats.length - used),
    money,
    capacities: [...capacities.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export function idleLorries(lorryStats: LorryStat[]) {
  return lorryStats
    .filter((item) => item.trips === 0)
    .sort((a, b) => a.lorryNum.localeCompare(b.lorryNum));
}

export function showMoney() {
  if (!canSeeField("totals")) return false;
  return (
    CHARGE_FIELDS.some((field) => canSeeField(field.key)) ||
    canSeeField("advanced") ||
    canSeeField("balancePaid")
  );
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
) {
  const escape = (value: string | number) => {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function handlePrint(title: string) {
  const previous = document.title;
  document.title = title;
  window.print();
  document.title = previous;
}

export function moneyText(value?: number) {
  return showMoney() ? formatMoney(value) : "—";
}

export function datePresets() {
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const yearStart = `${now.getFullYear()}-01-01`;
  const pad = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  return [
    { id: "all", label: "All time", from: "", to: "" },
    {
      id: "month",
      label: "This month",
      from: startOfMonth,
      to: pad(endOfMonth),
    },
    {
      id: "last",
      label: "Last month",
      from: pad(lastMonthStart),
      to: pad(lastMonthEnd),
    },
    {
      id: "year",
      label: "This year",
      from: yearStart,
      to: pad(now),
    },
  ];
}
