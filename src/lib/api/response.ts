/**
 * API Response Helpers
 * สร้าง JSON response รูปแบบเดียวกันสำหรับทุก API route
 */

import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/utils/error';

/**
 * Response แบบล้มเหลว: { success: false, error, ...extra }
 */
export function apiError(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error, ...extra }, { status });
}

/**
 * Response 500 สำหรับ error ที่ไม่คาดคิด แนบข้อความจริงไว้ใน details
 */
export function apiServerError(error: string, cause: unknown) {
  return apiError(error, 500, { details: getErrorMessage(cause) });
}

/**
 * Response 500 ของ admin API ที่แนบข้อความจริงไว้ใน message
 */
export function apiAdminError(error: string, cause: unknown) {
  return apiError(error, 500, { message: getErrorMessage(cause) });
}
