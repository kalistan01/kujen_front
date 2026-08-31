import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type LorryOption = {
  _id: string;
  lorryNum?: string;
  capacity?: number | string;
  owner?: {
    ownerName?: string;
    companyName?: string;
  };
};

function lorryId(value: string | { _id?: string } | undefined) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || "";
}

function labelOf(lorry: LorryOption) {
  const owner = lorry.owner?.ownerName || lorry.owner?.companyName || "";
  return [lorry.lorryNum, lorry.capacity, owner].filter(Boolean).join(" - ");
}

function stopScrollLock(event: React.WheelEvent | React.TouchEvent) {
  event.stopPropagation();
}

function LorrySelect({
  lorries,
  value,
  onChange,
  error,
}: {
  lorries: LorryOption[];
  value?: string | { _id?: string };
  onChange: (id: string) => void;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedId = lorryId(value);
  const selected = lorries.find((lorry) => lorry._id === selectedId);
  const queryLower = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      lorries.filter((lorry) =>
        labelOf(lorry).toLowerCase().includes(queryLower)
      ),
    [lorries, queryLower]
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
      modal
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 w-full justify-between font-normal",
            error ? "border-destructive" : ""
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? labelOf(selected) : "Select lorry"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[100] w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onWheel={stopScrollLock}
        onTouchMove={stopScrollLock}
      >
        <div className="border-b p-2">
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lorry number or owner"
            className="h-9"
          />
        </div>
        <div
          className="max-h-60 overflow-y-auto overscroll-contain p-1"
          onWheel={stopScrollLock}
          onTouchMove={stopScrollLock}
        >
          {filtered.length ? (
            filtered.map((lorry) => (
              <button
                key={lorry._id}
                type="button"
                className={cn(
                  "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                  selectedId === lorry._id ? "bg-accent" : ""
                )}
                onClick={() => {
                  onChange(lorry._id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    selectedId === lorry._id ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">{labelOf(lorry)}</span>
              </button>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No lorry found.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default LorrySelect;
