import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CircleDollarSign, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import AddHeldUp, { type HeldUpRate } from "./AddHeldUp";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { can } from "@/lib/permissions";
import { P } from "@/lib/permissions";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";

const formatAmount = (value?: number) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value?: string) => {
  if (!value) return "—";
  const part = String(value).substring(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
    const [year, month, day] = part.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return part;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const HeldUpManagement = () => {
  const [heldUps, setHeldUps] = useState<HeldUpRate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    baseUrl
      .get("/heldup")
      .then((response) => {
        setHeldUps(response.data.data || []);
      })
      .catch((error) => {
        toast({
          title: "Unable to load held up rates",
          description: getApiErrorMessage(
            error,
            "Could not load held up rates. Please try again."
          ),
          variant: "destructive",
        });
      });
  }, []);

  useEntitySync("heldup", (payload) => {
    setHeldUps((prev) => {
      if (payload.action === "created" && payload.data) {
        return [
          payload.data,
          ...prev.map((item) => ({ ...item, status: false })),
        ];
      }
      return upsertById(prev, payload);
    });
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return heldUps;
    return heldUps.filter((item) =>
      [String(item.amount ?? ""), formatDate(item.date), item.status ? "active" : "inactive"]
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [heldUps, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search held up..."
            className="h-10 pl-9"
          />
        </div>
        {can(P.DESTINATIONS_MANAGE) ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]">
                <Plus className="h-4 w-4" />
                Add Held Up
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Held Up</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Add a held up amount. The current rate will be disabled.
                </p>
              </DialogHeader>
              <AddHeldUp
                heldUps={heldUps}
                setHeldUps={setHeldUps}
                setIsDialogOpen={setIsDialogOpen}
              />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-muted/30 py-4">
          <CardTitle className="flex items-center justify-between text-base font-semibold">
            <span>Held Up Rates</span>
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <CircleDollarSign className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No held up rates found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a held up amount to set the current rate.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead>Amount</TableHead>
                  <TableHead>Since Applied</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item, i) => (
                  <TableRow key={item._id || i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                          <CircleDollarSign className="h-4 w-4" />
                        </span>
                        <span className="font-semibold">
                          {formatAmount(item.amount)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Since {formatDate(item.date)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
