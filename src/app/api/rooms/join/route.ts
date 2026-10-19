/**
 * API Route: เข้าร่วมห้องเกม
 * POST /api/rooms/join
 * Body: { code: string, playerName: string }
 * Response: { success: true, roomId: string, playerId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { roomPlayersRef, roomRef } from '@/lib/firebase/refs';
import { createPlayerData } from '@/lib/firebase/firestore';
import { apiError, apiServerError } from '@/lib/api/response';
import { validateRoomCode } from '@/lib/utils/roomCode';
import { getPlayerNameApiError } from '@/lib/utils/playerName';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { code, playerName } = body;

    // Validation - Room Code
    if (!code || typeof code !== 'string') {
      return apiError('กรุณากรอกรหัสห้อง', 400);
    }

    if (!validateRoomCode(code)) {
      return apiError('รหัสห้องไม่ถูกต้อง (ต้องเป็นตัวเลข 6 หลัก)', 400);
    }

    // Validation - Player Name
    const playerNameError = getPlayerNameApiError(playerName);
    if (playerNameError) {
      return apiError(playerNameError, 400);
    }

    // Find room by code
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('code', '==', code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return apiError('ไม่พบห้อง กรุณาตรวจสอบรหัสห้องอีกครั้ง', 404);
    }

    // Get room data
    const roomDoc = querySnapshot.docs[0];
    const roomData = roomDoc.data();
    const roomId = roomDoc.id;

    // Validate room status
    if (roomData.status !== 'waiting') {
      return apiError('เกมเริ่มแล้ว ไม่สามารถเข้าร่วมได้', 400);
    }

    // Validate room capacity
    if (roomData.currentPlayers >= roomData.maxPlayers) {
      return apiError('ห้องเต็มแล้ว ไม่สามารถเข้าร่วมได้', 400);
    }

    // Create new player
    const playersRef = roomPlayersRef(roomId);
    const playerDoc = doc(playersRef);
    const playerId = playerDoc.id;

    const playerData = createPlayerData(playerId, playerName, false);

    // Save player to Firestore
    await setDoc(playerDoc, playerData);

    // Update room's currentPlayers count
    await updateDoc(roomRef(roomId), {
      currentPlayers: increment(1),
      updatedAt: serverTimestamp(),
    });

    // Return success response
    return NextResponse.json({
      success: true,
      roomId: roomId,
      playerId: playerId,
      code: code,
    });

  } catch (error) {
    console.error('Error joining room:', error);
    return apiServerError('เกิดข้อผิดพลาดในการเข้าร่วมห้อง กรุณาลองใหม่อีกครั้ง', error);
  }
}
