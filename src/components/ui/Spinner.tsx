import { cn } from "@/lib/utils/cn";

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
} as const;

type SpinnerProps = {
  size?: keyof typeof sizes;
  label?: string;
  className?: string;
};

export function Spinner({ size = "md", label = "กำลังโหลด", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent",
        sizes[size],
        className,
      )}
    />
  );
}
