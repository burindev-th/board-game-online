"use client";

import { LuMonitor, LuMoon, LuSun } from "react-icons/lu";
import { IconButton } from "@/components/ui/IconButton";
import { useTheme, type Theme } from "./ThemeProvider";

const next: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" };
const icons = { light: <LuSun />, dark: <LuMoon />, system: <LuMonitor /> };
const labels: Record<Theme, string> = { light: "โหมดสว่าง", dark: "โหมดมืด", system: "ตามระบบ" };

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <IconButton
      icon={icons[theme]}
      label={`ธีม: ${labels[theme]} (กดเพื่อเปลี่ยน)`}
      variant="outline"
      size="sm"
      onClick={() => setTheme(next[theme])}
      className={className}
    />
  );
}
