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
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="min-w-[88px] text-center text-sm text-muted-foreground">
          Page {current} of {safePages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          disabled={current >= safePages}
          onClick={() => onPageChange(current + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default TablePagination;
