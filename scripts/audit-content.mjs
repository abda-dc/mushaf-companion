import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const API_ROOT = "https://api.quran.com/api/v4";
const TOTAL_PAGES = 604;
const CONCURRENCY = 4;
const fixtureFile = new URL("../tests/fixtures/page-fidelity.json", import.meta.url);
const outputFile = new URL("../docs/content-audit.json", import.meta.url);

function checksum(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function fetchJson(url, attempt = 1) {
  try {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (attempt >= 5) throw error;
    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    return fetchJson(url, attempt + 1);
  }
}

async function auditPage(page) {
  const query = new URLSearchParams({
    mushaf: "1",
    words: "true",
    fields: "text_uthmani,sajdah_number",
    word_fields: "line_number,page_number",
    per_page: "50",
  });
  const payload = await fetchJson(`${API_ROOT}/verses/by_page/${page}?${query}`);
  const verses = payload.verses ?? [];
  if (!verses.length) throw new Error(`Page ${page} has no verses.`);
  const words = verses.flatMap((verse) => verse.words ?? []);
  if (!words.length || words.some((word) => word.page_number !== page || word.line_number < 1 || word.line_number > 15)) {
    throw new Error(`Page ${page} has an invalid word-to-line mapping.`);
  }
  if (verses.some((verse) => !/^\d{1,3}:\d{1,3}$/.test(verse.verse_key))) throw new Error(`Page ${page} has an invalid verse key.`);
  const occupied = [...new Set(words.map((word) => word.line_number))].sort((a, b) => a - b);
  const summary = {
    page,
    firstVerse: verses[0].verse_key,
    lastVerse: verses.at(-1).verse_key,
    verseCount: verses.length,
    wordCount: words.length,
    firstContentLine: occupied[0],
    lastContentLine: occupied.at(-1),
    occupiedLines: occupied.length,
    chapterStarts: verses.filter((verse) => verse.verse_number === 1).map((verse) => verse.verse_key),
    sajdahVerses: verses.filter((verse) => verse.sajdah_number != null).map((verse) => verse.verse_key),
  };
  return {
    ...summary,
    verseKeys: verses.map((verse) => verse.verse_key),
    checksum: checksum({ summary, verses: verses.map((verse) => ({ key: verse.verse_key, text: verse.text_uthmani, words: verse.words.map((word) => [word.id, word.line_number, word.page_number, word.text]) })) }),
  };
}

async function auditAllPages() {
  const pages = Array.from({ length: TOTAL_PAGES }, (_, index) => index + 1);
  const results = new Array(TOTAL_PAGES);
  let cursor = 0;
  async function worker() {
    while (cursor < pages.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await auditPage(pages[index]);
      if ((index + 1) % 25 === 0 || index + 1 === TOTAL_PAGES) process.stdout.write(`Audited ${index + 1}/${TOTAL_PAGES}\n`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return results;
}

const fixtures = JSON.parse(await readFile(fixtureFile, "utf8")).fixtures;
const pages = await auditAllPages();
for (const expected of fixtures) {
  const actual = pages[expected.page - 1];
  for (const field of ["firstVerse", "lastVerse", "verseCount", "wordCount", "firstContentLine", "lastContentLine", "occupiedLines"]) {
    if (actual[field] !== expected[field]) throw new Error(`Fixture mismatch on page ${expected.page}: ${field}`);
  }
  if (JSON.stringify(actual.chapterStarts) !== JSON.stringify(expected.chapterStarts) || JSON.stringify(actual.sajdahVerses) !== JSON.stringify(expected.sajdahVerses)) {
    throw new Error(`Fixture boundary mismatch on page ${expected.page}.`);
  }
}

const uniqueVerseKeys = new Set(pages.flatMap((page) => page.verseKeys));
if (uniqueVerseKeys.size !== 6236) throw new Error(`Expected 6,236 unique verse keys; audited ${uniqueVerseKeys.size}.`);

const report = {
  schemaVersion: 1,
  auditedAt: new Date().toISOString(),
  source: `${API_ROOT} - Mushaf ID 1`,
  pagesAudited: pages.length,
  versesVerified: uniqueVerseKeys.size,
  representativeFixtures: fixtures.map((fixture) => fixture.page),
  pageChecksums: Object.fromEntries(pages.map((page) => [page.page, page.checksum])),
  corpusChecksum: checksum(pages.map((page) => page.checksum)),
  status: "passed",
};
await writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`Content audit passed - ${report.corpusChecksum}\n`);
