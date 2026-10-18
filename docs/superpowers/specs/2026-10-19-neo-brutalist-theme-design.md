# Neo-brutalist Theme & UI Components — Design

Date: 2026-10-19
Status: Approved in brainstorming, pending spec review

## Goal

Give the app a distinctive, consistent visual identity (neo-brutalist), with light and dark modes, built from design tokens and shared UI components so a theme change is made in one place.

Constraints:
- No gradients, no `backdrop-blur`/glassmorphism, no translucent layered backgrounds.
- Every color token has a light and a dark value (a token may use the same value in both).
- Stay on Tailwind 3 (no framework migration this round).

## Current state (2026-10-19)

- Tailwind 3.4, font Kanit via `next/font`, no dark mode.
- 51 `bg-gradient` usages, glassmorphism on home page.
- Font sizes span `text-xs`…`text-8xl`; radius spans `rounded`…`rounded-3xl`.
- Colors are raw palette classes (`gray`, `slate`, `blue`, `green`, `red`…). `src/lib/colors.ts` defines lime/neon-blue but nothing uses them.
- No shared Button/Card/Modal; 8 hand-rolled modals.
- `bootstrap` is installed but unused.

## Approach

CSS variables for every token in `src/app/globals.css` (`:root` = light, `.dark` = dark). `tailwind.config.ts` maps them to semantic utility names (`bg-surface`, `text-fg-muted`, `border-ink`, `shadow-brutal`, `text-h1`, `font-heading`). `darkMode: 'class'`. Pages use semantic utilities only, via shared components where one exists.

Rejected: Tailwind 4 `@theme` migration (too much risk for this round); shadcn/Radix (extra deps, would need full restyle anyway).

## 1. Tokens

### Color

Colors are stored as RGB channels (e.g. `--color-primary: 203 255 73`) so Tailwind opacity modifiers keep working.

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#FCF7F8` | `#0F0F10` | page background |
| `surface` | `#FFFFFF` | `#1A1A1C` | cards, modals, inputs |
| `surface-muted` | `#F3F0EA` | `#26262A` | secondary panels, disabled |
| `fg` | `#0A0A0A` | `#F5F5F2` | primary text |
| `fg-muted` | `#4A4A4A` | `#B4B4B0` | secondary text |
| `fg-subtle` | `#6B6B6B` | `#7D7D78` | captions, placeholders |
| `ink` | `#0A0A0A` | `#D9D9D4` | all borders and hard shadows |
| `primary` / `on-primary` | `#CBFF49` / `#0A0A0A` | same | main actions, highlights |
| `secondary` / `on-secondary` | `#5473FF` / `#0A0A0A` | `#7B93FF` / `#0A0A0A` | secondary actions, info |
| `success` | `#3DDC84` | same | text on it: `#0A0A0A` |
| `warning` | `#FFC93C` | same | text on it: `#0A0A0A` |
| `danger` | `#FF5A5F` | same | text on it: `#0A0A0A` |
| `backdrop` | `#0A0A0A` | `#000000` | modal backdrop (used at 60%) |

Note: `on-secondary` is black, not white. White on `#5473FF` is about 4.2:1, below WCAG AA for 16px text. Black is about 5:1.

Player colors (`player-1`…`player-8`, black text on all):
`#CBFF49` lime, `#5473FF` blue, `#FF5A5F` red, `#FFC93C` yellow, `#3DDC84` green, `#FF8A3D` orange, `#B57BFF` purple, `#4DD4E8` cyan.

### Typography

Fonts (all via `next/font/google`, Thai + Latin subsets, exposed as CSS variables):
- `font-heading`: Bai Jamjuree (600, 700)
- `font-body` (default `sans`): Anuphan (400, 600, 700)
- `font-number`: Space Grotesk (700), with `tabular-nums`

Kanit is removed.

Type scale (Tailwind `fontSize` keys, each with line-height; responsive steps are applied by `Heading`/`Text`):

| Key | Mobile → md+ | Font / weight |
|---|---|---|
| `display` | 36px → 56px | heading 700 |
| `h1` | 28px → 36px | heading 700 |
| `h2` | 22px → 28px | heading 700 |
| `h3` | 18px → 20px | heading 600 |
| `body` | 16px | body 400 |
| `small` | 14px | body 400 |
| `caption` | 12px | body 600 |
| `number` | 64px → 96px | number 700 |

Weights: 400 / 600 / 700 only.

### Radius

`sm` 6px (badges), `md` 12px (buttons, inputs), `lg` 16px (cards, modals), `full`. The `borderRadius` theme is replaced, not extended. Legacy `xl`, `2xl` and `3xl` map to 16px and `DEFAULT` maps to 6px temporarily, so admin pages don't break. Remove them when admin is migrated.

### Border, shadow, motion

