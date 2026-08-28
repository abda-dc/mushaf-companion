import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const EDUCATION_PATH = /(?:^|[\\/_\-.])(?:education|curriculum|guided[\s_-]*(?:course|lesson)|lesson[\s_-]*(?:catalog|package))(?:[\\/_\-.]|$)/i;
const TEXT_EXTENSIONS = new Set([".html", ".js", ".mjs", ".cjs", ".json", ".jsonl", ".xml", ".csv", ".txt", ".md", ".webmanifest"]);
const DATA_EXTENSIONS = new Set([".json", ".jsonl", ".xml", ".csv", ".txt", ".md"]);
const RELEASE_KEYS = ["artifacts", "bundled", "courseCount", "lessonCount", "providerId", "reason", "revision", "sourceId", "status"];
const DECLARED_ARTIFACT_KEYS = ["mediaType", "path", "sha256"];
const BASE_PAGES_ARTIFACTS = new Set([
  "404.html",
  "apple-touch-icon.png",
  "audio/adhan/fajr-adhan.mp3",
  "audio/adhan/regular-adhan.mp3",
  "content/amharic_zain-update.txt",
  "content/amharic_zain.xml",
  "content/content-manifest.json",
  "content/pages-build.json",
  "favicon-96x96.png",
  "favicon.ico",
  "favicon.svg",
  "file.svg",
  "globe.svg",
  "icon.svg",
  "index.html",
  "logo.png",
  "manifest.webmanifest",
  "mushaf-companion-cover.jpg",
  "offline.html",
  "og.png",
  "sw.js",
  "web-app-manifest-192x192.png",
  "web-app-manifest-512x512.png",
  "window.svg",
]);
const BASE_NATIVE_ARTIFACTS = new Set([
  ...[...BASE_PAGES_ARTIFACTS].filter((path) => !new Set([
    "404.html",
    "content/pages-build.json",
    "manifest.webmanifest",
    "offline.html",
    "sw.js",
  ]).has(path)),
  "content/native-build.json",
]);
const BASE_COMPILED_ASSET = /^assets\/index-[A-Za-z0-9_-]+\.(?:css|js)$/u;

export async function listPagesArtifactFiles(directory) {
  const entries = await readdir(directory);
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry);
    if ((await stat(path)).isDirectory()) files.push(...await listPagesArtifactFiles(path));
    else files.push(path);
  }
  return files;
}

function artifactRelativePath(outputDirectory, path) {
  const value = relative(outputDirectory, path).replaceAll("\\", "/");
  assert.ok(value && !value.startsWith("../") && !value.includes("/../"), `Artifact path escapes the Pages output: ${path}`);
  return value;
}

