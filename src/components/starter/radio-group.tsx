import * as React from "react";

import { cn } from "@/lib/utils";

type RadioCtx = {
  name: string;
  value: string;
  setValue: (v: string) => void;
};

const RadioGroupContext = React.createContext<RadioCtx | null>(null);

function useRadioGroup(name: string): RadioCtx {
  const ctx = React.useContext(RadioGroupContext);
  if (!ctx) throw new Error(`${name} must be used within <RadioGroup>`);
  return ctx;
}

export function RadioGroup({
  className,
  defaultValue,
  value: valueProp,
  onValueChange,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
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
  const name = React.useId();
  return (
    <RadioGroupContext.Provider value={{ name, value, setValue }}>
      <div role="radiogroup" className={cn("grid gap-[var(--size-xs)]", className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export function RadioGroupItem({
  className,
  value,
  id,
  disabled,
  onChange,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { value: string }) {
  const ctx = useRadioGroup("RadioGroupItem");
  const rid = id ?? `${ctx.name}-${value}`;
  return (
    <input
      {...props}
      id={rid}
      type="radio"
      name={ctx.name}
      value={value}
      checked={ctx.value === value}
      disabled={disabled}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-input bg-background text-primary accent-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-disabled",
        className,
      )}
      onChange={(e) => {
        onChange?.(e);
        ctx.setValue(value);
      }}
    />
  );
}
