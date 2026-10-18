"use client";

import { useId, type ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";
import { describedBy, Field, fieldClasses, type FieldProps } from "./Field";

type TextareaProps = ComponentPropsWithRef<"textarea"> & FieldProps;

export function Textarea({ id, label, hint, error, className, rows = 4, ...rest }: TextareaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  return (
    <Field id={textareaId} label={label} hint={hint} error={error}>
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(textareaId, hint, error)}
        className={cn(fieldClasses(Boolean(error)), "resize-y py-3", className)}
        {...rest}
      />
    </Field>
  );
}
