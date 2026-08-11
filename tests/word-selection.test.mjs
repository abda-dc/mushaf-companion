import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Mushaf word selection derives a trusted coordinate and opens the shared Words surface", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const selectStart = page.indexOf("function selectMushafWord");
  const selectEnd = page.indexOf("async function startSurahPlayback", selectStart);
  const source = page.slice(selectStart, selectEnd);

  assert.match(source, /wordCoordinateIndex\.get\(pageWordIdentity\(word\)\)/);
  assert.match(source, /surfaceText: word\.text/);
  assert.match(source, /tajweedRules: rules/);
  assert.match(source, /openContextLens\(trigger, coordinate \? "words" : "overview"\)/);
  assert.match(page, /onClick=\{\(event\) => selectMushafWord\(word, event\.currentTarget\)\}/);
  assert.match(page, /tabIndex=\{word\.isEnd \|\| selectedVerseKey === word\.verseKey \? 0 : -1\}/);
  assert.match(page, /coordinatesMatch\(selectedWord\.coordinate, coordinate, true\)/);
  assert.match(page, /\$\{word\.text\} — open word study, word \$\{coordinate\?\.wordPosition/);
  assert.match(page, /aria-label=\{hifzHidden \? `\$\{word\.text\}/, "the trusted visible Arabic word remains in the accessible name");
});

test("word selection coexists with Tajweed in one context instead of competing popups", async () => {
  const [page, lens] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/ayah-context-lens.tsx", import.meta.url), "utf8"),
  ]);
  const selectStart = page.indexOf("function selectMushafWord");
  const selectEnd = page.indexOf("async function startSurahPlayback", selectStart);
  const source = page.slice(selectStart, selectEnd);

  assert.match(source, /rulesForTajweedHtml\(word\.tajweedHtml\)/);
  assert.match(source, /setTajweedFocus\(null\)/);
  assert.match(lens, /selectedWord\.tajweedRules\.map/);
  assert.match(lens, /rule\.instruction/);
});

test("changing ayat or pages clears a stale word selection", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const selectAyahStart = page.indexOf("function selectAyah");
  const selectAyahEnd = page.indexOf("function selectReciter", selectAyahStart);
  const moveStart = page.indexOf("function moveStudyAyah");
  const moveEnd = page.indexOf("function openContents", moveStart);
  const applyStart = page.indexOf("const applyPage");
  const applyEnd = page.indexOf("if (cached)", applyStart);

  assert.match(page.slice(selectAyahStart, selectAyahEnd), /setSelectedWord\(null\)/);
  assert.match(page.slice(moveStart, moveEnd), /setSelectedWord\(null\)/);
  assert.match(page.slice(applyStart, applyEnd), /setSelectedWord\(null\)/);
});

test("unsupported word metadata is omitted while approved fields and attribution are conditional", async () => {
  const lens = await readFile(new URL("../app/ayah-context-lens.tsx", import.meta.url), "utf8");

  assert.match(lens, /wordRecord\.meanings\?\.length \?/);
  assert.match(lens, /wordRecord\.transliteration &&/);
  assert.match(lens, /wordRecord\.lemma &&/);
  assert.match(lens, /wordRecord\.root &&/);
  assert.match(lens, /wordRecord\.morphology\?\.partOfSpeech &&/);
  assert.match(lens, /wordRecord && wordStudySource &&/);
  assert.match(lens, /Source and attribution/);
  assert.match(lens, /No approved metadata is available for this word/);
  assert.doesNotMatch(lens, /Play word/i);
  assert.match(lens, /Hear in Ayah/);
});

test("word-study activation and unrelated Lens resources are tab-scoped", async () => {
  const [page, lens] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/ayah-context-lens.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /overlay !== "Context" \|\| studyActiveTab !== "words"/);
  assert.match(page, /overlay === "Context" && studyActiveTab === "tafsir"/);
  assert.match(lens, /state\.activeTab === "overview"\) loadPack/);
  assert.match(lens, /onActiveTabChange\(state\.activeTab\)/);
});
