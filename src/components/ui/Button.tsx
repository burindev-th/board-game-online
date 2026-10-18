/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-on brutal-press",
  secondary: "bg-secondary text-secondary-on brutal-press",
  outline: "bg-surface text-fg brutal-press",
  ghost: "border-transparent bg-transparent text-fg hover:bg-surface-muted",
  danger: "bg-danger text-on-status brutal-press",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-3 text-small",
  md: "h-11 gap-2 px-5 text-body",
  lg: "h-14 gap-2.5 px-7 text-h3",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean } = {}) {
  return cn(
    "inline-flex select-none whitespace-nowrap items-center justify-center rounded-md border-2 border-ink font-heading font-bold",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
  );
}

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

type NativeButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & { href?: undefined };
type LinkButtonProps = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps | "href"> & { href: string };

export type ButtonProps = NativeButtonProps | LinkButtonProps;

export function Button(props: ButtonProps) {
  const { variant, size, fullWidth, loading = false, icon, className, children } = props;
  const classes = cn(buttonClasses({ variant, size, fullWidth }), className);
  const content = (
    <>
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </>
  );

  if (props.href !== undefined) {
    const {
      variant: _v, size: _s, fullWidth: _f, loading: _l, icon: _i, className: _c, children: _ch,
      href, ...anchorProps
    } = props;
    return (
      <Link href={href} className={classes} aria-disabled={loading || undefined} {...anchorProps}>
        {content}
      </Link>
    );
  }

  const {
    variant: _v, size: _s, fullWidth: _f, loading: _l, icon: _i, className: _c, children: _ch,
    href: _h, type = "button", disabled, ...buttonProps
  } = props;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...buttonProps}
    >
      {content}
    </button>
  );
}
