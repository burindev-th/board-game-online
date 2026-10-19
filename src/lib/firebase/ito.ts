/**
 * ITO Game Firebase Functions
 * จัดการ game logic สำหรับเกม ITO (BWLxJkh45e6RiALRBmcl)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  DocumentReference,
  CollectionReference,
  WriteBatch,
  runTransaction,
  writeBatch,
  addDoc,
} from 'firebase/firestore';
import { db } from './config';
import { gameSessionRef, roomRef, sessionSubcollectionRef, sessionSubdocRef } from './refs';
import type { ItoGamePhase, ItoGameState, ItoPlayerAnswer, ItoQuestion } from '@/types/ito';
import { ITO_GAME_ID } from '@/constants/ito';
import { getAge } from '@/lib/utils/ageStorage';
import { createAnswerId, parseAnswerId } from '@/lib/utils/voteUtils';

/**
 * Helper: เพิ่มคำสั่งลบทุก document ใน collection ลงใน batch
 * @returns จำนวน document ที่จะถูกลบ
 */
async function addDeleteAllToBatch(batch: WriteBatch, collectionRef: CollectionReference): Promise<number> {
  const snapshot = await getDocs(collectionRef);
  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  return snapshot.docs.length;
}

/**
 * Helper: สร้าง player answers ตามลำดับผู้เล่น (คนละ numbersPerPlayer เลข)
 */
function buildPlayerAnswers(
  playerIds: string[],
  playerNames: { [playerId: string]: string },
  numbers: number[],
  numbersPerPlayer: number
): ItoPlayerAnswer[] {
  const playerAnswers: ItoPlayerAnswer[] = [];
  let numberIndex = 0;

  for (const playerId of playerIds) {
    for (let answerIdx = 0; answerIdx < numbersPerPlayer; answerIdx++) {
      playerAnswers.push({
        playerId: playerId,
        playerName: playerNames[playerId] || 'Unknown',
        number: numbers[numberIndex],
        answer: '',
        isRevealed: false,
        answerIndex: answerIdx,
      });
      numberIndex++;
    }
  }

  return playerAnswers;
}

/**
 * เปลี่ยน phase (และ field อื่นถ้ามี) ของ game session
 */
