/**
 * Validation ร่วมของ ITO Question admin API
 */

import { apiError } from '@/lib/api/response';

export function validationError(message: string) {
  return apiError('Validation failed', 400, { message });
}

/**
 * ตรวจ questionsTH: ต้องเป็น string และไม่ว่าง
 * คืน response 400 ถ้าไม่ผ่าน, null ถ้าผ่าน
 */
export function validateQuestionText(questionsTH: unknown) {
  if (!questionsTH || typeof questionsTH !== 'string') {
    return validationError('questionsTH is required and must be a string');
  }

  if (questionsTH.trim().length === 0) {
    return validationError('questionsTH cannot be empty');
  }

  return null;
}
