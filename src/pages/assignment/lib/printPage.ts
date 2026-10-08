import { containerBalance, roundMoney, toAmount } from "./financials";

export function containerAfterPayment(
  previous: any,
  updated: any,
  balanceDate: string
) {
  const source = updated || previous;
  if (!source) return source;
  if (containerBalance(source) <= 0) return source;
  const base = previous || source;
  const remaining = containerBalance(base);
  if (remaining <= 0) return source;
  return {
    ...source,
    balancePaid: roundMoney(toAmount(base.balancePaid) + remaining),
    balanceDate: source.balanceDate || balanceDate,
  };
}

export function whenDialogClosed() {
  return new Promise<void>((resolve) => {
    const started = performance.now();
    const tick = () => {
      const dialog = document.querySelector("[role='dialog']");
      const locked = document.body.hasAttribute("data-scroll-locked");
      if ((!dialog && !locked) || performance.now() - started > 1500) {
        resolve();
        return;
      }
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  });
}

export function nextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

export function openPrintDialog(title: string, onFinish?: () => void) {
  const previousTitle = document.title;
  document.title = title;
  const style = document.createElement("style");
  style.setAttribute("data-print-page", "");
  style.textContent =
    "@media print { @page { size: A4 landscape; margin: 8mm; } }";
  document.head.appendChild(style);

  let finished = false;
  const started = performance.now();
  const finish = () => {
    if (finished) return;
    finished = true;
    document.title = previousTitle;
    style.remove();
    window.removeEventListener("afterprint", onAfterPrint);
    onFinish?.();
  };
  const onAfterPrint = () => {
    if (performance.now() - started < 150) return;
    finish();
  };

  window.addEventListener("afterprint", onAfterPrint);
  window.print();
  window.setTimeout(finish, 120000);
}
