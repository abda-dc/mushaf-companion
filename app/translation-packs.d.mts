import type {
  AcquiredTranslationSource,
  TranslationPack,
  TranslationProviderAdapter,
  TranslationRecord,
} from "./content/providers/types.ts";
import type { TranslationSourceRegistryEntry } from "./content/source-registry.schema.ts";

export const TRANSLATION_PACK_DB_NAME: "mushaf-translation-packs-v1";
export const TRANSLATION_PACK_DB_VERSION: 1;
export const TRANSLATION_PACK_SCHEMA_VERSION: 1;
export const AMHARIC_TRANSLATION_SOURCE_ID: "quranenc:amharic_zain";
export const TRANSLATION_PACK_STORES: Readonly<{
  packs: "packs";
  verses: "verses";
  state: "state";
  installs: "installs";
  locks: "locks";
}>;

export interface TranslationPackMetadata {
  packKey: string;
  schemaVersion: 1;
  sourceId: string;
  providerName: string;
  providerId: string;
  editionRevision: string;
  language: TranslationSourceRegistryEntry["language"];
  attribution: string;
  rawChecksum: string;
  normalizedChecksum: string;
  normalizationVersion: string;
  surahCount: 114;
  verseCount: 6236;
  installedAt: string;
}

export interface TranslationPackUpdateNotice {
  observedRevision: string | null;
  registryRevision: string;
  checkedAt: string;
}

export interface TranslationPackProgress {
  phase: "preparing" | "downloading" | "normalizing" | "validating" | "staging" | "verifying" | "activating" | "complete";
  percent: number;
  message: string;
  completedRecords: number;
  totalRecords: 6236;
}

export interface TranslationPackOperationOptions {
  onProgress?: (progress: TranslationPackProgress) => void;
}

export interface TranslationPackState {
  sourceId: string;
  activePackKey: string | null;
  previousPackKey: string | null;
  updateNotice: TranslationPackUpdateNotice | null;
  activatedAt: string | null;
}

export interface TranslationPackInstall {
  installId: string;
  operationId: string;
  ownerId: string;
  sourceId: string;
  packKey: string;
  editionRevision: string;
  expectedRecords: 6236;
  startedAt: string;
}

export interface TranslationPackLock {
  sourceId: string;
  ownerId: string;
  operationId: string;
  operation: string;
  acquiredAt: number;
  expiresAt: number;
}

export interface TranslationPackMarker {
  packKey: string;
  editionRevision: string;
  normalizedChecksum: string;
  activatedAt: string;
}

export interface TranslationPackMarkerStore {
  get(sourceId: string): TranslationPackMarker | null;
  set(sourceId: string, marker: TranslationPackMarker): void;
  delete(sourceId: string): void;
}

export interface TranslationPackRepository {
  acquireLock(lock: TranslationPackLock): Promise<void>;
  refreshLock(lock: TranslationPackLock): Promise<void>;
  releaseLock(lock: TranslationPackLock): Promise<void>;
  beginInstall(install: TranslationPackInstall, lock: TranslationPackLock): Promise<void>;
  stageRecords(install: TranslationPackInstall, records: readonly TranslationRecord[], lock: TranslationPackLock): Promise<void>;
  commitInstall(install: TranslationPackInstall, metadata: TranslationPackMetadata, lock: TranslationPackLock): Promise<TranslationPackMetadata>;
  cleanupInstall(installId: string, now?: number, force?: boolean): Promise<boolean>;
  cleanupInterruptedInstalls(now?: number): Promise<number>;
  getPack(packKey: string): Promise<TranslationPackMetadata | null>;
  getState(sourceId: string): Promise<TranslationPackState | null>;
  listPacks(sourceId: string): Promise<TranslationPackMetadata[]>;
  getRecords(packKey: string): Promise<TranslationRecord[]>;
  getRecord(packKey: string, verseKey: string): Promise<TranslationRecord | null>;
  getRecordsByVerseKeys(packKey: string, verseKeys: readonly string[]): Promise<Array<TranslationRecord | null>>;
  activatePack(sourceId: string, packKey: string, activatedAt: string): Promise<TranslationPackMetadata>;
  rollback(sourceId: string, activatedAt: string): Promise<TranslationPackMetadata>;
  setUpdateNotice(sourceId: string, updateNotice: TranslationPackUpdateNotice | null): Promise<void>;
  deletePack(sourceId: string, packKey: string): Promise<boolean>;
  deleteSource(sourceId: string): Promise<number>;
}

