import type { AudioManifestFile, AudioPackManifest, AudioPackType } from "./audio-manifest.mjs";

export type AudioPackStatus = "queued" | "downloading" | "paused" | "complete" | "failed";
export type AudioFileStatus = "pending" | "downloading" | "complete" | "failed";

export interface OfflineAudioFile extends AudioManifestFile {
  status: AudioFileStatus;
  size: number;
  checksum: string;
  error: string;
}

export interface OfflineAudioPack {
  id: string;
  schemaVersion: 1;
  manifestRevision: string;
  type: AudioPackType;
  number: number;
  label: string;
  reciterId: "alafasy";
  reciterName: string;
  status: AudioPackStatus;
  estimatedBytes: number;
  totalFiles: number;
  completedFiles: number;
  totalBytes: number;
  files: OfflineAudioFile[];
  createdAt: string;
  updatedAt: string;
  error: string;
}

export const OFFLINE_AUDIO_DB_NAME: string;
export const OFFLINE_AUDIO_DB_VERSION: number;
export const AUDIO_DOWNLOAD_CONCURRENCY: number;
export function formatAudioBytes(value: number): string;
export function normalizeAudioPackState(value: unknown): OfflineAudioPack;
export function createAudioPackState(manifest: AudioPackManifest, storedFiles?: Array<string | { key: string; size: number; checksum: string }>): OfflineAudioPack;
export function updateAudioPackFile(pack: OfflineAudioPack, fileKey: string, patch: Partial<OfflineAudioFile>): OfflineAudioPack;
export function audioPackProgress(pack: OfflineAudioPack): number;
export function isTransientAudioFailure(status: number): boolean;
export function sha256ArrayBuffer(buffer: ArrayBuffer): Promise<string>;
export function openOfflineAudioDb(): Promise<IDBDatabase>;
export function listStoredAudioFiles(): Promise<Array<{ key: string; size: number; checksum: string }>>;
export function listStoredAudioKeys(): Promise<string[]>;
export function putVerifiedAudioFile(file: AudioManifestFile, buffer: ArrayBuffer, contentType?: string): Promise<{ key: string; size: number; checksum: string; verifiedAt: string }>;
export function deleteStoredAudioFile(key: string): Promise<void>;
export function getVerifiedAudioBlob(reciterId: string, verseKey: string): Promise<Blob | null>;
export function verifyStoredAudioFile(key: string): Promise<boolean>;
export function saveAudioPack(pack: OfflineAudioPack): Promise<OfflineAudioPack>;
export function listAudioPacks(): Promise<OfflineAudioPack[]>;
export function deleteAudioPack(packId: string): Promise<number>;
export function getOfflineAudioStats(): Promise<{ usedBytes: number; fileCount: number; packCount: number; completePacks: number }>;
