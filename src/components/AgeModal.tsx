'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { saveAge, shouldAskAge } from '@/lib/utils/ageStorage';
import { saveAgeToFirebase } from '@/lib/firebase/age';
import { Alert, Button, Heading, Modal, Text } from '@/components/ui';
import { getErrorMessage } from '@/lib/utils/error';

const AGE_RANGES = [
  { label: 'ต่ำกว่า 18 ปี', value: '0-17' },
  { label: '18-24 ปี', value: '18-24' },
  { label: '25-34 ปี', value: '25-34' },
  { label: '35-44 ปี', value: '35-44' },
  { label: '45-54 ปี', value: '45-54' },
  { label: '55 ปีขึ้นไป', value: '55+' },
];

export default function AgeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // ไม่แสดง modal ในหน้า admin
    const isAdminPage = pathname?.startsWith('/admin');

    // ตรวจสอบว่าต้องถามอายุหรือไม่
    if (!isAdminPage && shouldAskAge()) {
      setIsOpen(true);
    }
  }, [pathname]);

  const handleSelectRange = async (range: string) => {
    setSelectedRange(range);
    setError('');
    setIsSubmitting(true);

    try {
      // บันทึกลง localStorage (ใช้ช่วงอายุแทนตัวเลข)
      saveAge(range);

      // บันทึกลง Firebase (ไม่รอผลลัพธ์ เพื่อให้ UX ไหลลื่น)
      saveAgeToFirebase(range).catch((error) => {
        console.error('Failed to save age to Firebase:', error);
        // ไม่แสดง error ให้ user เพราะข้อมูลถูกเก็บใน localStorage แล้ว
      });

      // รอนิดหนึ่งเพื่อให้เห็น animation
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsOpen(false);
    } catch (err) {
      setError(getErrorMessage(err, 'เกิดข้อผิดพลาด'));
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={() => {}}
      dismissible={false}
      ariaLabel="เลือกช่วงอายุ"
      size="md"
      footer={
        <Text variant="caption" tone="muted" className="w-full text-center">
          เราจะถามอีกครั้งในอีก 30 วันข้างหน้า
        </Text>
      }
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-primary text-primary-on">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <Heading level="h2" className="mb-1 text-center">ยินดีต้อนรับ!</Heading>
        <Text variant="small" tone="muted" className="text-center">
          กรุณาบอกอายุของคุณเพื่อประสบการณ์ที่ดีที่สุด
        </Text>
      </div>

      <Text className="mb-4 text-center font-semibold">เลือกช่วงอายุของคุณ</Text>

      {/* Age Range Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {AGE_RANGES.map((range) => (
          <Button
            key={range.value}
            variant={selectedRange === range.value ? 'primary' : 'outline'}
            fullWidth
            disabled={isSubmitting}
            onClick={() => handleSelectRange(range.value)}
            className="justify-center"
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      )}

      {/* Info */}
      <div className="mt-4 space-y-2">
        <Text variant="caption" tone="muted" className="text-center">
          ข้อมูลจะถูกใช้เพื่อปรับปรุงเกมให้เหมาะสมกับทุกวัย
        </Text>
        <Text variant="caption" tone="subtle" className="text-center">
          ไม่เชื่อมโยงกับตัวตน • เก็บในเครื่องของคุณ
        </Text>
      </div>
    </Modal>
  );
}
