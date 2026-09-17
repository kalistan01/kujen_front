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
import { ChevronDown, ClipboardList, Package } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import TablePagination from "@/components/TablePagination";
import { canSeeField } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  containerCapacity,
  containerDestination,
  containerIsToYard,
  containerLorry,
  containerMoney,
  containerOwner,
  visibleChargeColumns,
} from "../lib/containerDisplay";
import { formatDate } from "../lib/dates";
import { assignmentFclStatus } from "../lib/fcl";
import { formatMoney } from "../lib/financials";
import FclStatusBadge from "./FclStatusBadge";

const COLUMN_COUNT = 10;

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
  siblings = [],
  selected,
  onSelect,
}: {
  container: any;
  siblings?: any[];
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
        <p className="text-xs text-muted-foreground">
          VOC {container?.vocNo || "—"}
        </p>
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
      <td className="px-3 py-2.5">
        {containerIsToYard(container, siblings) ? (
          <span className="inline-flex rounded-full bg-[hsl(var(--brand-navy))] px-2.5 py-0.5 text-xs font-semibold text-white">
            Yes
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No</span>
        )}
      </td>
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
          {field.key === "advanced" &&
          canSeeField("advancedDate") &&
          Number(container.advanced) > 0 &&
          container.advancedDate ? (
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
      <td className="px-3 py-2.5">
        <StatusBadge status={container?.status} />
      </td>
      <td className="px-3 py-2.5 last:pr-4">
        <FclStatusBadge fcl={container?.fcl} />
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
  const containerCount = assignment.containerCount ?? containers.length;
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
      <TableRow
        className="cursor-pointer"
        onClick={() => onView(assignment._id)}
      >
        <TableCell className="w-10 pr-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(event) => {
              event.stopPropagation();
              setOpen((value) => !value);
            }}
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
            {assignment.regNo || "—"}
          </span>
        </TableCell>
        <TableCell className="font-mono text-xs font-semibold">
          {assignment.blNo || "—"}
        </TableCell>
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {formatDate(assignment.cusdecDate)}
        </TableCell>
        <TableCell>
          <p className="max-w-[180px] truncate font-medium">
            {assignment.item || "—"}
          </p>
        </TableCell>
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {formatDate(assignment.fclDueDate)}
        </TableCell>
        <TableCell>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3.5 w-3.5 text-amber-600" />
            <span className="font-medium text-foreground">
              {containerCount}
            </span>
          </span>
        </TableCell>
        <TableCell className="max-w-[160px] truncate text-muted-foreground">
          {assignment.exporter || "—"}
        </TableCell>
        <TableCell>
          <StatusBadge status={assignment.status} />
        </TableCell>
        <TableCell>
          <StatusBadge status={assignmentFclStatus(containers)} />
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
                    Lorry
                  </th>
                  <th className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Destination
                  </th>
                  <th className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Yard
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
                  <th className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Status
                  </th>
                  <th className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground last:pr-4">
                    FCL Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {containers.map((container: any, index: number) => (
                  <ContainerDetailRow
                    key={container._id || index}
                    container={container}
                    siblings={containers}
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
  const location = useLocation();

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
              <TableHead>REG NO</TableHead>
              <TableHead>BL NO</TableHead>
              <TableHead>Cusdec Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>FCL Due Date</TableHead>
              <TableHead>Containers</TableHead>
              <TableHead>Exporter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>FCL Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment, index: number) => (
              <AssignmentRow
                key={assignment._id || index}
                assignment={assignment}
                onView={(id) =>
                  navigate(`/assignment/${id}`, {
                    state: { from: `${location.pathname}${location.search}` },
                  })
                }
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
