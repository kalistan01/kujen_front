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
