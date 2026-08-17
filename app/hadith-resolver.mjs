/**
 * M9H Pure Hadith Resolver
 *
 * Provides identifier resolution, target formatting and parsing, canonical label
 * lookup, and source record extraction without UI or network dependencies.
 */

import {
  getHadithCollection,
  listHadithCollections,
} from "./hadith-registry.mjs";
import {
  getHadithRecord,
  listHadithRecords,
} from "./hadith-content.mjs";

const TARGET_PATTERN = /^hadith:([a-z0-9]+(-[a-z0-9]+)*):([0-9]+[a-z]?)$/i;
const SAFE_ID_PART = /^[a-z0-9]+(-[a-z0-9]+)*$/i;
const SAFE_NUMBER = /^[0-9]+[a-z]?$/i;

/**
 * Formats a canonical Hadith navigation target.
 *
 * @param {string} collectionId
 * @param {string} number
 * @returns {string} e.g. "hadith:muslim:8"
 */
export function formatHadithTarget(collectionId, number) {
  if (typeof collectionId !== "string" || !SAFE_ID_PART.test(collectionId.trim())) {
    throw new TypeError(`Invalid collectionId '${collectionId}' for hadith navigation target`);
  }
  if (typeof number !== "string" || !SAFE_NUMBER.test(number.trim())) {
    throw new TypeError(`Invalid number '${number}' for hadith navigation target`);
  }
  return `hadith:${collectionId.trim().toLowerCase()}:${number.trim().toLowerCase()}`;
}

/**
 * Parses an internal Hadith navigation target string.
 * Returns null if the target is malformed or invalid.
 *
 * @param {unknown} target
 * @returns {{ collectionId: string, number: string } | null}
 */
export function parseHadithTarget(target) {
  if (typeof target !== "string") return null;
  const match = target.trim().match(TARGET_PATTERN);
  if (!match) return null;
  return Object.freeze({
    collectionId: match[1].toLowerCase(),
    number: match[3].toLowerCase(),
  });
}

/**
 * Extracts a specific provider's source record from a HadithRecord.
 *
 * @param {object} record
 * @param {string} provider
 * @returns {object | null}
 */
export function getHadithSourceRecord(record, provider) {
  if (!record || !Array.isArray(record.sourceRecords) || typeof provider !== "string") {
    return null;
  }
  const cleanProvider = provider.trim().toLowerCase();
  return record.sourceRecords.find((s) => s.provider.toLowerCase() === cleanProvider) ?? null;
}

/**
 * Resolves a Hadith reference by collection ID and canonical number.
 *
 * @param {{ collectionId: string, number: string }} reference
 * @returns {object} HadithResolutionResult
 */
export function resolveHadithReference(reference) {
  if (!reference || typeof reference !== "object") {
    return Object.freeze({
      status: "not-found",
      target: null,
      record: null,
      collection: null,
      sourceRecord: null,
      externalUrl: null,
      reason: "Reference must be an object with collectionId and number",
    });
  }

  const { collectionId, number } = reference;
  if (typeof collectionId !== "string" || typeof number !== "string") {
    return Object.freeze({
      status: "not-found",
      target: null,
      record: null,
      collection: null,
      sourceRecord: null,
      externalUrl: null,
      reason: "Both collectionId and number must be non-empty strings",
    });
  }

  const cleanCollectionId = collectionId.trim().toLowerCase();
  const cleanNumber = number.trim().toLowerCase();

  const collection = getHadithCollection(cleanCollectionId);
  if (!collection) {
    return Object.freeze({
      status: "not-found",
      target: null,
      record: null,
      collection: null,
      sourceRecord: null,
      externalUrl: null,
      reason: `Collection '${cleanCollectionId}' is not registered`,
    });
  }

  let target = null;
  try {
    target = formatHadithTarget(cleanCollectionId, cleanNumber);
  } catch {
    return Object.freeze({
      status: "not-found",
      target: null,
      record: null,
      collection,
      sourceRecord: null,
      externalUrl: null,
      reason: `Malformed number '${cleanNumber}'`,
    });
  }

  const recordId = `${cleanCollectionId}:${cleanNumber}`;
  const record = getHadithRecord(recordId);

  if (!record) {
    return Object.freeze({
      status: "not-found",
      target: null,
      record: null,
      collection,
      sourceRecord: null,
      externalUrl: null,
      reason: `Hadith reference '${collection.displayName} ${cleanNumber}' was not found in internal records`,
    });
  }

  const sourceRecord = getHadithSourceRecord(record, "hadeethenc")
    || (record.sourceRecords.length > 0 ? record.sourceRecords[0] : null);

  let status;
  switch (record.activation) {
    case "translation-approved":
      status = "resolved-translation-approved";
      break;
    case "arabic-approved":
      status = "resolved-arabic-approved";
      break;
    case "fully-approved":
      status = "resolved-internal";
      break;
    case "metadata-only":
      status = "resolved-metadata-only";
      break;
    case "external-only":
      status = "external-fallback";
      break;
    default:
      status = "not-found";
      break;
  }

  return Object.freeze({
    status,
    target,
    record,
    collection,
    sourceRecord,
    externalUrl: sourceRecord?.sourceUrl ?? null,
    reason: null,
  });
}

