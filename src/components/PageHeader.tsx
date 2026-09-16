import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="max-w-xl text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
