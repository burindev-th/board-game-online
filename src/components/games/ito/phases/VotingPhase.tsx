/**
 * Voting Phase Component
 * Phase สำหรับโหวตคำใบ้
 * - มือถือ: ส่วนโหวตอยู่บนสุด ปุ่มยืนยันลอยติดล่างจอ, คำใบ้ของตัวเองอยู่ด้านล่าง
 * - เดสก์ท็อป: คำใบ้ของตัวเองเป็นคอลัมน์ซ้าย ส่วนโหวตเป็นคอลัมน์หลัก
 */

"use client";

import { useState } from "react";
import { LuCheck, LuCircle, LuCircleCheck, LuPencil, LuVote, LuX } from "react-icons/lu";
import { Alert, Badge, Button, Card, Heading, Text, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import RevealedNumbersList from "../RevealedNumbersList";
import PlayerProgress from "../PlayerProgress";
import {
  calculatePlayerHintStatus,
  getPlayerNameMap,
  getUniquePlayerIds,
} from "@/lib/utils/playerStatusUtils";
import { createAnswerId } from "@/lib/utils/voteUtils";

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
  // เลขที่กำลังเปิดแก้ไขคำใบ้อยู่ (คำใบ้ที่ยังว่างจะเปิดไว้เสมอ)
  const [editing, setEditing] = useState<number[]>([]);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  const uniquePlayerIds = getUniquePlayerIds(playerAnswers);
  const totalPlayers = uniquePlayerIds.length;
  const playerNames = getPlayerNameMap(playerAnswers);

  const hintStatus = calculatePlayerHintStatus(playerAnswers, gameState.currentLevel);
  const allPlayersSubmittedAll = Object.values(hintStatus).every(
    (p) => p.submittedCount === p.totalExpected
  );

  const votedPlayerIds = new Set(votes.map((v) => v.playerId));
  const myVote = votes.find((v) => v.playerId === playerId);
  const myVoteId = myVote ? createAnswerId(myVote.votedForPlayerId, myVote.votedForAnswerIndex) : null;
  const selectionIsMyVote = !!myVoteId && selectedAnswerId === myVoteId;

  const voteOptions = (playerAnswers as ItoPlayerAnswerWithIndex[]).filter(
    (a) => !a.isRevealed && a.answer.trim() !== ""
  );
  const selectedOption = voteOptions.find(
    (a) => createAnswerId(a.playerId, a.answerIndex) === selectedAnswerId
  );

  const myOpenAnswers = [...myAnswers]
    .filter((a) => !a.isRevealed)
    .sort((a, b) => a.answerIndex - b.answerIndex);

  const saveHint = async (answerIndex: number) => {
    setSavingIndex(answerIndex);
    try {
      await handleSubmitAnswer(answerIndex);
      setEditing((prev) => prev.filter((i) => i !== answerIndex));
    } finally {
      setSavingIndex(null);
    }
  };

  const cancelEdit = (ans: ItoPlayerAnswerWithIndex) => {
    setAnswers({ ...answers, [ans.answerIndex]: ans.answer });
    setEditing((prev) => prev.filter((i) => i !== ans.answerIndex));
  };

  // ข้อความ/ปุ่มยืนยัน ตามสถานะการโหวตของตัวเอง
  let confirmLabel = "ยืนยันโหวต";
  if (!selectedAnswerId) confirmLabel = "แตะเลือกคำใบ้ด้านบน";
  else if (selectionIsMyVote) confirmLabel = "โหวตแล้ว";
  else if (myVote) confirmLabel = "เปลี่ยนเป็นคำใบ้นี้";

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start">
      {/* ส่วนโหวต (งานหลักของ phase นี้) */}
      <Card padding="md" className="lg:order-2">
        <Heading level="h2" as="h3" className="mb-1">
          คำใบ้ไหนเลขน้อยที่สุด?
        </Heading>
        <Text variant="small" tone="muted" className="mb-4">
          ช่วยกันคุยแล้วเลือก 1 คำใบ้ที่คิดว่าเลขน้อยที่สุด — ถ้าเปิดแล้วมีเลขที่น้อยกว่าหลุดไป จะเสียหัวใจ
        </Text>

        <RevealedNumbersList revealedNumbers={gameState.revealedNumbers} className="mb-4" />

        {!allPlayersSubmittedAll ? (
          <>
            <Alert tone="warning" className="mb-4">
              รอให้ทุกคนเขียนคำใบ้ให้ครบก่อน จึงจะเริ่มโหวตได้
            </Alert>
            <PlayerProgress
              label="เพื่อนๆ ที่เขียนคำใบ้ครบแล้ว"
              done={Object.values(hintStatus).filter((p) => p.submittedCount === p.totalExpected).length}
              total={totalPlayers}
              players={Object.entries(hintStatus).map(([id, p]) => ({
                id,
                name: p.playerName,
                done: p.submittedCount === p.totalExpected,
                detail: p.totalExpected > 1 ? `${p.submittedCount}/${p.totalExpected}` : undefined,
              }))}
            />
          </>
        ) : (
          <>
            <div
              role="radiogroup"
              aria-label="เลือกคำใบ้ที่เลขน้อยที่สุด"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              {voteOptions.map((option) => {
                const answerId = createAnswerId(option.playerId, option.answerIndex);
                const isSelected = selectedAnswerId === answerId;
                const isMine = option.playerId === playerId;
                const voterNames = Array.from(
                  new Set(
                    votes
                      .filter(
                        (v) =>
                          v.votedForPlayerId === option.playerId &&
                          v.votedForAnswerIndex === option.answerIndex
                      )
                      .map((v) => playerNames[v.playerId] || "?")
                  )
                );

                return (
                  <button
                    key={answerId}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedAnswerId(answerId)}
                    className={cn(
                      "brutal-press flex min-h-[5.5rem] flex-col rounded-md border-2 border-ink p-3 text-left",
                      isSelected ? "bg-primary text-primary-on" : "bg-surface text-fg",
                    )}
                  >
                    <div className="flex w-full items-start gap-2">
                      <p className="min-w-0 flex-1 break-words text-h3 font-bold leading-snug">
                        {option.answer}
                      </p>
                      {isSelected ? (
                        <LuCircleCheck className="h-6 w-6 shrink-0" aria-hidden />
                      ) : (
                        <LuCircle className="h-6 w-6 shrink-0 text-fg-subtle" aria-hidden />
                      )}
                    </div>
                    <div className="mt-auto flex w-full flex-wrap items-center gap-1.5 pt-2 text-caption font-semibold">
                      <span className="opacity-80">{option.playerName}</span>
                      {isMine && <Badge tone="secondary">ของคุณ</Badge>}
                      {voterNames.length > 0 && (
                        <span className="ml-auto inline-flex items-center gap-1">
                          <LuVote className="h-3.5 w-3.5" aria-hidden />
                          <span className="truncate">{voterNames.join(", ")}</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ปุ่มยืนยัน: ลอยติดล่างจอ เห็นตลอดขณะเลื่อนดูคำใบ้ */}
            <div className="sticky bottom-3 z-10 mt-4 rounded-md border-2 border-ink bg-surface p-2 shadow-brutal">
              {selectedOption && (
                <p className="mb-2 truncate px-1 text-small">
                  <span className="text-fg-muted">เลือก: </span>
                  <span className="font-bold">&quot;{selectedOption.answer}&quot;</span>
                </p>
              )}
              <Button
                size="lg"
                fullWidth
                variant={selectionIsMyVote ? "outline" : "primary"}
                loading={submitting}
                onClick={handleSubmitVote}
                disabled={!selectedAnswerId || selectionIsMyVote || submitting}
                icon={selectionIsMyVote ? <LuCheck aria-hidden /> : undefined}
              >
                {confirmLabel}
              </Button>
              {selectionIsMyVote && (
                <p className="mt-1.5 text-center text-caption text-fg-muted">
                  เปลี่ยนใจได้ — แตะคำใบ้อื่นแล้วกดยืนยันอีกครั้ง
                </p>
              )}
            </div>

            <div className="mt-5 border-t-2 border-ink pt-4">
              <PlayerProgress
                label="โหวตแล้ว"
                done={voteCount}
                total={totalPlayers}
                players={uniquePlayerIds.map((id) => ({
                  id,
                  name: playerNames[id],
                  done: votedPlayerIds.has(id),
                }))}
              />
            </div>
          </>
        )}
      </Card>

      {/* คำใบ้ของตัวเอง: แก้ได้จนกว่าจะถูกเปิด */}
      {myOpenAnswers.length > 0 && (
        <Card padding="sm" variant="muted" className="lg:order-1">
          <Heading level="h3" as="h3" className="mb-0.5">
            คำใบ้ของคุณ
          </Heading>
          <Text variant="caption" tone="muted" className="mb-3">
            แก้ได้จนกว่าเลขนั้นจะถูกเปิด
          </Text>

          <div className="space-y-2">
            {myOpenAnswers.map((ans) => {
              const isEditing = editing.includes(ans.answerIndex) || !ans.answer;
              const value = answers[ans.answerIndex] ?? "";
              const isSaving = savingIndex === ans.answerIndex;

              return (
                <div
                  key={ans.answerIndex}
                  className="rounded-md border-2 border-ink bg-surface p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 min-w-[2.75rem] shrink-0 items-center justify-center rounded-sm border-2 border-ink bg-primary px-1.5 font-number text-h2 font-bold tabular-nums text-primary-on">
                      {ans.number}
                    </span>
                    {!isEditing ? (
                      <>
                        <p className="min-w-0 flex-1 break-words text-body font-semibold">
                          {ans.answer}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 px-2"
                          onClick={() => setEditing((prev) => [...prev, ans.answerIndex])}
                          icon={<LuPencil aria-hidden />}
                          aria-label={`แก้ไขคำใบ้ของเลข ${ans.number}`}
                        />
                      </>
                    ) : (
                      <Text variant="caption" tone="muted" as="span" className="flex-1">
                        {ans.answer ? "กำลังแก้ไขคำใบ้" : "ยังไม่มีคำใบ้"}
                      </Text>
                    )}
                  </div>

                  {isEditing && (
                    <div className="mt-2">
                      <Textarea
                        rows={2}
                        aria-label={`คำใบ้สำหรับเลข ${ans.number}`}
                        placeholder={`คำใบ้สำหรับเลข ${ans.number}...`}
                        value={value}
                        onChange={(e) =>
                          setAnswers({ ...answers, [ans.answerIndex]: e.target.value })
                        }
                      />
                      <div className="mt-2 flex gap-2">
                        {ans.answer && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelEdit(ans)}
                            icon={<LuX aria-hidden />}
                          >
                            ยกเลิก
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="flex-1"
                          loading={isSaving}
                          disabled={!value.trim() || value.trim() === ans.answer || submitting}
                          onClick={() => saveHint(ans.answerIndex)}
                        >
                          บันทึก
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
