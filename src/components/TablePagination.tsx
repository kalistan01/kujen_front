import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

function TablePagination({
  page,
  pages,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  if (total <= 0) return null;
  const safePages = Math.max(1, pages);
  const current = Math.min(Math.max(1, page), safePages);
  const from = (current - 1) * limit + 1;
  const to = Math.min(current * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-1.5">
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </Button>
        <span className="min-w-[80px] text-center text-xs text-muted-foreground">
          Page {current} of {safePages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7"
          disabled={current >= safePages}
          onClick={() => onPageChange(current + 1)}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default TablePagination;
