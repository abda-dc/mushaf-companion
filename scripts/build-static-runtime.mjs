import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { build } from "vite";
import { CONTENT_MANIFEST } from "../app/content-manifest.ts";
import { findTranslationSource } from "../app/content/source-registry.ts";
import { fingerprintQuranEncPackage } from "../app/content/providers/quranenc-translation.ts";
import { readResponseBytesWithLimit } from "../app/content/providers/types.ts";
import { createProductionEducationRegistry, PRODUCTION_EDUCATION_RELEASE } from "../app/education-content.ts";
import { listPagesArtifactFiles, verifyEducationArtifactPolicy } from "./education-artifact-policy.mjs";

const execFile = promisify(execFileCallback);
const root = process.cwd();
const amharicSource = findTranslationSource("quranenc:amharic_zain");

async function fetchBuildSourceBytes(url, init) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) });
      if (!response.ok) {
        lastError = new Error(`Source returned status ${response.status} on attempt ${attempt}.`);
        continue;
      }
      return await readResponseBytesWithLimit(response);
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error("Build source acquisition failed after three bounded attempts.", { cause: lastError });
}

async function assertReleasePolicy() {
  if (!amharicSource?.provider.packageUrl || !amharicSource.provider.checkForUpdatesUrl) {
    throw new Error("The pinned Amharic source registry entry is incomplete.");
  }
  if (amharicSource.license.redistribution !== "permitted_with_conditions" || amharicSource.license.offlineStorage !== "permitted") {
    throw new Error("The Amharic source registry does not authorize a static distribution package.");
  }
  const educationReleaseCheck = await createProductionEducationRegistry(async () => {
    throw new Error("A disabled education release must not resolve Quran references.");
  }).loadFirstApprovedCatalog();
  if (educationReleaseCheck.status !== "disabled") {
    throw new Error(`Static builds cannot bundle an unapproved education release: ${educationReleaseCheck.status === "ready" ? "an active catalog is not declared in the release manifest" : educationReleaseCheck.reason}`);
  }
}

async function acquireAmharicPackage(contentDirectory) {
  const packageBytes = await fetchBuildSourceBytes(amharicSource.provider.packageUrl, {
    cache: "no-store",
    redirect: "follow",
    headers: { accept: "application/xml,text/xml;q=0.9" },
  });
  const fingerprint = await fingerprintQuranEncPackage(amharicSource, packageBytes);
  if (
    fingerprint.rawChecksum !== amharicSource.integrity.rawChecksum
    || fingerprint.normalizedChecksum !== amharicSource.integrity.normalizedChecksum
    || fingerprint.records !== 6236
  ) {
    throw new Error(`Amharic package verification failed: ${JSON.stringify(fingerprint)}.`);
  }
  await writeFile(resolve(contentDirectory, "amharic_zain.xml"), packageBytes);
  await writeFile(resolve(contentDirectory, "amharic_zain-update.txt"), `${amharicSource.edition.revision}\n`, "utf8");
  return fingerprint;
}

function applicationAssets(index) {
  return [
    ...index.matchAll(/<script[^>]+src="([^"]+)"/g),
    ...index.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g),
  ].map((match) => match[1]);
}

async function sourceState() {
  const environmentSha = process.env.GITHUB_SHA;
  const { stdout: headOutput } = await execFile("git", ["rev-parse", "HEAD"], { cwd: root });
  const sourceSha = environmentSha && /^[a-f0-9]{40}$/i.test(environmentSha)
    ? environmentSha.toLowerCase()
    : headOutput.trim().toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(sourceSha)) throw new Error("Native source revision is unavailable.");
  const { stdout: statusOutput } = await execFile("git", ["status", "--porcelain=v1", "--untracked-files=all"], { cwd: root });
  return { sourceSha, sourceDirty: Boolean(statusOutput.trim()) };
}

