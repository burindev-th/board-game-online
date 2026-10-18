# Neo-brutalist Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the gradient/glass styling of the player-facing pages with a token-driven neo-brutalist theme that has light and dark modes, built from shared UI components.

**Architecture:** Every token is a CSS variable in `src/app/globals.css` (`:root` for light, `.dark` for dark). `tailwind.config.ts` maps them to semantic utilities (`bg-surface`, `text-fg-muted`, `border-ink`, `shadow-brutal`, `text-h1`…). Shared components in `src/components/ui/` use only those utilities, and pages use those components. A `check:theme` script enforces the rules on every migrated path.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS 3.4, `next/font/google`, `clsx` 2.1.1, `tailwind-merge` 2.6.0, `react-icons` 5 (`lu` = lucide set), Node `node:test` for the check script.

**Spec:** `docs/superpowers/specs/2026-10-19-neo-brutalist-theme-design.md`

## Global Constraints

- No gradients (`bg-gradient-*`, `from-*`/`via-*`/`to-*`), no `backdrop-blur*`, no translucent layered backgrounds, in any migrated file.
- Migrated files use semantic tokens only. No raw Tailwind palette colors, no `white`/`black`. Colored tokens (`primary`, `secondary`, `success`, `warning`, `danger`, `player-*`) are **backgrounds**. Text is `fg`, `fg-muted`, `fg-subtle`, `primary-on`, `secondary-on` or `on-status`.
- Type sizes only: `display`, `h1`, `h2`, `h3`, `body`, `small`, `caption`, `number` (and their `-lg` md+ steps). Weights 400 / 600 / 700 only.
- Radius only `rounded-sm` (6px), `rounded-md` (12px), `rounded-lg` (16px), `rounded-full`, `rounded-none`. Never use `rounded-xl`/`2xl`/`3xl` in migrated files; those keys exist only for admin.
- Borders are `border-2 border-ink`. Shadows are only `shadow-brutal-sm`, `shadow-brutal`, `shadow-brutal-lg` or `shadow-none`.
- Stay on Tailwind 3. Add only `clsx@2.1.1` and `tailwind-merge@2.6.0` (v2 supports Tailwind 3; v3 does **not**). Remove `bootstrap`.
- `/admin/**` is out of scope. It must keep rendering, forced to light mode.
- Visual change only. Do not change hooks, Firebase calls, game logic, routing, props of page-level components, or Thai copy (except removing decorative emoji where a component icon replaces it).
- The project has no test framework and none is added (spec §4). Verification = `npm run test:theme`, `npm run check:theme`, `npm run lint`, `npm run build`, and a browser pass.

## Class Mapping Reference (used by Tasks 7–12)

| Old pattern | New |
|---|---|
| Page root `min-h-screen bg-gradient-to-br from-slate-800 …` | Wrap the page in `<PageShell>` (or `min-h-screen bg-bg text-fg` when the page needs a custom header) |
| Glass panel `bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20` | `<Card padding="lg">` |
| Inner panel `bg-white/5 rounded-xl border border-white/10` | `<Card variant="muted" padding="sm">` |
| Big green gradient CTA | `<Button variant="primary" size="lg">` / `buttonClasses({ variant: "primary", size: "lg" })` |
| Blue/cyan gradient button | `variant="secondary"` |
| Red/delete/leave button | `variant="danger"` |
| Gray / cancel / back button | `variant="outline"`; text-only links → `variant="ghost"` |
| `hover:scale-105`, `transform`, `hover:shadow-2xl` | delete them (`Button` and `Card interactive` already have the press effect) |
| `text-white` (on old dark bg), `text-gray-800/900` | `text-fg` |
| `text-slate-300/400`, `text-white/70–90`, `text-gray-500/600/700` | `text-fg-muted` |
| `text-white/40–60`, `text-gray-400` | `text-fg-subtle` |
| Status bg `bg-green-*` / `bg-yellow-*`/`amber` / `bg-red-*` / `bg-blue-*` | `bg-success` / `bg-warning` / `bg-danger` / `bg-secondary` + `text-on-status` (`text-secondary-on` for secondary) + `border-2 border-ink` |
| Status text such as `text-green-400`, `text-yellow-300` | a `<Badge tone=…>`, or a colored chip `rounded-md border-2 border-ink bg-success p-1.5 text-on-status` around the icon/number. Don't put colored text on the surface (contrast). |
| `text-xs` → `text-caption`; `text-sm` → `text-small`; `text-base` → `text-body`; `text-lg`/`text-xl` → `text-h3` (headings) or `text-body` (prose) | |
| `text-2xl` → `<Heading level="h2">`; `text-3xl` → `level="h1"`; `text-4xl`+ titles → `level="display"` | |
| Big game numbers `text-4xl md:text-6xl font-bold` | `<Text variant="number">` or `font-number text-number md:text-number-lg font-bold tabular-nums` |
| `rounded-xl/2xl/3xl` | `rounded-lg` (containers) / `rounded-md` (controls) |
| `shadow-sm`/`shadow-md` → `shadow-brutal-sm`; `shadow`/`shadow-lg` → `shadow-brutal`; `shadow-xl`/`shadow-2xl` → `shadow-brutal-lg` | |
| `border`, `border-white/20`, `border-gray-200` | `border-2 border-ink` |
| Inline SVG `animate-spin` spinner | `<Spinner />` |
| `<style jsx>` `@keyframes fadeIn` + `.animate-fadeIn` | delete the `<style jsx>` block; use `animate-fade-in` |
| Hand-rolled `fixed inset-0` overlay + panel | `<Modal>` |
| `<input>` / `<textarea>` / `<select>` with a label | `<Input>` / `<Textarea>` / `<Select>` with `label`, `hint`, `error` |
| Player avatar circles / name rows | `<PlayerChip name colorIndex isHost status>`; `colorIndex` = the player's index in the room's player list |
| `z-[9999]`, `z-[60]`, `z-[70]` | `z-modal` / `z-toast` (or let `Modal` handle it) |

---

## Task 1: Theme check script

**Files:**
- Create: `scripts/check-theme.mjs`
- Create: `scripts/check-theme.test.mjs`
- Create: `scripts/theme-migrated.json`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `findViolations(source: string): { rule: string; match: string; line: number }[]`; `RULES` array; CLI `npm run check:theme` that reads `scripts/theme-migrated.json` (array of repo-relative file or directory paths) and exits 1 on any violation; `npm run test:theme`.

- [ ] **Step 1: Write the failing test** — `scripts/check-theme.test.mjs`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { findViolations } from "./check-theme.mjs";

const rules = (src) => findViolations(src).map((v) => v.rule).sort();

test("flags gradients", () => {
  assert.deepEqual(rules('className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600"'), [
    "gradient", "gradient", "gradient", "gradient",
  ]);
});

test("flags backdrop blur and translucent white", () => {
  assert.deepEqual(rules('className="bg-white/10 backdrop-blur-lg"'), ["blur", "raw-color"]);
});

test("flags raw palette colors with variants and opacity", () => {
  assert.deepEqual(rules('className="hover:bg-gray-100 text-white/70 border-blue-400 text-black"'), [
    "raw-color", "raw-color", "raw-color", "raw-color",
  ]);
});

test("flags legacy radius only", () => {
  assert.deepEqual(rules('className="rounded-2xl md:rounded-3xl rounded-t-xl"'), ["radius", "radius", "radius"]);
  assert.deepEqual(rules('className="rounded-lg rounded-full rounded-md rounded-sm"'), []);
});

test("flags blurred shadows but not brutal ones", () => {
  assert.deepEqual(rules('className="shadow-2xl p-4 shadow"'), ["blur-shadow", "blur-shadow"]);
  assert.deepEqual(rules('className="shadow-brutal shadow-brutal-lg shadow-brutal-sm shadow-none"'), []);
});

test("flags off-scale text sizes but not tokens", () => {
  assert.deepEqual(rules('className="text-sm md:text-2xl text-base"'), ["type-scale", "type-scale", "type-scale"]);
  assert.deepEqual(rules('className="text-small text-h1 md:text-display-lg text-fg-muted text-caption"'), []);
});

test("semantic tokens are clean", () => {
  assert.deepEqual(
    rules('className="bg-primary text-primary-on border-2 border-ink bg-surface-muted text-on-status bg-success"'),
    [],
  );
});

