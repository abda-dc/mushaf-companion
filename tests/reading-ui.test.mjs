import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DEFAULT_READING_ID,
  QURAN_READINGS,
} from "../app/reading-registry.mjs";

test("M11.4 exposes a registry-backed Quran-reading control separate from reciters", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.equal(QURAN_READINGS.length, 1);
  assert.equal(QURAN_READINGS[0].id, DEFAULT_READING_ID);

  assert.match(page, /<h3>Quran reading<\/h3>/);
  assert.match(page, /aria-label="Quran reading"/);
  assert.match(page, /const RUNTIME_SELECTABLE_READINGS = QURAN_READINGS\.filter/);
  assert.match(page, /reading\.id === DEFAULT_READING_ID/);
  assert.match(page, /RUNTIME_SELECTABLE_READINGS\.map\(\(reading\) =>/);
  assert.match(page, /disabled=\{RUNTIME_SELECTABLE_READINGS\.length === 1\}/);

  const readingSection = page.indexOf("<h3>Quran reading</h3>");
  const audioSection = page.indexOf("<h3>Audio</h3>");

  assert.ok(readingSection >= 0);
  assert.ok(audioSection > readingSection);
});

test("M11.4 active reading drives edition, page loading, verification, cache, and fallback identity", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /useState<ReadingId>\(DEFAULT_READING_ID\)/);
  assert.match(page, /registeredReadingForId\(activeReadingId\)/);
  assert.match(page, /resolveQuranPageEdition\(activeReadingId\)/);
  assert.match(page, /const totalPages = activePageEdition\.pages/);
  assert.match(page, /quranPageCacheKey\(activeReadingId, page\)/);
  assert.match(page, /loadPageForReading\(activeReadingId, page\)/);
  assert.match(page, /isVerifiedPage\(data, page, activeReadingId\)/);
  assert.match(page, /new Map<ReadingId, QuranPage>/);
  assert.match(page, /lastGoodPageRef\.current\.get\(activeReadingId\)/);
});

test("M11.4 hydration and navigation respect edition page limits", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(
    page,
    /const DEFAULT_PAGE_EDITION = resolveQuranPageEdition\(DEFAULT_READING_ID\)/,
  );
  assert.match(page, /DEFAULT_PAGE_EDITION\.pages/);
  assert.match(page, /clampPage\(target, totalPages\)/);
  assert.match(page, /const nextEdition = resolveQuranPageEdition\(nextReadingId\)/);
  assert.match(page, /isRuntimeSelectableReadingId\(nextReadingId\)/);
});

test("M11.4 labels the active reading while preserving separate reciter UX", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /READING \{activeReading\.label\}/);
  assert.match(page, /Madani Mushaf .*activeReading\.label/);
  assert.match(page, /<strong>Default reciter<\/strong>/);
  assert.match(page, /aria-label="Default reciter"/);
  assert.match(
    page,
    /Mushaf text and page layout are selected here, separately from the reciter\./,
  );
});

test("M11.4 denies unknown readings and deliberately leaves preference schema v8 unchanged", async () => {
  const [page, preferences] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/preferences.mjs", import.meta.url), "utf8"),
  ]);

  assert.match(page, /isSupportedReadingId\(nextReadingId\)/);
  assert.match(page, /isRuntimeSelectableReadingId\(nextReadingId\)/);
  assert.match(
    page,
    /That Quran reading is not available in this verified Mushaf build\./,
  );

  assert.match(preferences, /PREFERENCE_SCHEMA_VERSION = 8/);
  assert.doesNotMatch(preferences, /\bactiveReadingId\b/);
  assert.doesNotMatch(preferences, /\breadingId\b/);
  assert.doesNotMatch(preferences, /\bqiraah\b/);
  assert.doesNotMatch(preferences, /\briwayah\b/);
});
