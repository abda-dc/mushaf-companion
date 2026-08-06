import { audioFileKey } from "./audio-manifest.mjs";

export const OFFLINE_AUDIO_DB_NAME = "mushaf-offline-audio-v1";
export const OFFLINE_AUDIO_DB_VERSION = 1;
export const AUDIO_DOWNLOAD_CONCURRENCY = 2;

const PACK_STATUSES = new Set(["queued", "downloading", "paused", "complete", "failed"]);
const FILE_STATUSES = new Set(["pending", "downloading", "complete", "failed"]);

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Offline audio storage request failed."));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Offline audio storage transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Offline audio storage transaction was cancelled."));
  });
}

export function formatAudioBytes(value) {
  const bytes = Math.max(0, Number(value) || 0);
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(bytes < 10 * 1024 ** 2 ? 1 : 0)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export function normalizeAudioPackState(value) {
  const source = value && typeof value === "object" ? value : {};
  const files = Array.isArray(source.files) ? source.files.filter((file) => file && typeof file === "object" && typeof file.key === "string" && typeof file.verseKey === "string" && typeof file.url === "string").map((file) => ({
    key: file.key,
    verseKey: file.verseKey,
    reciterId: file.reciterId === "alafasy" ? "alafasy" : "alafasy",
    url: file.url,
    urlRevision: typeof file.urlRevision === "string" ? file.urlRevision : "unknown",
    status: FILE_STATUSES.has(file.status) ? file.status : "pending",
    size: Number.isFinite(file.size) && file.size > 0 ? file.size : 0,
    checksum: typeof file.checksum === "string" && /^[a-f0-9]{64}$/.test(file.checksum) ? file.checksum : "",
    error: typeof file.error === "string" ? file.error : "",
  })) : [];
  const completedFiles = files.filter((file) => file.status === "complete" && file.checksum).length;
  const totalBytes = files.reduce((sum, file) => sum + (file.status === "complete" ? file.size : 0), 0);
  const status = PACK_STATUSES.has(source.status) ? source.status : "queued";
  return {
    id: typeof source.id === "string" ? source.id : "",
    schemaVersion: 1,
    manifestRevision: typeof source.manifestRevision === "string" ? source.manifestRevision : "unknown",
    type: source.type === "juz" ? "juz" : "surah",
    number: Number.isInteger(source.number) ? source.number : 1,
    label: typeof source.label === "string" ? source.label : "Audio pack",
    reciterId: "alafasy",
    reciterName: typeof source.reciterName === "string" ? source.reciterName : "Mishary Rashid Alafasy",
    status: status === "complete" && completedFiles !== files.length ? "paused" : status,
    estimatedBytes: Number.isFinite(source.estimatedBytes) && source.estimatedBytes > 0 ? source.estimatedBytes : 0,
    totalFiles: files.length,
    completedFiles,
    totalBytes,
    files,
    createdAt: typeof source.createdAt === "string" ? source.createdAt : new Date().toISOString(),
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : new Date().toISOString(),
    error: typeof source.error === "string" ? source.error : "",
  };
}

export function createAudioPackState(manifest, storedFiles = []) {
  const available = new Map(storedFiles.map((file) => typeof file === "string" ? [file, { key: file, size: 0, checksum: "" }] : [file.key, file]));
  return normalizeAudioPackState({
    id: manifest.pack.id,
    manifestRevision: manifest.revision,
    type: manifest.pack.type,
    number: manifest.pack.number,
    label: manifest.pack.label,
    reciterId: manifest.reciter.id,
    reciterName: manifest.reciter.name,
    status: "queued",
    estimatedBytes: manifest.pack.estimatedBytes,
    files: manifest.files.map((file) => {
      const stored = available.get(file.key);
      return { ...file, status: stored ? "complete" : "pending", size: stored?.size ?? 0, checksum: stored?.checksum ?? "" };
    }),
  });
}

export function updateAudioPackFile(pack, fileKey, patch) {
  const normalized = normalizeAudioPackState(pack);
  const files = normalized.files.map((file) => file.key === fileKey ? { ...file, ...patch } : file);
  return normalizeAudioPackState({ ...normalized, files, updatedAt: new Date().toISOString() });
}

export function audioPackProgress(pack) {
  const normalized = normalizeAudioPackState(pack);
  return normalized.totalFiles ? Math.round((normalized.completedFiles / normalized.totalFiles) * 100) : 0;
}

export function isTransientAudioFailure(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

export async function sha256ArrayBuffer(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function openOfflineAudioDb() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("Offline audio storage is not supported in this browser."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_AUDIO_DB_NAME, OFFLINE_AUDIO_DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("files")) database.createObjectStore("files", { keyPath: "key" });
      if (!database.objectStoreNames.contains("packs")) database.createObjectStore("packs", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Offline audio storage could not be opened."));
  });
}

async function readAll(storeName) {
  const database = await openOfflineAudioDb();
  try {
    const transaction = database.transaction(storeName, "readonly");
    const done = transactionDone(transaction);
    const result = await requestResult(transaction.objectStore(storeName).getAll());
    await done;
    return result;
  } finally {
    database.close();
  }
}

async function readOne(storeName, key) {
  const database = await openOfflineAudioDb();
  try {
    const transaction = database.transaction(storeName, "readonly");
    const done = transactionDone(transaction);
    const result = await requestResult(transaction.objectStore(storeName).get(key));
    await done;
    return result;
  } finally {
    database.close();
  }
}

async function writeOne(storeName, value) {
  const database = await openOfflineAudioDb();
  try {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function listStoredAudioFiles() {
  const files = await readAll("files");
  return files.filter((file) => file?.blob instanceof Blob && file.blob.size === file.size && /^[a-f0-9]{64}$/.test(file.checksum ?? "")).map((file) => ({ key: file.key, size: file.size, checksum: file.checksum }));
}

export async function listStoredAudioKeys() {
  return (await listStoredAudioFiles()).map((file) => file.key);
}

export async function putVerifiedAudioFile(file, buffer, contentType = "audio/mpeg") {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 1024) throw new Error("Downloaded audio file is incomplete.");
  const checksum = await sha256ArrayBuffer(buffer);
  const record = {
    key: file.key,
    reciterId: file.reciterId,
    verseKey: file.verseKey,
    urlRevision: file.urlRevision,
    blob: new Blob([buffer], { type: contentType || "audio/mpeg" }),
    size: buffer.byteLength,
    checksum,
    verifiedAt: new Date().toISOString(),
  };
  await writeOne("files", record);
  const stored = await readOne("files", record.key);
  if (!stored?.blob || stored.blob.size !== record.size || await sha256ArrayBuffer(await stored.blob.arrayBuffer()) !== checksum) {
    await deleteStoredAudioFile(record.key);
    throw new Error("Stored audio failed its integrity check.");
  }
  return { key: record.key, size: record.size, checksum: record.checksum, verifiedAt: record.verifiedAt };
}

export async function deleteStoredAudioFile(key) {
  const database = await openOfflineAudioDb();
  try {
    const transaction = database.transaction("files", "readwrite");
    transaction.objectStore("files").delete(key);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function getVerifiedAudioBlob(reciterId, verseKey) {
  const stored = await readOne("files", audioFileKey(reciterId, verseKey));
  if (!stored?.blob || stored.blob.size !== stored.size || !/^[a-f0-9]{64}$/.test(stored.checksum ?? "")) return null;
  return stored.blob;
}

export async function verifyStoredAudioFile(key) {
  const stored = await readOne("files", key);
  if (!stored?.blob || stored.blob.size !== stored.size || !/^[a-f0-9]{64}$/.test(stored.checksum ?? "")) {
    if (stored) await deleteStoredAudioFile(key);
    return false;
  }
  const valid = await sha256ArrayBuffer(await stored.blob.arrayBuffer()) === stored.checksum;
  if (!valid) await deleteStoredAudioFile(key);
  return valid;
}

export async function saveAudioPack(pack) {
  const normalized = normalizeAudioPackState(pack);
  if (!normalized.id || !normalized.files.length) throw new Error("Offline audio pack is incomplete.");
  await writeOne("packs", normalized);
  return normalized;
}

export async function listAudioPacks() {
  const packs = await readAll("packs");
  return packs.map(normalizeAudioPackState).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function deleteAudioPack(packId) {
  const packs = await listAudioPacks();
  const target = packs.find((pack) => pack.id === packId);
  if (!target) return 0;
  const retainedKeys = new Set(packs.filter((pack) => pack.id !== packId).flatMap((pack) => pack.files.map((file) => file.key)));
  const removable = target.files.filter((file) => !retainedKeys.has(file.key));
  const database = await openOfflineAudioDb();
  try {
    const transaction = database.transaction(["packs", "files"], "readwrite");
    transaction.objectStore("packs").delete(packId);
    removable.forEach((file) => transaction.objectStore("files").delete(file.key));
    await transactionDone(transaction);
  } finally {
    database.close();
  }
  return removable.reduce((sum, file) => sum + file.size, 0);
}

export async function getOfflineAudioStats() {
  const [files, packs] = await Promise.all([readAll("files"), listAudioPacks()]);
  const usedBytes = files.reduce((sum, file) => sum + (Number(file?.size) || 0), 0);
  return {
    usedBytes,
    fileCount: files.length,
    packCount: packs.length,
    completePacks: packs.filter((pack) => pack.status === "complete").length,
  };
}
