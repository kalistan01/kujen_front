import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ClipboardList, Eye, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import TablePagination from "@/components/TablePagination";
import { canSeeField } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  containerCapacity,
  containerDestination,
  containerLorry,
  containerMoney,
  containerOwner,
  visibleChargeColumns,
} from "../lib/containerDisplay";
import { formatDate } from "../lib/dates";
import { formatMoney } from "../lib/financials";

const COLUMN_COUNT = 8;

function AssignmentEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <ClipboardList className="mb-2 h-8 w-8 text-muted-foreground/50" />
      <p className="font-medium">No assignments found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasFilters
          ? "Try a different search or filter."
          : "Create an assignment to start tracking shipments."}
      </p>
    </div>
  );
}

function ContainerDetailRow({
  container,
  selected,
  onSelect,
}: {
  container: any;
  selected?: boolean;
  onSelect?: (containerId: string, checked: boolean) => void;
}) {
  const chargeColumns = visibleChargeColumns();
  const { total, paid, balance } = containerMoney(container);
  const lorry = containerLorry(container);
  const capacity = containerCapacity(container);
  const owner = containerOwner(container);

  return (
    <tr
      className="border-t border-border/60"
      data-state={selected ? "selected" : undefined}
    >
      <td className="w-10 px-3 py-2.5 first:pl-4">
        {container?._id ? (
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) =>
              onSelect?.(container._id, Boolean(checked))
            }
            aria-label={`Select ${container.containerNo || "container"}`}
          />
        ) : null}
      </td>
      <td className="px-3 py-2.5">
        <p className="font-mono text-xs font-semibold">
          {container?.containerNo || "—"}
        </p>
      </td>
      <td className="px-3 py-2.5 text-muted-foreground">
        {container?.vocNo || "—"}
      </td>
      <td className="px-3 py-2.5">
        <p className="font-medium">
          {lorry}
          {capacity ? ` · ${capacity} ft` : ""}
        </p>
        {owner ? (
          <p className="text-xs text-muted-foreground">
            {String(owner).toUpperCase()}
          </p>
        ) : null}
      </td>
      <td className="px-3 py-2.5">{containerDestination(container)}</td>
      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
        {formatDate(container?.loadingDate)}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
        {formatDate(container?.demoundDate)}
      </td>
      {chargeColumns.map((field) => (
        <td key={field.key} className="whitespace-nowrap px-3 py-2.5">
          <p
            className={
              field.key === "advanced" || field.key === "balancePaid"
                ? "font-medium text-emerald-600"
                : "font-medium"
            }
          >
            {formatMoney(container[field.key])}
          </p>
          {field.key === "advanced" && canSeeField("advancedDate") ? (
            <p className="text-xs text-muted-foreground">
              {formatDate(container.advancedDate)}
            </p>
          ) : null}
          {field.key === "heldUp" && Number(container.heldUpExtraDays) > 0 ? (
            <p className="text-xs text-muted-foreground">
              {container.heldUpExtraDays} extra day
              {Number(container.heldUpExtraDays) === 1 ? "" : "s"} ×{" "}
              {formatMoney(container.heldUpRate)}
            </p>
          ) : null}
          {field.key === "balancePaid" &&
          container.balancePaid &&
          canSeeField("balanceDate") ? (
            <p className="text-xs text-muted-foreground">
              {formatDate(container.balanceDate)}
            </p>
          ) : null}
        </td>
      ))}
      {canSeeField("totals") ? (
        <>
          <td className="whitespace-nowrap px-3 py-2.5 font-semibold">
            {formatMoney(total)}
          </td>
          <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-emerald-600">
            {formatMoney(paid)}
          </td>
          <td className="whitespace-nowrap px-3 py-2.5 font-bold">
            {formatMoney(balance)}
          </td>
        </>
      ) : null}
      <td className="px-3 py-2.5 last:pr-4">
        <StatusBadge status={container?.status} />
      </td>
    </tr>
  );
}

