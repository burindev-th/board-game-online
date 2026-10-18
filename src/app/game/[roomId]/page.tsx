/**
 * หน้าเล่นเกม
 * แสดงเกมที่เลือกและจัดการ gameplay
 * Dynamic route: /game/[roomId]
 */

"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LuHouse } from "react-icons/lu";
import { useRoom } from "@/lib/hooks/useRoom";
import { usePlayers } from "@/lib/hooks/usePlayers";
import { useGames } from "@/lib/hooks/useGames";
import ItoGame from "@/components/games/ItoGame";
import {
  Alert,
  Badge,
  Button,
  Card,
  Heading,
  PlayerChip,
  Spinner,
  Text,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { LuGamepad2 } from "react-icons/lu";

interface GamePageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function GamePage({ params }: GamePageProps) {
  const router = useRouter();

  // Unwrap params Promise
  const { roomId } = use(params);

  const { room, loading: roomLoading, error: roomError } = useRoom(roomId);
  const {
    players,
    loading: playersLoading,
    error: playersError,
  } = usePlayers(roomId);
  const { games } = useGames();

  const [playerId, setPlayerId] = useState<string | null>(null);

  // Get playerId from localStorage
  useEffect(() => {
    const id = localStorage.getItem(`room_${roomId}_playerId`);
    console.log("🎮 Game page - Reading playerId from localStorage:", {
      roomId,
      playerId: id,
    });
    setPlayerId(id);
  }, [roomId]);

  // Redirect back to lobby if game is not in 'playing' status
  useEffect(() => {
    if (room && room.status !== "playing") {
      console.log("⚠️ Game not started yet, redirecting to lobby");
      router.push(`/lobby/${roomId}`);
    }
  }, [room, roomId, router]);

  // Check if player is still in the room
  useEffect(() => {
    if (!playersLoading && playerId) {
      const playerExists = players.some((p) => p.id === playerId);

      if (!playerExists && players.length > 0) {
        console.log("⚠️ Player not found in room");
        alert("คุณไม่อยู่ในห้องนี้แล้ว");
        localStorage.removeItem(`room_${roomId}_playerId`);
        router.push("/");
      }
    }
  }, [playerId, players, playersLoading, roomId, router]);

  // Get selected game details
  const selectedGame = games.find((g) => g.id === room?.gameId);

  // Loading state
  if (roomLoading || playersLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-fg">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (roomError || playersError || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-4 text-fg">
        <Card padding="lg" className="w-full max-w-md text-center">
          <Heading level="h2" className="mb-4">
            เกิดข้อผิดพลาด
          </Heading>
          <Alert tone="danger" className="mb-6">
            {roomError || playersError || "ไม่พบห้อง"}
          </Alert>
          <Button href="/">กลับหน้าหลัก</Button>
        </Card>
      </div>
    );
  }

  // Get current player (for future use)
  // const currentPlayer = players.find(p => p.id === playerId);

  return (
    <div className="min-h-screen bg-bg p-3 text-fg md:p-4">
      <div className="mx-auto max-w-6xl py-3 md:py-8">
        {/* Combined Game Header + Players List */}
        <Card padding="md" className="mb-3 md:mb-6">
          {/* Game Header Section */}
          <Card variant="muted" padding="sm" className="mb-4 md:mb-6">
            <div className="flex flex-row flex-wrap items-center justify-between gap-3 md:gap-4">
              {/* Game Name */}
              <div className="min-w-0 flex-1">
                <Heading level="h2" as="h1">
                  {selectedGame?.name || room.gameType || "เกม"}
                </Heading>
                <div className="flex flex-row items-center gap-2">
                  <Text variant="small" tone="muted" as="span">
                    รหัสห้อง:
                  </Text>
                  <span className="text-h3 font-bold tracking-wider text-fg">
                    {room.code.slice(0, 3)}-{room.code.slice(3)}
                  </span>
                </div>
              </div>

              {/* Right Side: Status + Home Button */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Status Badge */}
                <Badge tone="success">
                  <span className="block h-2 w-2 animate-pulse rounded-full border border-ink bg-success" />
                  กำลังเล่น
                </Badge>

                {/* Home Button */}
                <Button href="/" variant="outline" size="sm" aria-label="กลับหน้าหลัก" icon={<LuHouse aria-hidden />}>
                  <span className="hidden sm:inline">กลับหน้าหลัก</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Players Section */}
          <div className="mb-3">
            <div className="mb-2 flex items-center justify-between">
              <Heading level="h3" as="h2">
                ผู้เล่นทั้งหมด
              </Heading>
              <Text variant="small" tone="muted" as="span" className="font-semibold">
                {players.length}
                {selectedGame && <span>/{selectedGame.maxPlayer}</span>} คน
              </Text>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {players.map((player, index) => (
                <PlayerChip
                  key={player.id}
                  name={player.name}
                  colorIndex={index}
                  isHost={player.isHost}
                  className="min-w-0 animate-fade-in"
                  status={
                    <>
                      {player.id === playerId && <Badge tone="secondary">คุณ</Badge>}
                      <span
                        className={cn(
                          "block h-2.5 w-2.5 shrink-0 rounded-full border border-ink",
                          player.isOnline ? "bg-success" : "bg-surface-muted",
                        )}
                        title={player.isOnline ? "Online" : "Offline"}
                      />
                    </>
                  }
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Game Content */}
        {room.gameId === "BWLxJkh45e6RiALRBmcl" &&
        playerId &&
        room.gameSessionId ? (
          <ItoGame sessionId={room.gameSessionId} playerId={playerId} />
        ) : (
          <Card padding="lg" className="mt-6 text-center">
            <Text variant="body" tone="muted" className="mb-4">
              <LuGamepad2 className="mx-auto h-8 w-8" aria-hidden />
            </Text>
            <Text variant="small" tone="muted">
              เกมนี้ยังไม่รองรับ
            </Text>
          </Card>
        )}
      </div>
    </div>
  );
}
