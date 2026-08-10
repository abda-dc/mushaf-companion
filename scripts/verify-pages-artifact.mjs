import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const root = process.cwd();
const outputDirectory = resolve(root, process.argv[2] || "_site");
const basePath = "/mushaf-companion/";

async function filesUnder(directory) {
  const entries = await readdir(directory);
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry);
    if ((await stat(path)).isDirectory()) files.push(...await filesUnder(path));
    else files.push(path);
  }
  return files;
}

function artifactPath(urlPath) {
  assert.ok(urlPath.startsWith(basePath), `Asset path is outside ${basePath}: ${urlPath}`);
  return resolve(outputDirectory, urlPath.slice(basePath.length));
}

const [index, fallback, manifestText, serviceWorker, buildText, amharicBytes] = await Promise.all([
  readFile(resolve(outputDirectory, "index.html"), "utf8"),
  readFile(resolve(outputDirectory, "404.html"), "utf8"),
  readFile(resolve(outputDirectory, "manifest.webmanifest"), "utf8"),
  readFile(resolve(outputDirectory, "sw.js"), "utf8"),
  readFile(resolve(outputDirectory, "content/pages-build.json"), "utf8"),
  readFile(resolve(outputDirectory, "content/amharic_zain.xml")),
]);
const manifest = JSON.parse(manifestText);
const buildMetadata = JSON.parse(buildText);
const files = await filesUnder(outputDirectory);
const textFiles = files.filter((path) => new Set([".html", ".js", ".css", ".json", ".webmanifest", ".txt", ".xml"]).has(extname(path)));
const combined = (await Promise.all(textFiles.map((path) => readFile(path, "utf8")))).join("\n");

assert.doesNotMatch(combined, /(?:[a-z0-9-]+\.)?chatgpt\.site/i, "Pages artifact must not depend on chatgpt.site.");
assert.doesNotMatch(index, /<iframe\b/i, "Pages index must not be an iframe shell.");
assert.doesNotMatch(combined, /<iframe\b/i, "Pages artifact must not contain an iframe reader.");
assert.doesNotMatch(index, /http-equiv=["']refresh|window\.location\s*=|location\.replace\(/i, "Pages index must not redirect elsewhere.");
assert.match(index, /<div id="root"/i, "Pages index is missing the React application root.");

const scripts = [...index.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
const styles = [...index.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((match) => match[1]);
assert.ok(scripts.length, "Pages index is missing the reader JavaScript application.");
assert.ok(styles.length, "Pages index is missing the reader stylesheet.");
for (const url of [...scripts, ...styles]) await stat(artifactPath(url));
for (const url of [...scripts, ...styles]) {
  const relativeAsset = `./${url.slice(basePath.length)}`;
  assert.ok(serviceWorker.includes(JSON.stringify(relativeAsset)), `Service worker does not pre-cache ${url}.`);
}

const rootAssetUrls = [...index.matchAll(/(?:src|href)="(\/[^"#?]*)/g)].map((match) => match[1]);
assert.ok(rootAssetUrls.length >= 4, "Pages index has too few application assets.");
for (const url of rootAssetUrls) assert.ok(url.startsWith(basePath), `Broken repository-base asset path: ${url}`);

assert.match(combined, /Ayah Context Lens/);
for (const label of ["Tajweed", "Transliteration", "Translation", "Context", "Tafsir", "Hifz"]) assert.match(combined, new RegExp(label));
assert.doesNotMatch(combined.replaceAll("https://api.quran.com/api/v4", ""), /["'`]\/api\//, "Pages bundle contains a same-origin server API path.");

assert.equal(manifest.id, basePath);
assert.equal(manifest.scope, basePath);
assert.equal(manifest.start_url, `${basePath}?source=pwa`);
for (const icon of manifest.icons) assert.ok(icon.src.startsWith(basePath), `Manifest icon is outside scope: ${icon.src}`);
assert.match(serviceWorker, /SCOPE_PATH = "\/mushaf-companion\/"/);
assert.match(serviceWorker, /mushaf-pages-v5-standalone-reader/);
assert.match(serviceWorker, /key\.startsWith\("mushaf-pages-"\)/, "Service worker must migrate wrapper caches.");
assert.match(serviceWorker, /caches\.match\(asset\("\.\/index\.html"\)\)/, "Service worker lacks static navigation fallback.");
assert.equal(fallback, index, "404 fallback must boot the same reader application.");

assert.equal(buildMetadata.runtime, "pages");
assert.equal(buildMetadata.basePath, basePath);
assert.equal(buildMetadata.amharic.records, 6236);
assert.equal(buildMetadata.amharic.rawChecksum, "3b765a67dc43eb54fc08518c66964ea246209c1284def73d1a69d8c7663780f9");
assert.equal(buildMetadata.amharic.normalizedChecksum, "77ac2ad5f35ba878b07bc7aed9f233ee418a6f43dbe4d095d6ae32f3153ffb13");
assert.equal(createHash("sha256").update(amharicBytes).digest("hex"), buildMetadata.amharic.rawChecksum);

console.log(`Verified standalone Pages artifact at ${outputDirectory}`);
console.log(`${scripts.length} reader script(s), ${styles.length} stylesheet(s), correct ${basePath} scope, no iframe or ChatGPT Site dependency.`);