async function writePagesFiles(outputDirectory, index, buildMetadata) {
  await Promise.all([
    copyFile(resolve(root, "pages-static/manifest.webmanifest"), resolve(outputDirectory, "manifest.webmanifest")),
    copyFile(resolve(root, "pages-static/offline.html"), resolve(outputDirectory, "offline.html")),
    copyFile(resolve(outputDirectory, "index.html"), resolve(outputDirectory, "404.html")),
  ]);
  const assets = applicationAssets(index).map((asset) => `./${asset.replace(/^\/mushaf-companion\//, "")}`);
  if (assets.length < 2) throw new Error("The Pages reader JavaScript and stylesheet were not emitted.");
  const serviceWorkerTemplate = await readFile(resolve(root, "pages-static/sw.js"), "utf8");
  if (!serviceWorkerTemplate.includes("/* PAGES_BUILD_ASSETS */ []")) throw new Error("The Pages service-worker asset marker is missing.");
  await writeFile(
    resolve(outputDirectory, "sw.js"),
    serviceWorkerTemplate.replace("/* PAGES_BUILD_ASSETS */ []", JSON.stringify(assets)),
    "utf8",
  );
  await writeFile(resolve(outputDirectory, "content/pages-build.json"), `${JSON.stringify(buildMetadata, null, 2)}\n`, "utf8");
}

async function writeNativeFiles(outputDirectory, index, packageVersion) {
  await Promise.all([
    rm(resolve(outputDirectory, "manifest.webmanifest"), { force: true }),
    rm(resolve(outputDirectory, "offline.html"), { force: true }),
    rm(resolve(outputDirectory, "sw.js"), { force: true }),
  ]);
  const assets = applicationAssets(index);
  if (assets.length < 2 || assets.some((asset) => !asset.startsWith("./assets/"))) {
    throw new Error(`Native application assets are not local relative paths: ${JSON.stringify(assets)}.`);
  }
  const state = await sourceState();
  const buildIdentity = `${packageVersion}+${state.sourceSha.slice(0, 12)}${state.sourceDirty ? ".dirty" : ""}`;
  const metadata = {
    schemaVersion: 1,
    runtime: "native",
    basePath: "/",
    applicationVersion: packageVersion,
    sourceSha: state.sourceSha,
    sourceDirty: state.sourceDirty,
    buildIdentity,
    applicationIndexSha256: createHash("sha256").update(index).digest("hex"),
    contentRevision: CONTENT_MANIFEST.revision,
    education: PRODUCTION_EDUCATION_RELEASE,
  };
  await writeFile(resolve(outputDirectory, "content/native-build.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  return metadata;
}

export async function buildStaticRuntime(runtime) {
  if (runtime !== "pages" && runtime !== "native") throw new Error(`Unsupported static runtime: ${runtime}.`);
  await assertReleasePolicy();
  const outputDirectory = resolve(root, runtime === "pages" ? "_site" : "native-runtime");
  const contentDirectory = resolve(outputDirectory, "content");
  const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  await build({ configFile: resolve(root, runtime === "pages" ? "vite.pages.config.ts" : "vite.native.config.ts") });
  await mkdir(contentDirectory, { recursive: true });
  await writeFile(resolve(contentDirectory, "content-manifest.json"), `${JSON.stringify(CONTENT_MANIFEST, null, 2)}\n`, "utf8");
  const index = await readFile(resolve(outputDirectory, "index.html"), "utf8");
  const fingerprint = await acquireAmharicPackage(contentDirectory);
  const pagesMetadata = {
    schemaVersion: 1,
    basePath: "/mushaf-companion/",
    runtime: "pages",
    applicationIndexSha256: createHash("sha256").update(index).digest("hex"),
    contentRevision: CONTENT_MANIFEST.revision,
    education: PRODUCTION_EDUCATION_RELEASE,
    amharic: {
      sourceId: amharicSource.sourceId,
      editionRevision: amharicSource.edition.revision,
      records: fingerprint.records,
      rawChecksum: fingerprint.rawChecksum,
      normalizedChecksum: fingerprint.normalizedChecksum,
      attribution: amharicSource.license.attribution,
    },
  };
  let nativeMetadata;
  if (runtime === "pages") await writePagesFiles(outputDirectory, index, pagesMetadata);
  else nativeMetadata = await writeNativeFiles(outputDirectory, index, packageJson.version);
  await verifyEducationArtifactPolicy(outputDirectory, await listPagesArtifactFiles(outputDirectory), (nativeMetadata ?? pagesMetadata).education, runtime);
  return {
    outputDirectory,
    amharicRecords: fingerprint.records,
    amharicChecksum: fingerprint.rawChecksum,
    buildIdentity: nativeMetadata?.buildIdentity,
  };
}
