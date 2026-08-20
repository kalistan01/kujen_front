import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CHARGE_FIELDS,
  COMMISSION_FIELDS,
  formatMoney,
  getAssignmentFinancials,
} from "../lib/financials";
import { canSeeField } from "@/lib/permissions";

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
  const chargeFields = CHARGE_FIELDS.filter((field) => canSeeField(field.key));
  const commissionFields = COMMISSION_FIELDS.filter((field) =>
    canSeeField(field.key)
  );
  const showTotals = canSeeField("totals");
  const { charges, commissions, total, advanced, balancePaid } =
    getAssignmentFinancials(assignment?.containers, {
      chargeFields,
      commissionFields,
    });
  const remaining =
    total -
    (canSeeField("advanced") ? advanced : 0) -
    (canSeeField("balancePaid") ? balancePaid : 0);

  if (!chargeFields.length && !commissionFields.length && !showTotals) {
    return null;
  }

  return (
    <>
      {chargeFields.length || showTotals ? (
        <Card className="bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/90">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {chargeFields.map((field) => (
              <Row
                key={field.key}
                label={field.label}
                value={charges[field.key]}
              />
            ))}

            {showTotals ? (
              <div className="space-y-2 border-t border-border pt-2">
                <Row label="Total" value={total} className="font-semibold" />
                {canSeeField("advanced") ? (
                  <Row
                    label="Advanced"
                    value={advanced}
                    className="font-medium text-emerald-600"
                  />
                ) : null}
                {canSeeField("balancePaid") ? (
                  <Row
                    label="Balance Paid"
                    value={balancePaid}
                    className="font-medium text-emerald-600"
                  />
                ) : null}
                <Row label="Remaining" value={remaining} className="font-bold" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {commissionFields.length ? (
        <Card className="border-[hsl(var(--brand-navy))]/20 bg-[hsl(var(--brand-navy))]/8 shadow-sm dark:border-white/10 dark:bg-white/10">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Commissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {commissionFields.map((field) => (
              <Row
                key={field.key}
                label={field.label}
                value={commissions[field.key]}
                className="font-medium"
              />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

export default Summary;
