import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StatusBadge } from "@/components/StatusBadge";
import { brandFile } from "@/lib/brand";
import { cn } from "@/lib/utils";
import {
  containerDestination,
  containerLorry,
  containerMatchesOwner,
  containerMoney,
  containerOwner,
} from "@/pages/assignment/lib/containerDisplay";
import { formatDate } from "@/pages/assignment/lib/dates";
import { formatMoney } from "@/pages/assignment/lib/financials";
import {
  addMoney,
  byOwner,
  downloadCsv,
  emptyMoney,
  handlePrint,
  idOf,
  moneyText,
  rowDate,
  showMoney,
  type ContainerRow,
} from "./lib";
import { KpiCard, ReportActions, ReportTable, type ReportColumn } from "./shared";

function ownerLabel(owner: any) {
  const name = String(owner?.ownerName || "").trim();
  const company = String(owner?.companyName || "").trim();
  if (name && company) return `${name} · ${company}`;
  return name || company || "Unknown owner";
}

function OwnerMultiFilter({
  value,
  onChange,
  options,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const label =
    value.length === 0
      ? "All owners"
      : value.length === 1
        ? options.find((item) => item.value === value[0])?.label || "1 owner"
        : `${value.length} owners`;

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-8 w-[220px] justify-between bg-background px-2.5 text-xs font-normal"
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search owner" className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty>No owner found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="All owners" onSelect={() => onChange([])}>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.length === 0 ? "opacity-100" : "opacity-0"
                  )}
                />
                All owners
              </CommandItem>
              {options.map((item) => {
                const checked = value.includes(item.value);
                return (
                  <CommandItem
                    key={item.value}
                    value={`${item.label} ${item.value}`}
                    onSelect={() => toggle(item.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        checked ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function LorryOwnerReports({
  owners,
  rows,
  query = "",
  selectedOwnerIds,
  onSelectedOwnerIdsChange,
}: {
  owners: any[];
  rows: ContainerRow[];
  query?: string;
  selectedOwnerIds: string[];
  onSelectedOwnerIdsChange: (value: string[]) => void;
}) {
  const money = showMoney();
  const ownerOptions = useMemo(
    () =>
      owners
        .map((owner) => ({
          value: idOf(owner),
          label: ownerLabel(owner),
        }))
        .filter((item) => item.value)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [owners]
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (selectedOwnerIds.length) {
        const matched = selectedOwnerIds.some((ownerId) =>
          containerMatchesOwner(row.container, ownerId)
        );
        if (!matched) return false;
      }
      if (!q) return true;
      const hay = [
        row.assignment?.blNo,
        row.container?.containerNo,
        containerLorry(row.container),
        containerOwner(row.container),
        containerDestination(row.container),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, selectedOwnerIds, query]);

  const detailRows = useMemo(
    () =>
      [...filteredRows].sort((a, b) => {
        const da = String(rowDate(a) || "");
        const db = String(rowDate(b) || "");
        if (da !== db) return db.localeCompare(da);
        return String(a.assignment?.blNo || "").localeCompare(
          String(b.assignment?.blNo || "")
        );
      }),
    [filteredRows]
  );

  const scopedOwners = useMemo(() => {
    if (!selectedOwnerIds.length) return owners;
    const selected = new Set(selectedOwnerIds);
    return owners.filter((owner) => selected.has(idOf(owner)));
  }, [owners, selectedOwnerIds]);

  const ownerTotals = useMemo(() => {
    const stats = byOwner(scopedOwners, filteredRows);
    if (!selectedOwnerIds.length) {
      return stats.filter((item) => item.trips > 0);
    }
    const selected = new Set(selectedOwnerIds);
    return stats.filter((item) => selected.has(item.key));
  }, [scopedOwners, filteredRows, selectedOwnerIds]);

  const overall = useMemo(() => {
    const totals = emptyMoney();
    filteredRows.forEach((row) => addMoney(totals, row.container));
    return totals;
  }, [filteredRows]);

  const hasOwnerFilter = selectedOwnerIds.length > 0;
  const showOwnerColumn = selectedOwnerIds.length !== 1;
  const showOwnerTotals = hasOwnerFilter && ownerTotals.length > 0;

  const columns: ReportColumn<ContainerRow>[] = [
    {
      key: "date",
      label: "Date",
      cell: (row) => formatDate(rowDate(row)) || "—",
      csv: (row) => formatDate(rowDate(row)) || "",
    },
    {
      key: "bl",
      label: "BL No",
      cell: (row) => {
        const id = idOf(row.assignment);
        const bl = row.assignment?.blNo || "—";
        return id ? (
          <Link
            to={`/assignment/${id}`}
            className="font-medium text-[hsl(var(--brand-navy))] underline-offset-2 hover:underline"
          >
            {bl}
          </Link>
        ) : (
          bl
        );
      },
      csv: (row) => row.assignment?.blNo || "",
    },
    {
      key: "container",
      label: "Container",
      cell: (row) => row.container?.containerNo || "—",
      csv: (row) => row.container?.containerNo || "",
    },
    {
      key: "lorry",
      label: "Lorry",
      cell: (row) => containerLorry(row.container) || "—",
      csv: (row) => containerLorry(row.container) || "",
    },
    ...(showOwnerColumn
      ? ([
          {
            key: "owner",
            label: "Owner",
            cell: (row: ContainerRow) => containerOwner(row.container) || "—",
            csv: (row: ContainerRow) => containerOwner(row.container) || "",
          },
        ] as ReportColumn<ContainerRow>[])
      : []),
    {
      key: "destination",
      label: "Destination",
      cell: (row) => containerDestination(row.container) || "—",
      csv: (row) => containerDestination(row.container) || "",
    },
    {
      key: "status",
      label: "Status",
      cell: (row) => <StatusBadge status={row.container?.status || "pending"} />,
      csv: (row) => row.container?.status || "pending",
    },
    ...(money
      ? ([
          {
            key: "hire",
            label: "Hire",
            align: "right" as const,
            cell: (row: ContainerRow) =>
              formatMoney(containerMoney(row.container).total),
            csv: (row: ContainerRow) => containerMoney(row.container).total,
          },
          {
            key: "paid",
            label: "Paid",
            align: "right" as const,
            cell: (row: ContainerRow) =>
              formatMoney(containerMoney(row.container).paid),
            csv: (row: ContainerRow) => containerMoney(row.container).paid,
          },
          {
            key: "remaining",
            label: "Remaining",
            align: "right" as const,
            cell: (row: ContainerRow) =>
              formatMoney(containerMoney(row.container).balance),
            csv: (row: ContainerRow) => containerMoney(row.container).balance,
          },
        ] as ReportColumn<ContainerRow>[])
      : []),
  ];

  const exportCsv = () => {
    downloadCsv(
      brandFile("Lorry-Owner-Report"),
      columns.map((column) => column.label),
      detailRows.map((row) =>
        columns.map((column) =>
          column.csv ? column.csv(row) : String(column.cell(row) ?? "")
        )
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <OwnerMultiFilter
            value={selectedOwnerIds}
            onChange={onSelectedOwnerIdsChange}
            options={ownerOptions}
          />
          {hasOwnerFilter ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => onSelectedOwnerIdsChange([])}
            >
              Clear owners
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{detailRows.length} trips</Badge>
          <ReportActions
            onPrint={() => handlePrint(brandFile("Lorry-Owner-Report"))}
            onCsv={exportCsv}
          />
        </div>
      </div>

      {money ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="Hire total" value={formatMoney(overall.total)} />
          <KpiCard
            label="Paid"
            value={formatMoney(overall.paid)}
            tone="text-emerald-600"
          />
          <KpiCard
            label="Remaining"
            value={formatMoney(overall.remaining)}
            tone={
              overall.remaining > 0 ? "text-rose-600" : "text-emerald-600"
            }
          />
        </div>
      ) : null}

      {showOwnerTotals ? (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Totals by owner</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ReportTable
              rows={ownerTotals}
              empty="No owner totals for this filter."
              pageSize={20}
              rowKey={(row) => row.key}
              columns={[
                {
                  key: "owner",
                  label: "Owner",
                  cell: (row) => (
                    <div>
                      <p className="font-medium">{row.ownerName || "—"}</p>
                      {row.companyName ? (
                        <p className="text-xs text-muted-foreground">
                          {row.companyName}
                        </p>
                      ) : null}
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
                  key: "lorries",
                  label: "Lorries used",
                  align: "right",
                  cell: (row) => `${row.usedLorries}/${row.lorries}`,
                },
                ...(money
                  ? ([
                      {
                        key: "total",
                        label: "Hire",
                        align: "right" as const,
                        cell: (row: (typeof ownerTotals)[number]) =>
                          moneyText(row.money.total),
                      },
                      {
                        key: "paid",
                        label: "Paid",
                        align: "right" as const,
                        cell: (row: (typeof ownerTotals)[number]) =>
                          moneyText(row.money.paid),
                      },
                      {
                        key: "remaining",
                        label: "Remaining",
                        align: "right" as const,
                        cell: (row: (typeof ownerTotals)[number]) =>
                          moneyText(row.money.remaining),
                      },
                    ] as ReportColumn<(typeof ownerTotals)[number]>[])
                  : []),
              ]}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Owner trip report</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <ReportTable
            rows={detailRows}
            empty="No trips match these owner and date filters."
            pageSize={12}
            rowKey={(row, index) =>
              `${idOf(row.assignment)}-${idOf(row.container) || index}`
            }
            columns={columns}
          />
        </CardContent>
      </Card>
    </div>
  );
}
