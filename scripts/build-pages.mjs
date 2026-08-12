import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "vite";
import { CONTENT_MANIFEST } from "../app/content-manifest.ts";
import { findTranslationSource } from "../app/content/source-registry.ts";
import { fingerprintQuranEncPackage } from "../app/content/providers/quranenc-translation.ts";
import { readResponseBytesWithLimit } from "../app/content/providers/types.ts";
import { createProductionEducationRegistry, PRODUCTION_EDUCATION_RELEASE } from "../app/education-content.ts";
import { listPagesArtifactFiles, verifyEducationArtifactPolicy } from "./education-artifact-policy.mjs";

const root = process.cwd();
const outputDirectory = resolve(root, "_site");
const contentDirectory = resolve(outputDirectory, "content");
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

if (!amharicSource?.provider.packageUrl || !amharicSource.provider.checkForUpdatesUrl) {
  throw new Error("The pinned Amharic source registry entry is incomplete.");
}
if (amharicSource.license.redistribution !== "permitted_with_conditions" || amharicSource.license.offlineStorage !== "permitted") {
  throw new Error("The Amharic source registry does not authorize a Pages distribution package.");
}
const educationReleaseCheck = await createProductionEducationRegistry(async () => { throw new Error("A disabled education release must not resolve Quran references."); }).loadFirstApprovedCatalog();
if (educationReleaseCheck.status !== "disabled") throw new Error(`GitHub Pages cannot bundle an unapproved education release: ${educationReleaseCheck.status === "ready" ? "an active catalog is not declared in the release manifest" : educationReleaseCheck.reason}`);

await build({ configFile: resolve(root, "vite.pages.config.ts") });
await mkdir(contentDirectory, { recursive: true });

await Promise.all([
  copyFile(resolve(root, "pages-static/manifest.webmanifest"), resolve(outputDirectory, "manifest.webmanifest")),
  copyFile(resolve(root, "pages-static/offline.html"), resolve(outputDirectory, "offline.html")),
  copyFile(resolve(outputDirectory, "index.html"), resolve(outputDirectory, "404.html")),
  writeFile(resolve(contentDirectory, "content-manifest.json"), `${JSON.stringify(CONTENT_MANIFEST, null, 2)}\n`, "utf8"),
]);

const index = await readFile(resolve(outputDirectory, "index.html"), "utf8");
const applicationAssets = [
  ...index.matchAll(/<script[^>]+src="([^"]+)"/g),
  ...index.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g),
].map((match) => `./${match[1].replace(/^\/mushaf-companion\//, "")}`);
if (applicationAssets.length < 2) throw new Error("The Pages reader JavaScript and stylesheet were not emitted.");
const serviceWorkerTemplate = await readFile(resolve(root, "pages-static/sw.js"), "utf8");
if (!serviceWorkerTemplate.includes("/* PAGES_BUILD_ASSETS */ []")) throw new Error("The Pages service-worker asset marker is missing.");
await writeFile(
  resolve(outputDirectory, "sw.js"),
  serviceWorkerTemplate.replace("/* PAGES_BUILD_ASSETS */ []", JSON.stringify(applicationAssets)),
  "utf8",
);

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

// QuranEnc's check URL currently resolves to a large HTML page and does not
// advertise browser CORS. The exact downloaded package has already proven its
// pinned revision during XML normalization, so expose that verified revision
// to the client-side update adapter instead of proxying or scraping HTML.
await writeFile(resolve(contentDirectory, "amharic_zain-update.txt"), `${amharicSource.edition.revision}\n`, "utf8");

const buildMetadata = {
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
await writeFile(resolve(contentDirectory, "pages-build.json"), `${JSON.stringify(buildMetadata, null, 2)}\n`, "utf8");
await verifyEducationArtifactPolicy(outputDirectory, await listPagesArtifactFiles(outputDirectory), buildMetadata.education);

console.log(`Standalone GitHub Pages reader built at ${outputDirectory}`);
console.log(`Verified Amharic package: ${fingerprint.records} ayat, ${fingerprint.rawChecksum}`);
