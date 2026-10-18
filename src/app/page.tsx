"use client";

import { useState } from "react";
import Link from "next/link";
import { FaArrowRight, FaComments, FaDiceFive, FaGamepad, FaPeopleGroup, FaPlus, FaStar } from "react-icons/fa6";
import FeedbackModal from "@/components/FeedbackModal";
import { Button, buttonClasses } from "@/components/ui";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils/cn";
import styles from "./home.module.css";

const steps = [
  { number: "01", title: "เปิดโต๊ะ", detail: "สร้างห้อง แล้วเลือกเกมที่อยากเล่น", icon: FaPlus },
  { number: "02", title: "ชวนแก๊ง", detail: "แชร์รหัสห้องให้เพื่อนเข้ามารวมตัว", icon: FaPeopleGroup },
  { number: "03", title: "เริ่มสนุก", detail: "พร้อมแล้วก็เริ่มเกมไปด้วยกัน", icon: FaGamepad },
];

export default function Home() {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="บอร์ดเกม หน้าแรก">
          <span className={styles.brandIcon}><FaGamepad aria-hidden /></span>
          บอร์ดเกม<span className={styles.brandTag}>PLAY TOGETHER</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.copy}>
            <span className={styles.eyebrow}><span /> GOOD TIMES, GREAT COMPANY</span>
            <h1 id="home-title" className={styles.title}>รวมแก๊ง<br />แล้ว<span className={styles.highlight}>เริ่มเกม!</span></h1>
            <p className={styles.description}>เปลี่ยนเวลาว่างให้เป็นเวลาของเพื่อน<br className="hidden md:block" /> เล่นบอร์ดเกมออนไลน์ หัวเราะไปด้วยกันได้ทุกที่</p>
            <div className={styles.actions}>
              <Link href="/create-room" className={cn(buttonClasses({ size: "lg" }), styles.action)}><FaPlus aria-hidden />สร้างห้องเกม<FaArrowRight className={styles.arrow} aria-hidden /></Link>
              <Link href="/join-room" className={cn(buttonClasses({ variant: "outline", size: "lg" }), styles.action)}><FaPeopleGroup aria-hidden />เข้าร่วมห้อง</Link>
            </div>
            <p className={styles.hint}><span className={styles.tinyDice}><FaDiceFive aria-hidden /></span> คนละจอ แต่ความสนุกโต๊ะเดียวกัน</p>
          </div>

          <div className={styles.tableScene} aria-hidden="true">
            <div className={styles.tableRing} />
            <span className={styles.sceneLabel}>YOUR NEXT GAME NIGHT</span>
            <div className={styles.cardBack}><span>LET’S</span><FaGamepad /><span>PLAY!</span></div>
            <div className={styles.cardFront}>
              <div className={styles.cardTop}><span>PARTY TIME</span><FaStar /></div>
              <div className={styles.cardArt}><FaPeopleGroup /><span className={styles.spark}>+</span></div>
              <strong>ยิ่งเล่นด้วยกัน<br />ยิ่งสนุก</strong>
              <div className={styles.cardBottom}><span>FRIENDS MAKE IT BETTER</span><FaStar /></div>
            </div>
            <div className={styles.dice}><FaDiceFive /></div>
            <div className={styles.chip}><FaStar /></div>
            <span className={styles.note}>ตานี้… ตาใคร?</span>
            <span className={styles.starOne}><FaStar /></span>
            <span className={styles.starTwo}><FaStar /></span>
          </div>
        </section>

        <section className={styles.howTo} aria-labelledby="how-to-title">
          <div className={styles.sectionIntro}><span className={styles.overline}>READY, SET, PLAY</span><h2 id="how-to-title">ความสนุกเริ่มง่าย ๆ</h2><p>แค่ 3 สเต็ป ก็พร้อมเปิดโต๊ะ</p></div>
          <ol className={styles.steps}>{steps.map(({ number, title, detail, icon: Icon }) => <li key={number} className={styles.step}><div className={styles.stepTop}><span className={styles.stepNumber}>{number}</span><Icon aria-hidden /></div><h3>{title}</h3><p>{detail}</p></li>)}</ol>
        </section>
      </main>
      <footer className={styles.footer}><span>เวลาของเพื่อน เริ่มที่โต๊ะนี้</span><Button variant="ghost" size="sm" icon={<FaComments aria-hidden />} onClick={() => setShowFeedbackModal(true)}>แจ้งปัญหา / เพิ่มโจทย์</Button></footer>
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </div>
  );
}
