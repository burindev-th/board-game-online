/**
 * My Numbers Display Component
 * แสดงเลขของผู้เล่น
 */

"use client";

import { Card, Text } from "@/components/ui";

type ItoPlayerAnswerWithIndex = {
  playerId: string;
  playerName: string;
  number: number;
  answer: string;
  submittedAt?: Date;
  isRevealed: boolean;
  answerIndex: number;
};

interface MyNumbersDisplayProps {
  myAnswers: ItoPlayerAnswerWithIndex[];
}

export default function MyNumbersDisplay({
  myAnswers,
}: MyNumbersDisplayProps) {
  if (myAnswers.length === 0) return null;

  return (
    <Card variant="primary" padding="md" className="text-center">
      <Text variant="small" className="mb-2 text-primary-on">
        {myAnswers.length === 1
          ? "เลขของคุณ:"
          : `เลขของคุณ (${myAnswers.length} เลข):`}
      </Text>
      <div className="flex flex-wrap justify-center gap-3 md:gap-4">
        {myAnswers
          .sort((a, b) => a.answerIndex - b.answerIndex)
          .map((ans, idx) => (
            <div key={idx} className="text-center">
              <div className="min-w-[5rem] rounded-md border-2 border-ink bg-surface px-3 py-2 text-fg shadow-brutal-sm">
                <span className="font-number text-number md:text-number-lg font-bold tabular-nums">
                  {ans.number}
                </span>
              </div>
              {myAnswers.length > 1 && (
                <Text variant="caption" className="mt-1 text-primary-on">
                  เลขที่ {idx + 1}
                </Text>
              )}
            </div>
          ))}
      </div>
    </Card>
  );
}
