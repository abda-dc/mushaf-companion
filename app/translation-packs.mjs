import { QuranEncTranslationAdapter } from "./content/providers/quranenc-translation.ts";
import {
  assertSafeProviderText,
  canonicalizeTranslationRecords,
  sha256Hex,
} from "./content/providers/types.ts";
import { findTranslationSource } from "./content/source-registry.ts";
import {
  EXPECTED_AYAH_COUNT,
  EXPECTED_SURAH_COUNT,
  QURAN_CHAPTER_VERSE_COUNTS,
  assertOfflinePackPermitted,
  canonicalVerseKeys,
} from "./content/source-registry.schema.ts";

export const TRANSLATION_PACK_DB_NAME = "mushaf-translation-packs-v1";
export const TRANSLATION_PACK_DB_VERSION = 1;
export const TRANSLATION_PACK_SCHEMA_VERSION = 1;
export const AMHARIC_TRANSLATION_SOURCE_ID = "quranenc:amharic_zain";
export const TRANSLATION_PACK_STORES = Object.freeze({
  packs: "packs",
  verses: "verses",
  state: "state",
  installs: "installs",
  locks: "locks",
});

const PACK_SOURCE_IDS = new Set([AMHARIC_TRANSLATION_SOURCE_ID]);
const CANONICAL_VERSE_KEYS = Object.freeze(canonicalVerseKeys());
const CANONICAL_VERSE_KEY_SET = new Set(CANONICAL_VERSE_KEYS);
const SHA256 = /^[a-f0-9]{64}$/;
const DEFAULT_LEASE_MS = 30_000;
const DEFAULT_QUOTA_HEADROOM = 1.2;
const STAGING_BATCH_SIZE = 250;

export class TranslationPackError extends Error {
  constructor(message, code = "translation_pack_error", options) {
    super(message, options);
    this.name = "TranslationPackError";
    this.code = code;
  }
}

export class TranslationPackBusyError extends TranslationPackError {
  constructor(sourceId) {
    super(`Another translation-pack operation is already running for ${sourceId}.`, "translation_pack_busy");
    this.name = "TranslationPackBusyError";
  }
}

export class TranslationPackQuotaError extends TranslationPackError {
  constructor(message = "There is not enough browser storage to install this translation pack.", options) {
    super(message, "translation_pack_quota", options);
    this.name = "TranslationPackQuotaError";
  }
}

export class TranslationPackCorruptionError extends TranslationPackError {
  constructor(message, options) {
    super(message, "translation_pack_corrupt", options);
    this.name = "TranslationPackCorruptionError";
  }
}

function nowIso(now) {
  return new Date(now()).toISOString();
}

function randomOperationId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function isQuotaError(error) {
  return error?.name === "QuotaExceededError" || error?.code === 22 || /quota/i.test(error?.message ?? "");
}

function asPackError(error) {
  if (error instanceof TranslationPackError) return error;
  if (isQuotaError(error)) return new TranslationPackQuotaError(undefined, { cause: error });
  return error instanceof Error ? error : new TranslationPackError(String(error));
}

function assertCanonicalVerseKey(verseKey) {
  if (typeof verseKey !== "string" || !CANONICAL_VERSE_KEY_SET.has(verseKey)) {
    throw new TranslationPackError(`Invalid canonical verse key: ${String(verseKey)}.`, "invalid_verse_key");
  }
}

function compareVerseKeys(left, right) {
  const [leftChapter, leftVerse] = left.verseKey.split(":").map(Number);
  const [rightChapter, rightVerse] = right.verseKey.split(":").map(Number);
  return leftChapter - rightChapter || leftVerse - rightVerse;
}

function assertSupportedSource(source) {
  if (!source) throw new TranslationPackError("Unknown translation source.", "translation_source_unknown");
  if (!PACK_SOURCE_IDS.has(source.sourceId)) {
    if (source.license.offlineStorage !== "permitted") {
      throw new TranslationPackError(`Permanent offline storage is not permitted for ${source.sourceId}.`, "translation_source_blocked");
    }
    if (source.candidateStatus === "blocked" || source.blockers.length) {
      throw new TranslationPackError(`Translation source ${source.sourceId} is blocked: ${source.blockers.join(" ")}`, "translation_source_blocked");
    }
    throw new TranslationPackError(`Translation-pack storage is not enabled for ${source.sourceId}.`, "translation_source_blocked");
  }
  assertOfflinePackPermitted(source);
  if (source.provider.name !== "QuranEnc" || source.provider.id !== "amharic_zain") {
    throw new TranslationPackError("The Amharic translation-pack provider identity is invalid.", "translation_source_mismatch");
  }
  return source;
}

function packKeyFor(pack) {
  return `${pack.sourceId}@${pack.editionRevision}#${pack.normalizedChecksum}`;
}

function verseRecordId(packKey, verseKey) {
  return `${packKey}|${verseKey}`;
}

function publicPackMetadata(pack, installedAt) {
  return Object.freeze({
    packKey: packKeyFor(pack),
    schemaVersion: TRANSLATION_PACK_SCHEMA_VERSION,
    sourceId: pack.sourceId,
    providerName: pack.providerName,
    providerId: pack.providerId,
    editionRevision: pack.editionRevision,
    language: clone(pack.language),
    attribution: pack.attribution,
    rawChecksum: pack.rawChecksum,
    normalizedChecksum: pack.normalizedChecksum,
    normalizationVersion: pack.normalizationVersion,
    surahCount: EXPECTED_SURAH_COUNT,
    verseCount: EXPECTED_AYAH_COUNT,
    installedAt,
  });
}

