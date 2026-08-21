/**
 * M9H Hadith Record and Content Architecture
 *
 * Models Hadith record identities, alternate references, text content, provenance,
 * rights policies, fail-closed validation, and vetted translation-approved seeded records.
 */

import {
  CORE_HADITH_COLLECTION_IDS,
  deepFreeze,
  getHadithCollection,
} from "./hadith-registry.mjs";
import {
  HADEETHENC_DATASET_MANIFEST,
  HADEETHENC_ENGLISH_TRANSLATIONS,
} from "../content/hadith/hadeethenc-en-v1.25.0.mjs";

export { HADEETHENC_DATASET_MANIFEST } from "../content/hadith/hadeethenc-en-v1.25.0.mjs";

export const HADITH_CONTENT_SCHEMA_VERSION = 1;

export const HADITH_ACTIVATION_STATES = Object.freeze(new Set([
  "metadata-only",
  "translation-approved",
  "arabic-approved",
  "fully-approved",
  "external-only",
  "pending-rights",
  "unavailable",
]));

export const HADITH_RIGHTS_POLICIES = Object.freeze(new Set([
  "approved-redistribution",
  "metadata-only",
  "external-only",
  "pending-review",
]));

export const HADITH_ALTERNATE_SCHEMES = Object.freeze(new Set([
  "collection",
  "book",
  "in-book",
  "edition",
  "legacy",
  "provider",
]));

const SAFE_ID = /^[a-z0-9]+:[a-z0-9._-]+$/i;
const SAFE_NUMBER = /^[0-9]+[a-z]?$/i;
const FORBIDDEN_CHARACTERS = /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/u;
const ISO_INSTANT = /^[1-9]\d{3}-(0[1-9]|1[0-2])-([0-2]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d{3})?Z$/;
const CHECKSUM = /^[a-f0-9]{64}$/i;

function isRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

function safeText(value, max = 2_000) {
  return typeof value === "string"
    && value.trim() === value
    && value.length > 0
    && [...value].length <= max
    && !FORBIDDEN_CHARACTERS.test(value);
}

function exactKeys(value, allowed, path, issues) {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      issues.push(`${path}.${key} is not allowed`);
    }
  }
}

function safeHttpsUrl(value, requiredHost) {
  if (typeof value !== "string") return false;
  if (FORBIDDEN_CHARACTERS.test(value)) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (requiredHost && url.hostname !== requiredHost) return false;
    return true;
  } catch {
    return false;
  }
}

function validInstant(value) {
  if (typeof value !== "string" || !ISO_INSTANT.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime());
}

/**
 * Validates a HadithAlternateReference object.
 */
function validateAlternateReference(ref, path, errors) {
  if (!isRecord(ref)) {
    errors.push(`${path} must be an object`);
    return;
  }
  exactKeys(ref, ["scheme", "value", "label"], path, errors);
  if (!safeText(ref.scheme, 50)) {
    errors.push(`${path}.scheme must be a safe string under 50 chars`);
  }
  if (!safeText(ref.value, 100)) {
    errors.push(`${path}.value must be a safe string under 100 chars`);
  }
  if (!safeText(ref.label, 200)) {
    errors.push(`${path}.label must be a safe string under 200 chars`);
  }
}

/**
 * Validates a HadithGrading object.
 */
function validateGrading(grading, path, errors) {
  if (!isRecord(grading)) {
    errors.push(`${path} must be an object`);
    return;
  }
  exactKeys(grading, ["grade", "grader", "reference"], path, errors);
  if (!safeText(grading.grade, 100)) {
    errors.push(`${path}.grade must be a safe string under 100 chars`);
  }
  if (!safeText(grading.grader, 200)) {
    errors.push(`${path}.grader must be a safe string under 200 chars`);
  }
  if (!safeText(grading.reference, 500)) {
    errors.push(`${path}.reference must be a safe string under 500 chars`);
  }
}

/**
 * Validates a HadithSourceRecord object.
 */
