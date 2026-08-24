/**
 * Canonical Quran reading registry.
 *
 * M11.1 deliberately contains only the application's existing Hafs reading.
 * Quran text, audio, preferences, and UI continue to use their existing paths.
 */

export const DEFAULT_READING_ID = "hafs-an-asim";

const SUPPORTED_READING_IDS = new Set([DEFAULT_READING_ID]);
const SUPPORTED_QIRAAH_IDS = new Set(["asim"]);
const SUPPORTED_RIWAYAH_IDS = new Set(["hafs"]);

export class ReadingDefinitionValidationError extends TypeError {
  constructor(message) {
    super(message);
    this.name = "ReadingDefinitionValidationError";
  }
}

function requireNonEmptyString(definition, field) {
  const value = definition[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new ReadingDefinitionValidationError(`Quran reading field '${field}' must be a non-empty string.`);
  }
  return value;
}

/**
 * Validates a Quran reading definition and returns it unchanged.
 *
 * Validation is intentionally closed over the domain IDs supported by this
 * application version. Adding another reading requires an explicit registry
 * and supported-ID update rather than being accepted implicitly.
 */
export function validateReadingDefinition(definition) {
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    throw new ReadingDefinitionValidationError("A Quran reading definition must be an object.");
  }

  const id = requireNonEmptyString(definition, "id");
  const qiraah = requireNonEmptyString(definition, "qiraah");
  const riwayah = requireNonEmptyString(definition, "riwayah");
  requireNonEmptyString(definition, "label");
  requireNonEmptyString(definition, "arabicLabel");

  if (!SUPPORTED_READING_IDS.has(id)) {
    throw new ReadingDefinitionValidationError(`Unsupported Quran reading id '${id}'.`);
  }
  if (!SUPPORTED_QIRAAH_IDS.has(qiraah)) {
    throw new ReadingDefinitionValidationError(`Unsupported qiraah id '${qiraah}'.`);
  }
  if (!SUPPORTED_RIWAYAH_IDS.has(riwayah)) {
    throw new ReadingDefinitionValidationError(`Unsupported riwayah id '${riwayah}'.`);
  }

  return definition;
}

export function isValidReadingDefinition(definition) {
  try {
    validateReadingDefinition(definition);
    return true;
  } catch {
    return false;
  }
}

const hafsAnAsim = Object.freeze(validateReadingDefinition({
  id: DEFAULT_READING_ID,
  qiraah: "asim",
  riwayah: "hafs",
  label: "Ḥafṣ ʿan ʿĀṣim",
  arabicLabel: "حفص عن عاصم",
}));

export const QURAN_READINGS = Object.freeze([hafsAnAsim]);

// A domain-oriented alias for consumers that prefer registry terminology.
export const READING_REGISTRY = QURAN_READINGS;

const READING_BY_ID = new Map(QURAN_READINGS.map((reading) => [reading.id, reading]));

export function getReadingById(id) {
  return typeof id === "string" ? READING_BY_ID.get(id) : undefined;
}

export function isSupportedReadingId(id) {
  return typeof id === "string" && READING_BY_ID.has(id);
}

export function getDefaultReading() {
  const reading = READING_BY_ID.get(DEFAULT_READING_ID);
  if (!reading) throw new Error(`Default Quran reading '${DEFAULT_READING_ID}' is not registered.`);
  return reading;
}
