import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DollarSign } from "lucide-react";
function Summary({ assignment }: any) {
  const totalAmount = assignment?.containers?.reduce(
    (sum: any, container: any) => {
      const containerTotal =
        (container.weight || 0) +
        (container.dayHire || 0) +
        (container.outHire || 0) +
        (container.other || 0) +
        (container.heldUp || 0) +
        (container.agentFee || 0) +
        (container.return || 0);
      return sum + containerTotal;
    },
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">
                ₹
                {totalAmount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Advanced</span>
              <span className="font-semibold text-green-600">
                ₹
                {assignment?.containers
                  .reduce((sum, c) => sum + c.advanced, 0)
                  .toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Remaining</span>
              <span className="font-bold">
                ₹
                {assignment?.containers
                  .reduce(
                    (sum, c) =>
                      sum +
                      (c.dayHire +
                        c.outHire +
                        c.weight +
                        c.other +
                        c.agentFee +
                        c.return +
                        c.heldUp -
                        c.advanced),
                    0
                  )
                  .toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Summary;
