/**
 * Game Header Component
 * โจทย์, รอบ, หัวใจ, เวลา, ขั้นตอน และเลขของคุณ
 * - การ์ดเต็มอยู่ในหน้าตามปกติ (ไม่ sticky จึงไม่มี layout shift)
 * - เมื่อการ์ดเต็มเลื่อนพ้นจอ แถบย่อจะสไลด์ลงมาจากขอบบน (animate แค่ transform จึงลื่น)
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { LuClock } from "react-icons/lu";
import { Card, Hearts } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

interface GameHeaderProps {
  questionText: string;
  createdBy?: string;
  revealedCount: number;
  totalRounds: number;
  currentLevel: number;
  totalLevels: number;
  hearts: number;
  phase: string;
  status: string;
  lastRevealResult?: {
    number: number;
    isCorrect: boolean;
    heartsLost: number;
    newHearts: number;
  } | null;
  timeLeft?: number;
  phaseEndTime?: Date | null;
  myNumbers: { number: number; isRevealed: boolean }[];
}

const STEPS = [
  { key: "writing", label: "เขียนคำใบ้" },
  { key: "voting", label: "โหวต" },
  { key: "reveal", label: "เปิดเลข" },
] as const;

export default function GameHeader({
  questionText,
  createdBy,
  revealedCount,
  totalRounds,
  currentLevel,
  totalLevels,
  hearts,
  phase,
  status,
  lastRevealResult,
  timeLeft,
  phaseEndTime,
  myNumbers,
}: GameHeaderProps) {
  const fullRef = useRef<HTMLDivElement>(null);
  const [showCompact, setShowCompact] = useState(false);

  // แสดงแถบย่อเมื่อการ์ดเต็มพ้นขอบบนของจอไปแล้ว
  useEffect(() => {
    const el = fullRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setShowCompact(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: "-48px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // คำนวณหัวใจที่แสดง
  let currentHearts = hearts;
  if (phase === "reveal" && lastRevealResult) {
    currentHearts = lastRevealResult.newHearts;
  } else if (phase === "finished" && status === "lost") {
    currentHearts = 0;
  }

  const minutes = timeLeft ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft ? timeLeft % 60 : 0;
  const showTimer = phase !== "finished" && !!phaseEndTime && timeLeft !== undefined;
  const timerText = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const timeLow = showTimer && (timeLeft ?? 0) <= 30;

  const stepIndex = STEPS.findIndex((s) => s.key === phase);
  const roundText = `รอบ ${currentLevel}/${totalLevels} · เปิดแล้ว ${revealedCount}/${totalRounds} เลข`;

  // แถว หัวใจ · เลขของคุณ · เวลา (ใช้ทั้งการ์ดเต็มและแถบย่อ)
  const statsRow = (
    <>
      <Hearts total={3} remaining={currentHearts} size="md" className="shrink-0" />

      <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
        {myNumbers.length > 0 && (
          <>
            <span className="hidden text-caption font-semibold text-fg-muted sm:inline">
              เลขของคุณ
            </span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {myNumbers.map((n, i) => (
                <span
                  key={i}
                  className={cn(
                    "min-w-[2.5rem] rounded-sm border-2 border-ink px-1.5 text-center font-number text-h3 font-bold tabular-nums",
                    n.isRevealed
                      ? "bg-surface-muted text-fg-subtle line-through"
                      : "bg-primary text-primary-on shadow-brutal-sm",
                  )}
                  aria-label={n.isRevealed ? `เลข ${n.number} (เปิดแล้ว)` : `เลขของคุณ ${n.number}`}
                >
                  {n.number}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {showTimer && (
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-sm border-2 border-ink px-2 py-0.5",
            timeLow ? "animate-pulse bg-danger text-on-status" : "bg-surface-muted text-fg",
          )}
          aria-label={`เวลาที่เหลือ ${timerText}`}
        >
          <LuClock className="h-4 w-4" aria-hidden />
          <span className="text-body font-bold tabular-nums">{timerText}</span>
        </span>
      )}
    </>
  );

  return (
    <>
      {/* การ์ดเต็ม */}
      <div ref={fullRef} className="mb-4 md:mb-6">
        <Card padding="none" className="overflow-hidden">
          <div className="border-b-2 border-ink bg-warning px-3 py-2 text-on-status md:px-4 md:py-3">
            <div className="flex items-center justify-between gap-2 text-caption font-semibold">
              <span>{roundText}</span>
              {createdBy && <span className="truncate opacity-80">โจทย์โดย {createdBy}</span>}
            </div>
            <h2 className="line-clamp-3 font-heading text-h3 font-bold leading-snug md:text-h2">
              {questionText}
            </h2>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 md:gap-4 md:px-4">{statsRow}</div>

          {/* ขั้นตอนของรอบ: ให้รู้ว่าตอนนี้ต้องทำอะไร */}
          {stepIndex >= 0 && (
            <ol className="flex border-t-2 border-ink text-caption font-semibold" aria-label="ขั้นตอน">
              {STEPS.map((step, i) => (
                <li
                  key={step.key}
                  aria-current={i === stepIndex ? "step" : undefined}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1 py-1.5",
                    i > 0 && "border-l-2 border-ink",
                    i === stepIndex && "bg-secondary text-secondary-on",
                    i < stepIndex && "text-fg-muted",
                    i > stepIndex && "text-fg-subtle",
                  )}
                >
                  <span className="tabular-nums">{i + 1}.</span> {step.label}
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {/* แถบย่อ: fixed เต็มความกว้างจอ สไลด์ลงด้วย transform อย่างเดียว */}
      <div
        aria-hidden={!showCompact}
        inert={!showCompact}
        className={cn(
          "fixed inset-x-0 top-0 z-30 border-b-2 border-ink bg-surface text-fg shadow-[0_4px_0_0_rgb(var(--color-ink))]",
          "transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none",
          showCompact ? "translate-y-0" : "-translate-y-[calc(100%+8px)]",
        )}
      >
        <div className="border-b-2 border-ink bg-warning text-on-status">
          <div className="mx-auto flex max-w-5xl items-baseline gap-2 px-4 py-1.5 md:px-8">
            <span className="shrink-0 text-caption font-semibold tabular-nums">
              รอบ {currentLevel}/{totalLevels}
            </span>
            <p className="min-w-0 flex-1 truncate font-heading text-body font-bold md:text-h3">
              {questionText}
            </p>
          </div>
        </div>
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-1.5 md:gap-4 md:px-8">
          {statsRow}
        </div>
      </div>
    </>
  );
}
