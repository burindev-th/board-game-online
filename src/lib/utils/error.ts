/**
 * Error Utilities
 * ดึงข้อความจาก error ที่ไม่รู้ชนิด (ใช้ได้ทั้งฝั่ง client และ server)
 */

export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  return error instanceof Error ? error.message : fallback;
}