function validateSourceRecord(sourceRecord, path, errors) {
  if (!isRecord(sourceRecord)) {
    errors.push(`${path} must be an object`);
    return;
  }
  exactKeys(
    sourceRecord,
    ["provider", "providerRecordId", "sourceUrl", "grading", "rightsPolicy", "attribution"],
    path,
    errors
  );

  if (!safeText(sourceRecord.provider, 100)) {
    errors.push(`${path}.provider must be a safe non-empty string`);
  }

  if (typeof sourceRecord.providerRecordId !== "string" || !safeText(sourceRecord.providerRecordId, 100)) {
    errors.push(`${path}.providerRecordId must be a safe non-empty string`);
  }

  const isHadeethEnc = sourceRecord.provider === "hadeethenc";
  if (!safeHttpsUrl(sourceRecord.sourceUrl, isHadeethEnc ? "hadeethenc.com" : undefined)) {
    errors.push(`${path}.sourceUrl must be a safe HTTPS URL${isHadeethEnc ? " on hadeethenc.com" : ""}`);
  }

  if (sourceRecord.grading !== null && sourceRecord.grading !== undefined) {
    validateGrading(sourceRecord.grading, `${path}.grading`, errors);
  }

  if (sourceRecord.rightsPolicy !== undefined && !HADITH_RIGHTS_POLICIES.has(sourceRecord.rightsPolicy)) {
    errors.push(`${path}.rightsPolicy '${sourceRecord.rightsPolicy}' is invalid`);
  }

  if (sourceRecord.attribution !== null && sourceRecord.attribution !== undefined && !safeText(sourceRecord.attribution, 500)) {
    errors.push(`${path}.attribution must be null or a safe string`);
  }
}

/**
 * Validates a HadithProvenance object.
 */
function validateProvenance(provenance, path, errors) {
  if (!isRecord(provenance)) {
    errors.push(`${path} must be an object`);
    return;
  }
  exactKeys(
    provenance,
    ["provider", "providerRecordId", "sourceUrl", "sourceVersion", "recordedAt", "retrievedAt", "rightsPolicy", "attribution", "integrity"],
    path,
    errors
  );

  if (!safeText(provenance.provider, 100)) {
    errors.push(`${path}.provider is required`);
  }
  if (typeof provenance.providerRecordId !== "string" || !safeText(provenance.providerRecordId, 100)) {
    errors.push(`${path}.providerRecordId is required and must be a string`);
  }
  const isHadeethEnc = provenance.provider === "hadeethenc";
  if (!safeHttpsUrl(provenance.sourceUrl, isHadeethEnc ? "hadeethenc.com" : undefined)) {
    errors.push(`${path}.sourceUrl must be a safe HTTPS URL${isHadeethEnc ? " on hadeethenc.com" : ""}`);
  }
  if (provenance.sourceVersion !== null && provenance.sourceVersion !== undefined && !safeText(provenance.sourceVersion, 100)) {
    errors.push(`${path}.sourceVersion must be null or a safe string`);
  }
  if (provenance.recordedAt !== null && provenance.recordedAt !== undefined && !validInstant(provenance.recordedAt)) {
    errors.push(`${path}.recordedAt must be a valid ISO timestamp`);
  }
  if (provenance.retrievedAt !== null && provenance.retrievedAt !== undefined && !validInstant(provenance.retrievedAt)) {
    errors.push(`${path}.retrievedAt must be a valid ISO timestamp`);
  }
  if (!HADITH_RIGHTS_POLICIES.has(provenance.rightsPolicy)) {
    errors.push(`${path}.rightsPolicy '${provenance.rightsPolicy}' is invalid`);
  }
  if (!safeText(provenance.attribution, 500)) {
    errors.push(`${path}.attribution is required`);
  }
  if (provenance.integrity !== null && provenance.integrity !== undefined) {
    if (!isRecord(provenance.integrity)) {
      errors.push(`${path}.integrity must be an object`);
    } else {
      exactKeys(provenance.integrity, ["algorithm", "checksum", "verified"], `${path}.integrity`, errors);
      if (provenance.integrity.algorithm !== "SHA-256") {
        errors.push(`${path}.integrity.algorithm must be 'SHA-256'`);
      }
      if (typeof provenance.integrity.checksum !== "string" || !CHECKSUM.test(provenance.integrity.checksum)) {
        errors.push(`${path}.integrity.checksum must be a valid 64-char hex string`);
      }
      if (provenance.integrity.verified !== undefined && typeof provenance.integrity.verified !== "boolean") {
        errors.push(`${path}.integrity.verified must be boolean`);
      }
    }
  }
}

