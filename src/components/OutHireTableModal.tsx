import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search, Table2 } from "lucide-react";
import baseUrl from "@/api/baseUrl";
import { getApiErrorMessage } from "@/lib/apiError";
import { useToast } from "@/hooks/use-toast";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";
import { asList } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime, type OutHire } from "@/pages/outhire/AddOutHire";

const formatAmount = (value?: number) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDistance = (value?: number) =>
  `${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })} km`;

export function OutHireTableModal() {
  const [open, setOpen] = useState(false);
  const [outHires, setOutHires] = useState<OutHire[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    baseUrl
      .get("/outhire")
      .then((response) => {
        setOutHires(asList<OutHire>(response.data?.data));
      })
      .catch((error) => {
        setOutHires([]);
        toast({
          title: "Unable to load out hires",
          description: getApiErrorMessage(
            error,
            "Could not load out hires. Please try again."
          ),
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [open, toast]);

  useEntitySync("outhire", (payload) => {
    if (!open) return;
    setOutHires((prev) => upsertById(prev, payload));
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const activeFirst = [...outHires].sort((a, b) => {
      if (Boolean(a.status) === Boolean(b.status)) return 0;
      return a.status ? -1 : 1;
    });
    if (!q) return activeFirst;
    return activeFirst.filter((item) =>
      [
        item.location,
        String(item.distanceKm ?? ""),
        String(item.amount ?? ""),
        item.status ? "active" : "inactive",
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [outHires, query]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs font-medium"
          title="Out Hires table"
        >
          <Table2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Out Hires</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="space-y-3 border-b border-border px-5 py-4 text-left">
          <div className="flex items-center justify-between gap-3 pr-6">
            <DialogTitle className="text-base font-semibold">
              Out Hires
            </DialogTitle>
            <Badge variant="secondary">{filtered.length}</Badge>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search location, distance, amount..."
              className="h-9 pl-9"
            />
          </div>
        </DialogHeader>

        {/* ~25 rows visible, then scroll */}
        <div className="min-h-0 max-h-[min(70vh,calc(2.5rem+25*3.25rem))] flex-1 overflow-auto">
          {loading ? (
            <div className="space-y-3 px-5 py-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <MapPin className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No out hires found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add rates on the Out Hires page to see them here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead>Location</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item, i) => (
                  <TableRow key={item._id || i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <span className="font-semibold">{item.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDistance(item.distanceKm)}</TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(item.amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(item.updatedAt || item.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={Boolean(item.status)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
