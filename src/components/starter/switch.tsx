import * as React from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

/**
 * 无障碍开关：隐藏的 checkbox + 可视化轨道；表单提交与原生 checkbox 一致。
 */
const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(({ className, id, disabled, ...props }, ref) => {
  const innerId = React.useId();
  const cid = id ?? innerId;
  return (
    <div className={cn("inline-flex items-center gap-[var(--size-xs)]", className)}>
      <input ref={ref} id={cid} type="checkbox" role="switch" disabled={disabled} className="peer sr-only" {...props} />
      <label
        htmlFor={cid}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-inner transition-colors",
          "bg-input peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-disabled",
          "peer-checked:bg-primary peer-checked:border-primary",
          "before:pointer-events-none before:absolute before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-background before:shadow before:transition-transform before:content-['']",
          "peer-checked:before:translate-x-4",
        )}
      >
        <span className="sr-only">切换</span>
      </label>
    </div>
  );
});
Switch.displayName = "Switch";

export { Switch };
