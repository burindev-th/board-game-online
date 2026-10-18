import Link from "next/link";
import type { ReactNode } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";

const widths = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" } as const;

type PageShellProps = {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  brandLink?: boolean;
  actions?: ReactNode;
  width?: keyof typeof widths;
  /** จัดเนื้อหาให้อยู่กึ่งกลางแนวตั้งของจอ (หน้าฟอร์มสั้นๆ) */
  center?: boolean;
  className?: string;
};

export function PageShell({ children, backHref, backLabel = "กลับ", brandLink = true, actions, width = "md", center = false, className }: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4">
        {backHref ? (
          <Button href={backHref} variant="ghost" size="sm" icon={<LuArrowLeft aria-hidden />}>
            {backLabel}
          </Button>
        ) : brandLink ? (
          <Link href="/" className="font-heading text-h3 font-bold">
            บอร์ดเกม
          </Link>
        ) : (
          <span className="font-heading text-h3 font-bold">บอร์ดเกม</span>
        )}
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle />
        </div>
      </header>
      <main
        className={cn(
          "mx-auto w-full px-4 pb-12",
          center && "flex flex-1 flex-col justify-center pb-20",
          widths[width],
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