async function assertVerifiedPack(source, acquired, pack) {
  if (!pack || typeof pack !== "object" || !Array.isArray(pack.records)) {
    throw new TranslationPackCorruptionError("The provider did not build a complete translation pack.");
  }
  const expectedIdentity = {
    schemaVersion: TRANSLATION_PACK_SCHEMA_VERSION,
    sourceId: source.sourceId,
    providerName: source.provider.name,
    providerId: source.provider.id,
    editionRevision: source.edition.revision,
    rawChecksum: source.integrity.rawChecksum,
    normalizedChecksum: source.integrity.normalizedChecksum,
  };
  for (const [field, expected] of Object.entries(expectedIdentity)) {
    if (pack[field] !== expected) {
      throw new TranslationPackCorruptionError(`Translation pack ${field} does not match the pinned source registry.`);
    }
  }
  if (pack.activated !== false) throw new TranslationPackCorruptionError("Provider packs must be staged before activation.");
  if (acquired.providerName !== source.provider.name || acquired.providerId !== source.provider.id) {
    throw new TranslationPackCorruptionError("Acquired translation provider identity does not match the pinned source.");
  }
  const rawChecksum = await sha256Hex(acquired.bytes);
  if (rawChecksum !== source.integrity.rawChecksum) {
    throw new TranslationPackCorruptionError(`Raw translation checksum mismatch: expected ${source.integrity.rawChecksum}, received ${rawChecksum}.`);
  }
  await assertVerifiedRecords(pack.records, source.integrity.normalizedChecksum, source.language.script);
}

async function assertVerifiedRecords(records, expectedChecksum, expectedScript = "Ethi") {
  if (!Array.isArray(records) || records.length !== EXPECTED_AYAH_COUNT) {
    throw new TranslationPackCorruptionError(`Translation pack must contain exactly ${EXPECTED_AYAH_COUNT.toLocaleString("en-US")} ayat.`);
  }
  const observed = new Set();
  const chapterCounts = Array(EXPECTED_SURAH_COUNT).fill(0);
  for (const record of records) {
    if (!record || typeof record !== "object") throw new TranslationPackCorruptionError("Translation pack contains a malformed verse record.");
    assertCanonicalVerseKey(record.verseKey);
    if (observed.has(record.verseKey)) throw new TranslationPackCorruptionError(`Duplicate translation verse key: ${record.verseKey}.`);
    observed.add(record.verseKey);
    const chapter = Number(record.verseKey.split(":")[0]);
    chapterCounts[chapter - 1] += 1;
    if (typeof record.translation !== "string" || !record.translation.trim()) {
      throw new TranslationPackCorruptionError(`Translation ${record.verseKey} is empty.`);
    }
    if (typeof record.footnotes !== "string") throw new TranslationPackCorruptionError(`Footnotes ${record.verseKey} are malformed.`);
    assertSafeProviderText(record.translation, `translation ${record.verseKey}`);
    assertSafeProviderText(record.footnotes, `footnotes ${record.verseKey}`);
    if (expectedScript === "Ethi" && !/\p{Script=Ethiopic}/u.test(record.translation)) {
      throw new TranslationPackCorruptionError(`Translation ${record.verseKey} does not contain Ethiopic script.`);
    }
  }
  if (CANONICAL_VERSE_KEYS.some((key) => !observed.has(key))) throw new TranslationPackCorruptionError("Translation pack is missing canonical verse keys.");
  if (chapterCounts.some((count, index) => count !== QURAN_CHAPTER_VERSE_COUNTS[index])) {
    throw new TranslationPackCorruptionError("Translation pack chapter boundaries do not match the canonical 114-surah layout.");
  }
  const normalizedChecksum = await sha256Hex(canonicalizeTranslationRecords(records));
  if (normalizedChecksum !== expectedChecksum) {
    throw new TranslationPackCorruptionError(`Normalized translation checksum mismatch: expected ${expectedChecksum}, received ${normalizedChecksum}.`);
  }
  return normalizedChecksum;
}

function requestResult(request, message = "Translation-pack storage request failed.") {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error(message));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Translation-pack storage transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Translation-pack storage transaction was cancelled."));
  });
}

function deletePackVerseCursor(store, packKey) {
  return new Promise((resolve, reject) => {
    const request = store.index("packKey").openCursor(packKey);
    request.onerror = () => reject(request.error ?? new Error("Translation-pack verse cleanup failed."));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve();
        return;
      }
      cursor.delete();
      cursor.continue();
    };
  });
}

