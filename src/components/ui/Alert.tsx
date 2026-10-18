import type { ReactNode } from "react";
import { LuCircleCheck, LuCircleX, LuInfo, LuTriangleAlert } from "react-icons/lu";
import { cn } from "@/lib/utils/cn";

type AlertTone = "info" | "success" | "warning" | "danger";

const tones: Record<AlertTone, { box: string; icon: ReactNode }> = {
  info: { box: "bg-secondary text-secondary-on", icon: <LuInfo /> },
  success: { box: "bg-success text-on-status", icon: <LuCircleCheck /> },
  warning: { box: "bg-warning text-on-status", icon: <LuTriangleAlert /> },
  danger: { box: "bg-danger text-on-status", icon: <LuCircleX /> },
};

type AlertProps = {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function Alert({ tone = "info", title, children, className }: AlertProps) {
  const { box, icon } = tones[tone];
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg border-2 border-ink p-4 shadow-brutal-sm", box, className)}
    >
      <span aria-hidden className="mt-0.5 shrink-0 text-h3">
        {icon}
      </span>
      <div className="min-w-0 text-small">
        {title && <p className="font-heading font-bold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
