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
  assert.match(html, /aria-label="Open Tajweed guide before page one"/);
  assert.match(html, /aria-label="Next page"/);
  assert.match(html, /Jump to Quran page/);
  assert.match(html, /aria-label="Page number" value="1"/);
  assert.match(html, /\/ (?:<!-- -->)?604/);
  assert.match(html, /class="mushaf-lines"/);
  assert.equal((html.match(/class="line-slot"/g) ?? []).length, 15);
  assert.match(html, /aria-label="Reading assistance"/);
  assert.match(html, />Tajweed</);
  assert.match(html, />Transliteration</);
  assert.match(html, /aria-label="Audio mini player"/);
  assert.match(html, /translate="no"/);
  assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(html, /name="theme-color" content="#0f3028"/);
  assert.match(html, /name="mobile-web-app-capable" content="yes"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
  assert.doesNotMatch(html, /Amharic|Somali|Afaan Oromoo/);
});

test("implements dynamic Madani pages and every requested navigation path", async () => {
  const [page, styles, data, guide, pageRoute, runtimeSource, searchRoute, chaptersRoute, audioManifestRoute, audioManifest, offlineAudio, offlinePanel, tafsirRoute, tafsirSource, tafsirPanel, layout, packageJson, capacitorConfig, mobileWorkflow, pagesWorkflow, manifest, serviceWorker, pagesShell, license] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/quran-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/tajweed-guide.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/pages/[page]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/content/quran-runtime-source.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/search/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/chapters/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/audio-manifest/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/audio-manifest.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/offline-audio.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/offline-audio-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/tafsir/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/tafsir-source.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/tafsir-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../capacitor.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/native-packages.yml", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../pages-static/index.html", import.meta.url), "utf8"),
    readFile(new URL("../LICENSE", import.meta.url), "utf8"),
  ]);

  assert.match(page, /const \[activeReadingId, setActiveReadingId\] = useState<ReadingId>\(DEFAULT_READING_ID\)/);
  assert.match(page, /const activePageEdition = resolveQuranPageEdition\(activeReadingId\)/);
  assert.match(page, /const totalPages = activePageEdition\.pages/);
  assert.match(page, /loadPreferences\(localStorage\)/);
  assert.match(page, /savePreferences\(localStorage/);
  assert.match(page, /new URL\(window\.location\.href\)\.searchParams\.get\("page"\)/);
  assert.match(page, /event\.key === "ArrowRight"/);
  assert.match(page, /event\.key === "ArrowLeft"/);
  assert.match(page, /handlePointerDown/);
  assert.match(page, /handlePointerUp/);
  assert.match(page, /type="number" min="1" max=\{totalPages\}/);
  assert.match(page, /Open page jump\. Current page/);
  assert.match(page, /Jump in the mushaf/);
  assert.match(page, /JUZ_START_PAGES/);
  assert.match(page, /Recent pages/);
  assert.match(page, /Saved places/);
  assert.match(page, /setRecentPages/);
  assert.match(page, /contentTransport\.loadPageForReading\(activeReadingId, page\)/);
  assert.match(page, /quranPageCacheKey\(activeReadingId, page\)/);
  assert.match(page, /pageCacheRef/);
  assert.match(runtimeSource, /mushaf: String\(edition\.mushafId\)/);
  assert.match(runtimeSource, /edition\.wordTextField/);
  assert.match(runtimeSource, /qcfGlyphFromWord\(word\.text\)/);
  assert.match(runtimeSource, /edition\.tajweedRoute/);
  assert.match(runtimeSource, /length: edition\.lineCount/);
  assert.match(runtimeSource, /sha256Hex/);
  assert.match(pageRoute, /CONTENT_MANIFEST/);
  assert.match(runtimeSource, /edition\.translationResourceId/);
  assert.match(page, /new FontFace/);
  assert.match(page, /qcfTajweedCode/);
  assert.match(styles, /grid-template-rows: repeat\(15/);
  assert.match(page, /role="dialog" aria-modal="true" aria-labelledby="settings-title"/);
  assert.match(page, /className="audio-mini"/);
  assert.match(page, /className="panel-shell audio-sheet"/);
  assert.match(page, /event\.key === "Escape"/);
  assert.match(styles, /\.mobile-layer-bar/);
  assert.match(styles, /\.mobile-jump-trigger/);
  assert.match(styles, /\.jump-page-form/);
  assert.match(styles, /grid-template-columns: repeat\(7,1fr\)/);
  assert.equal((styles.match(/grid-template-columns: repeat\(7,1fr\)/g) ?? []).length, 1, "the seven-item reading-assistance row remains unchanged");
  assert.match(styles, /\.mobile-nav[^}]*grid-template-columns: repeat\(5,1fr\)/, "primary mobile navigation is the focused five-item layout");
  assert.match(styles, /\.audio-sheet/);
  assert.match(styles, /\.ayah-rosette::before/);
  assert.match(styles, /\.ayah-rosette::after/);
  assert.match(page, /aria-label="Reading font"/);
  assert.match(page, /readingFont/);
  assert.match(styles, /reading-font-amiri/);
  assert.match(styles, /reading-font-lateef/);
  assert.match(styles, /reading-font-scheherazade/);
  assert.match(data, /Dr\. Aymen Suwayed/);
  assert.match(data, /Minshawi Kids Repeat/);
  assert.match(data, /Sheikh Abdul Rashid Ali Sufi/);
  assert.match(audioManifest, /Ayman_Sowaid_64kbps/);
  assert.match(audioManifest, /Minshawy_Teacher_128kbps/);
  assert.match(audioManifest, /abdul-rashid-sofi/);
  assert.match(page, /PLAYBACK_SPEEDS = \[0\.5, 0\.75, 1, 1\.25, 1\.5, 1\.75, 2\]/);
  assert.match(page, /Table of contents/);
  assert.match(page, /Double-click to play the complete sūrah/);
  assert.match(page, /rulesForTajweedHtml/);
  assert.match(page, /Tajweed color guide/);
  assert.equal((guide.match(/id: "/g) ?? []).length, 17);
  assert.equal((guide.match(/\["[^"]+", "\d+:\d+"\]/g) ?? []).length, 85);
  assert.match(guide, /idgham_mutajanisayn/);
  assert.match(guide, /idgham_mutaqaribayn/);
  assert.match(runtimeSource, /fetchImpl\(`\$\{QURAN_API_ROOT\}\/juzs`/);
  assert.match(runtimeSource, /revelationOrder/);
  assert.match(runtimeSource, /versesCount/);
  assert.match(capacitorConfig, /com\.mushafcompanion\.reader/);
  assert.match(capacitorConfig, /mushaf-companion\.abda-dc\.chatgpt\.site/);
  assert.match(mobileWorkflow, /assembleDebug/);
  assert.match(mobileWorkflow, /bundleRelease/);
  assert.match(mobileWorkflow, /iphonesimulator/);
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.match(layout, /PwaRegister/);
  assert.match(manifest, /"display": "standalone"/);
  assert.match(manifest, /"purpose": "any maskable"/);
  assert.match(page, /className="brand-logo"/);
  assert.match(page, /appPath\("logo\.png"\)/);
  assert.match(layout, /\/favicon\.ico/);
  assert.match(layout, /\/apple-touch-icon\.png/);
  assert.match(manifest, /web-app-manifest-192x192\.png/);
  assert.match(manifest, /web-app-manifest-512x512\.png/);
  assert.match(serviceWorker, /mushaf-companion-v4-branding/);
  assert.match(serviceWorker, /\/logo\.png/);
  assert.match(pagesShell, /id="root"/);
  assert.match(pagesShell, /\/mushaf-companion\/manifest\.webmanifest/);
  assert.doesNotMatch(pagesShell, /iframe|chatgpt\.site/i);
  assert.match(pagesWorkflow, /actions\/deploy-pages@v5/);
  assert.match(pagesWorkflow, /npm test/);
  assert.match(pagesWorkflow, /npm run build:pages/);
  assert.match(pagesWorkflow, /npm run verify:pages/);
  assert.match(license, /^MIT License/);
  assert.match(runtimeSource, /chapters\?language=en/);
  assert.match(runtimeSource, /type: "page"/);
  assert.match(searchRoute, /searchQuranSource/);
  assert.match(chaptersRoute, /fetchChaptersFromSource/);
  assert.match(data, /FALLBACK_PAGE/);
  assert.match(page, /My Mushaf/);
  assert.match(page, /buildPageMasteryMap/);
  assert.match(page, /Start Today’s Study/);
  assert.match(page, /createPortableBackup/);
  assert.match(page, /Saheeh International/);
  assert.match(page, /getVerifiedAudioBlob/);
  assert.match(page, /OfflineAudioPanel/);
  assert.match(runtimeSource, /verses\/by_juz/);
  assert.match(audioManifestRoute, /X-Audio-Manifest-Revision/);
  assert.match(offlineAudio, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(offlineAudio, /indexedDB\.open/);
  assert.match(offlineAudio, /deleteAudioPack/);
  assert.match(offlinePanel, /Wi-Fi only/);
  assert.match(offlinePanel, /AUDIO_DOWNLOAD_CONCURRENCY/);
  assert.match(offlinePanel, /Partial downloads never appear as ready/);
  assert.match(page, /openTafsir/);
  assert.match(page, /Study tafsir/);
  assert.match(page, /isVerifiedTafsir/);
  assert.match(runtimeSource, /tafsirs\/\$\{TAFSIR_RESOURCE\.id\}\/by_ayah/);
  assert.match(tafsirRoute, /X-Tafsir-Revision/);
  assert.match(runtimeSource, /contentChecksum/);
  assert.match(tafsirSource, /Ibn Kathir \(Abridged\)/);
  assert.match(tafsirSource, /UNSAFE_BLOCKS/);
  assert.match(tafsirPanel, /SOURCE &amp; EDITION/);
  assert.doesNotMatch(tafsirPanel, /dangerouslySetInnerHTML/);
  assert.match(styles, /\.tafsir-panel/);
  assert.match(layout, /all 604 Quran pages/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});

test("maps verified API words into the 15-line Madani page structure", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/verses/by_page/2")) {
      assert.match(url, /mushaf=1/);
      assert.match(url, /code_v2/);
      assert.match(url, /code_v4/);
      return Response.json({ verses: [{
        verse_number: 1,
        verse_key: "2:1",
        juz_number: 1,
        hizb_number: 1,
        text_uthmani: "الٓمٓ",
        translations: [{ text: "Alif-lam-meem" }],
        words: [
          { id: 11, text_uthmani: "الٓمٓ", text_qpc_hafs: "الٓمٓ", text: "الٓمٓ", code_v2: "v2-glyph", code_v4: "v4-glyph", char_type_name: "word", line_number: 3, page_number: 2 },
          { id: 12, text_uthmani: "١", text_qpc_hafs: "١", text: "ﱂ", char_type_name: "end", line_number: 3, page_number: 2 },
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
    assert.equal(page.lines[2].words[0].qcfCode, "v2-glyph");
    assert.equal(page.lines[2].words[0].qcfTajweedCode, "v4-glyph");
    assert.equal(page.lines[2].words[0].pageNumber, 2);
    assert.equal(page.lines[2].words[1].qcfCode, "ﱂ");
    assert.equal(page.lines[2].words[1].qcfTajweedCode, "ﱂ");
    assert.deepEqual(page.chapterStarts[0], { chapterId: 2, headerLine: 1, bismillahLine: 2 });
    assert.equal(page.provenance.verified, true);
    assert.equal(page.provenance.mushafId, 1);
    assert.match(page.provenance.pageChecksum, /^[a-f0-9]{64}$/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
