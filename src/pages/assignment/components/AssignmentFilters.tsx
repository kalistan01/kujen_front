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
  destination = [],
  onDestinationChange,
  destinations = [],
  buyer = [],
  onBuyerChange,
  buyers = [],
  containerOut = [],
  onContainerOutChange,
  billNumber = "",
  onBillNumberChange,
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
  destination?: string[];
  onDestinationChange?: (value: string[]) => void;
  destinations?: { value: string; label: string }[];
  buyer?: string[];
  onBuyerChange?: (value: string[]) => void;
  buyers?: { value: string; label: string }[];
  containerOut?: string[];
  onContainerOutChange?: (value: string[]) => void;
  billNumber?: string;
  onBillNumberChange?: (value: string) => void;
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
      {onBuyerChange ? (
        <MultiFilter
          value={buyer}
          onChange={onBuyerChange}
          options={buyers}
          allLabel="All buyers"
          noun="buyer"
          searchPlaceholder="Search buyer"
          emptyText="No buyer found."
          widthClass="w-[170px]"
        />
      ) : null}
      {onContainerOutChange ? (
        <MultiFilter
          value={containerOut}
          onChange={onContainerOutChange}
          options={[
            { value: "RCT", label: "RCT" },
            { value: "OUT PASS", label: "OUT PASS" },
            { value: "SCAN", label: "SCAN" },
            { value: "YARD", label: "YARD" },
          ]}
          allLabel="All container out"
          noun="container out"
          plural="container out"
          searchPlaceholder="Search container out"
          emptyText="No container out found."
          widthClass="w-[180px]"
        />
      ) : null}
      {onBillNumberChange ? (
        <Input
          value={billNumber}
          onChange={(e) => onBillNumberChange(e.target.value)}
          placeholder="Bill number"
          aria-label="Bill number"
          className="h-8 w-[150px] shrink-0 bg-background"
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

function multiFilterLabel(
  value: string[],
  options: { value: string; label: string }[],
  allLabel: string,
  noun: string,
  plural = `${noun}s`
) {
  if (value.length === 0) return allLabel;
  if (value.length === 1) {
    return (
      options.find((item) => item.value === value[0])?.label || `1 ${noun}`
    );
  }
  return `${value.length} ${plural}`;
}

function MultiFilter({
  value,
  onChange,
  options,
  allLabel,
  noun,
  plural,
  searchPlaceholder,
  emptyText,
  widthClass,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
  allLabel: string;
  noun: string;
  plural?: string;
  searchPlaceholder: string;
  emptyText: string;
  widthClass: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = multiFilterLabel(value, options, allLabel, noun, plural);

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-8 shrink-0 justify-between bg-background px-2.5 text-xs font-normal",
            widthClass
          )}
        >
          <span className="truncate">{selected}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-8 text-xs"
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              <CommandItem value={allLabel} onSelect={() => onChange([])}>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.length === 0 ? "opacity-100" : "opacity-0"
                  )}
                />
                {allLabel}
              </CommandItem>
              {options.map((item) => {
                const checked = value.includes(item.value);
                return (
                  <CommandItem
                    key={item.value}
                    value={`${item.label} ${item.value}`}
                    onSelect={() => toggle(item.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        checked ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DestinationFilter({
  value,
  onChange,
  destinations,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  destinations: { value: string; label: string }[];
}) {
  return (
    <MultiFilter
      value={value}
      onChange={onChange}
      options={destinations}
      allLabel="All destinations"
      noun="destination"
      searchPlaceholder="Search destination"
      emptyText="No destination found."
      widthClass="w-[190px]"
    />
  );
}

export default AssignmentFilters;
