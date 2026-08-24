import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

export const WARSH_CANDIDATE_ID = "candidate:kfgqpc:warsh-an-nafi";

export const WARSH_CANDIDATE_FILES = Object.freeze([
  "README.md",
  "activation-gates.json",
  "rights-intake.json",
  "source-manifest.json",
]);

const OFFICIAL_MD5 = "4701e8bbf053098220cf2cf4cda206a1";
const OFFICIAL_SHA1 = "44ecea8feb23817fdc01a8ee2162a6a0cf08cae7";
const OFFICIAL_ORGANIZATION = "King Fahd Glorious Qur'an Printing Complex";
const OFFICIAL_LANDING_PAGE = "https://qurancomplex.gov.sa/en/techquran/dev/";
const OFFICIAL_REVISION = "6.0";
const OFFICIAL_LAST_MODIFIED = "2022-09-07";
const OFFICIAL_ADVERTISED_SIZE = "8.62MB";
const OFFICIAL_READING_LABEL = "Warsh ʿan Nāfiʿ";
const OFFICIAL_EVIDENCE_STATUS = "official-index-metadata-only";
const OFFICIAL_PAGE_FIELD_NOTE = "Some ayat span two pages; the provider documentation says page values are separated with an en dash.";
const OFFICIAL_FONT_FAMILY = "kfgqpc_warsh_uthmanic_script";

const EXPECTED_FIELDS = Object.freeze([
  "id",
  "jozz",
  "page",
  "sura_no",
  "sura_name_en",
  "sura_name_ar",
  "line_start",
  "line_end",
  "aya_no",
  "aya_text",
]);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, expected, path, issues) {
  if (!isRecord(value)) {
    issues.push(`${path} is malformed`);
    return false;
  }

  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();

  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    issues.push(`${path} has unexpected or missing fields`);
  }

  return true;
}

async function listCandidateFiles(directory, root = directory, files = [], issues = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "en"))) {
    const path = join(directory, entry.name);
    const relativePath = relative(root, path).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      issues.push(`candidate package directory ${relativePath} is not allowlisted`);
      await listCandidateFiles(path, root, files, issues);
    }
    else if (entry.isFile()) {
      files.push(relativePath);
    }
    else {
      issues.push(`candidate package entry ${relativePath} is not a regular file`);
    }
  }

  return { files, issues };
}

export async function readWarshCandidateIntake(directory) {
  const [source, rights, gates] = await Promise.all([
    readFile(join(directory, "source-manifest.json"), "utf8").then(JSON.parse),
    readFile(join(directory, "rights-intake.json"), "utf8").then(JSON.parse),
    readFile(join(directory, "activation-gates.json"), "utf8").then(JSON.parse),
  ]);

  return { source, rights, gates };
}

