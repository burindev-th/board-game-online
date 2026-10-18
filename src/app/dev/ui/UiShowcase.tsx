"use client";

import { useState } from "react";
import { LuHeart, LuPlus } from "react-icons/lu";
import {
  Alert, Badge, Button, Card, Heading, IconButton, Input, Modal, PageShell, PlayerChip, Select,
  Spinner, Text, Textarea, type ButtonVariant, type Tone,
} from "@/components/ui";

const variants: ButtonVariant[] = ["primary", "secondary", "outline", "ghost", "danger"];
const tones: Tone[] = ["neutral", "primary", "secondary", "success", "warning", "danger"];

export default function UiShowcase() {
  const [open, setOpen] = useState(false);
  const [lockedOpen, setLockedOpen] = useState(false);

  return (
    <PageShell width="lg">
      <div className="space-y-8">
        <section className="space-y-2">
          <Heading level="display">Display 56</Heading>
          <Heading level="h1">หัวข้อ H1</Heading>
          <Heading level="h2">หัวข้อ H2</Heading>
          <Heading level="h3">หัวข้อ H3</Heading>
          <Text>เนื้อหา body ภาษาไทยอ่านง่าย The quick brown fox.</Text>
          <Text variant="small" tone="muted">small / muted</Text>
          <Text variant="caption" tone="subtle">caption / subtle</Text>
          <Text variant="number">42</Text>
        </section>

        <section className="flex flex-wrap gap-3">
          {variants.map((v) => (
            <Button key={v} variant={v}>{v}</Button>
          ))}
          <Button size="sm" icon={<LuPlus />}>sm</Button>
          <Button size="lg">lg</Button>
          <Button loading>loading</Button>
          <Button disabled>disabled</Button>
          <Button href="/" variant="outline">link</Button>
          <IconButton icon={<LuHeart />} label="ชอบ" />
          <Spinner />
        </section>

        <section className="flex flex-wrap gap-2">
          {tones.map((t) => (
            <Badge key={t} tone={t}>{t}</Badge>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>default card</Card>
          <Card variant="muted">muted card</Card>
          <Card variant="primary" interactive>primary interactive</Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Input label="ชื่อผู้เล่น" placeholder="พิมพ์ชื่อ" hint="ไม่เกิน 20 ตัวอักษร" />
          <Input label="รหัสห้อง" defaultValue="12" error="รหัสต้องมี 6 หลัก" />
          <Select label="จำนวนผู้เล่น" defaultValue="4">
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} คน</option>
            ))}
          </Select>
          <Textarea label="ข้อความ" placeholder="เขียนอะไรก็ได้" />
        </section>

        <section className="space-y-3">
          <Alert tone="info" title="วิธีเล่น">สร้างห้องหรือใส่รหัสห้อง 6 หลัก</Alert>
          <Alert tone="success">สำเร็จ</Alert>
          <Alert tone="warning">ระวัง</Alert>
          <Alert tone="danger" title="ผิดพลาด">ไม่พบห้องนี้</Alert>
        </section>

        <section className="grid gap-2 md:grid-cols-2">
          {["สมชาย", "Alice", "บี", "Dan", "เอ", "Fon", "Gus", "หนึ่ง", "Nine"].map((name, i) => (
            <PlayerChip
              key={name}
              name={name}
              colorIndex={i}
              isHost={i === 0}
              status={i % 2 ? <Badge tone="success">พร้อม</Badge> : undefined}
            />
          ))}
        </section>

        <section className="flex gap-3">
          <Button onClick={() => setOpen(true)}>เปิด Modal</Button>
          <Button variant="outline" onClick={() => setLockedOpen(true)}>Modal ปิดไม่ได้</Button>
        </section>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="ตัวอย่าง Modal"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={() => setOpen(false)}>ตกลง</Button>
          </>
        }
      >
        <Input label="ลองพิมพ์" />
      </Modal>
      <Modal open={lockedOpen} onClose={() => setLockedOpen(false)} dismissible={false} title="ต้องเลือกก่อน">
        <Button fullWidth onClick={() => setLockedOpen(false)}>เลือกแล้ว</Button>
      </Modal>
    </PageShell>
  );
}
