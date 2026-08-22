import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import type { ReactNode } from "react";

const DEFAULT_STATUSES = [
  { value: "all", label: "All status" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

function AssignmentFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  hasFilters,
  onClear,
  placeholder = "Search BL, item, exporter...",
  statuses = DEFAULT_STATUSES,
  balanceFilter = "all",
  onBalanceFilterChange,
  advancedFilter = "all",
  onAdvancedFilterChange,
  owner = "all",
  onOwnerChange,
  owners = [],
  destination = "all",
  onDestinationChange,
  destinations = [],
  className,
  children,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  hasFilters: boolean;
  onClear: () => void;
  placeholder?: string;
  statuses?: { value: string; label: string }[];
  balanceFilter?: string;
  onBalanceFilterChange?: (value: string) => void;
  advancedFilter?: string;
  onAdvancedFilterChange?: (value: string) => void;
  owner?: string;
  onOwnerChange?: (value: string) => void;
  owners?: { value: string; label: string }[];
  destination?: string;
  onDestinationChange?: (value: string) => void;
  destinations?: { value: string; label: string }[];
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-1 flex-wrap items-center gap-2", className)}>
      <div className="relative min-w-[160px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="h-8 bg-background pl-9"
        />
      </div>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 w-[130px] bg-background">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={fromDate}
        onChange={(e) => onFromDateChange(e.target.value)}
        className="h-8 w-[132px] bg-background"
        aria-label="From date"
      />
      <Input
        type="date"
        value={toDate}
        onChange={(e) => onToDateChange(e.target.value)}
        className="h-8 w-[132px] bg-background"
        aria-label="To date"
      />
      {onBalanceFilterChange ? (
        <Select value={balanceFilter} onValueChange={onBalanceFilterChange}>
          <SelectTrigger className="h-8 w-[140px] bg-background">
            <SelectValue placeholder="Balance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All balances</SelectItem>
            <SelectItem value="unpaid">Balance unpaid</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
      {onAdvancedFilterChange ? (
        <Select value={advancedFilter} onValueChange={onAdvancedFilterChange}>
          <SelectTrigger className="h-8 w-[140px] bg-background">
            <SelectValue placeholder="Advanced" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All advanced</SelectItem>
            <SelectItem value="yes">Has advanced</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
      {onOwnerChange ? (
        <Select value={owner} onValueChange={onOwnerChange}>
          <SelectTrigger className="h-8 w-[160px] bg-background">
            <SelectValue placeholder="Lorry owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All owners</SelectItem>
            {owners.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {onDestinationChange ? (
        <Select value={destination} onValueChange={onDestinationChange}>
          <SelectTrigger className="h-8 w-[170px] bg-background">
            <SelectValue placeholder="Destination" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All destinations</SelectItem>
            {destinations.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground"
          onClick={onClear}
        >
          Clear
        </Button>
      )}
      {children}
    </div>
  );
}

export default AssignmentFilters;
