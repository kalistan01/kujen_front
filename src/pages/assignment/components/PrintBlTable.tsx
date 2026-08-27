import { formatDate } from "../lib/dates";

function statusLabel(value?: string) {
  return (value || "pending").replace(/-/g, " ");
}

function PrintBlTable({
  assignments,
}: {
  assignments: any[];
}) {
  const rows = (assignments || []).filter(Boolean);
  if (!rows.length) return null;

  return (
    <table className="print-table">
      <thead>
        <tr>
          <th>BL Number</th>
          <th>Status</th>
          <th>Cusdec Date</th>
          <th>Cusdec No.</th>
          <th>Reg. No.</th>
          <th>Item</th>
          <th>Exporter</th>
          <th>Importer</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((assignment: any, index: number) => (
          <tr key={assignment?._id || assignment?.blNo || index}>
            <td className="mono">{assignment?.blNo || "—"}</td>
            <td className="status">{statusLabel(assignment?.status)}</td>
            <td className="nowrap">{formatDate(assignment?.cusdecDate)}</td>
            <td>{assignment?.cusdecNo || "—"}</td>
            <td>{assignment?.regNo || "—"}</td>
            <td>{assignment?.item || "—"}</td>
            <td>{assignment?.exporter || "—"}</td>
            <td>{assignment?.importer || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default PrintBlTable;
