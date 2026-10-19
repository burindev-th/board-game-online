/**
 * ITO Game Component (Refactored)
 * เกมความสามัคคี - เรียงลำดับตัวเลขโดยการสื่อสาร
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useItoGame } from "@/lib/hooks/useItoGame";
import { useVotes } from "@/lib/hooks/useVotes";
import { useReadyStatus } from "@/lib/hooks/useReadyStatus";
import {
  submitPlayerAnswer,
  unsendPlayerAnswer,
  submitVote,
  startVotingPhase,
  updateSessionPhase,
} from "@/lib/firebase/ito";
import { getUniquePlayerIds } from "@/lib/utils/playerStatusUtils";
import { createAnswerId, parseAnswerId } from "@/lib/utils/voteUtils";
import { requestJson } from "@/lib/utils/apiClient";

// Components
import { Spinner } from "@/components/ui";
import GameHeader from "./ito/GameHeader";
import WritingPhase from "./ito/phases/WritingPhase";
import VotingPhase from "./ito/phases/VotingPhase";
import RevealPhase from "./ito/phases/RevealPhase";
import LevelCompletePhase from "./ito/phases/LevelCompletePhase";
import FinishedPhase from "./ito/phases/FinishedPhase";

interface ItoGameProps {
  sessionId: string;
  playerId: string;
}

// Extended type for answers with answerIndex
type ItoPlayerAnswerWithIndex = {
  playerId: string;
  playerName: string;
  number: number;
  answer: string;
  submittedAt?: Date;
  isRevealed: boolean;
  answerIndex: number;
};

export default function ItoGame({ sessionId, playerId }: ItoGameProps) {
  const { gameState, playerAnswers, myAnswers, loading } = useItoGame(
    sessionId,
    playerId
  );
  const { votes, voteCount, loading: votesLoading } = useVotes(sessionId);
  const { readyPlayers, readyCount } = useReadyStatus(sessionId);

  const [answers, setAnswers] = useState<{ [answerIndex: number]: string }>({});
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [revealing, setRevealing] = useState(false);

  const prevAnswersRef = useRef<string>("");
  const prevLevelRef = useRef<number>(0);
  const prevVoteCountRef = useRef<number>(0);
  const hasLoadedVotesRef = useRef<boolean>(false);
  const mountTimeRef = useRef<number>(Date.now());

  // ค่า primitive สำหรับ effect deps (gameState เป็น object ใหม่ทุก snapshot)
  const currentLevel = gameState?.currentLevel;
  const phase = gameState?.phase;
  const phaseEndTimeMs = gameState?.phaseEndTime?.getTime();

  // Clear answers when level changes
  useEffect(() => {
    if (currentLevel === undefined) return;

    if (prevLevelRef.current === 0) {
      prevLevelRef.current = currentLevel;
      return;
    }

    if (prevLevelRef.current !== currentLevel) {
      setAnswers({});
      prevAnswersRef.current = "";
      prevLevelRef.current = currentLevel;
    }
  }, [currentLevel]);

  // Auto-fill answers if already submitted
  useEffect(() => {
    if (!gameState || myAnswers.length === 0) return;

    const answersWithIndex = myAnswers as unknown as ItoPlayerAnswerWithIndex[];
    const expectedAnswersCount = gameState.currentLevel;

    if (myAnswers.length !== expectedAnswersCount) {
      return;
    }

    const hasStaleData = answersWithIndex.some(
      (ans) => ans.answer !== "" && !ans.submittedAt
    );

    if (hasStaleData) {
      return;
    }

    const answersKey = `L${gameState.currentLevel}|${answersWithIndex
      .map(
        (a) => `${a.answerIndex}:${a.answer || ""}:${a.submittedAt ? "1" : "0"}`
      )
      .sort()
      .join("|")}`;

    if (prevAnswersRef.current === answersKey) return;

    prevAnswersRef.current = answersKey;

    setAnswers((prevAnswers) => {
      const newAnswers = { ...prevAnswers };
      answersWithIndex.forEach((ans) => {
        if (ans.submittedAt) {
          newAnswers[ans.answerIndex] = ans.answer || "";
        } else if (!prevAnswers[ans.answerIndex]) {
          newAnswers[ans.answerIndex] = "";
        }
      });
      return newAnswers;
    });
  }, [myAnswers, gameState]);

  // Auto-transition from Writing to Voting when all players submitted
  useEffect(() => {
    if (!gameState || gameState.phase !== "writing") return;
    if (playerAnswers.length === 0) return;

    const uniquePlayerIds = getUniquePlayerIds(playerAnswers);
    const expectedAnswersPerPlayer = gameState.currentLevel;
    const totalExpectedAnswers = uniquePlayerIds.length * expectedAnswersPerPlayer;

    // ตรวจสอบว่าทุกคนส่งคำใบ้ครบหรือยัง
    const allSubmitted = playerAnswers.every(
      (ans) => ans.answer.trim() !== "" && ans.submittedAt !== undefined && ans.submittedAt !== null
    );

    const hasCorrectCount = playerAnswers.length === totalExpectedAnswers;

    if (allSubmitted && hasCorrectCount) {
      // เรียก API เพื่อเริ่ม Voting Phase พร้อม timer
      const startVoting = async () => {
        try {
          const response = await requestJson(`/api/games/ito/${sessionId}/startVoting`, {
            roomId: gameState.roomId,
          });

          if (!response.ok) {
            console.error("Failed to start voting phase");
          }
        } catch (error) {
          console.error("Error starting voting phase:", error);
        }
      };

      startVoting();
    }
  }, [gameState, playerAnswers, sessionId]);

  // Handle submit answer
  const handleSubmitAnswer = async (answerIndex: number) => {
    const answer = answers[answerIndex];
    if (!answer?.trim() || !gameState || submitting) return;

    setSubmitting(true);
    const success = await submitPlayerAnswer(
      sessionId,
      playerId,
      answer.trim(),
      answerIndex
    );

    if (!success) {
      alert("เกิดข้อผิดพลาดในการส่งคำตอบ");
    }
    setSubmitting(false);
  };

  // Handle edit answer
  const handleEditAnswer = async (answerIndex: number) => {
    if (submitting) return;

    setSubmitting(true);
    const success = await unsendPlayerAnswer(sessionId, playerId, answerIndex);

    if (!success) {
      alert("เกิดข้อผิดพลาดในการแก้ไขคำตอบ");
    }
    setSubmitting(false);
  };

  // Handle submit vote
  const handleSubmitVote = async () => {
    if (!selectedAnswerId || submitting) return;

    const { playerId: votedPlayerId, answerIndex } = parseAnswerId(selectedAnswerId);

    setSubmitting(true);
    const success = await submitVote(
      sessionId,
      playerId,
      votedPlayerId,
      answerIndex
    );

    if (!success) {
      alert("เกิดข้อผิดพลาดในการโหวต");
    }
    setSubmitting(false);
  };

  // Handle reveal votes
  const handleRevealVotes = useCallback(async () => {
    // Guard: Prevent multiple simultaneous reveals
    if (revealing) return;

    setRevealing(true);
    try {
      await requestJson(`/api/games/ito/${sessionId}/reveal`);
    } catch (error) {
      console.error('Reveal error:', error);
    } finally {
      setTimeout(() => setRevealing(false), 2000);
    }
  }, [revealing, sessionId]);

  // Reset flags when entering voting phase
  useEffect(() => {
    if (gameState?.phase === "voting") {
      prevVoteCountRef.current = 0;
      hasLoadedVotesRef.current = false;
      mountTimeRef.current = Date.now();
    }
  }, [gameState?.phase]);

  // Restore vote selection if player already voted
  useEffect(() => {
    if (!gameState || gameState.phase !== "voting") return;
    if (!votes || votes.length === 0) return;

    const myVote = votes.find((v) => v.playerId === playerId);

    if (myVote && !selectedAnswerId) {
      const restoredAnswerId = createAnswerId(myVote.votedForPlayerId, myVote.votedForAnswerIndex);
      setSelectedAnswerId(restoredAnswerId);
    }
  }, [votes, gameState, playerId, selectedAnswerId]);

  // Auto-reveal when all players have voted
  useEffect(() => {
    if (!gameState || gameState.phase !== "voting" || revealing || votesLoading) return;

    // Guard: Prevent auto-reveal within 2 seconds of mount (F5 protection)
    const timeSinceMount = Date.now() - mountTimeRef.current;
    if (timeSinceMount < 2000) return;

    // Track initial vote load
    if (!hasLoadedVotesRef.current) {
      hasLoadedVotesRef.current = true;
      prevVoteCountRef.current = voteCount;
      return;
    }

    // Count players and validate game state
    const uniquePlayerIds = getUniquePlayerIds(playerAnswers);
    const totalPlayers = uniquePlayerIds.length;
    const expectedAnswersPerPlayer = gameState.currentLevel;

    // Guard: Ensure vote count is increasing
    if (voteCount < prevVoteCountRef.current) {
      prevVoteCountRef.current = voteCount;
      return;
    }

    // Guard: Wait until all players have voted
    if (voteCount === prevVoteCountRef.current && voteCount < totalPlayers) {
      return;
    }

    prevVoteCountRef.current = voteCount;

    // Validate game can continue
    const unrevealedAnswers = playerAnswers.filter(a => !a.isRevealed);
    const hasUnrevealedAnswersToVote = unrevealedAnswers.length > 0;
    const allPlayersHaveAllAnswers = uniquePlayerIds.every(playerId => {
      const playerTotalAnswers = playerAnswers.filter(a => a.playerId === playerId);
      return playerTotalAnswers.length === expectedAnswersPerPlayer;
    });

    // Trigger reveal when conditions are met
    if (
      totalPlayers >= 2 &&
      hasUnrevealedAnswersToVote &&
      allPlayersHaveAllAnswers &&
      voteCount === totalPlayers &&
      voteCount > 0
    ) {
      handleRevealVotes();
    }
  }, [voteCount, gameState, playerAnswers, revealing, handleRevealVotes, votesLoading]);

  // Auto-reveal when voting timer expires
  useEffect(() => {
    if (!gameState || revealing) return;

    // Guard: Prevent auto-reveal within 2 seconds of mount
    const timeSinceMount = Date.now() - mountTimeRef.current;
    if (timeSinceMount < 2000) return;

    // Trigger reveal when time is up
    if (
      timeLeft === 0 &&
      gameState.phase === "voting" &&
      playerAnswers.length > 0
    ) {
      handleRevealVotes();
    }
  }, [timeLeft, gameState, revealing, playerAnswers, handleRevealVotes]);

  // Count remaining time (เฉพาะ Voting Phase เท่านั้น)
  useEffect(() => {
    if (phaseEndTimeMs === undefined) {
      setTimeLeft(0);
      return;
    }

    // ไม่แสดง timer ใน Writing Phase
    if (phase === "writing") {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((phaseEndTimeMs - now) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phaseEndTimeMs, phase]);

  // Auto-transition from reveal phase
  useEffect(() => {
    if (!gameState || gameState.phase !== "reveal") return;

    const timer = setTimeout(async () => {
      const allRevealedInLevel =
        gameState.revealedNumbers.length >= gameState.totalRounds;

      if (gameState.status === "lost" || gameState.status === "won") {
        await updateSessionPhase(sessionId, "finished");
      } else if (allRevealedInLevel) {
        await updateSessionPhase(sessionId, "levelComplete");
      } else {
        await startVotingPhase(sessionId, gameState.roomId);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [gameState, sessionId]);

  // Auto-check if all players ready (levelComplete phase)
  useEffect(() => {
    if (!gameState || gameState.phase !== "levelComplete") return;

    const checkReady = async () => {
      const totalPlayers = getUniquePlayerIds(playerAnswers).length;

      if (readyCount === totalPlayers && totalPlayers > 0) {
        try {
          // Guard: Ensure phase is levelComplete before proceeding
          if (gameState.phase !== "levelComplete") return;

          // All levels completed - finish game
          if (gameState.currentLevel >= gameState.totalLevels) {
            await updateSessionPhase(sessionId, "finished", { status: "won" });
            return;
          }

          // Start next level
          const response = await requestJson(`/api/games/ito/${sessionId}/nextLevel`);

          if (!response.ok) {
            const result = await response.json();
            console.error('Failed to start next level:', result);
          }
        } catch (error) {
          console.error('Error in checkReady:', error);
        }
      }
    };

    checkReady();
  }, [gameState, sessionId, readyCount, playerAnswers]);

  // Loading state
  if (loading || !gameState) {
    return (
      <div className="flex flex-col items-center gap-3 text-center text-fg">
        <Spinner size="lg" />
        <p className="text-h3">กำลังโหลดเกม...</p>
      </div>
    );
  }

  const answersWithIndex = myAnswers as unknown as ItoPlayerAnswerWithIndex[];

  return (
    <div className="relative">
      {/* Game Header - Sticky */}
      <GameHeader
        questionText={gameState.questionText}
        createdBy={gameState.questionCreatedBy}
        revealedCount={gameState.revealedNumbers.length}
        totalRounds={gameState.totalRounds}
        currentLevel={gameState.currentLevel}
        totalLevels={gameState.totalLevels}
        hearts={gameState.hearts}
        phase={gameState.phase}
        status={gameState.status}
        lastRevealResult={gameState.lastRevealResult || null}
        timeLeft={timeLeft}
        phaseEndTime={gameState.phaseEndTime}
        myNumbers={[...answersWithIndex]
          .sort((a, b) => a.answerIndex - b.answerIndex)
          .map((a) => ({ number: a.number, isRevealed: a.isRevealed }))}
      />

      {/* Content Container */}
      <div className="space-y-4 md:space-y-6">
      {/* Phase: Writing */}
      {gameState.phase === "writing" && (
        <WritingPhase
          myAnswers={answersWithIndex}
          playerAnswers={playerAnswers}
          gameState={gameState}
          answers={answers}
          setAnswers={setAnswers}
          submitting={submitting}
          handleSubmitAnswer={handleSubmitAnswer}
          handleEditAnswer={handleEditAnswer}
        />
      )}

      {/* Phase: Voting */}
      {gameState.phase === "voting" && (
        <VotingPhase
          myAnswers={answersWithIndex}
          playerAnswers={playerAnswers}
          votes={votes}
          voteCount={voteCount}
          playerId={playerId}
          gameState={gameState}
          answers={answers}
          setAnswers={setAnswers}
          selectedAnswerId={selectedAnswerId}
          setSelectedAnswerId={setSelectedAnswerId}
          submitting={submitting}
          handleSubmitAnswer={handleSubmitAnswer}
          handleSubmitVote={handleSubmitVote}
        />
      )}

      {/* Phase: Reveal */}
      {gameState.phase === "reveal" && (
        <RevealPhase
          playerAnswers={playerAnswers}
          gameState={gameState}
          lastRevealResult={gameState.lastRevealResult || null}
        />
      )}

      {/* Phase: Level Complete */}
      {gameState.phase === "levelComplete" && (
        <LevelCompletePhase
          sessionId={sessionId}
          playerId={playerId}
          playerAnswers={playerAnswers}
          readyPlayers={readyPlayers}
          readyCount={readyCount}
          gameState={gameState}
          submitting={submitting}
          setSubmitting={setSubmitting}
        />
      )}

      {/* Phase: Finished */}
      {gameState.phase === "finished" && (
        <FinishedPhase playerAnswers={playerAnswers} gameState={gameState} />
      )}
      </div>
    </div>
  );
}
