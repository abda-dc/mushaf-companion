import assert from "node:assert/strict";
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import {
  DEFAULT_READING_ID,
  QURAN_READINGS,
  getReadingById,
} from "../app/reading-registry.mjs";

import {
  WARSH_CANDIDATE_FILES,
  WARSH_CANDIDATE_ID,
  readWarshCandidateIntake,
  validateWarshCandidateDirectory,
  validateWarshCandidateIntake,
} from "../scripts/quran-reading-candidate-intake.mjs";

const root = resolve(
  new URL("..", import.meta.url).pathname.slice(process.platform === "win32" ? 1 : 0),
);

const candidateDirectory = join(
  root,
  "content",
  "quran",
  "readings",
  "candidates",
  "warsh-kfgqpc",
);

test("M11.5A records Warsh only as an unavailable authoritative-source candidate", async () => {
  const intake = await readWarshCandidateIntake(candidateDirectory);

  assert.deepEqual(
    validateWarshCandidateIntake(intake),
    { valid: true, issues: [] },
  );

  assert.equal(intake.source.candidateId, WARSH_CANDIDATE_ID);
  assert.equal(intake.source.readingIdentity.readingId, "warsh-an-nafi");
  assert.equal(intake.source.readingIdentity.qiraah, "nafi");
  assert.equal(intake.source.readingIdentity.riwayah, "warsh");
  assert.equal(intake.source.sourceStatus, "artifact-not-received");
  assert.equal(intake.source.productionEligible, false);
  assert.equal(intake.source.package.receivedPath, null);
  assert.equal(intake.source.package.receivedAt, null);
});

test("M11.5A exact-pins authoritative source identity and published metadata", async () => {
  const valid = await readWarshCandidateIntake(candidateDirectory);

  const mutations = [
    (value) => { value.source.readingIdentity.label = "Changed reading label"; },
    (value) => { value.source.responsibleOrganization = "Changed Organization"; },
    (value) => { value.source.landingPage = "https://example.invalid/"; },
    (value) => { value.source.evidenceStatus = "changed"; },
    (value) => { value.source.package.providerRevision = "6.1"; },
    (value) => { value.source.package.providerLastModified = "2022-09-08"; },
    (value) => { value.source.package.advertisedSize = "8.63MB"; },
    (value) => { value.source.package.publishedChecksums.md5 = "0".repeat(32); },
    (value) => { value.source.package.publishedChecksums.sha1 = "0".repeat(40); },
    (value) => { value.source.publishedDataContract.pageFieldNote = "Changed page semantics"; },
    (value) => { value.source.publishedDataContract.textFontFamily = "changed_font"; },
    (value) => { value.source.publishedDataContract.fields = [...value.source.publishedDataContract.fields].reverse(); },
  ];

  for (const mutate of mutations) {
    const candidate = structuredClone(valid);
    mutate(candidate);

    assert.equal(
      validateWarshCandidateIntake(candidate).valid,
      false,
    );
  }
});

test("M11.5A pins provider-published legacy hashes without claiming local verification", async () => {
  const { source } = await readWarshCandidateIntake(candidateDirectory);

  assert.equal(
    source.package.publishedChecksums.md5,
    "4701e8bbf053098220cf2cf4cda206a1",
  );

  assert.equal(
    source.package.publishedChecksums.sha1,
    "44ecea8feb23817fdc01a8ee2162a6a0cf08cae7",
  );

  assert.deepEqual(
    source.package.locallyVerifiedChecksums,
    { md5: null, sha1: null, sha256: null },
  );
});

test("M11.5A keeps package rights unknown until the exact README or license is received", async () => {
  const { rights } = await readWarshCandidateIntake(candidateDirectory);

  assert.equal(rights.rightsStatus, "unknown");
  assert.equal(rights.packageReadmeReceived, false);
  assert.equal(rights.licenseTextReceived, false);

  for (const grant of Object.values(rights.grants)) {
    assert.deepEqual(grant, {
      status: "unknown",
      supportingReference: null,
    });
  }
});

test("M11.5A keeps every activation gate false", async () => {
  const { gates } = await readWarshCandidateIntake(candidateDirectory);

  for (const [key, value] of Object.entries(gates)) {
    if (key === "schemaVersion" || key === "candidateId") continue;
    assert.equal(value, false, key);
  }
});

test("M11.5A candidate is closed-world and rejects extra, nested, or missing files", async (t) => {
  const exact = await validateWarshCandidateDirectory(candidateDirectory);

  assert.deepEqual(exact, {
    valid: true,
    issues: [],
    files: [...WARSH_CANDIDATE_FILES].sort(),
  });

  for (const extra of [
    "download.zip",
    "font.ttf",
    "approval.json",
    ".hidden",
    "nested/data.json",
  ]) {
    const temp = await mkdtemp(join(tmpdir(), "mushaf-warsh-candidate-"));
    t.after(() => rm(temp, { recursive: true, force: true }));

    await cp(candidateDirectory, temp, { recursive: true });

    const target = join(temp, extra);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, "unexpected candidate payload", "utf8");

    assert.equal(
      (await validateWarshCandidateDirectory(temp)).valid,
      false,
      extra,
    );
  }

  const missing = await mkdtemp(join(tmpdir(), "mushaf-warsh-missing-"));
  t.after(() => rm(missing, { recursive: true, force: true }));

  await cp(candidateDirectory, missing, { recursive: true });
  await rm(join(missing, "activation-gates.json"));

  assert.equal(
    (await validateWarshCandidateDirectory(missing)).valid,
    false,
  );
});

test("M11.5A cannot activate Warsh through the existing reading registry", async () => {
  assert.equal(DEFAULT_READING_ID, "hafs-an-asim");
  assert.equal(QURAN_READINGS.length, 1);
  assert.equal(QURAN_READINGS[0].id, DEFAULT_READING_ID);
  assert.equal(getReadingById("warsh-an-nafi"), undefined);
});

test("M11.5A candidate intake is absent from application runtime and public roots", async () => {
  const appFiles = (
    await readdir(join(root, "app"), {
      recursive: true,
      withFileTypes: true,
    })
  ).filter(
    (entry) =>
      entry.isFile()
      && /\.(?:ts|tsx|mjs)$/u.test(entry.name),
  );

  for (const entry of appFiles) {
    const source = await readFile(
      join(entry.parentPath, entry.name),
      "utf8",
    );

    assert.doesNotMatch(
      source,
      /candidate:kfgqpc:warsh-an-nafi|content[\\/]quran[\\/]readings[\\/]candidates/,
    );
  }

  await assert.rejects(
    access(join(root, "public", "quran", "readings", "candidates", "warsh-kfgqpc")),
  );

  await assert.rejects(
    access(join(root, "pages-static", "quran", "readings", "candidates", "warsh-kfgqpc")),
  );
});
