import type { ReciterId } from "./quran-data";

export type AudioPackType = "surah" | "juz";

export interface AudioManifestFile {
  key: string;
  verseKey: string;
  reciterId: "alafasy";
  url: string;
  urlRevision: string;
}

export interface AudioPackManifest {
  schemaVersion: 1;
  revision: string;
  reciter: {
    id: "alafasy";
    name: string;
    scope: "ayah";
    source: string;
    sourceUrl: string;
    license: string;
  };
  pack: {
    id: string;
    type: AudioPackType;
    number: number;
    label: string;
    verseCount: number;
    estimatedBytes: number;
  };
  files: AudioManifestFile[];
}

export const AUDIO_MANIFEST_REVISION: string;
export const AUDIO_AVERAGE_BYTES_PER_VERSE: number;
export const DOWNLOADABLE_RECITERS: ReadonlyArray<AudioPackManifest["reciter"]>;
export function audioStreamUrl(reciter: ReciterId, verseKey: string): string;
export function audioFileKey(reciterId: string, verseKey: string): string;
export function audioPackKey(type: AudioPackType, id: number, reciterId?: string): string;
export function estimateAudioBytes(verseCount: number): number;
export function createAudioPackManifest(input: { type: AudioPackType; id: number; label?: string; reciterId?: "alafasy"; verseKeys: string[] }): AudioPackManifest;
