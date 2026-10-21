import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import baseUrl from "@/api/baseUrl";
import { isAdminUser } from "@/lib/auth";
import { can, P } from "@/lib/permissions";
import { brand, brandFile } from "@/lib/brand";
import { useEntitySync } from "@/hooks/useEntitySync";
import { asList, cn } from "@/lib/utils";
import { openPrintDialog } from "@/pages/assignment/lib/printPage";
import type { StaffMember } from "@/pages/staff-member/AddStaffMember";
import {
  CalendarCheck,
  CheckCheck,
  Loader2,
  LogIn,
  LogOut,
  Printer,
  Save,
} from "lucide-react";

export type AttendanceStatus = "present" | "absent" | "leave" | "half_day";

export type AttendanceRecord = {
  _id?: string;
  staffMemberId: string | StaffMember;
  date: string;
  status: AttendanceStatus;
  checkIn?: string | null;
  checkOut?: string | null;
  note?: string;
  markedBy?: { _id?: string; fullName?: string; email?: string } | string | null;
};

type RowState = {
  staffMemberId: string;
  name: string;
  linked: string | null;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  note: string;
  recordId?: string;
};

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  className: string;
}[] = [
  {
    value: "present",
    label: "Present",
    className:
      "border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    value: "absent",
    label: "Absent",
    className:
      "border-0 bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
  {
    value: "leave",
    label: "Leave",
    className:
      "border-0 bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  {
    value: "half_day",
    label: "Half day",
    className:
      "border-0 bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
];

function statusStyle(status: AttendanceStatus) {
  return (
    STATUS_OPTIONS.find((item) => item.value === status)?.className ||
    "border-0 bg-muted text-foreground"
  );
}

function statusLabel(status: AttendanceStatus) {
  return (
    STATUS_OPTIONS.find((item) => item.value === status)?.label || status
  );
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-0 font-semibold shadow-none", statusStyle(status))}
    >
      {statusLabel(status)}
    </Badge>
  );
}

function todayLocal() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function staffIdOf(value: AttendanceRecord["staffMemberId"]) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || "";
}

function linkedLabel(member: StaffMember) {
  const user = member.userId;
  if (!user) return null;
  if (typeof user === "string") return "Linked";
  return user.fullName || user.email || "Linked";
}

function toTimeInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function timeToIso(dateStr: string, timeStr: string) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const [y, mo, d] = dateStr.split("-").map(Number);
  const local = new Date(y, mo - 1, d, h, m, 0, 0);
  return local.toISOString();
}

function nowTimeInput() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