/**
 * Validates a HadithArabicText object.
 */
function validateArabicText(arabic, path, errors) {
  if (!isRecord(arabic)) {
    errors.push(`${path} must be an object`);
    return;
  }
  exactKeys(arabic, ["text", "sourceUrl", "provenance", "status"], path, errors);
  if (!safeText(arabic.text, 50_000)) {
    errors.push(`${path}.text must be a safe non-empty Arabic string`);
  }
  if (arabic.sourceUrl !== null && arabic.sourceUrl !== undefined && !safeHttpsUrl(arabic.sourceUrl)) {
    errors.push(`${path}.sourceUrl must be a safe HTTPS URL`);
  }
  validateProvenance(arabic.provenance, `${path}.provenance`, errors);
  if (!HADITH_ACTIVATION_STATES.has(arabic.status)) {
    errors.push(`${path}.status '${arabic.status}' is invalid`);
  }
}

/**
 * Validates a HadithTranslationEntry object.
 */
function validateTranslationEntry(translation, path, errors) {
  if (!isRecord(translation)) {
    errors.push(`${path} must be an object`);
    return;
  }
  exactKeys(
    translation,
    ["language", "text", "provider", "providerRecordId", "version", "rightsPolicy", "sourceUrl", "checksum", "status", "attribution"],
    path,
    errors
  );

  if (!safeText(translation.language, 20)) {
    errors.push(`${path}.language must be a safe string under 20 chars`);
  }
  if (!safeText(translation.text, 50_000)) {
    errors.push(`${path}.text must be a safe non-empty string`);
  }
  if (!safeText(translation.provider, 100)) {
    errors.push(`${path}.provider must be a safe non-empty string`);
  }
  if (typeof translation.providerRecordId !== "string" || !safeText(translation.providerRecordId, 100)) {
    errors.push(`${path}.providerRecordId must be a safe non-empty string`);
  }
  if (!safeText(translation.version, 100)) {
    errors.push(`${path}.version must be a safe string`);
  }
  if (!HADITH_RIGHTS_POLICIES.has(translation.rightsPolicy)) {
    errors.push(`${path}.rightsPolicy '${translation.rightsPolicy}' is invalid`);
  }
  if (!safeHttpsUrl(translation.sourceUrl)) {
    errors.push(`${path}.sourceUrl must be a safe HTTPS URL`);
  }
  if (translation.checksum !== null && translation.checksum !== undefined) {
    if (typeof translation.checksum !== "string" || !CHECKSUM.test(translation.checksum)) {
      errors.push(`${path}.checksum must be a valid 64-char hex string`);
    }
  }
  if (!HADITH_ACTIVATION_STATES.has(translation.status)) {
    errors.push(`${path}.status '${translation.status}' is invalid`);
  }
  if (translation.rightsPolicy === "approved-redistribution" && (!translation.attribution || !safeText(translation.attribution, 500))) {
    errors.push(`${path}.attribution is required for approved-redistribution content`);
  }
}

/**
 * Validates a HadithTextContent object.
 */
function validateTextContent(text, path, errors) {
  if (!isRecord(text)) {
    errors.push(`${path} must be an object`);
    return;
  }
  exactKeys(text, ["arabic", "translations"], path, errors);
  if (text.arabic !== null && text.arabic !== undefined) {
    validateArabicText(text.arabic, `${path}.arabic`, errors);
  }
  if (!Array.isArray(text.translations)) {
    errors.push(`${path}.translations must be an array`);
  } else {
    text.translations.forEach((t, i) => validateTranslationEntry(t, `${path}.translations.${i}`, errors));
  }
}

