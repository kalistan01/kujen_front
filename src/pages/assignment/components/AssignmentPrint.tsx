import PrintBlTable from "./PrintBlTable";
import PrintContainersTable from "./PrintContainersTable";
import PrintSummaryTable from "./PrintSummaryTable";

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function AssignmentPrint({
  assignment,
  containerIds,
  title,
}: {
  assignment: any;
  containerIds?: string[] | null;
  title?: string;
}) {
  const allContainers = (assignment?.containers || []).filter(
    (c: any) => c && (c.containerNo || c._id)
  );
  const idSet = new Set((containerIds || []).map(String));
  const containers = idSet.size
    ? allContainers.filter((c: any) => idSet.has(String(c._id)))
    : allContainers;
  const status = (assignment?.status || "pending").replace(/-/g, " ");

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
          <span>Bill of Lading</span>
          <strong>{assignment?.blNo || "—"}</strong>
          <em>{title || status}</em>
        </div>
      </header>

      <section>
        <h2>BL details</h2>
        <PrintBlTable assignments={[assignment]} />
      </section>

      <section>
        <h2>
          {title
            ? `${title} (${containers.length})`
            : `Containers (${containers.length})`}
          {containers.length ? " · amounts in Rs" : ""}
        </h2>
        {containers.length === 0 ? (
          <p className="print-empty">No containers added.</p>
        ) : (
          <PrintContainersTable containers={containers} />
        )}
      </section>

      <section>
        <h2>Total summary</h2>
        <PrintSummaryTable containers={containers} />
      </section>

      <p className="print-note">
        Printed on {formatDateTime(new Date().toISOString())} · RG Brothers Logistics
        Ship line
      </p>
    </div>
  );
}

export default AssignmentPrint;
