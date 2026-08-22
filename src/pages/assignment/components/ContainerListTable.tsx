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
import { ClipboardList, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import TablePagination from "@/components/TablePagination";
import { canSeeField } from "@/lib/permissions";
import { formatDate } from "../lib/dates";
import { formatMoney } from "../lib/financials";
import {
  containerCapacity,
  containerDestination,
  containerLorry,
  containerMoney,
  containerOwner,
  visibleChargeColumns,
} from "../lib/containerDisplay";

export type ContainerListRow = {
  assignment: any;
  container: any;
};

function ContainerEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/50" />
      <p className="font-medium">No containers found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasFilters
          ? "Try a different search or filter."
          : "Containers will appear here once assignments are created."}
      </p>
    </div>
  );
}

function ContainerRow({
  assignment,
  container,
  onView,
  canSelect,
  selected,
  onSelect,
}: {
  assignment: any;
  container: any;
  onView: (id: string) => void;
  canSelect?: boolean;
  selected?: boolean;
  onSelect?: (containerId: string, checked: boolean) => void;
}) {
  const chargeColumns = visibleChargeColumns();
  const { total, paid, balance } = containerMoney(container);
  const lorry = containerLorry(container);
  const capacity = containerCapacity(container);
  const owner = containerOwner(container);
  return (
    <TableRow data-state={selected ? "selected" : undefined}>
      {canSelect ? (
        <TableCell className="w-10 pr-0">
          {container?._id ? (
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) =>
                onSelect?.(container._id, Boolean(checked))
              }
              aria-label={`Select ${container.containerNo || "container"}`}
            />
          ) : null}
        </TableCell>
      ) : null}
      <TableCell>
        <span className="inline-flex rounded-md border border-[hsl(var(--brand-navy))]/15 bg-[hsl(var(--brand-navy))]/8 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-[hsl(var(--brand-navy))] dark:border-white/10 dark:bg-white/10 dark:text-white">
          {assignment.blNo || "—"}
        </span>
      </TableCell>
      <TableCell>
        <p className="font-mono text-xs font-semibold">
          {container?.containerNo || "—"}
        </p>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {container?.vocNo || "—"}
      </TableCell>
      <TableCell>
        <p className="font-medium">
          {lorry}
          {capacity ? ` · ${capacity} ft` : ""}
        </p>
        {owner ? (
          <p className="text-xs text-muted-foreground">
            {String(owner).toUpperCase()}
          </p>
        ) : null}
      </TableCell>
      <TableCell>{containerDestination(container)}</TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatDate(container?.loadingDate)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatDate(container?.demoundDate)}
      </TableCell>
      {chargeColumns.map((field) => (
        <TableCell key={field.key} className="whitespace-nowrap">
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
        </TableCell>
      ))}
      {canSeeField("totals") ? (
        <>
          <TableCell className="whitespace-nowrap font-semibold">
            {formatMoney(total)}
          </TableCell>
          <TableCell className="whitespace-nowrap font-semibold text-emerald-600">
            {formatMoney(paid)}
          </TableCell>
          <TableCell className="whitespace-nowrap font-bold">
            {formatMoney(balance)}
          </TableCell>
        </>
      ) : null}
      <TableCell>
        <StatusBadge status={container?.status} />
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
  );
}

function ContainerListTable({
  rows,
  total,
  hasFilters,
  page,
  pages,
  pageSize,
  onPageChange,
  canSelect = false,
  selectedIds = [],
  onSelect,
  onSelectPage,
}: {
  rows: ContainerListRow[];
  total: number;
  hasFilters: boolean;
  page: number;
  pages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  canSelect?: boolean;
  selectedIds?: string[];
  onSelect?: (containerId: string, checked: boolean) => void;
  onSelectPage?: (containerIds: string[], checked: boolean) => void;
}) {
  const navigate = useNavigate();
  const chargeColumns = visibleChargeColumns();
  const selectableIds = rows
    .filter((row) => row.container?._id)
    .map((row) => row.container._id as string);
  const selectedOnPage = selectableIds.filter((id) => selectedIds.includes(id));
  const allPageSelected =
    selectableIds.length > 0 && selectedOnPage.length === selectableIds.length;
  const somePageSelected =
    selectedOnPage.length > 0 && selectedOnPage.length < selectableIds.length;

  return (
    <>
      {total === 0 ? (
        <ContainerEmptyState hasFilters={hasFilters} />
      ) : (
        <Table className="[&_th]:h-8 [&_td]:py-1.5">
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              {canSelect ? (
                <TableHead className="w-10 pr-0">
                  {selectableIds.length ? (
                    <Checkbox
                      checked={
                        allPageSelected
                          ? true
                          : somePageSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={(checked) =>
                        onSelectPage?.(selectableIds, Boolean(checked))
                      }
                      aria-label="Select all containers on this page"
                    />
                  ) : (
                    <span className="sr-only">Select</span>
                  )}
                </TableHead>
              ) : null}
              <TableHead>BL Number</TableHead>
              <TableHead>Container</TableHead>
              <TableHead>VOC</TableHead>
              <TableHead>Lorry</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Loading</TableHead>
              <TableHead>Demount</TableHead>
              {chargeColumns.map((field) => (
                <TableHead key={field.key}>{field.label}</TableHead>
              ))}
              {canSeeField("totals") ? (
                <>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                </>
              ) : null}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <ContainerRow
                key={row.container?._id || `${row.assignment?._id}-${index}`}
                assignment={row.assignment}
                container={row.container}
                onView={(id) => navigate(`/assignment/${id}`)}
                canSelect={canSelect}
                selected={selectedIds.includes(row.container?._id)}
                onSelect={onSelect}
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

export default ContainerListTable;
