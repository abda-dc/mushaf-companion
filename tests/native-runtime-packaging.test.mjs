import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configureReaderRuntime, getReaderRuntimeConfig } from "../app/runtime-config.ts";

test("native runtime configuration is explicit and production Capacitor has no remote application server", async () => {
  const [capacitor, nativeConfig, entry] = await Promise.all([
    readFile(new URL("../capacitor.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../vite.native.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../pages-static/main.tsx", import.meta.url), "utf8"),
  ]);
  configureReaderRuntime({ mode: "native", basePath: "/" });
  assert.deepEqual(getReaderRuntimeConfig(), { mode: "native", basePath: "/" });
  assert.match(capacitor, /webDir: "native-runtime"/);
  assert.doesNotMatch(capacitor, /server:\s*\{|chatgpt\.site/i);
  assert.match(nativeConfig, /base: "\.\/"/);
  assert.match(nativeConfig, /__MUSHAF_RUNTIME_MODE__: JSON\.stringify\("native"\)/);
  assert.match(entry, /runtimeMode === "pages" && <PwaRegister \/>/);
});

test("native build and workflow require local reader assets, provenance, and exact M13D media", async () => {
  const [builder, verifier, workflow, packageText] = await Promise.all([
    readFile(new URL("../scripts/build-static-runtime.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/verify-native-artifact.mjs", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/native-packages.yml", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const packageJson = JSON.parse(packageText);
  assert.match(builder, /content\/native-build\.json/);
  assert.match(builder, /sourceSha/);
  assert.match(builder, /runtime: "native"/);
  assert.match(builder, /rm\(resolve\(outputDirectory, "sw\.js"\)/);
  assert.match(verifier, /Prayer and Qibla/);
  assert.match(verifier, /Regular Adhan/);
  assert.match(verifier, /Fajr Adhan/);
  assert.match(verifier, /APPROVED_ADHAN_CUES\.length, 0/);
  assert.match(verifier, /asset\.checksumSha256/);
  assert.match(workflow, /npm run build:native[\s\S]+npm run verify:native[\s\S]+npx cap sync android/);
  assert.match(workflow, /npm run build:native[\s\S]+npm run verify:native[\s\S]+npx cap sync ios/);
  assert.match(packageJson.scripts["build:native"], /build-native\.mjs/);
});

test("Pages retains repository-scoped runtime while native paths remain relative", async () => {
  const [pagesConfig, nativeConfig, pagesIndex] = await Promise.all([
    readFile(new URL("../vite.pages.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../vite.native.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../pages-static/index.html", import.meta.url), "utf8"),
  ]);
  assert.match(pagesConfig, /base: "\/mushaf-companion\/"/);
  assert.match(pagesConfig, /__MUSHAF_RUNTIME_MODE__: JSON\.stringify\("pages"\)/);
  assert.match(nativeConfig, /replaceAll\("\/mushaf-companion\/", "\.\/"\)/);
  assert.match(pagesIndex, /\/mushaf-companion\/manifest\.webmanifest/);
});
