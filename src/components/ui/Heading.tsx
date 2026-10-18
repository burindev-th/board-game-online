import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type HeadingLevel = "display" | "h1" | "h2" | "h3";

const levelClasses: Record<HeadingLevel, string> = {
  display: "text-display md:text-display-lg font-bold",
  h1: "text-h1 md:text-h1-lg font-bold",
  h2: "text-h2 md:text-h2-lg font-bold",
  h3: "text-h3 md:text-h3-lg font-semibold",
};

const defaultTag = { display: "h1", h1: "h1", h2: "h2", h3: "h3" } as const;

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: HeadingLevel;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
};

export function Heading({ level = "h1", as, className, ...rest }: HeadingProps) {
  const Tag = as ?? defaultTag[level];
  return <Tag className={cn("font-heading text-fg", levelClasses[level], className)} {...rest} />;
}