test("reports 1-based line numbers", () => {
  const [v] = findViolations("const a = 1;\n<div className=\"text-xs\" />");
  assert.equal(v.line, 2);
  assert.equal(v.match, "text-xs");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/check-theme.test.mjs`
Expected: FAIL with `Cannot find module …/scripts/check-theme.mjs`

- [ ] **Step 3: Implement** — `scripts/check-theme.mjs`

```js
// Scans migrated files for styling the theme forbids.
// Rules: docs/superpowers/specs/2026-10-19-neo-brutalist-theme-design.md §3
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PALETTE =
  "gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

export const RULES = [
  {
    name: "gradient",
    pattern: new RegExp(
      String.raw`(?<![\w-])(?:bg-gradient-to-[a-z]+|(?:from|via|to)-(?:(?:${PALETTE})-\d{2,3}|white|black|transparent)(?:\/\d+)?)(?![\w-])`,
      "g",
    ),
  },
  { name: "blur", pattern: /(?<![\w-])backdrop-blur(?:-[a-z0-9]+)?(?![\w-])/g },
  {
    name: "raw-color",
    pattern: new RegExp(
      String.raw`(?<![\w-])(?:bg|text|border(?:-[trblxy])?|ring|outline|divide|placeholder|fill|stroke|shadow|accent|caret|decoration)-(?:(?:${PALETTE})-\d{2,3}|white|black)(?:\/\d+)?(?![\w-])`,
      "g",
    ),
  },
  { name: "radius", pattern: /(?<![\w-])rounded(?:-[trblse]{1,2})?-(?:xl|2xl|3xl)(?![\w-])/g },
  { name: "blur-shadow", pattern: /(?<![\w-])shadow(?:-(?:sm|md|lg|xl|2xl|inner))?(?![\w-])/g },
  { name: "type-scale", pattern: /(?<![\w-])text-(?:xs|sm|base|lg|[2-9]?xl)(?![\w-])/g },
];

export function findViolations(source) {
  const violations = [];
  source.split("\n").forEach((text, i) => {
    for (const rule of RULES) {
      for (const m of text.matchAll(rule.pattern)) {
        violations.push({ rule: rule.name, match: m[0], line: i + 1 });
      }
    }
  });
  return violations;
}

function listFiles(path) {
  if (!existsSync(path)) throw new Error(`check-theme: path not found: ${path}`);
  if (statSync(path).isFile()) return [path];
  return readdirSync(path, { recursive: true })
    .map((p) => join(path, p))
    .filter((p) => [".ts", ".tsx"].includes(extname(p)) && statSync(p).isFile());
}

function main() {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const entries = JSON.parse(readFileSync(join(root, "scripts/theme-migrated.json"), "utf8"));
  let count = 0;
  for (const entry of entries) {
    for (const file of listFiles(join(root, entry))) {
      for (const v of findViolations(readFileSync(file, "utf8"))) {
        count++;
        console.log(`${relative(root, file)}:${v.line}  [${v.rule}]  ${v.match}`);
      }
    }
  }
  if (count > 0) {
    console.error(`\n${count} theme violation(s).`);
    process.exit(1);
  }
  console.log(`check:theme OK (${entries.length} path(s))`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
```

`scripts/theme-migrated.json`:

```json
[]
```

In `package.json`, add these to `"scripts"`:

```json
"check:theme": "node scripts/check-theme.mjs",
"test:theme": "node --test scripts/check-theme.test.mjs"
```

- [ ] **Step 4: Run tests and script**

Run: `npm run test:theme` → Expected: all 8 tests pass.
Run: `npm run check:theme` → Expected: `check:theme OK (0 path(s))`, exit 0.

If a regex test fails, fix the regex. Don't weaken the test.

- [ ] **Step 5: Commit**

```bash
git add scripts package.json
git commit -m "chore: add theme rule checker"
```

---

## Task 2: Design tokens, fonts, and dependencies

**Files:**
- Modify: `src/app/globals.css` (full rewrite)
- Modify: `tailwind.config.ts` (full rewrite)
- Modify: `src/app/layout.tsx` (fonts only)
- Create: `src/lib/theme/playerColors.ts`
- Create: `src/lib/utils/cn.ts`
- Delete: `src/lib/colors.ts` (only `tailwind.config.ts` imports it; check with `grep -rn "lib/colors" src tailwind.config.ts`)
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Produces:
  - Tailwind utilities: colors `bg`, `surface`, `surface-muted`, `fg`, `fg-muted`, `fg-subtle`, `ink`, `primary`, `primary-on`, `secondary`, `secondary-on`, `success`, `warning`, `danger`, `on-status`, `backdrop`, `player-1`…`player-8`
  - fontSize `display`, `display-lg`, `h1`, `h1-lg`, `h2`, `h2-lg`, `h3`, `h3-lg`, `body`, `small`, `caption`, `number`, `number-lg`
  - fontFamily `heading`, `body`/`sans`, `number`
  - shadows `brutal-sm`, `brutal`, `brutal-lg`
  - durations `fast`, `modal`; z-index `modal`, `toast`
  - animations `fade-in`, `modal-in`
  - CSS class `.brutal-press`; scope class `.theme-light`
  - `cn(...inputs: ClassValue[]): string`
  - `playerColors: readonly string[]` (8 hex values), `getPlayerColor(index: number): string`

- [ ] **Step 1: Swap dependencies**

```bash
npm uninstall bootstrap
npm install clsx@2.1.1 tailwind-merge@2.6.0
```

Expected: `package.json` lists `clsx` and `tailwind-merge` and no longer lists `bootstrap`.

- [ ] **Step 2: Create `src/lib/theme/playerColors.ts`**

```ts
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
```

- [ ] **Step 3: Create `src/lib/utils/cn.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// สอน tailwind-merge ให้รู้จัก token ของเรา ไม่งั้น text-h1 จะถูกมองเป็นสีแล้วโดน text-fg ทับ
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display", "display-lg", "h1", "h1-lg", "h2", "h2-lg", "h3", "h3-lg",
            "body", "small", "caption", "number", "number-lg",
          ],
        },
      ],
      shadow: [{ shadow: ["brutal-sm", "brutal", "brutal-lg"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Rewrite `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";
import { playerColors } from "./src/lib/theme/playerColors";

const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      sans: ["var(--font-body)", "sans-serif"],
      body: ["var(--font-body)", "sans-serif"],
      heading: ["var(--font-heading)", "sans-serif"],
      number: ["var(--font-number)", "ui-monospace", "monospace"],
    },
    borderRadius: {
      none: "0",
      DEFAULT: "6px",
      sm: "6px",
      md: "12px",
      lg: "16px",
      full: "9999px",
      // legacy: ใช้แค่หน้า admin ลบออกเมื่อย้าย admin มาใช้ธีม
      xl: "16px",
      "2xl": "16px",
      "3xl": "16px",
    },
    extend: {
      colors: {
        bg: token("bg"),
        surface: { DEFAULT: token("surface"), muted: token("surface-muted") },
        fg: { DEFAULT: token("fg"), muted: token("fg-muted"), subtle: token("fg-subtle") },
        ink: token("ink"),
        primary: { DEFAULT: token("primary"), on: token("on-primary") },
        secondary: { DEFAULT: token("secondary"), on: token("on-secondary") },
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
        "on-status": token("on-status"),
        backdrop: token("backdrop"),
        player: Object.fromEntries(playerColors.map((c, i) => [String(i + 1), c])),
      },
      fontSize: {
        display: ["2.25rem", { lineHeight: "1.1" }],
        "display-lg": ["3.5rem", { lineHeight: "1.05" }],
        h1: ["1.75rem", { lineHeight: "1.2" }],
        "h1-lg": ["2.25rem", { lineHeight: "1.15" }],
        h2: ["1.375rem", { lineHeight: "1.25" }],
        "h2-lg": ["1.75rem", { lineHeight: "1.2" }],
        h3: ["1.125rem", { lineHeight: "1.35" }],
        "h3-lg": ["1.25rem", { lineHeight: "1.3" }],
        body: ["1rem", { lineHeight: "1.6" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.4" }],
        number: ["4rem", { lineHeight: "1" }],
        "number-lg": ["6rem", { lineHeight: "1" }],
      },
      boxShadow: {
        "brutal-sm": "2px 2px 0 0 rgb(var(--color-ink))",
        brutal: "4px 4px 0 0 rgb(var(--color-ink))",
        "brutal-lg": "6px 6px 0 0 rgb(var(--color-ink))",
      },
      transitionDuration: { fast: "120ms", modal: "200ms" },
      zIndex: { modal: "50", toast: "60" },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "modal-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out both",
        "modal-in": "modal-in 200ms ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Rewrite `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Light (default) — .theme-light forces light inside a .dark page (admin) */
  :root,
  .dark .theme-light {
    color-scheme: light;
    --color-bg: 252 247 248;
    --color-surface: 255 255 255;
    --color-surface-muted: 243 240 234;
    --color-fg: 10 10 10;
    --color-fg-muted: 74 74 74;
    --color-fg-subtle: 107 107 107;
    --color-ink: 10 10 10;
    --color-primary: 203 255 73;
    --color-on-primary: 10 10 10;
    --color-secondary: 84 115 255;
    --color-on-secondary: 10 10 10;
    --color-success: 61 220 132;
    --color-warning: 255 201 60;
    --color-danger: 255 90 95;
    --color-on-status: 10 10 10;
    --color-backdrop: 10 10 10;
  }

  .dark {
    color-scheme: dark;
    --color-bg: 15 15 16;
    --color-surface: 26 26 28;
    --color-surface-muted: 38 38 42;
    --color-fg: 245 245 242;
    --color-fg-muted: 180 180 176;
    --color-fg-subtle: 125 125 120;
    --color-ink: 217 217 212;
    --color-primary: 203 255 73;
    --color-on-primary: 10 10 10;
    --color-secondary: 123 147 255;
    --color-on-secondary: 10 10 10;
    --color-success: 61 220 132;
    --color-warning: 255 201 60;
    --color-danger: 255 90 95;
    --color-on-status: 10 10 10;
    --color-backdrop: 0 0 0;
  }

  html,
  body {
    max-width: 100vw;
    overflow-x: clip;
  }

  body {
    @apply bg-bg font-body text-body text-fg;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  :focus-visible {
    outline: 3px solid rgb(var(--color-secondary));
    outline-offset: 2px;
  }
}

@layer components {
  /* ยกขึ้นตอน hover, ยุบลงตอนกด — ใช้กับปุ่มและ card ที่กดได้ */
  .brutal-press {
    @apply shadow-brutal transition-[transform,box-shadow] duration-fast ease-out;
    @apply hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg;
    @apply active:translate-x-0.5 active:translate-y-0.5 active:shadow-none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brutal-press,
  .brutal-press:hover,
  .brutal-press:active {
    transform: none !important;
  }
}
```

- [ ] **Step 6: Swap fonts in `src/app/layout.tsx`**

Replace the `Kanit` import/instance and the `<html>` className. Keep everything else unchanged for now (Task 6 adds the theme provider).

```tsx
import type { Metadata } from "next";
import { Anuphan, Bai_Jamjuree, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AgeModal from "@/components/AgeModal";
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
```

and in `RootLayout`:

```tsx
<html lang="th" className={cn(bodyFont.variable, headingFont.variable, numberFont.variable)}>
```

Delete `src/lib/colors.ts`.

- [ ] **Step 7: Verify**

Run: `npm run lint && npm run build`
Expected: both succeed. Then run `npm run dev`, open `/`, and confirm:
- the page still renders, with body text in Anuphan
- in DevTools, `document.documentElement` has `--font-body` set and `:root` shows `--color-bg`

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(theme): add design tokens, fonts and cn helper"
```

---

## Task 3: Core UI primitives

**Files:**
- Create: `src/components/ui/Spinner.tsx`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/IconButton.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Heading.tsx`
- Create: `src/components/ui/Text.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/index.ts`
- Modify: `scripts/theme-migrated.json`

**Interfaces:**
- Consumes: `cn` (Task 2), the Tailwind tokens (Task 2), the `.brutal-press` class.
- Produces (all named exports from `@/components/ui`):
  - `Spinner({ size?: "sm"|"md"|"lg", label?: string, className? })`
  - `Button(props: ButtonProps)`: `variant?: ButtonVariant` (`"primary"|"secondary"|"outline"|"ghost"|"danger"`), `size?: ButtonSize` (`"sm"|"md"|"lg"`), `fullWidth?`, `loading?`, `icon?: ReactNode`, plus either native `<button>` props or `href: string` + anchor props (renders `next/link`)
  - `buttonClasses(opts?: { variant?, size?, fullWidth? }): string`
  - `IconButton({ icon: ReactNode, label: string, variant?, size?, ...buttonProps })`
  - `Badge({ tone?: Tone, ...spanProps })`, with `type Tone = "neutral"|"primary"|"secondary"|"success"|"warning"|"danger"`
  - `Heading({ level?: "display"|"h1"|"h2"|"h3", as?, ...headingProps })`
  - `Text({ variant?: "body"|"small"|"caption"|"number", tone?: "default"|"muted"|"subtle", as?, ...props })`
  - `Card({ variant?: "default"|"muted"|"primary", padding?: "none"|"sm"|"md"|"lg", interactive?, ...divProps })`
  - `cardClasses(opts?: { variant?, padding?, interactive? }): string`

- [ ] **Step 1: Register the folder with the checker (the failing check)**

Set `scripts/theme-migrated.json` to:

```json
["src/components/ui"]
```

Run: `npm run check:theme`
Expected: FAIL with `check-theme: path not found: …/src/components/ui`

- [ ] **Step 2: `src/components/ui/Spinner.tsx`**

```tsx
import { cn } from "@/lib/utils/cn";

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
} as const;

type SpinnerProps = {
  size?: keyof typeof sizes;
  label?: string;
  className?: string;
};

export function Spinner({ size = "md", label = "กำลังโหลด", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent",
        sizes[size],
        className,
      )}
    />
  );
}
```

- [ ] **Step 3: `src/components/ui/Button.tsx`**

```tsx
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-on brutal-press",
  secondary: "bg-secondary text-secondary-on brutal-press",
  outline: "bg-surface text-fg brutal-press",
  ghost: "border-transparent bg-transparent text-fg hover:bg-surface-muted",
  danger: "bg-danger text-on-status brutal-press",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-3 text-small",
  md: "h-11 gap-2 px-5 text-body",
  lg: "h-14 gap-2.5 px-7 text-h3",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean } = {}) {
  return cn(
    "inline-flex select-none items-center justify-center rounded-md border-2 border-ink font-heading font-bold",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
  );
}

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

type NativeButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & { href?: undefined };
type LinkButtonProps = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps | "href"> & { href: string };

export type ButtonProps = NativeButtonProps | LinkButtonProps;

export function Button(props: ButtonProps) {
  const { variant, size, fullWidth, loading = false, icon, className, children } = props;
  const classes = cn(buttonClasses({ variant, size, fullWidth }), className);
  const content = (
    <>
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </>
  );

  if (props.href !== undefined) {
    const {
      variant: _v, size: _s, fullWidth: _f, loading: _l, icon: _i, className: _c, children: _ch,
      href, ...anchorProps
    } = props;
    return (
      <Link href={href} className={classes} aria-disabled={loading || undefined} {...anchorProps}>
        {content}
      </Link>
    );
  }

  const {
    variant: _v, size: _s, fullWidth: _f, loading: _l, icon: _i, className: _c, children: _ch,
    href: _h, type = "button", disabled, ...buttonProps
  } = props;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...buttonProps}
    >
      {content}
    </button>
  );
}
```

If ESLint flags the `_`-prefixed destructured names as unused, add this at the top of the file. Don't change the lint config.

```ts
/* eslint-disable @typescript-eslint/no-unused-vars */
```

- [ ] **Step 4: `src/components/ui/IconButton.tsx`**

```tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./Button";

