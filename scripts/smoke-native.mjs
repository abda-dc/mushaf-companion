import assert from "node:assert/strict";
import { resolve } from "node:path";
import { createPagesServer } from "./serve-pages.mjs";

const server = createPagesServer({ directory: resolve(process.cwd(), "native-runtime"), basePath: "/" });
await new Promise((resolvePromise, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolvePromise);
});

try {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Native static server did not expose a TCP port.");
  const base = `http://127.0.0.1:${address.port}/`;
  const home = await fetch(base);
  const refresh = await fetch(`${base}?page=42`);
  assert.equal(home.status, 200);
  assert.equal(refresh.status, 200);
  const html = await home.text();
  assert.equal(await refresh.text(), html);
  const script = html.match(/<script[^>]+src="([^"]+)"/)?.[1];
  const style = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/)?.[1];
  assert.ok(script && style);
  const responses = await Promise.all([
    fetch(new URL(script, base)),
    fetch(new URL(style, base)),
    fetch(`${base}content/native-build.json`),
    fetch(`${base}audio/adhan/regular-adhan.mp3`, { method: "HEAD" }),
    fetch(`${base}audio/adhan/fajr-adhan.mp3`, { method: "HEAD" }),
  ]);
  for (const response of responses) assert.equal(response.status, 200);
  const metadata = await responses[2].json();
  assert.equal(metadata.runtime, "native");
  console.log(`Native local-start smoke passed at ${base}`);
  console.log("Local HTML, reader JavaScript, stylesheet, provenance, and both full-playback Adhan assets loaded without the former remote application URL.");
} finally {
  server.closeAllConnections();
  await new Promise((resolvePromise) => server.close(resolvePromise));
}
