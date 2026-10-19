/**
 * Date Utilities
 * แปลงค่าเวลาจาก Firestore (Timestamp) หรือค่าทั่วไปเป็น Date และจัดรูปแบบแสดงผล
 */

type TimestampLike = { toDate: () => Date };

function isTimestampLike(value: unknown): value is TimestampLike {
  return typeof (value as TimestampLike | null)?.toDate === 'function';
}

/**
 * แปลง Firestore Timestamp / Date / string / number เป็น Date
 */
export function toDate(value: unknown): Date {
  if (isTimestampLike(value)) return value.toDate();
  return new Date(value as string | number | Date);
}

/**
 * จัดรูปแบบวันเวลาแบบไทย เช่น "19 ต.ค. 2569 14:30" (ไม่มีค่า = "-")
 */
export function formatThaiDateTime(value: unknown): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(toDate(value));
}
