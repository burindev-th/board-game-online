/**
 * Revealed Numbers List Component
 * แสดงรายการเลขที่เปิดแล้ว
 */

"use client";

import { Card, Heading } from "@/components/ui";

interface RevealedNumbersListProps {
  revealedNumbers: number[];
}

export default function RevealedNumbersList({
  revealedNumbers,
}: RevealedNumbersListProps) {
  if (revealedNumbers.length === 0) return null;

  return (
    <Card variant="muted" padding="sm" className="mb-4 md:mb-6">
      <Heading level="h3" as="h4" className="mb-2 text-center md:mb-3">
        ตัวเลขที่เปิดแล้ว
      </Heading>
      <div className="flex flex-wrap justify-center gap-2">
        {revealedNumbers.map((num, i) => (
          <span
            key={i}
            className="inline-flex flex-col items-center rounded-md border-2 border-ink bg-surface px-3 py-2 shadow-brutal-sm"
          >
            <span className="font-number text-h2 font-bold tabular-nums text-fg">
              {num}
            </span>
          </span>
        ))}
      </div>
    </Card>
  );
}
