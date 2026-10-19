"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "@/lib/hooks/useRoom";
import { usePlayers } from "@/lib/hooks/usePlayers";
import { useGames } from "@/lib/hooks/useGames";
import { Alert, Button, Card, Heading, PageShell, Spinner } from "@/components/ui";
import LobbyView from "@/components/lobby/LobbyView";
import { kickPlayer, toggleReady, leaveRoom } from "@/lib/firebase/firestore";
import { clearRoomPlayerId, getRoomPlayerId } from "@/lib/utils/playerSession";
import { fetchJson } from "@/lib/utils/apiClient";
import { getErrorMessage } from "@/lib/utils/error";

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
    setPlayerId(getRoomPlayerId(roomId));
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

    // Check if current player exists in players list
    if (playerId) {
      const playerExists = players.some((p) => p.id === playerId);

      if (!playerExists && players.length > 0) {
        // Player was kicked! Redirect to join page
        alert("คุณถูกเตะออกจากห้องแล้ว");

        // Clear ALL localStorage related to this player and room
        clearRoomPlayerId(roomId, true);

        // Redirect to join page after a short delay
        setTimeout(() => {
          router.push("/join-room");
        }, 2000);
        return;
      }
    }

    // If no playerId in localStorage, redirect to join page
    if (!playerId && !playersLoading) {
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

  // Run a lobby action with shared loading/error handling.
  // keepLoading: leave the spinner on after success (we're navigating away).
  // Return a string from the action to show it as an error.
  const runAction = async (
    action: () => Promise<string | void>,
    {
      keepLoading = false,
      errorMessage = (error: unknown) => getErrorMessage(error, "เกิดข้อผิดพลาด"),
    }: { keepLoading?: boolean; errorMessage?: (error: unknown) => string } = {}
  ) => {
    setActionLoading(true);
    setActionError(null);

    try {
      const failure = await action();
      if (failure) setActionError(failure);
      if (failure || !keepLoading) setActionLoading(false);
    } catch (error) {
      console.error("Lobby action error:", error);
      setActionError(errorMessage(error));
      setActionLoading(false);
    }
  };

  // POST/PATCH to a room API route; resolves to an error message on failure
  const callRoomApi = async (
    path: string,
    method: "POST" | "PATCH",
    body: Record<string, unknown>,
    fallback: string
  ) => {
    const { response, data } = await fetchJson<{ success: boolean; error?: string }>(
      `/api/rooms/${roomId}/${path}`,
      body,
      method
    );

    if (!data.success) {
      console.error(`Room API ${path} error:`, { status: response.status, data });
      return data.error || fallback;
    }
  };

  // Handle Kick Player
  const handleKick = async (playerIdToKick: string, playerName: string) => {
    if (!confirm(`ต้องการเตะ ${playerName} ออกจากห้องหรือไม่?`)) return;

    await runAction(() => kickPlayer(roomId, playerIdToKick));
  };

  // Handle Toggle Ready
  const handleToggleReady = async () => {
    if (!playerId || !currentPlayer) return;

    await runAction(() => toggleReady(roomId, playerId, currentPlayer.isReady));
  };

  // Handle Leave Room
  const handleLeaveRoom = async () => {
    if (!playerId) return;
    if (!confirm("ต้องการออกจากห้องหรือไม่?")) return;

    await runAction(
      async () => {
        await leaveRoom(roomId, playerId);
        router.push("/");
      },
      { keepLoading: true }
    );
  };

  // Handle Update Max Players
  const handleUpdateMaxPlayers = async () => {
    if (!isHost || !playerId || !room) return;

    await runAction(
      async () => {
        const failure = await callRoomApi(
          "update-settings",
          "PATCH",
          { hostId: playerId, maxPlayers: newMaxPlayers },
          "ไม่สามารถอัพเดทการตั้งค่าได้"
        );
        if (failure) return failure;
        setEditingMaxPlayers(false);
      },
      { errorMessage: () => "เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า" }
    );
  };

  // Handle Start Game
  // On success the redirect happens via useEffect when room status changes
  const handleStartGame = async () => {
    if (!isHost || !room || !canStartGame || !playerId) return;

    await runAction(
      () =>
        callRoomApi(
          "start",
          "POST",
          { hostId: playerId },
          "เกิดข้อผิดพลาดในการเริ่มเกม"
        ),
      {
        keepLoading: true,
        errorMessage: () =>
          "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",
      }
    );
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
