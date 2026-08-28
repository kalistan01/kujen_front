import { Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDate } from "../lib/dates";
import {
  FCL_STEPS,
  fclStepUnlocked,
  parseFcl,
  setFclEnabled,
  setFclStepDate,
  toggleFclStep,
  type FclState,
} from "../lib/fcl";

function FclRecord({
  fcl,
  onChange,
  disabled,
  formatStepDate = formatDate,
  className,
}: {
  fcl?: unknown;
  onChange?: (next: FclState) => void;
  disabled?: boolean;
  formatStepDate?: (value?: string | Date) => string;
  className?: string;
}) {
  const state = parseFcl(fcl);
  const editable = Boolean(onChange) && !disabled;

  if (!state.enabled && !editable) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5",
        className
      )}
    >
      {editable ? (
        <label className="mb-2 flex items-center gap-2">
          <Checkbox
            checked={state.enabled}
            onCheckedChange={(checked) =>
              onChange?.(setFclEnabled(state, Boolean(checked)))
            }
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            FCL
          </span>
        </label>
      ) : (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          FCL
        </p>
      )}

      {state.enabled ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {FCL_STEPS.map((step) => {
            const current = state[step.key];
            const unlocked = fclStepUnlocked(state, step.key);
            return (
              <div key={step.key} className="min-w-0">
                {editable ? (
                  <>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Checkbox
                        checked={current.done}
                        disabled={!unlocked}
                        onCheckedChange={(checked) =>
                          onChange?.(
                            toggleFclStep(state, step.key, Boolean(checked))
                          )
                        }
                      />
                      {step.label}
                    </label>
                    <Input
                      type="date"
                      value={current.date}
                      disabled={!current.done}
                      onChange={(e) =>
                        onChange?.(setFclStepDate(state, step.key, e.target.value))
                      }
                      className="mt-1.5 h-8"
                    />
                  </>
                ) : (
                  <>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {current.done ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" />
                      )}
                      {step.label}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 pl-5 font-medium",
                        current.done ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {current.done && current.date
                        ? formatStepDate(current.date)
                        : "—"}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Turn on FCL to record received, shipping line, and payment dates.
        </p>
      )}
    </div>
  );
}

export default FclRecord;
