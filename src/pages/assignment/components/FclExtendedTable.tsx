import { ClipboardList } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePagination from "@/components/TablePagination";
import { calendarDaysBetween, formatDate } from "../lib/dates";

export type FclExtendedRow = {
  assignmentId: string;
  blNo?: string;
  fclDueDate?: string;
  containerId: string;
  containerNo?: string;
  vocNo?: string;
  fclExtendedDate?: string;
  lorryNum?: string;
  capacity?: number | string;
  ownerId?: string;
  ownerName?: string;
  destinationId?: string;
  destination?: string;
  yard?: boolean;
};

function FclExtendedTable({
  rows,
  total,
  hasFilters,
  loading,
  page,
  pages,
  pageSize,
  onPageChange,
}: {
  rows: FclExtendedRow[];
  total: number;
  hasFilters: boolean;
  loading?: boolean;
  page: number;
  pages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium">
            {loading ? "Loading FCL extended containers" : "No FCL extended containers"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? "Try a different search or filter."
              : loading
                ? "Fetching containers with an FCL extended date."
                : "Containers appear here after an FCL extended date is saved."}
          </p>
        </div>
      ) : (
        <Table className="[&_th]:h-8 [&_td]:py-1.5">
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead>BL NO</TableHead>
              <TableHead>Container</TableHead>
              <TableHead>Extended date</TableHead>
              <TableHead>FCL Due Date</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Lorry</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Yard</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const days = calendarDaysBetween(row.fclDueDate, row.fclExtendedDate);
              return (
                <TableRow
                  key={row.containerId}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate(`/assignment/${row.assignmentId}`, {
                      state: { from: `${location.pathname}${location.search}` },
                    })
                  }
                >
                  <TableCell>
                    <span className="inline-flex rounded-md border border-[hsl(var(--brand-navy))]/15 bg-[hsl(var(--brand-navy))]/8 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-[hsl(var(--brand-navy))] dark:border-white/10 dark:bg-white/10 dark:text-white">
                      {row.blNo || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="font-mono text-xs font-semibold">
                      {row.containerNo || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      VOC {row.vocNo || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(row.fclExtendedDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(row.fclDueDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-semibold">
                    {days == null
                      ? "—"
                      : `${days} ${Math.abs(days) === 1 ? "day" : "days"}`}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {row.lorryNum || "—"}
                      {row.capacity ? ` · ${row.capacity} ft` : ""}
                    </p>
                    {row.ownerName ? (
                      <p className="text-xs text-muted-foreground">
                        {String(row.ownerName).toUpperCase()}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{row.destination || "—"}</TableCell>
                  <TableCell>
                    {row.yard ? (
                      <span className="inline-flex rounded-full bg-[hsl(var(--brand-navy))] px-2.5 py-0.5 text-xs font-semibold text-white">
                        Yes
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
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

export default FclExtendedTable;
