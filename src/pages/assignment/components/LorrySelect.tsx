import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
    <Popover open={open} onOpenChange={setOpen} modal={false}>
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
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search lorry number or owner"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No lorry found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((lorry) => (
                <CommandItem
                  key={lorry._id}
                  value={lorry._id}
                  onSelect={() => {
                    onChange(lorry._id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedId === lorry._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {labelOf(lorry)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default LorrySelect;