export function openTranslationPackDb(indexedDb = globalThis.indexedDB, databaseName = TRANSLATION_PACK_DB_NAME) {
  if (!indexedDb) return Promise.reject(new TranslationPackError("Translation-pack storage is not supported in this browser.", "translation_storage_unsupported"));
  return new Promise((resolve, reject) => {
    const request = indexedDb.open(databaseName, TRANSLATION_PACK_DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(TRANSLATION_PACK_STORES.packs)) {
        const packs = database.createObjectStore(TRANSLATION_PACK_STORES.packs, { keyPath: "packKey" });
        packs.createIndex("sourceId", "sourceId", { unique: false });
      }
      if (!database.objectStoreNames.contains(TRANSLATION_PACK_STORES.verses)) {
        const verses = database.createObjectStore(TRANSLATION_PACK_STORES.verses, { keyPath: "id" });
        verses.createIndex("packKey", "packKey", { unique: false });
        verses.createIndex("packVerse", ["packKey", "verseKey"], { unique: true });
      }
      if (!database.objectStoreNames.contains(TRANSLATION_PACK_STORES.state)) {
        database.createObjectStore(TRANSLATION_PACK_STORES.state, { keyPath: "sourceId" });
      }
      if (!database.objectStoreNames.contains(TRANSLATION_PACK_STORES.installs)) {
        const installs = database.createObjectStore(TRANSLATION_PACK_STORES.installs, { keyPath: "installId" });
        installs.createIndex("sourceId", "sourceId", { unique: false });
      }
      if (!database.objectStoreNames.contains(TRANSLATION_PACK_STORES.locks)) {
        database.createObjectStore(TRANSLATION_PACK_STORES.locks, { keyPath: "sourceId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Translation-pack storage could not be opened."));
    request.onblocked = () => reject(new TranslationPackError("Translation-pack database upgrade is blocked by another tab.", "translation_storage_blocked"));
  });
}

export class IndexedDbTranslationPackRepository {
  constructor({ indexedDb = globalThis.indexedDB, databaseName = TRANSLATION_PACK_DB_NAME } = {}) {
    this.indexedDb = indexedDb;
    this.databaseName = databaseName;
  }

  async open() {
    return openTranslationPackDb(this.indexedDb, this.databaseName);
  }

  async acquireLock(lock) {
    const database = await this.open();
    try {
      const transaction = database.transaction(TRANSLATION_PACK_STORES.locks, "readwrite");
      const done = transactionDone(transaction);
      const store = transaction.objectStore(TRANSLATION_PACK_STORES.locks);
      const existing = await requestResult(store.get(lock.sourceId));
      if (existing && existing.expiresAt > lock.acquiredAt && (existing.ownerId !== lock.ownerId || existing.operationId !== lock.operationId)) {
        transaction.abort();
        await done.catch(() => {});
        throw new TranslationPackBusyError(lock.sourceId);
      }
      store.put(clone(lock));
      await done;
    } finally {
      database.close();
    }
  }

  async refreshLock(lock) {
    const database = await this.open();
    try {
      const transaction = database.transaction(TRANSLATION_PACK_STORES.locks, "readwrite");
      const done = transactionDone(transaction);
      const store = transaction.objectStore(TRANSLATION_PACK_STORES.locks);
      const existing = await requestResult(store.get(lock.sourceId));
      if (!existing || existing.ownerId !== lock.ownerId || existing.operationId !== lock.operationId) {
        transaction.abort();
        await done.catch(() => {});
        throw new TranslationPackBusyError(lock.sourceId);
      }
      store.put({ ...existing, expiresAt: lock.expiresAt });
      await done;
    } finally {
      database.close();
    }
  }

  async releaseLock(lock) {
    const database = await this.open();
    try {
      const transaction = database.transaction(TRANSLATION_PACK_STORES.locks, "readwrite");
      const done = transactionDone(transaction);
      const store = transaction.objectStore(TRANSLATION_PACK_STORES.locks);
      const existing = await requestResult(store.get(lock.sourceId));
      if (existing?.ownerId === lock.ownerId && existing?.operationId === lock.operationId) store.delete(lock.sourceId);
      await done;
    } finally {
      database.close();
    }
  }

  async beginInstall(install, lock) {
    const database = await this.open();
    try {
      const transaction = database.transaction([TRANSLATION_PACK_STORES.installs, TRANSLATION_PACK_STORES.locks], "readwrite");
      const done = transactionDone(transaction);
      const currentLock = await requestResult(transaction.objectStore(TRANSLATION_PACK_STORES.locks).get(install.sourceId));
      if (!currentLock || currentLock.ownerId !== lock.ownerId || currentLock.operationId !== lock.operationId || currentLock.expiresAt <= Date.now()) {
        transaction.abort();
        await done.catch(() => {});
        throw new TranslationPackBusyError(install.sourceId);
      }
      transaction.objectStore(TRANSLATION_PACK_STORES.installs).add(clone(install));
      await done;
    } finally {
      database.close();
    }
  }

  async stageRecords(install, records, lock) {
    for (let offset = 0; offset < records.length; offset += STAGING_BATCH_SIZE) {
      const database = await this.open();
      try {
        const transaction = database.transaction([TRANSLATION_PACK_STORES.installs, TRANSLATION_PACK_STORES.locks, TRANSLATION_PACK_STORES.verses], "readwrite");
        const done = transactionDone(transaction);
        const installs = transaction.objectStore(TRANSLATION_PACK_STORES.installs);
        const locks = transaction.objectStore(TRANSLATION_PACK_STORES.locks);
        const [storedInstall, currentLock] = await Promise.all([
          requestResult(installs.get(install.installId)),
          requestResult(locks.get(install.sourceId)),
        ]);
        if (!storedInstall || storedInstall.packKey !== install.packKey || !currentLock || currentLock.ownerId !== lock.ownerId || currentLock.operationId !== lock.operationId || currentLock.expiresAt <= Date.now()) {
          transaction.abort();
          await done.catch(() => {});
          throw new TranslationPackBusyError(install.sourceId);
        }
        const verses = transaction.objectStore(TRANSLATION_PACK_STORES.verses);
        for (const record of records.slice(offset, offset + STAGING_BATCH_SIZE)) {
          verses.add({
            id: verseRecordId(install.packKey, record.verseKey),
            packKey: install.packKey,
            sourceId: install.sourceId,
            verseKey: record.verseKey,
            translation: record.translation,
            footnotes: record.footnotes,
          });
        }
        await done;
      } finally {
        database.close();
      }
    }
  }

  async commitInstall(install, metadata, lock) {
    const database = await this.open();
    try {
      const transaction = database.transaction([
        TRANSLATION_PACK_STORES.installs,
        TRANSLATION_PACK_STORES.locks,
        TRANSLATION_PACK_STORES.packs,
        TRANSLATION_PACK_STORES.state,
      ], "readwrite");
      const done = transactionDone(transaction);
      const [storedInstall, currentLock, existingPack, state] = await Promise.all([
        requestResult(transaction.objectStore(TRANSLATION_PACK_STORES.installs).get(install.installId)),
        requestResult(transaction.objectStore(TRANSLATION_PACK_STORES.locks).get(install.sourceId)),
        requestResult(transaction.objectStore(TRANSLATION_PACK_STORES.packs).get(install.packKey)),
        requestResult(transaction.objectStore(TRANSLATION_PACK_STORES.state).get(install.sourceId)),
      ]);
      if (!storedInstall || storedInstall.packKey !== install.packKey || !currentLock || currentLock.ownerId !== lock.ownerId || currentLock.operationId !== lock.operationId || currentLock.expiresAt <= Date.now()) {
        transaction.abort();
        await done.catch(() => {});
        throw new TranslationPackBusyError(install.sourceId);
      }
      if (existingPack) {
        transaction.abort();
        await done.catch(() => {});
        throw new TranslationPackError(`Immutable translation pack already exists: ${install.packKey}.`, "translation_pack_exists");
      }
      transaction.objectStore(TRANSLATION_PACK_STORES.packs).add(clone(metadata));
      transaction.objectStore(TRANSLATION_PACK_STORES.state).put({
        sourceId: install.sourceId,
        activePackKey: install.packKey,
        previousPackKey: state?.activePackKey && state.activePackKey !== install.packKey ? state.activePackKey : state?.previousPackKey ?? null,
        updateNotice: state?.updateNotice?.observedRevision === metadata.editionRevision ? null : state?.updateNotice ?? null,
        activatedAt: metadata.installedAt,
      });
      transaction.objectStore(TRANSLATION_PACK_STORES.installs).delete(install.installId);
      await done;
      return clone(metadata);
    } finally {
      database.close();
    }
  }

  async cleanupInstall(installId, now = Date.now(), force = false) {
    const database = await this.open();
    try {
      const transaction = database.transaction([TRANSLATION_PACK_STORES.installs, TRANSLATION_PACK_STORES.locks, TRANSLATION_PACK_STORES.verses], "readwrite");
      const done = transactionDone(transaction);
      const installs = transaction.objectStore(TRANSLATION_PACK_STORES.installs);
      const install = await requestResult(installs.get(installId));
      if (!install) {
        await done;
        return false;
      }
      const lock = await requestResult(transaction.objectStore(TRANSLATION_PACK_STORES.locks).get(install.sourceId));
      if (!force && lock?.operationId === install.operationId && lock.expiresAt > now) {
        await done;
        return false;
      }
      await deletePackVerseCursor(transaction.objectStore(TRANSLATION_PACK_STORES.verses), install.packKey);
      installs.delete(installId);
      await done;
      return true;
    } finally {
      database.close();
    }
  }

  async cleanupInterruptedInstalls(now = Date.now()) {
    const database = await this.open();
    let installs;
    try {
      const transaction = database.transaction(TRANSLATION_PACK_STORES.installs, "readonly");
      const done = transactionDone(transaction);
      installs = await requestResult(transaction.objectStore(TRANSLATION_PACK_STORES.installs).getAll());
      await done;
    } finally {
      database.close();
    }
    let removed = 0;
    for (const install of installs) if (await this.cleanupInstall(install.installId, now, false)) removed += 1;
    return removed;
  }

  async getPack(packKey) {
    return this.#readOne(TRANSLATION_PACK_STORES.packs, packKey);
  }

  async getState(sourceId) {
    return this.#readOne(TRANSLATION_PACK_STORES.state, sourceId);
  }

  async listPacks(sourceId) {
    const database = await this.open();
    try {
      const transaction = database.transaction(TRANSLATION_PACK_STORES.packs, "readonly");
      const done = transactionDone(transaction);
      const packs = await requestResult(transaction.objectStore(TRANSLATION_PACK_STORES.packs).index("sourceId").getAll(sourceId));
      await done;
      return packs.sort((left, right) => right.installedAt.localeCompare(left.installedAt));
    } finally {
      database.close();
    }
  }

  async getRecords(packKey) {
    const database = await this.open();
    try {
      const transaction = database.transaction(TRANSLATION_PACK_STORES.verses, "readonly");
      const done = transactionDone(transaction);
      const records = await requestResult(transaction.objectStore(TRANSLATION_PACK_STORES.verses).index("packKey").getAll(packKey));
      await done;
      return records.map(({ verseKey, translation, footnotes }) => ({ verseKey, translation, footnotes })).sort(compareVerseKeys);
    } finally {
      database.close();
    }
  }

  async getRecord(packKey, verseKey) {
    const stored = await this.#readOne(TRANSLATION_PACK_STORES.verses, verseRecordId(packKey, verseKey));
    return stored ? { verseKey: stored.verseKey, translation: stored.translation, footnotes: stored.footnotes } : null;
  }

  async getRecordsByVerseKeys(packKey, verseKeys) {
    const database = await this.open();
    try {
      const transaction = database.transaction(TRANSLATION_PACK_STORES.verses, "readonly");
      const done = transactionDone(transaction);
      const store = transaction.objectStore(TRANSLATION_PACK_STORES.verses);
      const requests = verseKeys.map((verseKey) => requestResult(store.get(verseRecordId(packKey, verseKey))));
      const stored = await Promise.all(requests);
      await done;
      return stored.map((record) => record ? { verseKey: record.verseKey, translation: record.translation, footnotes: record.footnotes } : null);
    } finally {
      database.close();
    }
  }

  async activatePack(sourceId, packKey, activatedAt) {
    const database = await this.open();
    try {
      const transaction = database.transaction([TRANSLATION_PACK_STORES.packs, TRANSLATION_PACK_STORES.state], "readwrite");
      const done = transactionDone(transaction);
      const [pack, state] = await Promise.all([
        requestResult(transaction.objectStore(TRANSLATION_PACK_STORES.packs).get(packKey)),
        requestResult(transaction.objectStore(TRANSLATION_PACK_STORES.state).get(sourceId)),
      ]);
      if (!pack || pack.sourceId !== sourceId) {
        transaction.abort();
        await done.catch(() => {});
        throw new TranslationPackError(`Installed translation pack not found: ${packKey}.`, "translation_pack_missing");
      }
      transaction.objectStore(TRANSLATION_PACK_STORES.state).put({
        sourceId,
        activePackKey: packKey,
        previousPackKey: state?.activePackKey && state.activePackKey !== packKey ? state.activePackKey : state?.previousPackKey ?? null,
        updateNotice: state?.updateNotice ?? null,
        activatedAt,
      });
      await done;
      return clone(pack);
    } finally {
      database.close();
    }
  }

  async rollback(sourceId, activatedAt) {
    const database = await this.open();
    try {
      const transaction = database.transaction([TRANSLATION_PACK_STORES.packs, TRANSLATION_PACK_STORES.state], "readwrite");
      const done = transactionDone(transaction);
      const stateStore = transaction.objectStore(TRANSLATION_PACK_STORES.state);
      const state = await requestResult(stateStore.get(sourceId));
      if (!state?.activePackKey || !state?.previousPackKey) {
        transaction.abort();
        await done.catch(() => {});
        throw new TranslationPackError(`No previous translation-pack version is available for ${sourceId}.`, "translation_rollback_unavailable");
      }
      const previous = await requestResult(transaction.objectStore(TRANSLATION_PACK_STORES.packs).get(state.previousPackKey));
      if (!previous) {
        transaction.abort();
        await done.catch(() => {});
        throw new TranslationPackCorruptionError("The previous translation-pack version is missing from storage.");
      }
      stateStore.put({
        ...state,
        activePackKey: state.previousPackKey,
        previousPackKey: state.activePackKey,
        activatedAt,
      });
      await done;
      return clone(previous);
    } finally {
      database.close();
    }
  }

  async setUpdateNotice(sourceId, updateNotice) {
    const database = await this.open();
    try {
      const transaction = database.transaction(TRANSLATION_PACK_STORES.state, "readwrite");
      const done = transactionDone(transaction);
      const store = transaction.objectStore(TRANSLATION_PACK_STORES.state);
      const state = await requestResult(store.get(sourceId));
      store.put({
        sourceId,
        activePackKey: state?.activePackKey ?? null,
        previousPackKey: state?.previousPackKey ?? null,
        activatedAt: state?.activatedAt ?? null,
        updateNotice: clone(updateNotice),
      });
      await done;
    } finally {
      database.close();
    }
  }

  async deletePack(sourceId, packKey) {
    const database = await this.open();
    try {
      const transaction = database.transaction([TRANSLATION_PACK_STORES.packs, TRANSLATION_PACK_STORES.verses, TRANSLATION_PACK_STORES.state], "readwrite");
      const done = transactionDone(transaction);
      const packs = transaction.objectStore(TRANSLATION_PACK_STORES.packs);
      const pack = await requestResult(packs.get(packKey));
      if (!pack || pack.sourceId !== sourceId) {
        await done;
        return false;
      }
      const stateStore = transaction.objectStore(TRANSLATION_PACK_STORES.state);
      const state = await requestResult(stateStore.get(sourceId));
      await deletePackVerseCursor(transaction.objectStore(TRANSLATION_PACK_STORES.verses), packKey);
      packs.delete(packKey);
      if (state) {
        const deletingActive = state.activePackKey === packKey;
        const nextActive = deletingActive && state.previousPackKey !== packKey ? state.previousPackKey : deletingActive ? null : state.activePackKey;
        stateStore.put({
          ...state,
          activePackKey: nextActive,
          previousPackKey: state.previousPackKey === packKey || deletingActive ? null : state.previousPackKey,
        });
      }
      await done;
      return true;
    } finally {
      database.close();
    }
  }

  async deleteSource(sourceId) {
    const packs = await this.listPacks(sourceId);
    let deleted = 0;
    for (const pack of packs) if (await this.deletePack(sourceId, pack.packKey)) deleted += 1;
    const database = await this.open();
    try {
      const transaction = database.transaction([TRANSLATION_PACK_STORES.state, TRANSLATION_PACK_STORES.installs], "readwrite");
      const done = transactionDone(transaction);
      transaction.objectStore(TRANSLATION_PACK_STORES.state).delete(sourceId);
      const installIndex = transaction.objectStore(TRANSLATION_PACK_STORES.installs).index("sourceId");
      const installs = await requestResult(installIndex.getAll(sourceId));
      for (const install of installs) transaction.objectStore(TRANSLATION_PACK_STORES.installs).delete(install.installId);
      await done;
    } finally {
      database.close();
    }
    return deleted;
  }

  async #readOne(storeName, key) {
    const database = await this.open();
    try {
      const transaction = database.transaction(storeName, "readonly");
      const done = transactionDone(transaction);
      const result = await requestResult(transaction.objectStore(storeName).get(key));
      await done;
      return result ?? null;
    } finally {
      database.close();
    }
  }
}

