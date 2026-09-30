import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search } from "lucide-react";
import { useState, type ReactNode } from "react";

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
  showStatus = true,
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
  yardFilter = "all",
  onYardFilterChange,
  datePreset,
  onDatePresetChange,
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
  showStatus?: boolean;
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
  yardFilter?: string;
  onYardFilterChange?: (value: string) => void;
  datePreset?: string;
  onDatePresetChange?: (value: string) => void;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("flex w-full min-w-0 flex-wrap items-center gap-2", className)}>
      <div className="relative min-w-[200px] flex-1 basis-[220px] sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="h-8 bg-background pl-9"
        />
      </div>
      {showStatus ? (
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 w-[130px] shrink-0 bg-background">
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
      ) : null}
      {onDatePresetChange ? (
        <div className="inline-flex h-8 items-center rounded-md bg-muted p-1 text-muted-foreground">
          {(
            [
              ["all", "All"],
              ["today", "Today"],
              ["yesterday", "Yesterday"],
              ["tomorrow", "Tomorrow"],
              ["range", "Date wise"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={cn(
                "inline-flex h-6 items-center rounded-sm px-2.5 text-xs font-medium transition-all",
                datePreset === value
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:text-foreground"
              )}
              onClick={() => onDatePresetChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      {!onDatePresetChange || datePreset === "range" ? (
      <div className="flex shrink-0 items-center gap-1.5">
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          className="h-8 w-[140px] bg-background"
          aria-label="From date"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          className="h-8 w-[140px] bg-background"
          aria-label="To date"
        />
      </div>
      ) : null}
      {onBalanceFilterChange ? (
        <Select value={balanceFilter} onValueChange={onBalanceFilterChange}>
          <SelectTrigger className="h-8 w-[140px] shrink-0 bg-background">
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
          <SelectTrigger className="h-8 w-[140px] shrink-0 bg-background">
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
          <SelectTrigger className="h-8 w-[160px] shrink-0 bg-background">
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
        <DestinationFilter
          value={destination}
          onChange={onDestinationChange}
          destinations={destinations}
        />
      ) : null}
      {onYardFilterChange ? (
        <Select value={yardFilter} onValueChange={onYardFilterChange}>
          <SelectTrigger className="h-8 w-[140px] shrink-0 bg-background">
            <SelectValue placeholder="To yard" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All yard</SelectItem>
            <SelectItem value="yes">To yard</SelectItem>
            <SelectItem value="no">Not to yard</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 px-2 text-muted-foreground"
          onClick={onClear}
        >
          Clear
        </Button>
      )}
      {children}
    </div>
  );
}

function DestinationFilter({
  value,
  onChange,
  destinations,
}: {
  value: string;
  onChange: (value: string) => void;
  destinations: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selected =
    value === "all"
      ? "All destinations"
      : destinations.find((item) => item.value === value)?.label ||
        "All destinations";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-8 w-[170px] shrink-0 justify-between bg-background px-2.5 text-xs font-normal"
        >
          <span className="truncate">{selected}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search destination"
            className="h-8 text-xs"
          />
          <CommandList>
            <CommandEmpty>No destination found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="All destinations"
                onSelect={() => {
                  onChange("all");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === "all" ? "opacity-100" : "opacity-0"
                  )}
                />
                All destinations
              </CommandItem>
              {destinations.map((item) => (
                <CommandItem
                  key={item.value}
                  value={`${item.label} ${item.value}`}
                  onSelect={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default AssignmentFilters;
