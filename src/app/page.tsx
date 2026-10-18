"use client";

import { useState } from "react";
import Link from "next/link";
import { FaComments, FaGamepad, FaPeopleGroup, FaPlus } from "react-icons/fa6";
import FeedbackModal from "@/components/FeedbackModal";
import { Button, buttonClasses, Heading, PageShell, Text } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

export default function Home() {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  return (
    <PageShell width="md" center showBrand={false}>
      {/* Logo/Title */}
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-lg border-2 border-ink bg-primary text-primary-on shadow-brutal md:h-20 md:w-20">
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/create-room"
          className={cn(buttonClasses({ variant: "primary", size: "lg" }), "group h-auto flex-col py-6")}
        >
          <FaPlus className="h-8 w-8 transition-transform duration-modal group-hover:rotate-90" />
          <span>สร้างห้องเกม</span>
        </Link>
        <Link
          href="/join-room"
          className={cn(buttonClasses({ variant: "secondary", size: "lg" }), "group h-auto flex-col py-6")}
        >
          <FaPeopleGroup className="h-8 w-8 transition-transform duration-modal group-hover:scale-110" />
          <span>เข้าร่วมห้อง</span>
        </Link>
      </div>

      <div className="mt-8 text-center">
        <Button
          variant="ghost"
          size="sm"
          icon={<FaComments aria-hidden />}
          onClick={() => setShowFeedbackModal(true)}
        >
          แจ้งปัญหา/เพิ่มโจทย์
        </Button>
      </div>

      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </PageShell>
  );
}
