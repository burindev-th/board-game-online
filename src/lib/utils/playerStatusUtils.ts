/**
 * Player Status Utilities
 * คำนวณสถานะของผู้เล่น
 */

type ItoPlayerAnswer = {
  playerId: string;
  playerName: string;
  answer: string;
  submittedAt?: Date;
};

export interface PlayerSubmissionStatus {
  [key: string]: {
    playerName: string;
    submittedCount: number;
    totalExpected: number;
  };
}

/**
 * รายชื่อ playerId ที่ไม่ซ้ำกัน เรียงตามลำดับที่พบครั้งแรก
 */
export function getUniquePlayerIds(playerAnswers: { playerId: string }[]): string[] {
  return Array.from(new Set(playerAnswers.map((a) => a.playerId)));
}

/**
 * map ของ playerId → playerName (ใช้ชื่อแรกที่พบของแต่ละคน)
 */
export function getPlayerNameMap(
  playerAnswers: { playerId: string; playerName: string }[]
): Record<string, string> {
  const playerNames: Record<string, string> = {};
  playerAnswers.forEach((a) => {
    if (!playerNames[a.playerId]) {
      playerNames[a.playerId] = a.playerName;
    }
  });
  return playerNames;
}

/**
 * นับจำนวนคำตอบที่ "เสร็จแล้ว" ของผู้เล่นแต่ละคน ตามเงื่อนไข isDone
 */
function buildSubmissionStatus(
  playerAnswers: ItoPlayerAnswer[],
  expectedAnswersPerPlayer: number,
  isDone: (answer: ItoPlayerAnswer) => boolean
): PlayerSubmissionStatus {
  const playerSubmissionStatus: PlayerSubmissionStatus = {};

  getUniquePlayerIds(playerAnswers).forEach((id) => {
    const playerAnswersForThisPlayer = playerAnswers.filter(
      (a) => a.playerId === id
    );
    const submittedCount = playerAnswersForThisPlayer.filter(isDone).length;
    const playerName =
      playerAnswersForThisPlayer[0]?.playerName || "Unknown";

    playerSubmissionStatus[id] = {
      playerName,
      submittedCount,
      totalExpected: expectedAnswersPerPlayer,
    };
  });

  return playerSubmissionStatus;
}

/**
 * คำนวณสถานะการส่งคำใบ้ของผู้เล่น
 */
export function calculatePlayerSubmissionStatus(
  playerAnswers: ItoPlayerAnswer[],
  expectedAnswersPerPlayer: number
): PlayerSubmissionStatus {
  return buildSubmissionStatus(playerAnswers, expectedAnswersPerPlayer, (a) => Boolean(a.submittedAt));
}

/**
 * คำนวณสถานะการพิมพ์คำใบ้ของผู้เล่น (voting phase)
 */
export function calculatePlayerHintStatus(
  playerAnswers: ItoPlayerAnswer[],
  expectedAnswersPerPlayer: number
): PlayerSubmissionStatus {
  return buildSubmissionStatus(playerAnswers, expectedAnswersPerPlayer, (a) => a.answer.trim() !== "");
}

/**
 * แยกผู้เล่นที่ส่งครบและยังส่งไม่ครบ
 */
export function separateCompletedPlayers(
  playerSubmissionStatus: PlayerSubmissionStatus
) {
  const playersCompleted = Object.values(playerSubmissionStatus).filter(
    (p) => p.submittedCount === p.totalExpected
  );
  const playersNotCompleted = Object.entries(playerSubmissionStatus).filter(
    ([, p]) => p.submittedCount < p.totalExpected
  );

  return { playersCompleted, playersNotCompleted };
}