export async function updateSessionPhase(
  sessionId: string,
  phase: ItoGamePhase,
  extra: Partial<Pick<ItoGameState, 'status'>> = {}
): Promise<void> {
  await updateDoc(gameSessionRef(sessionId), {
    phase,
    ...extra,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Helper: ดึง timeLimit จาก room (หน่วย: นาที)
 * ถ้าไม่มีใน room จะใช้ค่า default 10 นาที
 */
async function getTimeLimitFromRoom(roomId: string): Promise<number> {
  try {
    const roomSnap = await getDoc(roomRef(roomId));

    if (!roomSnap.exists()) {
      console.warn('⚠️ Room not found, using default time limit (10 minutes)');
      return 10;
    }

    const roomData = roomSnap.data();
    const timeLimit = roomData.timeLimit;

    if (timeLimit && typeof timeLimit === 'number' && timeLimit > 0) {
      console.log(`⏱️ Using room timeLimit: ${timeLimit} minutes`);
      return timeLimit;
    }

    console.log('⏱️ No timeLimit in room, using default (10 minutes)');
    return 10;
  } catch (error) {
    console.error('❌ Error getting timeLimit from room:', error);
    return 10; // fallback to default
  }
}

/**
 * สุ่มเลือกโจทย์จาก ito_questions (เฉพาะโจทย์ที่ isActive = true)
 */
export async function getRandomQuestion(): Promise<ItoQuestion | null> {
  try {
    const questionsRef = collection(db, 'ito_questions');
    const snapshot = await getDocs(questionsRef);

    if (snapshot.empty) {
      console.error('❌ No questions found in ito_questions collection');
      return null;
    }

    // กรองเฉพาะโจทย์ที่ isActive = true (default true ถ้าไม่มี field)
    const activeQuestions = snapshot.docs
      .filter((doc) => {
        const isActive = doc.data().isActive;
        return isActive === undefined || isActive === true;
      })
      .map((doc) => ({
        id: doc.id,
        questionsTH: doc.data().questionsTH || 'ไม่มีโจทย์',
        isActive: doc.data().isActive ?? true,
        createdBy: doc.data().createdBy, // เพิ่มการดึง createdBy
      }));

    if (activeQuestions.length === 0) {
      console.error('❌ No active questions found in ito_questions collection');
      return null;
    }

    // Random เลือก 1 โจทย์จากโจทย์ที่ active
    const randomIndex = Math.floor(Math.random() * activeQuestions.length);
    console.log(`🎲 Selected random question from ${activeQuestions.length} active questions`);
    return activeQuestions[randomIndex];
  } catch (error) {
    console.error('Error getting random question:', error);
    return null;
  }
}

/**
 * สุ่มเลขให้ผู้เล่น (1-100) แต่ละคนไม่ซ้ำกัน
 * แบบกระจายเลขให้เท่าๆ กัน (ไม่ให้คนเดียวได้เลขใกล้ๆ กัน)
 * @param playerCount จำนวนผู้เล่น
 * @param numbersPerPlayer จำนวนเลขต่อคน (1, 2, หรือ 3)
 * @returns array ของเลขที่ไม่ซ้ำกัน (จำนวน = playerCount * numbersPerPlayer)
 */
export function generateUniqueNumbers(playerCount: number, numbersPerPlayer: number = 1): number[] {
  const totalNumbers = playerCount * numbersPerPlayer;

  // ตรวจสอบว่าเกินขอบเขตหรือไม่
  if (totalNumbers > 100) {
    throw new Error(`ต้องการ ${totalNumbers} เลข แต่มีแค่ 1-100 (100 เลข)`);
  }

  // สุ่มเลขที่ไม่ซ้ำกัน
  const numbers: number[] = [];

  while (numbers.length < totalNumbers) {
    const randomNum = Math.floor(Math.random() * 100) + 1; // 1-100

    // ถ้าเลขนี้ยังไม่มีใน array ให้เพิ่มเข้าไป
    if (!numbers.includes(randomNum)) {
      numbers.push(randomNum);
    }
  }

  // สุ่มเรียงเลขใหม่อีกครั้งก่อนแจก (Fisher-Yates shuffle)
  const shuffledNumbers = [...numbers];
  for (let i = shuffledNumbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledNumbers[i], shuffledNumbers[j]] = [shuffledNumbers[j], shuffledNumbers[i]];
  }

  // Debug: แสดงการแจกเลข
  const distribution = Array.from({ length: playerCount }, (_, playerIndex) => {
    const playerNumbers = [];
    for (let round = 0; round < numbersPerPlayer; round++) {
      const index = round * playerCount + playerIndex;
      playerNumbers.push(shuffledNumbers[index]);
    }
    return {
      player: playerIndex + 1,
      numbers: playerNumbers.sort((a, b) => a - b),
    };
  });

  console.log('🎲 Number Distribution:', {
    playerCount,
    numbersPerPlayer,
    totalNumbers,
    generatedNumbers: numbers.sort((a, b) => a - b),
    shuffledNumbers,
    distribution,
  });

  return shuffledNumbers;
}

/**
 * เริ่ม Level ใหม่ (สุ่มโจทย์ใหม่ + เลขใหม่)
 */
export async function startNextLevel(
  sessionId: string,
  roomId: string,
  playerIds: string[],
  playerNames: { [playerId: string]: string },
  currentLevel: number,
  currentHearts: number
): Promise<boolean> {
  console.log('🚀 [startNextLevel] CALLED with:', {
    sessionId,
    roomId,
    playerIds,
    currentLevel,
    currentHearts,
  });

  try {
    // 1. สุ่มโจทย์ใหม่ (นอก transaction)
    const question = await getRandomQuestion();
    if (!question) {
      throw new Error('ไม่สามารถสุ่มโจทย์ได้');
    }

    // 2. ไม่ต้องดึง timeLimit ตอนนี้ (จะดึงตอน Voting Phase)
    // const timeLimitMinutes = await getTimeLimitFromRoom(roomId);

    // 3. คำนวณจำนวนเลขต่อคน (level 1=1, 2=2, 3=3)
    const numbersPerPlayer = currentLevel;
    const numbers = generateUniqueNumbers(playerIds.length, numbersPerPlayer);
    const totalNumbers = playerIds.length * numbersPerPlayer;

    // ไม่ตั้ง phaseEndTime ในช่วง Writing Phase (จะตั้งตอน Voting Phase)
    // const phaseEndTime = new Date(Date.now() + timeLimitMinutes * 60 * 1000);

    // 4. ใช้ Batch Write เพื่อป้องกัน race condition
    const batch = writeBatch(db);
    const sessionRef = gameSessionRef(sessionId);
    const playerAnswersRef = sessionSubcollectionRef(sessionId, 'player_answers');

    // ลบ player_answers เก่าทั้งหมด
    const deletedAnswers = await addDeleteAllToBatch(batch, playerAnswersRef);
    console.log(`🗑️ Deleting ${deletedAnswers} old player_answers`);

    // ลบ votes เก่า
    await addDeleteAllToBatch(batch, sessionSubcollectionRef(sessionId, 'votes'));

    // ลบ ready_status เก่า
    await addDeleteAllToBatch(batch, sessionSubcollectionRef(sessionId, 'ready_status'));

    // อัปเดต Game State
    batch.update(sessionRef, {
      currentLevel: currentLevel,
      hearts: currentHearts,
      currentRound: 1,
      totalRounds: totalNumbers,
      questionId: question.id,
      questionText: question.questionsTH,
      questionCreatedBy: question.createdBy, // เพิ่มผู้สร้างโจทย์
      phase: 'writing', // เริ่มที่ Writing Phase ไม่มี timer
      phaseEndTime: null, // ไม่ตั้ง timer ในช่วง Writing Phase
      revealedNumbers: [],
      lastRevealResult: null, // Clear lastRevealResult เมื่อเริ่ม level ใหม่
      updatedAt: serverTimestamp(),
    });

    // สร้าง Player Answers ใหม่
    const playerAnswers = buildPlayerAnswers(playerIds, playerNames, numbers, numbersPerPlayer);

    for (const playerAnswer of playerAnswers) {
      const docId = createAnswerId(playerAnswer.playerId, playerAnswer.answerIndex);
      const docRef = doc(playerAnswersRef, docId);
      batch.set(docRef, {
        ...playerAnswer,
        submittedAt: null,
      });

      console.log(`  📝 Preparing: ${docId} → number: ${playerAnswer.number}`);
    }

    // Commit batch (atomic operation)
    await batch.commit();
    console.log(`✅ Batch committed: ${playerAnswers.length} player_answers created`);

    // Validation: ตรวจสอบว่าเลขซ้ำหรือไม่
    const validation = await validateUniqueNumbers(sessionId);
    if (!validation.isValid) {
      console.error('❌❌❌ CRITICAL: Duplicate numbers in startNextLevel!', validation);
      await cleanupPlayerAnswers(sessionId);
      throw new Error('Duplicate numbers detected - cleaned up and aborting');
    }

    console.log(`✅ Started Level ${currentLevel} successfully:`, {
      sessionId,
      question: question.questionsTH,
      numbersPerPlayer,
      totalNumbers,
      validation,
    });

    return true;
  } catch (error) {
    console.error('❌ Error starting next level:', error);
    return false;
  }
}

/**
 * สร้าง Game State เริ่มต้นสำหรับ ITO
 * เริ่มที่ Level 1 (คนละ 1 เลข)
 */
export async function initializeItoGame(
  sessionId: string,
  roomId: string,
  playerIds: string[],
  playerNames: { [playerId: string]: string }
): Promise<{ gameState: ItoGameState; playerAnswers: ItoPlayerAnswer[] } | null> {
  try {
    console.log('🎮 [initializeItoGame] Starting initialization:', {
      sessionId,
      roomId,
      playerCount: playerIds.length,
      timestamp: new Date().toISOString(),
    });

    // 1. สุ่มเลือกโจทย์ (ทำนอก transaction)
    const question = await getRandomQuestion();
    if (!question) {
      throw new Error('ไม่สามารถสุ่มโจทย์ได้');
    }

    // 2. ไม่ต้องดึง timeLimit ตอนนี้ (จะดึงตอน Voting Phase)
    // const timeLimitMinutes = await getTimeLimitFromRoom(roomId);

    // 3. สุ่มเลขให้ผู้เล่น (Level 1 = คนละ 1 เลข)
    const numbersPerPlayer = 1;
    const numbers = generateUniqueNumbers(playerIds.length, numbersPerPlayer);
    const totalNumbers = playerIds.length * numbersPerPlayer;

    // ไม่ตั้ง phaseEndTime ในช่วง Writing Phase (จะตั้งตอน Voting Phase)
    // const phaseEndTime = new Date(Date.now() + timeLimitMinutes * 60 * 1000);

    // 4. ใช้ Transaction เพื่อป้องกัน race condition
    const result = await runTransaction(db, async (transaction) => {
      const sessionRef = gameSessionRef(sessionId);
      const playerAnswersRef = sessionSubcollectionRef(sessionId, 'player_answers');

      // อ่านเพื่อเช็คว่ามี player_answers อยู่แล้วหรือไม่
      const existingAnswersSnapshot = await getDocs(playerAnswersRef);

      if (!existingAnswersSnapshot.empty) {
        console.warn('⚠️ [initializeItoGame] Player answers already exist, aborting transaction:', {
          sessionId,
          existingCount: existingAnswersSnapshot.docs.length,
        });
        return null; // Abort - มี player answers อยู่แล้ว
      }

      // สร้าง Game State
      const gameState: ItoGameState = {
        id: sessionId,
        roomId: roomId,
        gameId: ITO_GAME_ID,
        currentLevel: 1,
        totalLevels: 3,
        hearts: 3,
        currentRound: 1,
        totalRounds: totalNumbers,
        questionId: question.id,
        questionText: question.questionsTH,
        questionCreatedBy: question.createdBy, // เพิ่มผู้สร้างโจทย์
        phase: 'writing', // เริ่มที่ Writing Phase ไม่มี timer
        phaseEndTime: undefined, // ไม่ตั้ง timer ในช่วง Writing Phase
        revealedNumbers: [],
        status: 'playing',
        startedAt: new Date(),
        updatedAt: new Date(),
      };

      // สร้าง Player Answers
      const playerAnswers = buildPlayerAnswers(playerIds, playerNames, numbers, numbersPerPlayer);

      // อัปเดต game state
      transaction.update(sessionRef, {
        ...gameState,
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        phaseEndTime: null, // ไม่ตั้ง timer ในช่วง Writing Phase
      });

      // สร้าง player answers ทั้งหมด
      console.log('📝 [initializeItoGame] Creating player answers in transaction:', {
        totalAnswers: playerAnswers.length,
        numbers,
      });

      for (const playerAnswer of playerAnswers) {
        const docId = createAnswerId(playerAnswer.playerId, playerAnswer.answerIndex);
        const answerDocRef = doc(playerAnswersRef, docId);
        transaction.set(answerDocRef, {
          ...playerAnswer,
          submittedAt: null,
        });
        console.log(`  ✅ Preparing: ${docId} → number: ${playerAnswer.number}`);
      }

      return { gameState, playerAnswers };
    });

    if (!result) {
      console.warn('⚠️ [initializeItoGame] Transaction aborted - game already initialized');
      return null;
    }

    console.log('✅ ITO Game initialized successfully:', {
      sessionId,
      question: question.questionsTH,
      playerCount: playerIds.length,
    });

    // Validation: ตรวจสอบว่าเลขซ้ำหรือไม่หลังบันทึกเสร็จ
    const validation = await validateUniqueNumbers(sessionId);
    if (!validation.isValid) {
      console.error('❌❌❌ CRITICAL: Duplicate numbers detected after initialization!', validation);
      // ลบข้อมูลที่สร้างแล้วเริ่มใหม่
      await cleanupPlayerAnswers(sessionId);
      throw new Error('Duplicate numbers detected - cleaned up and aborting');
    }

    console.log('✅ Validation passed: All numbers are unique', validation);

    return result;
  } catch (error) {
    console.error('❌ Error initializing ITO game:', error);
    return null;
  }
}

/**
 * Validation: ตรวจสอบว่ามีเลขซ้ำใน player_answers หรือไม่
 */
async function validateUniqueNumbers(sessionId: string): Promise<{
  isValid: boolean;
  totalAnswers: number;
  uniqueNumbers: number;
  duplicates: number[];
  details: Array<{ docId: string; playerId: string; number: number }>;
}> {
  const snapshot = await getDocs(sessionSubcollectionRef(sessionId, 'player_answers'));

  const numberCounts: { [num: number]: number } = {};
  const details: Array<{ docId: string; playerId: string; number: number }> = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const num = data.number;
    numberCounts[num] = (numberCounts[num] || 0) + 1;
    details.push({
      docId: doc.id,
      playerId: data.playerId,
      number: num,
    });
  });

  const duplicates = Object.entries(numberCounts)
    .filter(([, count]) => count > 1)
    .map(([num]) => parseInt(num));

  return {
    isValid: duplicates.length === 0,
    totalAnswers: snapshot.docs.length,
    uniqueNumbers: Object.keys(numberCounts).length,
    duplicates,
    details,
  };
}

