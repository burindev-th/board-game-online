/**
 * Room Code Utilities
 * ฟังก์ชันสำหรับสร้างและตรวจสอบรหัสห้อง
 */

/**
 * สร้างรหัสห้องแบบสุ่ม 6 หลัก (ตัวเลขเท่านั้น)
 * @returns รหัสห้อง 6 หลัก เช่น "123456"
 */
export function generateRoomCode(): string {
  // สร้างเลข 6 หลัก (100000-999999)
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * ตรวจสอบความถูกต้องของรหัสห้อง
 * @param code - รหัสห้องที่ต้องการตรวจสอบ
 * @returns true ถ้ารหัสห้องถูกต้อง (6 หลัก ตัวเลขเท่านั้น)
 */
export function validateRoomCode(code: string): boolean {
  // ตรวจสอบว่าเป็นตัวเลข 6 หลัก
  const regex = /^\d{6}$/;
  return regex.test(code);
}

/** จำนวนหลักของรหัสห้อง */
export const ROOM_CODE_LENGTH = 6;

/**
 * แยกรหัสห้องเป็น 2 ส่วนสำหรับแสดงผลแบบ XXX-XXX
 * @param code - รหัสห้อง เช่น "123456"
 * @returns ["123", "456"]
 */
export function splitRoomCode(code: string): [string, string] {
  return [code.slice(0, 3), code.slice(3)];
}

/**
 * จัดรูปแบบรหัสห้องเป็น XXX-XXX (รองรับรหัสที่ยังพิมพ์ไม่ครบ)
 * @param code - รหัสห้อง เช่น "123456" หรือ "12"
 * @returns "123-456" หรือ "12"
 */
export function formatRoomCode(code: string): string {
  if (code.length <= 3) return code;
  return splitRoomCode(code).join("-");
}
