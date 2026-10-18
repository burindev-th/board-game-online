/**
 * หน้าเล่นเกม
 * แสดงเกมที่เลือกและจัดการ gameplay
 * Dynamic route: /game/[roomId]
 */

"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LuChevronDown, LuGamepad2, LuHouse } from "react-icons/lu";
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
import { getPlayerColor } from "@/lib/theme/playerColors";
import { ThemeToggle } from "@/components/theme";

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
  const playersMenuRef = useRef<HTMLDetailsElement>(null);

  // ปิดรายชื่อผู้เล่นเมื่อแตะนอกเมนู
  useEffect(() => {
    const close = (e: PointerEvent) => {
      const menu = playersMenuRef.current;
      if (menu?.open && !menu.contains(e.target as Node)) menu.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

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
    <div className="min-h-screen bg-bg px-3 pb-8 text-fg md:px-4">
      <div className="mx-auto max-w-5xl">
        {/* Room bar: ข้อมูลห้องแบบย่อ เพื่อให้พื้นที่หลักเป็นของเกม */}
        <header className="flex items-center gap-2 py-3 md:gap-3 md:py-4">
          <Button
            href="/"
            variant="outline"
            size="sm"
            aria-label="กลับหน้าหลัก"
            icon={<LuHouse aria-hidden />}
            className="shrink-0"
          />

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-h3 font-bold leading-tight md:text-h3-lg">
              {selectedGame?.name || room.gameType || "เกม"}
            </h1>
            <p className="text-caption text-fg-muted">
              ห้อง{" "}
              <span className="font-bold tracking-wider text-fg">
                {room.code.slice(0, 3)}-{room.code.slice(3)}
              </span>
            </p>
          </div>

          {/* ผู้เล่น: avatar ซ้อนกัน กดเพื่อดูรายชื่อ */}
          <details ref={playersMenuRef} className="group relative shrink-0">
            <summary
              className="flex cursor-pointer list-none items-center gap-2 rounded-md border-2 border-ink bg-surface px-2 py-1 shadow-brutal-sm [&::-webkit-details-marker]:hidden"
              aria-label={`ผู้เล่น ${players.length} คน`}
            >
              <span className="flex -space-x-2">
                {players.slice(0, 5).map((player, index) => (
                  <span
                    key={player.id}
                    aria-hidden
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink text-caption font-bold text-on-status",
                      !player.isOnline && "opacity-40",
                    )}
                    style={{ backgroundColor: getPlayerColor(index) }}
                  >
                    {player.name.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                ))}
              </span>
              <span className="text-small font-bold tabular-nums">{players.length}</span>
              <LuChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>

            <Card
              padding="sm"
              className="absolute right-0 top-full z-20 mt-2 w-72 max-w-[calc(100vw-1.5rem)] animate-fade-in"
            >
              <div className="mb-2 flex items-center justify-between">
                <Text variant="small" as="span" className="font-bold">
                  ผู้เล่นในห้อง
                </Text>
                <Text variant="caption" tone="muted" as="span">
                  {players.length}
                  {selectedGame && `/${selectedGame.maxPlayer}`} คน
                </Text>
              </div>
              <div className="grid max-h-80 gap-2 overflow-y-auto">
                {players.map((player, index) => (
                  <PlayerChip
                    key={player.id}
                    name={player.name}
                    colorIndex={index}
                    isHost={player.isHost}
                    className="min-w-0"
                    status={
                      <>
                        {player.id === playerId && <Badge tone="secondary">คุณ</Badge>}
                        <span
                          className={cn(
                            "block h-2.5 w-2.5 shrink-0 rounded-full border border-ink",
                            player.isOnline ? "bg-success" : "bg-surface-muted",
                          )}
                          title={player.isOnline ? "ออนไลน์" : "ออฟไลน์"}
                        />
                      </>
                    }
                  />
                ))}
              </div>
            </Card>
          </details>

          <ThemeToggle className="shrink-0" />
        </header>

        {/* Game Content */}
        {room.gameId === "BWLxJkh45e6RiALRBmcl" &&
        playerId &&
        room.gameSessionId ? (
          <ItoGame sessionId={room.gameSessionId} playerId={playerId} />
        ) : (
          <Card padding="lg" className="text-center">
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
