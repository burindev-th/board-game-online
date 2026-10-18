/**
 * Revealed Numbers List Component
 * แถบเลขที่เปิดแล้ว (แบบย่อ) ใช้เทียบกับคำใบ้ก่อนตัดสินใจ
 */

"use client";

interface RevealedNumbersListProps {
  revealedNumbers: number[];
  className?: string;
}

export default function RevealedNumbersList({
  revealedNumbers,
  className,
}: RevealedNumbersListProps) {
  if (revealedNumbers.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2 rounded-md border-2 border-dashed border-ink bg-surface-muted px-3 py-2">
        <span className="text-caption font-semibold text-fg-muted">เปิดแล้ว</span>
        {revealedNumbers.map((num, i) => (
          <span
            key={i}
            className="rounded-sm border-2 border-ink bg-surface px-2 font-number text-body font-bold tabular-nums text-fg"
          >
            {num}
          </span>
        ))}
      </div>
    </div>
  );
}