/**
 * Validates a single HadithRecord object.
 *
 * @param {unknown} record
 * @param {ReadonlySet<string>} [validCollectionIds]
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateHadithRecord(record, validCollectionIds) {
  const errors = [];
  if (!isRecord(record)) {
    return { valid: false, errors: ["Hadith record must be a plain object"] };
  }

  exactKeys(
    record,
    [
      "id",
      "collectionId",
      "canonicalNumber",
      "canonicalLabel",
      "bookNumber",
      "bookName",
      "chapterNumber",
      "chapterName",
      "alternateReferences",
      "narrator",
      "text",
      "sourceRecords",
      "provenance",
      "activation",
    ],
    "record",
    errors
  );

  // ID validation
  if (typeof record.id !== "string" || !SAFE_ID.test(record.id)) {
    errors.push(`Record id '${record.id}' is invalid. Must match pattern ${SAFE_ID}`);
  }

  // Collection ID
  if (typeof record.collectionId !== "string" || !safeText(record.collectionId, 100)) {
    errors.push("Record collectionId must be a safe string");
  } else if (validCollectionIds && !validCollectionIds.has(record.collectionId)) {
    errors.push(`Collection ID '${record.collectionId}' is not registered`);
  }

  // Canonical Number MUST be string
  if (typeof record.canonicalNumber !== "string" || !SAFE_NUMBER.test(record.canonicalNumber)) {
    errors.push(`canonicalNumber '${record.canonicalNumber}' must be a non-empty string matching ${SAFE_NUMBER}`);
  }

  // Expected ID match
  if (typeof record.collectionId === "string" && typeof record.canonicalNumber === "string") {
    const expectedId = `${record.collectionId}:${record.canonicalNumber}`;
    if (record.id !== expectedId) {
      errors.push(`Record ID '${record.id}' does not match expected '${expectedId}'`);
    }
  }

  // Canonical Label
  if (!safeText(record.canonicalLabel, 200)) {
    errors.push("canonicalLabel must be a safe string under 200 chars");
  }

  // Book & Chapter fields
  for (const field of ["bookNumber", "bookName", "chapterNumber", "chapterName"]) {
    if (record[field] !== null && record[field] !== undefined && !safeText(record[field], 300)) {
      errors.push(`record.${field} must be null or a safe string under 300 chars`);
    }
  }

  // Alternate references
  if (!Array.isArray(record.alternateReferences)) {
    errors.push("record.alternateReferences must be an array");
  } else {
    record.alternateReferences.forEach((ref, idx) => validateAlternateReference(ref, `record.alternateReferences.${idx}`, errors));
  }

  // Narrator
  if (record.narrator !== null && record.narrator !== undefined && !safeText(record.narrator, 200)) {
    errors.push("record.narrator must be null or a safe string under 200 chars");
  }

  // Source records
  if (!Array.isArray(record.sourceRecords)) {
    errors.push("record.sourceRecords must be an array");
  } else {
    const seenProviderKeys = new Set();
    record.sourceRecords.forEach((src, idx) => {
      validateSourceRecord(src, `record.sourceRecords.${idx}`, errors);
      if (isRecord(src) && typeof src.provider === "string" && typeof src.providerRecordId === "string") {
        const key = `${src.provider}:${src.providerRecordId}`;
        if (seenProviderKeys.has(key)) {
          errors.push(`Duplicate source record provider identity '${key}' in sourceRecords`);
        }
        seenProviderKeys.add(key);
      }
    });
  }

  // Provenance
  if (record.provenance !== null && record.provenance !== undefined) {
    validateProvenance(record.provenance, "record.provenance", errors);
  }

  // Activation State
  if (!HADITH_ACTIVATION_STATES.has(record.activation)) {
    errors.push(`record.activation '${record.activation}' is invalid`);
  }

  // Text content & Fail-Closed Activation semantics
  if (record.text !== null && record.text !== undefined) {
    validateTextContent(record.text, "record.text", errors);
  }

  const hasArabicBody = isRecord(record.text?.arabic) && typeof record.text.arabic.text === "string" && record.text.arabic.text.length > 0;
  const hasApprovedArabic = hasArabicBody && ["arabic-approved", "fully-approved"].includes(record.text.arabic.status);

  const hasTranslationBody = Array.isArray(record.text?.translations) && record.text.translations.some((t) => isRecord(t) && typeof t.text === "string" && t.text.length > 0);
  const hasApprovedTranslation = hasTranslationBody && record.text.translations.some((t) => ["translation-approved", "fully-approved"].includes(t.status));

  // Fail-closed checks on activation
  switch (record.activation) {
    case "metadata-only":
      if (hasArabicBody || hasTranslationBody) {
        errors.push("A record with activation 'metadata-only' must not contain hadith text body");
      }
      break;

    case "external-only":
      if (hasArabicBody || hasTranslationBody) {
        errors.push("A record with activation 'external-only' must not contain hadith text body");
      }
      break;

    case "arabic-approved":
      if (!hasApprovedArabic) {
        errors.push("A record with activation 'arabic-approved' requires approved Arabic text content");
      }
      if (hasApprovedTranslation) {
        errors.push("A record with activation 'arabic-approved' cannot have approved translations");
      }
      break;

    case "translation-approved":
      if (!hasApprovedTranslation) {
        errors.push("A record with activation 'translation-approved' requires approved translation content");
      }
      if (hasApprovedArabic) {
        errors.push("A record with activation 'translation-approved' cannot have approved Arabic content");
      }
      break;

    case "fully-approved":
      if (!hasApprovedArabic || !hasApprovedTranslation) {
        errors.push("A record with activation 'fully-approved' requires both approved Arabic and approved translation content");
      }
      break;

    case "pending-rights":
    case "unavailable":
      if (hasArabicBody || hasTranslationBody) {
        errors.push(`A record with activation '${record.activation}' cannot display internal text bodies`);
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Asserts that a Hadith record is valid; throws on failure.
 *
 * @param {unknown} record
 * @param {ReadonlySet<string>} [validCollectionIds]
 */