export class MemoryTranslationPackRepository {
  constructor() {
    this.packs = new Map();
    this.verses = new Map();
    this.states = new Map();
    this.installs = new Map();
    this.locks = new Map();
    this.nextStageFailure = null;
  }

  async acquireLock(lock) {
    const existing = this.locks.get(lock.sourceId);
    if (existing && existing.expiresAt > lock.acquiredAt && (existing.ownerId !== lock.ownerId || existing.operationId !== lock.operationId)) throw new TranslationPackBusyError(lock.sourceId);
    this.locks.set(lock.sourceId, clone(lock));
  }

  async refreshLock(lock) {
    const existing = this.locks.get(lock.sourceId);
    if (!existing || existing.ownerId !== lock.ownerId || existing.operationId !== lock.operationId) throw new TranslationPackBusyError(lock.sourceId);
    this.locks.set(lock.sourceId, { ...existing, expiresAt: lock.expiresAt });
  }

  async releaseLock(lock) {
    const existing = this.locks.get(lock.sourceId);
    if (existing?.ownerId === lock.ownerId && existing.operationId === lock.operationId) this.locks.delete(lock.sourceId);
  }

  #assertLock(sourceId, lock) {
    const existing = this.locks.get(sourceId);
    if (!existing || existing.ownerId !== lock.ownerId || existing.operationId !== lock.operationId || existing.expiresAt <= Date.now()) throw new TranslationPackBusyError(sourceId);
  }

  async beginInstall(install, lock) {
    this.#assertLock(install.sourceId, lock);
    if (this.installs.has(install.installId)) throw new TranslationPackError("Duplicate staged installation.", "translation_install_exists");
    this.installs.set(install.installId, clone(install));
  }

  async stageRecords(install, records, lock) {
    this.#assertLock(install.sourceId, lock);
    if (this.nextStageFailure) {
      const error = this.nextStageFailure;
      this.nextStageFailure = null;
      throw error;
    }
    if (!this.installs.has(install.installId)) throw new TranslationPackError("Staged installation is missing.", "translation_install_missing");
    for (const record of records) {
      const id = verseRecordId(install.packKey, record.verseKey);
      if (this.verses.has(id)) throw new TranslationPackError(`Immutable verse already exists: ${record.verseKey}.`, "translation_verse_exists");
      this.verses.set(id, { id, packKey: install.packKey, sourceId: install.sourceId, ...clone(record) });
    }
  }

  async commitInstall(install, metadata, lock) {
    this.#assertLock(install.sourceId, lock);
    if (!this.installs.has(install.installId)) throw new TranslationPackError("Staged installation is missing.", "translation_install_missing");
    if (this.packs.has(install.packKey)) throw new TranslationPackError(`Immutable translation pack already exists: ${install.packKey}.`, "translation_pack_exists");
    const state = this.states.get(install.sourceId);
    this.packs.set(install.packKey, clone(metadata));
    this.states.set(install.sourceId, {
      sourceId: install.sourceId,
      activePackKey: install.packKey,
      previousPackKey: state?.activePackKey && state.activePackKey !== install.packKey ? state.activePackKey : state?.previousPackKey ?? null,
      updateNotice: state?.updateNotice?.observedRevision === metadata.editionRevision ? null : state?.updateNotice ?? null,
      activatedAt: metadata.installedAt,
    });
    this.installs.delete(install.installId);
    return clone(metadata);
  }

  async cleanupInstall(installId, now = Date.now(), force = false) {
    const install = this.installs.get(installId);
    if (!install) return false;
    const lock = this.locks.get(install.sourceId);
    if (!force && lock?.operationId === install.operationId && lock.expiresAt > now) return false;
    for (const [id, record] of this.verses) if (record.packKey === install.packKey) this.verses.delete(id);
    this.installs.delete(installId);
    return true;
  }

  async cleanupInterruptedInstalls(now = Date.now()) {
    let removed = 0;
    for (const installId of [...this.installs.keys()]) if (await this.cleanupInstall(installId, now, false)) removed += 1;
    return removed;
  }

  async getPack(packKey) {
    return clone(this.packs.get(packKey) ?? null);
  }

  async getState(sourceId) {
    return clone(this.states.get(sourceId) ?? null);
  }

  async listPacks(sourceId) {
    return [...this.packs.values()].filter((pack) => pack.sourceId === sourceId).map(clone).sort((left, right) => right.installedAt.localeCompare(left.installedAt));
  }

  async getRecords(packKey) {
    return [...this.verses.values()].filter((record) => record.packKey === packKey).map(({ verseKey, translation, footnotes }) => ({ verseKey, translation, footnotes })).sort(compareVerseKeys);
  }

  async getRecord(packKey, verseKey) {
    const record = this.verses.get(verseRecordId(packKey, verseKey));
    return record ? clone({ verseKey: record.verseKey, translation: record.translation, footnotes: record.footnotes }) : null;
  }

  async getRecordsByVerseKeys(packKey, verseKeys) {
    return Promise.all(verseKeys.map((verseKey) => this.getRecord(packKey, verseKey)));
  }

  async activatePack(sourceId, packKey, activatedAt) {
    const pack = this.packs.get(packKey);
    if (!pack || pack.sourceId !== sourceId) throw new TranslationPackError(`Installed translation pack not found: ${packKey}.`, "translation_pack_missing");
    const state = this.states.get(sourceId);
    this.states.set(sourceId, {
      sourceId,
      activePackKey: packKey,
      previousPackKey: state?.activePackKey && state.activePackKey !== packKey ? state.activePackKey : state?.previousPackKey ?? null,
      updateNotice: state?.updateNotice ?? null,
      activatedAt,
    });
    return clone(pack);
  }

  async rollback(sourceId, activatedAt) {
    const state = this.states.get(sourceId);
    if (!state?.activePackKey || !state?.previousPackKey) throw new TranslationPackError(`No previous translation-pack version is available for ${sourceId}.`, "translation_rollback_unavailable");
    const previous = this.packs.get(state.previousPackKey);
    if (!previous) throw new TranslationPackCorruptionError("The previous translation-pack version is missing from storage.");
    this.states.set(sourceId, { ...state, activePackKey: state.previousPackKey, previousPackKey: state.activePackKey, activatedAt });
    return clone(previous);
  }

  async setUpdateNotice(sourceId, updateNotice) {
    const state = this.states.get(sourceId);
    this.states.set(sourceId, {
      sourceId,
      activePackKey: state?.activePackKey ?? null,
      previousPackKey: state?.previousPackKey ?? null,
      activatedAt: state?.activatedAt ?? null,
      updateNotice: clone(updateNotice),
    });
  }

  async deletePack(sourceId, packKey) {
    const pack = this.packs.get(packKey);
    if (!pack || pack.sourceId !== sourceId) return false;
    for (const [id, record] of this.verses) if (record.packKey === packKey) this.verses.delete(id);
    this.packs.delete(packKey);
    const state = this.states.get(sourceId);
    if (state) {
      const deletingActive = state.activePackKey === packKey;
      const nextActive = deletingActive && state.previousPackKey !== packKey ? state.previousPackKey : deletingActive ? null : state.activePackKey;
      this.states.set(sourceId, {
        ...state,
        activePackKey: nextActive,
        previousPackKey: state.previousPackKey === packKey || deletingActive ? null : state.previousPackKey,
      });
    }
    return true;
  }

  async deleteSource(sourceId) {
    const packs = await this.listPacks(sourceId);
    for (const pack of packs) await this.deletePack(sourceId, pack.packKey);
    this.states.delete(sourceId);
    for (const [installId, install] of this.installs) if (install.sourceId === sourceId) this.installs.delete(installId);
    return packs.length;
  }

  failNextStage(error = new DOMException("Quota exceeded", "QuotaExceededError")) {
    this.nextStageFailure = error;
  }

  seedInterruptedInstall(install, records) {
    this.installs.set(install.installId, clone(install));
    for (const record of records) {
      const id = verseRecordId(install.packKey, record.verseKey);
      this.verses.set(id, { id, packKey: install.packKey, sourceId: install.sourceId, ...clone(record) });
    }
  }

  corruptVerse(packKey, verseKey, translation = "corrupt") {
    const id = verseRecordId(packKey, verseKey);
    const record = this.verses.get(id);
    if (record) this.verses.set(id, { ...record, translation });
  }

  simulateStorageReclamation() {
    this.packs.clear();
    this.verses.clear();
    this.states.clear();
    this.installs.clear();
    this.locks.clear();
  }

  snapshot() {
    return {
      packs: clone([...this.packs.values()]),
      verses: clone([...this.verses.values()]),
      states: clone([...this.states.values()]),
      installs: clone([...this.installs.values()]),
      locks: clone([...this.locks.values()]),
    };
  }
}

