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