/**
 * ลบ player_answers ทั้งหมดในกรณีที่มีข้อผิดพลาด
 */
async function cleanupPlayerAnswers(sessionId: string): Promise<void> {
  const batch = writeBatch(db);
  const deletedCount = await addDeleteAllToBatch(batch, sessionSubcollectionRef(sessionId, 'player_answers'));

  await batch.commit();
  console.log(`🗑️ Cleaned up ${deletedCount} player_answers documents`);
}

/**
 * ตรวจสอบว่าคำตอบเป็นคำตอบทดสอบหรือไม่
 * คำตอบทดสอบ =
 * 1. ตัวเลขอย่างเดียว (อาจมี space, comma, hyphen)
 * 2. ตัวอักษรสุ่มที่ไม่มีความหมาย (พิมพ์ซ้ำ ๆ หรือ keyboard mashing)
 *
 * ตัวอย่าง test: "1", "12", "1 2", "1,2,3", "1-10", "asdaddas", "กหดฟหกดกหด", "asdf"
 * ตัวอย่าง NOT test: "25ปี", "100บาท", "โสด", "รถยนต์"
 */
function isTestAnswer(answer: string): boolean {
  if (!answer || answer.trim() === '') return false;

  const trimmed = answer.trim();

  // 1. ตรวจสอบว่าเป็นตัวเลขอย่างเดียวหรือไม่
  const cleaned = trimmed.replace(/[\s,\-]/g, '');
  if (/^\d+$/.test(cleaned)) {
    return true; // เป็นตัวเลขอย่างเดียว
  }

  // 2. ตรวจสอบว่าเป็นตัวอักษรสุ่มที่ไม่มีความหมาย
  // - ถ้ามีตัวอักษรซ้ำกันมากกว่า 40% ของความยาว
  // - ถ้าเป็น keyboard pattern เช่น "asdf", "qwerty"

  // นับตัวอักษรที่ซ้ำกัน
  const charCount: { [key: string]: number } = {};
  const lowerAnswer = trimmed.toLowerCase();

  for (const char of lowerAnswer) {
    charCount[char] = (charCount[char] || 0) + 1;
  }

  // หาตัวอักษรที่ปรากฏมากที่สุด
  const maxCount = Math.max(...Object.values(charCount));
  const repeatRatio = maxCount / trimmed.length;

  // ถ้าตัวอักษรซ้ำกันมากกว่า 40% ถือว่าเป็น test
  if (repeatRatio > 0.4) {
    return true;
  }

  // ตรวจสอบ keyboard patterns ที่พิมพ์ติด ๆ กัน (เช่น asdf, qwer)
  const keyboardPatterns = [
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
    'ๅภถุึคตจขชๆไำพะัีรนยบลฃฟหกดเ้่าสวงผปแอิืทมใฝ',
    '1234567890',
    'abcdefghijklmnopqrstuvwxyz'
  ];

  for (const pattern of keyboardPatterns) {
    // ตรวจสอบทั้งซ้ายไปขวาและขวาไปซ้าย
    for (let i = 0; i < pattern.length - 2; i++) {
      const substring = pattern.substring(i, i + 3);
      if (lowerAnswer.includes(substring) && trimmed.length <= 15) {
        return true; // พบ pattern และคำตอบสั้น = น่าจะเป็น test
      }
    }
  }

  // ถ้าคำตอบสั้นมาก (<=3 ตัวอักษร) และไม่ใช่คำที่มีความหมาย
  if (trimmed.length <= 3) {
    return true;
  }

  return false;
}

