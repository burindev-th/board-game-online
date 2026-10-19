/**
 * API Route: เริ่มเกม
 * POST /api/rooms/[roomId]/start
 * Body: { hostId: string }
 * Response: { success: true, gameId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { initializeItoGame } from '@/lib/firebase/ito';
import { gameRef, roomPlayersRef, roomRef as getRoomRef } from '@/lib/firebase/refs';
import { apiError, apiServerError } from '@/lib/api/response';
import { ITO_GAME_ID } from '@/constants/ito';

interface StartGameRequest {
  hostId: string;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { roomId } = await context.params;

    // Parse request body
    const body: StartGameRequest = await request.json();
    const { hostId } = body;

    // Validation - hostId
    if (!hostId || typeof hostId !== 'string') {
      return apiError('กรุณาระบุ hostId', 400);
    }

    // Get room document
    const roomRef = getRoomRef(roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      return apiError('ไม่พบห้อง', 404);
    }

    const roomData = roomSnap.data();

    // Validation - Check if requester is the host
    if (roomData.hostId !== hostId) {
      return apiError('คุณไม่ใช่หัวหน้าห้อง', 403);
    }

    // Validation - Check if room already started
    if (roomData.status === 'playing') {
      return apiError('เกมเริ่มแล้ว', 400);
    }

    // Get game details to check minPlayer
    const gameSnap = await getDoc(gameRef(roomData.gameId));

    if (!gameSnap.exists()) {
      return apiError('ไม่พบข้อมูลเกม', 404);
    }

    const gameInfo = gameSnap.data();
    const minPlayers = gameInfo.minPlayer || 2;

    // Validation - Check minimum players
    if (roomData.currentPlayers < minPlayers) {
      return apiError(`ต้องมีผู้เล่นอย่างน้อย ${minPlayers} คน`, 400);
    }

    // Get all players (sorted by joinedAt)
    const playersRef = roomPlayersRef(roomId);
    const playersQuery = query(playersRef, orderBy('joinedAt', 'asc'));
    const playersSnap = await getDocs(playersQuery);

    if (playersSnap.empty || playersSnap.size < minPlayers) {
      return apiError(`ต้องมีผู้เล่นอย่างน้อย ${minPlayers} คน`, 400);
    }

    // Validation - Check if all players are ready (except host)
    const allPlayersReady = playersSnap.docs.every((playerDoc) => {
      const playerData = playerDoc.data();
      // Host doesn't need to be ready, or all players including host must be ready
      return playerData.isReady === true || playerData.isHost === true;
    });

    if (!allPlayersReady) {
      return apiError('ผู้เล่นทุกคนต้องกด Ready ก่อน', 400);
    }

    // Create game session document
    const gameSessionsRef = collection(db, 'game_sessions');
    const gameSessionDoc = doc(gameSessionsRef);
    const gameSessionId = gameSessionDoc.id;

    // Base game session data
    const gameSessionData = {
      id: gameSessionId,
      roomId: roomId,
      gameId: roomData.gameId, // Reference to game type
      gameType: roomData.gameType, // Game name
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Save base game session document
    await setDoc(gameSessionDoc, gameSessionData);

    // Initialize game-specific logic
    if (roomData.gameId === ITO_GAME_ID) {
      // ITO Game - iTo
      const playerIds = playersSnap.docs.map((doc) => doc.id);
      const playerNames: { [key: string]: string } = {};
      playersSnap.docs.forEach((doc) => {
        playerNames[doc.id] = doc.data().name || 'Unknown';
      });

      const result = await initializeItoGame(gameSessionId, roomId, playerIds, playerNames);

      if (!result) {
        return apiError('ไม่สามารถเริ่มเกม ITO ได้', 500);
      }
    }

    // Update room status to 'playing'
    await updateDoc(roomRef, {
      status: 'playing',
      gameSessionId: gameSessionId,
      updatedAt: serverTimestamp(),
    });

    // Return success response
    return NextResponse.json({
      success: true,
      gameSessionId: gameSessionId,
      message: 'เริ่มเกมสำเร็จ',
    });
  } catch (error) {
    console.error('Error starting game:', error);
    return apiServerError('เกิดข้อผิดพลาดในการเริ่มเกม กรุณาลองใหม่อีกครั้ง', error);
  }
}
