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

export type BuyerOption = {
  _id: string;
  name: string;
  address?: string;
};

export function buyerId(value: string | { _id?: string } | undefined) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || "";
}

function labelOf(buyer: BuyerOption) {
  return buyer.name || buyer._id;
}

function stopScrollLock(event: React.WheelEvent | React.TouchEvent) {
  event.stopPropagation();
}

function BuyerSelect({
  buyers,
  value,
  onChange,
}: {
  buyers: BuyerOption[];
  value?: string | { _id?: string };
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedId = buyerId(value);
  const selected = buyers.find((buyer) => buyer._id === selectedId);
  const queryLower = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      buyers.filter((buyer) => {
        const haystack = `${buyer.name || ""} ${buyer.address || ""}`.toLowerCase();
        return haystack.includes(queryLower);
      }),
    [buyers, queryLower]
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
          className="h-10 w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? labelOf(selected) : "Select buyer"}
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
            placeholder="Search buyer name"
            className="h-9"
          />
        </div>
        <div
          className="max-h-60 overflow-y-auto overscroll-contain p-1"
          onWheel={stopScrollLock}
          onTouchMove={stopScrollLock}
        >
          <button
            type="button"
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              onChange("");
              setOpen(false);
              setSearch("");
            }}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4 shrink-0",
                !selectedId ? "opacity-100" : "opacity-0"
              )}
            />
            <span>No buyer</span>
          </button>
          {filtered.length ? (
            filtered.map((buyer) => (
              <button
                key={buyer._id}
                type="button"
                className={cn(
                  "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                  selectedId === buyer._id ? "bg-accent" : ""
                )}
                onClick={() => {
                  onChange(buyer._id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    selectedId === buyer._id ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">{labelOf(buyer)}</span>
              </button>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No buyer found.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default BuyerSelect;
