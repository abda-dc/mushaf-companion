import type { AudioPackManifest, AudioPackType } from "../audio-manifest.mjs";
import type { QuranChapterInfo, QuranPage, SearchResult } from "../quran-data.ts";
import type { TafsirDocument } from "../tafsir-source.mjs";
import type { ReaderRuntimeMode } from "../runtime-config.ts";
import type { EducationCatalogResult } from "../education-content.ts";
import type { ReadingId } from "../reading-registry.mjs";

export interface SearchResponse {
  results: SearchResult[];
  error?: string;
}

export interface ReaderContentTransport {
  readonly mode: ReaderRuntimeMode;
  readonly contentManifestUrl: string;
  loadPage(page: number, signal?: AbortSignal): Promise<QuranPage>;
  loadPageForReading(readingId: ReadingId, page: number, signal?: AbortSignal): Promise<QuranPage>;
  search(query: string, signal?: AbortSignal): Promise<SearchResponse>;
  loadChapters(signal?: AbortSignal): Promise<QuranChapterInfo[]>;
  lookupVerse(verseKey: string, signal?: AbortSignal): Promise<{ page: number; verseKey: string }>;
  loadTafsir(verseKey: string, signal?: AbortSignal): Promise<TafsirDocument>;
  loadAudioManifest(type: AudioPackType, id: number, reciterId?: string, signal?: AbortSignal): Promise<AudioPackManifest>;
  loadEducationCatalog(signal?: AbortSignal): Promise<EducationCatalogResult>;
  fetchTranslationPackSource(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}
