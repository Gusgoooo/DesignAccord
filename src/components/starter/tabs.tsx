import * as React from "react";

import { cn } from "@/lib/utils";

type TabsCtx = {
  value: string;
  setValue: (v: string) => void;
};

const TabsContext = React.createContext<TabsCtx | null>(null);

function useTabsContext(comp: string): TabsCtx {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error(`${comp} must be used within <Tabs>`);
  return ctx;
}

export function Tabs({
  defaultValue,
  value: valueProp,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? "");
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : uncontrolled;
  const setValue = React.useCallback(
    (v: string) => {
      onValueChange?.(v);
      if (!controlled) setUncontrolled(v);
    },
    [controlled, onValueChange],
  );
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex h-[var(--control-height)] items-center justify-start rounded-md bg-muted p-xxs text-muted-foreground", className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  value,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { value: selected, setValue } = useTabsContext("TabsTrigger");
  const active = selected === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-sm py-xxs text-sm font-medium ring-offset-background transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-disabled",
        active ? "bg-background text-foreground shadow" : "hover:text-foreground",
        className,
      )}
      onClick={() => setValue(value)}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  value,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { value: selected } = useTabsContext("TabsContent");
  if (selected !== value) return null;
  return (
    <div
      role="tabpanel"
      data-state={selected === value ? "active" : "inactive"}
      className={cn("mt-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    />
  );
}
