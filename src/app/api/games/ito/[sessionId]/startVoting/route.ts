/**
 * API Route: Start Voting Phase with Timer
 * POST /api/games/ito/[sessionId]/startVoting
 *
 * เรียกใช้เมื่อทุกคนส่งคำใบ้ครบแล้ว เพื่อเข้า Voting Phase และเริ่มจับเวลา
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiError, apiServerError } from '@/lib/api/response';
import { startVotingPhase } from '@/lib/firebase/ito';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;
    const body = await request.json();
    const { roomId } = body;

    if (!roomId) {
      return apiError('roomId is required', 400);
    }

    // เริ่ม Voting Phase และตั้ง timer
    const success = await startVotingPhase(sessionId, roomId);

    if (!success) {
      return apiError('Failed to start voting phase', 500);
    }

    return NextResponse.json({
      success: true,
      message: 'Voting phase started with timer'
    });
  } catch (error) {
    return apiServerError('เกิดข้อผิดพลาด', error);
  }
}