export function assertHadithRecord(record, validCollectionIds) {
  const result = validateHadithRecord(record, validCollectionIds);
  if (!result.valid) {
    throw new TypeError(`Invalid Hadith record: ${result.errors.join("; ")}`);
  }
}

/**
 * Normalizes a Hadith record, returning a detached and deeply frozen copy.
 *
 * @param {unknown} record
 * @param {ReadonlySet<string>} [validCollectionIds]
 * @returns {object}
 */
export function normalizeHadithRecord(record, validCollectionIds) {
  let clone;
  try {
    clone = structuredClone(record);
  } catch {
    throw new TypeError("Hadith record could not be cloned safely");
  }
  assertHadithRecord(clone, validCollectionIds);

  return deepFreeze({
    id: String(clone.id),
    collectionId: String(clone.collectionId),
    canonicalNumber: String(clone.canonicalNumber),
    canonicalLabel: String(clone.canonicalLabel),
    bookNumber: clone.bookNumber !== null && clone.bookNumber !== undefined ? String(clone.bookNumber) : null,
    bookName: clone.bookName !== null && clone.bookName !== undefined ? String(clone.bookName) : null,
    chapterNumber: clone.chapterNumber !== null && clone.chapterNumber !== undefined ? String(clone.chapterNumber) : null,
    chapterName: clone.chapterName !== null && clone.chapterName !== undefined ? String(clone.chapterName) : null,
    alternateReferences: (clone.alternateReferences ?? []).map((r) => ({
      scheme: String(r.scheme),
      value: String(r.value),
      label: String(r.label),
    })),
    narrator: clone.narrator !== null && clone.narrator !== undefined ? String(clone.narrator) : null,
    text: clone.text ? {
      arabic: clone.text.arabic ? {
        text: String(clone.text.arabic.text),
        sourceUrl: clone.text.arabic.sourceUrl ? String(clone.text.arabic.sourceUrl) : null,
        provenance: {
          provider: String(clone.text.arabic.provenance.provider),
          providerRecordId: String(clone.text.arabic.provenance.providerRecordId),
          sourceUrl: String(clone.text.arabic.provenance.sourceUrl),
          sourceVersion: clone.text.arabic.provenance.sourceVersion ? String(clone.text.arabic.provenance.sourceVersion) : null,
          recordedAt: clone.text.arabic.provenance.recordedAt ? String(clone.text.arabic.provenance.recordedAt) : null,
          retrievedAt: clone.text.arabic.provenance.retrievedAt ? String(clone.text.arabic.provenance.retrievedAt) : null,
          rightsPolicy: clone.text.arabic.provenance.rightsPolicy,
          attribution: String(clone.text.arabic.provenance.attribution),
          integrity: clone.text.arabic.provenance.integrity ? {
            algorithm: clone.text.arabic.provenance.integrity.algorithm,
            checksum: String(clone.text.arabic.provenance.integrity.checksum),
            verified: clone.text.arabic.provenance.integrity.verified ?? false,
          } : null,
        },
        status: clone.text.arabic.status,
      } : null,
      translations: (clone.text.translations ?? []).map((t) => ({
        language: String(t.language),
        text: String(t.text),
        provider: String(t.provider),
        providerRecordId: String(t.providerRecordId),
        version: String(t.version),
        rightsPolicy: t.rightsPolicy,
        sourceUrl: String(t.sourceUrl),
        checksum: t.checksum ? String(t.checksum) : null,
        status: t.status,
        attribution: t.attribution ? String(t.attribution) : null,
      })),
    } : null,
    sourceRecords: (clone.sourceRecords ?? []).map((s) => ({
      provider: String(s.provider),
      providerRecordId: String(s.providerRecordId),
      sourceUrl: String(s.sourceUrl),
      grading: s.grading ? {
        grade: String(s.grading.grade),
        grader: String(s.grading.grader),
        reference: String(s.grading.reference),
      } : null,
      rightsPolicy: s.rightsPolicy ?? "metadata-only",
      attribution: s.attribution ? String(s.attribution) : null,
    })),
    provenance: clone.provenance ? {
      provider: String(clone.provenance.provider),
      providerRecordId: String(clone.provenance.providerRecordId),
      sourceUrl: String(clone.provenance.sourceUrl),
      sourceVersion: clone.provenance.sourceVersion ? String(clone.provenance.sourceVersion) : null,
      recordedAt: clone.provenance.recordedAt ? String(clone.provenance.recordedAt) : null,
      retrievedAt: clone.provenance.retrievedAt ? String(clone.provenance.retrievedAt) : null,
      rightsPolicy: clone.provenance.rightsPolicy,
      attribution: String(clone.provenance.attribution),
      integrity: clone.provenance.integrity ? {
        algorithm: clone.provenance.integrity.algorithm,
        checksum: String(clone.provenance.integrity.checksum),
        verified: clone.provenance.integrity.verified ?? false,
      } : null,
    } : null,
    activation: clone.activation,
  });
}

