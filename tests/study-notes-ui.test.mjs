import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { focusFirstConnectedStudyTarget, freezeStudyAnchor, revalidateStudyAnchor, studyTagFilterAfterRename } from "../app/study-notes.mjs";

test("Study Lens notes are visibly private, plain text, accessible, and separate from source content", async () => {
  const [lens, notesUi] = await Promise.all([
    readFile(new URL("../app/ayah-context-lens.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/study-notes-ui.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(lens, /id: "notes", label: "Notes"/);
  assert.match(lens, /User-authored annotations remain separate/);
  assert.match(notesUi, /PRIVATE · STORED ON THIS DEVICE/);
  assert.match(notesUi, /textarea/);
  assert.match(notesUi, /dir="auto"/);
  assert.match(notesUi, /Confirm delete/);
  assert.doesNotMatch(notesUi, /dangerouslySetInnerHTML/);
});

test("saved-note navigation reconciles ayah page and exact word coordinates before opening", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const start = page.indexOf("async function openPrivateNote");
  const end = page.indexOf("function openTafsir", start);
  const source = page.slice(start, end);
  assert.match(source, /contentTransport\.lookupVerse\(note\.anchor\.verseKey\)/);
  assert.match(source, /target\.page !== note\.anchor\.page/);
  assert.match(source, /wordContextForCoordinate\(pageData, note\.anchor\)/);
  assert.match(source, /setStudyInitialTab\("notes"\)/);
  assert.match(page, /pendingStudyNoteRef/);
});

test("private search stays local and note data is absent from external and analytics calls", async () => {
  const [page, notes, notesUi] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/study-notes.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/study-notes-ui.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(notesUi, /searchStudyNotes/);
  assert.doesNotMatch(notes, /fetch\(|XMLHttpRequest|sendBeacon|WebSocket|analytics|telemetry/);
  assert.doesNotMatch(notesUi, /fetch\(|sendBeacon|analytics|telemetry/);
  assert.doesNotMatch(page, /contentTransport\.search\([^)]*studyNotes|fetch\([^)]*studyNotes|track\([^)]*studyNotes/s);
  assert.match(page, /createPortableBackup\(preferenceSnapshot\(\)\)/);
});

test("executed draft behavior freezes ayah/word identity and refuses a changed trusted word", async () => {
  const ayahDraft = freezeStudyAnchor({ type: "ayah", verseKey: "2:255", page: 42 });
  const wordDraft = freezeStudyAnchor({ type: "word", verseKey: "2:255", wordPosition: 3, page: 42, line: 7, sourceWordId: 9001 });
  const ayahAfterNavigation = await revalidateStudyAnchor(ayahDraft, { resolveVerse: async () => ({ verseKey: "2:255", page: 42 }) });
  assert.deepEqual(ayahAfterNavigation, { type: "ayah", verseKey: "2:255", page: 42 });
  const wordAfterSelectionChange = await revalidateStudyAnchor(wordDraft, {
    resolveVerse: async () => ({ verseKey: "2:255", page: 42 }),
    resolveWord: async () => ({ type: "word", verseKey: "2:255", wordPosition: 3, page: 42, line: 7, sourceWordId: 9001 }),
  });
  assert.equal(wordAfterSelectionChange.sourceWordId, 9001);
  assert.equal(await revalidateStudyAnchor(wordDraft, {
    resolveVerse: async () => ({ verseKey: "2:255", page: 42 }),
    resolveWord: async () => ({ type: "word", verseKey: "2:255", wordPosition: 3, page: 42, line: 7, sourceWordId: 9002 }),
  }), null);
});

test("executed tag-filter and focus helpers follow renamed tags and skip detached controls", () => {
  assert.equal(studyTagFilterAfterRename("Ask teacher", "ask teacher", "Teacher"), "Teacher");
  let focused = "";
  assert.equal(focusFirstConnectedStudyTarget([
    { isConnected: false, focus() { focused = "detached"; } },
    { isConnected: true, focus() { focused = "editor"; } },
  ]), true);
  assert.equal(focused, "editor");
});

test("note and evidence actions use the mobile-compatible 44px target floor", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  for (const selector of [".note-editor-actions button", ".notes-tag-filter button", ".notes-index-list article > div button", ".notes-tag-manager button", ".evidence-actions button"]) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(css, new RegExp(`${escaped}[^{}]*\\{[^}]*min-height:\\s*44px`, "s"), `${selector} should retain a 44px target`);
  }
});

test("note save revalidation uses the trusted loaded-page cache before the network fallback", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const start = page.indexOf("async function createPrivateNote");
  const end = page.indexOf("function updatePrivateNote", start);
  const source = page.slice(start, end);
  assert.match(source, /pageCacheRef\.current\.get\(quranPageCacheKey\(ACTIVE_READING_ID, capturedAnchor\.page\)\)/);
  assert.match(source, /isVerifiedPage\(cachedPage, capturedAnchor\.page, ACTIVE_READING_ID\)/);
  assert.match(source, /cachedPage\.verses\.some/);
  assert.match(source, /contentTransport\.lookupVerse\(verseKey\)/, "uncached anchors retain a trusted transport fallback");
  assert.doesNotMatch(source, /\/api\//);
});
