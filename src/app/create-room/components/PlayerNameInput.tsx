'use client';

import { Input, Text } from '@/components/ui';

interface PlayerNameInputProps {
  value: string;
  onChange: (value: string) => void;
  error: string;
  disabled?: boolean;
}

export default function PlayerNameInput({ value, onChange, error, disabled = false }: PlayerNameInputProps) {
  return (
    <div>
      <Input
        type="text"
        id="playerName"
        label="ชื่อผู้เล่น *"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ใส่ชื่อของคุณ"
        maxLength={20}
        disabled={disabled}
        error={error || undefined}
      />
      <Text variant="caption" tone="subtle" className="mt-1.5 text-right">
        {value.length}/20
      </Text>
    </div>
  );
}
