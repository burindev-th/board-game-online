'use client';

import { LuClipboardList, LuTarget, LuLightbulb, LuTriangleAlert, LuGamepad2, LuSparkles } from 'react-icons/lu';
import { Badge, Button, Card, Heading, Modal } from '@/components/ui';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
}

const SYSTEM_STEPS = [
  'ระบบจะสุ่มโจทย์ให้แต่ละด่าน',
  'ผู้เล่นแต่ละคนจะได้รับตัวเลขแบบสุ่ม (1-100)',
  'พิมพ์คำตอบของคุณในช่องที่กำหนด',
  'เมื่อทุกคนส่งคำตอบแล้ว กดปุ่ม "เรียงลำดับ" เพื่อจัดเรียง',
  'ระบบจะตรวจสอบความถูกต้อง และเปิดเผยตัวเลขจริง',
];

export default function RulesModal({ isOpen, onClose, gameName }: RulesModalProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`กติกาการเล่น ${gameName}`}
      size="lg"
      footer={
        <Button fullWidth onClick={onClose}>
          เข้าใจแล้ว เริ่มเล่นเลย!
        </Button>
      }
    >
      <div className="space-y-4 text-fg">
        <Card variant="muted" padding="sm">
          <Heading level="h3" className="mb-2 flex items-center gap-2"><LuClipboardList className="h-5 w-5" aria-hidden />วิธีเล่น</Heading>
          <ul className="list-inside list-disc space-y-2 text-small md:text-body">
            <li>ผู้เล่นแต่ละคนจะได้รับตัวเลขระหว่าง <strong>1-100</strong></li>
            <li>ผู้เล่นจะต้องเรียงตัวเลขจาก <strong>น้อยไปมาก</strong> โดยไม่บอกตัวเลขโดยตรง</li>
            <li>ใช้การสื่อสารผ่านคำบรรยายเพื่อเดาว่าตัวเลขของใครใหญ่หรือเล็กกว่ากัน</li>
          </ul>
        </Card>

        <Card variant="muted" padding="sm">
          <Heading level="h3" className="mb-2 flex items-center gap-2"><LuTarget className="h-5 w-5" aria-hidden />เป้าหมาย</Heading>
          <p className="text-small md:text-body">
            ผู้เล่นทุกคนต้องร่วมมือกันเพื่อเรียงลำดับให้ถูกต้อง <strong>ตามจำนวนด่านที่กำหนด</strong>
            เพื่อชนะเกม หากเรียงผิดเกินจำนวนครั้งที่กำหนด ผู้เล่นจะแพ้
          </p>
        </Card>

        <Card variant="muted" padding="sm">
          <Heading level="h3" className="mb-2 flex items-center gap-2"><LuLightbulb className="h-5 w-5" aria-hidden />ตัวอย่างการสื่อสาร</Heading>
          <div className="space-y-2 text-small md:text-body">
            <p><strong>โจทย์:</strong> &quot;ความสูงของต้นไม้ที่คุณชอบ&quot;</p>
            <ul className="ml-4 list-inside list-disc space-y-1">
              <li>ตัวเลข 10: &quot;ต้นไม้บอนไซขนาดเล็ก&quot;</li>
              <li>ตัวเลข 50: &quot;ต้นไม้ในสวนบ้านทั่วไป&quot;</li>
              <li>ตัวเลข 90: &quot;ต้นไม้ยักษ์ในป่า&quot;</li>
            </ul>
          </div>
        </Card>

        <Card variant="muted" padding="sm">
          <Heading level="h3" className="mb-2 flex items-center gap-2"><LuTriangleAlert className="h-5 w-5" aria-hidden />กฎสำคัญ</Heading>
          <ul className="list-inside list-disc space-y-2 text-small md:text-body">
            <li><Badge tone="danger">ห้าม</Badge> บอกตัวเลขโดยตรง เช่น &quot;50&quot;</li>
            <li><Badge tone="danger">ห้าม</Badge> ใช้คำที่มีตัวเลข เช่น &quot;ห้าสิบ&quot;</li>
            <li><Badge tone="success">แนะนำ</Badge> ให้ใช้การเปรียบเทียบและคำบรรยาย</li>
            <li><Badge tone="success">แนะนำ</Badge> ให้สื่อสารและถามคำถามซึ่งกันและกัน</li>
          </ul>
        </Card>

        <Card variant="muted" padding="sm">
          <Heading level="h3" className="mb-2 flex items-center gap-2"><LuGamepad2 className="h-5 w-5" aria-hidden />การเล่นในระบบนี้</Heading>
          <ol className="space-y-2 text-small md:text-body">
            {SYSTEM_STEPS.map((step, index) => (
              <li key={step} className="flex items-start gap-2">
                <Badge tone="primary" className="shrink-0">{index + 1}</Badge>
                <span>{step}</span>
              </li>
            ))}
            <li className="flex items-start gap-2">
              <Badge tone="primary" className="shrink-0">6</Badge>
              <span>หากเรียงถูกครบตามจำนวนด่านที่กำหนด = <Badge tone="success">ชนะ!</Badge></span>
            </li>
            <li className="flex items-start gap-2">
              <Badge tone="primary" className="shrink-0">7</Badge>
              <span>หากเรียงผิดเกินจำนวนครั้งที่กำหนด = <Badge tone="danger">แพ้!</Badge></span>
            </li>
          </ol>
        </Card>

        <Card variant="primary" padding="sm">
          <Heading level="h3" className="mb-2 text-primary-on flex items-center gap-2"><LuSparkles className="h-5 w-5" aria-hidden />เคล็ดลับการเล่นให้สนุก</Heading>
          <ul className="list-inside list-disc space-y-2 text-small md:text-body">
            <li>ใช้จินตนาการและความคิดสร้างสรรค์ในการบรรยาย</li>
            <li>ถามคำถามซึ่งกันและกันเพื่อเปรียบเทียบ</li>
            <li>อย่าเพิ่งเรียงลำดับก่อนที่ทุกคนจะส่งคำตอบ</li>
            <li>ใช้เวลาพูดคุยและวางแผนร่วมกัน</li>
            <li><strong>สนุกสนานและสร้างสรรค์!</strong> นี่คือเกมสังคมที่ต้องการความร่วมมือ</li>
          </ul>
        </Card>
      </div>
    </Modal>
  );
}
