/**
 * Reveal Phase Component (Mobile-First Redesign)
 * Optimized for single-screen view without scrolling
 */

"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Card, Modal, Text } from "@/components/ui";

type ItoPlayerAnswer = {
  playerId: string;
  playerName: string;
  number: number;
  answer: string;
  isRevealed: boolean;
  isCorrect?: boolean;
};

interface RevealPhaseProps {
  playerAnswers: ItoPlayerAnswer[];
  gameState: {
    revealedNumbers: number[];
    status: string;
  };
  lastRevealResult: {
    number: number;
    isCorrect: boolean;
    heartsLost: number;
    newHearts: number;
  } | null;
}

export default function RevealPhase({
  playerAnswers,
  gameState,
  lastRevealResult,
}: RevealPhaseProps) {
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!lastRevealResult) return null;

  const votedNumber = lastRevealResult.number;
  const votedAnswer = playerAnswers.find((a) => a.number === votedNumber);
  if (!votedAnswer) return null;

  const isCorrect = lastRevealResult.isCorrect;
  const heartsLost = lastRevealResult.heartsLost;

  // หาเลขที่เปิดในรอบนี้
  const revealedThisRound = playerAnswers
    .filter((a) => a.isRevealed && a.number <= votedNumber)
    .map((a) => a.number)
    .filter((num, index, self) => self.indexOf(num) === index)
    .sort((a, b) => a - b);

  const skippedNumbers = !isCorrect
    ? revealedThisRound.filter((num) => num < votedNumber)
    : [];

  const isAutoRevealed = revealedThisRound.length > 1;

  return (
    <Modal open onClose={() => {}} dismissible={false} ariaLabel="เปิดเผยตัวเลข" size="md">
      <div className="space-y-3">
        {/* Header: Result Status */}
        <Alert tone={isCorrect ? "success" : "danger"} className="items-center justify-center">
          <span className="text-h2 font-bold">
            {isCorrect ? "ถูกต้อง!" : "ผิด!"}
          </span>
        </Alert>

        {/* Voted Number Card - Compact */}
        <Card variant="muted" padding="sm">
          {/* Number + Hint in single row */}
          <div className="flex items-center gap-4">
            {/* Number */}
            <div className="shrink-0 rounded-lg border-2 border-ink bg-primary px-4 py-2 font-number text-number font-bold tabular-nums text-primary-on md:text-number-lg">
              {votedAnswer.number}
            </div>

            {/* Hint */}
            <div className="min-w-0 flex-1">
              <Text variant="caption" tone="muted" as="div" className="mb-0.5">
                {votedAnswer.playerName}
              </Text>
              <Text as="div" className="truncate italic">
                &quot;{votedAnswer.answer}&quot;
              </Text>
            </div>
          </div>

          {/* Skipped Numbers (if wrong) */}
          {skippedNumbers.length > 0 && (
            <div className="mt-3 border-t-2 border-ink pt-3">
              <div className="flex items-center justify-between gap-2">
                <Text variant="caption" tone="muted" as="span">
                  ข้ามไป:
                </Text>
                <div className="flex flex-wrap justify-end gap-2">
                  {skippedNumbers.map((num) => (
                    <Badge key={num} tone="danger">
                      {num}
                    </Badge>
                  ))}
                </div>
              </div>
              <Text variant="caption" tone="muted" className="mt-1 text-right">
                -❤️ {heartsLost} ดวง
              </Text>
            </div>
          )}

          {/* Auto-reveal indicator */}
          {isAutoRevealed && (
            <Text variant="caption" tone="subtle" className="mt-2 border-t-2 border-ink pt-2 text-center">
              ⚡ เปิดเลขสุดท้ายอัตโนมัติ
            </Text>
          )}
        </Card>

        {/* Progress: Revealed Numbers - Minimal */}
        <Card variant="muted" padding="sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Text variant="caption" tone="muted" as="span">
              เปิดแล้ว:
            </Text>
            <Badge tone="neutral">{gameState.revealedNumbers.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {gameState.revealedNumbers.map((num, i) => (
              <Badge
                key={i}
                tone={
                  i === gameState.revealedNumbers.length - 1
                    ? "warning"
                    : "neutral"
                }
              >
                {num}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Countdown - Compact */}
        <div className="pt-2 text-center">
          <div className="mb-1 font-number text-h1 font-bold tabular-nums text-fg">
            {countdown}
          </div>
          <Text variant="caption" tone="subtle">
            {gameState.status === "won" || gameState.status === "lost"
              ? "กำลังสรุปผล..."
              : "เตรียมรอบต่อไป..."}
          </Text>
        </div>
      </div>
    </Modal>
  );
}
