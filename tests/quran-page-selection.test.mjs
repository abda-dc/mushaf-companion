import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createPagesReaderTransport } from "../app/content/pages-runtime-transport.ts";
import { DEFAULT_READING_ID } from "../app/reading-registry.mjs";

test("M11.3 keeps legacy page loading while exposing an explicit reading-aware transport path", async () => {
  const [types, pagesTransport, serverTransport] = await Promise.all([
    readFile(new URL("../app/content/runtime-transport.types.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/content/pages-runtime-transport.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/content/runtime-transport.ts", import.meta.url), "utf8"),
  ]);

  assert.match(types, /loadPage\(page: number/);
  assert.match(types, /loadPageForReading\(readingId: ReadingId, page: number/);
  assert.match(pagesTransport, /fetchQuranPageFromSource\(page, fetchImpl, signal\)/);
  assert.match(
    pagesTransport,
    /fetchQuranPageForReadingFromSource\(readingId, page, fetchImpl, signal\)/,
  );
  assert.match(serverTransport, /reading=\$\{encodeURIComponent\(readingId\)\}/);
});

test("M11.3 Pages transport rejects an unsupported reading before provider access", async () => {
  let requests = 0;
  const transport = createPagesReaderTransport(async () => {
    requests += 1;
    throw new Error("provider must not be reached");
  });

  await assert.rejects(
    transport.loadPageForReading("warsh-an-nafi", 1),
    (error) => error?.name === "QuranPageEditionError" &&
      error?.code === "unsupported_reading",
  );

  assert.equal(requests, 0);
});

test("M11.3 reader cache and verification identity include the active reading", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /const ACTIVE_READING_ID: ReadingId = DEFAULT_READING_ID/);
  assert.match(page, /resolveQuranPageEdition\(ACTIVE_READING_ID\)/);
  assert.match(page, /new Map<string, QuranPage>\(\)/);
  assert.match(page, /function quranPageCacheKey\(readingId: ReadingId, page: number\)/);
  assert.match(page, /\$\{readingId\}:\$\{page\}/);
  assert.match(page, /loadPageForReading\(ACTIVE_READING_ID, page\)/);
  assert.match(page, /isVerifiedPage\(data, page, ACTIVE_READING_ID\)/);
});

test("M11.3 page API defaults to Hafs but rejects unknown reading identities", async () => {
  const route = await readFile(new URL("../app/api/pages/[page]/route.ts", import.meta.url), "utf8");

  assert.match(route, /requestedReadingId \?\? DEFAULT_READING_ID/);
  assert.match(route, /isSupportedReadingId\(readingId\)/);
  assert.match(route, /resolveQuranPageEdition\(readingId\)/);
  assert.match(route, /page > edition\.pages/);
  assert.doesNotMatch(route, /page > 604/);
  assert.match(route, /fetchQuranPageForReadingFromSource\(readingId, page\)/);
  assert.match(route, /"X-Quran-Reading": readingId/);
});

test("M11.3 keeps the only active runtime reading pinned to the canonical Hafs identity", () => {
  assert.equal(DEFAULT_READING_ID, "hafs-an-asim");
});