function buildRows(
  staff: StaffMember[],
  records: AttendanceRecord[]
): RowState[] {
  const byStaff = new Map<string, AttendanceRecord>();
  for (const record of records) {
    const id = staffIdOf(record.staffMemberId);
    if (id) byStaff.set(id, record);
  }

  return staff
    .filter((member) => member._id && member.status !== false)
    .map((member) => {
      const id = member._id as string;
      const record = byStaff.get(id);
      return {
        staffMemberId: id,
        name: member.name,
        linked: linkedLabel(member),
        status: record?.status || "present",
        checkIn: toTimeInput(record?.checkIn),
        checkOut: toTimeInput(record?.checkOut),
        note: record?.note || "",
        recordId: record?._id,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const AttendanceManagement = () => {
  const { toast } = useToast();
  const canMark = can(P.ATTENDANCE_MARK);
  const isAdmin = isAdminUser();
  const [date, setDate] = useState(todayLocal);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [rows, setRows] = useState<RowState[]>([]);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historyStaffId, setHistoryStaffId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState("attendance");

  const loadDay = useCallback(
    async (day: string, staffList: StaffMember[]) => {
      setLoading(true);
      try {
        const response = await baseUrl.get("/attendance", {
          params: { date: day },
        });
        const records = asList<AttendanceRecord>(response.data?.data);
        setRows(buildRows(staffList, records));
        setDirty(false);
      } catch (error) {
        setRows(buildRows(staffList, []));
        toast({
          title: "Unable to load attendance",
          description: getApiErrorMessage(
            error,
            "Could not load attendance for this day."
          ),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await baseUrl.get("/staff-member", {
          params: { status: "true" },
        });
        const list = asList<StaffMember>(response.data?.data);
        if (cancelled) return;
        setStaff(list);
        await loadDay(date, list);
      } catch (error) {
        if (cancelled) return;
        setStaff([]);
        setRows([]);
        setLoading(false);
        toast({
          title: "Unable to load staff",
          description: getApiErrorMessage(
            error,
            "Could not load active staff for the roster."
          ),
          variant: "destructive",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
    // intentionally load staff once; date changes handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!staff.length) return;
    loadDay(date, staff);
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  useEntitySync("staff-member", (payload) => {
    setStaff((prev) => {
      const next = [...prev];
      const index = next.findIndex(
        (item) => String(item._id) === String(payload.id)
      );
      if (payload.action === "deleted" || payload.data?.status === false) {
        if (index >= 0) next.splice(index, 1);
      } else if (payload.data) {
        if (index >= 0) next[index] = { ...next[index], ...payload.data };
        else if (payload.data.status !== false) next.push(payload.data);
      }
      const sorted = next.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
      setRows((prevRows) => {
        const byId = new Map(prevRows.map((row) => [row.staffMemberId, row]));
        return buildRows(sorted, []).map((row) => {
          const existing = byId.get(row.staffMemberId);
          return existing
            ? {
                ...row,
                status: existing.status,
                checkIn: existing.checkIn,
                checkOut: existing.checkOut,
                note: existing.note,
                recordId: existing.recordId,
              }
            : row;
        });
      });
      return sorted;
    });
  });

  useEntitySync("attendance", (payload) => {
    if (!payload.data) return;
    const record = payload.data as AttendanceRecord;
    const recordDate = String(record.date || "").slice(0, 10);
    if (recordDate && recordDate !== date) return;
    const id = staffIdOf(record.staffMemberId);
    if (!id) return;
    setRows((prev) =>
      prev.map((row) =>
        row.staffMemberId === id
          ? {
              ...row,
              status: record.status,
              checkIn: toTimeInput(record.checkIn),
              checkOut: toTimeInput(record.checkOut),
              note: record.note || "",
              recordId: record._id,
            }
          : row
      )
    );
  });

  const updateRow = (staffMemberId: string, patch: Partial<RowState>) => {
    setRows((prev) =>
      prev.map((row) =>
        row.staffMemberId === staffMemberId ? { ...row, ...patch } : row
      )
    );
    setDirty(true);
  };

  const payloadFromRows = (list: RowState[]) =>
    list.map((row) => {
      const clearsTimes = row.status === "absent" || row.status === "leave";
      return {
        staffMemberId: row.staffMemberId,
        status: row.status,
        note: row.note.trim(),
        checkIn: clearsTimes ? null : timeToIso(date, row.checkIn),
        checkOut: clearsTimes ? null : timeToIso(date, row.checkOut),
      };
    });

  const handleSave = async () => {
    if (!canMark || !rows.length) return;
    setSaving(true);
    try {
      const response = await baseUrl.put("/attendance/bulk", {
        date,
        records: payloadFromRows(rows),
      });
      const saved = asList<AttendanceRecord>(response.data?.data);
      setRows(buildRows(staff, saved));
      setDirty(false);
      toast({
        title: "Saved",
        description: `Attendance saved for ${date}.`,
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: getApiErrorMessage(
          error,
          "Could not save attendance. Please try again."
        ),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllPresent = () => {
    if (!canMark) return;
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        status: "present" as AttendanceStatus,
      }))
    );
    setDirty(true);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const params: Record<string, string> = {};
      if (historyFrom) params.from = historyFrom;
      if (historyTo) params.to = historyTo;
      if (historyStaffId !== "all") params.staffMemberId = historyStaffId;
      const response = await baseUrl.get("/attendance", { params });
      setHistory(asList<AttendanceRecord>(response.data?.data));
    } catch (error) {
      setHistory([]);
      toast({
        title: "Unable to load history",
        description: getApiErrorMessage(
          error,
          "Could not load attendance history."
        ),
        variant: "destructive",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const presentCount = useMemo(
    () =>
      rows.filter((row) => row.status === "present" || row.status === "half_day")
        .length,
    [rows]
  );

  const historyStaffLabel = useMemo(() => {
    if (historyStaffId === "all") return "All staff";
    const member = staff.find((item) => item._id === historyStaffId);
    return member?.name || "Staff";
  }, [historyStaffId, staff]);

  const historyRangeLabel = useMemo(() => {
    if (historyFrom && historyTo) return `${historyFrom} to ${historyTo}`;
    if (historyFrom) return `From ${historyFrom}`;
    if (historyTo) return `To ${historyTo}`;
    return "All dates";
  }, [historyFrom, historyTo]);

  const handlePrintHistory = () => {
    if (!isAdmin) {
      toast({
        title: "Admin only",
        description: "Only administrators can print attendance history.",
        variant: "destructive",
      });
      return;
    }
    if (!history.length) {
      toast({
        title: "Nothing to print",
        description: "Load attendance history first.",
        variant: "destructive",
      });
      return;
    }
    openPrintDialog(brandFile("Attendance-History"), undefined, {
      orientation: "portrait",
    });
  };

  const renderHistoryRows = (records: AttendanceRecord[]) =>
    records.map((record, index) => {
      const member =
        typeof record.staffMemberId === "object" ? record.staffMemberId : null;
      return (
        <TableRow key={record._id || index}>
          <TableCell>{String(record.date || "").slice(0, 10)}</TableCell>
          <TableCell className="font-medium">
            {member?.name || staffIdOf(record.staffMemberId)}
          </TableCell>
          <TableCell>
            <StatusBadge status={record.status} />
          </TableCell>
          <TableCell>{toTimeInput(record.checkIn) || "—"}</TableCell>
          <TableCell>{toTimeInput(record.checkOut) || "—"}</TableCell>
          <TableCell className="max-w-[220px] truncate text-sm print:max-w-none print:whitespace-normal">
            {record.note || "—"}
          </TableCell>
        </TableRow>
      );
    });

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <PageHeader
          title="Attendance"
          description="Mark daily status and review attendance history."
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="print:hidden">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent
          value="attendance"
          className="mt-4 space-y-4 print:hidden"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayLocal())}
              className="h-10 w-full sm:w-44"
            />
            {canMark ? (
              <>
                <Button variant="outline" onClick={handleMarkAllPresent}>
                  <CheckCheck className="h-4 w-4" />
                  Mark all present
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !rows.length}
                  className="bg-[hsl(var(--brand-navy))] text-white hover:bg-[hsl(var(--brand-navy-muted))]"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {dirty ? "Save day*" : "Save day"}
                </Button>
              </>
            ) : null}
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/70 bg-muted/30 py-4">
              <CardTitle className="flex items-center justify-between text-base font-semibold">
                <span className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4" />
                  Roster for {date}
                </span>
                <Badge variant="secondary">
                  {presentCount}/{rows.length} present
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 px-4 py-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <CalendarCheck className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="font-medium">No active staff</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add active staff members on the Staff page first.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check in</TableHead>
                        <TableHead>Check out</TableHead>
                        <TableHead>Note</TableHead>
                        {canMark ? (
                          <TableHead className="text-right">Quick</TableHead>
                        ) : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => {
                        const timesDisabled =
                          !canMark ||
                          row.status === "absent" ||
                          row.status === "leave";
                        return (
                          <TableRow key={row.staffMemberId}>
                            <TableCell>
                              <div className="font-semibold">{row.name}</div>
                              {row.linked ? (
                                <Badge variant="secondary" className="mt-1">
                                  {row.linked}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Non-user
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="min-w-[140px]">
                              <Select
                                value={row.status}
                                disabled={!canMark}
                                onValueChange={(value) =>
                                  updateRow(row.staffMemberId, {
                                    status: value as AttendanceStatus,
                                    ...(value === "absent" || value === "leave"
                                      ? { checkIn: "", checkOut: "" }
                                      : {}),
                                  })
                                }
                              >
                                <SelectTrigger
                                  className={cn(
                                    "h-9 border-0 text-sm font-semibold shadow-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0",
                                    statusStyle(row.status)
                                  )}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      <span
                                        className={cn(
                                          "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
                                          option.className
                                        )}
                                      >
                                        {option.label}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="min-w-[120px]">
                              <Input
                                type="time"
                                value={row.checkIn}
                                disabled={timesDisabled}
                                onChange={(e) =>
                                  updateRow(row.staffMemberId, {
                                    checkIn: e.target.value,
                                  })
                                }
                                className="h-9"
                              />
                            </TableCell>
                            <TableCell className="min-w-[120px]">
                              <Input
                                type="time"
                                value={row.checkOut}
                                disabled={timesDisabled}
                                onChange={(e) =>
                                  updateRow(row.staffMemberId, {
                                    checkOut: e.target.value,
                                  })
                                }
                                className="h-9"
                              />
                            </TableCell>
                            <TableCell className="min-w-[160px]">
                              <Input
                                value={row.note}
                                disabled={!canMark}
                                onChange={(e) =>
                                  updateRow(row.staffMemberId, {
                                    note: e.target.value,
                                  })
                                }
                                placeholder="Optional"
                                className="h-9"
                              />
                            </TableCell>
                            {canMark ? (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={timesDisabled}
                                    onClick={() =>
                                      updateRow(row.staffMemberId, {
                                        status:
                                          row.status === "absent" ||
                                          row.status === "leave"
                                            ? "present"
                                            : row.status,
                                        checkIn: nowTimeInput(),
                                      })
                                    }
                                  >
                                    <LogIn className="h-3.5 w-3.5" />
                                    In
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={timesDisabled || !row.checkIn}
                                    onClick={() =>
                                      updateRow(row.staffMemberId, {
                                        checkOut: nowTimeInput(),
                                      })
                                    }
                                  >
                                    <LogOut className="h-3.5 w-3.5" />
                                    Out
                                  </Button>
                                </div>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/70 bg-muted/30 py-4 print:hidden">
              <CardTitle className="text-base font-semibold">History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end print:hidden">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    From
                  </p>
                  <Input
                    type="date"
                    value={historyFrom}
                    onChange={(e) => setHistoryFrom(e.target.value)}
                    className="h-9 w-full sm:w-40"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    To
                  </p>
                  <Input
                    type="date"
                    value={historyTo}
                    onChange={(e) => setHistoryTo(e.target.value)}
                    className="h-9 w-full sm:w-40"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Staff
                  </p>
                  <Select
                    value={historyStaffId}
                    onValueChange={setHistoryStaffId}
                  >
                    <SelectTrigger className="h-9 w-full text-sm sm:w-52">
                      <SelectValue placeholder="All staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All staff</SelectItem>
                      {staff.map((member) =>
                        member._id ? (
                          <SelectItem key={member._id} value={member._id}>
                            {member.name}
                          </SelectItem>
                        ) : null
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={loadHistory}
                  disabled={historyLoading}
                >
                  {historyLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Load history
                </Button>
                {isAdmin ? (
                  <Button
                    variant="outline"
                    onClick={handlePrintHistory}
                    disabled={!history.length || historyLoading}
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                ) : null}
              </div>

              <div className="mb-4 hidden print:block">
                <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {brand.tagline}
                    </p>
                    <h1 className="text-xl font-bold">{brand.name}</h1>
                    <p className="mt-1 text-base font-semibold">
                      Attendance History
                    </p>
                  </div>
                  <p className="text-right text-xs text-muted-foreground">
                    Printed{" "}
                    {new Date().toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {historyRangeLabel} · {historyStaffLabel} · {history.length}{" "}
                  record{history.length === 1 ? "" : "s"}
                </p>
              </div>

              {history.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground print:hidden">
                  {historyLoading
                    ? "Loading..."
                    : "Choose a range and load attendance history."}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border print:overflow-visible print:rounded-none print:border-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableHead>Date</TableHead>
                        <TableHead>Staff</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check in</TableHead>
                        <TableHead>Check out</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{renderHistoryRows(history)}</TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
