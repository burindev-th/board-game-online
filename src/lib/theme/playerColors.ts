/**
 * สีประจำตัวผู้เล่น (ใช้เป็นพื้นหลัง ตัวอักษรบนสีเหล่านี้ใช้ text-on-status)
 * ใช้ใน tailwind.config.ts (bg-player-1…8) และใน JS ผ่าน getPlayerColor
 */
export const playerColors = [
  "#CBFF49", // lime
  "#5473FF", // blue
  "#FF5A5F", // red
  "#FFC93C", // yellow
  "#3DDC84", // green
  "#FF8A3D", // orange
  "#B57BFF", // purple
  "#4DD4E8", // cyan
] as const;

export function getPlayerColor(index: number): string {
  const n = playerColors.length;
  return playerColors[((index % n) + n) % n];
}
