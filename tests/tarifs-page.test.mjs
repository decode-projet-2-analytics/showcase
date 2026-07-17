import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/pages/tarifs.astro", import.meta.url), "utf8");

test("pricing buttons identify the selected plan", () => {
  assert.match(source, /data-purchase-plan=\{plan\.name\}/);
});

test("pricing page exposes an accessible purchase status", () => {
  assert.match(source, /role="status"/);
  assert.match(source, /aria-live="polite"/);
});

test("pricing page sends purchases to the private server route", () => {
  assert.match(source, /fetch\("\/api\/demo-purchase"/);
  assert.match(source, /sessionStorage/);
  assert.match(source, /crypto\.randomUUID\(\)/);
});
