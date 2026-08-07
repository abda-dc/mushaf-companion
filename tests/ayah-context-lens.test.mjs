import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  contextLensReducer,
  createContextLensState,
} from "../app/ayah-context-lens-state.ts";

const VERIFIED_PACK = {
  packKey: "quranenc:amharic_zain@1.0.1-xml.1#verified",
  schemaVersion: 1,
  sourceId: "quranenc:amharic_zain",
  providerName: "QuranEnc",
  providerId: "amharic_zain",
  editionRevision: "1.0.1-xml.1",
  language: { name: "Amharic", bcp47: "am", iso6393: "amh", script: "Ethi", direction: "ltr" },
  attribution: "Verified Amharic attribution",
  rawChecksum: "a".repeat(64),
  normalizedChecksum: "b".repeat(64),
  normalizationVersion: "translation-record-jsonl-v1",
  surahCount: 114,
  verseCount: 6236,
  installedAt: "2026-08-07T00:00:00.000Z",
};

test("opening and closing the lens preserve the selected ayah and page", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const openStart = page.indexOf("function openContextLens");
  const closeStart = page.indexOf("function closeContextLens", openStart);
  const moveStart = page.indexOf("function moveStudyAyah", closeStart);
  const openSource = page.slice(openStart, closeStart);
  const closeSource = page.slice(closeStart, moveStart);

  assert.match(openSource, /setOverlay\("Context"\)/);
  assert.doesNotMatch(openSource, /setPage\(|setSelectedVerseKey\(/);
  assert.match(closeSource, /setOverlay\(null\)/);
  assert.doesNotMatch(closeSource, /setPage\(|setSelectedVerseKey\(/);
  assert.match(page, /verseKey=\{selectedVerseKey\}/);
  assert.match(page, /page=\{pageData\.page\}/);
});

test("English remains visible and Amharic selection is blocked until a verified pack is ready", () => {
  let state = createContextLensState();
  state = contextLensReducer(state, { type: "PACK_ABSENT" });
  state = contextLensReducer(state, { type: "SELECT_TRANSLATION", translation: "amharic-zain" });
  assert.equal(state.activeTranslation, "english-saheeh");
  assert.equal(state.selectionBlocked, true);

  state = contextLensReducer(state, {
    type: "PACK_READY",
    pack: VERIFIED_PACK,
    record: { verseKey: "1:1", translation: "ትርጉም", footnotes: "" },
    selectAmharic: true,
  });
  assert.equal(state.packStatus, "installed");
  assert.equal(state.activeTranslation, "amharic-zain");
  assert.equal(state.amharicRecord.translation, "ትርጉም");
});

test("failure, retry, repair, deletion, and storage reclamation have explicit UI states", () => {
  let state = contextLensReducer(createContextLensState(), { type: "PACK_FAILURE", action: "install", error: "Network unavailable" });
  assert.equal(state.packStatus, "failed");
  assert.equal(state.retryAction, "install");
  assert.equal(state.error, "Network unavailable");

  state = contextLensReducer(state, { type: "PACK_OPERATION", operation: "repair" });
  assert.equal(state.packStatus, "working");
  assert.equal(state.operation, "repair");
  state = contextLensReducer(state, { type: "PACK_PROGRESS", progress: { phase: "verifying", percent: 82, message: "Verifying", completedRecords: 6236, totalRecords: 6236 } });
  assert.equal(state.progress.percent, 82);

  state = contextLensReducer(state, { type: "PACK_RECLAIMED" });
  assert.equal(state.packStatus, "reclaimed");
  assert.equal(state.retryAction, "repair");
  assert.equal(state.activeTranslation, "english-saheeh");

  state = contextLensReducer(state, { type: "PACK_DELETED" });
  assert.equal(state.packStatus, "not-installed");
  assert.equal(state.amharicRecord, null);
});

test("the lens displays required identity, translation, attribution, and unchanged tafsir source details", async () => {
  const [lens, page, tafsirPanel, tafsirSource] = await Promise.all([
    readFile(new URL("../app/ayah-context-lens.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/tafsir-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/tafsir-source.mjs", import.meta.url), "utf8"),
  ]);

  assert.match(lens, /SŪRAH \{surahNumber\}/);
  assert.match(lens, /VERIFIED ARABIC AYAH/);
  assert.match(lens, /English · Saheeh International/);
  assert.match(lens, /Amharic · Muhammad Zain Zahruddin/);
  assert.match(lens, /Source<\/dt>/);
  assert.match(lens, /Translator<\/dt>/);
  assert.match(lens, /Publisher<\/dt>/);
  assert.match(lens, /Edition<\/dt>/);
  assert.match(lens, /SOURCE, EDITION &amp; ATTRIBUTION/);
  assert.doesNotMatch(lens, /Somali|Afaan Oromoo|machine translation/i);
  assert.match(page, /<TafsirPanel/);
  assert.match(tafsirPanel, /Ibn Kathir <small>Abridged<\/small>/);
  assert.match(tafsirSource, /id: 169/);
  assert.match(lens, /does not relicense or translate this commentary/);
});

test("desktop drawer and mobile sheet behavior are explicit and do not reflow the Mushaf page", async () => {
  const [styles, page] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(styles, /\.context-lens-layer \{[^}]*justify-content: flex-end/s);
  assert.match(styles, /\.context-lens-panel \{[^}]*height: 100dvh/s);
  assert.match(styles, /@media \(max-width: 790px\)[\s\S]*\.context-lens-panel \{[^}]*height: min\(94dvh,900px\)/);
  assert.match(styles, /\.layer-backdrop \{ position: fixed/);
  assert.match(styles, /\.mushaf-page \{[^}]*aspect-ratio: \.735 \/ 1/s);
  assert.match(styles, /\.mushaf-lines \{[^}]*grid-template-rows: repeat\(15/s);
  assert.match(page, /className="mushaf-lines"/);
  assert.equal((page.match(/className="line-slot"/g) ?? []).length, 1);
  assert.ok(page.indexOf("<AyahContextLens") > page.indexOf("</section>\n      </section>"), "lens must render outside the Mushaf reading section");
});

test("keyboard and accessibility behavior includes modal semantics, focus return, focus trap, tabs, and Escape", async () => {
  const [lens, page] = await Promise.all([
    readFile(new URL("../app/ayah-context-lens.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(lens, /role="dialog"/);
  assert.match(lens, /aria-modal="true"/);
  assert.match(lens, /role="tablist"/);
  assert.match(lens, /role="tabpanel"/);
  assert.match(lens, /event\.key === "Escape"/);
  assert.match(lens, /event\.key !== "Tab"/);
  assert.match(lens, /"ArrowLeft", "ArrowRight", "Home", "End"/);
  assert.match(lens, /role="progressbar"/);
  assert.match(lens, /role="alert"/);
  assert.match(lens, /aria-label="Close Ayah Context Lens"/);
  assert.match(page, /contextTriggerRef\.current\?\.focus\(\)/);
  assert.match(page, /aria-label="Open Ayah Context Lens for selected ayah"/);
});
