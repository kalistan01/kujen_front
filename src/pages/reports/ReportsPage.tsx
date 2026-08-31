import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import baseUrl from "@/api/baseUrl";
import { asList, cn } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { P } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { useEntitySync } from "@/hooks/useEntitySync";
import { upsertById } from "@/lib/socket";
import type { HeldUpRateOption } from "@/pages/assignment/lib/financials";
import { AssignmentReports } from "./AssignmentReports";
import { LorryReports } from "./LorryReports";
import { DateRangeFilters, ReportSearch } from "./shared";
import { buildContainerRows, filterRows } from "./lib";

export function ReportsPage() {
  const location = useLocation();
  const { toast } = useToast();
  const canAssignments = can(P.ASSIGNMENTS_VIEW) || can(P.ASSIGNMENTS_MANAGE);
  const canLorries = can(P.LORRIES_VIEW) || can(P.LORRIES_ADD) || can(P.LORRIES_EDIT);
  const isLorryTab = location.pathname.endsWith("/lorries");

  const [assignments, setAssignments] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [rates, setRates] = useState<HeldUpRateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [assignmentView, setAssignmentView] = useState("overview");
  const [lorryView, setLorryView] = useState("overview");

  const load = () => {
    setLoading(true);
    Promise.all([
      baseUrl.get("/assignlorry").catch((error) => {
        toast({
          title: "Unable to load assignments",
          description: getApiErrorMessage(
            error,
            "Could not load assignment reports."
          ),
          variant: "destructive",
        });
        return { data: { data: [] } };
      }),
      canLorries
        ? baseUrl.get("/lorry").catch((error) => {
            toast({
              title: "Unable to load lorry owners",
              description: getApiErrorMessage(
                error,
                "Could not load lorry reports."
              ),
              variant: "destructive",
            });
            return { data: { data: [] } };
          })
        : Promise.resolve({ data: { data: [] } }),
      baseUrl.get("/heldup").catch(() => ({ data: { data: [] } })),
    ])
      .then(([assignmentRes, ownerRes, heldUpRes]) => {
        setAssignments(asList(assignmentRes.data?.data));
        setOwners(asList(ownerRes.data?.data));
        setRates(asList<HeldUpRateOption>(heldUpRes.data?.data));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [canLorries]);

  useEntitySync("assignment", (payload) => {
    setAssignments((prev) => upsertById(prev, payload));
  });
  useEntitySync("lorry", (payload) => {
    setOwners((prev) => upsertById(prev, payload));
  });
  useEntitySync("heldup", (payload) => {
    setRates((prev) => upsertById(prev, payload));
  });

  const datedRows = useMemo(
    () =>
      filterRows(buildContainerRows(assignments, rates), "", fromDate, toDate),
    [assignments, rates, fromDate, toDate]
  );
  const searchedRows = useMemo(
    () => filterRows(datedRows, query, "", ""),
    [datedRows, query]
  );

  if (!canAssignments && !canLorries) {
    return <Navigate to="/" replace />;
  }
  if (isLorryTab && !canLorries) {
    return <Navigate to="/reports" replace />;
  }
  if (!isLorryTab && !canAssignments && canLorries) {
    return <Navigate to="/reports/lorries" replace />;
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Reports"
        description="Assignment and lorry reports for hire, balances, routes, and fleet use."
        className="print:hidden"
      />

      <Card className="overflow-hidden">
        <CardHeader className="space-y-2 border-b border-border/70 bg-muted/30 px-3 py-2 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <nav className="inline-flex h-8 items-center rounded-md bg-muted p-1 text-muted-foreground">
              {canAssignments ? (
                <NavLink
                  to="/reports"
                  end
                  className={({ isActive }) =>
                    cn(
                      "inline-flex h-6 items-center rounded-sm px-2.5 text-xs font-medium transition-all",
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "hover:text-foreground"
                    )
                  }
                >
                  Assignments
                </NavLink>
              ) : null}
              {canLorries ? (
                <NavLink
                  to="/reports/lorries"
                  className={({ isActive }) =>
                    cn(
                      "inline-flex h-6 items-center rounded-sm px-2.5 text-xs font-medium transition-all",
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "hover:text-foreground"
                    )
                  }
                >
                  Lorries
                </NavLink>
              ) : null}
            </nav>
            <ReportSearch
              value={query}
              onChange={setQuery}
              placeholder={
                isLorryTab
                  ? "Search lorry, owner, company..."
                  : "Search BL, container, lorry, owner..."
              }
            />
          </div>
          <DateRangeFilters
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onClear={() => {
              setFromDate("");
              setToDate("");
            }}
          />
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <h1 className="mb-4 hidden text-xl font-bold print:block">
            RG Brothers Logistics {isLorryTab ? "Lorry" : "Assignment"} Reports
          </h1>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24" />
              ))}
            </div>
          ) : isLorryTab ? (
            <LorryReports
              owners={owners}
              rows={datedRows}
              query={query}
              view={lorryView}
              onViewChange={setLorryView}
            />
          ) : (
            <AssignmentReports
              rows={searchedRows}
              view={assignmentView}
              onViewChange={setAssignmentView}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
