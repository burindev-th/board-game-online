/**
 * Game Header Component
 * แสดงโจทย์, หัวใจ, และตัวนับเวลา
 */

"use client";

import { useState, useEffect } from "react";
import { LuClock } from "react-icons/lu";
import { Badge, Card } from "@/components/ui";
import { ThemeToggle } from "@/components/theme";
import { cn } from "@/lib/utils/cn";

interface GameHeaderProps {
  questionText: string;
  createdBy?: string;
  revealedCount: number;
  totalRounds: number;
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
}

export default function GameHeader({
  questionText,
  createdBy,
  revealedCount,
  totalRounds,
  hearts,
  phase,
  status,
  lastRevealResult,
  timeLeft,
  phaseEndTime,
}: GameHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

  const hearts3 = Array.from({ length: 3 }).map((_, i) => (
    <span
      key={i}
      className={cn(
        "transition-all duration-300 ease-in-out",
        isScrolled ? "text-h3" : "text-h2",
        i < currentHearts ? "opacity-100" : "opacity-30",
      )}
    >
      ❤️
    </span>
  ));

  const showTimer = phase !== "finished" && phaseEndTime && timeLeft !== undefined;
  const timerText = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <Card
      padding="none"
      style={{ position: "sticky", top: 10, zIndex: 50 }}
      className={cn(
        "my-2 mb-3 transition-all duration-300 ease-in-out md:mb-6",
        isScrolled ? "scale-95" : "scale-100",
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-6xl px-3 transition-all duration-300 ease-in-out md:px-4",
          isScrolled ? "py-1.5 md:py-2" : "py-2 md:py-3",
        )}
      >
        {/* Desktop Layout */}
        <div className="hidden items-stretch justify-between gap-4 md:flex">
          {/* Left: Question */}
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col justify-center rounded-md border-2 border-ink bg-warning px-4 text-on-status transition-all duration-300 ease-in-out",
              isScrolled ? "py-2" : "py-3",
            )}
          >
            <h2 className="truncate text-h3 font-bold">
              โจทย์ : {questionText}
            </h2>
            <div
              className={cn(
                "flex items-center gap-3 transition-all duration-300 ease-in-out",
                isScrolled ? "mt-0 h-0 opacity-0" : "mt-0.5 h-auto opacity-100",
              )}
            >
              {createdBy && <p className="text-caption">โดย {createdBy}</p>}
              <span className="text-caption">•</span>
              <p className="text-caption">
                {revealedCount}/{totalRounds} เลข
              </p>
            </div>
          </div>

          {/* Center: Hearts */}
          <Badge
            tone="neutral"
            className={cn(
              "gap-2 px-4 transition-all duration-300 ease-in-out",
              isScrolled ? "py-2" : "py-3",
            )}
          >
            {hearts3}
          </Badge>

          {/* Right: Timer */}
          {showTimer && (
            <Badge
              tone="neutral"
              className={cn(
                "gap-2 px-4 transition-all duration-300 ease-in-out",
                isScrolled ? "py-2" : "py-3",
              )}
            >
              <LuClock aria-hidden />
              <span className="text-h3 font-bold tabular-nums">{timerText}</span>
            </Badge>
          )}

          <ThemeToggle className="self-center" />
        </div>

        {/* Mobile Layout */}
        <div className="space-y-2 md:hidden">
          {/* Question */}
          <div className="rounded-md border-2 border-ink bg-warning px-3 py-2 text-on-status">
            <h2 className="truncate text-body font-bold">{questionText}</h2>
            <div className="mt-0.5 flex items-center gap-2">
              {createdBy && (
                <p className="truncate text-caption">โดย {createdBy}</p>
              )}
              <span className="text-caption">•</span>
              <p className="text-caption">
                {revealedCount}/{totalRounds}
              </p>
            </div>
          </div>

          {/* Hearts + Timer Row (wraps onto 2 rows on very narrow screens) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge tone="neutral" className="gap-1.5 px-3 py-1.5">
              {hearts3}
            </Badge>

            <div className="flex items-center gap-2">
              {showTimer && (
                <Badge tone="neutral" className="gap-2 px-3 py-1.5">
                  <LuClock aria-hidden />
                  <span className="text-body font-bold tabular-nums">
                    {timerText}
                  </span>
                </Badge>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
