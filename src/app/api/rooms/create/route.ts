/**
 * API Route: สร้างห้องเกมใหม่
 * POST /api/rooms/create
 * Body: { playerName: string, gameId: string, maxPlayers: number }
 * Response: { success: true, roomId: string, code: string, playerId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { gameRef, roomPlayersRef } from '@/lib/firebase/refs';
import { createPlayerData } from '@/lib/firebase/firestore';
import { apiError, apiServerError } from '@/lib/api/response';
import { generateRoomCode } from '@/lib/utils/roomCode';
import { getPlayerNameApiError } from '@/lib/utils/playerName';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { playerName, gameId, maxPlayers, timeLimit } = body;

    // Validation - Player Name
    const playerNameError = getPlayerNameApiError(playerName);
    if (playerNameError) {
      return apiError(playerNameError, 400);
    }

    // Validation - Game ID
    if (!gameId || typeof gameId !== 'string') {
      return apiError('กรุณาเลือกเกม', 400);
    }

    // Fetch game details to validate maxPlayers
    const gameSnap = await getDoc(gameRef(gameId));

    if (!gameSnap.exists()) {
      return apiError('ไม่พบเกมที่เลือก', 404);
    }

    const gameData = gameSnap.data();
    const minPlayers = gameData.minPlayer || 2;
    const maxPlayersAllowed = gameData.maxPlayer || 8;
    const enableCustomTime = gameData.enableCustomTime || false;
    const defaultTimeMinutes = gameData.defaultTimeMinutes;

    // Validation - Max Players
    if (!maxPlayers || typeof maxPlayers !== 'number') {
      return apiError('กรุณาระบุจำนวนผู้เล่นสูงสุด', 400);
    }

    if (maxPlayers < minPlayers || maxPlayers > maxPlayersAllowed) {
      return apiError(`จำนวนผู้เล่นต้องอยู่ระหว่าง ${minPlayers}-${maxPlayersAllowed} คน สำหรับเกมนี้`, 400);
    }

    // Validation - Time Limit (if provided)
    let finalTimeLimit: number | undefined = undefined;
    if (timeLimit !== undefined && timeLimit !== null) {
      // Only validate if game supports custom time
      if (!enableCustomTime) {
        return apiError('เกมนี้ไม่รองรับการกำหนดเวลาเอง', 400);
      }

      if (typeof timeLimit !== 'number' || timeLimit < 1 || timeLimit > 120) {
        return apiError('เวลาเล่นต้องอยู่ระหว่าง 1-120 นาที', 400);
      }

      finalTimeLimit = timeLimit;
    } else if (enableCustomTime && defaultTimeMinutes) {
      // Use default time if game supports custom time but none provided
      finalTimeLimit = defaultTimeMinutes;
    }

    // Generate unique room code
    const code = generateRoomCode();

    // Create room document
    const roomsRef = collection(db, 'rooms');
    const roomDoc = doc(roomsRef);
    const roomId = roomDoc.id;

    // Create player document
    const playersRef = roomPlayersRef(roomId);
    const playerDoc = doc(playersRef);
    const playerId = playerDoc.id;

    // Room data
    const roomData = {
      id: roomId,
      code: code,
      gameId: gameId, // Store selected game ID
      gameType: gameData.name || 'Unknown Game', // Store game name for display
      hostId: playerId,
      status: 'waiting',
      maxPlayers: maxPlayers,
      currentPlayers: 1,
      ...(finalTimeLimit !== undefined && { timeLimit: finalTimeLimit }), // Add timeLimit only if defined
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Player data
    const playerData = createPlayerData(playerId, playerName, true);

    // Save to Firestore
    await setDoc(roomDoc, roomData);
    await setDoc(playerDoc, playerData);

    // Return success response
    return NextResponse.json({
      success: true,
      roomId: roomId,
      code: code,
      playerId: playerId,
    });

  } catch (error) {
    console.error('Error creating room:', error);
    return apiServerError('เกิดข้อผิดพลาดในการสร้างห้อง กรุณาลองใหม่อีกครั้ง', error);
  }
}
