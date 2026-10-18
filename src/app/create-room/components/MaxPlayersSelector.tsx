'use client';

import { Game } from '@/types';
import { Badge, Select } from '@/components/ui';

interface MaxPlayersSelectorProps {
  value: number;
  onChange: (value: number) => void;
  selectedGame: Game | undefined;
  disabled?: boolean;
}

export default function MaxPlayersSelector({
  value,
  onChange,
  selectedGame,
  disabled = false,
}: MaxPlayersSelectorProps) {
  return (
    <Select
      id="maxPlayers"
      label="จำนวนผู้เล่นสูงสุด"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      disabled={disabled || !selectedGame}
      hint={
        selectedGame && (
          <>
            เกมนี้รองรับ {selectedGame.minPlayer}-{selectedGame.maxPlayer}{" "}
            คน
            {selectedGame.maxPlayer > 20 && (
              <Badge tone="warning" className="ml-2 whitespace-normal">
                (⚠️ จำนวนผู้เล่นสูงมาก โปรดตรวจสอบข้อมูลเกม)
              </Badge>
            )}
          </>
        )
      }
    >
      {selectedGame ? (
        // Generate options based on selected game's minPlayer - maxPlayer
        Array.from(
          {
            length:
              selectedGame.maxPlayer - selectedGame.minPlayer + 1,
          },
          (_, i) => selectedGame.minPlayer + i
        ).map((num) => (
          <option key={num} value={num}>
            {num} คน
          </option>
        ))
      ) : (
        <option value={4}>กรุณาเลือกเกมก่อน</option>
      )}
    </Select>
  );
}
