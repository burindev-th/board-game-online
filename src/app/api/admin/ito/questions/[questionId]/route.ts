/**
 * API Routes for ITO Question Management (Single Question)
 * GET    /api/admin/ito/questions/[questionId]  - Get single question
 * PUT    /api/admin/ito/questions/[questionId]  - Update question
 * DELETE /api/admin/ito/questions/[questionId]  - Delete question
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { apiAdminError, apiError } from '@/lib/api/response';
import { validateQuestionText } from '../validation';

interface RouteContext {
  params: Promise<{
    questionId: string;
  }>;
}

function questionNotFound(questionId: string) {
  return apiError('Not found', 404, {
    message: `Question with ID ${questionId} not found`,
  });
}

/**
 * GET /api/admin/ito/questions/[questionId]
 * Get single question by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { questionId } = await context.params;

    const docRef = doc(db, 'ito_questions', questionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return questionNotFound(questionId);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: docSnap.id,
        ...docSnap.data(),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching question:', error);
    return apiAdminError('Failed to fetch question', error);
  }
}

/**
 * PUT /api/admin/ito/questions/[questionId]
 * Update question
 *
 * Request Body:
 * {
 *   "questionsTH": "คำถามภาษาไทยที่แก้ไขแล้ว"
 * }
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { questionId } = await context.params;
    const body = await request.json();

    // Validation
    const invalid = validateQuestionText(body.questionsTH);
    if (invalid) return invalid;

    // Check if question exists
    const docRef = doc(db, 'ito_questions', questionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return questionNotFound(questionId);
    }

    // Update question
    await updateDoc(docRef, {
      questionsTH: body.questionsTH.trim(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully',
      data: {
        id: questionId,
        questionsTH: body.questionsTH.trim(),
      },
    });
  } catch (error) {
    console.error('❌ Error updating question:', error);
    return apiAdminError('Failed to update question', error);
  }
}

/**
 * DELETE /api/admin/ito/questions/[questionId]
 * Delete question
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { questionId } = await context.params;

    // Check if question exists
    const docRef = doc(db, 'ito_questions', questionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return questionNotFound(questionId);
    }

    // Delete question
    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
      data: {
        id: questionId,
      },
    });
  } catch (error) {
    console.error('❌ Error deleting question:', error);
    return apiAdminError('Failed to delete question', error);
  }
}
