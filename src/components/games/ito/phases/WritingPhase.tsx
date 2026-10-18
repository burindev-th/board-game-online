/**
 * Writing Phase Component
 * Phase สำหรับพิมพ์คำใบ้
 */

"use client";
import { LuChevronRight, LuChevronDown, LuCheck, LuMessageCircle } from "react-icons/lu";
import { useState } from "react";
import RevealedNumbersList from "../RevealedNumbersList";
import { Alert, Badge, Button, Card, Heading, Text, Textarea } from "@/components/ui";
import {
  calculatePlayerSubmissionStatus,
  separateCompletedPlayers,
} from "@/lib/utils/playerStatusUtils";

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
  const [showStatus, setShowStatus] = useState(false);

  const uniquePlayerIds = Array.from(
    new Set(playerAnswers.map((a) => a.playerId))
  );
  const totalPlayers = uniquePlayerIds.length;
  const expectedAnswersPerPlayer = gameState.currentLevel;

  const playerSubmissionStatus = calculatePlayerSubmissionStatus(
    playerAnswers,
    expectedAnswersPerPlayer
  );

  const { playersCompleted, playersNotCompleted } = separateCompletedPlayers(
    playerSubmissionStatus
  );

  // คำนวณจำนวนคำใบ้ที่ส่งแล้ว vs จำนวนทั้งหมด
  const totalHintsExpected = totalPlayers * expectedAnswersPerPlayer;
  const totalHintsSubmitted = playerAnswers.filter(
    (ans) => ans.answer.trim() !== "" && ans.submittedAt
  ).length;

  return (
    <Card padding="lg">
      <Heading level="h2" as="h3" className="mb-3 md:mb-4">
        พิมพ์คำใบ้ของคุณ
      </Heading>
      <Text tone="muted" className="mb-4 md:mb-6">
        ให้คำใบ้ที่สื่อถึงตัวเลขของคุณ โดยไม่ต้องบอกตัวเลข
      </Text>

      {/* ประวัติเลขที่เปิดแล้ว */}
      <RevealedNumbersList revealedNumbers={gameState.revealedNumbers} />

      {/* แสดงช่องกรอกแยกสำหรับแต่ละเลข */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {myAnswers
          .sort((a, b) => a.answerIndex - b.answerIndex)
          .map((ans) => {
            const isSubmitted = !!ans.submittedAt;
            return (
              <Card key={ans.answerIndex} variant="muted" padding="sm">
                {/* เลขที่ */}
                <div className="mb-2 flex items-center justify-between gap-2 md:mb-3">
                  <Text variant="small" tone="muted" as="div">
                    {myAnswers.length > 1
                      ? `เลขที่ ${ans.answerIndex + 1}:`
                      : "เลขของคุณ:"}
                  </Text>
                  <span className="rounded-md border-2 border-ink bg-warning px-3 py-1 font-number text-h2 font-bold tabular-nums text-on-status">
                    {ans.number}
                  </span>
                </div>

                {/* ช่องกรอกคำใบ้ */}
                <Textarea
                  rows={3}
                  placeholder={`พิมพ์คำใบ้สำหรับเลข ${ans.number}...`}
                  value={answers[ans.answerIndex] || ""}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      [ans.answerIndex]: e.target.value,
                    })
                  }
                  disabled={isSubmitted}
                />

                {/* ปุ่มส่ง / แก้ไข */}
                {!isSubmitted ? (
                  <Button
                    size="lg"
                    fullWidth
                    loading={submitting}
                    onClick={() => handleSubmitAnswer(ans.answerIndex)}
                    disabled={!answers[ans.answerIndex]?.trim() || submitting}
                    className="mt-2 md:mt-3"
                  >
                    {submitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
                  </Button>
                ) : (
                  <div className="mt-2 space-y-2 md:mt-3">
                    <Alert tone="success" className="justify-center text-center">
                      ส่งคำตอบแล้ว
                    </Alert>
                    <Button
                      variant="outline"
                      fullWidth
                      loading={submitting}
                      onClick={() => handleEditAnswer(ans.answerIndex)}
                      disabled={submitting}
                    >
                      {submitting ? "กำลังยกเลิก..." : "แก้ไขคำตอบ"}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
      </div>

      {/* ปุ่มส่งทั้งหมด - แสดงเฉพาะเมื่อมีหลายคำตอบและพิมพ์ครบแล้ว */}
      {myAnswers.length > 1 &&
        (() => {
          const allFilled = myAnswers.every((ans) =>
            answers[ans.answerIndex]?.trim()
          );
          const hasUnsubmitted = myAnswers.some((ans) => !ans.submittedAt);

          return allFilled && hasUnsubmitted ? (
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              loading={submitting}
              onClick={async () => {
                for (const ans of myAnswers) {
                  if (!ans.submittedAt && answers[ans.answerIndex]?.trim()) {
                    await handleSubmitAnswer(ans.answerIndex);
                  }
                }
              }}
              disabled={submitting}
              className="mt-4 md:mt-6"
            >
              {submitting ? "กำลังส่ง..." : "ส่งคำใบ้ทั้งหมด"}
            </Button>
          ) : null;
        })()}

      {/* แสดงสถานะรวม */}
      {myAnswers.every((ans) => ans.submittedAt) && (
        <Alert tone="success" className="mt-4 justify-center text-center md:mt-6">
          ส่งคำตอบครบทุกเลขแล้ว รอผู้เล่นคนอื่น...
        </Alert>
      )}

      {/* สถานะผู้เล่น - Minimal Design */}
      <div className="mt-6 border-t-2 border-ink pt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowStatus(!showStatus)}
          icon={<LuMessageCircle aria-hidden />}
        >
          <span>
            สถานะการส่งคำใบ้: {totalHintsSubmitted}/{totalHintsExpected}
          </span>
          {showStatus ? <LuChevronDown /> : <LuChevronRight />}
        </Button>

        {showStatus && (
          <div className="mt-3 flex flex-wrap gap-2">
            {playersCompleted.map((p, i) => (
              <Badge key={i} tone="success">
                <LuCheck className="h-3.5 w-3.5" aria-hidden /> {p.playerName}
              </Badge>
            ))}
            {playersNotCompleted.map(([id, p]) => (
              <Badge key={id} tone="warning">
                {p.playerName} ({p.submittedCount}/{p.totalExpected})
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
