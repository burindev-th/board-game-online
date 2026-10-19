"use client";

import { useState } from "react";
import { Alert, Button, Input, Text } from "@/components/ui";

import RoomEntryLayout from "@/components/rooms/RoomEntryLayout";
import { formatRoomCode, ROOM_CODE_LENGTH } from "@/lib/utils/roomCode";
import { getPlayerNameError, PLAYER_NAME_MAX_LENGTH } from "@/lib/utils/playerName";
import { resetStorageKeepingAge, savePlayerSession } from "@/lib/utils/playerSession";
import { fetchJson } from "@/lib/utils/apiClient";
import { FaArrowRight } from "react-icons/fa6";

// API Response Types
interface JoinRoomResponse {
  success: boolean;
  roomId?: string;
  code?: string;
  playerId?: string;
  error?: string;
  details?: string;
}

export default function JoinRoomPage() {
  const [formData, setFormData] = useState({
    roomCode: "",
    playerName: "",
  });

  const [errors, setErrors] = useState({
    roomCode: "",
    playerName: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove non-digit characters
    value = value.replace(/\D/g, "");

    // Limit to 6 digits
    value = value.slice(0, ROOM_CODE_LENGTH);

    setFormData({ ...formData, roomCode: value });

    // Validation
    if (value.length === 0) {
      setErrors({ ...errors, roomCode: "กรุณากรอกรหัสห้อง" });
    } else if (value.length < ROOM_CODE_LENGTH) {
      setErrors({ ...errors, roomCode: "รหัสห้องต้องเป็นตัวเลข 6 หลัก" });
    } else {
      setErrors({ ...errors, roomCode: "" });
    }
  };

  const handlePlayerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, playerName: value });

    // Validation
    setErrors({ ...errors, playerName: getPlayerNameError(value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setApiError(null);

    // Validation
    if (formData.roomCode.length !== ROOM_CODE_LENGTH) {
      setErrors({ ...errors, roomCode: "รหัสห้องต้องเป็นตัวเลข 6 หลัก" });
      return;
    }

    const playerNameError = getPlayerNameError(formData.playerName);
    if (playerNameError) {
      setErrors({ ...errors, playerName: playerNameError });
      return;
    }

    // IMPORTANT: Clear ALL localStorage BEFORE joining to prevent stale data
    // BUT preserve user age data so they don't have to re-enter it
    console.log("🗑️ Clearing all localStorage before joining...");
    resetStorageKeepingAge();

    // Start loading
    setIsLoading(true);

    try {
      // Call API
      const { data } = await fetchJson<JoinRoomResponse>("/api/rooms/join", {
        code: formData.roomCode,
        playerName: formData.playerName.trim(),
      });

      if (data.success && data.roomId && data.playerId) {
        // Success!
        console.log("✅ Joined room:", {
          roomId: data.roomId,
          code: data.code,
          playerId: data.playerId,
        });

        // Save NEW playerId to localStorage
        savePlayerSession(data.roomId, data.playerId);

        console.log("💾 Saved new playerId to localStorage:", data.playerId);

        // Force full page reload to ensure clean state
        window.location.href = `/lobby/${data.roomId}`;
      } else {
        // API returned error
        const errorMsg = data.error || "เกิดข้อผิดพลาดในการเข้าร่วมห้อง";
        setApiError(errorMsg);
        console.error("❌ API Error:", data);
      }
    } catch (error) {
      // Network or parsing error
      console.error("❌ Join room error:", error);
      setApiError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    formData.roomCode.length === ROOM_CODE_LENGTH &&
    formData.playerName.trim().length > 0 &&
    !errors.roomCode &&
    !errors.playerName;

  return (
    <RoomEntryLayout mode="join">
      {/* API Error Message */}
      {apiError && (
        <Alert tone="danger" className="mb-6">
          {apiError}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Room Code Input */}
        <Input
          type="text"
          id="roomCode"
          label="รหัสห้อง *"
          value={formatRoomCode(formData.roomCode)}
          onChange={handleRoomCodeChange}
          placeholder="000-000"
          autoComplete="off"
          hint="ขอรหัส 6 หลักจากเพื่อนที่สร้างห้อง"
          inputMode="numeric"
          disabled={isLoading}
          error={errors.roomCode || undefined}
          className="h-auto py-4 text-center font-number text-h2 tracking-[0.3em]"
        />

        {/* Player Name Input */}
        <div>
          <Input
            type="text"
            id="playerName"
            label="ชื่อผู้เล่น *"
            value={formData.playerName}
            onChange={handlePlayerNameChange}
            placeholder="ใส่ชื่อของคุณ"
            maxLength={PLAYER_NAME_MAX_LENGTH}
            disabled={isLoading}
            error={errors.playerName || undefined}
          />
          <Text variant="caption" tone="subtle" className="mt-1.5 text-right">
            {formData.playerName.length}/{PLAYER_NAME_MAX_LENGTH}
          </Text>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="secondary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? "กำลังเข้าห้อง..." : "เข้าร่วมห้องเกม"}
          {!isLoading && <FaArrowRight aria-hidden />}
        </Button>
      </form>

      {/* Info Box */}
      <Alert tone="info" className="mt-6 md:mt-8">
        <span className="font-semibold">คำแนะนำ:</span>{" "}
        รหัสห้องเป็นตัวเลข 6 หลักที่ได้รับจากผู้สร้างห้อง
      </Alert>
    </RoomEntryLayout>
  );
}
