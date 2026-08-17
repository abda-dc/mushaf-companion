import { RECITERS } from "./reciter-registry.mjs";
import {
  getReadingById,
  validateReadingDefinition,
} from "./reading-registry.mjs";

const RECITER_BY_ID = new Map(RECITERS.map((reciter) => [reciter.id, reciter]));

export class ReadingCompatibilityError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "ReadingCompatibilityError";
    this.code = code;
  }
}

function referenceId(reference) {
  if (typeof reference === "string") return reference;
  if (reference && typeof reference === "object" && typeof reference.id === "string") return reference.id;
  return null;
}

function resolveRegisteredReading(reference) {
  const id = referenceId(reference);
  if (!id) return undefined;

  const registered = getReadingById(id);
  if (!registered) return undefined;
  if (typeof reference === "string") return registered;

  try {
    validateReadingDefinition(reference);
  } catch {
    return undefined;
  }

  return reference.qiraah === registered.qiraah && reference.riwayah === registered.riwayah
    ? registered
    : undefined;
}

function resolveRegisteredReciter(reference) {
  const id = referenceId(reference);
  return id ? RECITER_BY_ID.get(id) : undefined;
}

/**
 * Returns true only when both references resolve exactly to registered domain
 * objects and the reciter's declared riwayah matches the reading's riwayah.
 */
export function isReciterCompatibleWithReading(reciterReference, readingReference) {
  const reciter = resolveRegisteredReciter(reciterReference);
  const reading = resolveRegisteredReading(readingReference);
  return Boolean(reciter && reading && reciter.riwayah === reading.riwayah);
}

export function assertReciterCompatibleWithReading(reciterReference, readingReference) {
  const reading = resolveRegisteredReading(readingReference);
  const readingId = referenceId(readingReference);
  if (!reading) {
    throw new ReadingCompatibilityError(
      `Quran reading '${readingId ?? "<invalid>"}' is not supported.`,
      "unsupported_reading",
    );
  }

  const reciter = resolveRegisteredReciter(reciterReference);
  const reciterId = referenceId(reciterReference);
  if (!reciter) {
    throw new ReadingCompatibilityError(
      `Reciter '${reciterId ?? "<invalid>"}' is not registered.`,
      "unknown_reciter",
    );
  }

  if (reciter.riwayah !== reading.riwayah) {
    throw new ReadingCompatibilityError(
      `Reciter '${reciter.id}' declares riwayah '${String(reciter.riwayah)}' and is incompatible with Quran reading '${reading.id}' (riwayah '${reading.riwayah}').`,
      "incompatible_riwayah",
    );
  }

  return reciter;
}

export function resolveCompatibleReciters(readingReference) {
  const reading = resolveRegisteredReading(readingReference);
  if (!reading) return [];
  return RECITERS.filter((reciter) => reciter.riwayah === reading.riwayah);
}

export const getCompatibleReciters = resolveCompatibleReciters;
