import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const PAGE_URL = new URL("../app/page.tsx", import.meta.url);

test("Play intent survives while the requested audio source is still preparing", async () => {
  const page = await readFile(PAGE_URL, "utf8");

  assert.match(
    page,
    /if \(!audio \|\| !audioSource \|\| audioSource\.key !== targetAudioKey\) \{\s+pendingAutoplayRef\.current = true;\s+setNotice\("Preparing this recitation…"\);\s+return;/,
  );
});

test("complete Surah playback explicitly preserves autoplay across ayah and page handoffs", async () => {
  const page = await readFile(PAGE_URL, "utf8");

  assert.match(
    page,
    /if \(nextVerse\.chapterId === surahPlaybackRef\.current\) \{\s+pendingAutoplayRef\.current = true;\s+selectAyah\(nextVerse\.key\);\s+\}/,
  );

  assert.match(
    page,
    /\} else if \(pageData\.page < TOTAL_PAGES\) \{\s+pendingAutoplayRef\.current = true;\s+pendingEdgeRef\.current = "first";\s+goToPage\(pageData\.page \+ 1, "next", undefined, true\);/,
  );
});

test("range repeat explicitly preserves autoplay when advancing and wrapping", async () => {
  const page = await readFile(PAGE_URL, "utf8");

  const rangeStart = page.indexOf('if (repeatMode === "range")');
  const normalPlaybackStart = page.indexOf('if (currentReciter.scope === "ayah")', rangeStart);

  assert.ok(rangeStart >= 0, "range-repeat branch must exist");
  assert.ok(normalPlaybackStart > rangeStart, "normal playback branch must follow range-repeat");
  const rangeBlock = page.slice(rangeStart, normalPlaybackStart);

  assert.match(
    rangeBlock,
    /if \(currentVerseIndex >= 0 && currentVerseIndex < endIndex\) \{\s+pendingAutoplayRef\.current = true;\s+selectAyah\(pageData\.verses\[currentVerseIndex \+ 1\]\.key\);\s+\}/,
  );

  assert.match(
    rangeBlock,
    /else if \(startIndex >= 0\) \{\s+pendingAutoplayRef\.current = true;\s+selectAyah\(pageData\.verses\[startIndex\]\.key\);\s+\}/,
  );
});

test("Stop still cancels pending autoplay intent", async () => {
  const page = await readFile(PAGE_URL, "utf8");

  const stopStart = page.indexOf("function stopPlayback(");
  const selectStart = page.indexOf("function selectAyah(", stopStart);

  assert.ok(stopStart >= 0, "stopPlayback must exist");
  assert.ok(selectStart > stopStart, "selectAyah must follow stopPlayback");
  const stopBlock = page.slice(stopStart, selectStart);

  assert.match(stopBlock, /pendingAutoplayRef\.current = false;/);
  assert.match(stopBlock, /audio\.pause\(\);/);
});
