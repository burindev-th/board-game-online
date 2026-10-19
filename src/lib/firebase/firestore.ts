/**
 * Firestore Utilities
 * ฟังก์ชันสำหรับจัดการข้อมูลใน Firestore
 */

import {
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { roomPlayerRef, roomPlayersRef, roomRef } from './refs';

/**
 * ข้อมูลเริ่มต้นของผู้เล่นใหม่ในห้อง (ใช้ตอนสร้างห้องและเข้าร่วมห้อง)
 */
export function createPlayerData(playerId: string, playerName: string, isHost: boolean) {
  return {
    id: playerId,
    name: playerName.trim(),
    isHost,
    isReady: false,
    isOnline: true,
    joinedAt: serverTimestamp(),
  };
}

/**
 * Kick Player - ลบผู้เล่นออกจากห้อง (เฉพาะ host)
 */
export async function kickPlayer(roomId: string, playerId: string): Promise<void> {
  try {
    // ลบ player document
    const playerRef = roomPlayerRef(roomId, playerId);
    await deleteDoc(playerRef);

    // ลดจำนวนผู้เล่นในห้อง
    const roomDocRef = roomRef(roomId);
    await updateDoc(roomDocRef, {
      currentPlayers: increment(-1),
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Kicked player ${playerId} from room ${roomId}`);
  } catch (error) {
    console.error('Error kicking player:', error);
    throw new Error('ไม่สามารถเตะผู้เล่นออกได้');
  }
}

/**
 * Toggle Ready - เปลี่ยนสถานะ ready ของผู้เล่น
 */
export async function toggleReady(
  roomId: string,
  playerId: string,
  currentReadyState: boolean
): Promise<void> {
  try {
    const playerRef = roomPlayerRef(roomId, playerId);
    await updateDoc(playerRef, {
      isReady: !currentReadyState,
    });

    console.log(`✅ Toggled ready state for player ${playerId}`);
  } catch (error) {
    console.error('Error toggling ready:', error);
    throw new Error('ไม่สามารถเปลี่ยนสถานะ Ready ได้');
  }
}

/**
 * Leave Room - ออกจากห้อง
 */
export async function leaveRoom(roomId: string, playerId: string): Promise<void> {
  try {
    // ดึงข้อมูลห้องและผู้เล่น
    const roomDocRef = roomRef(roomId);
    const roomSnap = await getDoc(roomDocRef);

    if (!roomSnap.exists()) {
      throw new Error('ไม่พบห้อง');
    }

    const roomData = roomSnap.data();
    const isHost = roomData.hostId === playerId;

    // ลบ player
    const playerRef = roomPlayerRef(roomId, playerId);
    await deleteDoc(playerRef);

    // ถ้าเป็น host และยังมีคนอย่ใน่ห้อง
    if (isHost && roomData.currentPlayers > 1) {
      // หา player ถัดไปให้เป็น host
      const playersRef = roomPlayersRef(roomId);
      const q = query(playersRef, orderBy('joinedAt', 'asc'), limit(1));
      const playersSnap = await getDocs(q);

      if (!playersSnap.empty) {
        const newHostId = playersSnap.docs[0].id;

        // โอนสิทธิ์ host
        await updateDoc(roomDocRef, {
          hostId: newHostId,
          currentPlayers: increment(-1),
          updatedAt: serverTimestamp(),
        });

        // อัพเดทผู้เล่นใหม่เป็น host
        const newHostRef = roomPlayerRef(roomId, newHostId);
        await updateDoc(newHostRef, {
          isHost: true,
        });

        console.log(`✅ Transferred host to ${newHostId}`);
      }
    } else if (roomData.currentPlayers <= 1) {
      // ถ้าไม่มีคนเหลือ ลบห้อง
      await deleteDoc(roomDocRef);
      console.log(`✅ Deleted empty room ${roomId}`);
    } else {
      // ถ้าไม่ใช่ host แค่ลดจำนวนผู้เล่น
      await updateDoc(roomDocRef, {
        currentPlayers: increment(-1),
        updatedAt: serverTimestamp(),
      });
    }

    console.log(`✅ Player ${playerId} left room ${roomId}`);
  } catch (error) {
    console.error('Error leaving room:', error);
    throw new Error('ไม่สามารถออกจากห้องได้');
  }
}

/**
 * Start Game - เริ่มเกม (เฉพาะ host)
 */
export async function startGame(roomId: string): Promise<void> {
  try {
    const roomDocRef = roomRef(roomId);
    await updateDoc(roomDocRef, {
      status: 'playing',
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Started game in room ${roomId}`);
  } catch (error) {
    console.error('Error starting game:', error);
    throw new Error('ไม่สามารถเริ่มเกมได้');
  }
}

/**
 * Update Room Settings - อัพเดทการตั้งค่าห้อง (เฉพาะ host)
 */
export async function updateRoomSettings(
  roomId: string,
  hostId: string,
  settings: {
    maxPlayers?: number;
    timeLimit?: number;
  }
): Promise<void> {
  try {
    // Verify room exists and user is host
    const roomDocRef = roomRef(roomId);
    const roomSnap = await getDoc(roomDocRef);

    if (!roomSnap.exists()) {
      throw new Error('ไม่พบห้อง');
    }

    const roomData = roomSnap.data();

    if (roomData.hostId !== hostId) {
      throw new Error('เฉพาะ host เท่านั้นที่สามารถเปลี่ยนการตั้งค่าได้');
    }

    // Guard: maxPlayers must be >= current players
    if (settings.maxPlayers !== undefined) {
      if (settings.maxPlayers < roomData.currentPlayers) {
        throw new Error(`จำนวนผู้เล่นสูงสุดต้องมากกว่าหรือเท่ากับจำนวนผู้เล่นปัจจุบัน (${roomData.currentPlayers} คน)`);
      }
    }

    // Update only provided settings
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (settings.maxPlayers !== undefined) {
      updateData.maxPlayers = settings.maxPlayers;
    }

    if (settings.timeLimit !== undefined) {
      updateData.timeLimit = settings.timeLimit;
    }

    await updateDoc(roomDocRef, updateData);

    console.log(`✅ Updated room settings in room ${roomId}`);
  } catch (error) {
    console.error('Error updating room settings:', error);
    throw error;
  }
}
