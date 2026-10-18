"use client";

import { useState } from "react";
import { Alert, Button, Card, Heading, Input, PageShell, Text } from "@/components/ui";

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
    value = value.slice(0, 6);

    setFormData({ ...formData, roomCode: value });

    // Validation
    if (value.length === 0) {
      setErrors({ ...errors, roomCode: "กรุณากรอกรหัสห้อง" });
    } else if (value.length < 6) {
      setErrors({ ...errors, roomCode: "รหัสห้องต้องเป็นตัวเลข 6 หลัก" });
    } else {
      setErrors({ ...errors, roomCode: "" });
    }
  };

  const handlePlayerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setApiError(null);

    // Validation
    if (formData.roomCode.length !== 6) {
      setErrors({ ...errors, roomCode: "รหัสห้องต้องเป็นตัวเลข 6 หลัก" });
      return;
    }

    if (!formData.playerName.trim()) {
      setErrors({ ...errors, playerName: "กรุณากรอกชื่อผู้เล่น" });
      return;
    }

    if (formData.playerName.length > 20) {
      setErrors({ ...errors, playerName: "ชื่อต้องไม่เกิน 20 ตัวอักษร" });
      return;
    }

    // IMPORTANT: Clear ALL localStorage BEFORE joining to prevent stale data
    // BUT preserve user age data so they don't have to re-enter it
    console.log("🗑️ Clearing all localStorage before joining...");
    const savedAge = localStorage.getItem("user_age");
    const savedAgeTimestamp = localStorage.getItem("user_age_timestamp");
    localStorage.clear();
    if (savedAge) localStorage.setItem("user_age", savedAge);
    if (savedAgeTimestamp) localStorage.setItem("user_age_timestamp", savedAgeTimestamp);

    // Start loading
    setIsLoading(true);

    try {
      // Call API
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: formData.roomCode,
          playerName: formData.playerName.trim(),
        }),
      });

      const data: JoinRoomResponse = await response.json();

      if (data.success && data.roomId && data.playerId) {
        // Success!
        console.log("✅ Joined room:", {
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

  // Format room code as XXX-XXX
  const formatRoomCode = (code: string) => {
    if (code.length <= 3) return code;
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  };

  const isFormValid =
    formData.roomCode.length === 6 &&
    formData.playerName.trim().length > 0 &&
    !errors.roomCode &&
    !errors.playerName;

  return (
    <PageShell backHref="/" width="sm">
      <Card padding="lg">
        {/* Header */}
        <div className="mb-6 text-center md:mb-8">
          <Heading level="h1" className="mb-2">
            เข้าร่วมห้อง
          </Heading>
          <Text tone="muted">ใส่รหัสห้องเพื่อเข้าร่วมเกม</Text>
        </div>

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
              maxLength={20}
              disabled={isLoading}
              error={errors.playerName || undefined}
            />
            <Text variant="caption" tone="subtle" className="mt-1.5 text-right">
              {formData.playerName.length}/20
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
            {isLoading ? "กำลังเข้าห้อง..." : "เข้าห้อง"}
          </Button>
        </form>

        {/* Info Box */}
        <Alert tone="info" className="mt-6 md:mt-8">
          <span className="font-semibold">คำแนะนำ:</span>{" "}
          รหัสห้องเป็นตัวเลข 6 หลักที่ได้รับจากผู้สร้างห้อง
        </Alert>
      </Card>
    </PageShell>
  );
}