export class LocalStorageTranslationPackMarkerStore {
  constructor(storage = globalThis.localStorage, prefix = "mushaf-translation-pack-marker:") {
    this.storage = storage;
    this.prefix = prefix;
  }

  get(sourceId) {
    if (!this.storage) return null;
    try {
      const value = this.storage.getItem(`${this.prefix}${sourceId}`);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  set(sourceId, marker) {
    try {
      this.storage?.setItem(`${this.prefix}${sourceId}`, JSON.stringify(marker));
    } catch {
      // The marker is advisory; IndexedDB remains authoritative for activation.
    }
  }

  delete(sourceId) {
    try {
      this.storage?.removeItem(`${this.prefix}${sourceId}`);
    } catch {
      // The marker is advisory; explicit deletion has already removed IndexedDB data.
    }
  }
}

export class MemoryTranslationPackMarkerStore {
  constructor() {
    this.markers = new Map();
  }

  get(sourceId) {
    return clone(this.markers.get(sourceId) ?? null);
  }

  set(sourceId, marker) {
    this.markers.set(sourceId, clone(marker));
  }

  delete(sourceId) {
    this.markers.delete(sourceId);
  }
}

function defaultAdapterFactory(source) {
  if (source.sourceId !== AMHARIC_TRANSLATION_SOURCE_ID || source.provider.name !== "QuranEnc") {
    throw new TranslationPackError(`No translation-pack adapter is enabled for ${source.sourceId}.`, "translation_source_blocked");
  }
  return new QuranEncTranslationAdapter(source);
}

function defaultStorageEstimate() {
  return globalThis.navigator?.storage?.estimate?.() ?? Promise.resolve({ usage: undefined, quota: undefined });
}

export class TranslationPackService {
  constructor({
    repository = new IndexedDbTranslationPackRepository(),
    markerStore = new LocalStorageTranslationPackMarkerStore(),
    sourceResolver = findTranslationSource,
    adapterFactory = defaultAdapterFactory,
    storageEstimate = defaultStorageEstimate,
    now = Date.now,
    operationId = randomOperationId,
    leaseMs = DEFAULT_LEASE_MS,
    quotaHeadroom = DEFAULT_QUOTA_HEADROOM,
  } = {}) {
    this.repository = repository;
    this.markerStore = markerStore;
    this.sourceResolver = sourceResolver;
    this.adapterFactory = adapterFactory;
    this.storageEstimate = storageEstimate;
    this.now = now;
    this.operationId = operationId;
    this.leaseMs = leaseMs;
    this.quotaHeadroom = quotaHeadroom;
    this.ownerId = operationId();
  }

  async install(sourceId = AMHARIC_TRANSLATION_SOURCE_ID) {
    const source = assertSupportedSource(this.sourceResolver(sourceId));
    return this.#withLock(sourceId, "install", (lock) => this.#installLocked(source, lock));
  }

  async #installLocked(source, lock) {
    await this.repository.cleanupInterruptedInstalls(this.now());
    const adapter = this.adapterFactory(source);
    const acquired = await adapter.acquire({ providerName: source.provider.name, providerId: source.provider.id });
    await this.#refresh(lock);
    const records = await adapter.normalize(acquired);
    const providerPack = await adapter.buildPack(acquired, records);
    const pack = { ...providerPack, normalizationVersion: source.integrity.normalizationVersion };
    await assertVerifiedPack(source, acquired, pack);
    const packKey = packKeyFor(pack);
    const existing = await this.repository.getPack(packKey);
    if (existing) {
      await this.verifyPack(packKey);
      const activated = await this.repository.activatePack(source.sourceId, packKey, nowIso(this.now));
      this.#writeMarker(activated);
      return { status: "already_installed", pack: activated };
    }

    const canonicalBytes = new TextEncoder().encode(canonicalizeTranslationRecords(pack.records)).byteLength;
    await this.#assertQuota(canonicalBytes);
    const installedAt = nowIso(this.now);
    const metadata = publicPackMetadata(pack, installedAt);
    const install = {
      installId: this.operationId(),
      operationId: lock.operationId,
      ownerId: lock.ownerId,
      sourceId: source.sourceId,
      packKey,
      editionRevision: pack.editionRevision,
      expectedRecords: EXPECTED_AYAH_COUNT,
      startedAt: installedAt,
    };
    let staged = false;
    try {
      await this.repository.beginInstall(install, lock);
      staged = true;
      await this.repository.stageRecords(install, pack.records, lock);
      await this.#refresh(lock);
      const readback = await this.repository.getRecords(packKey);
      await assertVerifiedRecords(readback, pack.normalizedChecksum, source.language.script);
      const activated = await this.repository.commitInstall(install, metadata, lock);
      staged = false;
      this.#writeMarker(activated);
      return { status: "installed", pack: activated };
    } catch (error) {
      if (staged) await this.repository.cleanupInstall(install.installId, this.now(), true).catch(() => {});
      throw asPackError(error);
    }
  }

  async checkForUpdate(sourceId = AMHARIC_TRANSLATION_SOURCE_ID) {
    const source = assertSupportedSource(this.sourceResolver(sourceId));
    return this.#withLock(sourceId, "update-check", async () => {
      const adapter = this.adapterFactory(source);
      const result = await adapter.checkForUpdate({ providerName: source.provider.name, providerId: source.provider.id });
      const notice = result.updateAvailable ? {
        observedRevision: result.observedRevision,
        registryRevision: source.edition.revision,
        checkedAt: nowIso(this.now),
      } : null;
      await this.repository.setUpdateNotice(sourceId, notice);
      const state = await this.repository.getState(sourceId);
      return {
        ...result,
        activePackKey: state?.activePackKey ?? null,
        replacementPerformed: false,
      };
    });
  }

  async verifyPack(packKey) {
    const metadata = await this.repository.getPack(packKey);
    if (!metadata) throw new TranslationPackError(`Installed translation pack not found: ${packKey}.`, "translation_pack_missing");
    if (!SHA256.test(metadata.rawChecksum) || !SHA256.test(metadata.normalizedChecksum)) {
      throw new TranslationPackCorruptionError("Stored translation-pack checksums are malformed.");
    }
    const records = await this.repository.getRecords(packKey);
    await assertVerifiedRecords(records, metadata.normalizedChecksum, metadata.language?.script);
    return { valid: true, pack: metadata, records: records.length };
  }

  async verifyActive(sourceId = AMHARIC_TRANSLATION_SOURCE_ID) {
    assertSupportedSource(this.sourceResolver(sourceId));
    const state = await this.repository.getState(sourceId);
    if (!state?.activePackKey) throw new TranslationPackError(`No active translation pack is installed for ${sourceId}.`, "translation_pack_missing");
    return this.verifyPack(state.activePackKey);
  }

  async repair(sourceId = AMHARIC_TRANSLATION_SOURCE_ID) {
    const source = assertSupportedSource(this.sourceResolver(sourceId));
    return this.#withLock(sourceId, "repair", async (lock) => {
      await this.repository.cleanupInterruptedInstalls(this.now());
      const state = await this.repository.getState(sourceId);
      if (state?.activePackKey) {
        try {
          const verified = await this.verifyPack(state.activePackKey);
          return { status: "healthy", pack: verified.pack };
        } catch (error) {
          if (!(error instanceof TranslationPackCorruptionError) && error?.code !== "translation_pack_missing") throw error;
          await this.repository.deletePack(sourceId, state.activePackKey);
        }
      }
      return this.#installLocked(source, lock).then((result) => ({ ...result, status: "repaired" }));
    });
  }

  async rollback(sourceId = AMHARIC_TRANSLATION_SOURCE_ID) {
    assertSupportedSource(this.sourceResolver(sourceId));
    return this.#withLock(sourceId, "rollback", async () => {
      const state = await this.repository.getState(sourceId);
      if (!state?.previousPackKey) throw new TranslationPackError(`No previous translation-pack version is available for ${sourceId}.`, "translation_rollback_unavailable");
      await this.verifyPack(state.previousPackKey);
      const pack = await this.repository.rollback(sourceId, nowIso(this.now));
      this.#writeMarker(pack);
      return pack;
    });
  }

  async deleteVersion(packKey, sourceId = AMHARIC_TRANSLATION_SOURCE_ID) {
    assertSupportedSource(this.sourceResolver(sourceId));
    return this.#withLock(sourceId, "delete", async () => {
      const deleted = await this.repository.deletePack(sourceId, packKey);
      const state = await this.repository.getState(sourceId);
      if (state?.activePackKey) {
        const active = await this.repository.getPack(state.activePackKey);
        if (active) this.#writeMarker(active);
        else this.markerStore.delete(sourceId);
      } else {
        this.markerStore.delete(sourceId);
      }
      return deleted;
    });
  }

  async deleteSource(sourceId = AMHARIC_TRANSLATION_SOURCE_ID) {
    assertSupportedSource(this.sourceResolver(sourceId));
    return this.#withLock(sourceId, "delete", async () => {
      await this.repository.cleanupInterruptedInstalls(this.now());
      const deleted = await this.repository.deleteSource(sourceId);
      this.markerStore.delete(sourceId);
      return deleted;
    });
  }

  async cleanupInterruptedInstalls(sourceId = AMHARIC_TRANSLATION_SOURCE_ID) {
    assertSupportedSource(this.sourceResolver(sourceId));
    return this.#withLock(sourceId, "cleanup", () => this.repository.cleanupInterruptedInstalls(this.now()));
  }

  async getByVerseKey(verseKey, sourceId = AMHARIC_TRANSLATION_SOURCE_ID) {
    assertCanonicalVerseKey(verseKey);
    const state = await this.repository.getState(sourceId);
    if (!state?.activePackKey) return null;
    return this.repository.getRecord(state.activePackKey, verseKey);
  }

  async getByPageVerseKeys(verseKeys, sourceId = AMHARIC_TRANSLATION_SOURCE_ID) {
    if (!Array.isArray(verseKeys)) throw new TranslationPackError("Page verse keys must be an array.", "invalid_page_verse_keys");
    verseKeys.forEach(assertCanonicalVerseKey);
    const state = await this.repository.getState(sourceId);
    if (!state?.activePackKey) return verseKeys.map(() => null);
    return this.repository.getRecordsByVerseKeys(state.activePackKey, verseKeys);
  }

  async detectStorageReclamation(sourceId = AMHARIC_TRANSLATION_SOURCE_ID) {
    const marker = this.markerStore.get(sourceId);
    if (!marker?.packKey) return { reclaimed: false, expectedPackKey: null, reason: null };
    const state = await this.repository.getState(sourceId);
    if (!state?.activePackKey) return { reclaimed: true, expectedPackKey: marker.packKey, reason: "active-state-missing" };
    const pack = await this.repository.getPack(state.activePackKey);
    if (!pack) return { reclaimed: true, expectedPackKey: marker.packKey, reason: "active-pack-missing" };
    const records = await this.repository.getRecords(state.activePackKey);
    if (records.length !== EXPECTED_AYAH_COUNT) return { reclaimed: true, expectedPackKey: marker.packKey, reason: "verse-records-missing" };
    return { reclaimed: false, expectedPackKey: marker.packKey, reason: null };
  }

  async getStatus(sourceId = AMHARIC_TRANSLATION_SOURCE_ID) {
    const [state, packs, reclamation] = await Promise.all([
      this.repository.getState(sourceId),
      this.repository.listPacks(sourceId),
      this.detectStorageReclamation(sourceId),
    ]);
    return {
      sourceId,
      activePackKey: state?.activePackKey ?? null,
      previousPackKey: state?.previousPackKey ?? null,
      updateNotice: state?.updateNotice ?? null,
      installedPacks: packs,
      storageReclaimed: reclamation.reclaimed,
      reclamationReason: reclamation.reason,
    };
  }

  async #assertQuota(requiredBytes) {
    let estimate;
    try {
      estimate = await this.storageEstimate();
    } catch {
      return;
    }
    const quota = Number(estimate?.quota);
    const usage = Number(estimate?.usage);
    if (Number.isFinite(quota) && Number.isFinite(usage) && quota - usage < requiredBytes * this.quotaHeadroom) {
      throw new TranslationPackQuotaError(`The verified Amharic pack needs about ${Math.ceil(requiredBytes * this.quotaHeadroom).toLocaleString("en-US")} free bytes before staging.`);
    }
  }

  #writeMarker(pack) {
    this.markerStore.set(pack.sourceId, {
      packKey: pack.packKey,
      editionRevision: pack.editionRevision,
      normalizedChecksum: pack.normalizedChecksum,
      activatedAt: pack.installedAt,
    });
  }

  async #refresh(lock) {
    lock.expiresAt = this.now() + this.leaseMs;
    await this.repository.refreshLock(lock);
  }

  async #withLock(sourceId, operation, callback) {
    const acquiredAt = this.now();
    const lock = {
      sourceId,
      ownerId: this.ownerId,
      operationId: this.operationId(),
      operation,
      acquiredAt,
      expiresAt: acquiredAt + this.leaseMs,
    };
    await this.repository.acquireLock(lock);
    const heartbeat = setInterval(() => {
      this.#refresh(lock).catch(() => {});
    }, Math.max(1_000, Math.floor(this.leaseMs / 3)));
    heartbeat.unref?.();
    try {
      return await callback(lock);
    } finally {
      clearInterval(heartbeat);
      await this.repository.releaseLock(lock).catch(() => {});
    }
  }
}

export function createTranslationPackService(options) {
  return new TranslationPackService(options);
}
