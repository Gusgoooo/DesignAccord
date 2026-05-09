import * as React from "react";

import { cn } from "@/lib/utils";

type DialogCtx = { open: boolean; setOpen: (v: boolean) => void };

const DialogContext = React.createContext<DialogCtx | null>(null);

function useDialogContext(component: string): DialogCtx {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error(`${component} must be used within <Dialog>`);
  return ctx;
}

export function Dialog({
  children,
  open: openProp,
  onOpenChange,
  defaultOpen,
}: {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolled, setUncontrolled] = React.useState(!!defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolled;
  const setOpen = React.useCallback(
    (v: boolean) => {
      onOpenChange?.(v);
      if (!controlled) setUncontrolled(v);
    },
    [controlled, onOpenChange],
  );
  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
}

export const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
  const { setOpen } = useDialogContext("DialogTrigger");
  return (
    <button
      type="button"
      ref={ref}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(true);
      }}
      {...props}
    >
      {children}
    </button>
  );
});
DialogTrigger.displayName = "DialogTrigger";

export function DialogContent({
  className,
  children,
  style,
}: {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { open, setOpen } = useDialogContext("DialogContent");
  const dlgRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const el = dlgRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else if (el.open) el.close();
  }, [open]);

  React.useEffect(() => {
    const el = dlgRef.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      setOpen(false);
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [setOpen]);

  return (
    <dialog
      ref={dlgRef}
      className={cn(
        "fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0",
        "backdrop:bg-[var(--color-bg-mask)] open:flex open:items-center open:justify-center open:p-base",
        className,
      )}
      onClick={(e) => {
        if (e.target === dlgRef.current) setOpen(false);
      }}
    >
      <div
        className="w-full max-w-[var(--layout-max-w-lg)] rounded-lg border border-border bg-background p-lg shadow-lg"
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </dialog>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-xxs text-left", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse gap-[var(--size-xs)] pt-base sm:flex-row sm:justify-end", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function DialogClose({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialogContext("DialogClose");
  return (
    <button type="button" className={className} onClick={() => setOpen(false)} {...props}>
      {children}
    </button>
  );
}
