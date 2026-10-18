/**
 * Writing Phase Component
 * Phase สำหรับพิมพ์คำใบ้
 */

"use client";
import { useState } from "react";
import { LuCircleCheck, LuPencil, LuSend } from "react-icons/lu";
import RevealedNumbersList from "../RevealedNumbersList";
import PlayerProgress from "../PlayerProgress";
import { Alert, Badge, Button, Card, Heading, Text, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { calculatePlayerSubmissionStatus } from "@/lib/utils/playerStatusUtils";

type ItoPlayerAnswer = {
  playerId: string;
  playerName: string;
  number: number;
  answer: string;
  submittedAt?: Date;
  isRevealed: boolean;
};

type ItoPlayerAnswerWithIndex = ItoPlayerAnswer & {
  answerIndex: number;
};

interface WritingPhaseProps {
  myAnswers: ItoPlayerAnswerWithIndex[];
  playerAnswers: ItoPlayerAnswer[];
  gameState: {
    currentLevel: number;
    revealedNumbers: number[];
  };
  answers: { [answerIndex: number]: string };
  setAnswers: (answers: { [answerIndex: number]: string }) => void;
  submitting: boolean;
  handleSubmitAnswer: (answerIndex: number) => Promise<void>;
  handleEditAnswer: (answerIndex: number) => Promise<void>;
}

export default function WritingPhase({
  myAnswers,
  playerAnswers,
  gameState,
  answers,
  setAnswers,
  submitting,
  handleSubmitAnswer,
  handleEditAnswer,
}: WritingPhaseProps) {
  // index ของเลขที่กำลังส่ง/แก้ไข เพื่อให้ spinner ขึ้นเฉพาะปุ่มที่กด
  const [pendingIndex, setPendingIndex] = useState<number | "all" | null>(null);

  const expectedAnswersPerPlayer = gameState.currentLevel;
  const playerSubmissionStatus = calculatePlayerSubmissionStatus(
    playerAnswers,
    expectedAnswersPerPlayer
  );
  const progressPlayers = Object.entries(playerSubmissionStatus).map(([id, p]) => ({
    id,
    name: p.playerName,
    done: p.submittedCount === p.totalExpected,
    detail: p.totalExpected > 1 ? `${p.submittedCount}/${p.totalExpected}` : undefined,
  }));

  const sortedAnswers = [...myAnswers].sort((a, b) => a.answerIndex - b.answerIndex);
  const allMineSubmitted = sortedAnswers.length > 0 && sortedAnswers.every((a) => a.submittedAt);
  const readyToSubmit = sortedAnswers.filter(
    (a) => !a.submittedAt && answers[a.answerIndex]?.trim()
  );

  const run = async (key: number | "all", fn: () => Promise<void>) => {
    setPendingIndex(key);
    try {
      await fn();
    } finally {
      setPendingIndex(null);
    }
  };

  const submitOne = (answerIndex: number) =>
    run(answerIndex, () => handleSubmitAnswer(answerIndex));

  const submitAll = () =>
    run("all", async () => {
      for (const ans of readyToSubmit) {
        await handleSubmitAnswer(ans.answerIndex);
      }
    });

  return (
    <Card padding="md">
      <Heading level="h2" as="h3" className="mb-1">
        เขียนคำใบ้ของคุณ
      </Heading>
      <Text variant="small" tone="muted" className="mb-4">
        เลขมีตั้งแต่ 1 (น้อยสุด) ถึง 100 (มากสุด) — ตอบโจทย์ให้สื่อถึง &quot;ขนาด&quot; ของเลข
        โดยห้ามบอกตัวเลขตรงๆ
      </Text>

      <RevealedNumbersList revealedNumbers={gameState.revealedNumbers} className="mb-4" />

      {/* ช่องกรอกคำใบ้ แยกตามเลข */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {sortedAnswers.map((ans) => {
          const isSubmitted = !!ans.submittedAt;
          const value = answers[ans.answerIndex] || "";
          const isPending = pendingIndex === ans.answerIndex || pendingIndex === "all";

          return (
            <div
              key={ans.answerIndex}
              className={cn(
                "rounded-md border-2 border-ink p-3 transition-colors",
                isSubmitted ? "bg-surface-muted" : "bg-surface shadow-brutal-sm",
              )}
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-14 min-w-[3.5rem] items-center justify-center rounded-md border-2 border-ink bg-primary px-2 font-number text-h1 font-bold tabular-nums text-primary-on">
                  {ans.number}
                </span>
                <div className="min-w-0 flex-1">
                  <Text variant="caption" tone="muted" as="div">
                    {myAnswers.length > 1 ? `เลขที่ ${ans.answerIndex + 1}` : "เลขของคุณ"}
                  </Text>
                  {isSubmitted ? (
                    <Badge tone="success">
                      <LuCircleCheck className="h-3.5 w-3.5" aria-hidden /> ส่งแล้ว
                    </Badge>
                  ) : (
                    <Badge tone="warning">ยังไม่ส่ง</Badge>
                  )}
                </div>
              </div>

              {isSubmitted ? (
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 break-words rounded-md border-2 border-ink bg-surface px-3 py-2 text-body font-semibold">
                    {value || ans.answer}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 shrink-0"
                    loading={isPending}
                    disabled={submitting}
                    onClick={() => run(ans.answerIndex, () => handleEditAnswer(ans.answerIndex))}
                    icon={<LuPencil aria-hidden />}
                    aria-label={`แก้ไขคำใบ้ของเลข ${ans.number}`}
                  >
                    แก้ไข
                  </Button>
                </div>
              ) : (
                <>
                  <Textarea
                    rows={2}
                    aria-label={`คำใบ้สำหรับเลข ${ans.number}`}
                    placeholder={`คำใบ้สำหรับเลข ${ans.number}...`}
                    value={value}
                    onChange={(e) =>
                      setAnswers({ ...answers, [ans.answerIndex]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && value.trim()) {
                        e.preventDefault();
                        submitOne(ans.answerIndex);
                      }
                    }}
                  />
                  <Button
                    fullWidth
                    className="mt-2"
                    loading={isPending}
                    onClick={() => submitOne(ans.answerIndex)}
                    disabled={!value.trim() || submitting}
                    icon={<LuSend aria-hidden />}
                  >
                    ส่งคำใบ้
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ส่งทั้งหมด: ลอยติดขอบล่างจอบนมือถือ เพื่อกดได้ทันทีโดยไม่ต้องเลื่อน */}
      {myAnswers.length > 1 && readyToSubmit.length > 1 && (
        <div className="sticky bottom-3 z-10 mt-4">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            loading={pendingIndex === "all"}
            onClick={submitAll}
            disabled={submitting}
            icon={<LuSend aria-hidden />}
            className="shadow-brutal"
          >
            ส่งคำใบ้ทั้งหมด ({readyToSubmit.length})
          </Button>
        </div>
      )}

      {allMineSubmitted && (
        <Alert tone="success" className="mt-4 justify-center text-center">
          ส่งครบแล้ว! รอเพื่อนๆ อีกสักครู่ — ยังกดแก้ไขได้จนกว่าจะเริ่มโหวต
        </Alert>
      )}

      <div className="mt-5 border-t-2 border-ink pt-4">
        <PlayerProgress
          label="เพื่อนๆ ที่ส่งคำใบ้ครบแล้ว"
          done={progressPlayers.filter((p) => p.done).length}
          total={progressPlayers.length}
          players={progressPlayers}
        />
      </div>
    </Card>
  );
}
