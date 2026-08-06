import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTafsirBlocks, normalizeTafsirPayload, TAFSIR_RESOURCE } from "../app/tafsir-source.mjs";

test("normalizes provider tafsir markup into safe structured text", () => {
  const blocks = normalizeTafsirBlocks(`
    <script>alert("unsafe")</script>
    <h2 onclick="unsafe()">A verified heading</h2>
    <p>Commentary &amp; citation <a href="https://example.invalid">reference</a>.</p>
    <blockquote><strong>Quoted</strong> narration</blockquote>
    <ul><li>First point</li></ul>
  `);
  assert.deepEqual(blocks, [
    { type: "heading", text: "A verified heading" },
    { type: "paragraph", text: "Commentary & citation reference ." },
    { type: "quote", text: "Quoted narration" },
    { type: "list-item", text: "First point" },
  ]);
  assert.ok(blocks.every((block) => !/[<>]|unsafe|alert/.test(block.text)));
});

test("fails closed when resource or verse mapping does not match", () => {
  const document = normalizeTafsirPayload({ tafsir: {
    resource_id: TAFSIR_RESOURCE.id,
    resource_name: TAFSIR_RESOURCE.name,
    verses: { "2:255": { id: 262 } },
    text: "<h2>Ayat Al-Kursi</h2><p>Commentary.</p>",
  } }, "2:255");
  assert.equal(document.resource.id, 169);
  assert.deepEqual(document.mappedVerseKeys, ["2:255"]);
  assert.equal(document.sectionLabel, "Ayah 2:255");
  const grouped = normalizeTafsirPayload({ tafsir: { resource_id: 169, verses: { "2:8": {}, "2:9": {} }, text: "<p>Grouped commentary</p>" } }, "2:8");
  assert.equal(grouped.sectionLabel, "Ayat 2:8–2:9");
  assert.throws(() => normalizeTafsirPayload({ tafsir: { resource_id: 999, verses: { "2:255": {} }, text: "<p>Wrong edition</p>" } }, "2:255"));
  assert.throws(() => normalizeTafsirPayload({ tafsir: { resource_id: 169, verses: { "2:256": {} }, text: "<p>Wrong mapping</p>" } }, "2:255"));
});

test("tafsir API returns attributed checksummed sections and rejects invalid keys", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    assert.match(url, /\/tafsirs\/169\/by_ayah\/2%3A255$/);
    return Response.json({ tafsir: {
      resource_id: 169,
      resource_name: "Ibn Kathir (Abridged)",
      verses: { "2:255": { id: 262 } },
      text: "<h2>The Virtue of Ayat Al-Kursi</h2><p>Verified commentary.</p>",
    } });
  };
  try {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("tafsir-test", `${process.pid}-${Date.now()}`);
    const { default: worker } = await import(workerUrl.href);
    const assets = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
    const context = { waitUntil() {}, passThroughOnException() {} };
    const response = await worker.fetch(new Request("http://localhost/api/tafsir?verse=2%3A255"), assets, context);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-tafsir-resource"), "169");
    assert.equal(response.headers.get("x-tafsir-revision"), TAFSIR_RESOURCE.revision);
    const document = await response.json();
    assert.equal(document.requestedVerseKey, "2:255");
    assert.equal(document.resource.author, "Hafiz Ibn Kathir");
    assert.match(document.provenance.contentChecksum, /^[a-f0-9]{64}$/);
    assert.deepEqual(document.blocks.map((block) => block.type), ["heading", "paragraph"]);
    assert.ok(document.blocks.every((block) => !block.text.includes("<")));

    const invalid = await worker.fetch(new Request("http://localhost/api/tafsir?verse=not-an-ayah"), assets, context);
    assert.equal(invalid.status, 400);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
