"use client";

import { useId, type ComponentPropsWithRef } from "react";
import { LuChevronDown } from "react-icons/lu";
import { cn } from "@/lib/utils/cn";
import { describedBy, Field, fieldClasses, type FieldProps } from "./Field";

type SelectProps = ComponentPropsWithRef<"select"> & FieldProps;

export function Select({ id, label, hint, error, className, children, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <Field id={selectId} label={label} hint={hint} error={error}>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, hint, error)}
          className={cn(fieldClasses(Boolean(error)), "h-11 cursor-pointer appearance-none pr-10", className)}
          {...rest}
        >
          {children}
        </select>
        <LuChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-fg"
        />
      </div>
    </Field>
  );
}
