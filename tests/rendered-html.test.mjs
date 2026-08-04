import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders a complete page-navigation reader shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Mushaf Companion — Faithful Quran Reading<\/title>/i);
  assert.match(html, /aria-label="Quran page 1"/);
  assert.match(html, /aria-label="Previous page"/);
  assert.match(html, /aria-label="Next page"/);
  assert.match(html, /Jump to Quran page/);
  assert.match(html, /Page (?:<!-- -->)?1(?:<!-- -->)? of (?:<!-- -->)?604/);
  assert.match(html, /class="mushaf-lines"/);
  assert.match(html, /translate="no"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("implements dynamic Madani pages and every requested navigation path", async () => {
  const [page, data, pageRoute, searchRoute, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/quran-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/pages/[page]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/search/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /TOTAL_PAGES = 604/);
  assert.match(page, /mushaf:last-page/);
  assert.match(page, /new URL\(window\.location\.href\)\.searchParams\.get\("page"\)/);
  assert.match(page, /event\.key === "ArrowRight"/);
  assert.match(page, /event\.key === "ArrowLeft"/);
  assert.match(page, /handlePointerDown/);
  assert.match(page, /handlePointerUp/);
  assert.match(page, /type="number" min="1" max=\{TOTAL_PAGES\}/);
  assert.match(page, /fetch\(`\/api\/pages\/\$\{page\}`\)/);
  assert.match(page, /pageCacheRef/);
  assert.match(pageRoute, /line_number,text_uthmani/);
  assert.match(pageRoute, /uthmani_tajweed\?page_number/);
  assert.match(pageRoute, /Array\.from\(\{ length: 15 \}/);
  assert.match(searchRoute, /chapters\?language=en/);
  assert.match(searchRoute, /type: "page"/);
  assert.match(data, /FALLBACK_PAGE/);
  assert.match(layout, /all 604 Quran pages/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});

test("maps verified API words into the 15-line Madani page structure", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/verses/by_page/2")) {
      return Response.json({ verses: [{
        verse_number: 1,
        verse_key: "2:1",
        juz_number: 1,
        hizb_number: 1,
        text_uthmani: "الٓمٓ",
        translations: [{ text: "Alif-lam-meem" }],
        words: [
          { id: 11, text_uthmani: "الٓمٓ", text: "الٓمٓ", char_type_name: "word", line_number: 3 },
          { id: 12, text_uthmani: "١", text: "١", char_type_name: "end", line_number: 3 },
        ],
      }] });
    }
    if (url.includes("uthmani_tajweed?page_number=2")) {
      return Response.json({ verses: [{ verse_key: "2:1", text_uthmani_tajweed: "ا<tajweed class=madda_necessary>لٓ</tajweed><tajweed class=madda_necessary>مٓ</tajweed> <span class=end>١</span>" }] });
    }
    if (url.includes("/chapters?language=en")) {
      return Response.json({ chapters: [{ id: 2, name_complex: "Al-Baqarah", name_simple: "Al-Baqarah", name_arabic: "البقرة", revelation_place: "madinah", translated_name: { name: "The Cow" } }] });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("api-test", `${process.pid}-${Date.now()}`);
    const { default: worker } = await import(workerUrl.href);
    const response = await worker.fetch(
      new Request("http://localhost/api/pages/2"),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    assert.equal(response.status, 200);
    const page = await response.json();
    assert.equal(page.page, 2);
    assert.equal(page.lines.length, 15);
    assert.equal(page.lines[2].words[0].verseKey, "2:1");
    assert.match(page.lines[2].words[0].tajweedHtml, /madda_necessary/);
    assert.deepEqual(page.chapterStarts[0], { chapterId: 2, headerLine: 1, bismillahLine: 2 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