const squareSizes: Record<ButtonSize, string> = {
  sm: "h-9 w-9 text-small",
  md: "h-11 w-11 text-body",
  lg: "h-14 w-14 text-h3",
};

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: ReactNode;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function IconButton({
  icon,
  label,
  variant = "outline",
  size = "md",
  type = "button",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(buttonClasses({ variant, size }), "px-0", squareSizes[size], className)}
      {...rest}
    >
      {icon}
    </button>
  );
}
```

- [ ] **Step 5: `src/components/ui/Badge.tsx`**

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type Tone = "neutral" | "primary" | "secondary" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-fg",
  primary: "bg-primary text-primary-on",
  secondary: "bg-secondary text-secondary-on",
  success: "bg-success text-on-status",
  warning: "bg-warning text-on-status",
  danger: "bg-danger text-on-status",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export function Badge({ tone = "neutral", className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-sm border-2 border-ink px-2 py-0.5 text-caption font-semibold",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
```

- [ ] **Step 6: `src/components/ui/Heading.tsx`**

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type HeadingLevel = "display" | "h1" | "h2" | "h3";

const levelClasses: Record<HeadingLevel, string> = {
  display: "text-display md:text-display-lg font-bold",
  h1: "text-h1 md:text-h1-lg font-bold",
  h2: "text-h2 md:text-h2-lg font-bold",
  h3: "text-h3 md:text-h3-lg font-semibold",
};

const defaultTag = { display: "h1", h1: "h1", h2: "h2", h3: "h3" } as const;

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: HeadingLevel;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
};

export function Heading({ level = "h1", as, className, ...rest }: HeadingProps) {
  const Tag = as ?? defaultTag[level];
  return <Tag className={cn("font-heading text-fg", levelClasses[level], className)} {...rest} />;
}
```

- [ ] **Step 7: `src/components/ui/Text.tsx`**

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const variants = {
  body: "text-body",
  small: "text-small",
  caption: "text-caption font-semibold",
  number: "font-number text-number md:text-number-lg font-bold tabular-nums",
} as const;

const tones = {
  default: "text-fg",
  muted: "text-fg-muted",
  subtle: "text-fg-subtle",
} as const;

type TextProps = HTMLAttributes<HTMLElement> & {
  variant?: keyof typeof variants;
  tone?: keyof typeof tones;
  as?: "p" | "span" | "div" | "label" | "strong";
};

export function Text({ variant = "body", tone = "default", as: Tag = "p", className, ...rest }: TextProps) {
  return <Tag className={cn(variants[variant], tones[tone], className)} {...rest} />;
}
```

