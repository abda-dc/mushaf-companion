import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_NOTE_BODY_CODE_POINTS,
  MAX_STUDY_NOTES,
  MAX_TAGS_PER_NOTE,
  buildStudyNoteIndex,
  createSecureStudyNoteUuid,
  createStudyNote,
  deleteStudyNote,
  focusFirstConnectedStudyTarget,
  freezeStudyAnchor,
  normalizeStudyAnchor,
  normalizeStudyNotes,
  removeStudyTag,
  renameStudyTag,
  revalidateStudyAnchor,
  searchStudyNotes,
  studyAnchorKey,
  studyTagFilterAfterRename,
  updateStudyNote,
} from "../app/study-notes.mjs";

const AYAH = { type: "ayah", verseKey: "2:255", page: 42 };
const WORD = { type: "word", verseKey: "2:255", wordPosition: 3, page: 42, line: 7, sourceWordId: 9001 };
const LESSON = { type: "lesson", sourceId: "fixture:education-source", sourceRevision: "fixture-r1", courseId: "course:fixture", moduleId: "module:fixture", lessonId: "lesson:fixture", sectionId: "block:fixture" };
const CREATED_AT = "2026-08-11T12:00:00.000Z";

function add(state, anchor, body, tags = [], suffix = "000000000001") {
  return createStudyNote(state, { anchor, body, tags }, { now: CREATED_AT, uuid: `00000000-0000-4000-8000-${suffix}` });
}

test("creates, edits, and explicitly deletes stable ayah notes", () => {
  const first = add(undefined, AYAH, "Review this ayah with my teacher.", ["Ask teacher"]);
  assert.equal(first.note.id, "note:00000000-0000-4000-8000-000000000001");
  assert.deepEqual(first.note.anchor, AYAH);
  const edited = updateStudyNote(first.state, first.note.id, { body: "Review this ayah again.", tags: ["Review"] }, "2026-08-11T13:00:00.000Z");
  assert.equal(edited.notes[0].id, first.note.id);
  assert.equal(edited.notes[0].createdAt, CREATED_AT);
  assert.equal(edited.notes[0].updatedAt, "2026-08-11T13:00:00.000Z");
  assert.deepEqual(deleteStudyNote(edited, first.note.id).notes, []);
});

test("supports multiple notes on one ayah and indexes without Quran-word render scans", () => {
  const first = add(undefined, AYAH, "First", ["Review"]);
  const second = add(first.state, AYAH, "Second", ["Dua"], "000000000002");
  const index = buildStudyNoteIndex(second.state);
  assert.equal(index.byAnchor.get(studyAnchorKey(AYAH)).length, 2);
  assert.equal(index.byTag.get("review").length, 1);
  assert.equal(searchStudyNotes(second.state, "2:255").length, 2);
});

test("word notes require the complete trusted coordinate", () => {
  const created = add(undefined, WORD, "Review this exact word.");
  assert.deepEqual(created.note.anchor, WORD);
  assert.equal(studyAnchorKey(created.note.anchor), "word|2:255|3|42|7|9001");
  for (const invalid of [
    { ...WORD, page: 43 },
    { ...WORD, line: 0 },
    { ...WORD, wordPosition: 0 },
    { type: "word", verseKey: "2:255", wordPosition: 3, page: 42, line: 7 },
    { ...WORD, verseKey: "0:255" },
  ]) {
    if (invalid.page === 43) assert.deepEqual(normalizeStudyAnchor(invalid), invalid, "a structurally valid page is retained until trusted navigation reconciliation");
    else assert.equal(normalizeStudyAnchor(invalid), null);
  }
});

test("lesson notes pin exact source revision and section while schema-v1 Quran notes migrate unchanged", async () => {
  const created = add(undefined, LESSON, "Private synthetic lesson note.");
  assert.deepEqual(created.note.anchor, LESSON);
  assert.equal(studyAnchorKey(LESSON), "lesson|fixture:education-source|fixture-r1|course:fixture|module:fixture|lesson:fixture|block:fixture");
  assert.deepEqual(await revalidateStudyAnchor(LESSON, { resolveLesson: async () => LESSON }), LESSON);
  assert.equal(await revalidateStudyAnchor(LESSON, { resolveLesson: async () => ({ ...LESSON, sourceRevision: "fixture-r2" }) }), null);
  assert.equal(searchStudyNotes(created.state, "lesson:fixture", "lesson").length, 1);

  const legacy = { ...add(undefined, AYAH, "Legacy ayah note", [], "000000000099").note, schemaVersion: 1 };
  const legacyWord = { ...add(undefined, WORD, "Legacy word note", [], "000000000098").note, schemaVersion: 1 };
  const migrated = normalizeStudyNotes({ schemaVersion: 1, notes: [legacy, legacyWord] });
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.notes[0].schemaVersion, 2);
  assert.deepEqual(migrated.notes[0].anchor, AYAH);
  assert.equal(migrated.notes[1].schemaVersion, 2);
  assert.deepEqual(migrated.notes[1].anchor, WORD, "schema-v1 exact-word anchors migrate without remapping");
  assert.deepEqual(normalizeStudyNotes({ schemaVersion: 1, notes: [{ ...created.note, schemaVersion: 1 }] }).notes, [], "schema v1 cannot smuggle a lesson anchor");
  assert.deepEqual(normalizeStudyNotes({ schemaVersion: 999, notes: [created.note] }).notes, [], "future note collections fail closed");
});

