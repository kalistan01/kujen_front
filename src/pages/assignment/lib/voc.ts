export function formatVocNo(n: number) {
  return `RGB-${Math.max(1, n)}`;
}

export function vocSequenceFrom(value?: string) {
  const match = String(value || "").trim().match(/^RGB-(\d+)$/i);
  return match ? Number(match[1]) : 1;
}
