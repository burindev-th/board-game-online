import type { ReactNode } from "react";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight, FaDiceFive, FaGamepad, FaPeopleGroup, FaPlus, FaStar } from "react-icons/fa6";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Heading, Text } from "@/components/ui";
import styles from "./RoomEntryLayout.module.css";

type RoomEntryMode = "create" | "join";

const COPY = {
  create: {
    icon: FaPlus,
    title: "สร้างห้องเกม",
    subtitle: "ตั้งชื่อ เลือกเกม แล้วเตรียมรับเพื่อนเข้าห้อง",
    introLabel: "เตรียมเปิดโต๊ะเกม",
    eyebrow: "HOST THE GOOD TIMES",
    headline: ["เปิดโต๊ะใหม่", "ชวนแก๊งมาเล่น"],
    description: "เลือกเกมที่ชอบ ตั้งโต๊ะให้พร้อม แล้วส่งรหัสชวนเพื่อนมาสนุกด้วยกัน",
    ticketTop: "GAME NIGHT",
    ticketTitle: "โต๊ะของคุณ",
    ticketCaption: "ความสนุกกำลังจะเริ่ม",
    ticketBottom: "CREATE • INVITE • PLAY",
    firstStep: "ตั้งค่าห้อง",
    formLabel: "ฟอร์มสร้างห้องเกม",
    panelHeading: "NEW TABLE",
    switchPrompt: "เพื่อนเปิดห้องไว้แล้ว?",
    switchLabel: "เข้าร่วมห้อง",
    switchHref: "/join-room",
  },
  join: {
    icon: FaPeopleGroup,
    title: "เข้าร่วมห้อง",
    subtitle: "อีกนิดเดียว ก็ได้สนุกกับเพื่อนแล้ว",
    introLabel: "เตรียมเข้าร่วมเกม",
    eyebrow: "TAKE YOUR SEAT",
    headline: ["เพื่อนรออยู่", "มาเล่นด้วยกัน!"],
    description: "มีรหัสจากเพื่อนแล้วใช่ไหม? ใส่รหัสห้องและชื่อที่เพื่อนจำได้ แล้วไปเจอกันที่โต๊ะ",
    ticketTop: "YOU’RE INVITED",
    ticketTitle: "ที่นั่งของคุณ",
    ticketCaption: "พร้อมแล้ว ไปเจอเพื่อนกัน",
    ticketBottom: "JOIN • CONNECT • PLAY",
    firstStep: "ใส่รหัสห้อง",
    formLabel: "ฟอร์มเข้าร่วมห้อง",
    panelHeading: "JOIN THE PARTY",
    switchPrompt: "ยังไม่มีรหัสห้อง?",
    switchLabel: "สร้างห้องเอง",
    switchHref: "/create-room",
  },
} satisfies Record<RoomEntryMode, unknown>;

interface RoomEntryLayoutProps {
  mode: RoomEntryMode;
  children: ReactNode;
}

export default function RoomEntryLayout({ mode, children }: RoomEntryLayoutProps) {
  const copy = COPY[mode];
  const Icon = copy.icon;

  return (
    <div className={styles.page} data-mode={mode}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}><FaArrowLeft aria-hidden />กลับหน้าหลัก</Link>
        <Link href="/" className={styles.brand}><FaGamepad aria-hidden />บอร์ดเกม</Link>
        <ThemeToggle />
      </header>
      <main className={styles.main}>
        <section className={styles.intro} aria-label={copy.introLabel}>
          <span className={styles.eyebrow}>{copy.eyebrow}</span>
          <h2 className={styles.headline}>{copy.headline[0]}<br /><span>{copy.headline[1]}</span></h2>
          <p className={styles.description}>{copy.description}</p>
          <div className={styles.scene} aria-hidden="true">
            <div className={styles.orbit} />
            <div className={styles.backCard}><FaGamepad /><span>LET’S PLAY</span></div>
            <div className={styles.ticket}>
              <div className={styles.ticketTop}><span>{copy.ticketTop}</span><FaStar /></div>
              <Icon className={styles.ticketIcon} />
              <strong>{copy.ticketTitle}</strong>
              <span className={styles.ticketCaption}>{copy.ticketCaption}</span>
              <div className={styles.ticketBottom}>{copy.ticketBottom}</div>
            </div>
            <div className={styles.dice}><FaDiceFive /></div>
            <span className={styles.spark}><FaStar /></span>
          </div>
          <ol className={styles.journey} aria-label="ขั้นตอนเริ่มเล่น">
            <li aria-current="step"><span>01</span>{copy.firstStep}</li>
            <li><span>02</span>เจอกันในห้อง</li>
            <li><span>03</span>เริ่มเกม!</li>
          </ol>
        </section>
        <section className={styles.formPanel} aria-label={copy.formLabel}>
          <div className={styles.panelHeading}><span><Icon aria-hidden />{copy.panelHeading}</span><span>01 / 03</span></div>
          <div className={styles.formBody}>
            <div className="mb-6">
              <Heading level="h1" className="mb-2">{copy.title}</Heading>
              <Text tone="muted">{copy.subtitle}</Text>
            </div>
            {children}
          </div>
          <div className={styles.switchMode}>
            <span>{copy.switchPrompt}</span>
            <Link href={copy.switchHref}>{copy.switchLabel}<FaArrowRight aria-hidden /></Link>
          </div>
        </section>
      </main>
      <footer className={styles.footer}><FaGamepad aria-hidden />คนละจอ แต่ความสนุกโต๊ะเดียวกัน</footer>
    </div>
  );
}
