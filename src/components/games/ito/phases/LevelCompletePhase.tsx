/**
 * Level Complete Phase Component
 * Phase สำหรับจบ Level และเตรียมไป Level ถัดไป
 */

"use client";

import { markPlayerReady } from "@/lib/firebase/ito";
import { LuCheck, LuPartyPopper, LuX } from "react-icons/lu";
import { Badge, Button, Card, Heading, Hearts, Text } from "@/components/ui";
import PlayerProgress from "../PlayerProgress";

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
    <Card padding="md">
      <div className="mb-4 text-center md:mb-6">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-lg border-2 border-ink bg-primary text-primary-on shadow-brutal md:h-20 md:w-20"><LuPartyPopper className="h-8 w-8 md:h-10 md:w-10" aria-hidden /></div>
        <Heading as="h3" level="h1" className="mb-1 text-center">
          ผ่านรอบที่ {gameState.currentLevel}!
        </Heading>
        <Text tone="muted" className="text-center">
          {gameState.currentLevel >= gameState.totalLevels
            ? "เยี่ยมมาก! เตรียมพร้อมดูผลลัพธ์"
            : "เยี่ยมมาก! เตรียมพร้อมสำหรับรอบถัดไป"}
        </Text>
      </div>

      {/* สรุปสั้น: หัวใจ + รอบถัดไป */}
      <div className="mb-4 grid grid-cols-2 gap-2 md:mb-6">
        <div className="flex flex-col items-center gap-1 rounded-md border-2 border-ink bg-surface-muted p-3">
          <Text variant="caption" tone="muted" as="span">หัวใจคงเหลือ</Text>
          <Hearts total={3} remaining={gameState.hearts} size="md" />
        </div>
        <div className="flex flex-col items-center gap-1 rounded-md border-2 border-ink bg-surface-muted p-3 text-center">
          <Text variant="caption" tone="muted" as="span">
            {gameState.currentLevel < gameState.totalLevels ? "รอบถัดไป" : "ความคืบหน้า"}
          </Text>
          <span className="font-heading text-body font-bold">
            {gameState.currentLevel < gameState.totalLevels
              ? `คนละ ${gameState.currentLevel + 1} เลข`
              : `ครบ ${gameState.totalLevels} รอบ`}
          </span>
        </div>
      </div>

      {/* พร้อมไปต่อ: ปุ่มหลักลอยติดล่างจอ */}
      <div className="sticky bottom-3 z-10 mb-4 md:mb-6">
        {!isPlayerReady ? (
          <Button
            size="lg"
            fullWidth
            loading={submitting}
            onClick={handleReady}
            disabled={submitting}
            className="shadow-brutal"
          >
            {gameState.currentLevel >= gameState.totalLevels
              ? "พร้อมดูผลลัพธ์"
              : "พร้อมไปรอบถัดไป"}
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-md border-2 border-ink bg-success px-4 py-3 font-heading font-bold text-on-status shadow-brutal">
            <LuCheck className="h-5 w-5" aria-hidden /> คุณพร้อมแล้ว — รอเพื่อนๆ
          </div>
        )}
      </div>

      <div className="mb-4 md:mb-6">
        <PlayerProgress
          label="พร้อมแล้ว"
          done={readyCount}
          total={totalPlayers}
          players={uniquePlayerIds.map((id) => ({
            id,
            name: playerNames[id],
            done: readyPlayerIds.includes(id),
          }))}
        />
      </div>

      {/* เลขทั้งหมด (เปิดแล้ว + ยังไม่เปิด) */}
      <Card variant="muted" padding="sm" className="">
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
                <Badge tone="neutral" className="shrink-0">ยังไม่เปิด</Badge>
              </div>
            ))}
        </div>
      </Card>

    </Card>
  );
}