/**
 * บันทึก log การเล่นเกมลง ito_game_logs
 * รองรับการเก็บ log แยกสำหรับคำตอบแรกและการแก้ไข
 */
async function logPlayerAnswer(
  questionId: string,
  number: number,
  answer: string,
  previousAnswer?: string | null
): Promise<void> {
  try {
    // ดึงอายุจาก localStorage (ถ้ามี)
    const ageRange = typeof window !== 'undefined' ? getAge() : null;

    // ตรวจสอบว่าเป็นการแก้ไขหรือไม่
    const isEdited = previousAnswer !== undefined && previousAnswer !== null && previousAnswer !== '';

    // ตรวจสอบว่าเป็นคำตอบทดสอบหรือไม่
    const isTest = isTestAnswer(answer);

    const logsRef = collection(db, 'ito_game_logs');
    await addDoc(logsRef, {
      questionId,
      ageRange,
      number,
      answer,
      isEdited,
      previousAnswer: isEdited ? previousAnswer : null,
      isTest,
      createdAt: serverTimestamp(),
    });

  } catch (error) {
    // ไม่ throw error เพราะไม่ต้องการให้ log ล้มเหลวทำให้เกมหยุด
    console.error('⚠️ Failed to log player answer (non-critical):', error);
  }
}

/**
 * ส่งคำตอบของผู้เล่น (อัปเดตเฉพาะ document ที่ระบุ answerIndex)
 */
