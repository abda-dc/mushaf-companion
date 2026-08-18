/**
 * M9H Hadith Collection Registry
 *
 * Core collection metadata, extensible registry definitions, and fail-closed validation.
 *
 * NOTE: Registering a collection definition does NOT mean the complete hadith corpus
 * is bundled or available locally. In M9H-1, core collections are metadata-ready only.
 */

export const HADITH_REGISTRY_SCHEMA_VERSION = 1;

export const HADITH_COLLECTION_STATUSES = Object.freeze(new Set([
  "planned",
  "metadata-ready",
  "content-ready",
]));

export const HADITH_CONTENT_AVAILABILITY = Object.freeze(new Set([
  "metadata-only",
  "partial",
  "complete",
]));

export const CORE_HADITH_COLLECTION_IDS = Object.freeze([
  "bukhari",
  "muslim",
  "abu-dawud",
  "tirmidhi",
  "nasai",
  "ibn-majah",
]);

const CORE_HADITH_COLLECTION_ID_SET = new Set(CORE_HADITH_COLLECTION_IDS);
const SAFE_COLLECTION_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FORBIDDEN_CHARACTERS = /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/u;

function isRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

function safeText(value, max = 1_000) {
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

export function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

/**
 * Validates a single Hadith collection definition.
 *
 * @param {unknown} collection
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateHadithCollectionDefinition(collection) {
  const errors = [];
  if (!isRecord(collection)) {
    return { valid: false, errors: ["Collection definition must be a plain object"] };
  }

  exactKeys(
    collection,
    ["id", "displayName", "arabicName", "shortName", "status", "contentAvailability", "description"],
    "collection",
    errors
  );

  if (typeof collection.id !== "string" || !SAFE_COLLECTION_ID.test(collection.id)) {
    errors.push(`Collection id '${collection.id}' is invalid. Must match pattern ${SAFE_COLLECTION_ID}`);
  }

  if (!safeText(collection.displayName, 200)) {
    errors.push("Collection displayName must be a safe non-empty string under 200 characters");
  }

  if (collection.arabicName !== null && !safeText(collection.arabicName, 200)) {
    errors.push("Collection arabicName must be null or a safe non-empty string under 200 characters");
  }

  if (!safeText(collection.shortName, 100)) {
    errors.push("Collection shortName must be a safe non-empty string under 100 characters");
  }

  if (!HADITH_COLLECTION_STATUSES.has(collection.status)) {
    errors.push(`Collection status '${collection.status}' is invalid. Must be one of: ${[...HADITH_COLLECTION_STATUSES].join(", ")}`);
  }

  if (!HADITH_CONTENT_AVAILABILITY.has(collection.contentAvailability)) {
    errors.push(`Collection contentAvailability '${collection.contentAvailability}' is invalid. Must be one of: ${[...HADITH_CONTENT_AVAILABILITY].join(", ")}`);
  }

  if (collection.status === "content-ready" && collection.contentAvailability === "metadata-only") {
    errors.push("Collection claiming status 'content-ready' cannot have contentAvailability 'metadata-only'");
  }

  if (collection.description !== null && !safeText(collection.description, 1_000)) {
    errors.push("Collection description must be null or a safe non-empty string under 1000 characters");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Asserts that a single Hadith collection definition is valid; throws on failure.
 *
 * @param {unknown} collection
 */
export function assertHadithCollectionDefinition(collection) {
  const result = validateHadithCollectionDefinition(collection);
  if (!result.valid) {
    throw new TypeError(`Invalid Hadith collection definition: ${result.errors.join("; ")}`);
  }
}

/**
 * Validates a full Hadith collection registry array.
 * Requires the 6 core collections to exist and all IDs to be unique.
 *
 * @param {unknown} registry
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateHadithCollectionRegistry(registry) {
  const errors = [];
  if (!Array.isArray(registry)) {
    return { valid: false, errors: ["Hadith collection registry must be an array"] };
  }

  const seenIds = new Set();

  for (let index = 0; index < registry.length; index++) {
    const item = registry[index];
    const validation = validateHadithCollectionDefinition(item);
    if (!validation.valid) {
      errors.push(`Registry index ${index}: ${validation.errors.join("; ")}`);
    } else {
      if (seenIds.has(item.id)) {
        errors.push(`Duplicate collection ID '${item.id}' at index ${index}`);
      }
      seenIds.add(item.id);
    }
  }

  // Ensure all 6 core collections are present
  for (const coreId of CORE_HADITH_COLLECTION_ID_SET) {
    if (!seenIds.has(coreId)) {
      errors.push(`Missing required core collection: '${coreId}'`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Asserts that a Hadith collection registry is valid; throws on failure.
 *
 * @param {unknown} registry
 */
export function assertHadithCollectionRegistry(registry) {
  const result = validateHadithCollectionRegistry(registry);
  if (!result.valid) {
    throw new TypeError(`Invalid Hadith collection registry: ${result.errors.join("; ")}`);
  }
}

/**
 * Normalizes a Hadith collection definition, returning a detached and deeply frozen copy.
 *
 * @param {unknown} collection
 * @returns {object}
 */
export function normalizeHadithCollectionDefinition(collection) {
  let clone;
  try {
    clone = structuredClone(collection);
  } catch {
    throw new TypeError("Collection definition could not be cloned safely");
  }
  assertHadithCollectionDefinition(clone);
  return deepFreeze({
    id: String(clone.id),
    displayName: String(clone.displayName),
    arabicName: clone.arabicName !== null ? String(clone.arabicName) : null,
    shortName: String(clone.shortName),
    status: clone.status,
    contentAvailability: clone.contentAvailability,
    description: clone.description !== null ? String(clone.description) : null,
  });
}

/**
 * Normalizes a Hadith collection registry, returning a detached and deeply frozen array.
 *
 * @param {unknown} registry
 * @returns {readonly object[]}
 */
export function normalizeHadithCollectionRegistry(registry) {
  let clone;
  try {
    clone = structuredClone(registry);
  } catch {
    throw new TypeError("Collection registry could not be cloned safely");
  }
  assertHadithCollectionRegistry(clone);
  return deepFreeze(clone.map(normalizeHadithCollectionDefinition));
}

// -----------------------------------------------------------------------------
// Core 6 Hadith Collections (Metadata-Ready Baseline for M9H-1)
// -----------------------------------------------------------------------------

const RAW_CORE_COLLECTIONS = [
  {
    id: "bukhari",
    displayName: "Sahih al-Bukhari",
    shortName: "Bukhari",
    arabicName: "صحيح البخاري",
    status: "metadata-ready",
    contentAvailability: "metadata-only",
    description: "Canonical Hadith collection compiled by Imam Muhammad ibn Ismail al-Bukhari.",
  },
  {
    id: "muslim",
    displayName: "Sahih Muslim",
    shortName: "Muslim",
    arabicName: "صحيح مسلم",
    status: "metadata-ready",
    contentAvailability: "metadata-only",
    description: "Canonical Hadith collection compiled by Imam Muslim ibn al-Hajjaj al-Naysaburi.",
  },
  {
    id: "abu-dawud",
    displayName: "Sunan Abi Dawud",
    shortName: "Abu Dawud",
    arabicName: "سنن أبي داود",
    status: "metadata-ready",
    contentAvailability: "metadata-only",
    description: "Canonical Sunan collection compiled by Imam Abu Dawud Sulayman ibn al-Ash'ath al-Sijistani.",
  },
  {
    id: "tirmidhi",
    displayName: "Jami' at-Tirmidhi",
    shortName: "Tirmidhi",
    arabicName: "جامع الترمذي",
    status: "metadata-ready",
    contentAvailability: "metadata-only",
    description: "Canonical Jami' collection compiled by Imam Muhammad ibn 'Isa at-Tirmidhi.",
  },
  {
    id: "nasai",
    displayName: "Sunan an-Nasa'i",
    shortName: "Nasa'i",
    arabicName: "سنن النسائي",
    status: "metadata-ready",
    contentAvailability: "metadata-only",
    description: "Canonical Sunan (al-Mujtaba) collection compiled by Imam Ahmad ibn Shu'ayb an-Nasa'i.",
  },
  {
    id: "ibn-majah",
    displayName: "Sunan Ibn Majah",
    shortName: "Ibn Majah",
    arabicName: "سنن ابن ماجه",
    status: "metadata-ready",
    contentAvailability: "metadata-only",
    description: "Canonical Sunan collection compiled by Imam Muhammad ibn Yazid Ibn Majah al-Qazwini.",
  },
];

export const HADITH_COLLECTIONS = normalizeHadithCollectionRegistry(RAW_CORE_COLLECTIONS);

const COLLECTION_MAP = new Map(HADITH_COLLECTIONS.map((c) => [c.id, c]));

/**
 * Look up a registered Hadith collection by its collection ID.
 *
 * @param {string} id
 * @returns {object | null}
 */
export function getHadithCollection(id) {
  if (typeof id !== "string") return null;
  return COLLECTION_MAP.get(id.trim().toLowerCase()) ?? null;
}

/**
 * List all registered Hadith collections.
 *
 * @returns {readonly object[]}
 */
export function listHadithCollections() {
  return HADITH_COLLECTIONS;
}
