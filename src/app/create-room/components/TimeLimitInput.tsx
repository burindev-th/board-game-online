'use client';

import { Game } from '@/types';
import { Input } from '@/components/ui';

interface TimeLimitInputProps {
  value: number;
  onChange: (value: number) => void;
  selectedGame: Game | undefined;
  disabled?: boolean;
}

export default function TimeLimitInput({
  value,
  onChange,
  selectedGame,
  disabled = false,
}: TimeLimitInputProps) {
  // Only show if game supports custom time
  if (!selectedGame?.enableCustomTime) return null;

  return (
    <Input
      type="number"
      id="timeLimit"
      label="เวลาเล่น (นาที)"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      min={1}
      max={120}
      disabled={disabled}
      hint={
        <>
          ค่าเริ่มต้น: {selectedGame.defaultTimeMinutes || 10} นาที
          {selectedGame.defaultTimeMinutes && <span className="ml-2">(ระบุ 1-120 นาที)</span>}
        </>
      }
    />
  );
}
