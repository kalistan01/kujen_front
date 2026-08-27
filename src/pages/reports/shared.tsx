import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePagination from "@/components/TablePagination";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, Printer, Search } from "lucide-react";
import { datePresets } from "./lib";

export function KpiCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-2xl font-bold tracking-tight", tone)}>
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ReportSearch({
  value,
  onChange,
  placeholder = "Search BL, container, lorry, owner...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative min-w-[200px] flex-1 basis-[220px] sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 bg-background pl-9"
      />
    </div>
  );
}

export function DateRangeFilters({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClear,
}: {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onClear: () => void;
}) {
  const presets = datePresets();
  const active = presets.find(
    (item) => item.from === fromDate && item.to === toDate
  )?.id;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((preset) => (
        <Button
          key={preset.id}
          type="button"
          size="sm"
          variant={active === preset.id ? "secondary" : "outline"}
          className="h-8"
          onClick={() => {
            onFromDateChange(preset.from);
            onToDateChange(preset.to);
          }}
        >
          {preset.label}
        </Button>
      ))}
      <Input
        type="date"
        value={fromDate}
        onChange={(e) => onFromDateChange(e.target.value)}
        className="h-8 w-[140px] bg-background"
        aria-label="From date"
      />
      <span className="text-xs text-muted-foreground">–</span>
      <Input
        type="date"
        value={toDate}
        onChange={(e) => onToDateChange(e.target.value)}
        className="h-8 w-[140px] bg-background"
        aria-label="To date"
      />
      {fromDate || toDate ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={onClear}
        >
          Clear dates
        </Button>
      ) : null}
    </div>
  );
}

export function ReportActions({
  onPrint,
  onCsv,
  csvLabel = "CSV",
}: {
  onPrint?: () => void;
  onCsv?: () => void;
  csvLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {onPrint ? (
        <Button type="button" size="sm" variant="outline" className="h-8" onClick={onPrint}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
      ) : null}
      {onCsv ? (
        <Button type="button" size="sm" variant="outline" className="h-8" onClick={onCsv}>
          <FileSpreadsheet className="h-4 w-4" />
          {csvLabel}
        </Button>
      ) : null}
    </div>
  );
}

export type ReportColumn<T> = {
  key: string;
  label: string;
  className?: string;
  align?: "left" | "right";
  print?: boolean;
  cell: (row: T) => ReactNode;
  csv?: (row: T) => string | number;
};

export function ReportTable<T>({
  columns,
  rows,
  empty,
  pageSize = 12,
  rowKey,
}: {
  columns: ReportColumn<T>[];
  rows: T[];
  empty: string;
  pageSize?: number;
  rowKey: (row: T, index: number) => string;
}) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize) || 1);
  const current = Math.min(page, pages);
  const paged = useMemo(
    () => rows.slice((current - 1) * pageSize, current * pageSize),
    [rows, current, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [rows]);

  useEffect(() => {
    if (page !== current) setPage(current);
  }, [page, current]);

  if (!rows.length) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  const renderTable = (items: T[], extraClass?: string) => (
    <Table className={extraClass}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.key}
              className={cn(
                column.align === "right" && "text-right",
                column.className
              )}
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row, index) => (
          <TableRow key={rowKey(row, index)}>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                className={cn(
                  column.align === "right" && "text-right tabular-nums",
                  column.className
                )}
              >
                {column.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <>
      <div className="print:hidden">
        {renderTable(paged)}
        <TablePagination
          page={current}
          pages={pages}
          total={rows.length}
          limit={pageSize}
          onPageChange={setPage}
        />
      </div>
      <div className="hidden print:block">{renderTable(rows)}</div>
    </>
  );
}

export function SubNav({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "inline-flex h-7 items-center rounded-sm px-2.5 text-xs font-medium transition-all",
            value === item.id
              ? "bg-background text-foreground shadow-sm"
              : "hover:text-foreground"
          )}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
