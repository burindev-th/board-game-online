/**
 * Level Complete Phase Component
 * Phase สำหรับจบ Level และเตรียมไป Level ถัดไป
 */

"use client";

import { markPlayerReady } from "@/lib/firebase/ito";
import { LuCheck, LuCircleCheck, LuHourglass, LuPartyPopper, LuX } from "react-icons/lu";
import { Badge, Button, Card, Heading, Hearts, PlayerChip, Text } from "@/components/ui";

type ItoPlayerAnswer = {
  playerId: string;
  playerName: string;
  number: number;
  answer: string;
  isRevealed: boolean;
  isCorrect?: boolean;
};

type ReadyPlayer = {
  playerId: string;
  playerName: string;
};

interface LevelCompletePhaseProps {
  sessionId: string;
  playerId: string;
  playerAnswers: ItoPlayerAnswer[];
  readyPlayers: ReadyPlayer[];
  readyCount: number;
  gameState: {
    currentLevel: number;
    totalLevels: number;
    hearts: number;
  };
  submitting: boolean;
  setSubmitting: (value: boolean) => void;
}

export default function LevelCompletePhase({
  sessionId,
  playerId,
  playerAnswers,
  readyPlayers,
  readyCount,
  gameState,
  submitting,
  setSubmitting,
}: LevelCompletePhaseProps) {
  const uniquePlayerIds = Array.from(
    new Set(playerAnswers.map((a) => a.playerId))
  );
  const totalPlayers = uniquePlayerIds.length;

  // สร้าง map ของ playerId → playerName
  const playerNames: { [key: string]: string } = {};
  playerAnswers.forEach((a) => {
    if (!playerNames[a.playerId]) {
      playerNames[a.playerId] = a.playerName;
    }
  });

  // หาว่าใครพร้อมแล้ว
  const readyPlayerIds = readyPlayers.map((r) => r.playerId);
  const notReadyPlayers = uniquePlayerIds.filter(
    (id) => !readyPlayerIds.includes(id)
  );

  // เรียงเลขที่เปิดแล้ว + ดึงคำใบ้
  const revealedAnswers = playerAnswers
    .filter((a) => a.isRevealed)
    .sort((a, b) => a.number - b.number);

  // เช็คว่า player ปัจจุบันพร้อมหรือยัง
  const isPlayerReady = readyPlayerIds.includes(playerId);

  const handleReady = async () => {
    if (submitting || isPlayerReady) return;

    setSubmitting(true);
    const playerName = playerNames[playerId] || "Unknown";
    const success = await markPlayerReady(sessionId, playerId, playerName);

    if (!success) {
      alert("เกิดข้อผิดพลาดในการยืนยัน");
    }
    setSubmitting(false);
  };

  return (
    <Card padding="lg">
      <div className="mb-6 text-center md:mb-8">
        <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-lg border-2 border-ink bg-primary text-primary-on shadow-brutal md:mb-6"><LuPartyPopper className="h-10 w-10" aria-hidden /></div>
        <Heading as="h3" level="h1" className="mb-3 text-center md:mb-4">
          ผ่านรอบที่ {gameState.currentLevel}!
        </Heading>
        <Text tone="muted" className="text-center">
          {gameState.currentLevel >= gameState.totalLevels
            ? "เยี่ยมมาก! เตรียมพร้อมดูผลลัพธ์"
            : "เยี่ยมมาก! เตรียมพร้อมสำหรับรอบถัดไป"}
        </Text>
      </div>

      {/* เลขทั้งหมด (เปิดแล้ว + ยังไม่เปิด) */}
      <Card variant="muted" padding="sm" className="mb-4 md:mb-6">
        <Heading level="h3" as="h4" className="mb-3 text-center md:mb-4">
          ตัวเลขทั้งหมดในรอบนี้
        </Heading>
        <div className="grid max-h-96 grid-cols-1 gap-2 overflow-y-auto p-1 md:grid-cols-2 md:gap-3">
          {/* เลขที่เปิดแล้ว */}
          {revealedAnswers.map((ans, i) => (
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
                <Badge tone="neutral" className="shrink-0">ยังไม่เปิด</Badge>
              </div>
            ))}
        </div>
      </Card>

      {/* Progress & Hearts */}
      <Card variant="muted" padding="sm" className="mb-4 md:mb-6">
        <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
          <div>
            <Text variant="caption" tone="muted" as="div">
              ความคืบหน้า:
            </Text>
            <Badge tone="warning" className="mt-1">
              รอบ {gameState.currentLevel} / {gameState.totalLevels}
            </Badge>
          </div>
          <div>
            <Text variant="caption" tone="muted" as="div" className="mb-1 text-center">
              หัวใจคงเหลือ
            </Text>
            <div className="flex justify-center">
              <Hearts total={3} remaining={gameState.hearts} size="md" />
            </div>
            <div className="mt-1 flex justify-center">
              <Badge tone="danger">{gameState.hearts} / 3</Badge>
            </div>
          </div>
        </div>

        {gameState.currentLevel < gameState.totalLevels && (
          <div className="border-t-2 border-ink pt-3 text-center md:pt-4">
            <Text variant="small" className="font-semibold">
              รอบถัดไป: คนละ {gameState.currentLevel + 1} เลข
            </Text>
          </div>
        )}
      </Card>

      {/* สถานะผู้เล่น */}
      <Card variant="muted" padding="sm" className="mb-4 md:mb-6">
        <Heading level="h3" as="h4" className="mb-2 text-center md:mb-3">
          สถานะผู้เล่น
        </Heading>
        <Text variant="small" tone="muted" className="mb-3 text-center md:mb-4">
          {readyCount} / {totalPlayers} คนพร้อมแล้ว
        </Text>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
          {/* พร้อมแล้ว */}
          <div>
            <div className="mb-1 flex justify-center md:mb-2">
              <Badge tone="success"><LuCircleCheck className="h-4 w-4" aria-hidden /> พร้อมแล้ว</Badge>
            </div>
            <div className="grid gap-2">
              {readyPlayers.map((r) => (
                <PlayerChip
                  key={r.playerId}
                  name={r.playerName}
                  colorIndex={Math.max(0, uniquePlayerIds.indexOf(r.playerId))}
                />
              ))}
            </div>
          </div>

          {/* รออยู่ */}
          <div>
            <div className="mb-1 flex justify-center md:mb-2">
              <Badge tone="warning"><LuHourglass className="h-4 w-4" aria-hidden /> รออยู่</Badge>
            </div>
            <div className="grid gap-2">
              {notReadyPlayers.map((id) => (
                <PlayerChip
                  key={id}
                  name={playerNames[id]}
                  colorIndex={uniquePlayerIds.indexOf(id)}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ปุ่ม */}
      {!isPlayerReady ? (
        <Button
          size="lg"
          fullWidth
          loading={submitting}
          onClick={handleReady}
          disabled={submitting}
        >
          {submitting
            ? "กำลังบันทึก..."
            : gameState.currentLevel >= gameState.totalLevels
            ? "พร้อมดูผลลัพธ์"
            : "พร้อมไปรอบถัดไป"}
        </Button>
      ) : (
        <div className="py-3 text-center md:py-4">
          <div className="mb-2 flex justify-center">
            <Badge tone="success"><LuCheck className="h-4 w-4" aria-hidden /> คุณพร้อมแล้ว</Badge>
          </div>
          <Text variant="small" tone="muted">
            รอผู้เล่นคนอื่น...
          </Text>
        </div>
      )}
    </Card>
  );
}
