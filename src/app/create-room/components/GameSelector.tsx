'use client';

import { LuInfo } from 'react-icons/lu';
import { Game } from '@/types';
import { ITO_GAME_ID } from '@/constants/ito';
import { Alert, Button, Select, Spinner, Text } from '@/components/ui';

interface GameSelectorProps {
  games: Game[];
  selectedGameId: string;
  onChange: (gameId: string) => void;
  onShowRules: () => void;
  error: string;
  loading?: boolean;
  disabled?: boolean;
  gamesError?: string | null;
}

export default function GameSelector({
  games,
  selectedGameId,
  onChange,
  onShowRules,
  error,
  loading = false,
  disabled = false,
  gamesError = null,
}: GameSelectorProps) {
  const selectedGame = games.find((game) => game.id === selectedGameId);
  const isItoGame = selectedGame?.id === ITO_GAME_ID;

  return (
    <div>
      {loading ? (
        <div>
          <Text as="span" variant="small" className="mb-1.5 block font-semibold">
            เลือกเกม *
          </Text>
          <div className="flex h-11 w-full items-center justify-center gap-2 rounded-md border-2 border-ink bg-surface-muted px-4 text-body text-fg-muted">
            <Spinner size="sm" />
            กำลังโหลดรายการเกม...
          </div>
        </div>
      ) : gamesError ? (
        <div>
          <Text as="span" variant="small" className="mb-1.5 block font-semibold">
            เลือกเกม *
          </Text>
          <Alert tone="danger">{gamesError}</Alert>
        </div>
      ) : (
        <Select
          id="gameId"
          label="เลือกเกม *"
          value={selectedGameId}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || games.length === 0}
          error={error || undefined}
        >
          <option value="">-- เลือกเกม --</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name} ({game.minPlayer}-{game.maxPlayer} คน)
            </option>
          ))}
        </Select>
      )}
      {/* Error is shown by Select; keep it visible for loading/gamesError states too */}
      {error && (loading || gamesError) && (
        <Text variant="caption" className="mt-1.5">
          {error}
        </Text>
      )}

      {/* Rules Button - Show only for Ito game */}
      {isItoGame && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          fullWidth
          onClick={onShowRules}
          icon={<LuInfo aria-hidden />}
          className="mt-3"
        >
          กติกาการเล่น
        </Button>
      )}
    </div>
  );
}
