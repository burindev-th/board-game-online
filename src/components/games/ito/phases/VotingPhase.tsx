/**
 * Voting Phase Component
 * Phase สำหรับโหวตคำใบ้
 */

"use client";

import { useState } from "react";
import { LuHourglass, LuMessageCircle, LuVote } from "react-icons/lu";
import { Alert, Badge, Button, Card, Heading, Text, Textarea, cardClasses } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import RevealedNumbersList from "../RevealedNumbersList";
import {
  calculatePlayerHintStatus,
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

type ItoVote = {
  playerId: string;
  votedForPlayerId: string;
  votedForAnswerIndex: number;
};

interface VotingPhaseProps {
  myAnswers: ItoPlayerAnswerWithIndex[];
  playerAnswers: ItoPlayerAnswer[];
  votes: ItoVote[];
  voteCount: number;
  playerId: string;
  gameState: {
    currentLevel: number;
    revealedNumbers: number[];
  };
  answers: { [answerIndex: number]: string };
  setAnswers: (answers: { [answerIndex: number]: string }) => void;
  selectedAnswerId: string | null;
  setSelectedAnswerId: (id: string | null) => void;
  submitting: boolean;
  handleSubmitAnswer: (answerIndex: number) => Promise<void>;
  handleSubmitVote: () => Promise<void>;
}

export default function VotingPhase({
  myAnswers,
  playerAnswers,
  votes,
  voteCount,
  playerId,
  gameState,
  answers,
  setAnswers,
  selectedAnswerId,
  setSelectedAnswerId,
  submitting,
  handleSubmitAnswer,
  handleSubmitVote,
}: VotingPhaseProps) {
  const [statusTab, setStatusTab] = useState<"hints" | "votes">("hints");

  const uniquePlayerIds = Array.from(
    new Set(playerAnswers.map((a) => a.playerId))
  );
  const totalPlayers = uniquePlayerIds.length;
  const expectedAnswersPerPlayer = gameState.currentLevel;

  const playerSubmissionStatus = calculatePlayerHintStatus(
    playerAnswers,
    expectedAnswersPerPlayer
  );

  const { playersCompleted, playersNotCompleted } =
    separateCompletedPlayers(playerSubmissionStatus);

  const allPlayersSubmittedAll = Object.values(
    playerSubmissionStatus
  ).every((p) => p.submittedCount === p.totalExpected);

  const votedPlayerIds = votes.map((v) => v.playerId);
  const playersWhoVoted = uniquePlayerIds.filter((id) =>
    votedPlayerIds.includes(id)
  );
  const playersWhoNotVoted = uniquePlayerIds.filter(
    (id) => !votedPlayerIds.includes(id)
  );

  // คำนวณจำนวนคำใบ้ที่ส่งแล้ว vs จำนวนทั้งหมด
  const totalHintsExpected = totalPlayers * expectedAnswersPerPlayer;
  const totalHintsSubmitted = playerAnswers.filter(
    (ans) => ans.answer.trim() !== "" && ans.submittedAt
  ).length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ส่วนพิมพ์คำใบ้ของตัวเอง */}
      {myAnswers.filter((ans) => !ans.isRevealed).length > 0 && (
        <Card padding="lg">
          <Heading level="h2" as="h3" className="mb-3 md:mb-4">
            คำใบ้ของคุณ
          </Heading>
          <Text tone="muted" className="mb-4 md:mb-6">
            คุณสามารถแก้ไขคำใบ้ได้ตลอดจนกว่าจะถูกเปิด
          </Text>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {myAnswers
              .filter((ans) => !ans.isRevealed)
              .sort((a, b) => a.answerIndex - b.answerIndex)
              .map((ans) => (
                <Card key={ans.answerIndex} variant="muted" padding="sm">
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

                  <Textarea
                    rows={2}
                    placeholder={`พิมพ์คำใบ้สำหรับเลข ${ans.number}...`}
                    value={answers[ans.answerIndex] || ""}
                    onChange={(e) =>
                      setAnswers({
                        ...answers,
                        [ans.answerIndex]: e.target.value,
                      })
                    }
                  />

                  <Button
                    variant={ans.answer ? "secondary" : "primary"}
                    fullWidth
                    loading={submitting}
                    onClick={() => handleSubmitAnswer(ans.answerIndex)}
                    disabled={
                      !answers[ans.answerIndex]?.trim() || submitting
                    }
                    className="mt-2 md:mt-3"
                  >
                    {submitting
                      ? "กำลังบันทึก..."
                      : ans.answer
                      ? "อัปเดตคำใบ้"
                      : "บันทึกคำใบ้"}
                  </Button>
                </Card>
              ))}
          </div>
        </Card>
      )}

      {/* ส่วนโหวต */}
      <Card padding="lg">
        <Heading level="h2" as="h3" className="mb-3 md:mb-4">
          เลือกคำใบ้ที่น้อยที่สุด
        </Heading>
        <Text tone="muted" className="mb-3 md:mb-4">
          คลิกเลือกคำใบ้ที่คุณคิดว่าสื่อถึงตัวเลขที่น้อยที่สุด
        </Text>

        {/* ประวัติเลขที่เปิดแล้ว */}
        <RevealedNumbersList revealedNumbers={gameState.revealedNumbers} />

        {/* แสดง warning หากยังพิมพ์ไม่ครบ */}
        {!allPlayersSubmittedAll && (
          <Alert tone="warning" className="mb-4">
            รอให้ทุกคนพิมพ์คำใบ้ครบก่อนโหวต
          </Alert>
        )}

        {/* ส่วนโหวต - แสดงเฉพาะเมื่อทุกคนส่งครบแล้ว */}
        {allPlayersSubmittedAll ? (
          <>
            <div className="mb-4 grid grid-cols-1 gap-3 md:mb-6 md:grid-cols-2 md:gap-4">
              {playerAnswers
                .filter((a) => !a.isRevealed && a.answer.trim() !== "")
                .map((playerAnswer) => {
                  const answerWithIndex =
                    playerAnswer as ItoPlayerAnswerWithIndex;
                  const answerId = `${answerWithIndex.playerId}_${answerWithIndex.answerIndex}`;

                  // หาว่าใครโหวตคำใบ้นี้บ้าง
                  const votersForThisAnswer = votes.filter(
                    (v) =>
                      v.votedForPlayerId === answerWithIndex.playerId &&
                      v.votedForAnswerIndex === answerWithIndex.answerIndex
                  );

                  // ดึงชื่อผู้โหวต
                  const voterNames = votersForThisAnswer
                    .map((v) => {
                      const voter = playerAnswers.find(
                        (a) => a.playerId === v.playerId
                      );
                      return voter?.playerName || "Unknown";
                    })
                    .filter((name, index, self) => self.indexOf(name) === index); // unique

                  return (
                    <button
                      key={answerId}
                      onClick={() => setSelectedAnswerId(answerId)}
                      className={cn(
                        cardClasses({
                          variant: selectedAnswerId === answerId ? "primary" : "default",
                          padding: "sm",
                          interactive: true,
                        }),
                        "text-left"
                      )}
                    >
                      <div className="mb-2 text-caption font-semibold">
                        {playerAnswer.playerName}
                      </div>
                      <div className="text-h3 font-semibold">
                        {playerAnswer.answer}
                      </div>
                      {playerAnswer.playerId === playerId && (
                        <div className="mt-2">
                          <Badge tone="secondary">(คำใบ้ของคุณ)</Badge>
                        </div>
                      )}

                      {/* แสดงว่าใครโหวตคำใบ้นี้ */}
                      {voterNames.length > 0 && (
                        <div className="mt-2 border-t-2 border-ink pt-2 md:mt-3 md:pt-3">
                          <div className="mb-2 flex items-center justify-center gap-2">
                            <Badge tone="success">โหวต {voterNames.length}</Badge>
                          </div>
                          <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
                            {voterNames.map((name, idx) => (
                              <Badge key={idx} tone="neutral">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>

            <Button
              size="lg"
              fullWidth
              loading={submitting}
              onClick={handleSubmitVote}
              disabled={!selectedAnswerId || submitting}
            >
              {submitting ? "กำลังส่ง..." : "ยืนยันการเลือก"}
            </Button>
          </>
        ) : (
          <Card variant="muted" padding="md" className="text-center">
            <Text tone="muted" as="div" className="mb-2">
              <span className="inline-flex items-center gap-1">
                <LuHourglass className="h-4 w-4" aria-hidden />
                รอให้ทุกคนพิมพ์คำใบ้ครบก่อน
              </span>
            </Text>
            <Text variant="caption" tone="subtle" as="div">
              จึงจะสามารถโหวตได้
            </Text>
          </Card>
        )}

        {/* สถานะผู้เล่น - Minimal Design */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant={statusTab === "hints" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusTab("hints")}
            icon={<LuMessageCircle aria-hidden />}
          >
            คำใบ้: {totalHintsSubmitted}/{totalHintsExpected}
          </Button>
          <Button
            variant={statusTab === "votes" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusTab("votes")}
            icon={<LuVote aria-hidden />}
          >
            โหวต: {voteCount}/{totalPlayers}
          </Button>
        </div>

        {/* แสดงรายละเอียดตาม tab ที่เลือก */}
        {statusTab === "hints" && (
          <div className="mt-3 flex flex-wrap gap-2">
            {playersCompleted.map((p, i) => (
              <Badge key={i} tone="success">
                {p.playerName}
              </Badge>
            ))}
            {playersNotCompleted.map(([id, p]) => (
              <Badge key={id} tone="warning">
                {p.playerName} ({p.submittedCount}/{p.totalExpected})
              </Badge>
            ))}
          </div>
        )}

        {statusTab === "votes" && (
          <div className="mt-3 flex flex-wrap gap-2">
            {playersWhoVoted.map((id) => {
              const player = playerAnswers.find((a) => a.playerId === id);
              return (
                <Badge key={id} tone="success">
                  {player?.playerName}
                </Badge>
              );
            })}
            {playersWhoNotVoted.map((id) => {
              const player = playerAnswers.find((a) => a.playerId === id);
              return (
                <Badge key={id} tone="warning">
                  {player?.playerName}
                </Badge>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