- [ ] **Step 8: `src/components/ui/Card.tsx`**

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const variants = {
  default: "bg-surface",
  muted: "bg-surface-muted",
  primary: "bg-primary text-primary-on",
} as const;

const paddings = {
  none: "",
  sm: "p-3 md:p-4",
  md: "p-4 md:p-6",
  lg: "p-6 md:p-10",
} as const;

type CardOptions = {
  variant?: keyof typeof variants;
  padding?: keyof typeof paddings;
  interactive?: boolean;
};

export function cardClasses({ variant = "default", padding = "md", interactive = false }: CardOptions = {}) {
  return cn(
    "block rounded-lg border-2 border-ink text-fg",
    variants[variant],
    paddings[padding],
    interactive ? "brutal-press cursor-pointer" : "shadow-brutal",
  );
}

type CardProps = HTMLAttributes<HTMLDivElement> & CardOptions;

export function Card({ variant, padding, interactive, className, ...rest }: CardProps) {
  return <div className={cn(cardClasses({ variant, padding, interactive }), className)} {...rest} />;
}
```

- [ ] **Step 9: `src/components/ui/index.ts`**

```ts
export { Badge, type Tone } from "./Badge";
export { Button, buttonClasses, type ButtonProps, type ButtonSize, type ButtonVariant } from "./Button";
export { Card, cardClasses } from "./Card";
export { Heading, type HeadingLevel } from "./Heading";
export { IconButton } from "./IconButton";
export { Spinner } from "./Spinner";
export { Text } from "./Text";
```

- [ ] **Step 10: Verify**

Run: `npm run check:theme && npm run lint && npm run build`
Expected: all pass. `check:theme` prints `OK (1 path(s))`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(ui): add Button, IconButton, Card, Badge, Heading, Text, Spinner"
```

---

## Task 4: Form fields, Alert, PlayerChip

**Files:**
- Create: `src/components/ui/Field.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Textarea.tsx`
- Create: `src/components/ui/Select.tsx`
- Create: `src/components/ui/Alert.tsx`
- Create: `src/components/ui/PlayerChip.tsx`
- Modify: `src/components/ui/index.ts`

**Interfaces:**
- Consumes: `cn`, `Badge`, `getPlayerColor` (Task 2/3).
- Produces:
  - `Input(props: ComponentPropsWithRef<"input"> & FieldProps)`
  - `Textarea(props: ComponentPropsWithRef<"textarea"> & FieldProps)`
  - `Select(props: ComponentPropsWithRef<"select"> & FieldProps)` (children = `<option>`s)
  - `FieldProps = { label?: ReactNode; hint?: ReactNode; error?: ReactNode }`
  - `fieldClasses(hasError: boolean): string`
  - `Alert({ tone?: "info"|"success"|"warning"|"danger", title?: ReactNode, children, className? })`
  - `PlayerChip({ name: string, colorIndex: number, isHost?: boolean, status?: ReactNode, className? })`

- [ ] **Step 1: `src/components/ui/Field.tsx`** (shared label/hint/error wrapper)

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
};

export function fieldClasses(hasError: boolean) {
  return cn(
    "w-full rounded-md border-2 border-ink bg-surface px-4 text-body text-fg shadow-brutal-sm",
    "placeholder:text-fg-subtle transition-shadow duration-fast focus:shadow-brutal",
    "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
    hasError && "border-danger",
  );
}

export function describedBy(id: string, hint?: ReactNode, error?: ReactNode) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