export async function submitPlayerAnswer(
  sessionId: string,
  playerId: string,
  answer: string,
  answerIndex: number
): Promise<boolean> {
  try {
    // อัปเดตเฉพาะ document ที่มี answerIndex ตรงกัน
    const answerRef = sessionSubdocRef(sessionId, 'player_answers', createAnswerId(playerId, answerIndex));

    // ดึงข้อมูลคำตอบเดิมก่อนอัปเดต (เพื่อเช็คว่าเป็นการแก้ไขหรือไม่)
    const answerSnapBefore = await getDoc(answerRef);
    const previousAnswer = answerSnapBefore.exists() ? answerSnapBefore.data().answer : null;

    await updateDoc(answerRef, {
      answer: answer,
      submittedAt: serverTimestamp(),
    });

    // เช็คว่าคำตอบเปลี่ยนจริงหรือไม่ ก่อนจะ log
    if (previousAnswer !== answer) {
      // ดึงข้อมูล game state และ player answer เพื่อ log
      const sessionSnap = await getDoc(gameSessionRef(sessionId));
      const answerSnap = await getDoc(answerRef);

      if (sessionSnap.exists() && answerSnap.exists()) {
        const gameState = sessionSnap.data();
        const playerAnswer = answerSnap.data();

        // บันทึก log (async, ไม่รอผลลัพธ์)
        // ส่ง previousAnswer เพื่อให้รู้ว่าเป็นการแก้ไขหรือไม่
        logPlayerAnswer(
          gameState.questionId,
          playerAnswer.number,
          answer,
          previousAnswer
        ).catch((err) => console.error('Log error:', err));
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error submitting answer:', error);
    return false;
  }
}

/**
 * ยกเลิกการส่งคำตอบ (เพื่อแก้ไข)
 */
export async function unsendPlayerAnswer(
  sessionId: string,
  playerId: string,
  answerIndex: number
): Promise<boolean> {
  try {
    const answerRef = sessionSubdocRef(sessionId, 'player_answers', createAnswerId(playerId, answerIndex));

    await updateDoc(answerRef, {
      submittedAt: null,
    });

    return true;
  } catch (error) {
    console.error('❌ Error unsending answer:', error);
    return false;
  }
}

/**
 * ตรวจสอบว่าทุกคนส่งคำตอบแล้วหรือยัง
 */
export async function checkAllAnswersSubmitted(sessionId: string): Promise<boolean> {
  try {
    // ดึง game state เพื่อรู้ว่าควรมีกี่ documents
    const sessionSnap = await getDoc(gameSessionRef(sessionId));

    if (!sessionSnap.exists()) {
      console.log('❌ [checkAllAnswersSubmitted] Session not found');
      return false;
    }

    const gameState = sessionSnap.data();
    const expectedDocs = gameState.totalRounds; // จำนวน documents ที่ควรมี

    const snapshot = await getDocs(sessionSubcollectionRef(sessionId, 'player_answers'));

    console.log('🔍 [checkAllAnswersSubmitted]', {
      sessionId,
      totalDocs: snapshot.docs.length,
      expectedDocs,
      isEmpty: snapshot.empty,
    });

    // ถ้าไม่มี answers เลย return false
    if (snapshot.empty || snapshot.docs.length === 0) {
      console.log('❌ [checkAllAnswersSubmitted] No answers found, returning false');
      return false;
    }

    // ตรวจสอบว่ามีครบจำนวนหรือยัง
    if (snapshot.docs.length < expectedDocs) {
      console.log(`⚠️ [checkAllAnswersSubmitted] Not all documents created yet (${snapshot.docs.length}/${expectedDocs})`);
      return false;
    }

    const details: Array<{
      docId: string;
      playerId: string;
      answerIndex: number;
      hasAnswer: boolean;
      answerLength: number;
      hasSubmittedAt: boolean;
      isSubmitted: boolean;
    }> = [];
    const allSubmitted = snapshot.docs.every((doc) => {
      const data = doc.data();
      const hasAnswer = !!data.answer && data.answer.trim() !== '';
      const hasSubmittedAt = data.submittedAt !== null;
      const isSubmitted = hasSubmittedAt && hasAnswer;

      details.push({
        docId: doc.id,
        playerId: data.playerId,
        answerIndex: data.answerIndex,
        hasAnswer,
        answerLength: data.answer?.length || 0,
        hasSubmittedAt,
        isSubmitted,
      });

      return isSubmitted;
    });

    console.log('📋 [checkAllAnswersSubmitted] Details:', details);
    console.log(allSubmitted ? '✅ [checkAllAnswersSubmitted] All submitted = TRUE' : '⚠️ [checkAllAnswersSubmitted] All submitted = FALSE');

    return allSubmitted;
  } catch (error) {
    console.error('❌ Error checking answers:', error);
    return false;
  }
}

/**
 * เปลี่ยน Phase เป็น Voting
 */
export async function startVotingPhase(sessionId: string, roomId: string): Promise<boolean> {
  try {
    const sessionRef = gameSessionRef(sessionId);

    // ดึง timeLimit จาก room
    const timeLimitMinutes = await getTimeLimitFromRoom(roomId);
    const phaseEndTime = new Date(Date.now() + timeLimitMinutes * 60 * 1000);

    await updateDoc(sessionRef, {
      phase: 'voting',
      phaseEndTime: Timestamp.fromDate(phaseEndTime),
      lastRevealResult: null, // Clear lastRevealResult เมื่อเข้า voting phase ใหม่
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Voting phase started:', sessionId);
    return true;
  } catch (error) {
    console.error('❌ Error starting voting phase:', error);
    return false;
  }
}

/**
 * บันทึกการโหวตของผู้เล่น
 */
export async function submitVote(
  sessionId: string,
  playerId: string,
  votedForPlayerId: string,
  votedForAnswerIndex: number
): Promise<boolean> {
  try {
    const voteRef = sessionSubdocRef(sessionId, 'votes', playerId);
    await setDoc(voteRef, {
      playerId: playerId,
      votedForPlayerId: votedForPlayerId,
      votedForAnswerIndex: votedForAnswerIndex,
      votedAt: serverTimestamp(),
    });

    console.log('✅ Vote submitted:', {
      sessionId,
      playerId,
      votedFor: createAnswerId(votedForPlayerId, votedForAnswerIndex)
    });
    return true;
  } catch (error) {
    console.error('❌ Error submitting vote:', error);
    return false;
  }
}

/**
 * สุ่มเลือกคำตอบที่ยังไม่ถูก reveal (ใช้เมื่อไม่มีใคร vote)
 * @returns answerId ในรูปแบบ { playerId, answerIndex } หรือ null ถ้าไม่มี
 */
export async function getRandomUnrevealedAnswer(sessionId: string): Promise<{ playerId: string; answerIndex: number } | null> {
  try {
    const answersRef = sessionSubcollectionRef(sessionId, 'player_answers');
    const q = query(answersRef, where('isRevealed', '==', false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('⚠️ No unrevealed answers found');
      return null;
    }

    // สุ่มเลือก 1 ตัวจากที่ยังไม่ถูก reveal
    const unrevealedAnswers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        playerId: data.playerId,
        answerIndex: data.answerIndex
      };
    });

    const randomIndex = Math.floor(Math.random() * unrevealedAnswers.length);
    const selected = unrevealedAnswers[randomIndex];

    console.log('🎲 Randomly selected unrevealed answer:', selected);
    return selected;
  } catch (error) {
    console.error('❌ Error getting random unrevealed answer:', error);
    return null;
  }
}

/**
 * นับคะแนนโหวตและหาผู้ที่ได้รับโหวตสูงสุด
 * @returns answerId ในรูปแบบ "playerId_answerIndex"
 */
export async function countVotes(sessionId: string): Promise<{ playerId: string; answerIndex: number } | null> {
  try {
    const snapshot = await getDocs(sessionSubcollectionRef(sessionId, 'votes'));

    if (snapshot.empty) {
      return null;
    }

    // นับคะแนนโดยใช้ playerId + answerIndex
    const voteCount: { [answerId: string]: number } = {};
    // Debug: แสดงทุก votes
    console.log('🔍 DEBUG countVotes - All votes:');
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log('  Vote:', {
        playerId: data.playerId,
        votedForPlayerId: data.votedForPlayerId,
        votedForAnswerIndex: data.votedForAnswerIndex,
        answerId: createAnswerId(data.votedForPlayerId, data.votedForAnswerIndex)
      });
    });

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const answerId = createAnswerId(data.votedForPlayerId, data.votedForAnswerIndex);
      voteCount[answerId] = (voteCount[answerId] || 0) + 1;
    });

    console.log('🔍 DEBUG countVotes - Vote count:', voteCount);

    // หาคะแนนสูงสุด
    let maxVotes = 0;
    const winners: string[] = [];

    Object.entries(voteCount).forEach(([answerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winners.length = 0;
        winners.push(answerId);
      } else if (count === maxVotes) {
        winners.push(answerId);
      }
    });

    console.log('🔍 DEBUG countVotes - Winners:', { maxVotes, winners });

    // ถ้าเสมอ random
    const selectedAnswerId = winners.length > 1
      ? winners[Math.floor(Math.random() * winners.length)]
      : winners[0];

    console.log('🔍 DEBUG countVotes - Selected:', selectedAnswerId);

    if (!selectedAnswerId) return null;

    // แยก answerId กลับเป็น playerId และ answerIndex
    const result = parseAnswerId(selectedAnswerId);

    console.log('✅ countVotes result:', {
      selectedAnswerId,
      playerId: result.playerId,
      answerIndex: result.answerIndex,
      answerIndexType: typeof result.answerIndex,
    });

    return result;
  } catch (error) {
    console.error('❌ Error counting votes:', error);
    return null;
  }
}

