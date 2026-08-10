import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configureReaderRuntime, appPath, getReaderRuntimeConfig, normalizeBasePath } from "../app/runtime-config.ts";
import { createPagesReaderTransport } from "../app/content/pages-runtime-transport.ts";
import { findTranslationSource, TRANSLATION_SOURCE_REGISTRY } from "../app/content/source-registry.ts";

test("Pages runtime selection and base-path URL generation are centralized", () => {
  assert.equal(normalizeBasePath("mushaf-companion"), "/mushaf-companion/");
  assert.equal(normalizeBasePath("/mushaf-companion/"), "/mushaf-companion/");
  configureReaderRuntime({ mode: "pages", basePath: "mushaf-companion" });
  assert.deepEqual(getReaderRuntimeConfig(), { mode: "pages", basePath: "/mushaf-companion/" });
  assert.equal(appPath("assets/reader.js"), "/mushaf-companion/assets/reader.js");
  assert.equal(appPath("/manifest.webmanifest"), "/mushaf-companion/manifest.webmanifest");
});

test("Pages transport normalizes and validates the same 15-line page source payload", async () => {
  configureReaderRuntime({ mode: "pages", basePath: "/mushaf-companion/" });
  const fetchImpl = async (input) => {
    const url = String(input);
    if (url.includes("/verses/by_page/2")) {
      return Response.json({ verses: [{
        verse_number: 1,
        verse_key: "2:1",
        juz_number: 1,
        hizb_number: 1,
        text_uthmani: "الٓمٓ",
        translations: [
          { resource_id: 20, text: "Alif, Lam, Meem." },
          { resource_id: 57, text: "Alif-lam-meem" },
        ],
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
      return Response.json({ chapters: [{ id: 2, name_complex: "Al-Baqarah", name_simple: "Al-Baqarah", name_arabic: "البقرة", revelation_place: "madinah", revelation_order: 87, verses_count: 286, pages: [2, 49], bismillah_pre: true, translated_name: { name: "The Cow" } }] });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
  const transport = createPagesReaderTransport(fetchImpl);
  const page = await transport.loadPage(2);
  assert.equal(transport.mode, "pages");
  assert.equal(page.lines.length, 15);
  assert.equal(page.lines[2].words[0].qcfTajweedCode, "v4-glyph");
  assert.equal(page.verses[0].translation, "Alif, Lam, Meem.");
  assert.equal(page.verses[0].transliteration, "Alif-lam-meem");
  assert.equal(page.provenance.verified, true);
  assert.match(page.provenance.pageChecksum, /^[a-f0-9]{64}$/);
});

test("Pages transport uses static verified Amharic acquisition and preserves blocked sources", async () => {
  configureReaderRuntime({ mode: "pages", basePath: "/mushaf-companion/" });
  const requested = [];
  const transport = createPagesReaderTransport(async (input) => {
    requested.push(String(input));
    return new Response("1.0.1-xml.1", { status: 200 });
  });
  const source = findTranslationSource("quranenc:amharic_zain");
  assert.ok(source?.provider.packageUrl);
  await transport.fetchTranslationPackSource(source.provider.packageUrl);
  await transport.fetchTranslationPackSource(source.provider.checkForUpdatesUrl);
  assert.deepEqual(requested, [
    "/mushaf-companion/content/amharic_zain.xml",
    "/mushaf-companion/content/amharic_zain-update.txt",
  ]);
  assert.equal(source.integrity.rawChecksum, "3b765a67dc43eb54fc08518c66964ea246209c1284def73d1a69d8c7663780f9");
  assert.equal(source.integrity.normalizedChecksum, "77ac2ad5f35ba878b07bc7aed9f233ee418a6f43dbe4d095d6ae32f3153ffb13");
  assert.equal(TRANSLATION_SOURCE_REGISTRY.find((item) => item.sourceId === "quranenc:somali_yacob")?.candidateStatus, "blocked");
  assert.equal(TRANSLATION_SOURCE_REGISTRY.find((item) => item.sourceId === "quranenc:oromo_ababor")?.candidateStatus, "blocked");
});

test("Pages tafsir transport preserves resource 169 mapping and SHA-256 provenance", async () => {
  configureReaderRuntime({ mode: "pages", basePath: "/mushaf-companion/" });
  const transport = createPagesReaderTransport(async (input) => {
    assert.match(String(input), /\/tafsirs\/169\/by_ayah\/2%3A255$/);
    return Response.json({ tafsir: { resource_id: 169, verses: { "2:255": {} }, text: "<h2>Ayat al-Kursi</h2><p>Verified commentary.</p>" } });
  });
  const document = await transport.loadTafsir("2:255");
  assert.equal(document.resource.id, 169);
  assert.deepEqual(document.mappedVerseKeys, ["2:255"]);
  assert.equal(document.provenance.verified, true);
  assert.match(document.provenance.contentChecksum, /^[a-f0-9]{64}$/);
});

test("standalone source, PWA scope, navigation fallback, and workflow remove the wrapper runtime", async () => {
  const [page, panel, pagesTransport, entry, index, manifestText, serviceWorker, register, workflow, verifier] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/offline-audio-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/content/pages-runtime-transport.ts", import.meta.url), "utf8"),
    readFile(new URL("../pages-static/main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../pages-static/index.html", import.meta.url), "utf8"),
    readFile(new URL("../pages-static/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../pages-static/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../app/pwa-register.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8"),
    readFile(new URL("../scripts/verify-pages-artifact.mjs", import.meta.url), "utf8"),
  ]);
  const pagesRuntimeSource = `${page}\n${panel}\n${pagesTransport}\n${entry}\n${index}`;
  assert.doesNotMatch(pagesRuntimeSource, /["'`]\/api\//);
  assert.doesNotMatch(pagesRuntimeSource, /chatgpt\.site|<iframe\b/i);
  assert.match(entry, /configureReaderRuntime\(\{ mode: "pages", basePath: "\/mushaf-companion\/" \}\)/);
  assert.match(entry, /<Home \/>/);
  assert.match(page, /AyahContextLens/);
  assert.match(page, />Context</);
  assert.match(page, />Hifz</);

  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.start_url, "/mushaf-companion/?source=pwa");
  assert.equal(manifest.scope, "/mushaf-companion/");
  assert.match(register, /appPath\("sw\.js"\)/);
  assert.match(register, /scope: appPath\(\)/);
  assert.match(serviceWorker, /SCOPE_PATH = "\/mushaf-companion\/"/);
  assert.match(serviceWorker, /mushaf-pages-v5-standalone-reader/);
  assert.match(serviceWorker, /PAGES_BUILD_ASSETS/);
  assert.match(serviceWorker, /\.\.\.BUILD_ASSETS/);
  assert.match(serviceWorker, /caches\.match\(asset\("\.\/index\.html"\)\)/);
  assert.doesNotMatch(workflow, /cp -R github-pages|github-pages\/index\.html/);
  assert.match(workflow, /npm run lint/);
  assert.match(workflow, /npm run audit:translations/);
  assert.match(workflow, /npm run build:pages/);
  assert.match(workflow, /npm run verify:pages/);
  assert.match(verifier, /same-origin server API path/);
  assert.match(verifier, /Pages index must not be an iframe shell/);
});
