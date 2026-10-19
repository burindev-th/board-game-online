/**
 * API Route: Reveal ITO Game Votes
 * POST /api/games/ito/[sessionId]/reveal
 *
 * Handles vote counting and number reveal with auto-reveal logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiError, apiServerError } from '@/lib/api/response';
import { countVotes, revealAndCheck, getRandomUnrevealedAnswer } from '@/lib/firebase/ito';
import { getDoc } from 'firebase/firestore';
import { gameSessionRef } from '@/lib/firebase/refs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;

    // Guard: Validate game exists and phase is 'voting'
    const sessionSnap = await getDoc(gameSessionRef(sessionId));

    if (!sessionSnap.exists()) {
      return apiError('Game not found', 404);
    }

    const gameState = sessionSnap.data();

    if (gameState.phase !== 'voting') {
      return apiError(`Cannot reveal from phase: ${gameState.phase}`, 400);
    }

    // Count votes to determine which number to reveal
    let winner = await countVotes(sessionId);

    // Fallback: If no votes, randomly select an unrevealed answer
    if (!winner) {
      winner = await getRandomUnrevealedAnswer(sessionId);

      if (!winner) {
        return apiError('ไม่มีคำตอบที่ยังไม่ถูก reveal', 400);
      }
    }

    // Reveal and check correctness (includes auto-reveal logic)
    const result = await revealAndCheck(sessionId, winner.playerId, winner.answerIndex);

    if (!result) {
      return apiError('ไม่สามารถเปิดเผยผลได้', 500);
    }

    return NextResponse.json(result);
  } catch (error) {
    return apiServerError('เกิดข้อผิดพลาด', error);
  }
}
