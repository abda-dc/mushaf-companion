import assert from "node:assert/strict";
import { createPagesServer } from "./serve-pages.mjs";

const server = createPagesServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

try {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Static server did not expose a TCP port.");
  const base = `http://127.0.0.1:${address.port}/mushaf-companion/`;
  const [home, refresh, manifestResponse, serviceWorkerResponse] = await Promise.all([
    fetch(base),
    fetch(`${base}?page=42`),
    fetch(`${base}manifest.webmanifest`),
    fetch(`${base}sw.js`),
  ]);
  assert.equal(home.status, 200);
  assert.equal(refresh.status, 200);
  assert.equal(manifestResponse.status, 200);
  assert.equal(serviceWorkerResponse.status, 200);
  const [html, refreshedHtml, manifest, serviceWorker] = await Promise.all([
    home.text(),
    refresh.text(),
    manifestResponse.json(),
    serviceWorkerResponse.text(),
  ]);
  assert.equal(refreshedHtml, html);
  assert.match(html, /<div id="root"/);
  assert.doesNotMatch(html, /iframe|chatgpt\.site/i);
  const script = html.match(/<script[^>]+src="([^"]+)"/)?.[1];
  const style = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/)?.[1];
  assert.ok(script && style);
  const [scriptResponse, styleResponse] = await Promise.all([
    fetch(new URL(script, base)),
    fetch(new URL(style, base)),
  ]);
  assert.equal(scriptResponse.status, 200);
  assert.equal(styleResponse.status, 200);
  assert.equal(manifest.scope, "/mushaf-companion/");
  assert.equal(manifest.start_url, "/mushaf-companion/?source=pwa");
  assert.match(serviceWorker, /SCOPE_PATH = "\/mushaf-companion\/"/);
  assert.match(serviceWorker, /index\.html/);
  console.log(`Static Pages smoke passed at ${base}`);
  console.log("Initial load, query refresh, JS/CSS, manifest, service worker, scope, and wrapper removal verified.");
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
