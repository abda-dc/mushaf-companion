import assert from "node:assert/strict";
import test from "node:test";
import {
  AUDIO_AVERAGE_BYTES_PER_VERSE,
  AUDIO_MANIFEST_REVISION,
  audioFileKey,
  audioPackKey,
  audioStreamUrl,
  createAudioPackManifest,
} from "../app/audio-manifest.mjs";
import {
  audioPackProgress,
  createAudioPackState,
  formatAudioBytes,
  isTransientAudioFailure,
  sha256ArrayBuffer,
  updateAudioPackFile,
} from "../app/offline-audio.mjs";

test("builds stable, source-attributed surah and juz audio manifests", () => {
  const manifest = createAudioPackManifest({ type: "surah", id: 1, label: "Sūrah Al-Fatihah", verseKeys: ["1:1", "1:2", "1:2", "bad"] });
  assert.equal(manifest.revision, AUDIO_MANIFEST_REVISION);
  assert.equal(manifest.pack.id, audioPackKey("surah", 1));
  assert.equal(manifest.pack.verseCount, 2);
  assert.equal(manifest.pack.estimatedBytes, AUDIO_AVERAGE_BYTES_PER_VERSE * 2);
  assert.deepEqual(manifest.files.map((file) => file.key), [audioFileKey("alafasy", "1:1"), audioFileKey("alafasy", "1:2")]);
  assert.match(manifest.reciter.sourceUrl, /quran\.foundation/);
  assert.throws(() => createAudioPackManifest({ type: "juz", id: 31, verseKeys: ["1:1"] }));
});

test("keeps every existing reciter URL stable while enabling downloaded-first Alafasy", () => {
  assert.equal(audioStreamUrl("alafasy", "1:1"), "https://verses.quran.foundation/Alafasy/mp3/001001.mp3");
  assert.match(audioStreamUrl("aymen", "2:255"), /Ayman_Sowaid_64kbps\/002255\.mp3/);
  assert.match(audioStreamUrl("minshawi-kids", "114:6"), /Minshawy_Teacher_128kbps\/114006\.mp3/);
  assert.match(audioStreamUrl("abdul-rashid-sufi", "18:1"), /abdul-rashid-sofi\/murattal\/018/);
});

test("partial packs cannot become complete until every checksum exists", () => {
  const manifest = createAudioPackManifest({ type: "surah", id: 1, verseKeys: ["1:1", "1:2"] });
  let pack = createAudioPackState(manifest, [{ key: "alafasy|1:1", size: 146830, checksum: "a".repeat(64) }]);
  assert.equal(pack.completedFiles, 1);
  assert.equal(audioPackProgress(pack), 50);
  pack = updateAudioPackFile(pack, "alafasy|1:2", { status: "complete", size: 120000, checksum: "b".repeat(64) });
  assert.equal(pack.completedFiles, 2);
  assert.equal(audioPackProgress(pack), 100);
  assert.equal(formatAudioBytes(pack.totalBytes), "261 KB");
});

test("checksum and retry helpers fail closed", async () => {
  const bytes = new TextEncoder().encode("abc");
  assert.equal(await sha256ArrayBuffer(bytes.buffer), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(isTransientAudioFailure(429), true);
  assert.equal(isTransientAudioFailure(503), true);
  assert.equal(isTransientAudioFailure(404), false);
});

test("audio manifest API follows pagination and rejects unsupported packs", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (!url.pathname.includes("/verses/by_juz/30")) throw new Error(`Unexpected fetch: ${url}`);
    const page = Number(url.searchParams.get("page"));
    return Response.json(page === 1
      ? { verses: [{ verse_key: "78:1" }, { verse_key: "78:2" }], pagination: { next_page: 2 } }
      : { verses: [{ verse_key: "78:3" }], pagination: { next_page: null } });
  };
  try {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("audio-manifest-test", `${process.pid}-${Date.now()}`);
    const { default: worker } = await import(workerUrl.href);
    const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
    const context = { waitUntil() {}, passThroughOnException() {} };
    const response = await worker.fetch(new Request("http://localhost/api/audio-manifest?type=juz&id=30&reciter=alafasy"), env, context);
    assert.equal(response.status, 200);
    const manifest = await response.json();
    assert.equal(manifest.pack.verseCount, 3);
    assert.deepEqual(manifest.files.map((file) => file.verseKey), ["78:1", "78:2", "78:3"]);
    assert.equal(response.headers.get("X-Audio-Manifest-Revision"), AUDIO_MANIFEST_REVISION);
    const rejected = await worker.fetch(new Request("http://localhost/api/audio-manifest?type=quran&id=1"), env, context);
    assert.equal(rejected.status, 400);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
