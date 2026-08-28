import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { APPROVED_FULL_ADHAN_ASSETS, APPROVED_ADHAN_CUES } from "../app/adhan-assets.ts";
import { listPagesArtifactFiles, verifyEducationArtifactPolicy } from "./education-artifact-policy.mjs";

const root = process.cwd();
const outputDirectory = resolve(root, "native-runtime");
const [index, metadataText, capacitorConfig, packageText] = await Promise.all([
  readFile(resolve(outputDirectory, "index.html"), "utf8"),
  readFile(resolve(outputDirectory, "content/native-build.json"), "utf8"),
  readFile(resolve(root, "capacitor.config.ts"), "utf8"),
  readFile(resolve(root, "package.json"), "utf8"),
]);
const metadata = JSON.parse(metadataText);
const packageJson = JSON.parse(packageText);

assert.match(capacitorConfig, /webDir:\s*"native-runtime"/);
assert.doesNotMatch(capacitorConfig, /server:\s*\{|chatgpt\.site/i);
assert.equal(metadata.runtime, "native");
assert.equal(metadata.basePath, "/");
assert.equal(metadata.applicationVersion, packageJson.version);
assert.match(metadata.sourceSha, /^[a-f0-9]{40}$/);
assert.equal(typeof metadata.sourceDirty, "boolean");
assert.match(metadata.buildIdentity, new RegExp(`^${packageJson.version.replaceAll(".", "\\.")}\\+[a-f0-9]{12}(?:\\.dirty)?$`));
assert.equal(metadata.applicationIndexSha256, createHash("sha256").update(index).digest("hex"));
assert.equal(metadata.education.status, "disabled");
assert.equal(metadata.education.bundled, false);

assert.doesNotMatch(index, /mushaf-companion\/|chatgpt\.site|manifest\.webmanifest/i);
const scriptPath = index.match(/<script[^>]+src="([^"]+)"/)?.[1];
const stylePath = index.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/)?.[1];
assert.ok(scriptPath?.startsWith("./assets/"), "Native reader JavaScript path is not relative.");
assert.ok(stylePath?.startsWith("./assets/"), "Native reader stylesheet path is not relative.");
const [script, style] = await Promise.all([
  readFile(resolve(outputDirectory, scriptPath.slice(2)), "utf8"),
  readFile(resolve(outputDirectory, stylePath.slice(2)), "utf8"),
]);
assert.ok(script.length > 100_000, "Native reader JavaScript is unexpectedly small.");
assert.ok(style.length > 10_000, "Native reader stylesheet is unexpectedly small.");
assert.match(script, /Prayer and Qibla/);
assert.match(script, /Regular Adhan/);
assert.match(script, /Fajr Adhan/);
assert.doesNotMatch(script, /chatgpt\.site/i);

assert.equal(APPROVED_ADHAN_CUES.length, 0, "Full Adhan recordings became notification cues.");
assert.equal(APPROVED_FULL_ADHAN_ASSETS.length, 2);
for (const asset of APPROVED_FULL_ADHAN_ASSETS) {
  assert.equal(asset.purpose, "full-playback");
  const bytes = await readFile(resolve(outputDirectory, asset.fileName));
  assert.equal(createHash("sha256").update(bytes).digest("hex").toUpperCase(), asset.checksumSha256);
}

await Promise.all([
  assert.rejects(access(resolve(outputDirectory, "sw.js"))),
  assert.rejects(access(resolve(outputDirectory, "manifest.webmanifest"))),
]);
await verifyEducationArtifactPolicy(outputDirectory, await listPagesArtifactFiles(outputDirectory), metadata.education, "native");
console.log(`Verified native runtime ${metadata.buildIdentity}`);
console.log(`${script.length} bytes of reader JavaScript, ${style.length} bytes of stylesheet, both reviewed Adhan assets, no remote application shell or native service worker.`);
