import { brand } from "@/lib/brand";

export function formatVocNo(n: number) {
  return `${brand.vocPrefix}-${Math.max(1, n)}`;
}

export function vocSequenceFrom(value?: string) {
  const escaped = brand.vocPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(value || "")
    .trim()
    .match(new RegExp(`^${escaped}-(\\d+)$`, "i"));
  return match ? Number(match[1]) : 1;
}
