import { LuHeart } from "react-icons/lu";
import { cn } from "@/lib/utils/cn";

const sizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" } as const;

type HeartsProps = {
  total: number;
  remaining: number;
  size?: keyof typeof sizes;
  className?: string;
};

/** หัวใจ/ชีวิตในเกม: เต็ม = พื้นแดงขอบหมึก, หาย = เส้นจาง */
export function Hearts({ total, remaining, size = "md", className }: HeartsProps) {
  return (
    <span role="img" aria-label={`ชีวิตเหลือ ${remaining} จาก ${total}`} className={cn("inline-flex items-center gap-1", className)}>
      {Array.from({ length: total }, (_, i) => (
        <LuHeart
          key={i}
          aria-hidden
          strokeWidth={2.5}
          className={cn(sizes[size], i < remaining ? "fill-danger text-ink" : "text-fg-subtle")}
        />
      ))}
    </span>
  );
}
