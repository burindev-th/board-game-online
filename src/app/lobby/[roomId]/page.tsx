"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "@/lib/hooks/useRoom";
import { usePlayers } from "@/lib/hooks/usePlayers";
import { useGames } from "@/lib/hooks/useGames";
import { Alert, Button, Card, Heading, PageShell, Spinner } from "@/components/ui";
import LobbyView from "@/components/lobby/LobbyView";
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
    <LobbyView
      room={room}
      players={players}
      selectedGame={selectedGame}
      playerId={playerId}
      isHost={isHost}
      canStartGame={Boolean(canStartGame)}
      minPlayers={minPlayers}
      copied={copied}
      busy={actionLoading}
      error={actionError}
      settings={{
        editing: editingMaxPlayers,
        value: newMaxPlayers,
        onEdit: () => {
          setNewMaxPlayers(room.maxPlayers);
          setEditingMaxPlayers(true);
        },
        onChange: setNewMaxPlayers,
        onCancel: () => setEditingMaxPlayers(false),
        onSave: handleUpdateMaxPlayers,
      }}
      onCopy={handleCopyCode}
      onLeave={handleLeaveRoom}
      onStart={handleStartGame}
      onReady={handleToggleReady}
      onKick={handleKick}
    />
  );
}
