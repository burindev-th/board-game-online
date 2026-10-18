import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type Tone = "neutral" | "primary" | "secondary" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-fg",
  primary: "bg-primary text-primary-on",
  secondary: "bg-secondary text-secondary-on",
  success: "bg-success text-on-status",
  warning: "bg-warning text-on-status",
  danger: "bg-danger text-on-status",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export function Badge({ tone = "neutral", className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-sm border-2 border-ink px-2 py-0.5 text-caption font-semibold",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
