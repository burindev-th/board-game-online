/**
 * Player Progress Component
 * แสดงความคืบหน้า (ส่งคำใบ้/โหวต) แบบเห็นทันที: แถบ progress + รายชื่อว่าใครเสร็จ ใครกำลังรอ
 */

"use client";

import { LuCheck, LuHourglass } from "react-icons/lu";
import { Badge } from "@/components/ui";

interface PlayerProgressProps {
  label: string;
  done: number;
  total: number;
  players: { id: string; name: string; done: boolean; detail?: string }[];
}

export default function PlayerProgress({ label, done, total, players }: PlayerProgressProps) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-small font-semibold">
        <span>{label}</span>
        <span className="tabular-nums">
          {done}/{total}
        </span>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full border-2 border-ink bg-surface-muted"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div
          className="h-full bg-success transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {players.map((p) => (
          <Badge key={p.id} tone={p.done ? "success" : "neutral"}>
            {p.done ? (
              <LuCheck className="h-3.5 w-3.5" aria-label="เสร็จแล้ว" />
            ) : (
              <LuHourglass className="h-3.5 w-3.5" aria-label="กำลังรอ" />
            )}
            {p.name}
            {p.detail && <span className="tabular-nums opacity-80">{p.detail}</span>}
          </Badge>
        ))}
      </div>
    </div>
  );
}
