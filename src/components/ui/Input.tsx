"use client";

import { useId, type ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";
import { describedBy, Field, fieldClasses, type FieldProps } from "./Field";

type InputProps = ComponentPropsWithRef<"input"> & FieldProps;

export function Input({ id, label, hint, error, className, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field id={inputId} label={label} hint={hint} error={error}>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, hint, error)}
        className={cn(fieldClasses(Boolean(error)), "h-11", className)}
        {...rest}
      />
    </Field>
  );
}
