/**
 * Finished Phase Component
 * Phase สำหรับแสดงผลสรุปเกม
 */

"use client";

import { LuCheck, LuHeartCrack, LuHouse, LuRotateCcw, LuTrophy, LuX } from "react-icons/lu";
import { Badge, Button, Card, Heading, Hearts, Text } from "@/components/ui";

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
    <Card padding="md" className="text-center">
      {gameState.status === "won" ? (
        <>
          <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-lg border-2 border-ink bg-primary text-primary-on shadow-brutal md:mb-6"><LuTrophy className="h-10 w-10" aria-hidden /></div>
          <Heading as="h3" level="h1" className="mb-3 text-center md:mb-4">
            ชนะแล้ว!
          </Heading>
          <Text tone="muted" className="mb-4 text-center md:mb-6">
            คุณและเพื่อนๆ ผ่านเกมได้สำเร็จ
          </Text>
        </>
      ) : (
        <>
          <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-lg border-2 border-ink bg-danger text-on-status shadow-brutal md:mb-6"><LuHeartCrack className="h-10 w-10" aria-hidden /></div>
          <Heading as="h3" level="h1" className="mb-3 text-center md:mb-4">
            แพ้แล้ว
          </Heading>
          <Text tone="muted" className="mb-4 text-center md:mb-6">
            หัวใจหมดแล้ว ลองใหม่อีกครั้งนะ!
          </Text>
        </>
      )}

      {/* สรุปผลแบบย่อ */}
      <div className="mx-auto mb-4 grid max-w-md grid-cols-2 gap-2 md:mb-6">
        <div className="flex flex-col items-center gap-1 rounded-md border-2 border-ink bg-surface-muted p-3">
          <Text variant="caption" tone="muted" as="span">หัวใจคงเหลือ</Text>
          <Hearts total={3} remaining={finalHearts} size="md" />
        </div>
        <div className="flex flex-col items-center gap-1 rounded-md border-2 border-ink bg-surface-muted p-3">
          <Text variant="caption" tone="muted" as="span">เลขที่เปิดได้</Text>
          <span className="font-number text-h2 font-bold tabular-nums">
            {gameState.revealedNumbers.length}/{gameState.totalRounds}
          </span>
        </div>
      </div>

      <div className="mx-auto mb-6 flex max-w-md flex-col gap-2 sm:flex-row md:mb-8">
        <Button href="/create-room" size="lg" fullWidth icon={<LuRotateCcw aria-hidden />}>
          เล่นอีกครั้ง
        </Button>
        <Button href="/" variant="outline" size="lg" fullWidth icon={<LuHouse aria-hidden />}>
          กลับหน้าหลัก
        </Button>
      </div>

      {/* Show all numbers (revealed + unrevealed) */}
      <div className="mx-auto max-w-6xl">
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
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-warning font-number text-h3 font-bold tabular-nums text-on-status">
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
                  <Badge tone="success" className="shrink-0"><LuCheck className="h-4 w-4" aria-label="ถูก" /></Badge>
                )}
                {ans.isCorrect === false && (
                  <Badge tone="danger" className="shrink-0"><LuX className="h-4 w-4" aria-label="ผิด" /></Badge>
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
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-surface font-number text-h3 font-bold tabular-nums">
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

    </Card>
  );
}