export interface TranslationPackServiceOptions {
  repository?: TranslationPackRepository;
  markerStore?: TranslationPackMarkerStore;
  sourceResolver?: (sourceId: string) => TranslationSourceRegistryEntry | null;
  adapterFactory?: (source: TranslationSourceRegistryEntry) => TranslationProviderAdapter;
  fetchImpl?: typeof globalThis.fetch;
  storageEstimate?: () => Promise<{ usage?: number; quota?: number }>;
  now?: () => number;
  operationId?: () => string;
  leaseMs?: number;
  quotaHeadroom?: number;
}

export class TranslationPackError extends Error {
  code: string;
  constructor(message: string, code?: string, options?: ErrorOptions);
}

export class TranslationPackBusyError extends TranslationPackError {}
export class TranslationPackQuotaError extends TranslationPackError {}
export class TranslationPackCorruptionError extends TranslationPackError {}

export function openTranslationPackDb(indexedDb?: IDBFactory, databaseName?: string): Promise<IDBDatabase>;

export class IndexedDbTranslationPackRepository implements TranslationPackRepository {
  constructor(options?: { indexedDb?: IDBFactory; databaseName?: string });
  open(): Promise<IDBDatabase>;
  acquireLock(lock: TranslationPackLock): Promise<void>;
  refreshLock(lock: TranslationPackLock): Promise<void>;
  releaseLock(lock: TranslationPackLock): Promise<void>;
  beginInstall(install: TranslationPackInstall, lock: TranslationPackLock): Promise<void>;
  stageRecords(install: TranslationPackInstall, records: readonly TranslationRecord[], lock: TranslationPackLock): Promise<void>;
  commitInstall(install: TranslationPackInstall, metadata: TranslationPackMetadata, lock: TranslationPackLock): Promise<TranslationPackMetadata>;
  cleanupInstall(installId: string, now?: number, force?: boolean): Promise<boolean>;
  cleanupInterruptedInstalls(now?: number): Promise<number>;
  getPack(packKey: string): Promise<TranslationPackMetadata | null>;
  getState(sourceId: string): Promise<TranslationPackState | null>;
  listPacks(sourceId: string): Promise<TranslationPackMetadata[]>;
  getRecords(packKey: string): Promise<TranslationRecord[]>;
  getRecord(packKey: string, verseKey: string): Promise<TranslationRecord | null>;
  getRecordsByVerseKeys(packKey: string, verseKeys: readonly string[]): Promise<Array<TranslationRecord | null>>;
  activatePack(sourceId: string, packKey: string, activatedAt: string): Promise<TranslationPackMetadata>;
  rollback(sourceId: string, activatedAt: string): Promise<TranslationPackMetadata>;
  setUpdateNotice(sourceId: string, updateNotice: TranslationPackUpdateNotice | null): Promise<void>;
  deletePack(sourceId: string, packKey: string): Promise<boolean>;
  deleteSource(sourceId: string): Promise<number>;
}

