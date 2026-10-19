'use client';

import { useState, useEffect } from 'react';
import { FaBug, FaLightbulb, FaChevronLeft, FaCheckCircle } from 'react-icons/fa';
import { Alert, Badge, Button, buttonClasses, Heading, Input, Modal, Select, Spinner, Text, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { useGames } from '@/lib/hooks/useGames';
import { submitFeedback, submitItoQuestion, checkDuplicateItoQuestion } from '@/lib/firebase/feedback';
import type { FeedbackType } from '@/types/feedback';
import { ITO_GAME_ID } from '@/constants/ito';
import { getErrorMessage } from '@/lib/utils/error';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'select-type' | 'fill-form';

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { games, loading: gamesLoading } = useGames();
  const [step, setStep] = useState<Step>('select-type');
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form fields for issue report
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  // Form fields for Ito question
  const [questionsTH, setQuestionsTH] = useState('');
  const [userName, setUserName] = useState('');

  // Duplicate check
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [similarQuestion, setSimilarQuestion] = useState<string>('');
  const [similarity, setSimilarity] = useState<number>(0);

  const resetForm = () => {
    setStep('select-type');
    setFeedbackType(null);
    setSelectedGameId('');
    setSubject('');
    setDescription('');
    setQuestionsTH('');
    setUserName('');
    setIsDuplicate(false);
    setIsChecking(false);
    setSimilarQuestion('');
    setSimilarity(0);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectType = (type: FeedbackType) => {
    setFeedbackType(type);
    setStep('fill-form');
  };

  const handleBack = () => {
    if (step === 'fill-form') {
      setStep('select-type');
      setSelectedGameId('');
      setSubject('');
      setDescription('');
      setQuestionsTH('');
      setUserName('');
      setIsDuplicate(false);
      setIsChecking(false);
      setSimilarQuestion('');
      setSimilarity(0);
    }
  };

  // Check for duplicate question when typing
  useEffect(() => {
    if (feedbackType === 'improvement' && selectedGameId === ITO_GAME_ID && questionsTH.trim().length > 5) {
      const timeoutId = setTimeout(async () => {
        setIsChecking(true);
        const result = await checkDuplicateItoQuestion(questionsTH);
        setIsDuplicate(result.isDuplicate);
        setSimilarQuestion(result.similarQuestion || '');
        setSimilarity(result.similarity || 0);
        setIsChecking(false);
      }, 500); // Debounce 500ms

      return () => clearTimeout(timeoutId);
    } else {
      setIsDuplicate(false);
      setIsChecking(false);
      setSimilarQuestion('');
      setSimilarity(0);
    }
  }, [questionsTH, feedbackType, selectedGameId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackType || !selectedGameId) return;

    setSubmitting(true);

    try {
      const selectedGame = games.find(g => g.id === selectedGameId);
      if (!selectedGame) throw new Error('Game not found');

      if (feedbackType === 'issue') {
        // Submit feedback
        await submitFeedback({
          type: feedbackType,
          gameId: selectedGameId,
          gameName: selectedGame.name,
          subject,
          description,
        });
      } else {
        // Submit Ito question
        if (selectedGameId === ITO_GAME_ID) {
          if (isDuplicate) {
            throw new Error('คำถามนี้มีอยู่ในระบบแล้ว');
          }
          await submitItoQuestion(questionsTH, userName);
        } else {
          throw new Error('ขณะนี้รองรับเฉพาะเกม Ito เท่านั้น');
        }
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting:', error);
      alert(getErrorMessage(error, 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setSubmitting(false);
    }
  };

  const isFormStep = step === 'fill-form' && !success;

  const title =
    step === 'select-type' ? 'ช่วยเราปรับปรุง' : feedbackType === 'issue' ? 'แจ้งปัญหา' : 'ช่วยปรับปรุงเกม';

  const footer = isFormStep ? (
    <>
      <Button variant="outline" icon={<FaChevronLeft />} onClick={handleBack}>
        กลับ
      </Button>
      <Button
        type="submit"
        form="feedback-form"
        loading={submitting}
        disabled={
          (feedbackType === 'improvement' && selectedGameId !== ITO_GAME_ID) ||
          (feedbackType === 'improvement' && isDuplicate) ||
          isChecking
        }
      >
        {submitting ? 'กำลังส่ง...' : isChecking ? 'กำลังตรวจสอบ...' : 'ส่งข้อมูล'}
      </Button>
    </>
  ) : undefined;

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={title}
      size={isFormStep ? "lg" : "sm"}
      footer={footer}
      closeOnBackdrop={!isFormStep}
      closeOnEsc={!isFormStep}
    >
      {success ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-success text-on-status">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <Heading level="h2" as="h3" className="mb-2">ส่งข้อมูลเรียบร้อย!</Heading>
          <Text tone="muted">ขอบคุณที่ช่วยเราปรับปรุงระบบ</Text>
        </div>
      ) : step === 'select-type' ? (
        // Step 1: Select Type
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSelectType('issue')}
            className={cn(
              buttonClasses({ variant: 'danger', fullWidth: true }),
              'h-auto justify-start gap-3 px-4 py-3 text-left',
            )}
          >
            <FaBug className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className="flex flex-col">
              <span>แจ้งปัญหา</span>
              <span className="whitespace-normal text-caption font-normal">พบบั๊กหรือข้อผิดพลาดในระบบ</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectType('improvement')}
            className={cn(
              buttonClasses({ variant: 'secondary', fullWidth: true }),
              'h-auto justify-start gap-3 px-4 py-3 text-left',
            )}
          >
            <FaLightbulb className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className="flex flex-col">
              <span>ช่วยปรับปรุงเกม</span>
              <span className="whitespace-normal text-caption font-normal">เพิ่มโจทย์หรือเนื้อหาในเกม</span>
            </span>
          </button>
        </div>
      ) : (
        // Step 2: Fill Form
        <form id="feedback-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Select Game */}
          {gamesLoading ? (
            <div>
              <Text variant="small" className="mb-2 font-semibold">เลือกเกม *</Text>
              <Text tone="muted">กำลังโหลดรายการเกม...</Text>
            </div>
          ) : (
            <Select
              label="เลือกเกม *"
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              required
            >
              <option value="">-- เลือกเกม --</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </Select>
          )}

          {feedbackType === 'issue' ? (
            // Issue Report Form
            <>
              <Input
                type="text"
                label="หัวข้อ *"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="เช่น ปุ่มกดไม่ได้, หน้าจอค้าง"
              />

              <Textarea
                label="รายละเอียด *"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                placeholder="อธิบายปัญหาที่พบให้ละเอียด..."
              />
            </>
          ) : (
            // Improvement Form (Ito Question)
            <>
              {/* Show form fields based on selected game */}
              {selectedGameId === ITO_GAME_ID ? (
                // Ito game form
                <>
                  <Input
                    type="text"
                    label="ชื่อของคุณ *"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    placeholder="ชื่อหรือชื่อเล่น"
                  />

                  <div>
                    <Textarea
                      label="คำถามโจทย์ *"
                      value={questionsTH}
                      onChange={(e) => setQuestionsTH(e.target.value)}
                      required
                      rows={3}
                      placeholder="เช่น ความสูงของต้นไม้ที่คุณชอบ, ความร้อนของกาแฟที่เหมาะสม"
                      aria-invalid={isDuplicate || undefined}
                      className={isDuplicate ? 'border-danger' : undefined}
                    />

                    {/* Duplicate Check Result */}
                    {questionsTH.trim().length > 5 && (
                      <div className="mt-2">
                        {isChecking ? (
                          <Text variant="small" tone="muted" as="p" className="flex items-center gap-2">
                            <Spinner size="sm" />
                            กำลังตรวจสอบ...
                          </Text>
                        ) : isDuplicate ? (
                          <Alert tone="danger" title={`พบคำถามที่คล้ายกัน ${similarity}%`}>
                            <p>&quot;{similarQuestion}&quot;</p>
                            <p className="mt-1 text-caption">กรุณาเปลี่ยนคำถามให้แตกต่างมากขึ้น</p>
                          </Alert>
                        ) : (
                          <Badge tone="success">
                            <FaCheckCircle aria-hidden="true" />
                            คำถามนี้ยังไม่มีในระบบ
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : selectedGameId ? (
                // Other games - not supported yet
                <Alert tone="warning">
                  ขณะนี้รองรับการเพิ่มโจทย์เฉพาะเกม <strong>Ito</strong> เท่านั้น
                </Alert>
              ) : null}
            </>
          )}
        </form>
      )}
    </Modal>
  );
}
