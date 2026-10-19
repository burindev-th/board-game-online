/**
 * Custom Hook: useAllGames
 * ดึงรายการเกมทั้งหมดจาก games collection (รวมเกมที่ไม่ active)
 * ใช้สำหรับหน้า Admin เท่านั้น
 * Listen แบบ real-time จาก Firestore
 */

'use client';

import { useGameList } from './useGames';

export function useAllGames() {
  return useGameList(true);
}
