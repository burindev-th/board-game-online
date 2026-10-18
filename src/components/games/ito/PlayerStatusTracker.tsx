/**
 * Player Status Tracker Component
 * แสดงสถานะการส่งคำใบ้ของผู้เล่น
 */

"use client";

import { Badge, Card, Heading, PlayerChip, Text } from "@/components/ui";

interface PlayerStatus {
  playerName: string;
  submittedCount: number;
  totalExpected: number;
}

interface PlayerStatusTrackerProps {
  title: string;
  playersCompleted: PlayerStatus[];
  playersNotCompleted: Array<[string, PlayerStatus]>;
  totalPlayers: number;
}

export default function PlayerStatusTracker({
  title,
  playersCompleted,
  playersNotCompleted,
  totalPlayers,
}: PlayerStatusTrackerProps) {
  return (
    <Card variant="muted" padding="sm" className="mb-4 md:mb-6">
      <Heading level="h3" as="h4" className="mb-2 text-center md:mb-3">
        {title}
      </Heading>
      <Text variant="small" tone="muted" className="mb-2 text-center md:mb-3">
        {playersCompleted.length} / {totalPlayers} คนส่งครบแล้ว
      </Text>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* ส่งครบแล้ว */}
        <div>
          <div className="mb-1 flex justify-center md:mb-2">
            <Badge tone="success">✅ ส่งครบแล้ว</Badge>
          </div>
          <div className="grid gap-2">
            {playersCompleted.map((p, i) => (
              <PlayerChip
                key={i}
                name={p.playerName}
                colorIndex={i}
                status={
                  <Badge tone="success">
                    {p.submittedCount}/{p.totalExpected}
                  </Badge>
                }
              />
            ))}
          </div>
        </div>

        {/* ยังส่งไม่ครบ */}
        <div>
          <div className="mb-1 flex justify-center md:mb-2">
            <Badge tone="warning">⏳ ยังส่งไม่ครบ</Badge>
          </div>
          <div className="grid gap-2">
            {playersNotCompleted.map(([id, p], i) => (
              <PlayerChip
                key={id}
                name={p.playerName}
                colorIndex={playersCompleted.length + i}
                status={
                  <Badge tone="neutral">
                    {p.submittedCount}/{p.totalExpected}
                  </Badge>
                }
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
