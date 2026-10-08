import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Check, ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";

function FilterField({
  label,
  stacked,
  wide,
  children,
}: {
  label: string;
  stacked: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  if (!stacked) return <>{children}</>;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", wide && "sm:col-span-2")}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

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
  onClearModal,
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
  showDates = true,
  filtersInModal = false,
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
  onClearModal?: () => void;
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
  showDates?: boolean;
  filtersInModal?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const modalFilterCount =
    (showStatus && status !== "all" ? 1 : 0) +
    (showDates && fromDate ? 1 : 0) +
    (showDates && toDate ? 1 : 0) +
    (onBalanceFilterChange && balanceFilter !== "all" ? 1 : 0) +
    (onAdvancedFilterChange && advancedFilter !== "all" ? 1 : 0) +
    (onOwnerChange && owner !== "all" ? 1 : 0) +
    (onDestinationChange && destination.length ? 1 : 0) +
    (onBuyerChange && buyer.length ? 1 : 0) +
    (onContainerOutChange && containerOut.length ? 1 : 0) +
    (onBillNumberChange && billNumber.trim() ? 1 : 0) +
    (onYardFilterChange && yardFilter !== "all" ? 1 : 0);
  const stacked = filtersInModal;
  const selectClass = (toolbarWidth: string) =>
    cn("bg-background", stacked ? "h-9 w-full" : cn("h-8 shrink-0", toolbarWidth));

  const filterFields = (
    <>
      {showStatus ? (
      <FilterField label="Status" stacked={stacked}>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className={selectClass("w-[130px]")}>
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
      </FilterField>
      ) : null}
      {showDates && onDatePresetChange ? (
        <FilterField label="Date" stacked={stacked} wide>
        <div className={cn(
          "inline-flex h-8 items-center rounded-md bg-muted p-1 text-muted-foreground",
          stacked && "h-9 w-full"
        )}>
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
        </FilterField>
      ) : null}
      {showDates && (!onDatePresetChange || datePreset === "range") ? (
      <FilterField label="Dates" stacked={stacked} wide>
      <div className={cn("flex items-center gap-1.5", stacked ? "w-full" : "shrink-0")}>
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          className={cn("bg-background", stacked ? "h-9 flex-1" : "h-8 w-[140px]")}
          aria-label="From date"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          className={cn("bg-background", stacked ? "h-9 flex-1" : "h-8 w-[140px]")}
          aria-label="To date"
        />
      </div>
      </FilterField>
      ) : null}
      {onBalanceFilterChange ? (
        <FilterField label="Balance" stacked={stacked}>
        <Select value={balanceFilter} onValueChange={onBalanceFilterChange}>
          <SelectTrigger className={selectClass("w-[140px]")}>
            <SelectValue placeholder="Balance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All balances</SelectItem>
            <SelectItem value="unpaid">Balance unpaid</SelectItem>
          </SelectContent>
        </Select>
        </FilterField>
      ) : null}
      {onAdvancedFilterChange ? (
        <FilterField label="Advanced" stacked={stacked}>
        <Select value={advancedFilter} onValueChange={onAdvancedFilterChange}>
          <SelectTrigger className={selectClass("w-[140px]")}>
            <SelectValue placeholder="Advanced" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All advanced</SelectItem>
            <SelectItem value="yes">Has advanced</SelectItem>
          </SelectContent>
        </Select>
        </FilterField>
      ) : null}
      {stacked && onOwnerChange ? (
        <p className="pt-1 text-sm font-semibold tracking-tight text-foreground sm:col-span-2">
          Parties
        </p>
      ) : null}
      {onOwnerChange ? (
        <FilterField label="Lorry owner" stacked={stacked}>
        <Select value={owner} onValueChange={onOwnerChange}>
          <SelectTrigger className={selectClass("w-[160px]")}>
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
        </FilterField>
      ) : null}
      {onDestinationChange ? (
        <FilterField label="Destination" stacked={stacked}>
        <DestinationFilter
          value={destination}
          onChange={onDestinationChange}
          destinations={destinations}
          widthClass={stacked ? "h-9 w-full text-sm" : "w-[190px]"}
        />
        </FilterField>
      ) : null}
      {onBuyerChange ? (
        <FilterField label="Buyer" stacked={stacked}>
        <MultiFilter
          value={buyer}
          onChange={onBuyerChange}
          options={buyers}
          allLabel="All buyers"
          noun="buyer"
          searchPlaceholder="Search buyer"
          emptyText="No buyer found."
          widthClass={stacked ? "h-9 w-full text-sm" : "w-[170px]"}
        />
        </FilterField>
      ) : null}
      {stacked && onContainerOutChange ? (
        <p className="pt-1 text-sm font-semibold tracking-tight text-foreground sm:col-span-2">
          Handling
        </p>
      ) : null}
      {onContainerOutChange ? (
        <FilterField label="Container out" stacked={stacked}>
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
          widthClass={stacked ? "h-9 w-full text-sm" : "w-[180px]"}
        />
        </FilterField>
      ) : null}
      {onBillNumberChange ? (
        <FilterField label="Bill number" stacked={stacked}>
        <Input
          value={billNumber}
          onChange={(e) => onBillNumberChange(e.target.value)}
          placeholder="Bill number"
          aria-label="Bill number"
          className={cn(
            "bg-background",
            stacked ? "h-9 w-full" : "h-8 w-[150px] shrink-0"
          )}
        />
        </FilterField>
      ) : null}
      {onYardFilterChange ? (
        <FilterField label="Yard" stacked={stacked}>
        <Select value={yardFilter} onValueChange={onYardFilterChange}>
          <SelectTrigger className={selectClass("w-[140px]")}>
            <SelectValue placeholder="To yard" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All yard</SelectItem>
            <SelectItem value="yes">To yard</SelectItem>
            <SelectItem value="no">Not to yard</SelectItem>
          </SelectContent>
        </Select>
        </FilterField>
      ) : null}
    </>
  );

  return (
    <div className={cn(
      "flex min-w-0 items-center gap-2",
      filtersInModal ? "w-auto shrink-0 flex-nowrap" : "w-full flex-wrap",
      className
    )}>
      <div className={cn(
        "relative",
        filtersInModal ? "w-[220px] shrink-0" : "min-w-[200px] flex-1 basis-[220px] sm:max-w-sm"
      )}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="h-8 bg-background pl-9"
        />
      </div>
      {filtersInModal ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {modalFilterCount ? ` (${modalFilterCount})` : ""}
            </Button>
          </DialogTrigger>
          <DialogContent className="gap-0 overflow-hidden border-border/80 p-0 shadow-2xl sm:max-w-[560px]">
            <DialogHeader className="space-y-1 border-b border-border bg-muted/30 px-5 py-4 pr-12">
              <DialogTitle>Filter containers</DialogTitle>
              <DialogDescription>
                Choose what to show for this assignment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid max-h-[min(70vh,520px)] grid-cols-1 gap-x-4 gap-y-3.5 overflow-y-auto px-5 py-4 sm:grid-cols-2">
              {filterFields}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-3">
              <p className="text-xs text-muted-foreground">
                {modalFilterCount
                  ? `${modalFilterCount} filter${modalFilterCount === 1 ? "" : "s"} selected`
                  : "No filters selected"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClearModal || onClear}
                  disabled={!modalFilterCount}
                >
                  Clear
                </Button>
                <DialogClose asChild>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
                  >
                    Done
                  </Button>
                </DialogClose>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        filterFields
      )}
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
  widthClass = "w-[190px]",
}: {
  value: string[];
  onChange: (value: string[]) => void;
  destinations: { value: string; label: string }[];
  widthClass?: string;
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
      widthClass={widthClass}
    />
  );
}

export default AssignmentFilters;
