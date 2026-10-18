import type { ReactNode } from "react";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight, FaDiceFive, FaGamepad, FaPeopleGroup, FaPlus, FaStar } from "react-icons/fa6";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import styles from "./RoomEntryLayout.module.css";

interface RoomEntryLayoutProps {
  mode: "create" | "join";
  children: ReactNode;
}

export default function RoomEntryLayout({ mode, children }: RoomEntryLayoutProps) {
  const creating = mode === "create";
  const Icon = creating ? FaPlus : FaPeopleGroup;

  return (
    <div className={styles.page} data-mode={mode}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}><FaArrowLeft aria-hidden />กลับหน้าหลัก</Link>
        <Link href="/" className={styles.brand}><FaGamepad aria-hidden />บอร์ดเกม</Link>
        <ThemeToggle />
      </header>
      <main className={styles.main}>
        <section className={styles.intro} aria-label={creating ? "เตรียมเปิดโต๊ะเกม" : "เตรียมเข้าร่วมเกม"}>
          <span className={styles.eyebrow}>{creating ? "HOST THE GOOD TIMES" : "TAKE YOUR SEAT"}</span>
          <h2 className={styles.headline}>{creating ? "เปิดโต๊ะใหม่" : "เพื่อนรออยู่"}<br /><span>{creating ? "ชวนแก๊งมาเล่น" : "มาเล่นด้วยกัน!"}</span></h2>
          <p className={styles.description}>{creating ? "เลือกเกมที่ชอบ ตั้งโต๊ะให้พร้อม แล้วส่งรหัสชวนเพื่อนมาสนุกด้วยกัน" : "มีรหัสจากเพื่อนแล้วใช่ไหม? ใส่รหัสห้องและชื่อที่เพื่อนจำได้ แล้วไปเจอกันที่โต๊ะ"}</p>
          <div className={styles.scene} aria-hidden="true">
            <div className={styles.orbit} />
            <div className={styles.backCard}><FaGamepad /><span>LET’S PLAY</span></div>
            <div className={styles.ticket}>
              <div className={styles.ticketTop}><span>{creating ? "GAME NIGHT" : "YOU’RE INVITED"}</span><FaStar /></div>
              <Icon className={styles.ticketIcon} />
              <strong>{creating ? "โต๊ะของคุณ" : "ที่นั่งของคุณ"}</strong>
              <span className={styles.ticketCaption}>{creating ? "ความสนุกกำลังจะเริ่ม" : "พร้อมแล้ว ไปเจอเพื่อนกัน"}</span>
              <div className={styles.ticketBottom}>{creating ? "CREATE • INVITE • PLAY" : "JOIN • CONNECT • PLAY"}</div>
            </div>
            <div className={styles.dice}><FaDiceFive /></div>
            <span className={styles.spark}><FaStar /></span>
          </div>
          <ol className={styles.journey} aria-label="ขั้นตอนเริ่มเล่น">
            <li aria-current="step"><span>01</span>{creating ? "ตั้งค่าห้อง" : "ใส่รหัสห้อง"}</li>
            <li><span>02</span>เจอกันในห้อง</li>
            <li><span>03</span>เริ่มเกม!</li>
          </ol>
        </section>
        <section className={styles.formPanel} aria-label={creating ? "ฟอร์มสร้างห้องเกม" : "ฟอร์มเข้าร่วมห้อง"}>
          <div className={styles.panelHeading}><span><Icon aria-hidden />{creating ? "NEW TABLE" : "JOIN THE PARTY"}</span><span>01 / 03</span></div>
          <div className={styles.formBody}>{children}</div>
          <div className={styles.switchMode}>
            <span>{creating ? "เพื่อนเปิดห้องไว้แล้ว?" : "ยังไม่มีรหัสห้อง?"}</span>
            <Link href={creating ? "/join-room" : "/create-room"}>{creating ? "เข้าร่วมห้อง" : "สร้างห้องเอง"}<FaArrowRight aria-hidden /></Link>
          </div>
        </section>
      </main>
      <footer className={styles.footer}><FaGamepad aria-hidden />คนละจอ แต่ความสนุกโต๊ะเดียวกัน</footer>
    </div>
  );
}
