import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(root, "app", "page.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "app", "globals.css"), "utf8");

test("PrayerPanel is integrated through the existing overlay mechanism", () => {
  assert.match(
    page,
    /import \{ PrayerPanel \} from "\.\/prayer-panel";/,
  );
  assert.match(
    page,
    /"Foundations" \| "Prayer" \| null/,
  );
  assert.match(
    page,
    /overlay === "Prayer" && \([\s\S]*?<PrayerPanel onClose=\{\(\) => setOverlay\(null\)\} \/>/,
  );
});

test("Prayer and Qibla is discoverable from Home and More", () => {
  const opens = page.match(/setOverlay\("Prayer"\)/g) ?? [];
  assert.equal(opens.length, 3);
  assert.match(page, /<strong>Prayer &amp; Qibla<\/strong>/);
  assert.match(page, /Local Salah times and Qibla direction/);
});

test("Prayer does not become a desktop or mobile primary navigation item", () => {
  const navItem = page.match(/type NavItem = ([^;]+);/)?.[1] ?? "";
  const mobileNavItem = page.match(/type MobileNavItem = ([^;]+);/)?.[1] ?? "";

  assert.doesNotMatch(navItem, /Prayer/);
  assert.doesNotMatch(mobileNavItem, /Prayer/);

  const mobileItems =
    page.match(/const MOBILE_NAV_ITEMS:[\s\S]*?=\s*\[([\s\S]*?)\];/)?.[1] ?? "";

  assert.doesNotMatch(mobileItems, /Prayer/);
  assert.equal((mobileItems.match(/label:/g) ?? []).length, 5);
});

test("Prayer overlay maps to existing active navigation destinations", () => {
  assert.match(
    page,
    /overlay === "Foundations" \|\| overlay === "Prayer" \? "Read"/,
  );
  assert.match(
    page,
    /overlay === "Settings" \|\| overlay === "Prayer" \? "More" : "Read"/,
  );
});

test("Prayer styling remains explicitly namespaced", () => {
  assert.match(css, /\/\* M12\.1 PRAYER & QIBLA \*\//);
  assert.match(css, /\.prayer-panel\b/);
  assert.match(css, /\.prayer-panel-content\b/);
  assert.match(css, /\.prayer-qibla-card\b/);
  assert.match(css, /\.prayer-times-card\b/);
});
