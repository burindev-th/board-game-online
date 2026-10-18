import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const variants = {
  default: "bg-surface",
  muted: "bg-surface-muted",
  primary: "bg-primary text-primary-on",
} as const;

const paddings = {
  none: "",
  sm: "p-3 md:p-4",
  md: "p-4 md:p-6",
  lg: "p-6 md:p-10",
} as const;

type CardOptions = {
  variant?: keyof typeof variants;
  padding?: keyof typeof paddings;
  interactive?: boolean;
};

export function cardClasses({ variant = "default", padding = "md", interactive = false }: CardOptions = {}) {
  return cn(
    "block rounded-lg border-2 border-ink text-fg",
    variants[variant],
    paddings[padding],
    interactive ? "brutal-press cursor-pointer" : "shadow-brutal",
  );
}

type CardProps = HTMLAttributes<HTMLDivElement> & CardOptions;

export function Card({ variant, padding, interactive, className, ...rest }: CardProps) {
  return <div className={cn(cardClasses({ variant, padding, interactive }), className)} {...rest} />;
}
