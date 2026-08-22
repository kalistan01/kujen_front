import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import { cn } from "@/lib/utils";

export type DestinationOption = {
  _id: string;
  type: string;
  location: string;
};

function labelOf(dest: DestinationOption) {
  return `${dest.type} - ${dest.location}`;
}

function destinationId(value: string | { _id?: string } | undefined) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || "";
}

function DestinationSelect({
  destinations,
  value,
  onChange,
  onCreated,
}: {
  destinations: DestinationOption[];
  value?: string | { _id?: string };
  onChange: (id: string) => void;
  onCreated: (dest: DestinationOption) => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedId = destinationId(value);
  const selected = destinations.find((dest) => dest._id === selectedId);
  const query = search.trim();
  const queryLower = query.toLowerCase();

  const filtered = useMemo(
    () =>
      destinations.filter((dest) =>
        labelOf(dest).toLowerCase().includes(queryLower)
      ),
    [destinations, queryLower]
  );

  const exactMatch = destinations.some(
    (dest) => dest.location.trim().toLowerCase() === queryLower
  );

  const addManual = async () => {
    if (!query || exactMatch || saving) return;

    const existing = destinations.find(
      (dest) => dest.location.trim().toLowerCase() === queryLower
    );
    if (existing) {
      onChange(existing._id);
      setOpen(false);
      setSearch("");
      return;
    }

    setSaving(true);
    try {
      const response = await baseUrl.post("/destination", {
        type: "Other",
        location: query,
      });
      const created = response.data.data as DestinationOption;
      onCreated(created);
      onChange(created._id);
      setOpen(false);
      setSearch("");
    } catch (error: unknown) {
      toast({
        title: "Could not add destination",
        description: getApiErrorMessage(
          error,
          "Could not add the destination. Please try again."
        ),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? labelOf(selected) : "Select or type destination"}
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
            placeholder="Search or add destination"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No destination found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((dest) => (
                <CommandItem
                  key={dest._id}
                  value={dest._id}
                  onSelect={() => {
                    onChange(dest._id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedId === dest._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {labelOf(dest)}
                </CommandItem>
              ))}
              {query && !exactMatch ? (
                <CommandItem
                  value={`add-${query}`}
                  disabled={saving}
                  onSelect={addManual}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add “{query}”
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default DestinationSelect;
