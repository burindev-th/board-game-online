/**
 * Finished Phase Component
 * Phase สำหรับแสดงผลสรุปเกม
 */

"use client";

import { Badge, Button, Card, Heading, Text } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

type ItoPlayerAnswer = {
  playerId: string;
  playerName: string;
  number: number;
  answer: string;
  isRevealed: boolean;
  isCorrect?: boolean;
};

interface FinishedPhaseProps {
  playerAnswers: ItoPlayerAnswer[];
  gameState: {
    status: string;
    hearts: number;
    revealedNumbers: number[];
    totalRounds: number;
  };
}

export default function FinishedPhase({
  playerAnswers,
  gameState,
}: FinishedPhaseProps) {
  const finalHearts = gameState.status === "lost" ? 0 : gameState.hearts;

  return (
    <Card padding="lg" className="text-center">
      {gameState.status === "won" ? (
        <>
          <div className="mb-4 animate-bounce text-display md:mb-6 md:text-display-lg">🎉</div>
          <Heading level="display" className="mb-3 text-center md:mb-4">
            ชนะแล้ว!
          </Heading>
          <Text tone="muted" className="mb-4 text-center md:mb-6">
            คุณและเพื่อนๆ ผ่านเกมได้สำเร็จ
          </Text>
        </>
      ) : (
        <>
          <div className="mb-4 text-display md:mb-6 md:text-display-lg">💔</div>
          <Heading level="display" className="mb-3 text-center md:mb-4">
            แพ้แล้ว
          </Heading>
          <Text tone="muted" className="mb-4 text-center md:mb-6">
            หัวใจหมดแล้ว ลองใหม่อีกครั้งนะ!
          </Text>
        </>
      )}

      {/* Summary Box */}
      <Card variant="muted" padding="md" className="mx-auto mb-6 max-w-md md:mb-8">
        <Heading level="h2" as="h4" className="mb-4 md:mb-6">
          สรุปผล
        </Heading>

        {/* Hearts */}
        <div className="mb-4 md:mb-6">
          <Text variant="small" tone="muted" className="mb-2">
            หัวใจคงเหลือ:
          </Text>
          <div className="mb-2 flex justify-center gap-1.5 md:gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "text-h1",
                  i >= finalHearts && "opacity-30 grayscale"
                )}
              >
                ❤️
              </div>
            ))}
          </div>
          <Badge tone="danger">{finalHearts} / 3</Badge>
        </div>

        {/* Rounds */}
        <div className="mb-4 md:mb-6">
          <Text variant="small" tone="muted" className="mb-2">
            เลขที่เปิดแล้ว:
          </Text>
          <Badge tone="neutral">
            {gameState.revealedNumbers.length} / {gameState.totalRounds}
          </Badge>
        </div>

        {/* Result */}
        <div className="border-t-2 border-ink pt-4 md:pt-6">
          {gameState.status === "won" ? (
            <Badge tone="success">✅ ชนะ</Badge>
          ) : (
            <Badge tone="danger">❌ แพ้</Badge>
          )}
        </div>
      </Card>

      {/* Show all numbers (revealed + unrevealed) */}
      <div className="mx-auto mt-6 max-w-6xl md:mt-8">
        <Heading level="h3" as="h4" className="mb-3 text-center md:mb-4">
          ตัวเลขทั้งหมด:
        </Heading>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3">
          {/* เลขที่เปิดแล้ว */}
          {playerAnswers
            .filter((a) => a.isRevealed)
            .sort((a, b) => a.number - b.number)
            .map((ans, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-md border-2 border-ink bg-surface p-2.5 text-fg md:p-3"
              >
                <div className="flex min-w-0 items-center gap-2 md:gap-3">
                  <span className="shrink-0 rounded-md border-2 border-ink bg-warning px-2 py-0.5 font-number text-h3 font-bold tabular-nums text-on-status">
                    {ans.number}
                  </span>
                  <div className="min-w-0 text-left">
                    <div className="truncate text-body">
                      &quot;{ans.answer}&quot;
                    </div>
                    <Text variant="caption" tone="muted" as="div">
                      {ans.playerName}
                    </Text>
                  </div>
                </div>
                {ans.isCorrect === true && (
                  <Badge tone="success" className="shrink-0">✓</Badge>
                )}
                {ans.isCorrect === false && (
                  <Badge tone="danger" className="shrink-0">✗</Badge>
                )}
              </div>
            ))}

          {/* เลขที่ยังไม่ได้เปิด */}
          {playerAnswers
            .filter((a) => !a.isRevealed)
            .sort((a, b) => a.number - b.number)
            .map((ans, i) => (
              <div
                key={`unrevealed-${i}`}
                className="flex items-center justify-between gap-2 rounded-md border-2 border-ink bg-surface-muted p-2.5 text-fg-muted md:p-3"
              >
                <div className="flex min-w-0 items-center gap-2 md:gap-3">
                  <span className="shrink-0 rounded-md border-2 border-ink bg-surface px-2 py-0.5 font-number text-h3 font-bold tabular-nums">
                    {ans.number}
                  </span>
                  <div className="min-w-0 text-left">
                    <div className="truncate text-body">
                      &quot;{ans.answer}&quot;
                    </div>
                    <div className="text-caption">{ans.playerName}</div>
                  </div>
                </div>
                <Badge tone="neutral" className="shrink-0">ไม่ได้เปิด</Badge>
              </div>
            ))}
        </div>
      </div>

      {/* ปุ่มกลับหน้าหลัก */}
      <div className="mt-6 flex justify-center gap-4 md:mt-8">
        <Button size="lg" onClick={() => (window.location.href = "/")}>
          กลับหน้าหลัก
        </Button>
      </div>
    </Card>
  );
}
