import { canSeeField } from "@/lib/permissions";
import { formatDate } from "../lib/dates";
import { formatMoney, toAmount } from "../lib/financials";
import {
  containerCapacity,
  containerDestination,
  containerLorry,
  containerMoney,
  containerOwner,
  visibleChargeColumns,
} from "../lib/containerDisplay";
import type { ContainerListRow } from "./ContainerListTable";

function chargeRows(container: any) {
  return visibleChargeColumns().map((field) => {
    let label = field.label;
    if (field.key === "advanced" && canSeeField("advancedDate") && container?.advancedDate) {
      label = `Advanced (${formatDate(container.advancedDate)})`;
    }
    if (
      field.key === "balancePaid" &&
      canSeeField("balanceDate") &&
      container?.balanceDate
    ) {
      label = `Balance Paid (${formatDate(container.balanceDate)})`;
    }
    return [label, toAmount(container?.[field.key])] as [string, number];
  });
}

function groupedRows(rows: ContainerListRow[]) {
  const groups: { assignment: any; containers: any[] }[] = [];
  const indexById = new Map<string, number>();
  rows.forEach((row) => {
    const key = String(row.assignment?._id || row.assignment?.blNo || groups.length);
    const existing = indexById.get(key);
    if (existing === undefined) {
      indexById.set(key, groups.length);
      groups.push({ assignment: row.assignment, containers: [row.container] });
      return;
    }
    groups[existing].containers.push(row.container);
  });
  return groups;
}

function ContainerListPrint({ rows }: { rows: ContainerListRow[] }) {
  if (!rows.length) return null;

  const groups = groupedRows(rows);
  const showTotals = canSeeField("totals");

  return (
    <div className="hidden print:block print-document">
      <header className="print-hero">
        <div className="print-brand">
          <div className="print-mark">RG</div>
          <div>
            <h1>RG Brothers</h1>
            <p>Logistics</p>
          </div>
        </div>
        <div className="print-bl">
          <span>Selected containers</span>
          <strong>
            {rows.length} container{rows.length === 1 ? "" : "s"}
          </strong>
          <em>
            {groups.length} BL{groups.length === 1 ? "" : "s"}
          </em>
        </div>
      </header>

      {groups.map((group, groupIndex) => (
        <section key={group.assignment?._id || groupIndex}>
          <h2>Assignment details · {group.assignment?.blNo || "—"}</h2>
          <div className="print-info">
            <div>
              <span>BL Number</span>
              <b>{group.assignment?.blNo || "—"}</b>
            </div>
            <div>
              <span>Cusdec Date</span>
              <b>{formatDate(group.assignment?.cusdecDate)}</b>
            </div>
            <div>
              <span>Cusdec Number</span>
              <b>{group.assignment?.cusdecNo || "—"}</b>
            </div>
            <div>
              <span>Registration No.</span>
              <b>{group.assignment?.regNo || "—"}</b>
            </div>
            <div>
              <span>Item</span>
              <b>{group.assignment?.item || "—"}</b>
            </div>
            <div>
              <span>Exporter</span>
              <b>{group.assignment?.exporter || "—"}</b>
            </div>
            <div>
              <span>Importer</span>
              <b>{group.assignment?.importer || "—"}</b>
            </div>
          </div>

          <h2>
            Containers ({group.containers.length})
          </h2>
          {group.containers.map((container: any, index: number) => {
            const { total, paid, balance } = containerMoney(container);
            const rowsForCharges = chargeRows(container);
            const capacity = containerCapacity(container);
            const owner = containerOwner(container);
            return (
              <article key={container?._id || index} className="print-box">
                <div className="print-box-head">
                  <h3>
                    {index + 1}. {container?.containerNo || "—"}
                  </h3>
                  <span>
                    {(container?.status || "pending").replace(/-/g, " ")}
                  </span>
                </div>
                <div className="print-info print-info-sm">
                  <div>
                    <span>VOC No.</span>
                    <b>{container?.vocNo || "—"}</b>
                  </div>
                  <div>
                    <span>Lorry</span>
                    <b>
                      {containerLorry(container)}
                      {capacity ? ` / ${capacity} ft` : ""}
                    </b>
                  </div>
                  <div>
                    <span>Owner</span>
                    <b>{owner ? String(owner).toUpperCase() : "—"}</b>
                  </div>
                  <div>
                    <span>Destination</span>
                    <b>{containerDestination(container)}</b>
                  </div>
                  <div>
                    <span>Loading</span>
                    <b>{formatDate(container?.loadingDate)}</b>
                  </div>
                  <div>
                    <span>Demount</span>
                    <b>{formatDate(container?.demoundDate)}</b>
                  </div>
                </div>
                {rowsForCharges.length ? (
                  <table className="print-charges">
                    <tbody>
                      {Array.from({
                        length: Math.ceil(rowsForCharges.length / 2),
                      }).map((_, i) => {
                        const left = rowsForCharges[i * 2];
                        const right = rowsForCharges[i * 2 + 1];
                        return (
                          <tr key={String(left[0])}>
                            <th>{left[0]}</th>
                            <td>{formatMoney(left[1])}</td>
                            <th>{right?.[0] || ""}</th>
                            <td>{right ? formatMoney(right[1]) : ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : null}
                {showTotals ? (
                  <div className="print-totals">
                    <div>
                      <span>Total</span>
                      <b>{formatMoney(total)}</b>
                    </div>
                    <div>
                      <span>Paid</span>
                      <b>{formatMoney(paid)}</b>
                    </div>
                    <div className="print-balance">
                      <span>Balance</span>
                      <b>{formatMoney(balance)}</b>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      ))}

      <p className="print-note">
        Printed on {formatDate(new Date())} · RG Brothers Logistics
      </p>
    </div>
  );
}

export default ContainerListPrint;
