import * as React from "react";

import { cn } from "@/lib/utils";

type MenuCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const DropdownMenuContext = React.createContext<MenuCtx | null>(null);

function useMenuContext(name: string): MenuCtx {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) throw new Error(`${name} must be used within <DropdownMenu>`);
  return ctx;
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useMenuContext("DropdownMenuTrigger");
  return (
    <button
      type="button"
      aria-expanded={open}
      className={className}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  className,
  align = "start",
  children,
  style,
}: {
  className?: string;
  align?: "start" | "end";
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { open, setOpen } = useMenuContext("DropdownMenuContent");
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (contentRef.current?.contains(t)) return;
      setOpen(false);
    };
    const id = window.setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      role="menu"
      style={style}
      className={cn(
        "absolute z-50 mt-xxs min-w-[var(--layout-min-w-2xs)] rounded-md border border-border bg-popover p-xxs text-popover-foreground shadow-md",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  className,
  inset,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { inset?: boolean }) {
  const { setOpen } = useMenuContext("DropdownMenuItem");
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-xs py-xxs text-sm outline-none transition-colors",
        "focus:bg-accent focus:text-accent-foreground",
        inset && "pl-xl",
        className,
      )}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(false);
      }}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("-mx-xxs my-xxs h-px bg-border", className)} {...props} />;
}
