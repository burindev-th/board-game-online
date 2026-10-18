import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./Button";

const squareSizes: Record<ButtonSize, string> = {
  sm: "h-9 w-9 text-small",
  md: "h-11 w-11 text-body",
  lg: "h-14 w-14 text-h3",
};

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: ReactNode;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function IconButton({
  icon,
  label,
  variant = "outline",
  size = "md",
  type = "button",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(buttonClasses({ variant, size }), "px-0", squareSizes[size], className)}
      {...rest}
    >
      {icon}
    </button>
  );
}
