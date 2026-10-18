import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
};

export function fieldClasses(hasError: boolean) {
  return cn(
    "w-full rounded-md border-2 border-ink bg-surface px-4 text-body text-fg shadow-brutal-sm",
    "placeholder:text-fg-subtle transition-shadow duration-fast focus:shadow-brutal",
    "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
    hasError && "border-danger",
  );
}

export function describedBy(id: string, hint?: ReactNode, error?: ReactNode) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

export function Field({ id, label, hint, error, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-small font-semibold text-fg">
          {label}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-caption font-normal text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-caption text-fg">
          <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-ink bg-danger" />
          {error}
        </p>
      )}
    </div>
  );
}
