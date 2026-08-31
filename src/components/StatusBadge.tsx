import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  pending:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
  "in-progress":
    "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/25",
  completed:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
  advanced:
    "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/25",
  received:
    "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25",
  submitted:
    "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/25",
  "payment-received":
    "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/25",
  active:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
  inactive:
    "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/25",
};

interface StatusBadgeProps {
  status?: string | boolean | null;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label: customLabel, className }: StatusBadgeProps) {
  const key =
    typeof status === "boolean"
      ? status
        ? "active"
        : "inactive"
      : (status || "unknown").toLowerCase();
  const label =
    customLabel ||
    (typeof status === "boolean"
      ? status
        ? "Active"
        : "Inactive"
      : (status || "Unknown").replace(/-/g, " "));

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
