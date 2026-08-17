import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

test("locks representative Madani page geometry to official fixtures", async () => {
  const fixture = JSON.parse(await readFile(new URL("./fixtures/page-fidelity.json", import.meta.url), "utf8"));
  assert.equal(fixture.fixtures.length, 7);
  assert.deepEqual(fixture.fixtures.map((item) => item.page), [1, 2, 3, 187, 293, 416, 604]);
  assert.equal(fixture.fixtures.find((item) => item.page === 187).chapterStarts[0], "9:1");
  assert.deepEqual(fixture.fixtures.find((item) => item.page === 416).sajdahVerses, ["32:15"]);
  assert.deepEqual(fixture.fixtures.find((item) => item.page === 604).chapterStarts, ["112:1", "113:1", "114:1"]);
  assert.ok(fixture.fixtures.every((item) => item.firstContentLine >= 1 && item.lastContentLine <= 15 && item.occupiedLines <= 15));
});

test("page delivery enforces provenance, checksum, and fixed line slots", async () => {
  const [route, source, editions, data, styles, manifest] = await Promise.all([
    readFile(new URL("../app/api/pages/[page]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/content/quran-runtime-source.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/content/quran-page-editions.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/quran-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/content-manifest.ts", import.meta.url), "utf8"),
  ]);
  assert.match(source, /assertVerifiedStructure/);
  assert.match(source, /sha256Hex/);
  assert.match(route, /X-Quran-Content-Revision/);
  assert.match(source, /edition\.translationResourceId/);
  assert.match(source, /edition\.transliterationResourceId/);
  assert.match(editions, /mushafId: CONTENT_MANIFEST\.edition\.mushafId/);
  assert.match(editions, /translationResourceId: CONTENT_MANIFEST\.resources\.translation\.id/);
  assert.match(editions, /transliterationResourceId: CONTENT_MANIFEST\.resources\.transliteration\.id/);
  assert.match(data, /PageProvenance/);
  assert.match(styles, /grid-template-rows: repeat\(15/);
  assert.match(manifest, /Hafs 'an Asim/);
  assert.match(manifest, /Saheeh International/);
  assert.match(manifest, /TAFSIR_RESOURCE/);
  assert.match(manifest, /TRANSLATION_SOURCE_REGISTRY_MANIFEST/);
  assert.match(manifest, /translationSources:/);
  assert.match(manifest, /attribution:/);
  assert.match(manifest, /license:/);
});

test("locks reviewed desktop and responsive screenshots for every representative page", async () => {
  const pages = [1, 2, 3, 187, 293, 416, 604];
  const layouts = [
    { name: "desktop", width: 1440, height: 1200 },
    { name: "mobile", width: 500, height: 900 },
  ];
  const pngSignature = "89504e470d0a1a0a";
  for (const layout of layouts) {
    for (const page of pages) {
      const url = new URL(`./fixtures/page-fidelity/${layout.name}/page-${String(page).padStart(3, "0")}.png`, import.meta.url);
      const [metadata, image] = await Promise.all([stat(url), readFile(url)]);
      assert.ok(metadata.size > 50_000, `${layout.name} page ${page} should contain a rendered Mushaf page`);
      assert.equal(image.subarray(0, 8).toString("hex"), pngSignature);
      assert.equal(image.readUInt32BE(16), layout.width);
      assert.equal(image.readUInt32BE(20), layout.height);
    }
  }
});

test("records a successful full-corpus trust audit", async () => {
  const report = JSON.parse(await readFile(new URL("../docs/content-audit.json", import.meta.url), "utf8"));
  assert.equal(report.status, "passed");
  assert.equal(report.pagesAudited, 604);
  assert.equal(report.versesVerified, 6236);
  assert.deepEqual(report.representativeFixtures, [1, 2, 3, 187, 293, 416, 604]);
  assert.match(report.corpusChecksum, /^[a-f0-9]{64}$/);
  assert.equal(Object.keys(report.pageChecksums).length, 604);
});
