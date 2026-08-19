import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  pending:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
  "in-progress":
    "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/25",
  completed:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
  active:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
  inactive:
    "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/25",
};

interface StatusBadgeProps {
  status?: string | boolean | null;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key =
    typeof status === "boolean"
      ? status
        ? "active"
        : "inactive"
      : (status || "unknown").toLowerCase();
  const label =
    typeof status === "boolean"
      ? status
        ? "Active"
        : "Inactive"
      : (status || "Unknown").replace(/-/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        styles[key] ||
          "border-border bg-muted text-muted-foreground",
        className
      )}
    >
      {label}
    </span>
  );
}