export function Field({ id, label, hint, error, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-small font-semibold text-fg">
          {label}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-caption font-normal text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-caption text-fg">
          <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-ink bg-danger" />
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `src/components/ui/Input.tsx`**

```tsx
"use client";

import { useId, type ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";
import { describedBy, Field, fieldClasses, type FieldProps } from "./Field";

type InputProps = ComponentPropsWithRef<"input"> & FieldProps;

export function Input({ id, label, hint, error, className, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field id={inputId} label={label} hint={hint} error={error}>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, hint, error)}
        className={cn(fieldClasses(Boolean(error)), "h-11", className)}
        {...rest}
      />
    </Field>
  );
}
```

- [ ] **Step 3: `src/components/ui/Textarea.tsx`**

```tsx
"use client";

import { useId, type ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";
import { describedBy, Field, fieldClasses, type FieldProps } from "./Field";

type TextareaProps = ComponentPropsWithRef<"textarea"> & FieldProps;

export function Textarea({ id, label, hint, error, className, rows = 4, ...rest }: TextareaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  return (
    <Field id={textareaId} label={label} hint={hint} error={error}>
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(textareaId, hint, error)}
        className={cn(fieldClasses(Boolean(error)), "resize-y py-3", className)}
        {...rest}
      />
    </Field>
  );
}
```

- [ ] **Step 4: `src/components/ui/Select.tsx`**

```tsx
"use client";

import { useId, type ComponentPropsWithRef } from "react";
import { LuChevronDown } from "react-icons/lu";
import { cn } from "@/lib/utils/cn";
import { describedBy, Field, fieldClasses, type FieldProps } from "./Field";

type SelectProps = ComponentPropsWithRef<"select"> & FieldProps;

export function Select({ id, label, hint, error, className, children, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <Field id={selectId} label={label} hint={hint} error={error}>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, hint, error)}
          className={cn(fieldClasses(Boolean(error)), "h-11 cursor-pointer appearance-none pr-10", className)}
          {...rest}
        >
          {children}
        </select>
        <LuChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-fg"
        />
      </div>
    </Field>
  );
}
```

- [ ] **Step 5: `src/components/ui/Alert.tsx`**

```tsx
import type { ReactNode } from "react";
import { LuCircleCheck, LuCircleX, LuInfo, LuTriangleAlert } from "react-icons/lu";
import { cn } from "@/lib/utils/cn";

type AlertTone = "info" | "success" | "warning" | "danger";

const tones: Record<AlertTone, { box: string; icon: ReactNode }> = {
  info: { box: "bg-secondary text-secondary-on", icon: <LuInfo /> },
  success: { box: "bg-success text-on-status", icon: <LuCircleCheck /> },
  warning: { box: "bg-warning text-on-status", icon: <LuTriangleAlert /> },
  danger: { box: "bg-danger text-on-status", icon: <LuCircleX /> },
};

type AlertProps = {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function Alert({ tone = "info", title, children, className }: AlertProps) {
  const { box, icon } = tones[tone];
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg border-2 border-ink p-4 shadow-brutal-sm", box, className)}
    >
      <span aria-hidden className="mt-0.5 shrink-0 text-h3">
        {icon}
      </span>
      <div className="min-w-0 text-small">
        {title && <p className="font-heading font-bold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
```

If any of the `Lu*` icon names fail to resolve at build time, check the names exported by `node_modules/react-icons/lu/index.d.ts` with `grep -o "LuCircleCheck\|LuCircleX\|LuInfo\|LuTriangleAlert" node_modules/react-icons/lu/index.d.ts | sort -u`, then use the matching name (older names: `LuCheckCircle`, `LuXCircle`, `LuAlertTriangle`).

- [ ] **Step 6: `src/components/ui/PlayerChip.tsx`**

```tsx
import type { ReactNode } from "react";
import { FaCrown } from "react-icons/fa6";
import { getPlayerColor } from "@/lib/theme/playerColors";
import { cn } from "@/lib/utils/cn";
import { Badge } from "./Badge";

type PlayerChipProps = {
  name: string;
  colorIndex: number;
  isHost?: boolean;
  status?: ReactNode;
  className?: string;
};

export function PlayerChip({ name, colorIndex, isHost = false, status, className }: PlayerChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border-2 border-ink bg-surface px-3 py-2 text-fg shadow-brutal-sm",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink font-heading font-bold text-on-status"
        style={{ backgroundColor: getPlayerColor(colorIndex) }}
      >
        {name.trim().charAt(0).toUpperCase() || "?"}
      </span>
      <span className="min-w-0 flex-1 truncate font-semibold">{name}</span>
      {isHost && (
        <Badge tone="primary">
          <FaCrown aria-hidden />
          หัวห้อง
        </Badge>
      )}
      {status}
    </div>
  );
}
```

- [ ] **Step 7: Extend `src/components/ui/index.ts`** (append):

```ts
export { Alert } from "./Alert";
export { Field, fieldClasses, type FieldProps } from "./Field";
export { Input } from "./Input";
export { PlayerChip } from "./PlayerChip";
export { Select } from "./Select";
export { Textarea } from "./Textarea";
```

- [ ] **Step 8: Verify**

Run: `npm run check:theme && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(ui): add Input, Textarea, Select, Alert, PlayerChip"
```

---

## Task 5: Modal

**Files:**
- Create: `src/components/ui/Modal.tsx`
- Modify: `src/components/ui/index.ts`

**Interfaces:**
- Consumes: `cn`, `Heading`, `IconButton`.
- Produces: `Modal({ open: boolean, onClose: () => void, title?: ReactNode, children: ReactNode, footer?: ReactNode, size?: "sm"|"md"|"lg", dismissible?: boolean (default true), className?: string })`. It renders into `document.body` through a portal and only after mount, so there is no SSR crash or hydration mismatch.

- [ ] **Step 1: `src/components/ui/Modal.tsx`**

```tsx
"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LuX } from "react-icons/lu";
import { cn } from "@/lib/utils/cn";
import { Heading } from "./Heading";
import { IconButton } from "./IconButton";

const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" } as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(e: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return;
  const items = container.querySelectorAll<HTMLElement>(FOCUSABLE);
  if (items.length === 0) {
    e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || active === container)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof sizes;
  dismissible?: boolean;
  className?: string;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  dismissible = true,
  className,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) onCloseRef.current();
      if (e.key === "Tab") trapFocus(e, panelRef.current);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, dismissible]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 animate-fade-in bg-backdrop/60"
        onClick={dismissible ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[90vh] w-full animate-modal-in flex-col rounded-lg border-2 border-ink bg-surface text-fg shadow-brutal-lg outline-none",
          sizes[size],
          className,
        )}
      >
        {(title || dismissible) && (
          <div className="flex items-start gap-4 border-b-2 border-ink px-5 py-4">
            {title && (
              <Heading level="h3" as="h2" id={titleId} className="flex-1">
                {title}
              </Heading>
            )}
            {dismissible && (
              <IconButton
                icon={<LuX />}
                label="ปิด"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="-mr-2 ml-auto"
              />
            )}
          </div>
        )}
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-3 border-t-2 border-ink px-5 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 2: Append to `src/components/ui/index.ts`**

```ts
export { Modal } from "./Modal";
```

- [ ] **Step 3: Verify**

Run: `npm run check:theme && npm run lint && npm run build`
Expected: all pass. You'll check Modal behavior in the browser through the showcase in Task 6.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(ui): add accessible Modal"
```

---

## Task 6: Theme system, PageShell, admin light scope, showcase

**Files:**
- Create: `src/components/theme/ThemeScript.tsx`
- Create: `src/components/theme/ThemeProvider.tsx`
- Create: `src/components/theme/ThemeToggle.tsx`
- Create: `src/components/theme/index.ts`
- Create: `src/components/ui/PageShell.tsx`
- Modify: `src/components/ui/index.ts`
- Modify: `src/app/layout.tsx`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/dev/ui/page.tsx`
- Create: `src/app/dev/ui/UiShowcase.tsx`
- Modify: `scripts/theme-migrated.json`

**Interfaces:**
- Consumes: `IconButton`, `Button`, all UI components, `cn`.
- Produces:
  - `type Theme = "light"|"dark"|"system"`
  - `ThemeProvider({ children })`
  - `useTheme(): { theme: Theme; resolvedTheme: "light"|"dark"; setTheme(t: Theme): void }`
  - `ThemeScript()` (render inside `<head>`)
  - `ThemeToggle({ className? })`
  - `PageShell({ children, backHref?: string, backLabel?: string, actions?: ReactNode, width?: "sm"|"md"|"lg", className? })`
  - `localStorage` key `"theme"`

- [ ] **Step 1: Register paths (the failing check)**

```json
["src/components/ui", "src/components/theme", "src/app/dev"]
```

Run: `npm run check:theme` → Expected: FAIL, `path not found: …/src/components/theme`

- [ ] **Step 2: `src/components/theme/ThemeScript.tsx`**

```tsx
// รันก่อน paint เพื่อใส่ class .dark ให้ถูกตั้งแต่แรก (กันจอกระพริบ)
const script = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
```

- [ ] **Step 3: `src/components/theme/ThemeProvider.tsx`**

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [systemDark, setSystemDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    setReady(true);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    // ก่อน ready ห้ามแตะ class — ThemeScript ใส่ค่าที่ถูกไว้แล้ว
    if (!ready) return;
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [ready, resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private mode: ยังสลับได้ แค่ไม่จำ
    }
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
```

- [ ] **Step 4: `src/components/theme/ThemeToggle.tsx`**

```tsx
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
```

- [ ] **Step 5: `src/components/theme/index.ts`**

```ts
export { ThemeProvider, useTheme, type Theme } from "./ThemeProvider";
export { ThemeScript } from "./ThemeScript";
export { ThemeToggle } from "./ThemeToggle";
```

- [ ] **Step 6: `src/components/ui/PageShell.tsx`**

```tsx
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
  actions?: ReactNode;
  width?: keyof typeof widths;
  className?: string;
};

export function PageShell({ children, backHref, backLabel = "กลับ", actions, width = "md", className }: PageShellProps) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4">
        {backHref ? (
          <Button href={backHref} variant="ghost" size="sm" icon={<LuArrowLeft aria-hidden />}>
            {backLabel}
          </Button>
        ) : (
          <Link href="/" className="font-heading text-h3 font-bold">
            บอร์ดเกม
          </Link>
        )}
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle />
        </div>
      </header>
      <main className={cn("mx-auto w-full px-4 pb-12", widths[width], className)}>{children}</main>
    </div>
  );
}
```

Append to `src/components/ui/index.ts`:

```ts
export { PageShell } from "./PageShell";
```

- [ ] **Step 7: Wire `src/app/layout.tsx`**

Final `RootLayout`. The font constants from Task 2 stay above it. Add these imports:
- `import { ThemeProvider, ThemeScript } from "@/components/theme";`

```tsx
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
```

`suppressHydrationWarning` is required because `ThemeScript` changes `<html class>` before React hydrates.

- [ ] **Step 8: `src/app/admin/layout.tsx`** (forces light until admin is migrated)

```tsx
// Admin ยังไม่ได้ย้ายมาใช้ธีม — บังคับโหมดสว่างไว้ก่อน ลบไฟล์นี้เมื่อย้าย admin
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-light min-h-screen bg-bg text-fg">{children}</div>;
}
```

- [ ] **Step 9: Showcase. `src/app/dev/ui/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import UiShowcase from "./UiShowcase";

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <UiShowcase />;
}
```

`src/app/dev/ui/UiShowcase.tsx`:

```tsx
"use client";

import { useState } from "react";
import { LuHeart, LuPlus } from "react-icons/lu";
import {
  Alert, Badge, Button, Card, Heading, IconButton, Input, Modal, PageShell, PlayerChip, Select,
  Spinner, Text, Textarea, type ButtonVariant, type Tone,
} from "@/components/ui";

const variants: ButtonVariant[] = ["primary", "secondary", "outline", "ghost", "danger"];
const tones: Tone[] = ["neutral", "primary", "secondary", "success", "warning", "danger"];

export default function UiShowcase() {
  const [open, setOpen] = useState(false);
  const [lockedOpen, setLockedOpen] = useState(false);

  return (
    <PageShell width="lg">
      <div className="space-y-8">
        <section className="space-y-2">
          <Heading level="display">Display 56</Heading>
          <Heading level="h1">หัวข้อ H1</Heading>
          <Heading level="h2">หัวข้อ H2</Heading>
          <Heading level="h3">หัวข้อ H3</Heading>
          <Text>เนื้อหา body ภาษาไทยอ่านง่าย The quick brown fox.</Text>
          <Text variant="small" tone="muted">small / muted</Text>
          <Text variant="caption" tone="subtle">caption / subtle</Text>
          <Text variant="number">42</Text>
        </section>

        <section className="flex flex-wrap gap-3">
          {variants.map((v) => (
            <Button key={v} variant={v}>{v}</Button>
          ))}
          <Button size="sm" icon={<LuPlus />}>sm</Button>
          <Button size="lg">lg</Button>
          <Button loading>loading</Button>
          <Button disabled>disabled</Button>
          <Button href="/" variant="outline">link</Button>
          <IconButton icon={<LuHeart />} label="ชอบ" />
          <Spinner />
        </section>

        <section className="flex flex-wrap gap-2">
          {tones.map((t) => (
            <Badge key={t} tone={t}>{t}</Badge>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>default card</Card>
          <Card variant="muted">muted card</Card>
          <Card variant="primary" interactive>primary interactive</Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Input label="ชื่อผู้เล่น" placeholder="พิมพ์ชื่อ" hint="ไม่เกิน 20 ตัวอักษร" />
          <Input label="รหัสห้อง" defaultValue="12" error="รหัสต้องมี 6 หลัก" />
          <Select label="จำนวนผู้เล่น" defaultValue="4">
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} คน</option>
            ))}
          </Select>
          <Textarea label="ข้อความ" placeholder="เขียนอะไรก็ได้" />
        </section>

        <section className="space-y-3">
          <Alert tone="info" title="วิธีเล่น">สร้างห้องหรือใส่รหัสห้อง 6 หลัก</Alert>
          <Alert tone="success">สำเร็จ</Alert>
          <Alert tone="warning">ระวัง</Alert>
          <Alert tone="danger" title="ผิดพลาด">ไม่พบห้องนี้</Alert>
        </section>

        <section className="grid gap-2 md:grid-cols-2">
          {["สมชาย", "Alice", "บี", "Dan", "เอ", "Fon", "Gus", "หนึ่ง", "Nine"].map((name, i) => (
            <PlayerChip
              key={name}
              name={name}
              colorIndex={i}
              isHost={i === 0}
              status={i % 2 ? <Badge tone="success">พร้อม</Badge> : undefined}
            />
          ))}
        </section>

        <section className="flex gap-3">
          <Button onClick={() => setOpen(true)}>เปิด Modal</Button>
          <Button variant="outline" onClick={() => setLockedOpen(true)}>Modal ปิดไม่ได้</Button>
        </section>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="ตัวอย่าง Modal"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={() => setOpen(false)}>ตกลง</Button>
          </>
        }
      >
        <Input label="ลองพิมพ์" />
      </Modal>
      <Modal open={lockedOpen} onClose={() => setLockedOpen(false)} dismissible={false} title="ต้องเลือกก่อน">
        <Button fullWidth onClick={() => setLockedOpen(false)}>เลือกแล้ว</Button>
      </Modal>
    </PageShell>
  );
}
```

- [ ] **Step 10: Verify**

Run: `npm run check:theme && npm run lint && npm run build`
Expected: all pass. The build output lists `/dev/ui`. In production it returns 404 by design.

Run `npm run dev`, open `http://localhost:3000/dev/ui`, and check:
- [ ] Toggle cycles sun → moon → monitor. Colors switch, and the choice survives a reload with no light/dark flash. Repeat with OS dark mode on and theme set to system.
- [ ] Button hover lifts, press sinks. Ghost has no shadow. Disabled is dimmed. `loading` shows the spinner.
- [ ] Modal: Esc closes, the backdrop closes, Tab stays inside, and focus returns to the "เปิด Modal" button. The locked modal ignores Esc and the backdrop and has no ✕.
- [ ] Text on every colored background is black and readable in both modes.
- [ ] At 375px width there's no horizontal scroll.
- [ ] `/admin/login` renders in light even when the theme is dark.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(theme): add dark/light theme system, PageShell and UI showcase"
```

---

## Task 7: Migrate home page

**Files:**
- Modify: `src/app/page.tsx` (full rewrite below)
- Modify: `scripts/theme-migrated.json` (add `"src/app/page.tsx"`)

**Interfaces:**
- Consumes: `PageShell`, `Card`, `cardClasses`, `buttonClasses`, `Heading`, `Text`, `Alert`, `cn`. `FeedbackModal` keeps the same props (`isOpen`, `onClose`).

- [ ] **Step 1: Add the path and run the check (failing)**

Append `"src/app/page.tsx"` to `scripts/theme-migrated.json`.
Run: `npm run check:theme` → Expected: FAIL with gradient, blur, raw-color, radius, blur-shadow and type-scale hits in `src/app/page.tsx`.

- [ ] **Step 2: Rewrite `src/app/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { FaComments, FaDice, FaGamepad, FaPeopleGroup, FaPlus } from "react-icons/fa6";
import FeedbackModal from "@/components/FeedbackModal";
import { Alert, buttonClasses, Card, cardClasses, Heading, PageShell, Text } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

export default function Home() {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  return (
    <PageShell width="lg">
      <div className="space-y-6 pt-2 md:pt-8">
        <Card padding="lg">
          {/* Logo/Title */}
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-lg border-2 border-ink bg-primary text-primary-on shadow-brutal md:h-20 md:w-20">
              <FaGamepad className="h-8 w-8 md:h-10 md:w-10" />
            </div>
            <Heading level="display" className="mb-2">
              บอร์ดเกม
            </Heading>
            <Text tone="muted" className="md:text-h3">
              เล่นบอร์ดเกมออนไลน์กับเพื่อนๆ
            </Text>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 grid grid-cols-1 gap-3 md:mb-8 md:grid-cols-2 md:gap-4">
            <Link
              href="/create-room"
              className={cn(buttonClasses({ variant: "primary", size: "lg" }), "group h-auto flex-col py-6")}
            >
              <FaPlus className="h-8 w-8 transition-transform duration-modal group-hover:rotate-90" />
              <span>สร้างห้องเกม</span>
              <span className="text-small font-normal">เริ่มเกมใหม่</span>
            </Link>
            <Link
              href="/join-room"
              className={cn(buttonClasses({ variant: "secondary", size: "lg" }), "group h-auto flex-col py-6")}
            >
              <FaPeopleGroup className="h-8 w-8 transition-transform duration-modal group-hover:scale-110" />
              <span>เข้าร่วมห้อง</span>
              <span className="text-small font-normal">ใช้รหัสห้อง</span>
            </Link>
          </div>

          {/* Features */}
          <div className="mb-6 grid grid-cols-1 gap-3 md:mb-8 md:grid-cols-3 md:gap-4">
            <Card variant="muted" padding="sm" className="text-center">
              <FaDice className="mx-auto mb-2 h-7 w-7" />
              <Text className="font-semibold">หลากหลายเกม</Text>
              <Text variant="small" tone="muted">เลือกเกมที่ชอบ</Text>
            </Card>
            <button
              type="button"
              onClick={() => setShowFeedbackModal(true)}
              className={cn(cardClasses({ variant: "primary", padding: "sm", interactive: true }), "text-center")}
            >
              <FaComments className="mx-auto mb-2 h-7 w-7" />
              <span className="block font-semibold">ช่วยปรับปรุง</span>
              <span className="block text-small">แจ้งปัญหา/เพิ่มโจทย์</span>
            </button>
            <Card variant="muted" padding="sm" className="text-center">
              <FaGamepad className="mx-auto mb-2 h-7 w-7" />
              <Text className="font-semibold">เล่นง่าย</Text>
              <Text variant="small" tone="muted">ไม่ต้องติดตั้ง</Text>
            </Card>
          </div>

          <Alert tone="info" title="วิธีเล่น">
            สร้างห้องใหม่เพื่อเริ่มเกม หรือใส่รหัสห้อง 6 หลักเพื่อเข้าร่วมกับเพื่อนๆ
          </Alert>
        </Card>

        <Text variant="small" tone="subtle" className="text-center">
          เล่นได้ฟรี ไม่มีค่าใช้จ่าย
        </Text>
      </div>

      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </PageShell>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run check:theme && npm run lint && npm run build` → Expected: all pass.
Browser `/` in light and dark at 375px and desktop:
- both CTAs navigate
- the feedback card opens FeedbackModal (still old style until Task 8)
- no gradients anywhere

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(theme): migrate home page"
```

---

## Task 8: Migrate shared modals (Age, Feedback, Rules)

**Files:**
- Modify: `src/components/AgeModal.tsx` (131 lines)
- Modify: `src/components/FeedbackModal.tsx` (362 lines, 5 fields, 5 buttons)
- Modify: `src/app/create-room/components/RulesModal.tsx` (108 lines)
- Modify: `scripts/theme-migrated.json`

**Interfaces:**
- Consumes: `Modal`, `Button`, `Input`, `Textarea`, `Select`, `Alert`, `Badge`, `Heading`, `Text`, `cn`.
- Produces: unchanged public props for all three components (`AgeModal` takes none; `FeedbackModal({ isOpen, onClose })`; `RulesModal`'s existing props).

- [ ] **Step 1: Add the paths and run the check (failing)**

Append:

```json
"src/components/AgeModal.tsx",
"src/components/FeedbackModal.tsx",
"src/app/create-room/components/RulesModal.tsx"
```

Run: `npm run check:theme` → Expected: FAIL with hits in all three files.

- [ ] **Step 2: AgeModal**

Keep all state, effects, `handleSelectRange`, and the `AGE_RANGES` data unchanged. Replace the returned JSX:
- Delete the outer `fixed inset-0 … backdrop-blur-sm` div and the gradient header. Return `<Modal open={isOpen} onClose={() => {}} dismissible={false} size="md">`.
- Replace `if (!isOpen) return null;` with nothing; `Modal` handles `open`.
- Header content inside the modal body, centered:
  - a 64px `rounded-full border-2 border-ink bg-primary text-primary-on` circle holding the existing user SVG (change the SVG class to `h-8 w-8`)
  - `<Heading level="h2" className="mb-1 text-center">ยินดีต้อนรับ!</Heading>`
  - `<Text variant="small" tone="muted" className="text-center">…</Text>`
- Each age range button becomes `<Button variant={selectedRange === range.value ? "primary" : "outline"} fullWidth disabled={isSubmitting} onClick={() => handleSelectRange(range.value)} className="justify-start">`, keeping `{range.emoji} {range.label}`.
- Error → `<Alert tone="danger">{error}</Alert>`.
- Any remaining text sizes and colors follow the Class Mapping Reference.

- [ ] **Step 3: FeedbackModal**

Keep all logic, state, submit handler and Firebase calls. Then:
- Replace the overlay and panel with `<Modal open={isOpen} onClose={onClose} title={…existing title text…} size="lg" footer={…}>`.
  - Remove the hand-rolled close button and Esc handling, if present.
  - The footer holds the existing cancel button as `<Button variant="outline" onClick={onClose}>` and submit as `<Button type="submit" form="feedback-form" loading={isSubmitting}>`.
  - Give the `<form>` the id `feedback-form`.
- Type/category selector buttons (if they're toggle buttons): `<Button variant={selected ? "primary" : "outline"} size="sm">`. If they're a `<select>`, use `<Select label=…>`.
- Every `<input>` → `<Input label=… value onChange … />`, every `<textarea>` → `<Textarea label=… />`. Pass the existing `placeholder`, `maxLength`, `required` and `disabled` props through unchanged. Remove the separate `<label>` elements, which are now the `label` prop.
- Success/error messages → `<Alert tone="success">` / `<Alert tone="danger">`.

- [ ] **Step 4: RulesModal**

Keep its props and content. Then:
- Replace the overlay and panel with `<Modal open={…existing open prop…} onClose={…existing close prop…} title={…} size="lg" footer={<Button onClick={onClose}>…existing close label…</Button>}>`.
- The 3 gradient section headers or blocks → `<Card variant="muted" padding="sm">` with `<Heading level="h3">`. Numbered steps use a `Badge tone="primary"` for the number.

- [ ] **Step 5: Verify**

Run: `npm run check:theme && npm run lint && npm run build` → Expected: all pass.
In the browser, check each item in light and dark:
- [ ] AgeModal: clear `localStorage` (the key used by `src/lib/utils/ageStorage.ts`) and load `/`. The modal shows, can't be dismissed by Esc or backdrop, and selecting a range closes it. It doesn't show on `/admin/login`.
- [ ] FeedbackModal: open it from home and fill it in. Validation errors show, submit works (or shows the existing error state), and Esc/✕/cancel all close it.
- [ ] RulesModal: open it from `/create-room` and confirm it scrolls when long.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(theme): rebuild Age, Feedback and Rules modals on Modal"
```

---

## Task 9: Migrate create-room and join-room

**Files:**
- Modify: `src/app/create-room/page.tsx` (316 lines)
- Modify: `src/app/create-room/components/GameSelector.tsx`, `MaxPlayersSelector.tsx`, `PlayerNameInput.tsx`, `TimeLimitInput.tsx`
- Modify: `src/app/join-room/page.tsx` (298 lines, 2 inputs)
- Modify: `scripts/theme-migrated.json`

**Interfaces:**
- Consumes: `PageShell`, `Card`, `cardClasses`, `Button`, `Input`, `Select`, `Badge`, `Alert`, `Spinner`, `Heading`, `Text`, `cn`.
- Produces: unchanged props for every create-room sub-component.

- [ ] **Step 1: Add the paths and run the check (failing)**

Append `"src/app/create-room"` (the directory; RulesModal there is already clean) and `"src/app/join-room"`.
Run: `npm run check:theme` → Expected: FAIL listing hits in the 6 files.

- [ ] **Step 2: create-room page**

- Page root → `<PageShell backHref="/" width="sm">`. Remove the existing back link if the header now provides it. If the page has its own back button with custom behavior, keep it as `<Button variant="ghost">` and don't pass `backHref`.
- Main panel → `<Card padding="lg">`, title → `<Heading level="h1">`.
- Submit (gradient, with inline SVG spinner at line ~269) → `<Button type="submit" size="lg" fullWidth loading={…existing loading state…}>`. Delete the inline SVG.
- Error block → `<Alert tone="danger">`.
- Rules link/button → `<Button variant="ghost" size="sm">`.

- [ ] **Step 3: create-room components**

- `PlayerNameInput` → `<Input label=… value onChange maxLength placeholder />` with the same props interface.
- `TimeLimitInput` → `<Input type="number" label=… hint=… />` (or `<Select>` if it's currently a select).
- `MaxPlayersSelector` → if it renders a `<select>`, use `<Select>`. If it renders a range or number input, use `<Input>`. If it renders a row of choice buttons, use `<Button size="sm" variant={selected ? "primary" : "outline"}>`.
- `GameSelector` → each game option is a `<button className={cn(cardClasses({ variant: selected ? "primary" : "default", padding: "sm", interactive: true }), "text-left")}>`. The loading spinner SVG becomes `<Spinner size="sm" />`, and "coming soon"/badge states become `<Badge>`.

- [ ] **Step 4: join-room page**

- Same shell: `<PageShell backHref="/" width="sm">` + `<Card padding="lg">` + `<Heading level="h1">`.
- Room code input → `<Input label=… inputMode="numeric" maxLength={6} className="text-center font-number text-h2 tracking-[0.3em]" />`. Player name input → `<Input>`.
- Submit → `<Button type="submit" size="lg" fullWidth loading=…>` (secondary variant, to match the home "join" CTA). Delete the inline SVG spinner.
- Errors → `<Alert tone="danger">`.

- [ ] **Step 5: Verify**

Run: `npm run check:theme && npm run lint && npm run build` → Expected: pass.
Browser, light and dark at 375px:
- [ ] Create a room end to end. You land in the lobby.
- [ ] Validation errors show.
- [ ] Join with a wrong code shows the error, and join with the right code works.
- [ ] Number fields still accept digits only, as before.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(theme): migrate create-room and join-room"
```

---

## Task 10: Migrate lobby

**Files:**
- Modify: `src/app/lobby/[roomId]/page.tsx` (598 lines: 9 gradients, 8 buttons, 1 input, a `<style jsx>` block at ~580)
- Modify: `scripts/theme-migrated.json`

**Interfaces:**
- Consumes: `PageShell`, `Card`, `Button`, `IconButton`, `Input`, `Select`, `Badge`, `PlayerChip`, `Alert`, `Spinner`, `Heading`, `Text`, `Modal` (only if the page has inline dialogs), `cn`.

- [ ] **Step 1: Add the path and run the check (failing)**

Append `"src/app/lobby"`. Run: `npm run check:theme` → Expected: FAIL with hits in the lobby page.

- [ ] **Step 2: Migrate**

- Root → `<PageShell width="md" actions={…leave-room button if present, as <Button variant="danger" size="sm">…}>`.
- Room code panel → `<Card variant="primary" padding="md">`. Show the code in `font-number text-h1 md:text-h1-lg font-bold tracking-widest`. The copy/share button → `<IconButton>` / `<Button variant="outline" size="sm">`.
- Player list rows (line ~453, which uses `animate-fadeIn`) → `<PlayerChip name={player.name} colorIndex={index} isHost={…existing host check…} status={…ready badge: <Badge tone="success">พร้อม</Badge> / <Badge>รอ</Badge>…} className="animate-fade-in" />`. If a row has extra controls (kick, edit name with `LuPencil`/`LuCheck`/`LuX`), put them in `status` as `<IconButton size="sm" variant="ghost">`. The inline name-edit `<input>` → `<Input aria-label="ชื่อผู้เล่น" className="h-9" />`, with no `label`, to keep the row compact.
- Settings panel (host) → `<Card>` with `<Heading level="h3">`. Fields → `<Select>`/`<Input>`.
- Start button → `<Button size="lg" fullWidth disabled=… loading=…>`. Ready toggle → `<Button variant={isReady ? "outline" : "primary"} size="lg" fullWidth>`.
- Delete the `<style jsx>` block (keyframes `fadeIn` + `.animate-fadeIn`). Replace every `animate-fadeIn` with `animate-fade-in`.
- Error/loading states → `<Alert>` / centered `<Spinner size="lg" />`.

- [ ] **Step 3: Verify**

Run: `npm run check:theme && npm run lint && npm run build` → Expected: pass.
Browser, using 2 windows (one host, one guest, one of them in a private window), in light and dark:
- [ ] Players appear live, each in a different player color, with the host badge on the host.
- [ ] Ready toggling and the settings update sync.
- [ ] Name edit works.
- [ ] Start begins the game.
- [ ] Leaving works.
- [ ] 375px has no horizontal scroll.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(theme): migrate lobby"
```

---

## Task 11: Migrate game page and ito shell components

**Files:**
- Modify: `src/app/game/[roomId]/page.tsx` (254 lines, 4 gradients, `<style jsx>` at ~235, pulse dot at ~131)
- Modify: `src/components/games/ItoGame.tsx` (529 lines)
- Modify: `src/components/games/ito/GameHeader.tsx`, `MyNumbersDisplay.tsx`, `PlayerStatusTracker.tsx`, `RevealedNumbersList.tsx`
- Modify: `scripts/theme-migrated.json`

**Interfaces:**
- Consumes: `Card`, `Badge`, `PlayerChip`, `Text`, `Heading`, `Spinner`, `Alert`, `Button`, `ThemeToggle`, `cn`.
- Produces: unchanged props for every ito component.

- [ ] **Step 1: Add the paths and run the check (failing)**

Append these paths:

```json
"src/app/game",
"src/components/games/ItoGame.tsx",
"src/components/games/ito/GameHeader.tsx",
"src/components/games/ito/MyNumbersDisplay.tsx",
"src/components/games/ito/PlayerStatusTracker.tsx",
"src/components/games/ito/RevealedNumbersList.tsx"
```

Run: `npm run check:theme` → Expected: FAIL.

- [ ] **Step 2: Game page**

- Root → `min-h-screen bg-bg text-fg`. The game has its own header (GameHeader), so don't use PageShell here. Put a `<ThemeToggle />` into GameHeader instead (Step 3).
- Delete the `<style jsx>` block and replace `animate-fadeIn` with `animate-fade-in`.
- Live dot (`bg-green-400 animate-pulse`) → `bg-success animate-pulse border border-ink`.
- Loading/error states → `<Spinner size="lg" />` / `<Alert tone="danger">` + `<Button href="/">กลับหน้าแรก</Button>`.

- [ ] **Step 3: GameHeader**

- Container → `<Card padding="sm" className="flex items-center justify-between gap-3">`. The 2 gradients become a level indicator `<Badge tone="primary">` and a hearts/lives indicator `<Badge tone="danger">` with the existing icons and counts.
- Topic/question text → `<Heading level="h3">`.
- Add `<ThemeToggle />` at the right end.

- [ ] **Step 4: MyNumbersDisplay**

```tsx
<Card variant="primary" padding="md" className="text-center">
  <Text variant="small" className="mb-2 text-primary-on">…existing label…</Text>
  <div className="flex flex-wrap justify-center gap-3 md:gap-4">
    {/* for each number */}
    <div className="text-center">
      <div className="min-w-[5rem] rounded-md border-2 border-ink bg-surface px-3 py-2 text-fg shadow-brutal-sm">
        <span className="font-number text-number md:text-number-lg font-bold tabular-nums">{n}</span>
      </div>
      {/* existing sub-label → */}
      <Text variant="caption" className="mt-1 text-primary-on">…</Text>
    </div>
  </div>
</Card>
```

Keep the existing map, keys and conditional logic.

- [ ] **Step 5: PlayerStatusTracker and RevealedNumbersList**

- PlayerStatusTracker: each player → `<PlayerChip name colorIndex={index} status={<Badge tone={done ? "success" : "neutral"}>…existing label…</Badge>} />` in a `grid gap-2`.
- RevealedNumbersList: the gradient chip per revealed number becomes `<span className="inline-flex flex-col items-center rounded-md border-2 border-ink bg-surface px-3 py-2 shadow-brutal-sm">` with the number in `font-number text-h2 font-bold` and the player name in `<Text variant="caption" tone="muted">`. If the old style colors chips per player, put a `h-2 w-full rounded-full` bar with `style={{ backgroundColor: getPlayerColor(index) }}` on top.

- [ ] **Step 6: ItoGame**

The check script gives the exact lines. Apply the Class Mapping Reference. Phase containers → `Card`. Status text → `Badge`/`Text`.

- [ ] **Step 7: Verify**

Run: `npm run check:theme && npm run lint && npm run build` → Expected: pass.
Browser: start a game with 2 players and check light and dark at 375px:
- [ ] header, numbers and status tracker render
- [ ] the theme toggle in the header works
- [ ] numbers are large and readable

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(theme): migrate game page and ito shell components"
```

---

## Task 12: Migrate ito phases

**Files:**
- Modify: `src/components/games/ito/phases/WritingPhase.tsx` (223 lines: 3 gradients, 1 input, 4 buttons)
- Modify: `src/components/games/ito/phases/VotingPhase.tsx` (368 lines: 7 gradients, 1 input, 5 buttons)
- Modify: `src/components/games/ito/phases/RevealPhase.tsx` (188 lines: hand-rolled modal at lines 72–76)
- Modify: `src/components/games/ito/phases/LevelCompletePhase.tsx` (272 lines)
- Modify: `src/components/games/ito/phases/FinishedPhase.tsx` (171 lines)
- Modify: `scripts/theme-migrated.json`

**Interfaces:**
- Consumes: `Card`, `Button`, `Input`, `Textarea`, `Badge`, `PlayerChip`, `Alert`, `Modal`, `Heading`, `Text`, `getPlayerColor`, `cn`.
- Produces: unchanged phase props.

- [ ] **Step 1: Add the path and run the check (failing)**

Append `"src/components/games"` (the whole folder; earlier files are already clean) and remove the now-redundant individual `src/components/games/...` entries. Run: `npm run check:theme` → Expected: FAIL in the 5 phase files only.

- [ ] **Step 2: WritingPhase**

- Answer input → `<Input>` (or `<Textarea>` if multi-line) with `label`, keeping `value`, `onChange`, `maxLength` and the submit-on-Enter behavior.
- Submit → `<Button size="lg" fullWidth loading=…>`. Edit/cancel → `variant="outline"`.
- The submitted state panel → `<Alert tone="success">`.

- [ ] **Step 3: VotingPhase**

- Each answer card the players order or vote on becomes `<button className={cn(cardClasses({ variant: selected ? "primary" : "default", padding: "sm", interactive: true }), "text-left")}>`. Show the author with a `<PlayerChip>` or a color dot from `getPlayerColor(index)`.
- Vote/confirm → `<Button size="lg">`. Secondary actions → `variant="outline"`. Destructive → `variant="danger"`.
- Vote counts → `<Badge tone="secondary">`.

- [ ] **Step 4: RevealPhase**

- Lines 72–76 (backdrop `fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]` + panel `fixed inset-0 z-[70]` + gradient glass card) → one `<Modal open={…the condition that currently renders it…} onClose={…existing close handler…} size="md">`.
  - If the current overlay has no way to close (it's driven purely by game state), pass `dismissible={false}` and `onClose={() => {}}`.
- The revealed number → `font-number text-number md:text-number-lg font-bold` inside a `rounded-lg border-2 border-ink bg-primary text-primary-on` block.
- Right/wrong result → `<Alert tone="success">` / `<Alert tone="danger">`.

- [ ] **Step 5: LevelCompletePhase and FinishedPhase**

- Title → `<Heading level="display" className="text-center">`. Summary → `<Card padding="lg">`.
- Score and lives → `<Badge>`s. The next level / play again button → `<Button size="lg" fullWidth>`, and back to lobby/home → `<Button variant="outline" href=…>`.
- The per-player results list → `<PlayerChip>`s.

- [ ] **Step 6: Verify**

Run: `npm run check:theme && npm run lint && npm run build` → Expected: pass.
Browser: play one full round with 2 players (writing → voting → reveal → level complete → finished) in light and in dark, at 375px:
- [ ] every phase advances as before
- [ ] the reveal modal shows and closes as before
- [ ] no gradients or blur remain

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(theme): migrate ito game phases"
```

---

## Task 13: Final verification

**Files:**
- Modify: none (fixes only if a check fails)

- [ ] **Step 1: Full automated pass**

Run: `npm run test:theme && npm run check:theme && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 2: Repo-wide leftovers outside admin**

Run:

```bash
grep -rnE "bg-gradient|backdrop-blur|Kanit|bootstrap" src --exclude-dir=admin
```

Expected: no output.

- [ ] **Step 3: Manual matrix**

Check every route in this list: `/`, `/create-room`, `/join-room`, `/lobby/[id]`, `/game/[id]`, all 5 phases, the 3 modals, `/dev/ui`, `/admin/login`.

Check each one under all of these conditions:
- light, dark, and system with OS dark
- 375px and ≥1280px wide
- hard reload, which must not flash

Admin must render light with colors unchanged (font and radius shifts are expected per the spec).

- [ ] **Step 4: Commit fixes (if any)**

```bash
git add -A
git commit -m "fix(theme): final verification fixes"
```

## Follow-up (not this plan)

- Migrate `/admin/**` to the theme, then delete the legacy `xl`/`2xl`/`3xl` radius keys and `src/app/admin/layout.tsx`.
