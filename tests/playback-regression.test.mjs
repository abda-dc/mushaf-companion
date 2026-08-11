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
test("page-load failure clears pending autoplay and edge navigation before restoring the last confirmed page", async () => {
  const page = await readFile(PAGE_URL, "utf8");

  const failureNotice = page.indexOf("Verified page data is temporarily unavailable. Your last confirmed page is still open.");
  assert.ok(failureNotice >= 0, "verified page-load failure handler must exist");

  const catchStart = page.lastIndexOf(".catch(() => {", failureNotice);
  const catchEnd = page.indexOf("});", failureNotice);

  assert.ok(catchStart >= 0, "page-load failure catch block must exist");
  assert.ok(catchEnd > failureNotice, "page-load failure catch block must close");

  const failureBlock = page.slice(catchStart, catchEnd);

  assert.match(failureBlock, /pendingAutoplayRef\.current = false;/);
  assert.match(failureBlock, /pendingEdgeRef\.current = null;/);
  assert.match(failureBlock, /updatePlaying\(false\);/);

  const autoplayClear = failureBlock.indexOf("pendingAutoplayRef.current = false;");
  const edgeClear = failureBlock.indexOf("pendingEdgeRef.current = null;");
  const stopPlaying = failureBlock.indexOf("updatePlaying(false);");
  const restorePage = failureBlock.indexOf("const previous = lastGoodPageRef.current;");

  assert.ok(autoplayClear >= 0 && autoplayClear < restorePage, "autoplay intent must clear before restoring the page");
  assert.ok(edgeClear >= 0 && edgeClear < restorePage, "page-edge intent must clear before restoring the page");
  assert.ok(stopPlaying >= 0 && stopPlaying < restorePage, "playing state must stop before restoring the page");
});
