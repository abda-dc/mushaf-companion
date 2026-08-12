export const STUDY_NOTE_SCHEMA_VERSION = 2;
export const MAX_STUDY_NOTES = 250;
export const MAX_NOTE_BODY_CODE_POINTS = 4_000;
export const MAX_TAGS_PER_NOTE = 12;
export const MAX_TAG_CODE_POINTS = 40;

const VERSE_KEY = /^[1-9]\d{0,2}:[1-9]\d{0,2}$/;
const NOTE_ID = /^note:[A-Za-z0-9_-]{8,96}$/;
const UUID_V4 = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const ISO_INSTANT = /^[1-9]\d{3}-(0[1-9]|1[0-2])-([0-2]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9:._/-]{1,159}$/;

export const DEFAULT_STUDY_NOTES = Object.freeze({ schemaVersion: STUDY_NOTE_SCHEMA_VERSION, notes: [] });

function isPlainRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function codePointLength(value) {
  return [...value].length;
}

function normalizePlainText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n?/g, "\n").trim();
}

export function isValidStudyNoteInstant(value) {
  if (typeof value !== "string" || !ISO_INSTANT.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

export function normalizeStudyTag(value) {
  if (typeof value !== "string") return null;
  const visible = value.normalize("NFC").replace(/\s+/gu, " ").trim();
  if (!visible || codePointLength(visible) > MAX_TAG_CODE_POINTS) return null;
  return { visible, key: visible.normalize("NFKC").toLowerCase() };
}

export function normalizeStudyTags(value) {
  if (!Array.isArray(value)) return [];
  const tags = [];
  const keys = new Set();
  for (const candidate of value.slice(0, MAX_TAGS_PER_NOTE * 4)) {
    const normalized = normalizeStudyTag(candidate);
    if (!normalized || keys.has(normalized.key)) continue;
    keys.add(normalized.key);
    tags.push(normalized.visible);
    if (tags.length >= MAX_TAGS_PER_NOTE) break;
  }
  return tags;
}

export function normalizeStudyAnchor(value) {
  if (!isPlainRecord(value)) return null;
  if (value.type === "lesson") {
    if (!SAFE_ID.test(value.sourceId ?? "") || typeof value.sourceRevision !== "string" || value.sourceRevision.trim() !== value.sourceRevision || !value.sourceRevision || value.sourceRevision.length > 160 || /[<>\u0000-\u001f]/u.test(value.sourceRevision) || !SAFE_ID.test(value.courseId ?? "") || !SAFE_ID.test(value.moduleId ?? "") || !SAFE_ID.test(value.lessonId ?? "") || (value.sectionId !== null && !SAFE_ID.test(value.sectionId ?? ""))) return null;
    return { type: "lesson", sourceId: value.sourceId, sourceRevision: value.sourceRevision, courseId: value.courseId, moduleId: value.moduleId, lessonId: value.lessonId, sectionId: value.sectionId };
  }
  if (!VERSE_KEY.test(value.verseKey ?? "")) return null;
  if (!Number.isInteger(value.page) || value.page < 1 || value.page > 604) return null;
  if (value.type === "ayah") return { type: "ayah", verseKey: value.verseKey, page: value.page };
  if (value.type !== "word") return null;
  if (!Number.isInteger(value.wordPosition) || value.wordPosition < 1 || value.wordPosition > 100) return null;
  if (!Number.isInteger(value.line) || value.line < 1 || value.line > 15) return null;
  if (!Number.isInteger(value.sourceWordId) || value.sourceWordId < 1 || value.sourceWordId > 10_000_000) return null;
  return {
    type: "word",
    verseKey: value.verseKey,
    wordPosition: value.wordPosition,
    page: value.page,
    line: value.line,
    sourceWordId: value.sourceWordId,
  };
}

export function studyAnchorKey(anchor) {
  const normalized = normalizeStudyAnchor(anchor);
  if (!normalized) return null;
  return normalized.type === "ayah"
    ? `ayah|${normalized.verseKey}|${normalized.page}`
    : normalized.type === "word"
      ? `word|${normalized.verseKey}|${normalized.wordPosition}|${normalized.page}|${normalized.line}|${normalized.sourceWordId}`
      : `lesson|${normalized.sourceId}|${normalized.sourceRevision}|${normalized.courseId}|${normalized.moduleId}|${normalized.lessonId}|${normalized.sectionId ?? "lesson"}`;
}

export function freezeStudyAnchor(value) {
  const normalized = normalizeStudyAnchor(value);
  return normalized ? Object.freeze({ ...normalized }) : null;
}

export async function revalidateStudyAnchor(value, resolvers) {
  const anchor = normalizeStudyAnchor(value);
  if (!anchor) return null;
  try {
    if (anchor.type === "lesson") {
      if (typeof resolvers?.resolveLesson !== "function") return null;
      const trustedLesson = normalizeStudyAnchor(await resolvers.resolveLesson(anchor));
      return trustedLesson?.type === "lesson" && studyAnchorKey(trustedLesson) === studyAnchorKey(anchor) ? anchor : null;
    }
    if (typeof resolvers?.resolveVerse !== "function") return null;
    const verse = await resolvers.resolveVerse(anchor.verseKey);
    if (!isPlainRecord(verse) || verse.verseKey !== anchor.verseKey || verse.page !== anchor.page) return null;
    if (anchor.type === "ayah") return anchor;
    if (typeof resolvers.resolveWord !== "function") return null;
    const trustedWord = normalizeStudyAnchor(await resolvers.resolveWord(anchor));
    return trustedWord?.type === "word" && studyAnchorKey(trustedWord) === studyAnchorKey(anchor) ? anchor : null;
  } catch {
    return null;
  }
}

export function studyTagFilterAfterRename(currentTag, fromTag, toTag) {
  const current = normalizeStudyTag(currentTag);
  const from = normalizeStudyTag(fromTag);
  if (!current || !from || current.key !== from.key) return typeof currentTag === "string" ? currentTag : "";
  return normalizeStudyTag(toTag)?.visible ?? "";
}

export function focusFirstConnectedStudyTarget(targets) {
  if (!Array.isArray(targets)) return false;
  const target = targets.find((candidate) => candidate?.isConnected === true && typeof candidate.focus === "function");
  if (!target) return false;
  target.focus();
  return true;
}

export function createSecureStudyNoteUuid(cryptoProvider = globalThis.crypto) {
  if (typeof cryptoProvider?.randomUUID === "function") {
    try {
      const uuid = cryptoProvider.randomUUID();
      if (typeof uuid === "string" && UUID_V4.test(uuid)) return uuid.toLowerCase();
    } catch {
      // Fall through to the browser-compatible secure byte generator.
    }
  }
  if (typeof cryptoProvider?.getRandomValues !== "function") throw new Error("A secure note identifier is unavailable in this runtime.");
  const bytes = new Uint8Array(16);
  try {
    cryptoProvider.getRandomValues(bytes);
  } catch {
    throw new Error("A secure note identifier is unavailable in this runtime.");
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function normalizeNote(value) {
  if (!isPlainRecord(value) || (value.schemaVersion !== 1 && value.schemaVersion !== STUDY_NOTE_SCHEMA_VERSION) || !NOTE_ID.test(value.id ?? "")) return null;
  const anchor = normalizeStudyAnchor(value.anchor);
  const body = normalizePlainText(value.body);
  if (!anchor || (value.schemaVersion === 1 && anchor.type === "lesson") || !body || codePointLength(body) > MAX_NOTE_BODY_CODE_POINTS) return null;
  if (!isValidStudyNoteInstant(value.createdAt) || !isValidStudyNoteInstant(value.updatedAt) || value.updatedAt < value.createdAt) return null;
  return {
    id: value.id,
    anchor,
    body,
    tags: normalizeStudyTags(value.tags),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    schemaVersion: STUDY_NOTE_SCHEMA_VERSION,
  };
}

export function normalizeStudyNotes(value) {
  const source = isPlainRecord(value) && (value.schemaVersion === 1 || value.schemaVersion === STUDY_NOTE_SCHEMA_VERSION) ? value : {};
  const candidates = Array.isArray(source.notes) ? source.notes.slice(0, MAX_STUDY_NOTES * 2) : [];
  const notes = [];
  const ids = new Set();
  for (const candidate of candidates) {
    const note = normalizeNote(candidate);
    if (!note || ids.has(note.id)) continue;
    ids.add(note.id);
    notes.push(note);
    if (notes.length >= MAX_STUDY_NOTES) break;
  }
  return { schemaVersion: STUDY_NOTE_SCHEMA_VERSION, notes };
}

function requireBody(value) {
  const body = normalizePlainText(value);
  if (!body) throw new Error("Write a note before saving.");
  if (codePointLength(body) > MAX_NOTE_BODY_CODE_POINTS) throw new Error(`Notes are limited to ${MAX_NOTE_BODY_CODE_POINTS.toLocaleString("en-US")} characters.`);
  return body;
}

function requireInstant(value) {
  if (!isValidStudyNoteInstant(value)) throw new Error("The note timestamp is invalid.");
  return value;
}

export function createStudyNote(state, input, options = {}) {
  const normalized = normalizeStudyNotes(state);
  if (normalized.notes.length >= MAX_STUDY_NOTES) throw new Error(`This device can store up to ${MAX_STUDY_NOTES.toLocaleString("en-US")} private notes.`);
  const anchor = normalizeStudyAnchor(input?.anchor);
  if (!anchor) throw new Error("The Quran anchor could not be verified.");
  const now = requireInstant(options.now ?? new Date().toISOString());
  const uuid = options.uuid ?? createSecureStudyNoteUuid(options.crypto);
  const id = `note:${uuid}`;
  if (!NOTE_ID.test(id) || normalized.notes.some((note) => note.id === id)) throw new Error("A unique secure note identifier could not be created.");
  const note = {
    id,
    anchor,
    body: requireBody(input?.body),
    tags: normalizeStudyTags(input?.tags),
    createdAt: now,
    updatedAt: now,
    schemaVersion: STUDY_NOTE_SCHEMA_VERSION,
  };
  return { state: { ...normalized, notes: [note, ...normalized.notes] }, note };
}

export function updateStudyNote(state, id, changes, updatedAt = new Date().toISOString()) {
  const normalized = normalizeStudyNotes(state);
  const index = normalized.notes.findIndex((note) => note.id === id);
  if (index < 0) return normalized;
  const instant = requireInstant(updatedAt);
  const current = normalized.notes[index];
  if (instant < current.createdAt) throw new Error("The note update timestamp predates its creation.");
  const next = {
    ...current,
    body: requireBody(changes?.body),
    tags: normalizeStudyTags(changes?.tags),
    updatedAt: instant,
  };
  return { ...normalized, notes: normalized.notes.map((note) => note.id === id ? next : note) };
}

export function deleteStudyNote(state, id) {
  const normalized = normalizeStudyNotes(state);
  return { ...normalized, notes: normalized.notes.filter((note) => note.id !== id) };
}

export function renameStudyTag(state, fromTag, toTag) {
  const normalized = normalizeStudyNotes(state);
  const from = normalizeStudyTag(fromTag);
  const to = normalizeStudyTag(toTag);
  if (!from || !to) return normalized;
  return {
    ...normalized,
    notes: normalized.notes.map((note) => ({
      ...note,
      tags: normalizeStudyTags(note.tags.map((tag) => normalizeStudyTag(tag)?.key === from.key ? to.visible : tag)),
    })),
  };
}

export function removeStudyTag(state, tagToRemove) {
  const normalized = normalizeStudyNotes(state);
  const target = normalizeStudyTag(tagToRemove);
  if (!target) return normalized;
  return {
    ...normalized,
    notes: normalized.notes.map((note) => ({
      ...note,
      tags: note.tags.filter((tag) => normalizeStudyTag(tag)?.key !== target.key),
    })),
  };
}

export function buildStudyNoteIndex(state) {
  const normalized = normalizeStudyNotes(state);
  const byAnchor = new Map();
  const byTag = new Map();
  for (const note of normalized.notes) {
    const anchorKey = studyAnchorKey(note.anchor);
    if (anchorKey) {
      const matches = byAnchor.get(anchorKey);
      if (matches) matches.push(note);
      else byAnchor.set(anchorKey, [note]);
    }
    for (const tag of note.tags) {
      const tagKey = normalizeStudyTag(tag)?.key;
      if (tagKey) {
        const matches = byTag.get(tagKey);
        if (matches) matches.push(note);
        else byTag.set(tagKey, [note]);
      }
    }
  }
  return { notes: normalized.notes, byAnchor, byTag };
}

export function searchStudyNotes(state, query, anchorType = "all", tag = "") {
  const normalized = normalizeStudyNotes(state);
  const term = typeof query === "string" ? query.normalize("NFKC").trim().toLowerCase() : "";
  const tagKey = normalizeStudyTag(tag)?.key ?? "";
  return normalized.notes.filter((note) => {
    if (anchorType !== "all" && note.anchor.type !== anchorType) return false;
    if (tagKey && !note.tags.some((item) => normalizeStudyTag(item)?.key === tagKey)) return false;
    if (!term) return true;
    const anchorText = note.anchor.type === "lesson" ? `${note.anchor.courseId} ${note.anchor.moduleId} ${note.anchor.lessonId} ${note.anchor.sectionId ?? ""}` : note.anchor.verseKey;
    const searchable = `${note.body}\n${note.tags.join(" ")}\n${anchorText}`.normalize("NFKC").toLowerCase();
    return searchable.includes(term);
  });
}