function educationPayloadReason(text, extension) {
  const comparable = text.replaceAll('\\"', '"').replaceAll("\\'", "'");
  const structuralNames = ["sourceRevision", "courses", "modules", "lessons", "knowledgeChecks", "blocks", "courseId", "moduleId", "lessonId"];
  const score = structuralNames.reduce((count, name) => count + (new RegExp(`["']?${name}["']?\\s*(?::|=)`, "i").test(comparable) ? 1 : 0), 0);
  const canonicalCatalogLiteral = /["']?sourceRevision["']?\s*:\s*[^,}\]]+,\s*["']?courses["']?\s*:\s*\[\s*\{/is.test(comparable);
  if (canonicalCatalogLiteral) return "a compiled or serialized non-empty education catalog structure";
  if (extension === ".json" || extension === ".jsonl") {
    const containsCatalog = (value) => {
      if (!value || typeof value !== "object") return false;
      if (!Array.isArray(value) && typeof value.sourceRevision === "string" && Array.isArray(value.courses) && Array.isArray(value.modules) && Array.isArray(value.lessons) && (value.courses.length || value.modules.length || value.lessons.length)) return true;
      return Object.values(value).some(containsCatalog);
    };
    try {
      const records = extension === ".jsonl" ? comparable.split(/\r?\n/u).filter(Boolean).map((line) => JSON.parse(line)) : [JSON.parse(comparable)];
      if (records.some(containsCatalog)) return "a serialized non-empty education catalog structure";
    } catch {
      // Malformed non-education assets remain the responsibility of their existing artifact validators.
    }
  }
  const explicitMarker = /education[\s_-]*catalog|guided[\s_-]*(?:education|curriculum)|knowledge[\s_-]*checks?/i.test(comparable);
  if (DATA_EXTENSIONS.has(extension) && explicitMarker && score >= 2) return "an undeclared education data payload";
  if (DATA_EXTENSIONS.has(extension) && score >= 5 && /lessons?|knowledgeChecks/i.test(comparable)) return "an undeclared curriculum-shaped data payload";
  return null;
}

function validateRelease(release) {
  assert.ok(release && typeof release === "object" && !Array.isArray(release), "Pages education release metadata is missing.");
  assert.deepEqual(Object.keys(release).sort(), RELEASE_KEYS, "Pages education release metadata has undeclared fields.");
  assert.ok(Array.isArray(release.artifacts), "Pages education release artifacts must be explicitly declared.");
  if (release.status === "disabled") {
    assert.deepEqual(release, {
      status: "disabled",
      bundled: false,
      providerId: null,
      sourceId: null,
      revision: null,
      courseCount: 0,
      lessonCount: 0,
      artifacts: [],
      reason: "No approved guided education curriculum is configured.",
    });
    return;
  }
  assert.equal(release.status, "active", "Pages education release status is unsupported.");
  assert.equal(release.bundled, true, "An active Pages education release must explicitly declare bundling.");
  for (const field of ["providerId", "sourceId", "revision", "reason"]) assert.ok(typeof release[field] === "string" && release[field].trim(), `Active education release ${field} is missing.`);
  assert.ok(Number.isInteger(release.courseCount) && release.courseCount > 0, "Active education release course coverage is missing.");
  assert.ok(Number.isInteger(release.lessonCount) && release.lessonCount > 0, "Active education release lesson coverage is missing.");
  assert.ok(release.artifacts.length > 0, "An active education release must declare every packaged artifact.");
}

export async function verifyEducationArtifactPolicy(outputDirectory, files, release, runtime = "pages") {
  assert.ok(runtime === "pages" || runtime === "native", `Unsupported artifact runtime: ${runtime}`);
  const baseArtifacts = runtime === "native" ? BASE_NATIVE_ARTIFACTS : BASE_PAGES_ARTIFACTS;
  validateRelease(release);
  const declared = new Map();
  for (const artifact of release.artifacts) {
    assert.ok(artifact && typeof artifact === "object" && !Array.isArray(artifact), "Education artifact declaration is malformed.");
    assert.deepEqual(Object.keys(artifact).sort(), DECLARED_ARTIFACT_KEYS, "Education artifact declaration has unknown fields.");
    assert.ok(typeof artifact.path === "string" && artifact.path === artifact.path.replaceAll("\\", "/") && !artifact.path.startsWith("/") && !artifact.path.startsWith("../") && !artifact.path.includes("/../"), "Education artifact declaration path is unsafe.");
    assert.match(artifact.sha256, /^[a-f0-9]{64}$/, "Education artifact declaration checksum is invalid.");
    assert.ok(typeof artifact.mediaType === "string" && artifact.mediaType.trim(), "Education artifact declaration media type is missing.");
    assert.ok(!declared.has(artifact.path), `Education artifact ${artifact.path} is declared more than once.`);
    declared.set(artifact.path, artifact);
  }

  const actualPaths = new Set(files.map((path) => artifactRelativePath(outputDirectory, path)));
  for (const [path, artifact] of declared) {
    assert.ok(actualPaths.has(path), `Declared education artifact is missing: ${path}`);
    const bytes = await readFile(resolve(outputDirectory, path));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), artifact.sha256, `Declared education artifact checksum mismatch: ${path}`);
  }

  for (const path of files) {
    const relativePath = artifactRelativePath(outputDirectory, path);
    if (declared.has(relativePath)) continue;
    assert.ok(
      baseArtifacts.has(relativePath) || BASE_COMPILED_ASSET.test(relativePath),
      `${runtime} artifact contains an undeclared artifact outside the approved base/education inventory: ${relativePath}`,
    );
    assert.doesNotMatch(relativePath, EDUCATION_PATH, `Pages artifact contains an undeclared education path: ${relativePath}`);
    const extension = extname(path).toLowerCase();
    if (!TEXT_EXTENSIONS.has(extension)) continue;
    const text = await readFile(path, "utf8");
    const reason = educationPayloadReason(text, extension);
    assert.equal(reason, null, `Pages artifact ${relativePath} contains ${reason}; approved education content requires an exact release artifact declaration.`);
  }
}
