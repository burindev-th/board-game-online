"use client";

import { use, useEffect, useState } from "react";
import { LuPencil, LuCheck, LuX, LuCopy } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { useRoom } from "@/lib/hooks/useRoom";
import { usePlayers } from "@/lib/hooks/usePlayers";
import { useGames } from "@/lib/hooks/useGames";
import {
  Alert,
  Badge,
  Button,
  Card,
  Heading,
  IconButton,
  PageShell,
  PlayerChip,
  Spinner,
  Text,
  Input,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { kickPlayer, toggleReady, leaveRoom } from "@/lib/firebase/firestore";

interface LobbyPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function LobbyPage({ params }: LobbyPageProps) {
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
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingMaxPlayers, setEditingMaxPlayers] = useState(false);
  const [newMaxPlayers, setNewMaxPlayers] = useState<number>(0);

  // Get playerId from localStorage
  useEffect(() => {
    const id = localStorage.getItem(`room_${roomId}_playerId`);
    console.log("🔍 Reading playerId from localStorage:", {
      roomId,
      playerId: id,
      allLocalStorage: { ...localStorage },
    });
    setPlayerId(id);
  }, [roomId]);

  // Redirect to game when room status changes to 'playing'
  useEffect(() => {
    if (room?.status === "playing") {
      router.push(`/game/${roomId}`);
    }
  }, [room?.status, roomId, router]);

  // Check if current player was kicked (not in players list anymore)
  useEffect(() => {
    // Wait until we have players data and not loading
    if (playersLoading) {
      return;
    }

    // If we have playerId but no players at all, wait a bit more
    if (playerId && players.length === 0) {
      return;
    }

    console.log("🔍 Checking player status:", {
      playerId,
      playersCount: players.length,
      playerIds: players.map((p) => p.id),
    });

    // Check if current player exists in players list
    if (playerId) {
      const playerExists = players.some((p) => p.id === playerId);

      if (!playerExists && players.length > 0) {
        // Player was kicked! Redirect to join page
        console.log("⚠️ Player was kicked from room");
        alert("คุณถูกเตะออกจากห้องแล้ว");

        // Clear ALL localStorage related to this player and room
        localStorage.removeItem(`room_${roomId}_playerId`);
        localStorage.removeItem("playerId");

        // Redirect to join page after a short delay
        setTimeout(() => {
          router.push("/join-room");
        }, 2000);
        return;
      }
    }

    // If no playerId in localStorage, redirect to join page
    if (!playerId && !playersLoading) {
      console.log("⚠️ No playerId found, redirecting to join page");
      router.push("/join-room");
    }
  }, [playerId, players, playersLoading, roomId, router]);

  // Copy room code to clipboard
  const handleCopyCode = async () => {
    if (room?.code) {
      try {
        await navigator.clipboard.writeText(room.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  // Check if current user is host
  const isHost = playerId === room?.hostId;

  // Get current player
  const currentPlayer = players.find((p) => p.id === playerId);

  // Get selected game details
  const selectedGame = games.find((g) => g.id === room?.gameId);
  const minPlayers = selectedGame?.minPlayer || 2;

  // Check if all players are ready (except host)
  const allPlayersReady = players.every(
    (player) => player.isReady === true || player.isHost === true
  );

  // Check if game can start
  const canStartGame =
    room && room.currentPlayers >= minPlayers && allPlayersReady;

  // Handle Kick Player
  const handleKick = async (playerIdToKick: string, playerName: string) => {
    const confirmed = confirm(`ต้องการเตะ ${playerName} ออกจากห้องหรือไม่?`);

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await kickPlayer(roomId, playerIdToKick);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      setActionError(errorMsg);
      console.error("Kick error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Toggle Ready
  const handleToggleReady = async () => {
    if (!playerId || !currentPlayer) return;

    setActionLoading(true);
    setActionError(null);

    try {
      await toggleReady(roomId, playerId, currentPlayer.isReady);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      setActionError(errorMsg);
      console.error("Toggle ready error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Leave Room
  const handleLeaveRoom = async () => {
    if (!playerId) return;

    const confirmed = confirm("ต้องการออกจากห้องหรือไม่?");

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await leaveRoom(roomId, playerId);
      router.push("/");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      setActionError(errorMsg);
      console.error("Leave room error:", error);
      setActionLoading(false);
    }
  };

  // Handle Update Max Players
  const handleUpdateMaxPlayers = async () => {
    if (!isHost || !playerId || !room) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/rooms/${roomId}/update-settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId: playerId,
          maxPlayers: newMaxPlayers,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingMaxPlayers(false);
      } else {
        setActionError(data.error || "ไม่สามารถอัพเดทการตั้งค่าได้");
      }
    } catch (error) {
      console.error("Update settings error:", error);
      setActionError("เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Start Game
  const handleStartGame = async () => {
    if (!isHost || !room || !canStartGame || !playerId) return;

    setActionLoading(true);
    setActionError(null);

    try {
      // Call API to start game
      const response = await fetch(`/api/rooms/${roomId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId: playerId,
        }),
      });

      const data = await response.json();

      console.log("API Response:", { status: response.status, data });

      if (data.success) {
        console.log("✅ Game started:", data.gameSessionId);
        // Redirect will happen automatically via useEffect when room status changes
      } else {
        const errorMsg = data.error || "เกิดข้อผิดพลาดในการเริ่มเกม";
        setActionError(errorMsg);
        console.error("❌ Start game error:", {
          status: response.status,
          data,
        });
        setActionLoading(false);
      }
    } catch (error) {
      console.error("❌ Start game error:", error);
      setActionError(
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง"
      );
      setActionLoading(false);
    }
  };

  // Loading state
  if (roomLoading || playersLoading) {
    return (
      <PageShell width="md">
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </PageShell>
    );
  }

  // Error state
  if (roomError || playersError || !room) {
    return (
      <PageShell width="sm" backHref="/" backLabel="กลับหน้าหลัก">
        <Card padding="lg" className="text-center">
          <Heading level="h2" className="mb-4">
            เกิดข้อผิดพลาด
          </Heading>
          <Alert tone="danger" className="mb-6 text-left">
            {roomError || playersError || "ไม่พบห้อง"}
          </Alert>
          <Button href="/" variant="outline">
            กลับหน้าหลัก
          </Button>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      width="md"
      actions={
        <Button
          variant="danger"
          size="sm"
          onClick={handleLeaveRoom}
          disabled={actionLoading}
        >
          {actionLoading ? "กำลังออก..." : "ออกจากห้อง"}
        </Button>
      }
    >
      <div className="space-y-4 md:space-y-6">
        {/* Game Name & Room Code Header */}
        <Card variant="primary" padding="md">
          <h1 className="mb-2 font-heading text-h2 md:text-h2-lg font-bold">
            {selectedGame?.name || "เกม"}
          </h1>
          <p className="text-small">รหัสห้อง:</p>
          <div className="flex items-center gap-3">
            <span className="font-number text-h1 md:text-h1-lg font-bold tracking-widest">
              {room.code.slice(0, 3)}-{room.code.slice(3)}
            </span>
            <IconButton
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              label="คัดลอกรหัสห้อง"
              icon={copied ? <LuCheck aria-hidden /> : <LuCopy aria-hidden />}
            />
          </div>
        </Card>

        {/* Error Message */}
        {actionError && <Alert tone="danger">{actionError}</Alert>}

        {/* Players */}
        <Card padding="md">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 md:mb-4">
            <Heading level="h3">ผู้เล่นทั้งหมด</Heading>

            {/* Max Players - Editable by Host */}
            {isHost ? (
              <div className="flex items-center gap-2">
                {editingMaxPlayers ? (
                  <div className="flex items-center gap-2 rounded-md border-2 border-ink bg-surface-muted px-3 py-1.5">
                    <span className="text-small text-fg-muted">
                      {room.currentPlayers}/
                    </span>
                    <Input
                      type="number"
                      aria-label="จำนวนผู้เล่นสูงสุด"
                      min={room.currentPlayers}
                      max={selectedGame?.maxPlayer || 10}
                      value={newMaxPlayers}
                      onChange={(e) =>
                        setNewMaxPlayers(parseInt(e.target.value))
                      }
                      className="h-9 w-16 px-2 text-center"
                    />
                    <span className="text-small text-fg-muted">คน</span>
                    <IconButton
                      variant="primary"
                      size="sm"
                      onClick={handleUpdateMaxPlayers}
                      disabled={
                        actionLoading ||
                        newMaxPlayers < room.currentPlayers ||
                        newMaxPlayers > (selectedGame?.maxPlayer || 10)
                      }
                      label="บันทึก"
                      icon={<LuCheck aria-hidden />}
                    />
                    <IconButton
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingMaxPlayers(false)}
                      disabled={actionLoading}
                      label="ยกเลิก"
                      icon={<LuX aria-hidden />}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge>
                      {room.currentPlayers}/{room.maxPlayers} คน
                    </Badge>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNewMaxPlayers(room.maxPlayers);
                        setEditingMaxPlayers(true);
                      }}
                      label="แก้ไขจำนวนผู้เล่น"
                      icon={<LuPencil aria-hidden />}
                    />
                  </div>
                )}
              </div>
            ) : (
              <Badge>
                {room.currentPlayers}/{room.maxPlayers} คน
              </Badge>
            )}
          </div>

          {/* Players List */}
          <div className="grid grid-cols-1 gap-2 md:gap-3">
            {players.map((player, index) => (
              <PlayerChip
                key={player.id}
                name={player.name}
                colorIndex={index}
                isHost={player.isHost}
                className="animate-fade-in"
                status={
                  <>
                    {player.isReady && !player.isHost && (
                      <Badge tone="success">พร้อม</Badge>
                    )}
                    {/* Online status */}
                    <span
                      role="img"
                      aria-label={player.isOnline ? "ออนไลน์" : "ออฟไลน์"}
                      className={cn(
                        "h-3 w-3 shrink-0 rounded-full border-2 border-ink",
                        player.isOnline ? "bg-success" : "bg-surface-muted",
                      )}
                    />
                    {/* Kick Button (Host only, can't kick themselves) */}
                    {isHost && !player.isHost && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleKick(player.id, player.name)}
                        disabled={actionLoading}
                      >
                        เตะ
                      </Button>
                    )}
                  </>
                }
              />
            ))}
          </div>
        </Card>

        {/* Action Section */}
        <Card padding="md">
          <div className="space-y-3 md:space-y-4">
            {isHost ? (
              // Host Actions
              <>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleStartGame}
                  disabled={!canStartGame || actionLoading}
                >
                  {actionLoading ? "กำลังเริ่มเกม..." : "เริ่มเกม"}
                </Button>
                {!canStartGame && (
                  <Text variant="small" tone="muted" className="text-center">
                    {room.currentPlayers < minPlayers
                      ? `ต้องมีผู้เล่นอย่างน้อย ${minPlayers} คน`
                      : "ผู้เล่นทุกคนต้องกดพร้อมก่อน"}
                  </Text>
                )}
              </>
            ) : (
              // Player Actions
              <Button
                variant={currentPlayer?.isReady ? "outline" : "primary"}
                size="lg"
                fullWidth
                onClick={handleToggleReady}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "กำลังโหลด..."
                  : currentPlayer?.isReady
                  ? "ยกเลิกความพร้อม"
                  : "พร้อม"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
