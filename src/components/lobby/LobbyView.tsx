"use client";

import { FaArrowRight, FaCheck, FaClock, FaCrown, FaGamepad, FaPeopleGroup, FaPlus } from "react-icons/fa6";
import { LuCheck, LuCopy, LuPencil, LuX } from "react-icons/lu";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Game, Player, Room } from "@/types";
import { Alert, Badge, Button, Heading, IconButton, Input, PageShell } from "@/components/ui";
import { getPlayerColor } from "@/lib/theme/playerColors";
import styles from "./LobbyView.module.css";

interface LobbyViewProps {
  room: Room;
  players: Player[];
  selectedGame?: Game;
  playerId: string | null;
  isHost: boolean;
  canStartGame: boolean;
  minPlayers: number;
  copied: boolean;
  busy: boolean;
  error: string | null;
  settings: {
    editing: boolean;
    value: number;
    onEdit: () => void;
    onChange: (value: number) => void;
    onCancel: () => void;
    onSave: () => void;
  };
  onCopy: () => void;
  onLeave: () => void;
  onStart: () => void;
  onReady: () => void;
  onKick: (id: string, name: string) => void;
}

export default function LobbyView({ room, players, selectedGame, playerId, isHost, canStartGame, minPlayers, copied, busy, error, settings, onCopy, onLeave, onStart, onReady, onKick }: LobbyViewProps) {
  const reduceMotion = useReducedMotion();
  const currentPlayer = players.find(player => player.id === playerId);
  const readyCount = players.filter(player => player.isHost || player.isReady).length;
  const openSeats = Math.max(0, room.maxPlayers - players.length);
  const waitingMessage = room.currentPlayers < minPlayers
    ? `ชวนเพื่อนเพิ่มอีก ${minPlayers - room.currentPlayers} คน ก็ครบขั้นต่ำแล้ว`
    : !canStartGame
      ? "รอเพื่อนทุกคนกดพร้อม แล้วเริ่มสนุกได้เลย"
      : isHost ? "ทุกคนพร้อมแล้ว เริ่มความสนุกได้เลย!" : "ทุกคนพร้อมแล้ว รอหัวห้องเริ่มเกม";

  return (
    <PageShell width="lg" brandLink={false} className={styles.page} actions={
      <Button variant="outline" size="sm" onClick={onLeave} disabled={busy}>ออกจากห้อง</Button>
    }>
      <div className={styles.breadcrumb}><span>01 เข้าห้อง</span><span aria-hidden>—</span><strong>02 รวมแก๊ง</strong><span aria-hidden>—</span><span>03 เริ่มเกม</span></div>
      <section className={styles.hero} aria-labelledby="lobby-title">
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}><span /> THE GANG’S GETTING TOGETHER</span>
          <h1 id="lobby-title">โต๊ะนี้<span>รอเพื่อนอยู่</span></h1>
          <p>แชร์รหัส ชวนเพื่อนเข้ามา แล้วเตรียมสนุกไปด้วยกัน</p>
          <span className={styles.gameTag}><FaGamepad aria-hidden />{selectedGame?.name || room.gameType || "เกม"}</span>
        </div>
        <div className={styles.invite}>
          <div className={styles.ticketLabel}><FaPeopleGroup aria-hidden /><span>รหัสชวนเพื่อน</span><span className={styles.ticketMark}>ROOM PASS</span></div>
          <span className={styles.code}>{room.code.slice(0, 3)}<span>-</span>{room.code.slice(3)}</span>
          <Button variant="outline" size="sm" fullWidth onClick={onCopy} icon={copied ? <LuCheck aria-hidden /> : <LuCopy aria-hidden />}>
            {copied ? "คัดลอกแล้ว! ส่งให้เพื่อนได้เลย" : "คัดลอกรหัสห้อง"}
          </Button>
          <span className={styles.copyStatus} role="status">{copied ? "คัดลอกรหัสห้องแล้ว" : "ส่งรหัสนี้ให้เพื่อนกรอกที่หน้าเข้าร่วมห้อง"}</span>
        </div>
      </section>

      {error && <Alert tone="danger" className="mb-6">{error}</Alert>}

      <div className={styles.content}>
        <section className={styles.playersPanel} aria-labelledby="players-title">
          <div className={styles.panelHeader}>
            <div><span className={styles.eyebrow}>AROUND THE TABLE</span><Heading level="h2" id="players-title">แก๊งของเรา</Heading></div>
            <div className={styles.capacity}>
              <Badge>{room.currentPlayers}/{room.maxPlayers} คน</Badge>
              {isHost && !settings.editing && <IconButton variant="ghost" size="sm" onClick={settings.onEdit} disabled={busy} label="แก้ไขจำนวนผู้เล่น" icon={<LuPencil aria-hidden />} />}
            </div>
          </div>
          {isHost && settings.editing && <div className={styles.settings}>
            <Input type="number" label="จำนวนผู้เล่นสูงสุด" min={room.currentPlayers} max={selectedGame?.maxPlayer || 10} value={Number.isFinite(settings.value) ? settings.value : ""} onChange={e => settings.onChange(parseInt(e.target.value))} disabled={busy} className="w-24" />
            <IconButton variant="primary" size="sm" onClick={settings.onSave} disabled={busy || !Number.isFinite(settings.value) || settings.value < room.currentPlayers || settings.value > (selectedGame?.maxPlayer || 10)} label="บันทึก" icon={<LuCheck aria-hidden />} />
            <IconButton variant="outline" size="sm" onClick={settings.onCancel} disabled={busy} label="ยกเลิก" icon={<LuX aria-hidden />} />
          </div>}
          <p className={styles.panelHint}>เช็กชื่อและสถานะความพร้อมก่อนเริ่มเกม</p>
          <ul className={styles.playerList} aria-label="รายชื่อผู้เล่น">
            <AnimatePresence initial={false}>
              {players.map((player, index) => <motion.li
                key={player.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: 12, scale: .98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: .97 }}
                transition={{ duration: reduceMotion ? 0 : .2 }}
                className={styles.player}
                data-self={player.id === playerId || undefined}
              >
                <span className={styles.avatar} style={{ backgroundColor: getPlayerColor(index) }} aria-hidden>{player.name.trim().charAt(0).toUpperCase() || "?"}</span>
                <div className={styles.playerInfo}>
                  <div className={styles.name}><span title={player.name}>{player.name}</span>{player.id === playerId && <span className={styles.you}>คุณ</span>}</div>
                  <span className={styles.presence}><span data-online={player.isOnline} />{player.isOnline ? "ออนไลน์" : "ออฟไลน์"}</span>
                </div>
                <div className={styles.playerStatus}>
                  {player.isHost ? <Badge tone="primary"><FaCrown aria-hidden />หัวห้อง</Badge> : player.isReady ? <Badge tone="success"><FaCheck aria-hidden />พร้อม</Badge> : <span className={styles.waiting}><FaClock aria-hidden />ยังไม่พร้อม</span>}
                  {isHost && !player.isHost && <IconButton variant="ghost" size="sm" onClick={() => onKick(player.id, player.name)} disabled={busy} label={`นำ ${player.name} ออกจากห้อง`} icon={<LuX aria-hidden />} />}
                </div>
              </motion.li>)}
            </AnimatePresence>
          </ul>
          {openSeats > 0 && <div className={styles.emptySeat}><span><FaPlus aria-hidden /></span><div><strong>ยังมีที่ว่างอีก {openSeats} ที่</strong><p>ส่งรหัสห้อง ชวนเพื่อนมานั่งด้วยกัน</p></div></div>}
        </section>

        <aside className={styles.readyPanel} aria-labelledby="ready-title">
          <span className={styles.readyIcon}><FaGamepad aria-hidden /></span>
          <span className={styles.eyebrow}>READY WHEN YOU ARE</span>
          <Heading level="h2" id="ready-title">{canStartGame ? "พร้อมลุยแล้ว!" : "เช็กความพร้อม"}</Heading>
          <div className={styles.readyCount}><strong>{readyCount}</strong><span>/ {players.length} คนพร้อม</span></div>
          <progress className={styles.progress} value={readyCount} max={Math.max(1, players.length)} aria-label="จำนวนผู้เล่นที่พร้อม" />
          <p className={styles.waitingMessage} role="status">{waitingMessage}</p>
          <dl className={styles.details}>
            <div><dt>ผู้เล่นขั้นต่ำ</dt><dd>{minPlayers} คน</dd></div>
            {room.timeLimit != null && <div><dt>เวลาเล่น</dt><dd>{room.timeLimit} นาที</dd></div>}
            <div><dt>หน้าที่ของคุณ</dt><dd>{isHost ? "หัวห้อง" : "ผู้เล่น"}</dd></div>
          </dl>
          <div className={styles.actionDock}>
            <p className={styles.dockStatus}>
              <strong>{readyCount}/{players.length} คนพร้อม</strong>
              <span>{isHost ? waitingMessage : currentPlayer?.isReady ? "พร้อมแล้ว รอหัวห้องเริ่มเกม" : "กดพร้อม เพื่อบอกเพื่อนว่าคุณพร้อมเล่น"}</span>
            </p>
            {isHost ? (
              <Button size="lg" fullWidth onClick={onStart} disabled={!canStartGame || busy} loading={busy}>
                เริ่มเกม<FaArrowRight aria-hidden />
              </Button>
            ) : (
              <Button variant={currentPlayer?.isReady ? "outline" : "primary"} size="lg" fullWidth onClick={onReady} disabled={busy} loading={busy} icon={<FaCheck aria-hidden />}>
                {currentPlayer?.isReady ? "ยกเลิกความพร้อม" : "พร้อมเล่นแล้ว!"}
              </Button>
            )}
            <p className={styles.actionHint}>{isHost ? "เมื่อเพื่อนพร้อมครบ หัวห้องกดเริ่มเกมได้เลย" : currentPlayer?.isReady ? "พร้อมแล้ว รอหัวห้องเริ่มเกมได้เลย" : "กดพร้อม เพื่อบอกเพื่อนว่าคุณพร้อมเล่น"}</p>
          </div>
        </aside>
      </div>
      <p className={styles.footer}>คนละจอ แต่ความสนุกโต๊ะเดียวกัน</p>
    </PageShell>
  );
}
