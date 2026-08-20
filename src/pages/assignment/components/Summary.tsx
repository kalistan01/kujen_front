import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CHARGE_FIELDS,
  COMMISSION_FIELDS,
  formatMoney,
  getAssignmentFinancials,
} from "../lib/financials";

function Row({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={className}>{formatMoney(value)}</span>
    </div>
  );
}

function Summary({ assignment }: any) {
  const { charges, commissions, total, advanced, balancePaid, remaining } =
    getAssignmentFinancials(assignment?.containers);

  return (
    <>
      <Card className="bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/90">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          {CHARGE_FIELDS.map((field) => (
            <Row
              key={field.key}
              label={field.label}
              value={charges[field.key]}
            />
          ))}

          <div className="space-y-2 border-t border-border pt-2">
            <Row label="Total" value={total} className="font-semibold" />
            <Row
              label="Advanced"
              value={advanced}
              className="font-medium text-emerald-600"
            />
            <Row
              label="Balance Paid"
              value={balancePaid}
              className="font-medium text-emerald-600"
            />
            <Row label="Remaining" value={remaining} className="font-bold" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[hsl(var(--brand-navy))]/20 bg-[hsl(var(--brand-navy))]/8 shadow-sm dark:border-white/10 dark:bg-white/10">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Commissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          {COMMISSION_FIELDS.map((field) => (
            <Row
              key={field.key}
              label={field.label}
              value={commissions[field.key]}
              className="font-medium"
            />
          ))}
        </CardContent>
      </Card>
    </>
  );
}

export default Summary;
