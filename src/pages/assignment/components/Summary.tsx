import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Summary({ assignment }: any) {
  const containers = assignment?.containers || [];
  const totalAmount = containers.reduce((sum: number, container: any) => {
    return (
      sum +
      (container.weight || 0) +
      (container.dayHire || 0) +
      (container.outHire || 0) +
      (container.other || 0) +
      (container.heldUp || 0) +
      (container.agentFee || 0) +
      (container.return || 0)
    );
  }, 0);

  const totalAdvanced = containers.reduce(
    (sum: number, c: any) => sum + (c.advanced || 0),
    0
  );
  const totalRemaining = containers.reduce(
    (sum: number, c: any) =>
      sum +
      ((c.dayHire || 0) +
        (c.outHire || 0) +
        (c.weight || 0) +
        (c.other || 0) +
        (c.agentFee || 0) +
        (c.return || 0) +
        (c.heldUp || 0) -
        (c.advanced || 0)),
    0
  );

  const rows = [
    { label: "Total", value: totalAmount },
    { label: "Advanced", value: totalAdvanced, className: "text-emerald-600" },
    { label: "Remaining", value: totalRemaining, className: "font-bold" },
  ];

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Financial Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className={row.className}>
              ₹{row.value.toLocaleString()}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default Summary;