/**
 * เปิดเผยผลและตรวจสอบความถูกต้อง
 */
export async function revealAndCheck(
  sessionId: string,
  selectedPlayerId: string,
  selectedAnswerIndex: number
): Promise<{
  success: boolean;
  number: number;
  isCorrect: boolean;
  heartsLost: number;
  newHearts: number;
} | null> {
  try {
    // 1. ดึงข้อมูล game state และ player answers
    const sessionRef = gameSessionRef(sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      throw new Error('Game session not found');
    }

    const gameState = sessionSnap.data() as ItoGameState;

    // 2. ดึงเลขทั้งหมด (เพื่อหา selectedAnswer และ unrevealed numbers)
    const answersSnap = await getDocs(sessionSubcollectionRef(sessionId, 'player_answers'));

    // 3. หา player answer ที่ถูกโหวต (ใช้ field playerId + answerIndex เทียบ)
    let selectedAnswer: ItoPlayerAnswer | null = null;
    let answerDocRef: DocumentReference | null = null;

    console.log('🔍 Searching for answer:', {
      selectedPlayerId,
      selectedAnswerIndex,
      selectedAnswerIndexType: typeof selectedAnswerIndex,
    });

    // Debug: แสดงทุก answers ที่มี
    const allAnswersDebug = answersSnap.docs.map((docSnap) => {
      const data = docSnap.data() as ItoPlayerAnswer;
      return {
        docId: docSnap.id,
        playerId: data.playerId,
        answerIndex: data.answerIndex,
        answerIndexType: typeof data.answerIndex,
        isRevealed: data.isRevealed,
        answer: data.answer,
      };
    });
    console.log('🔍 All answers in DB:', allAnswersDebug);

    answersSnap.docs.forEach((docSnap) => {
      const data = docSnap.data() as ItoPlayerAnswer;
      // หาตัวที่ตรงกับ selectedPlayerId + answerIndex
      // ไม่ต้องเช็ค !isRevealed เพราะอาจมี race condition หรือ double-call
      if (data.playerId === selectedPlayerId &&
          data.answerIndex === selectedAnswerIndex) {
        selectedAnswer = data;
        answerDocRef = docSnap.ref;
      }
    });

    if (!selectedAnswer || !answerDocRef) {
      console.error('❌ Player answer not found for:', createAnswerId(selectedPlayerId, selectedAnswerIndex));
      console.error('❌ Search criteria:', {
        selectedPlayerId,
        selectedAnswerIndex,
        selectedAnswerIndexType: typeof selectedAnswerIndex,
      });
      throw new Error('Player answer not found');
    }

    // TypeScript type narrowing
    const foundAnswer: ItoPlayerAnswer = selectedAnswer;

    if (!answerDocRef) {
      console.error('❌ Answer document reference not found');
      throw new Error('Answer document reference not found');
    }

    const foundDocRef: DocumentReference = answerDocRef;

    console.log('✅ Found answer:', {
      docId: foundDocRef.id,
      playerId: foundAnswer.playerId,
      answerIndex: foundAnswer.answerIndex,
      number: foundAnswer.number,
      isRevealed: foundAnswer.isRevealed,
    });

    const selectedNumber = foundAnswer.number;

    // ตรวจสอบว่าเลขนี้ถูก reveal ไปแล้วหรือยัง (ป้องกัน double-call)
    if (foundAnswer.isRevealed) {
      console.log('⚠️ This answer was already revealed, skipping...');
      // Return ผลลัพธ์จาก gameState ปัจจุบัน
      return {
        success: true,
        number: selectedNumber,
        isCorrect: true, // ไม่สามารถคำนวณได้ เพราะข้อมูลเปลี่ยนไปแล้ว
        heartsLost: 0,
        newHearts: gameState.hearts,
      };
    }

    // 4. รวบรวมเลขที่ยังไม่ได้เปิด
    const unrevealedNumbers: number[] = [];
    answersSnap.docs.forEach((doc) => {
      const data = doc.data() as ItoPlayerAnswer;
      if (!data.isRevealed) {
        unrevealedNumbers.push(data.number);
      }
    });

    // Guard: ต้องมีเลขที่ยังไม่เปิดอย่างน้อย 1 ตัว
    if (unrevealedNumbers.length === 0) {
      console.error('No unrevealed numbers found');
      return null;
    }

    // 5. หาเลขที่น้อยที่สุด และคำนวณผลการโหวต
    const smallestNumber = Math.min(...unrevealedNumbers);
    const isCorrect = selectedNumber === smallestNumber;

    // 6. คำนวณหัวใจที่หาย (เสียหัวใจ = จำนวนเลขที่ข้ามไป)
    const skippedNumbers = unrevealedNumbers.filter((num) => num < selectedNumber);
    const heartsLost = isCorrect ? 0 : skippedNumbers.length;
    const newHearts = Math.max(0, gameState.hearts - heartsLost);

    // 7. หาเลขทั้งหมดที่ต้องเปิด (เลข ≤ selectedNumber)
    const numbersToReveal = unrevealedNumbers.filter((num) => num <= selectedNumber);

    // 8. Batch Write: Update ทุกอย่างแบบ atomic
    const batch = writeBatch(db);

    // 8.1 Mark เลขที่ต้องเปิดทั้งหมด
    answersSnap.docs.forEach((doc) => {
      const data = doc.data() as ItoPlayerAnswer;
      if (!data.isRevealed && numbersToReveal.includes(data.number)) {
        const isThisCorrect = data.number === selectedNumber;
        batch.update(doc.ref, {
          isRevealed: true,
          isCorrect: isThisCorrect
        });
      }
    });

    // 9. Calculate new game state
    let newRevealedNumbers = [...gameState.revealedNumbers, ...numbersToReveal].sort((a, b) => a - b);
    const newRound = gameState.currentRound + 1;

    // 10. Auto-reveal logic: เปิดเลขสุดท้ายอัตโนมัติถ้าเหลือ 1 ตัว
    // คำนวณจำนวนเลขที่เหลือหลังจาก reveal ครั้งนี้
    const remainingAfterReveal = unrevealedNumbers.filter((num) => !numbersToReveal.includes(num));

    // Guard: ถ้าเหลือเลข 1 ตัว และยังมีหัวใจ → auto-reveal เลขสุดท้าย
    if (remainingAfterReveal.length === 1 && newHearts > 0) {
      const lastNumber = remainingAfterReveal[0];
      newRevealedNumbers = [...newRevealedNumbers, lastNumber].sort((a, b) => a - b);

      // Mark เลขสุดท้ายในฐานข้อมูล
      answersSnap.docs.forEach((doc) => {
        const data = doc.data() as ItoPlayerAnswer;
        if (data.number === lastNumber && !data.isRevealed) {
          batch.update(doc.ref, {
            isRevealed: true,
            isCorrect: true, // เลขสุดท้ายถือว่าถูกเสมอ
          });
        }
      });
    }

    // 11. Determine game status
    const isLevelComplete = newRevealedNumbers.length >= gameState.totalRounds;
    let newStatus: 'playing' | 'won' | 'lost' = 'playing';

    if (newHearts === 0) {
      newStatus = 'lost';
    } else if (isLevelComplete && gameState.currentLevel >= gameState.totalLevels) {
      newStatus = 'won';
    }

    // 12. Update game session state
    batch.update(sessionRef, {
      hearts: newHearts,
      currentRound: newRound,
      revealedNumbers: newRevealedNumbers,
      phase: 'reveal',
      status: newStatus,
      lastRevealResult: {
        number: selectedNumber,
        isCorrect,
        heartsLost,
        newHearts,
      },
      updatedAt: serverTimestamp(),
    });

    // 13. Clean up votes for next round (อยู่ใน batch เดียวกัน → ลบเสร็จก่อน API ตอบกลับ)
    await addDeleteAllToBatch(batch, sessionSubcollectionRef(sessionId, 'votes'));

    // 14. Commit all changes atomically
    await batch.commit();

    return {
      success: true,
      number: selectedNumber,
      isCorrect,
      heartsLost,
      newHearts,
    };
  } catch (error) {
    console.error('❌ Error revealing and checking:', error);
    return null;
  }
}

