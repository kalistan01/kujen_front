type ActivityLogLike = {
  summary?: string;
  path?: string;
  payload?: Record<string, unknown> | null;
};

function splitDetails(text: string) {
  return text
    .split(/\.\s+/)
    .map((part) => part.replace(/\.$/, "").trim())
    .filter(Boolean);
}

function payloadDetails(payload?: Record<string, unknown> | null) {
  if (!payload || typeof payload !== "object") return [];
  const skip = new Set([
    "password",
    "token",
    "cookie",
    "previous",
    "lorries",
    "containers",
    "permission",
    "denied",
  ]);
  return Object.entries(payload)
    .filter(([key, value]) => {
      if (skip.has(key) || key.startsWith("_")) return false;
      if (value === undefined || value === null || value === "") return false;
      if (typeof value === "object") return false;
      return true;
    })
    .slice(0, 8)
    .map(([key, value]) => `${key}: ${String(value)}`);
}

export function logDetailItems(log: ActivityLogLike) {
  const fromSummary = splitDetails(String(log.summary || "").trim());
  if (fromSummary.length) return fromSummary;
  const fromPayload = payloadDetails(log.payload);
  if (fromPayload.length) return fromPayload;
  if (log.path) return [log.path];
  return [];
}

export function LogDetails({ log }: { log: ActivityLogLike }) {
  const details = logDetailItems(log);
  if (!details.length) return <>{"—"}</>;
  if (details.length === 1) return <>{details[0]}</>;
  return (
    <ul className="list-disc space-y-0.5 pl-4">
      {details.map((detail) => (
        <li key={detail}>{detail}</li>
      ))}
    </ul>
  );
}
