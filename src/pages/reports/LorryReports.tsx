import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatDate } from "@/pages/assignment/lib/dates";
import { formatMoney } from "@/pages/assignment/lib/financials";
import {
  byLorry,
  byOwner,
  downloadCsv,
  fleetOverview,
  handlePrint,
  idleLorries,
  moneyText,
  showMoney,
  type ContainerRow,
} from "./lib";
import {
  KpiCard,
  ReportActions,
  ReportTable,
  SubNav,
} from "./shared";

const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "lorries", label: "By lorry" },
  { id: "owners", label: "By owner" },
  { id: "idle", label: "Idle fleet" },
];

const chartConfig = {
  trips: { label: "Trips", color: "hsl(38 92% 50%)" },
  count: { label: "Lorries", color: "hsl(217 64% 36%)" },
} satisfies ChartConfig;

function matchesQuery(parts: Array<string | number | undefined>, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function LorryReports({
  owners,
  rows,
  query = "",
  view,
  onViewChange,
}: {
  owners: any[];
  rows: ContainerRow[];
  query?: string;
  view: string;
  onViewChange: (value: string) => void;
}) {
  const lorryStats = useMemo(
    () =>
      byLorry(owners, rows).filter((item) =>
        matchesQuery(
          [item.lorryNum, item.capacity, item.ownerName, item.companyName],
          query
        )
      ),
    [owners, rows, query]
  );
  const ownerStats = useMemo(
    () =>
      byOwner(owners, rows).filter((item) =>
        matchesQuery([item.ownerName, item.companyName, item.phoneNum], query)
      ),
    [owners, rows, query]
  );
  const overview = useMemo(
    () => fleetOverview(owners, lorryStats),
    [owners, lorryStats]
  );
  const idle = useMemo(() => idleLorries(lorryStats), [lorryStats]);
  const money = showMoney();
  const topLorries = lorryStats.filter((item) => item.trips > 0).slice(0, 8);

  const exportCsv = () => {
    if (view === "owners") {
      downloadCsv(
        "RG-Business-transport-Owner-Report",
        ["Owner", "Company", "Phone", "Lorries", "Used", "Trips", "Total", "Paid", "Remaining"],
        ownerStats.map((item) => [
          item.ownerName,
          item.companyName,
          item.phoneNum,
          item.lorries,
          item.usedLorries,
          item.trips,
          item.money.total,
          item.money.paid,
          item.money.remaining,
        ])
      );
      return;
    }
    if (view === "idle") {
      downloadCsv(
        "RG-Business-transport-Idle-Lorries",
        ["Lorry", "Capacity", "Owner", "Company"],
        idle.map((item) => [
          item.lorryNum,
          item.capacity,
          item.ownerName,
          item.companyName,
        ])
      );
      return;
    }
    downloadCsv(
      view === "overview" ? "RG-Business-transport-Fleet-Overview" : "RG-Business-transport-Lorry-Report",
      ["Lorry", "Capacity", "Owner", "Company", "Trips", "Last used", "Destinations", "Total", "Paid", "Remaining"],
      lorryStats.map((item) => [
        item.lorryNum,
        item.capacity,
        item.ownerName,
        item.companyName,
        item.trips,
        item.lastDate ? formatDate(item.lastDate) : "",
        item.destinations,
        item.money.total,
        item.money.paid,
        item.money.remaining,
      ])
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SubNav items={VIEWS} value={view} onChange={onViewChange} />
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{lorryStats.length} lorries</Badge>
          <ReportActions
            onPrint={() => handlePrint(`RG-Business-transport-Lorry-${view}-Report`)}
            onCsv={exportCsv}
          />
        </div>
      </div>

      {view === "overview" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Owners"
              value={String(overview.owners)}
              hint={`${overview.lorries} vehicles`}
            />
            <KpiCard
              label="Used in range"
              value={String(overview.used)}
              hint={`${overview.idle} idle`}
              tone="text-amber-600"
            />
            {money ? (
              <>
                <KpiCard
                  label="Hire earned"
                  value={formatMoney(overview.money.total)}
                  hint={`${formatMoney(overview.money.paid)} paid`}
                />
                <KpiCard
                  label="Owner balances"
                  value={formatMoney(overview.money.remaining)}
                  tone={
                    overview.money.remaining > 0
                      ? "text-rose-600"
                      : "text-emerald-600"
                  }
                />
              </>
            ) : (
              <>
                <KpiCard label="Fleet size" value={String(overview.lorries)} />
                <KpiCard label="Idle" value={String(overview.idle)} />
              </>
            )}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Busiest lorries</CardTitle>
              </CardHeader>
              <CardContent>
                {topLorries.length ? (
                  <ChartContainer config={chartConfig} className="h-64 w-full">
                    <BarChart data={topLorries} layout="vertical" margin={{ left: 16, right: 8 }}>
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" allowDecimals={false} hide />
                      <YAxis
                        type="category"
                        dataKey="lorryNum"
                        width={88}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="trips" fill="var(--color-trips)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No lorry trips in this range.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Capacity mix</CardTitle>
              </CardHeader>
              <CardContent>
                {overview.capacities.length ? (
                  <ChartContainer config={chartConfig} className="h-64 w-full">
                    <BarChart data={overview.capacities}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No fleet capacity data.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {view === "lorries" ? (
        <ReportTable
          rows={lorryStats}
          empty="No lorries found."
          rowKey={(row) => row.key}
          columns={[
            {
              key: "lorry",
              label: "Lorry",
              cell: (row) => (
                <div>
                  <p className="font-semibold">{row.lorryNum}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.capacity ? `${row.capacity} ft` : "—"}
                  </p>
                </div>
              ),
            },
            {
              key: "owner",
              label: "Owner",
              cell: (row) => (
                <div>
                  <p className="text-sm font-medium">{row.ownerName || "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.companyName || "—"}
                  </p>
                </div>
              ),
            },
            {
              key: "trips",
              label: "Trips",
              align: "right",
              cell: (row) => row.trips,
            },
            {
              key: "last",
              label: "Last used",
              cell: (row) => (row.lastDate ? formatDate(row.lastDate) : "—"),
            },
            {
              key: "destinations",
              label: "Routes",
              align: "right",
              cell: (row) => row.destinations,
            },
            ...(money
              ? [
                  {
                    key: "total",
                    label: "Hire",
                    align: "right" as const,
                    cell: (row: (typeof lorryStats)[number]) =>
                      formatMoney(row.money.total),
                  },
                  {
                    key: "remaining",
                    label: "Remaining",
                    align: "right" as const,
                    cell: (row: (typeof lorryStats)[number]) => (
                      <span
                        className={
                          row.money.remaining > 0
                            ? "font-semibold text-rose-600"
                            : undefined
                        }
                      >
                        {moneyText(row.money.remaining)}
                      </span>
                    ),
                  },
                ]
              : []),
          ]}
        />
      ) : null}

      {view === "owners" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Owner statements for the selected dates — useful before paying balances.
          </p>
          <ReportTable
            rows={ownerStats}
            empty="No lorry owners found."
            rowKey={(row) => row.key}
            columns={[
              {
                key: "owner",
                label: "Owner",
                cell: (row) => (
                  <div>
                    <p className="font-semibold">{row.ownerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.companyName || row.phoneNum || "—"}
                    </p>
                  </div>
                ),
              },
              {
                key: "fleet",
                label: "Fleet",
                cell: (row) => `${row.usedLorries}/${row.lorries || row.usedLorries} used`,
              },
              {
                key: "trips",
                label: "Trips",
                align: "right",
                cell: (row) => row.trips,
              },
              ...(money
                ? [
                    {
                      key: "total",
                      label: "Hire",
                      align: "right" as const,
                      cell: (row: (typeof ownerStats)[number]) =>
                        formatMoney(row.money.total),
                    },
                    {
                      key: "paid",
                      label: "Paid",
                      align: "right" as const,
                      cell: (row: (typeof ownerStats)[number]) =>
                        formatMoney(row.money.paid),
                    },
                    {
                      key: "remaining",
                      label: "Remaining",
                      align: "right" as const,
                      cell: (row: (typeof ownerStats)[number]) => (
                        <span
                          className={
                            row.money.remaining > 0
                              ? "font-semibold text-rose-600"
                              : "text-emerald-600"
                          }
                        >
                          {formatMoney(row.money.remaining)}
                        </span>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ) : null}

      {view === "idle" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Vehicles with no containers in the selected date range.
          </p>
          <ReportTable
            rows={idle}
            empty="Every registered lorry has trips in this range."
            rowKey={(row) => row.key}
            columns={[
              {
                key: "lorry",
                label: "Lorry",
                cell: (row) => <span className="font-semibold">{row.lorryNum}</span>,
              },
              {
                key: "capacity",
                label: "Capacity",
                cell: (row) => (row.capacity ? `${row.capacity} ft` : "—"),
              },
              {
                key: "owner",
                label: "Owner",
                cell: (row) => row.ownerName || "—",
              },
              {
                key: "company",
                label: "Company",
                cell: (row) => row.companyName || "—",
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