export class MemoryTranslationPackRepository implements TranslationPackRepository {
  constructor();
  acquireLock(lock: TranslationPackLock): Promise<void>;
  refreshLock(lock: TranslationPackLock): Promise<void>;
  releaseLock(lock: TranslationPackLock): Promise<void>;
  beginInstall(install: TranslationPackInstall, lock: TranslationPackLock): Promise<void>;
  stageRecords(install: TranslationPackInstall, records: readonly TranslationRecord[], lock: TranslationPackLock): Promise<void>;
  commitInstall(install: TranslationPackInstall, metadata: TranslationPackMetadata, lock: TranslationPackLock): Promise<TranslationPackMetadata>;
  cleanupInstall(installId: string, now?: number, force?: boolean): Promise<boolean>;
  cleanupInterruptedInstalls(now?: number): Promise<number>;
  getPack(packKey: string): Promise<TranslationPackMetadata | null>;
  getState(sourceId: string): Promise<TranslationPackState | null>;
  listPacks(sourceId: string): Promise<TranslationPackMetadata[]>;
  getRecords(packKey: string): Promise<TranslationRecord[]>;
  getRecord(packKey: string, verseKey: string): Promise<TranslationRecord | null>;
  getRecordsByVerseKeys(packKey: string, verseKeys: readonly string[]): Promise<Array<TranslationRecord | null>>;
  activatePack(sourceId: string, packKey: string, activatedAt: string): Promise<TranslationPackMetadata>;
  rollback(sourceId: string, activatedAt: string): Promise<TranslationPackMetadata>;
  setUpdateNotice(sourceId: string, updateNotice: TranslationPackUpdateNotice | null): Promise<void>;
  deletePack(sourceId: string, packKey: string): Promise<boolean>;
  deleteSource(sourceId: string): Promise<number>;
  failNextStage(error?: Error): void;
  seedInterruptedInstall(install: TranslationPackInstall, records: readonly TranslationRecord[]): void;
  corruptVerse(packKey: string, verseKey: string, translation?: string): void;
  simulateStorageReclamation(): void;
  snapshot(): { packs: TranslationPackMetadata[]; verses: unknown[]; states: TranslationPackState[]; installs: TranslationPackInstall[]; locks: TranslationPackLock[] };
}

export class LocalStorageTranslationPackMarkerStore implements TranslationPackMarkerStore {
  constructor(storage?: Storage, prefix?: string);
  get(sourceId: string): TranslationPackMarker | null;
  set(sourceId: string, marker: TranslationPackMarker): void;
  delete(sourceId: string): void;
}

export class MemoryTranslationPackMarkerStore implements TranslationPackMarkerStore {
  constructor();
  get(sourceId: string): TranslationPackMarker | null;
  set(sourceId: string, marker: TranslationPackMarker): void;
  delete(sourceId: string): void;
}

export class TranslationPackService {
  constructor(options?: TranslationPackServiceOptions);
  install(sourceId?: string, options?: TranslationPackOperationOptions): Promise<{ status: "installed" | "already_installed"; pack: TranslationPackMetadata }>;
  checkForUpdate(sourceId?: string): Promise<{ updateAvailable: boolean; observedRevision: string | null; activePackKey: string | null; replacementPerformed: false }>;
  verifyPack(packKey: string): Promise<{ valid: true; pack: TranslationPackMetadata; records: number }>;
  verifyActive(sourceId?: string): Promise<{ valid: true; pack: TranslationPackMetadata; records: number }>;
  repair(sourceId?: string, options?: TranslationPackOperationOptions): Promise<{ status: "healthy" | "repaired"; pack: TranslationPackMetadata }>;
  rollback(sourceId?: string): Promise<TranslationPackMetadata>;
  deleteVersion(packKey: string, sourceId?: string): Promise<boolean>;
  deleteSource(sourceId?: string): Promise<number>;
  cleanupInterruptedInstalls(sourceId?: string): Promise<number>;
  getByVerseKey(verseKey: string, sourceId?: string): Promise<TranslationRecord | null>;
  getByPageVerseKeys(verseKeys: readonly string[], sourceId?: string): Promise<Array<TranslationRecord | null>>;
  detectStorageReclamation(sourceId?: string): Promise<{ reclaimed: boolean; expectedPackKey: string | null; reason: string | null }>;
  getStatus(sourceId?: string): Promise<{
    sourceId: string;
    activePackKey: string | null;
    previousPackKey: string | null;
    updateNotice: TranslationPackUpdateNotice | null;
    installedPacks: TranslationPackMetadata[];
    storageReclaimed: boolean;
    reclamationReason: string | null;
  }>;
}

export function createTranslationPackService(options?: TranslationPackServiceOptions): TranslationPackService;

export type { AcquiredTranslationSource, TranslationPack };