test("duplicate note IDs and impossible timestamps fail safe during restore", () => {
  const first = add(undefined, AYAH, "Original").note;
  const normalized = normalizeStudyNotes({ schemaVersion: 1, notes: [first, { ...first, body: "Duplicate" }, { ...first, id: "note:bad-date", createdAt: "2026-02-31T12:00:00.000Z" }] });
  assert.equal(normalized.notes.length, 1);
  assert.equal(normalized.notes[0].body, "Original");
  assert.throws(() => add({ schemaVersion: 1, notes: [first] }, AYAH, "Collision"), /unique secure note identifier/i);
});

test("note bodies and imported note collections are bounded", () => {
  assert.throws(() => add(undefined, AYAH, "x".repeat(MAX_NOTE_BODY_CODE_POINTS + 1)), /limited/i);
  const template = add(undefined, AYAH, "bounded").note;
  const oversized = Array.from({ length: MAX_STUDY_NOTES * 2 + 100 }, (_, index) => ({ ...template, id: `note:fixture_${String(index).padStart(8, "0")}` }));
  assert.equal(normalizeStudyNotes({ schemaVersion: 1, notes: oversized }).notes.length, MAX_STUDY_NOTES);
});

test("tags normalize whitespace and case while preserving Unicode display spelling", () => {
  const created = add(undefined, AYAH, "Tags", ["  Ask   teacher ", "ask teacher", "دعاء", " دُعَاء ", "Review"]);
  assert.deepEqual(created.note.tags, ["Ask teacher", "دعاء", "دُعَاء", "Review"]);
  const tooMany = Array.from({ length: MAX_TAGS_PER_NOTE + 8 }, (_, index) => `Tag ${index}`);
  assert.equal(add(undefined, AYAH, "Bounded tags", tooMany, "000000000003").note.tags.length, MAX_TAGS_PER_NOTE);
  assert.equal(add(undefined, AYAH, "Long tag", ["x".repeat(41)], "000000000004").note.tags.length, 0);
});

test("tag rename and removal never delete note records", () => {
  const created = add(undefined, AYAH, "Keep me", ["Review", "Important"]);
  const renamed = renameStudyTag(created.state, "review", "مراجعة");
  assert.deepEqual(renamed.notes[0].tags, ["مراجعة", "Important"]);
  const removed = removeStudyTag(renamed, "IMPORTANT");
  assert.equal(removed.notes.length, 1);
  assert.deepEqual(removed.notes[0].tags, ["مراجعة"]);
});

test("a draft keeps its captured ayah and exact word anchors when reader selection changes", async () => {
  const ayahDraft = freezeStudyAnchor(AYAH);
  const wordDraft = freezeStudyAnchor(WORD);
  assert.equal(Object.isFrozen(ayahDraft), true);
  assert.equal(Object.isFrozen(wordDraft), true);

  const currentReaderAyah = { type: "ayah", verseKey: "3:2", page: 50 };
  const currentSelectedWord = { ...WORD, wordPosition: 4, sourceWordId: 9002 };
  assert.notDeepEqual(currentReaderAyah, ayahDraft);
  assert.notDeepEqual(currentSelectedWord, wordDraft);

  const trustedAyah = await revalidateStudyAnchor(ayahDraft, { resolveVerse: async () => ({ verseKey: "2:255", page: 42 }) });
  const trustedWord = await revalidateStudyAnchor(wordDraft, {
    resolveVerse: async () => ({ verseKey: "2:255", page: 42 }),
    resolveWord: async () => WORD,
  });
  assert.deepEqual(add(undefined, trustedAyah, "Frozen ayah draft").note.anchor, AYAH);
  assert.deepEqual(add(undefined, trustedWord, "Frozen word draft", [], "000000000002").note.anchor, WORD);
});

test("an invalidated word draft refuses save and an existing edit cannot migrate anchors", async () => {
  const invalidated = await revalidateStudyAnchor(WORD, {
    resolveVerse: async () => ({ verseKey: "2:255", page: 42 }),
    resolveWord: async () => ({ ...WORD, sourceWordId: 9999 }),
  });
  assert.equal(invalidated, null);
  const created = add(undefined, AYAH, "Original anchor");
  const edited = updateStudyNote(created.state, created.note.id, { body: "Edited body", tags: [], anchor: { type: "ayah", verseKey: "3:2", page: 50 } }, "2026-08-11T13:00:00.000Z");
  assert.deepEqual(edited.notes[0].anchor, AYAH);
});

test("secure UUID generation supports randomUUID, getRandomValues fallback, and controlled failure", () => {
  const supplied = "11111111-1111-4111-8111-111111111111";
  assert.equal(createSecureStudyNoteUuid({ randomUUID: () => supplied }), supplied);
  const fallback = createSecureStudyNoteUuid({ getRandomValues(bytes) { for (let index = 0; index < bytes.length; index += 1) bytes[index] = index; return bytes; } });
  assert.equal(fallback, "00010203-0405-4607-8809-0a0b0c0d0e0f");
  assert.throws(() => createSecureStudyNoteUuid({}), /secure note identifier is unavailable/i);
});

test("renaming the active tag filter follows the normalized replacement", () => {
  assert.equal(studyTagFilterAfterRename("Ask teacher", "ask teacher", "  Teacher "), "Teacher");
  assert.equal(studyTagFilterAfterRename("Review", "Ask teacher", "Teacher"), "Review");
  assert.equal(studyTagFilterAfterRename("Ask teacher", "Ask teacher", " "), "");
});

test("focus selection skips detached controls and focuses the first stable target", () => {
  let focused = "";
  const detached = { isConnected: false, focus() { focused = "detached"; } };
  const stable = { isConnected: true, focus() { focused = "stable"; } };
  assert.equal(focusFirstConnectedStudyTarget([detached, stable]), true);
  assert.equal(focused, "stable");
  assert.equal(focusFirstConnectedStudyTarget([detached]), false);
});
