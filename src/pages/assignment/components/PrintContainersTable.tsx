import { canSeeField } from "@/lib/permissions";
import { formatDate } from "../lib/dates";
import { formatMoneyCompact, roundMoney, toAmount } from "../lib/financials";
import { formatFclRecord } from "../lib/fcl";
import {
  containerCapacity,
  containerDestination,
  containerLorry,
  containerMoney,
  containerOwner,
  visibleChargeColumns,
} from "../lib/containerDisplay";

const SHORT_LABELS: Record<string, string> = {
  weight: "Weight",
  dayHire: "Day Hire",
  advanced: "Adv",
  balancePaid: "Bal Paid",
  outHire: "Out Hire",
  other: "Other",
  heldUp: "Held Up",
  agentFee: "Agent Fee",
  transportCommission: "Tpt Comm",
  return: "Return",
};

function statusLabel(value?: string) {
  return (value || "pending").replace(/-/g, " ");
}

function PrintContainersTable({
  containers,
  showTotalsRow = true,
}: {
  containers: any[];
  showTotalsRow?: boolean;
}) {
  const chargeColumns = visibleChargeColumns();
  const showTotals = canSeeField("totals");

  const sums = containers.reduce(
    (acc, container) => {
      chargeColumns.forEach((field) => {
        acc[field.key] = roundMoney(
          (acc[field.key] || 0) + toAmount(container?.[field.key])
        );
      });
      const money = containerMoney(container);
      acc._total = roundMoney(acc._total + money.total);
      acc._paid = roundMoney(acc._paid + money.paid);
      acc._balance = roundMoney(acc._balance + money.balance);
      return acc;
    },
    { _total: 0, _paid: 0, _balance: 0 } as Record<string, number>
  );

  return (
    <table className="print-table">
      <thead>
        <tr>
          <th className="idx">#</th>
          <th>Container</th>
          <th>VOC</th>
          <th>Lorry</th>
          <th>Owner</th>
          <th>Destination</th>
          <th>Loading</th>
          <th>Demount</th>
          {chargeColumns.map((field) => (
            <th key={field.key} className="num">
              {SHORT_LABELS[field.key] || field.label}
            </th>
          ))}
          {showTotals ? (
            <>
              <th className="num">Total</th>
              <th className="num">Paid</th>
              <th className="num">Balance</th>
            </>
          ) : null}
          <th>Status</th>
          <th>FCL Status</th>
        </tr>
      </thead>
      <tbody>
        {containers.map((container: any, index: number) => {
          const capacity = containerCapacity(container);
          const owner = containerOwner(container);
          const money = containerMoney(container);
          return (
            <tr key={container?._id || index}>
              <td className="idx">{index + 1}</td>
              <td className="mono">{container?.containerNo || "—"}</td>
              <td>{container?.vocNo || "—"}</td>
              <td>
                {containerLorry(container)}
                {capacity ? ` / ${capacity}ft` : ""}
              </td>
              <td>{owner ? String(owner).toUpperCase() : "—"}</td>
              <td>{containerDestination(container)}</td>
              <td className="nowrap">{formatDate(container?.loadingDate)}</td>
              <td className="nowrap">{formatDate(container?.demoundDate)}</td>
              {chargeColumns.map((field) => (
                <td key={field.key} className="num">
                  {formatMoneyCompact(container?.[field.key])}
                </td>
              ))}
              {showTotals ? (
                <>
                  <td className="num">{formatMoneyCompact(money.total)}</td>
                  <td className="num">{formatMoneyCompact(money.paid)}</td>
                  <td className="num">{formatMoneyCompact(money.balance)}</td>
                </>
              ) : null}
              <td className="status">{statusLabel(container?.status)}</td>
              <td className="status">{formatFclRecord(container?.fcl)}</td>
            </tr>
          );
        })}
      </tbody>
      {showTotalsRow && containers.length > 1 ? (
        <tfoot>
          <tr>
            <td className="idx" />
            <td colSpan={7}>
              Total · {containers.length} containers · amounts in Rs
            </td>
            {chargeColumns.map((field) => (
              <td key={field.key} className="num">
                {formatMoneyCompact(sums[field.key], { dashZero: false })}
              </td>
            ))}
            {showTotals ? (
              <>
                <td className="num">
                  {formatMoneyCompact(sums._total, { dashZero: false })}
                </td>
                <td className="num">
                  {formatMoneyCompact(sums._paid, { dashZero: false })}
                </td>
                <td className="num">
                  {formatMoneyCompact(sums._balance, { dashZero: false })}
                </td>
              </>
            ) : null}
            <td />
            <td />
          </tr>
        </tfoot>
      ) : null}
    </table>
  );
}

export default PrintContainersTable;
