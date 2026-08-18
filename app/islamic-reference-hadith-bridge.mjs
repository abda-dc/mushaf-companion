// @ts-check

import {
  formatHadithTarget,
  resolveHadithReference,
} from "./hadith-resolver.mjs";

const HADEETHENC_ORIGIN = "https://hadeethenc.com";
const HADEETHENC_RECORD_ID = /^[1-9]\d*$/;

/**
 * @typedef {"resolved" | "not-found" | "invalid-reference" | "source-mismatch" | "canonical-mismatch"} IslamicReferenceHadithBridgeStatus
 */

/**
 * @typedef {Object} IslamicReferenceHadithBridgeResult
 * @property {IslamicReferenceHadithBridgeStatus} status
 * @property {string | null} target
 * @property {import("./hadith-resolver.mjs").HadithResolution | null} hadithResolution
 * @property {string | null} externalFallbackUrl
 * @property {string | null} reason
 */

/**
 * Checks if a value is a valid plain object.
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return true;
}

/**
 * Resolves an M9R Hadith reference through the M9H resolver and performs
 * fail-closed cross-domain integrity validation.
 *
 * @param {unknown} reference
 * @returns {IslamicReferenceHadithBridgeResult}
 */
export function resolveIslamicReferenceHadith(reference) {
  if (!isRecord(reference)) {
    return Object.freeze({
      status: "invalid-reference",
      target: null,
      hadithResolution: null,
      externalFallbackUrl: null,
      reason: "Reference must be a non-null object",
    });
  }

  if (reference.type !== "hadith") {
    return Object.freeze({
      status: "invalid-reference",
      target: null,
      hadithResolution: null,
      externalFallbackUrl: null,
      reason: `Expected reference type 'hadith', got '${reference.type}'`,
    });
  }

  if (reference.action !== "internal-hadith-navigation") {
    return Object.freeze({
      status: "invalid-reference",
      target: null,
      hadithResolution: null,
      externalFallbackUrl: null,
      reason: `Expected action 'internal-hadith-navigation', got '${reference.action}'`,
    });
  }

  const collectionId = reference.collectionId;
  if (typeof collectionId !== "string" || !collectionId.trim()) {
    return Object.freeze({
      status: "invalid-reference",
      target: null,
      hadithResolution: null,
      externalFallbackUrl: null,
      reason: "Reference is missing a valid collectionId",
    });
  }

  const locator = reference.locator;
  if (typeof locator !== "string" || !locator.trim()) {
    return Object.freeze({
      status: "invalid-reference",
      target: null,
      hadithResolution: null,
      externalFallbackUrl: null,
      reason: "Reference is missing a valid locator/canonical number",
    });
  }

  // Validate external provenance source fields
  if (reference.sourceName !== "HadeethEnc") {
    return Object.freeze({
      status: "invalid-reference",
      target: null,
      hadithResolution: null,
      externalFallbackUrl: null,
      reason: `Unexpected sourceName '${reference.sourceName}', expected 'HadeethEnc'`,
    });
  }

  const sourceRecordId = reference.sourceRecordId;
  if (typeof sourceRecordId !== "string" || !HADEETHENC_RECORD_ID.test(sourceRecordId)) {
    return Object.freeze({
      status: "invalid-reference",
      target: null,
      hadithResolution: null,
      externalFallbackUrl: null,
      reason: "Reference contains an invalid sourceRecordId",
    });
  }

  const sourceUrl = reference.sourceUrl;
  if (typeof sourceUrl !== "string") {
    return Object.freeze({
      status: "invalid-reference",
      target: null,
      hadithResolution: null,
      externalFallbackUrl: null,
      reason: "Reference is missing a sourceUrl",
    });
  }

  try {
    const url = new URL(sourceUrl);
    if (url.protocol !== "https:" || url.origin !== HADEETHENC_ORIGIN || url.username || url.password) {
      return Object.freeze({
        status: "invalid-reference",
        target: null,
        hadithResolution: null,
        externalFallbackUrl: null,
        reason: "Reference sourceUrl must be an approved HadeethEnc HTTPS URL",
      });
    }
  } catch {
    return Object.freeze({
      status: "invalid-reference",
      target: null,
      hadithResolution: null,
      externalFallbackUrl: null,
      reason: "Reference sourceUrl is malformed",
    });
  }

  // Format canonical M9H target
  const target = formatHadithTarget(collectionId, locator);

  // Resolve through M9H resolver
  const resolution = resolveHadithReference({ collectionId, number: locator });

  if (resolution.status === "not-found") {
    return Object.freeze({
      status: "not-found",
      target: null,
      hadithResolution: resolution,
      externalFallbackUrl: sourceUrl,
      reason: resolution.reason || `Hadith reference '${collectionId}:${locator}' was not found in internal records`,
    });
  }

  const resolvedRecord = resolution.record;
  if (!resolvedRecord) {
    return Object.freeze({
      status: "not-found",
      target: null,
      hadithResolution: resolution,
      externalFallbackUrl: sourceUrl,
      reason: "Internal Hadith record could not be loaded",
    });
  }

  // Canonical identity check
  if (resolvedRecord.collectionId !== collectionId || resolvedRecord.canonicalNumber !== locator) {
    return Object.freeze({
      status: "canonical-mismatch",
      target: null,
      hadithResolution: resolution,
      externalFallbackUrl: sourceUrl,
      reason: `Canonical identity mismatch: M9R expected '${collectionId}:${locator}', M9H resolved '${resolvedRecord.collectionId}:${resolvedRecord.canonicalNumber}'`,
    });
  }

  // Provenance / source provider record check
  const hadeethencSource = resolvedRecord.sourceRecords.find(
    (s) => s.provider === "hadeethenc" && s.providerRecordId === sourceRecordId
  );

  if (!hadeethencSource) {
    const availableProviderIds = resolvedRecord.sourceRecords
      .filter((s) => s.provider === "hadeethenc")
      .map((s) => s.providerRecordId)
      .join(", ");

    return Object.freeze({
      status: "source-mismatch",
      target: null,
      hadithResolution: resolution,
      externalFallbackUrl: sourceUrl,
      reason: `Source provenance mismatch: M9R expected HadeethEnc record '${sourceRecordId}', but M9H contains [${availableProviderIds || "none"}]`,
    });
  }

  return Object.freeze({
    status: "resolved",
    target,
    hadithResolution: resolution,
    externalFallbackUrl: sourceUrl,
    reason: null,
  });
}

/**
 * Gets the internal navigation target for an M9R Hadith reference if valid.
 *
 * @param {unknown} reference
 * @returns {string | null}
 */
export function getIslamicReferenceHadithTarget(reference) {
  const result = resolveIslamicReferenceHadith(reference);
  return result.status === "resolved" ? result.target : null;
}