/**
 * Mark player as ready (สำหรับ levelComplete phase)
 */
export async function markPlayerReady(
  sessionId: string,
  playerId: string,
  playerName: string
): Promise<boolean> {
  try {
    const readyRef = sessionSubdocRef(sessionId, 'ready_status', playerId);
    await setDoc(readyRef, {
      playerId,
      playerName,
      readyAt: serverTimestamp(),
    });

    console.log('✅ Player marked as ready:', { sessionId, playerId });
    return true;
  } catch (error) {
    console.error('❌ Error marking player ready:', error);
    return false;
  }
}

/**
 * ตรวจสอบว่าทุกคนพร้อมหรือยัง
 */
export async function checkAllPlayersReady(sessionId: string): Promise<boolean> {
  try {
    // ดึงจำนวนผู้เล่นทั้งหมด
    const answersSnap = await getDocs(sessionSubcollectionRef(sessionId, 'player_answers'));

    // นับ unique players
    const uniquePlayerIds = new Set<string>();
    answersSnap.docs.forEach((doc) => {
      const data = doc.data();
      uniquePlayerIds.add(data.playerId);
    });

    const totalPlayers = uniquePlayerIds.size;

    // ดึงจำนวนที่พร้อมแล้ว
    const readySnap = await getDocs(sessionSubcollectionRef(sessionId, 'ready_status'));
    const readyCount = readySnap.size;

    console.log('🔍 Ready status check:', {
      totalPlayers,
      readyCount,
      allReady: readyCount === totalPlayers && totalPlayers > 0,
    });

    return readyCount === totalPlayers && totalPlayers > 0;
  } catch (error) {
    console.error('❌ Error checking ready status:', error);
    return false;
  }
}