// -----------------------------------------------------------------------------
// Helper to build translation entry from official HadeethEnc ingested dataset
// -----------------------------------------------------------------------------

function buildHadeethEncTranslation(hadeethencId) {
  const item = HADEETHENC_ENGLISH_TRANSLATIONS[hadeethencId];
  if (!item) {
    throw new Error(`Missing HadeethEnc translation for record ID '${hadeethencId}'`);
  }
  return {
    arabic: null,
    translations: [
      {
        language: "en",
        text: item.hadith_text,
        provider: "hadeethenc",
        providerRecordId: String(item.id),
        version: HADEETHENC_DATASET_MANIFEST.datasetVersion,
        rightsPolicy: HADEETHENC_DATASET_MANIFEST.rightsPolicy,
        sourceUrl: item.link,
        checksum: item.sha256,
        status: "translation-approved",
        attribution: HADEETHENC_DATASET_MANIFEST.attribution,
      },
    ],
  };
}

// -----------------------------------------------------------------------------
// Seeded Translation-Approved Hadith Records (M9H-2A Ingested Baseline)
// -----------------------------------------------------------------------------

const RAW_SEEDED_RECORDS = [
  // 1. Sahih Muslim 8 (Hadith of Umar / Jibreel)
  {
    id: "muslim:8",
    collectionId: "muslim",
    canonicalNumber: "8",
    canonicalLabel: "Sahih Muslim 8",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Umar ibn al-Khattab",
    text: buildHadeethEncTranslation("4563"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "4563",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/4563",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/4563",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 2. Sahih Muslim 153
  {
    id: "muslim:153",
    collectionId: "muslim",
    canonicalNumber: "153",
    canonicalLabel: "Sahih Muslim 153",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: null,
    text: buildHadeethEncTranslation("3272"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "3272",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/3272",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/3272",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 3. Sahih al-Bukhari 4485
  {
    id: "bukhari:4485",
    collectionId: "bukhari",
    canonicalNumber: "4485",
    canonicalLabel: "Sahih al-Bukhari 4485",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Abu Hurayrah",
    text: buildHadeethEncTranslation("65046"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "65046",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/65046",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/65046",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 4. Sahih Muslim 2859
  {
    id: "muslim:2859",
    collectionId: "muslim",
    canonicalNumber: "2859",
    canonicalLabel: "Sahih Muslim 2859",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Aishah",
    text: buildHadeethEncTranslation("5460"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "5460",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/5460",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/5460",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 5. Sahih Muslim 2653
  {
    id: "muslim:2653",
    collectionId: "muslim",
    canonicalNumber: "2653",
    canonicalLabel: "Sahih Muslim 2653",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Abdullah ibn Amr ibn al-As",
    text: buildHadeethEncTranslation("65038"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "65038",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/65038",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/65038",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 6. Sahih Muslim 2664
  {
    id: "muslim:2664",
    collectionId: "muslim",
    canonicalNumber: "2664",
    canonicalLabel: "Sahih Muslim 2664",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Abu Hurayrah",
    text: buildHadeethEncTranslation("5493"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "5493",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/5493",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/5493",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 7. Sahih Muslim 16 (Five Pillars)
  {
    id: "muslim:16",
    collectionId: "muslim",
    canonicalNumber: "16",
    canonicalLabel: "Sahih Muslim 16",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: null,
    text: buildHadeethEncTranslation("65000"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "65000",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/65000",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/65000",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 8. Sahih al-Bukhari 528 (Five Pillars / Prayer)
  {
    id: "bukhari:528",
    collectionId: "bukhari",
    canonicalNumber: "528",
    canonicalLabel: "Sahih al-Bukhari 528",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: null,
    text: buildHadeethEncTranslation("4968"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "4968",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/4968",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/4968",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 9. Sahih al-Bukhari 1397 (Five Pillars / Zakah)
  {
    id: "bukhari:1397",
    collectionId: "bukhari",
    canonicalNumber: "1397",
    canonicalLabel: "Sahih al-Bukhari 1397",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: null,
    text: buildHadeethEncTranslation("3689"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "3689",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/3689",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/3689",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 10. Sahih Muslim 15 (Five Pillars / Fasting / Ramadan)
  {
    id: "muslim:15",
    collectionId: "muslim",
    canonicalNumber: "15",
    canonicalLabel: "Sahih Muslim 15",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: null,
    text: buildHadeethEncTranslation("65003"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "65003",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/65003",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/65003",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 11. Sahih al-Bukhari 1521 (Five Pillars / Hajj)
  {
    id: "bukhari:1521",
    collectionId: "bukhari",
    canonicalNumber: "1521",
    canonicalLabel: "Sahih al-Bukhari 1521",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: null,
    text: buildHadeethEncTranslation("2758"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "2758",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/2758",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/2758",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 12. Sahih al-Bukhari 2856 (Tawhid / Allah's Right Over Servants)
  {
    id: "bukhari:2856",
    collectionId: "bukhari",
    canonicalNumber: "2856",
    canonicalLabel: "Sahih al-Bukhari 2856",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Mu'adh ibn Jabal",
    text: buildHadeethEncTranslation("65007"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "65007",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/65007",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/65007",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 13. Sahih al-Bukhari 2736 (Tawhid / Ninety-nine Names of Allah)
  {
    id: "bukhari:2736",
    collectionId: "bukhari",
    canonicalNumber: "2736",
    canonicalLabel: "Sahih al-Bukhari 2736",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Abu Hurayrah",
    text: buildHadeethEncTranslation("64673"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "64673",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/64673",
        grading: {
          grade: "Authentic hadith",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/64673",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 14. Sahih al-Bukhari 5027 (Qur'an / Best of you learn the Qur'an)
  {
    id: "bukhari:5027",
    collectionId: "bukhari",
    canonicalNumber: "5027",
    canonicalLabel: "Sahih al-Bukhari 5027",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Uthman ibn Affan",
    text: buildHadeethEncTranslation("5913"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "5913",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/5913",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/5913",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 15. Sahih Muslim 1401 (Sunnah / Adherence to the Sunnah)
  {
    id: "muslim:1401",
    collectionId: "muslim",
    canonicalNumber: "1401",
    canonicalLabel: "Sahih Muslim 1401",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Anas ibn Malik",
    text: buildHadeethEncTranslation("6078"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "6078",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/6078",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/6078",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 16. Sahih al-Bukhari 3461 (Hadith / Convey from me even if one verse)
  {
    id: "bukhari:3461",
    collectionId: "bukhari",
    canonicalNumber: "3461",
    canonicalLabel: "Sahih al-Bukhari 3461",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Abdullah ibn Amr",
    text: buildHadeethEncTranslation("3686"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "3686",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/3686",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/3686",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 17. Sahih al-Bukhari 7137 (Relationship / Whoever obeys me has obeyed Allah)
  {
    id: "bukhari:7137",
    collectionId: "bukhari",
    canonicalNumber: "7137",
    canonicalLabel: "Sahih al-Bukhari 7137",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Abu Hurayrah",
    text: buildHadeethEncTranslation("6383"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "6383",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/6383",
        grading: {
          grade: "Authentic hadith",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/6383",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 18. Sahih Muslim 2607 (Truthfulness / Adhere to truthfulness)
  {
    id: "muslim:2607",
    collectionId: "muslim",
    canonicalNumber: "2607",
    canonicalLabel: "Sahih Muslim 2607",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Abdullah ibn Mas'ud",
    text: buildHadeethEncTranslation("5504"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "5504",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/5504",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/5504",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 19. Sahih Muslim 2865 (Humility / Allah revealed that you must be humble)
  {
    id: "muslim:2865",
    collectionId: "muslim",
    canonicalNumber: "2865",
    canonicalLabel: "Sahih Muslim 2865",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Iyad ibn Himar",
    text: buildHadeethEncTranslation("5497"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "5497",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/5497",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/5497",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 20. Sahih Muslim 2548 (Parents and Family / Who is most entitled to my good companionship?)
  {
    id: "muslim:2548",
    collectionId: "muslim",
    canonicalNumber: "2548",
    canonicalLabel: "Sahih Muslim 2548",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Abu Hurayrah",
    text: buildHadeethEncTranslation("4182"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "4182",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/4182",
        grading: {
          grade: "Authentic hadith",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/4182",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 21. Sahih al-Bukhari 6014 (Neighbors / Jibril kept enjoining me regarding the neighbor)
  {
    id: "bukhari:6014",
    collectionId: "bukhari",
    canonicalNumber: "6014",
    canonicalLabel: "Sahih al-Bukhari 6014",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Abdullah ibn Umar",
    text: buildHadeethEncTranslation("4965"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "4965",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/4965",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/4965",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 22. Sahih Muslim 1827 (Justice / Those who act justly will be on pulpits of light)
  {
    id: "muslim:1827",
    collectionId: "muslim",
    canonicalNumber: "1827",
    canonicalLabel: "Sahih Muslim 1827",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Abdullah ibn Amr",
    text: buildHadeethEncTranslation("4935"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "4935",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/4935",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/4935",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
  // 23. Sahih Muslim 2553 (Good Manners / Righteousness is good morals)
  {
    id: "muslim:2553",
    collectionId: "muslim",
    canonicalNumber: "2553",
    canonicalLabel: "Sahih Muslim 2553",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "An-Nawwas ibn Sim'an",
    text: buildHadeethEncTranslation("4308"),
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "4308",
        sourceUrl: "https://hadeethenc.com/en/browse/hadith/4308",
        grading: {
          grade: "Authentic",
          grader: "HadeethEnc Editorial Board",
          reference: "https://hadeethenc.com/en/browse/hadith/4308",
        },
        rightsPolicy: "approved-redistribution",
        attribution: "HadeethEnc.com",
      },
    ],
    provenance: null,
    activation: "translation-approved",
  },
];

const VALID_COLLECTION_ID_SET = new Set(CORE_HADITH_COLLECTION_IDS);

export const SEEDED_HADITH_RECORDS = deepFreeze(
  RAW_SEEDED_RECORDS.map((r) => normalizeHadithRecord(r, VALID_COLLECTION_ID_SET))
);

const RECORD_MAP = new Map(SEEDED_HADITH_RECORDS.map((r) => [r.id.toLowerCase(), r]));

/**
 * Get a seeded Hadith record by internal ID (e.g. 'muslim:8', 'bukhari:528').
 *
 * @param {string} id
 * @returns {object | null}
 */
export function getHadithRecord(id) {
  if (typeof id !== "string") return null;
  return RECORD_MAP.get(id.trim().toLowerCase()) ?? null;
}

/**
 * List all seeded Hadith records.
 *
 * @returns {readonly object[]}
 */
export function listHadithRecords() {
  return SEEDED_HADITH_RECORDS;
}
