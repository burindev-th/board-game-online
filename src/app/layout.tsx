import type { Metadata } from "next";
import { Anuphan, Bai_Jamjuree, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AgeModal from "@/components/AgeModal";
import { ThemeProvider, ThemeScript } from "@/components/theme";
import { cn } from "@/lib/utils/cn";

const bodyFont = Anuphan({
  weight: ["400", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-body",
  display: "swap",
});

const headingFont = Bai_Jamjuree({
  weight: ["600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-heading",
  display: "swap",
});

const numberFont = Space_Grotesk({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-number",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Party Game - Board Game",
  description: "Multiplayer party board game with real-time updates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={cn(bodyFont.variable, headingFont.variable, numberFont.variable)}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <AgeModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
