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
