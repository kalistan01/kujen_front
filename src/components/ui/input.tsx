import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      const el = innerRef.current;
      if (!el || type !== "number") return;
      const preventScrollChange = (event: WheelEvent) => {
        event.preventDefault();
      };
      el.addEventListener("wheel", preventScrollChange, { passive: false });
      return () => el.removeEventListener("wheel", preventScrollChange);
    }, [type]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
