import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { canSeeField } from "@/lib/permissions";
import {
  containerDestination,
  containerLorry,
  containerMoney,
  containerOwner,
} from "@/pages/assignment/lib/containerDisplay";
import { formatDate } from "@/pages/assignment/lib/dates";
import { formatMoney, toAmount } from "@/pages/assignment/lib/financials";
import {
  assignmentOverview,
  byDestination,
  byExporter,
  byImporter,
  downloadCsv,
  handlePrint,
  heldUpRows,
  moneyText,
  monthlySeries,
  outstandingRows,
  showMoney,
  type ContainerRow,
} from "./lib";
import {
  KpiCard,
  ReportActions,
  ReportTable,
  SubNav,
} from "./shared";
import { brandFile } from "@/lib/brand";

const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "outstanding", label: "Outstanding" },
  { id: "destinations", label: "Destinations" },
  { id: "parties", label: "Exporters / Importers" },
  { id: "heldup", label: "Held up" },
  { id: "monthly", label: "Monthly" },
];

const monthChartConfig = {
  containers: { label: "Containers", color: "hsl(217 64% 36%)" },
  remaining: { label: "Remaining", color: "hsl(38 92% 50%)" },
} satisfies ChartConfig;

function printTitle(view: string) {
  return brandFile(`Assignment-${view}-Report`);
}

