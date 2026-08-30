import { formatDate } from "../lib/dates";
import type { ContainerListRow } from "./ContainerListTable";
import PrintBlTable from "./PrintBlTable";
import PrintContainersTable from "./PrintContainersTable";
import PrintSummaryTable from "./PrintSummaryTable";

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

function ContainerListPrint({
  rows,
  title,
}: {
  rows: ContainerListRow[];
  title?: string;
}) {
  if (!rows.length) return null;

  const groups = groupedRows(rows);

  return (
    <div className="hidden print:block print-document print-wide">
      <header className="print-hero">
        <div className="print-brand">
          <div className="print-mark">RG</div>
          <div>
            <h1>RG Brothers Logistics</h1>
            <p>Ship line</p>
          </div>
        </div>
        <div className="print-bl">
          <span>{title || "Selected containers"}</span>
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
          <h2>BL details · {group.assignment?.blNo || "—"}</h2>
          <PrintBlTable assignments={[group.assignment]} />

          <h2>
            Containers ({group.containers.length})
            {group.containers.length ? " · amounts in Rs" : ""}
          </h2>
          <PrintContainersTable containers={group.containers} />
        </section>
      ))}

      <section>
        <h2>Total summary</h2>
        <PrintSummaryTable
          containers={rows.map((row) => row.container)}
          blCount={groups.length}
        />
      </section>

      <p className="print-note">
        Printed on {formatDate(new Date())} · RG Brothers Logistics
      </p>
    </div>
  );
}

export default ContainerListPrint;