- Border: 2px `ink` only (`border-2 border-ink`).
- Shadows: hard offset with no blur, color `ink`. `shadow-brutal-sm` 2px 2px, `shadow-brutal` 4px 4px, `shadow-brutal-lg` 6px 6px. Default Tailwind blurred shadows are not used in migrated files.
- Interaction (interactive elements): hover translates −2px/−2px and steps the shadow up one size. Active translates +2px/+2px with the shadow removed. Focus-visible shows a 3px `secondary` outline with 2px offset.
- Motion: 120ms ease-out (press/hover), 200ms ease-out (modal enter/exit). Respect `prefers-reduced-motion` (no translate).
- z-index tokens: `z-modal` 50, `z-toast` 60.

### Dark / light mode

- Default follows the system preference. A user choice (`light` | `dark` | `system`) is stored in `localStorage` key `theme`.
- `ThemeScript` is an inline script in `<head>` that sets the `dark` class before paint, so the page doesn't flash on load.
- `ThemeProvider` is a React context exposing `theme`, `resolvedTheme` and `setTheme`. It listens to system changes while set to `system`.
- `ThemeToggle` is an `IconButton` that cycles light → dark → system.
- `/admin/*` is forced to light until admin is migrated, via the admin layout or page wrapper setting `data-force-light`.

## 2. Structure and components

```
src/app/globals.css               tokens (:root, .dark), base styles
tailwind.config.ts                semantic mapping
src/lib/theme/playerColors.ts     player colors for JS use (replaces src/lib/colors.ts)
src/lib/utils/cn.ts               clsx + tailwind-merge helper
src/components/theme/             ThemeProvider, ThemeScript, ThemeToggle
src/components/ui/                shared components + index.ts barrel
```

All components accept `className`, which is merged with `cn()` so caller classes override defaults, and they forward native props.

| Component | Key props |
|---|---|
| `Button` | `variant`: primary · secondary · outline · ghost · danger; `size`: sm · md · lg; `href` (renders `next/link`); `loading`; `icon`; `fullWidth` |
| `IconButton` | `icon`, `label` (required, aria-label), `variant`, `size` |
| `Card` | `variant`: default · muted · primary; `padding`: sm · md · lg; `interactive` |
| `Modal` | `open`, `onClose`, `title`, `footer`, `size`: sm · md · lg. Esc and backdrop click close it, body scroll is locked, focus moves into the modal and returns afterwards. `dismissible` (default `true`; when `false` there is no close button and Esc and backdrop do nothing, e.g. AgeModal). Backdrop is solid `backdrop` at 60% opacity, no blur. |
| `Input` / `Textarea` / `Select` | `label`, `error`, `hint`, plus native props |
| `Badge` | `tone`: neutral · primary · secondary · success · warning · danger |
| `PlayerChip` | `name`, `colorIndex`, `isHost`, `status` |
| `Alert` | `tone`, `title`, `children` |
| `Spinner` | `size` |
| `Heading` | `level` (display · h1 · h2 · h3), `as` |
| `Text` | `variant` (body · small · caption · number), `tone` (default · muted · subtle), `as` |
| `PageShell` | page container plus a header with the logo/back link and `ThemeToggle` |

Dependencies: add `clsx` and `tailwind-merge`; remove `bootstrap`.

## 3. Migration scope (this round)

Migrate to tokens and components:
- `src/app/page.tsx`, `src/app/create-room/**`, `src/app/join-room/page.tsx`, `src/app/lobby/[roomId]/page.tsx`, `src/app/game/[roomId]/page.tsx`
- `src/components/games/**` (ItoGame, ito components, all phases)
- `src/components/AgeModal.tsx`, `src/components/FeedbackModal.tsx`, `src/app/create-room/components/RulesModal.tsx`, rebuilt on `Modal`

Rules for migrated files:
- No `bg-gradient*`, `from-*`/`via-*`/`to-*`, or `backdrop-blur*`.
- No raw palette colors (`(bg|text|border|ring|from|to)-(gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+`, `white`, `black`).
- No `rounded-xl/2xl/3xl` and no blurred `shadow-*`.
- Text sizes only from the type scale.

Behavior (game logic, hooks, Firebase) is unchanged. This is visual only.

Out of scope: `src/components/reactbits/RotatingText.tsx` (imported nowhere, and it has no theme classes), `src/app/admin/**` (separate follow-up task) and any change to game flow.

## 4. Verification

The project has no test framework. Verify with:
1. `npm run build` and `npm run lint` pass.
2. `npm run check:theme`: a Node script that scans the migrated paths for the forbidden patterns above and exits non-zero on any match.
3. Manual browser pass on every migrated page in light, dark and system modes, at 375px and desktop widths. Check:
   - no flash on reload
   - toggle persists
   - modals: Esc, backdrop and focus behave correctly
   - text contrast is readable
4. Admin pages still render correctly in light mode, even when the system or user preference is dark. Their colors are unchanged. The font changes to Anuphan. Radius shifts slightly because `sm`/`md`/`lg`/`DEFAULT` change value globally. Both changes are accepted.