export function validateWarshCandidateIntake({ source, rights, gates }) {
  const issues = [];

  if (!isRecord(source) || !isRecord(rights) || !isRecord(gates)) {
    return { valid: false, issues: ["candidate documents are malformed"] };
  }

  exactKeys(source, [
    "schemaVersion",
    "candidateId",
    "readingIdentity",
    "responsibleOrganization",
    "sourceStatus",
    "productionEligible",
    "landingPage",
    "package",
    "publishedDataContract",
    "evidenceStatus",
  ], "source-manifest", issues);

  exactKeys(source.readingIdentity, [
    "readingId",
    "qiraah",
    "riwayah",
    "label",
  ], "readingIdentity", issues);

  exactKeys(source.package, [
    "providerRevision",
    "providerLastModified",
    "advertisedSize",
    "downloadUrl",
    "receivedPath",
    "receivedAt",
    "publishedChecksums",
    "locallyVerifiedChecksums",
  ], "package", issues);

  exactKeys(source.package?.publishedChecksums, [
    "md5",
    "sha1",
  ], "publishedChecksums", issues);

  exactKeys(source.package?.locallyVerifiedChecksums, [
    "md5",
    "sha1",
    "sha256",
  ], "locallyVerifiedChecksums", issues);

  exactKeys(source.publishedDataContract, [
    "fields",
    "pageFieldType",
    "pageFieldNote",
    "textFontFamily",
  ], "publishedDataContract", issues);

  if (
    source.schemaVersion !== 1
    || source.candidateId !== WARSH_CANDIDATE_ID
    || source.readingIdentity?.readingId !== "warsh-an-nafi"
    || source.readingIdentity?.qiraah !== "nafi"
    || source.readingIdentity?.riwayah !== "warsh"
    || source.readingIdentity?.label !== OFFICIAL_READING_LABEL
  ) {
    issues.push("Warsh candidate reading identity is not exact");
  }

  if (
    source.responsibleOrganization !== OFFICIAL_ORGANIZATION
    || source.landingPage !== OFFICIAL_LANDING_PAGE
    || source.evidenceStatus !== OFFICIAL_EVIDENCE_STATUS
  ) {
    issues.push("Warsh candidate authoritative source provenance is not pinned exactly");
  }

  if (
    source.sourceStatus !== "artifact-not-received"
    || source.productionEligible !== false
    || source.package?.downloadUrl !== null
    || source.package?.receivedPath !== null
    || source.package?.receivedAt !== null
  ) {
    issues.push("unreceived source artifact must remain unavailable and non-production");
  }

  if (
    source.package?.providerRevision !== OFFICIAL_REVISION
    || source.package?.providerLastModified !== OFFICIAL_LAST_MODIFIED
    || source.package?.advertisedSize !== OFFICIAL_ADVERTISED_SIZE
    || source.package?.publishedChecksums?.md5 !== OFFICIAL_MD5
    || source.package?.publishedChecksums?.sha1 !== OFFICIAL_SHA1
  ) {
    issues.push("provider-published Warsh package identity is not pinned exactly");
  }

  if (
    source.package?.locallyVerifiedChecksums?.md5 !== null
    || source.package?.locallyVerifiedChecksums?.sha1 !== null
    || source.package?.locallyVerifiedChecksums?.sha256 !== null
  ) {
    issues.push("local checksum claims cannot exist before artifact acquisition");
  }

  if (
    JSON.stringify(source.publishedDataContract?.fields) !== JSON.stringify(EXPECTED_FIELDS)
    || source.publishedDataContract?.pageFieldType !== "varchar"
    || source.publishedDataContract?.pageFieldNote !== OFFICIAL_PAGE_FIELD_NOTE
    || source.publishedDataContract?.textFontFamily !== OFFICIAL_FONT_FAMILY
  ) {
    issues.push("published Warsh data contract does not match the authoritative intake record");
  }

  exactKeys(rights, [
    "schemaVersion",
    "candidateId",
    "rightsStatus",
    "packageReadmeReceived",
    "licenseTextReceived",
    "attributionRequirement",
    "grants",
  ], "rights-intake", issues);

  const rightNames = [
    "applicationUse",
    "redistribution",
    "bundling",
    "offlineUse",
    "modification",
  ];

  exactKeys(rights.grants, rightNames, "rights grants", issues);

  if (
    rights.schemaVersion !== 1
    || rights.candidateId !== WARSH_CANDIDATE_ID
    || rights.rightsStatus !== "unknown"
    || rights.packageReadmeReceived !== false
    || rights.licenseTextReceived !== false
    || rights.attributionRequirement !== null
  ) {
    issues.push("Warsh rights must remain unknown until exact package terms are reviewed");
  }

  for (const right of rightNames) {
    const grant = rights.grants?.[right];

    exactKeys(grant, ["status", "supportingReference"], `rights.${right}`, issues);

    if (grant?.status !== "unknown" || grant?.supportingReference !== null) {
      issues.push(`${right} must remain unknown before package rights review`);
    }
  }

  const gateKeys = [
    "schemaVersion",
    "candidateId",
    "artifactAcquired",
    "publishedMd5Matched",
    "publishedSha1Matched",
    "localSha256Recorded",
    "archiveInventoryAudited",
    "packageReadmeAudited",
    "rightsVerified",
    "ayahIdentityAudited",
    "numberingConventionAudited",
    "pageBoundaryAudited",
    "multiPageAyahHandlingAudited",
    "lineGeometryAudited",
    "fontAudited",
    "runtimeAdapterApproved",
    "audioCompatibilityApproved",
    "productionEligible",
  ];

  exactKeys(gates, gateKeys, "activation-gates", issues);

  if (
    gates.schemaVersion !== 1
    || gates.candidateId !== WARSH_CANDIDATE_ID
  ) {
    issues.push("activation gate identity is invalid");
  }

  for (const key of gateKeys.slice(2)) {
    if (gates[key] !== false) {
      issues.push(`${key} must remain false before authoritative artifact audit`);
    }
  }

  return { valid: issues.length === 0, issues };
}

export async function validateWarshCandidateDirectory(directory) {
  let inventory;

  try {
    inventory = await listCandidateFiles(directory);
  }
  catch {
    return {
      valid: false,
      issues: ["candidate package inventory could not be read"],
      files: [],
    };
  }

  inventory.files.sort();
  const issues = [...inventory.issues];

  if (
    JSON.stringify(inventory.files)
    !== JSON.stringify([...WARSH_CANDIDATE_FILES].sort())
  ) {
    issues.push("candidate package file inventory is not exact");
  }

  try {
    const intake = await readWarshCandidateIntake(directory);
    issues.push(...validateWarshCandidateIntake(intake).issues);
  }
  catch {
    issues.push("candidate package documents are missing, unreadable, or malformed");
  }

  return {
    valid: issues.length === 0,
    issues,
    files: inventory.files,
  };
}
