import type { ReactNode } from "react";
import { FaCrown } from "react-icons/fa6";
import { getPlayerColor } from "@/lib/theme/playerColors";
import { cn } from "@/lib/utils/cn";
import { Badge } from "./Badge";

type PlayerChipProps = {
  name: string;
  colorIndex: number;
  isHost?: boolean;
  status?: ReactNode;
  className?: string;
};

export function PlayerChip({ name, colorIndex, isHost = false, status, className }: PlayerChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border-2 border-ink bg-surface px-3 py-2 text-fg shadow-brutal-sm",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink font-heading font-bold text-on-status"
        style={{ backgroundColor: getPlayerColor(colorIndex) }}
      >
        {name.trim().charAt(0).toUpperCase() || "?"}
      </span>
      <span className="min-w-0 flex-1 truncate font-semibold">{name}</span>
      {isHost && (
        <Badge tone="primary">
          <FaCrown aria-hidden />
          หัวห้อง
        </Badge>
      )}
      {status}
    </div>
  );
}
