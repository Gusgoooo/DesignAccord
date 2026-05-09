import * as React from "react";

import { cn } from "@/lib/utils";

type PopCtx = { open: boolean; setOpen: (v: boolean) => void };

const PopoverContext = React.createContext<PopCtx | null>(null);

function usePopover(name: string): PopCtx {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error(`${name} must be used within <Popover>`);
  return ctx;
}

export function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = usePopover("PopoverTrigger");
  return (
    <button type="button" className={className} onClick={() => setOpen(!open)} {...props}>
      {children}
    </button>
  );
}

export function PopoverContent({
  className,
  children,
  align = "center",
  style,
}: {
  className?: string;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  style?: React.CSSProperties;
}) {
  const { open, setOpen } = usePopover("PopoverContent");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const t = window.setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "absolute z-50 mt-xs min-w-[var(--layout-min-w-xs)] rounded-md border border-border bg-popover p-base text-popover-foreground shadow-md outline-none",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && "right-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
