import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_READING_ID } from "../app/reading-registry.mjs";
import {
  getDefaultQuranPageEdition,
  QURAN_PAGE_EDITIONS,
  resolveQuranPageEdition,
} from "../app/content/quran-page-editions.ts";
import {
  fetchQuranPageForReadingFromSource,
  fetchQuranPageFromSource,
} from "../app/content/quran-runtime-source.ts";

test("M11.2 maps the canonical Hafs reading to the existing verified Mushaf 1 edition", () => {
  const edition = resolveQuranPageEdition(DEFAULT_READING_ID);

  assert.equal(QURAN_PAGE_EDITIONS.length, 1);
  assert.equal(edition, getDefaultQuranPageEdition());
  assert.equal(edition.id, "quran-foundation-mushaf-1");
  assert.equal(edition.readingId, "hafs-an-asim");
  assert.equal(edition.provider, "quran-foundation");
  assert.equal(edition.mushafId, 1);
  assert.equal(edition.pages, 604);
  assert.equal(edition.lineCount, 15);
  assert.equal(edition.verseTextField, "text_uthmani");
  assert.equal(edition.wordTextField, "text_qpc_hafs");
  assert.equal(edition.translationResourceId, 20);
  assert.equal(edition.transliterationResourceId, 57);
});

test("M11.2 rejects an unsupported reading before any Quran source request", async () => {
  let requestCount = 0;

  await assert.rejects(
    fetchQuranPageForReadingFromSource(
      "warsh-an-nafi",
      1,
      async () => {
        requestCount += 1;
        throw new Error("network must not be reached");
      },
    ),
    (error) => error?.name === "QuranPageEditionError" &&
      error?.code === "unsupported_reading",
  );

  assert.equal(requestCount, 0);
});

function createFixtureFetch(requested) {
  return async (input) => {
    const url = String(input);
    requested.push(url);

    if (url.includes("/verses/by_page/2")) {
      return Response.json({
        verses: [{
          verse_number: 1,
          verse_key: "2:1",
          juz_number: 1,
          hizb_number: 1,
          text_uthmani: "ALM",
          translations: [
            { resource_id: 20, text: "Alif, Lam, Meem." },
            { resource_id: 57, text: "Alif-lam-meem" },
          ],
          words: [
            {
              id: 11,
              text_uthmani: "ALM",
              text_qpc_hafs: "ALM",
              text: "ALM",
              code_v2: "v2-glyph",
              code_v4: "v4-glyph",
              char_type_name: "word",
              line_number: 3,
              page_number: 2,
            },
            {
              id: 12,
              text_uthmani: "1",
              text_qpc_hafs: "1",
              text: "1",
              char_type_name: "end",
              line_number: 3,
              page_number: 2,
            },
          ],
        }],
      });
    }

    if (url.includes("uthmani_tajweed?page_number=2")) {
      return Response.json({
        verses: [{
          verse_key: "2:1",
          text_uthmani_tajweed: "ALM <span class=end>1</span>",
        }],
      });
    }

    if (url.includes("/chapters?language=en")) {
      return Response.json({
        chapters: [{
          id: 2,
          name_complex: "Al-Baqarah",
          name_simple: "Al-Baqarah",
          name_arabic: "Al-Baqarah",
          revelation_place: "madinah",
          revelation_order: 87,
          verses_count: 286,
          pages: [2, 49],
          bismillah_pre: true,
          translated_name: { name: "The Cow" },
        }],
      });
    }

    throw new Error("Unexpected fetch: " + url);
  };
}

test("M11.2 explicit Hafs acquisition is identical to the legacy default page path", async () => {
  const explicitUrls = [];
  const defaultUrls = [];

  const explicitPage = await fetchQuranPageForReadingFromSource(
    DEFAULT_READING_ID,
    2,
    createFixtureFetch(explicitUrls),
  );

  const defaultPage = await fetchQuranPageFromSource(
    2,
    createFixtureFetch(defaultUrls),
  );

  assert.deepEqual(defaultPage, explicitPage);
  assert.deepEqual(defaultUrls, explicitUrls);

  const byPageUrl = new URL(explicitUrls[0]);
  assert.equal(byPageUrl.searchParams.get("mushaf"), "1");
  assert.equal(byPageUrl.searchParams.get("translations"), "20,57");
  assert.equal(byPageUrl.searchParams.get("fields"), "text_uthmani,sajdah_number");
  assert.equal(
    byPageUrl.searchParams.get("word_fields"),
    "line_number,page_number,text_uthmani,text_qpc_hafs,code_v2,code_v4",
  );

  assert.equal(explicitPage.lines.length, 15);
  assert.equal(explicitPage.verses[0].translation, "Alif, Lam, Meem.");
  assert.equal(explicitPage.verses[0].transliteration, "Alif-lam-meem");
  assert.equal(explicitPage.provenance.mushafId, 1);
  assert.equal(explicitPage.provenance.translationResource, 20);
  assert.equal(explicitPage.provenance.transliterationResource, 57);
  assert.match(explicitPage.provenance.pageChecksum, /^[a-f0-9]{64}$/);
});