/**
 * ลบ ready_status เมื่อเริ่ม level ใหม่
 */
export async function clearReadyStatus(sessionId: string): Promise<boolean> {
  try {
    const readySnap = await getDocs(sessionSubcollectionRef(sessionId, 'ready_status'));

    const deletePromises = readySnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);

    console.log('✅ Ready status cleared:', sessionId);
    return true;
  } catch (error) {
    console.error('❌ Error clearing ready status:', error);
    return false;
  }
}

/**
 * ลบ game log
 */
export async function deleteGameLog(logId: string): Promise<boolean> {
  try {
    const logRef = doc(db, 'ito_game_logs', logId);
    await deleteDoc(logRef);

    return true;
  } catch (error) {
    console.error('❌ Error deleting game log:', error);
    return false;
  }
}

/**
 * ลบ game logs หลายตัวพร้อมกัน (bulk delete)
 */
export async function deleteGameLogs(logIds: string[]): Promise<boolean> {
  try {
    const batch = writeBatch(db);

    logIds.forEach((logId) => {
      const logRef = doc(db, 'ito_game_logs', logId);
      batch.delete(logRef);
    });

    await batch.commit();

    return true;
  } catch (error) {
    console.error('❌ Error deleting game logs:', error);
    return false;
  }
}

/**
 * อัพเดทคำตอบใน game log
 */
export async function updateGameLogAnswer(
  logId: string,
  newAnswer: string
): Promise<boolean> {
  try {
    const logRef = doc(db, 'ito_game_logs', logId);

    // ดึงข้อมูลเดิมก่อน
    const logSnap = await getDoc(logRef);
    if (!logSnap.exists()) {
      console.error('❌ Log not found:', logId);
      return false;
    }

    const currentData = logSnap.data();
    const currentAnswer = currentData.answer;

    // ถ้าคำตอบเหมือนเดิม ไม่ต้องทำอะไร
    if (currentAnswer === newAnswer) {
      return true;
    }

    // ตรวจสอบว่าคำตอบใหม่เป็นคำตอบทดสอบหรือไม่
    const isTest = isTestAnswer(newAnswer);

    // อัพเดทพร้อมเก็บ log
    await updateDoc(logRef, {
      answer: newAnswer,
      isEdited: true,
      previousAnswer: currentData.isEdited ? currentData.previousAnswer : currentAnswer,
      isTest, // อัพเดท isTest ด้วย
    });

    return true;
  } catch (error) {
    console.error('❌ Error updating game log answer:', error);
    return false;
  }
}
