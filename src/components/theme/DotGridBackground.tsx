"use client";

import { useEffect, useRef } from "react";

/**
 * พื้นหลังลายจุด (polka dot) จางๆ ทั้งหน้า
 * - สีจุดมาจาก --color-ink จึงเปลี่ยนตามธีมสว่าง/มืด
 * - จุดใกล้เมาส์จะใหญ่ขึ้นและถอยออกเล็กน้อย (ไม่กี่ px) แบบนุ่มๆ
 * - อุปกรณ์สัมผัสหรือผู้ใช้ที่ตั้ง reduced motion: วาดนิ่ง ไม่มี animation
 */

const GAP = 26; // ระยะห่างระหว่างจุด (px)
const RADIUS = 1.4; // รัศมีจุดปกติ
const RADIUS_ACTIVE = 2.6; // รัศมีจุดที่ใกล้เมาส์สุด
const ALPHA = 0.14; // ความทึบจุดปกติ
const ALPHA_ACTIVE = 0.4; // ความทึบจุดที่ใกล้เมาส์สุด
const REACH = 140; // ระยะที่เมาส์มีผล (px)
const PUSH = 4; // ระยะที่จุดถอยออกจากเมาส์สูงสุด (px)
const EASE = 0.12; // ความนุ่มของการเปลี่ยนแปลงต่อเฟรม

export function DotGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const animated =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let influence = new Float32Array(0); // ค่าอิทธิพลของเมาส์ต่อแต่ละจุด (0–1) แบบ ease แล้ว
    let ink = "10 10 10";
    const pointer = { x: -9999, y: -9999 };
    let frame = 0;

    const readInk = () => {
      ink = getComputedStyle(document.documentElement).getPropertyValue("--color-ink").trim() || ink;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / GAP) + 1;
      rows = Math.ceil(height / GAP) + 1;
      influence = new Float32Array(cols * rows);
    };

    // วาดหนึ่งเฟรม คืนค่า true ถ้ายังมีจุดที่กำลังเปลี่ยนอยู่ (ต้องวาดต่อ)
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const offsetX = (width - (cols - 1) * GAP) / 2;
      const offsetY = (height - (rows - 1) * GAP) / 2;
      let moving = false;

      // จุดปกติ: รวมเป็น path เดียวเพื่อความเร็ว
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const x = offsetX + c * GAP;
          const y = offsetY + r * GAP;
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dist = Math.hypot(dx, dy);
          const target = dist < REACH ? 1 - dist / REACH : 0;
          const next = influence[i] + (target - influence[i]) * EASE;
          influence[i] = Math.abs(next - target) < 0.002 ? target : next;
          if (influence[i] !== target) moving = true;
          if (influence[i] > 0.01) continue;
          ctx.moveTo(x + RADIUS, y);
          ctx.arc(x, y, RADIUS, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = `rgb(${ink} / ${ALPHA})`;
      ctx.fill();

      // จุดใกล้เมาส์: ใหญ่ขึ้น เข้มขึ้น ถอยออกเล็กน้อย
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const t = influence[r * cols + c];
          if (t <= 0.01) continue;
          const ease = t * t * (3 - 2 * t); // smoothstep
          const x = offsetX + c * GAP;
          const y = offsetY + r * GAP;
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dist = Math.hypot(dx, dy) || 1;
          const push = PUSH * ease;
          ctx.beginPath();
          ctx.arc(
            x + (dx / dist) * push,
            y + (dy / dist) * push,
            RADIUS + (RADIUS_ACTIVE - RADIUS) * ease,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = `rgb(${ink} / ${ALPHA + (ALPHA_ACTIVE - ALPHA) * ease})`;
          ctx.fill();
        }
      }

      return moving;
    };

    const loop = () => {
      frame = draw() ? requestAnimationFrame(loop) : 0;
    };
    const requestDraw = () => {
      if (!frame) frame = requestAnimationFrame(loop);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      requestDraw();
    };
    const onPointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
      requestDraw();
    };
    const onResize = () => {
      resize();
      requestDraw();
    };

    // เปลี่ยนธีม (class บน <html>) → อ่านสีใหม่แล้ววาดใหม่
    const themeObserver = new MutationObserver(() => {
      readInk();
      requestDraw();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    readInk();
    resize();
    draw();

    window.addEventListener("resize", onResize);
    if (animated) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
