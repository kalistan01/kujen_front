import { toDateKey, todayDateInput } from "./financials";
import { formatDate } from "./dates";

export type FclStepKey = "received" | "submitted" | "paymentReceived";

export type FclStep = {
  done: boolean;
  date: string;
};

export type FclState = {
  enabled: boolean;
  received: FclStep;
  submitted: FclStep;
  paymentReceived: FclStep;
};

export const FCL_STEP_KEYS: FclStepKey[] = [
  "received",
  "submitted",
  "paymentReceived",
];

export const FCL_STEPS: { key: FclStepKey; label: string }[] = [
  { key: "received", label: "Received" },
  { key: "submitted", label: "Submitted to shipping line" },
  { key: "paymentReceived", label: "FCL payment received" },
];

const emptyStep = (): FclStep => ({ done: false, date: "" });

export function emptyFcl(): FclState {
  return {
    enabled: false,
    received: emptyStep(),
    submitted: emptyStep(),
    paymentReceived: emptyStep(),
  };
}

function stepFrom(value: unknown): FclStep {
  if (!value || typeof value !== "object") return emptyStep();
  const step = value as { done?: unknown; date?: unknown };
  return {
    done: Boolean(step.done),
    date: toDateKey(step.date as string | Date | null) || "",
  };
}

export function parseFcl(value?: unknown): FclState {
  if (!value || typeof value !== "object") return emptyFcl();
  const raw = value as Partial<FclState>;
  return normalizeFcl({
    enabled: Boolean(raw.enabled),
    received: stepFrom(raw.received),
    submitted: stepFrom(raw.submitted),
    paymentReceived: stepFrom(raw.paymentReceived),
  });
}

export function normalizeFcl(fcl: FclState): FclState {
  if (!fcl.enabled) return emptyFcl();
  const received = fcl.received.done
    ? { done: true, date: fcl.received.date }
    : emptyStep();
  const submitted =
    received.done && fcl.submitted.done
      ? { done: true, date: fcl.submitted.date }
      : emptyStep();
  const paymentReceived =
    submitted.done && fcl.paymentReceived.done
      ? { done: true, date: fcl.paymentReceived.date }
      : emptyStep();
  return { enabled: true, received, submitted, paymentReceived };
}

export function fclStepUnlocked(fcl: FclState, key: FclStepKey) {
  if (!fcl.enabled) return false;
  const index = FCL_STEP_KEYS.indexOf(key);
  if (index <= 0) return true;
  return fcl[FCL_STEP_KEYS[index - 1]].done;
}

export function setFclEnabled(fcl: FclState, enabled: boolean): FclState {
  if (!enabled) return emptyFcl();
  return { ...parseFcl(fcl), enabled: true };
}

export function toggleFclStep(
  fcl: FclState,
  key: FclStepKey,
  done: boolean,
  today = todayDateInput()
): FclState {
  const next = parseFcl(fcl);
  if (!next.enabled) return next;
  if (done && !fclStepUnlocked(next, key)) return next;
  if (done) {
    next[key] = { done: true, date: next[key].date || today };
    return next;
  }
  const start = FCL_STEP_KEYS.indexOf(key);
  for (let i = start; i < FCL_STEP_KEYS.length; i += 1) {
    next[FCL_STEP_KEYS[i]] = emptyStep();
  }
  return next;
}

export function setFclStepDate(
  fcl: FclState,
  key: FclStepKey,
  date: string
): FclState {
  const next = parseFcl(fcl);
  if (!next[key].done) return next;
  next[key] = { ...next[key], date };
  return next;
}

export function fclCurrentStatus(value?: unknown) {
  const fcl = parseFcl(value);
  if (!fcl.enabled) {
    return { key: "", label: "—", badge: "", date: "" };
  }
  if (fcl.paymentReceived.done) {
    return {
      key: "payment-received",
      label: "Payment received",
      badge: "payment-received",
      date: fcl.paymentReceived.date,
    };
  }
  if (fcl.submitted.done) {
    return {
      key: "submitted",
      label: "Submitted",
      badge: "submitted",
      date: fcl.submitted.date,
    };
  }
  if (fcl.received.done) {
    return {
      key: "received",
      label: "Received",
      badge: "received",
      date: fcl.received.date,
    };
  }
  return { key: "pending", label: "Pending", badge: "pending", date: "" };
}

export function fclStepRecords(value?: unknown) {
  const fcl = parseFcl(value);
  return FCL_STEPS.map((step) => ({
    key: step.key,
    label: step.label,
    done: fcl.enabled && fcl[step.key].done,
    date: fcl[step.key].date,
  }));
}

export function assignmentFclStatus(containers?: unknown[]) {
  const list = Array.isArray(containers) ? containers : [];
  const fcls = list
    .map((container) => parseFcl((container as { fcl?: unknown })?.fcl))
    .filter((fcl) => fcl.enabled);
  if (!fcls.length) return "pending";
  return fcls.every((fcl) => fcl.paymentReceived.done)
    ? "received"
    : "pending";
}

export function formatFclStatus(value?: unknown) {
  const current = fclCurrentStatus(value);
  if (!current.key) return "—";
  if (!current.date) return current.label;
  return `${current.label} · ${current.date}`;
}

export function formatFclRecord(value?: unknown) {
  const fcl = parseFcl(value);
  if (!fcl.enabled) return "—";
  const parts = fclStepRecords(fcl)
    .filter((step) => step.done)
    .map((step) =>
      step.date ? `${step.label} · ${formatDate(step.date)}` : step.label
    );
  return parts.length ? parts.join(" → ") : "Pending";
}
