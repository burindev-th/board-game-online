"use client";

import { useState, useEffect } from "react";
import { useGames } from "@/lib/hooks/useGames";
import PlayerNameInput from "./components/PlayerNameInput";
import GameSelector from "./components/GameSelector";
import MaxPlayersSelector from "./components/MaxPlayersSelector";
import TimeLimitInput from "./components/TimeLimitInput";
import RulesModal from "./components/RulesModal";
import { Alert, Button } from "@/components/ui";

import RoomEntryLayout from "@/components/rooms/RoomEntryLayout";
import { FaArrowRight } from "react-icons/fa6";

// API Response Types
interface CreateRoomResponse {
  success: boolean;
  roomId?: string;
  code?: string;
  playerId?: string;
  error?: string;
  details?: string;
}

export default function CreateRoomPage() {
  // Load games from Firestore
  const { games, loading: gamesLoading, error: gamesError } = useGames();

  const [formData, setFormData] = useState({
    playerName: "",
    gameId: "", // Selected game ID
    maxPlayers: 4,
    timeLimit: 10, // Time limit in minutes (default 10)
  });

  const [errors, setErrors] = useState({
    playerName: "",
    gameId: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Get selected game details
  const selectedGame = games.find((game) => game.id === formData.gameId);

  // Update maxPlayers and timeLimit when game changes
  useEffect(() => {
    if (selectedGame) {
      console.log("Selected game:", selectedGame);
      console.log(
        "minPlayer:",
        selectedGame.minPlayer,
        "maxPlayer:",
        selectedGame.maxPlayer,
        "defaultTimeMinutes:",
        selectedGame.defaultTimeMinutes,
        "enableCustomTime:",
        selectedGame.enableCustomTime
      );
      // Set maxPlayers to minPlayer by default when game is selected
      // Set timeLimit to game's default time (if available)
      setFormData((prev) => ({
        ...prev,
        maxPlayers: selectedGame.minPlayer,
        timeLimit: selectedGame.defaultTimeMinutes || 10,
      }));
    }
  }, [selectedGame]);

  const handlePlayerNameChange = (value: string) => {
    setFormData({ ...formData, playerName: value });

    // Validation
    if (value.length === 0) {
      setErrors({ ...errors, playerName: "กรุณากรอกชื่อผู้เล่น" });
    } else if (value.length > 20) {
      setErrors({ ...errors, playerName: "ชื่อต้องไม่เกิน 20 ตัวอักษร" });
    } else {
      setErrors({ ...errors, playerName: "" });
    }
  };

  const handleGameChange = (gameId: string) => {
    setFormData({ ...formData, gameId });

    // Validation
    if (!gameId) {
      setErrors({ ...errors, gameId: "กรุณาเลือกเกม" });
    } else {
      setErrors({ ...errors, gameId: "" });
    }
  };

  const handleMaxPlayersChange = (value: number) => {
    setFormData({ ...formData, maxPlayers: value });
  };

  const handleTimeLimitChange = (value: number) => {
    setFormData({ ...formData, timeLimit: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setApiError(null);

    // Validation - Player Name
    if (!formData.playerName.trim()) {
      setErrors({ ...errors, playerName: "กรุณากรอกชื่อผู้เล่น" });
      return;
    }

    if (formData.playerName.length > 20) {
      setErrors({ ...errors, playerName: "ชื่อต้องไม่เกิน 20 ตัวอักษร" });
      return;
    }

    // Validation - Game
    if (!formData.gameId) {
      setErrors({ ...errors, gameId: "กรุณาเลือกเกม" });
      return;
    }

    // IMPORTANT: Clear ALL localStorage BEFORE creating room to prevent stale data
    // BUT preserve user age data so they don't have to re-enter it
    console.log("🗑️ Clearing all localStorage before creating room...");
    const savedAge = localStorage.getItem("user_age");
    const savedAgeTimestamp = localStorage.getItem("user_age_timestamp");
    localStorage.clear();
    if (savedAge) localStorage.setItem("user_age", savedAge);
    if (savedAgeTimestamp) localStorage.setItem("user_age_timestamp", savedAgeTimestamp);

    // Start loading
    setIsLoading(true);

    try {
      // Call API
      const response = await fetch("/api/rooms/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName: formData.playerName.trim(),
          gameId: formData.gameId,
          maxPlayers: formData.maxPlayers,
          timeLimit: selectedGame?.enableCustomTime ? formData.timeLimit : undefined,
        }),
      });

      const data: CreateRoomResponse = await response.json();

      if (data.success && data.roomId && data.playerId) {
        // Success!
        console.log("✅ Room created:", {
          roomId: data.roomId,
          code: data.code,
          playerId: data.playerId,
        });

        // Save NEW playerId to localStorage
        localStorage.setItem("playerId", data.playerId);
        localStorage.setItem(`room_${data.roomId}_playerId`, data.playerId);

        console.log("💾 Saved new playerId to localStorage:", data.playerId);

        // Force full page reload to ensure clean state
        window.location.href = `/lobby/${data.roomId}`;
      } else {
        // API returned error
        const errorMsg = data.error || "เกิดข้อผิดพลาดในการสร้างห้อง";
        setApiError(errorMsg);
        console.error("❌ API Error:", data);
      }
    } catch (error) {
      // Network or parsing error
      console.error("❌ Create room error:", error);
      setApiError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoomEntryLayout mode="create">
      {/* API Error Message */}
      {apiError && (
        <Alert tone="danger" className="mb-6">
          {apiError}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Player Name Input */}
        <PlayerNameInput
          value={formData.playerName}
          onChange={handlePlayerNameChange}
          error={errors.playerName}
          disabled={isLoading}
        />

        {/* Game Selection Dropdown */}
        <GameSelector
          games={games}
          selectedGameId={formData.gameId}
          onChange={handleGameChange}
          onShowRules={() => setShowRulesModal(true)}
          error={errors.gameId}
          loading={gamesLoading}
          disabled={isLoading}
          gamesError={gamesError}
        />

        {/* Max Players Dropdown */}
        <MaxPlayersSelector
          value={formData.maxPlayers}
          onChange={handleMaxPlayersChange}
          selectedGame={selectedGame}
          disabled={isLoading}
        />

        {/* Time Limit Input - Show only if game supports custom time */}
        <TimeLimitInput
          value={formData.timeLimit}
          onChange={handleTimeLimitChange}
          selectedGame={selectedGame}
          disabled={isLoading}
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={
            !!errors.playerName ||
            !!errors.gameId ||
            !formData.playerName.trim() ||
            !formData.gameId ||
            isLoading
          }
        >
          {isLoading ? "กำลังสร้างห้อง..." : "สร้างห้องเกม"}
          {!isLoading && <FaArrowRight aria-hidden />}
        </Button>
      </form>

      {/* Info Box */}
      <Alert tone="info" className="mt-6 md:mt-8">
        <span className="font-semibold">เคล็ดลับ: </span>
        หลังจากสร้างห้องแล้ว คุณจะได้รับรหัสห้อง 6 หลักเพื่อแชร์ให้เพื่อนๆ
        เข้าร่วม
      </Alert>

      {/* Rules Modal */}
      <RulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        gameName={selectedGame?.name || 'Ito'}
      />
    </RoomEntryLayout>
  );
}
