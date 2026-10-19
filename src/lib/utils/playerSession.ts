/**
 * Player Session Storage
 * เก็บ playerId ของแต่ละห้องไว้ใน localStorage
 */

import { AGE_STORAGE_KEYS } from './ageStorage';

const LAST_PLAYER_ID_KEY = 'playerId';

function roomPlayerKey(roomId: string): string {
  return `room_${roomId}_playerId`;
}

/**
 * ล้าง localStorage ทั้งหมดก่อนเข้าห้องใหม่ (กันข้อมูลค้าง) แต่เก็บข้อมูลอายุไว้
 */
export function resetStorageKeepingAge(): void {
  const saved = AGE_STORAGE_KEYS.map((key) => [key, localStorage.getItem(key)] as const);
  localStorage.clear();
  saved.forEach(([key, value]) => {
    if (value) localStorage.setItem(key, value);
  });
}

export function savePlayerSession(roomId: string, playerId: string): void {
  localStorage.setItem(LAST_PLAYER_ID_KEY, playerId);
  localStorage.setItem(roomPlayerKey(roomId), playerId);
}

export function getRoomPlayerId(roomId: string): string | null {
  return localStorage.getItem(roomPlayerKey(roomId));
}

/**
 * ลบ playerId ของห้องนี้ (includeLastPlayerId = ลบ playerId ล่าสุดด้วย)
 */
export function clearRoomPlayerId(roomId: string, includeLastPlayerId = false): void {
  localStorage.removeItem(roomPlayerKey(roomId));
  if (includeLastPlayerId) localStorage.removeItem(LAST_PLAYER_ID_KEY);
}
