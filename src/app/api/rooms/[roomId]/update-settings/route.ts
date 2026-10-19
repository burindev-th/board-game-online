/**
 * API Route: Update Room Settings
 * PATCH /api/rooms/[roomId]/update-settings
 *
 * Allows host to update room settings (maxPlayers, timeLimit, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateRoomSettings } from '@/lib/firebase/firestore';
import { apiError } from '@/lib/api/response';
import { getErrorMessage } from '@/lib/utils/error';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params;
    const body = await request.json();
    const { hostId, maxPlayers, timeLimit } = body;

    // Validation
    if (!hostId) {
      return apiError('Host ID is required', 400);
    }

    if (maxPlayers !== undefined) {
      if (typeof maxPlayers !== 'number' || maxPlayers < 2 || maxPlayers > 10) {
        return apiError('Max players must be between 2 and 10', 400);
      }
    }

    // Update room settings
    await updateRoomSettings(roomId, hostId, {
      maxPlayers,
      timeLimit,
    });

    return NextResponse.json({
      success: true,
      message: 'Room settings updated successfully',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return apiError(getErrorMessage(error, 'Failed to update room settings'), 500);
  }
}