/**
 * Mapping of known collection labels/prefixes to collection IDs.
 */
const LABEL_COLLECTION_PATTERNS = [
  { pattern: /^(?:sahih\s+al[- ]bukhari|sahih\s+bukhari|bukhari)\b/i, id: "bukhari" },
  { pattern: /^(?:sahih\s+muslim|muslim)\b/i, id: "muslim" },
  { pattern: /^(?:sunan\s+abi\s+dawud|sunan\s+abu\s+dawood|sunan\s+abu\s+dawud|abu\s+dawud|abu\s+dawood)\b/i, id: "abu-dawud" },
  { pattern: /^(?:jami'?\s+at[- ]tirmidhi|sunan\s+at[- ]tirmidhi|at[- ]tirmidhi|tirmidhi)\b/i, id: "tirmidhi" },
  { pattern: /^(?:sunan\s+an[- ]nasa'?i|sunan\s+al[- ]sughra|an[- ]nasa'?i|nasai)\b/i, id: "nasai" },
  { pattern: /^(?:sunan\s+ibn\s+majah|ibn\s+majah)\b/i, id: "ibn-majah" },
];

/**
 * Resolves a Hadith reference by a natural or canonical label such as
 * "Sahih Muslim 8", "Sahih al-Bukhari 528", or "Bukhari 4485".
 *
 * @param {string} label
 * @returns {object} HadithResolutionResult
 */
export function resolveHadithReferenceByCanonicalLabel(label) {
  if (typeof label !== "string" || !label.trim()) {
    return Object.freeze({
      status: "not-found",
      target: null,
      record: null,
      collection: null,
      sourceRecord: null,
      externalUrl: null,
      reason: "Label must be a non-empty string",
    });
  }

  const cleanLabel = label.trim();
  let matchedCollectionId = null;
  let remainingText = null;

  for (const entry of LABEL_COLLECTION_PATTERNS) {
    const match = cleanLabel.match(entry.pattern);
    if (match) {
      matchedCollectionId = entry.id;
      remainingText = cleanLabel.slice(match[0].length).trim();
      break;
    }
  }

  if (!matchedCollectionId || !remainingText) {
    return Object.freeze({
      status: "not-found",
      target: null,
      record: null,
      collection: null,
      sourceRecord: null,
      externalUrl: null,
      reason: `Could not parse collection and number from label '${cleanLabel}'`,
    });
  }

  // Extract number (may be "8", "528", "2249a", etc.)
  const numberMatch = remainingText.match(/^#?\s*([0-9]+[a-z]?)$/i);
  if (!numberMatch) {
    return Object.freeze({
      status: "not-found",
      target: null,
      record: null,
      collection: getHadithCollection(matchedCollectionId),
      sourceRecord: null,
      externalUrl: null,
      reason: `Could not parse hadith number from '${remainingText}'`,
    });
  }

  const number = numberMatch[1];
  return resolveHadithReference({ collectionId: matchedCollectionId, number });
}

/**
 * Searches seeded Hadith records deterministically by query string against metadata.
 * Searches across canonical numbers, labels, collection display names, narrators, and translations.
 *
 * @param {string} query
 * @returns {readonly object[]}
 */
export function searchHadithMetadata(query) {
  if (typeof query !== "string" || !query.trim()) {
    return [];
  }
  const clean = query.trim().toLowerCase();
  const records = listHadithRecords();

  return Object.freeze(
    records.filter((r) => {
      if (r.id.toLowerCase().includes(clean)) return true;
      if (r.canonicalNumber.toLowerCase().includes(clean)) return true;
      if (r.canonicalLabel.toLowerCase().includes(clean)) return true;
      if (r.narrator && r.narrator.toLowerCase().includes(clean)) return true;
      const col = getHadithCollection(r.collectionId);
      if (col && (col.displayName.toLowerCase().includes(clean) || col.shortName.toLowerCase().includes(clean))) {
        return true;
      }
      return false;
    })
  );
}

export {
  getHadithCollection,
  listHadithCollections,
  getHadithRecord,
  listHadithRecords,
};