function AssignmentRow({
  assignment,
  onView,
  selectedIds,
  onSelect,
  onSelectPage,
}: {
  assignment: any;
  onView: (id: string) => void;
  selectedIds: string[];
  onSelect?: (containerId: string, checked: boolean) => void;
  onSelectPage?: (containerIds: string[], checked: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const containers = assignment.containers || [];
  const selectableIds = containers
    .filter((container: any) => container?._id)
    .map((container: any) => container._id as string);
  const selectedInAssignment = selectableIds.filter((id: string) =>
    selectedIds.includes(id)
  );
  const allSelected =
    selectableIds.length > 0 &&
    selectedInAssignment.length === selectableIds.length;
  const someSelected =
    selectedInAssignment.length > 0 &&
    selectedInAssignment.length < selectableIds.length;

  return (
    <Fragment>
      <TableRow>
        <TableCell className="w-10 pr-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setOpen((value) => !value)}
            disabled={!containers.length}
            aria-expanded={open}
            aria-label={
              open ? "Hide container details" : "Show container details"
            }
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                open && "rotate-180"
              )}
            />
          </Button>
        </TableCell>
        <TableCell>
          <span className="inline-flex rounded-md border border-[hsl(var(--brand-navy))]/15 bg-[hsl(var(--brand-navy))]/8 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-[hsl(var(--brand-navy))] dark:border-white/10 dark:bg-white/10 dark:text-white">
            {assignment.blNo || "—"}
          </span>
        </TableCell>
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {formatDate(assignment.cusdecDate)}
        </TableCell>
        <TableCell>
          <p className="max-w-[180px] truncate font-medium">
            {assignment.item || "—"}
          </p>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Package className="h-3.5 w-3.5 text-amber-600" />
              <span className="font-medium text-foreground">
                {containers.length}
              </span>
            </span>
            {containers.slice(0, 2).map((c: any, i: number) => (
              <span
                key={c._id || i}
                className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] font-medium"
              >
                {c.containerNo}
              </span>
            ))}
            {containers.length > 2 && (
              <span className="text-[11px] text-muted-foreground">
                +{containers.length - 2}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="max-w-[160px] truncate text-muted-foreground">
          {assignment.exporter || "—"}
        </TableCell>
        <TableCell>
          <StatusBadge status={assignment.status} />
        </TableCell>
        <TableCell className="text-right">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onView(assignment._id)}
            className="h-8 w-8 text-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy))]/10 hover:text-[hsl(var(--brand-navy-muted))]"
            aria-label="View assignment"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
      {open ? (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={COLUMN_COUNT} className="bg-muted/20 p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/30 text-left">
                  <th className="h-10 w-10 px-3 first:pl-4">
                    {selectableIds.length ? (
                      <Checkbox
                        checked={
                          allSelected
                            ? true
                            : someSelected
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={(checked) =>
                          onSelectPage?.(selectableIds, Boolean(checked))
                        }
                        aria-label={`Select all containers on ${assignment.blNo || "assignment"}`}
                      />
                    ) : (
                      <span className="sr-only">Select</span>
                    )}
                  </th>
                  <th className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Container
                  </th>
                  <th className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    VOC
                  </th>
                  <th className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Lorry
                  </th>
                  <th className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Destination
                  </th>
                  <th className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Loading
                  </th>
                  <th className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Demount
                  </th>
                  {visibleChargeColumns().map((field) => (
                    <th
                      key={field.key}
                      className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                    >
                      {field.label}
                    </th>
                  ))}
                  {canSeeField("totals") ? (
                    <>
                      <th className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Total
                      </th>
                      <th className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Paid
                      </th>
                      <th className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Balance
                      </th>
                    </>
                  ) : null}
                  <th className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground last:pr-4">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {containers.map((container: any, index: number) => (
                  <ContainerDetailRow
                    key={container._id || index}
                    container={container}
                    selected={selectedIds.includes(container._id)}
                    onSelect={onSelect}
                  />
                ))}
              </tbody>
            </table>
          </TableCell>
        </TableRow>
      ) : null}
    </Fragment>
  );
}

function AssignmentTable({
  assignments,
  total,
  hasFilters,
  page,
  pages,
  pageSize,
  onPageChange,
  selectedIds = [],
  onSelect,
  onSelectPage,
}: {
  assignments: any[];
  total: number;
  hasFilters: boolean;
  page: number;
  pages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  selectedIds?: string[];
  onSelect?: (containerId: string, checked: boolean) => void;
  onSelectPage?: (containerIds: string[], checked: boolean) => void;
}) {
  const navigate = useNavigate();

  return (
    <>
      {total === 0 ? (
        <AssignmentEmptyState hasFilters={hasFilters} />
      ) : (
        <Table className="[&_th]:h-8 [&_td]:py-1.5">
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead className="w-10 pr-0">
                <span className="sr-only">Expand</span>
              </TableHead>
              <TableHead>BL Number</TableHead>
              <TableHead>Cusdec Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Containers</TableHead>
              <TableHead>Exporter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment, index: number) => (
              <AssignmentRow
                key={assignment._id || index}
                assignment={assignment}
                onView={(id) => navigate(`/assignment/${id}`)}
                selectedIds={selectedIds}
                onSelect={onSelect}
                onSelectPage={onSelectPage}
              />
            ))}
          </TableBody>
        </Table>
      )}
      <TablePagination
        page={page}
        pages={pages}
        total={total}
        limit={pageSize}
        onPageChange={onPageChange}
      />
    </>
  );
}

export default AssignmentTable;
