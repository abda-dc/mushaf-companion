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

test("server-renders the Mushaf Companion reader", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Mushaf Companion — Faithful Quran Reading<\/title>/i);
  assert.match(html, /aria-label="Page 1, Surah Al-Fatihah"/);
  assert.match(html, /ٱلْفَاتِحَةِ/);
  assert.match(html, /class="verse-text tajweed-on"/);
  assert.match(html, /translate="no"/);
  assert.match(html, /https:\/\/verses\.quran\.foundation\/Alafasy/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps authenticated content separate from the interactive renderer", async () => {
  const [page, data, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/quran-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /from "\.\/quran-data"/);
  assert.match(page, /localStorage\.setItem\("mushaf:last-ayah"/);
  assert.match(page, /Repeat mode/);
  assert.match(data, /api\.quran\.com\/api\/v4\/verses\/by_chapter\/1/);
  assert.equal((data.match(/key: "1:/g) ?? []).length, 7);
  assert.match(layout, /google: "notranslate"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
