const money = (value?: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value?: string | Date) => {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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

const nameOf = (value: any) =>
  typeof value === "object" ? value?.fullName || "—" : value || "—";

const containerTotal = (c: any) =>
  (c.weight || 0) +
  (c.dayHire || 0) +
  (c.outHire || 0) +
  (c.other || 0) +
  (c.heldUp || 0) +
  (c.agentFee || 0) +
  (c.return || 0);

function AssignmentPrint({ assignment }: { assignment: any }) {
  const containers = assignment?.containers || [];
  const total = containers.reduce(
    (sum: number, c: any) => sum + containerTotal(c),
    0
  );
  const advanced = containers.reduce(
    (sum: number, c: any) => sum + (c.advanced || 0),
    0
  );
  const remaining = total - advanced;
  const status = (assignment?.status || "pending").replace(/-/g, " ");

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
          <span>Bill of Lading</span>
          <strong>{assignment?.blNo || "—"}</strong>
          <em>{status}</em>
        </div>
      </header>

      <section>
        <h2>Assignment details</h2>
        <div className="print-info">
          <div>
            <span>Cusdec Date</span>
            <b>{formatDate(assignment?.cusdecDate)}</b>
          </div>
          <div>
            <span>Cusdec Number</span>
            <b>{assignment?.cusdecNo || "—"}</b>
          </div>
          <div>
            <span>Registration No.</span>
            <b>{assignment?.regNo || "—"}</b>
          </div>
          <div>
            <span>Item</span>
            <b>{assignment?.item || "N/A"}</b>
          </div>
          <div>
            <span>Exporter</span>
            <b>{assignment?.exporter || "N/A"}</b>
          </div>
          <div>
            <span>Importer</span>
            <b>{assignment?.importer || "N/A"}</b>
          </div>
        </div>
      </section>

      <section>
        <h2>Containers ({containers.length})</h2>
        {containers.length === 0 ? (
          <p className="print-empty">No containers added.</p>
        ) : (
          containers.map((c: any, index: number) => {
            const tot = containerTotal(c);
            const paid = c.advanced || 0;
            const charges = [
              ["Weight", c.weight],
              ["Day Hire", c.dayHire],
              ["Advanced", c.advanced],
              ["Out Hire", c.outHire],
              ["Other", c.other],
              ["Held Up", c.heldUp],
              ["Agent Fee", c.agentFee],
              ["Return", c.return],
            ];
            return (
              <article key={c._id || index} className="print-box">
                <div className="print-box-head">
                  <h3>
                    {index + 1}. {c.containerNo || "—"}
                  </h3>
                  <span>{(c.status || "pending").replace(/-/g, " ")}</span>
                </div>
                <div className="print-info print-info-sm">
                  <div>
                    <span>VOC No.</span>
                    <b>{c.vocNo || "—"}</b>
                  </div>
                  <div>
                    <span>Lorry</span>
                    <b>
                      {c.lorryNum || c.lorryId?.lorryNum || "Unassigned"}
                      {c.capacity || c.lorryId?.capacity
                        ? ` / ${c.capacity || c.lorryId?.capacity} ft`
                        : ""}
                    </b>
                  </div>
                  <div>
                    <span>Owner</span>
                    <b>
                      {(
                        c.lorryOwner ||
                        c.lorryId?.owner?.ownerName ||
                        "—"
                      ).toString().toUpperCase()}
                    </b>
                  </div>
                  <div>
                    <span>Destination</span>
                    <b>
                      {c.destinationlocation ||
                        c.destination?.location ||
                        "—"}
                    </b>
                  </div>
                  <div>
                    <span>Loading</span>
                    <b>{formatDate(c.loadingDate)}</b>
                  </div>
                  <div>
                    <span>Demount</span>
                    <b>{formatDate(c.demoundDate)}</b>
                  </div>
                </div>
                <table className="print-charges">
                  <tbody>
                    {Array.from({ length: 4 }).map((_, i) => {
                      const left = charges[i];
                      const right = charges[i + 4];
                      return (
                        <tr key={left[0] as string}>
                          <th>{left[0]}</th>
                          <td>{money(left[1] as number)}</td>
                          <th>{right[0]}</th>
                          <td>{money(right[1] as number)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="print-totals">
                  <div>
                    <span>Total</span>
                    <b>{money(tot)}</b>
                  </div>
                  <div>
                    <span>Paid</span>
                    <b>{money(paid)}</b>
                  </div>
                  <div className="print-balance">
                    <span>Balance</span>
                    <b>{money(tot - paid)}</b>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="print-footer-grid">
        <div>
          <h2>Record</h2>
          <div className="print-record">
            <p>
              <span>Created by</span>
              {nameOf(assignment?.createdBy)}
              <small>{formatDateTime(assignment?.createdAt)}</small>
            </p>
            <p>
              <span>Updated by</span>
              {nameOf(assignment?.updatedBy)}
              <small>{formatDateTime(assignment?.updatedAt)}</small>
            </p>
          </div>
        </div>
        <div>
          <h2>Financial summary</h2>
          <table className="print-summary">
            <tbody>
              <tr>
                <th>Total</th>
                <td>{money(total)}</td>
              </tr>
              <tr>
                <th>Advanced</th>
                <td>{money(advanced)}</td>
              </tr>
              <tr className="print-remain">
                <th>Remaining</th>
                <td>{money(remaining)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p className="print-note">
        Printed on {formatDateTime(new Date().toISOString())} · RG Brothers
        Logistics
      </p>
    </div>
  );
}

export default AssignmentPrint;
