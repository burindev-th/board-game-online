"use client";

import { useState } from "react";
import Link from "next/link";
import { FaComments, FaDice, FaGamepad, FaPeopleGroup, FaPlus } from "react-icons/fa6";
import FeedbackModal from "@/components/FeedbackModal";
import { Alert, buttonClasses, Card, cardClasses, Heading, PageShell, Text } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

export default function Home() {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  return (
    <PageShell width="lg" center>
      <div className="space-y-6">
        <Card padding="lg">
          {/* Logo/Title */}
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-lg border-2 border-ink bg-primary text-primary-on shadow-brutal md:h-20 md:w-20">
              <FaGamepad className="h-8 w-8 md:h-10 md:w-10" />
            </div>
            <Heading level="display" className="mb-2">
              บอร์ดเกม
            </Heading>
            <Text tone="muted" className="md:text-h3">
              เล่นบอร์ดเกมออนไลน์กับเพื่อนๆ
            </Text>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 grid grid-cols-1 gap-3 md:mb-8 md:grid-cols-2 md:gap-4">
            <Link
              href="/create-room"
              className={cn(buttonClasses({ variant: "primary", size: "lg" }), "group h-auto flex-col py-6")}
            >
              <FaPlus className="h-8 w-8 transition-transform duration-modal group-hover:rotate-90" />
              <span>สร้างห้องเกม</span>
              <span className="text-small font-normal">เริ่มเกมใหม่</span>
            </Link>
            <Link
              href="/join-room"
              className={cn(buttonClasses({ variant: "secondary", size: "lg" }), "group h-auto flex-col py-6")}
            >
              <FaPeopleGroup className="h-8 w-8 transition-transform duration-modal group-hover:scale-110" />
              <span>เข้าร่วมห้อง</span>
              <span className="text-small font-normal">ใช้รหัสห้อง</span>
            </Link>
          </div>

          {/* Features */}
          <div className="mb-6 grid grid-cols-1 gap-3 md:mb-8 md:grid-cols-3 md:gap-4">
            <Card variant="muted" padding="sm" className="text-center">
              <FaDice className="mx-auto mb-2 h-7 w-7" />
              <Text className="font-semibold">หลากหลายเกม</Text>
              <Text variant="small" tone="muted">เลือกเกมที่ชอบ</Text>
            </Card>
            <button
              type="button"
              onClick={() => setShowFeedbackModal(true)}
              className={cn(cardClasses({ variant: "primary", padding: "sm", interactive: true }), "text-center")}
            >
              <FaComments className="mx-auto mb-2 h-7 w-7" />
              <span className="block font-semibold">ช่วยปรับปรุง</span>
              <span className="block text-small">แจ้งปัญหา/เพิ่มโจทย์</span>
            </button>
            <Card variant="muted" padding="sm" className="text-center">
              <FaGamepad className="mx-auto mb-2 h-7 w-7" />
              <Text className="font-semibold">เล่นง่าย</Text>
              <Text variant="small" tone="muted">ไม่ต้องติดตั้ง</Text>
            </Card>
          </div>

          <Alert tone="info" title="วิธีเล่น">
            สร้างห้องใหม่เพื่อเริ่มเกม หรือใส่รหัสห้อง 6 หลักเพื่อเข้าร่วมกับเพื่อนๆ
          </Alert>
        </Card>

        <Text variant="small" tone="subtle" className="text-center">
          เล่นได้ฟรี ไม่มีค่าใช้จ่าย
        </Text>
      </div>

      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </PageShell>
  );
}