export function AssignmentReports({
  rows,
  view,
  onViewChange,
}: {
  rows: ContainerRow[];
  view: string;
  onViewChange: (value: string) => void;
}) {
  const overview = useMemo(() => assignmentOverview(rows), [rows]);
  const outstanding = useMemo(() => outstandingRows(rows), [rows]);
  const destinations = useMemo(() => byDestination(rows), [rows]);
  const exporters = useMemo(() => byExporter(rows), [rows]);
  const importers = useMemo(() => byImporter(rows), [rows]);
  const heldUp = useMemo(() => heldUpRows(rows), [rows]);
  const monthly = useMemo(() => monthlySeries(rows), [rows]);
  const money = showMoney();

  const exportCsv = () => {
    if (view === "outstanding") {
      downloadCsv(
        brandFile("Outstanding"),
        [
          "BL",
          "Container",
          "VOC",
          "Lorry",
          "Owner",
          "Destination",
          "Status",
          ...(money ? ["Total", "Paid", "Balance"] : []),
        ],
        outstanding.map((row) => {
          const item = containerMoney(row.container);
          return [
            row.assignment?.blNo || "",
            row.container?.containerNo || "",
            row.container?.vocNo || "",
            containerLorry(row.container),
            containerOwner(row.container) || "",
            containerDestination(row.container),
            row.container?.status || "",
            ...(money ? [item.total, item.paid, item.balance] : []),
          ];
        })
      );
      return;
    }
    if (view === "destinations") {
      downloadCsv(
        brandFile("Destinations"),
        [
          "Destination",
          "BLs",
          "Containers",
          ...(money ? ["Total", "Paid", "Remaining"] : []),
        ],
        destinations.map((item) => [
          item.label,
          item.assignments,
          item.containers,
          ...(money ? [item.money.total, item.money.paid, item.money.remaining] : []),
        ])
      );
      return;
    }
    if (view === "parties") {
      downloadCsv(
        brandFile("Exporters"),
        [
          "Exporter",
          "BLs",
          "Containers",
          ...(money ? ["Total", "Paid", "Remaining"] : []),
        ],
        exporters.map((item) => [
          item.label,
          item.assignments,
          item.containers,
          ...(money ? [item.money.total, item.money.paid, item.money.remaining] : []),
        ])
      );
      return;
    }
    if (view === "heldup") {
      downloadCsv(
        brandFile("HeldUp"),
        [
          "BL",
          "Container",
          "Lorry",
          "Loading",
          "Demount",
          "Extra days",
          ...(canSeeField("heldUp") ? ["Held up"] : []),
          "Status",
        ],
        heldUp.map((row) => [
          row.assignment?.blNo || "",
          row.container?.containerNo || "",
          containerLorry(row.container),
          formatDate(row.container?.loadingDate),
          formatDate(row.container?.demoundDate),
          row.extraDays,
          ...(canSeeField("heldUp") ? [row.heldUp] : []),
          row.container?.status || "",
        ])
      );
      return;
    }
    if (view === "monthly") {
      downloadCsv(
        brandFile("Monthly"),
        [
          "Month",
          "BLs",
          "Containers",
          ...(money ? ["Total", "Paid", "Remaining"] : []),
        ],
        monthly.map((item) => [
          item.label,
          item.assignments,
          item.containers,
          ...(money ? [item.total, item.paid, item.remaining] : []),
        ])
      );
      return;
    }
    downloadCsv(brandFile("Assignment-Overview"), ["Metric", "Value"], [
      ["Assignments", overview.assignments],
      ["Containers", overview.containers],
      ["Pending", overview.status.pending],
      ["In progress", overview.status["in-progress"]],
      ["Advanced", overview.status.advanced],
      ["Completed", overview.status.completed],
      ...(money
        ? [
            ["Total", overview.money.total],
            ["Paid", overview.money.paid],
            ["Remaining", overview.money.remaining],
            ...(canSeeField("heldUp")
              ? [["Held up", overview.money.heldUp]]
              : []),
          ]
        : []),
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SubNav items={VIEWS} value={view} onChange={onViewChange} />
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{rows.length} containers</Badge>
          <ReportActions
            onPrint={() => handlePrint(printTitle(view))}
            onCsv={exportCsv}
          />
        </div>
      </div>

      {view === "overview" ? (
        <OverviewView overview={overview} monthly={monthly} money={money} />
      ) : null}
      {view === "outstanding" ? (
        <OutstandingView rows={outstanding} />
      ) : null}
      {view === "destinations" ? (
        <GroupView
          title="By destination"
          empty="No destination activity in this range."
          groups={destinations}
        />
      ) : null}
      {view === "parties" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <GroupView
            title="By exporter"
            empty="No exporter activity in this range."
            groups={exporters}
          />
          <GroupView
            title="By importer"
            empty="No importer activity in this range."
            groups={importers}
          />
        </div>
      ) : null}
      {view === "heldup" ? <HeldUpView rows={heldUp} /> : null}
      {view === "monthly" ? (
        <MonthlyView monthly={monthly} money={money} />
      ) : null}
    </div>
  );
}

function OverviewView({
  overview,
  monthly,
  money,
}: {
  overview: ReturnType<typeof assignmentOverview>;
  monthly: ReturnType<typeof monthlySeries>;
  money: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Assignments"
          value={String(overview.assignments)}
          hint={`${overview.containers} containers`}
        />
        <KpiCard
          label="In progress"
          value={String(
            overview.status["in-progress"] +
              overview.status.pending +
              overview.status.advanced
          )}
          hint={`${overview.status.completed} completed`}
          tone="text-amber-600"
        />
        {money ? (
          <>
            <KpiCard
              label="Hire total"
              value={formatMoney(overview.money.total)}
              hint={`${formatMoney(overview.money.paid)} paid`}
            />
            <KpiCard
              label="Remaining"
              value={formatMoney(overview.money.remaining)}
              hint={
                canSeeField("heldUp")
                  ? `${formatMoney(overview.money.heldUp)} held up`
                  : undefined
              }
              tone={
                overview.money.remaining > 0
                  ? "text-rose-600"
                  : "text-emerald-600"
              }
            />
          </>
        ) : (
          <>
            <KpiCard
              label="Pending"
              value={String(overview.status.pending)}
            />
            <KpiCard
              label="Advanced"
              value={String(overview.status.advanced)}
            />
            <KpiCard
              label="Completed"
              value={String(overview.status.completed)}
            />
          </>
        )}
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly containers</CardTitle>
        </CardHeader>
        <CardContent>
          {monthly.length ? (
            <ChartContainer config={monthChartConfig} className="h-64 w-full">
              <BarChart data={monthly} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="containers" fill="var(--color-containers)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No assignment activity in this range.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OutstandingView({ rows }: { rows: ContainerRow[] }) {
  const navigate = useNavigate();
  const remaining = rows.reduce(
    (sum, row) => sum + containerMoney(row.container).balance,
    0
  );
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Unpaid container balances, largest first.
        </p>
        {showMoney() ? (
          <p className="text-sm font-semibold">{formatMoney(remaining)} due</p>
        ) : null}
      </div>
      <ReportTable
        rows={rows}
        empty="No outstanding balances in this range."
        rowKey={(row) => String(row.container?._id || row.container?.containerNo)}
        columns={[
          {
            key: "bl",
            label: "BL",
            cell: (row) => (
              <button
                type="button"
                className="font-mono text-xs font-semibold hover:underline"
                onClick={() => navigate(`/assignment/${row.assignment?._id}`)}
              >
                {row.assignment?.blNo || "—"}
              </button>
            ),
          },
          {
            key: "container",
            label: "Container",
            cell: (row) => (
              <span className="font-mono text-xs font-semibold">
                {row.container?.containerNo || "—"}
              </span>
            ),
          },
          {
            key: "lorry",
            label: "Lorry / Owner",
            cell: (row) => (
              <div>
                <p className="text-sm font-medium">{containerLorry(row.container)}</p>
                <p className="text-xs text-muted-foreground">
                  {containerOwner(row.container) || "—"}
                </p>
              </div>
            ),
          },
          {
            key: "destination",
            label: "Destination",
            cell: (row) => containerDestination(row.container),
          },
          {
            key: "status",
            label: "Status",
            cell: (row) => <StatusBadge status={row.container?.status} />,
          },
          ...(showMoney()
            ? [
                {
                  key: "total",
                  label: "Total",
                  align: "right" as const,
                  cell: (row: ContainerRow) =>
                    formatMoney(containerMoney(row.container).total),
                },
                {
                  key: "paid",
                  label: "Paid",
                  align: "right" as const,
                  cell: (row: ContainerRow) =>
                    formatMoney(containerMoney(row.container).paid),
                },
                {
                  key: "balance",
                  label: "Balance",
                  align: "right" as const,
                  cell: (row: ContainerRow) => (
                    <span className="font-semibold text-rose-600">
                      {formatMoney(containerMoney(row.container).balance)}
                    </span>
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}

function GroupView({
  title,
  empty,
  groups,
}: {
  title: string;
  empty: string;
  groups: ReturnType<typeof byDestination>;
}) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ReportTable
          rows={groups}
          empty={empty}
          rowKey={(row) => row.key}
          columns={[
            {
              key: "name",
              label: title.replace("By ", ""),
              cell: (row) => <span className="font-medium">{row.label}</span>,
            },
            {
              key: "bls",
              label: "BLs",
              align: "right",
              cell: (row) => row.assignments,
            },
            {
              key: "containers",
              label: "Containers",
              align: "right",
              cell: (row) => row.containers,
            },
            ...(showMoney()
              ? [
                  {
                    key: "total",
                    label: "Total",
                    align: "right" as const,
                    cell: (row: (typeof groups)[number]) =>
                      formatMoney(row.money.total),
                  },
                  {
                    key: "remaining",
                    label: "Remaining",
                    align: "right" as const,
                    cell: (row: (typeof groups)[number]) => (
                      <span
                        className={
                          row.money.remaining > 0
                            ? "font-semibold text-rose-600"
                            : undefined
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
      </CardContent>
    </Card>
  );
}

function HeldUpView({
  rows,
}: {
  rows: Array<ContainerRow & { extraDays: number; heldUp: number }>;
}) {
  const navigate = useNavigate();
  const total = rows.reduce((sum, row) => sum + row.heldUp, 0);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Extra days between loading and demount, with held up charges.
        </p>
        {canSeeField("heldUp") ? (
          <p className="text-sm font-semibold">{formatMoney(total)}</p>
        ) : null}
      </div>
      <ReportTable
        rows={rows}
        empty="No held up charges in this range."
        rowKey={(row) => String(row.container?._id || row.container?.containerNo)}
        columns={[
          {
            key: "bl",
            label: "BL",
            cell: (row) => (
              <button
                type="button"
                className="font-mono text-xs font-semibold hover:underline"
                onClick={() => navigate(`/assignment/${row.assignment?._id}`)}
              >
                {row.assignment?.blNo || "—"}
              </button>
            ),
          },
          {
            key: "container",
            label: "Container",
            cell: (row) => (
              <span className="font-mono text-xs">{row.container?.containerNo || "—"}</span>
            ),
          },
          {
            key: "lorry",
            label: "Lorry",
            cell: (row) => containerLorry(row.container),
          },
          {
            key: "loading",
            label: "Loading",
            cell: (row) => formatDate(row.container?.loadingDate),
          },
          {
            key: "demount",
            label: "Demount",
            cell: (row) => formatDate(row.container?.demoundDate),
          },
          {
            key: "days",
            label: "Extra days",
            align: "right",
            cell: (row) => row.extraDays,
          },
          ...(canSeeField("heldUp")
            ? [
                {
                  key: "amount",
                  label: "Held up",
                  align: "right" as const,
                  cell: (row: (typeof rows)[number]) =>
                    formatMoney(toAmount(row.heldUp)),
                },
              ]
            : []),
          {
            key: "status",
            label: "Status",
            cell: (row) => <StatusBadge status={row.container?.status} />,
          },
        ]}
      />
    </div>
  );
}

function MonthlyView({
  monthly,
  money,
}: {
  monthly: ReturnType<typeof monthlySeries>;
  money: boolean;
}) {
  return (
    <div className="space-y-4">
      {monthly.length ? (
        <ChartContainer config={monthChartConfig} className="h-64 w-full">
          <BarChart data={monthly} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="containers" fill="var(--color-containers)" radius={4} />
          </BarChart>
        </ChartContainer>
      ) : null}
      <ReportTable
        rows={monthly}
        empty="No monthly activity in this range."
        rowKey={(row) => row.key}
        columns={[
          {
            key: "month",
            label: "Month",
            cell: (row) => <span className="font-medium">{row.label}</span>,
          },
          {
            key: "bls",
            label: "BLs",
            align: "right",
            cell: (row) => row.assignments,
          },
          {
            key: "containers",
            label: "Containers",
            align: "right",
            cell: (row) => row.containers,
          },
          ...(money
            ? [
                {
                  key: "total",
                  label: "Total",
                  align: "right" as const,
                  cell: (row: (typeof monthly)[number]) => formatMoney(row.total),
                },
                {
                  key: "paid",
                  label: "Paid",
                  align: "right" as const,
                  cell: (row: (typeof monthly)[number]) => formatMoney(row.paid),
                },
                {
                  key: "remaining",
                  label: "Remaining",
                  align: "right" as const,
                  cell: (row: (typeof monthly)[number]) => moneyText(row.remaining),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
