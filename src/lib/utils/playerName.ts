/**
 * Player Name Utilities
 * ฟังก์ชันสำหรับตรวจสอบชื่อผู้เล่น
 */

export const PLAYER_NAME_MAX_LENGTH = 20;

/**
 * ตรวจสอบความถูกต้องของชื่อผู้เล่น
 */
export function validatePlayerName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 20;
}

/**
 * ข้อความ error ของช่องกรอกชื่อในฟอร์ม (คืน "" ถ้าผ่าน)
 */
export function getPlayerNameError(name: string): string {
  if (!name.trim()) return 'กรุณากรอกชื่อผู้เล่น';
  if (name.length > PLAYER_NAME_MAX_LENGTH) return `ชื่อต้องไม่เกิน ${PLAYER_NAME_MAX_LENGTH} ตัวอักษร`;
  return '';
}

/**
 * ตรวจชื่อผู้เล่นที่ส่งมากับ API request (คืน null ถ้าผ่าน)
 */
export function getPlayerNameApiError(playerName: unknown): string | null {
  if (!playerName || typeof playerName !== 'string') return 'กรุณากรอกชื่อผู้เล่น';
  if (playerName.trim().length === 0) return 'ชื่อผู้เล่นไม่สามารถว่างได้';
  if (playerName.length > PLAYER_NAME_MAX_LENGTH) return `ชื่อผู้เล่นต้องไม่เกิน ${PLAYER_NAME_MAX_LENGTH} ตัวอักษร`;
  return null;
}
