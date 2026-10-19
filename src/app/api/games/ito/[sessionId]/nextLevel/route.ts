/**
 * API Route: Start Next Level in ITO Game
 * POST /api/games/ito/[sessionId]/nextLevel
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiError, apiServerError } from '@/lib/api/response';
import { startNextLevel } from '@/lib/firebase/ito';
import { getDoc, getDocs } from 'firebase/firestore';
import { gameSessionRef, sessionSubcollectionRef } from '@/lib/firebase/refs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;

    // 1. Get current game state
    const sessionSnap = await getDoc(gameSessionRef(sessionId));

    if (!sessionSnap.exists()) {
      return apiError('Game not found', 404);
    }

    const gameState = sessionSnap.data();
    const roomId = gameState.roomId;

    if (!roomId) {
      return apiError('Room ID not found in game state', 400);
    }

    // คำนวณ level ถัดไป
    const nextLevel = gameState.currentLevel + 1;

    // Guard: ตรวจสอบว่าเกินจำนวน level แล้วหรือไม่
    if (nextLevel > 3) {
      return apiError('All levels completed', 400);
    }

    // Guard: ตรวจสอบว่า phase ถูกต้องหรือไม่ (ต้องเป็น levelComplete)
    if (gameState.phase !== 'levelComplete') {
      return apiError(`Cannot start next level from phase: ${gameState.phase}`, 400);
    }

    // 2. Get player list from existing answers
    const answersRef = sessionSubcollectionRef(sessionId, 'player_answers');
    const answersSnap = await getDocs(answersRef);

    const playerIds: string[] = [];
    const playerNames: { [key: string]: string } = {};

    answersSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (!playerIds.includes(data.playerId)) {
        playerIds.push(data.playerId);
        playerNames[data.playerId] = data.playerName;
      }
    });


    // 3. Start next level

    const success = await startNextLevel(
      sessionId,
      roomId,
      playerIds,
      playerNames,
      nextLevel,
      gameState.hearts
    );

    if (success) {
      return NextResponse.json({
        success: true,
        level: nextLevel
      });
    } else {
      return apiError('Failed to start next level', 500);
    }
  } catch (error) {
    return apiServerError('เกิดข้อผิดพลาด', error);
  }
}
