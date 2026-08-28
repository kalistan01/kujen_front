import { canSeeField } from "@/lib/permissions";
import {
  CHARGE_FIELDS,
  formatMoney,
  getAssignmentFinancials,
} from "../lib/financials";

function PrintSummaryTable({
  containers,
  blCount,
}: {
  containers: any[];
  blCount?: number;
}) {
  const chargeFields = CHARGE_FIELDS.filter((field) => canSeeField(field.key));
  const showTotals = canSeeField("totals");
  const { charges, total, advanced, balancePaid, remaining } =
    getAssignmentFinancials(containers, { chargeFields, commissionFields: [] });

  if (!chargeFields.length && !showTotals) {
    return null;
  }

  return (
    <table className="print-table print-summary-table">
      <thead>
        <tr>
          {blCount != null ? <th>BLs</th> : null}
          <th>Containers</th>
          {chargeFields.map((field) => (
            <th key={field.key} className="num">
              {field.label}
            </th>
          ))}
          {showTotals ? (
            <>
              <th className="num">Total</th>
              {canSeeField("advanced") ? (
                <th className="num">Advanced</th>
              ) : null}
              {canSeeField("balancePaid") ? (
                <th className="num">Balance Paid</th>
              ) : null}
              <th className="num">Remaining</th>
            </>
          ) : null}
        </tr>
      </thead>
      <tbody>
        <tr>
          {blCount != null ? <td className="mono">{blCount}</td> : null}
          <td className="mono">{containers.length}</td>
          {chargeFields.map((field) => (
            <td key={field.key} className="num">
              {formatMoney(charges[field.key])}
            </td>
          ))}
          {showTotals ? (
            <>
              <td className="num">{formatMoney(total)}</td>
              {canSeeField("advanced") ? (
                <td className="num">{formatMoney(advanced)}</td>
              ) : null}
              {canSeeField("balancePaid") ? (
                <td className="num">{formatMoney(balancePaid)}</td>
              ) : null}
              <td className="num remain">{formatMoney(remaining)}</td>
            </>
          ) : null}
        </tr>
      </tbody>
    </table>
  );
}

export default PrintSummaryTable;
