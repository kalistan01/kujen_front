const pad = (value: number) => String(value).padStart(2, "0");

export const formatDate = (value?: string | Date) => {
  if (!value) return "—";
  if (typeof value === "string") {
    const part = value.substring(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
      const [year, month, day] = part.split("-");
      return `${day}/${month}/${year}`;
    }
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

export const parseDay = (value: string, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date;
};

export const createdStamp = (value?: string | Date | null) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const dateKey = (value?: string | Date | null) => {
  if (!value) return "";
  if (typeof value === "string") {
    const part = value.substring(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Calendar days from `from` to `to` (`to` − `from`). */
export const calendarDaysBetween = (
  from?: string | Date | null,
  to?: string | Date | null
) => {
  const start = dateKey(from);
  const end = dateKey(to);
  if (!start || !end) return null;
  const [y1, m1, d1] = start.split("-").map(Number);
  const [y2, m2, d2] = end.split("-").map(Number);
  return Math.round(
    (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000
  );
};
