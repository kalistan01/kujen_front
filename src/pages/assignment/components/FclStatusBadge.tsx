import { formatDate } from "../lib/dates";
import { fclStepRecords, parseFcl } from "../lib/fcl";

function FclStatusBadge({ fcl }: { fcl?: unknown }) {
  const state = parseFcl(fcl);
  if (!state.enabled) {
    return <span className="text-muted-foreground">—</span>;
  }

  const steps = fclStepRecords(state);
  const done = steps.filter((step) => step.done);

  if (!done.length) {
    return <span className="text-muted-foreground">Pending</span>;
  }

  return (
    <div className="space-y-1">
      {steps.map((step) => (
        <p
          key={step.key}
          className={
            step.done
              ? "text-xs font-medium leading-tight"
              : "text-xs leading-tight text-muted-foreground"
          }
        >
          <span>{step.label}</span>
          <span className="ml-1.5 font-normal text-muted-foreground">
            {step.done && step.date ? formatDate(step.date) : "—"}
          </span>
        </p>
      ))}
    </div>
  );
}

export default FclStatusBadge;
