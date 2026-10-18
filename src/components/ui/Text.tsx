import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const variants = {
  body: "text-body",
  small: "text-small",
  caption: "text-caption font-semibold",
  number: "font-number text-number md:text-number-lg font-bold tabular-nums",
} as const;

const tones = {
  default: "text-fg",
  muted: "text-fg-muted",
  subtle: "text-fg-subtle",
} as const;

type TextProps = HTMLAttributes<HTMLElement> & {
  variant?: keyof typeof variants;
  tone?: keyof typeof tones;
  as?: "p" | "span" | "div" | "label" | "strong";
};

export function Text({ variant = "body", tone = "default", as: Tag = "p", className, ...rest }: TextProps) {
  return <Tag className={cn(variants[variant], tones[tone], className)} {...rest} />;
}
