import type { AudioPackManifest, AudioPackType } from "../audio-manifest.mjs";
import { findTranslationSource } from "./source-registry.ts";
import type { QuranChapterInfo, QuranPage } from "../quran-data.ts";
import type { TafsirDocument } from "../tafsir-source.mjs";
import { appPath } from "../runtime-config.ts";
import type { ReaderContentTransport, SearchResponse } from "./runtime-transport.types.ts";
import type { EducationCatalogResult } from "../education-content.ts";

const AMHARIC_SOURCE = findTranslationSource("quranenc:amharic_zain");

async function responseError(response: Response, fallback: string) {
  try {
    const body = await response.json() as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

async function requestJson<T>(url: string, signal: AbortSignal | undefined, fallback: string): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(await responseError(response, fallback));
  return response.json() as Promise<T>;
}

export function createServerReaderTransport(): ReaderContentTransport {
  return {
    mode: "server",
    contentManifestUrl: appPath("api/content-manifest"),
    loadPage(page, signal) {
      return requestJson<QuranPage>(appPath(`api/pages/${page}?v=2026-08-06-phase-three`), signal, "Verified Quran page data is temporarily unavailable.");
    },
    loadPageForReading(readingId, page, signal) {
      return requestJson<QuranPage>(
        appPath(`api/pages/${page}?v=2026-08-06-phase-three&reading=${encodeURIComponent(readingId)}`),
        signal,
        "Verified Quran page data is temporarily unavailable.",
      );
    },
    search(query, signal) {
      return requestJson<SearchResponse>(appPath(`api/search?q=${encodeURIComponent(query)}`), signal, "Search is temporarily unavailable.");
    },
    async loadChapters(signal) {
      const payload = await requestJson<{ chapters: QuranChapterInfo[] }>(appPath("api/chapters"), signal, "The verified chapter index is temporarily unavailable.");
      return payload.chapters;
    },
    lookupVerse(verseKey, signal) {
      return requestJson<{ page: number; verseKey: string }>(appPath(`api/lookup?verse=${encodeURIComponent(verseKey)}`), signal, "Ayah page mapping is temporarily unavailable.");
    },
    loadTafsir(verseKey, signal) {
      return requestJson<TafsirDocument>(appPath(`api/tafsir?verse=${encodeURIComponent(verseKey)}`), signal, "Verified tafsir is temporarily unavailable.");
    },
    loadAudioManifest(type: AudioPackType, id: number, reciterId = "alafasy", signal?: AbortSignal) {
      return requestJson<AudioPackManifest>(appPath(`api/audio-manifest?type=${type}&id=${id}&reciter=${encodeURIComponent(reciterId)}`), signal, "The verified audio pack manifest is temporarily unavailable.");
    },
    loadEducationCatalog(signal) {
      return requestJson<EducationCatalogResult>(appPath("api/education/catalog"), signal, "Guided education sources are temporarily unavailable.");
    },
    fetchTranslationPackSource(input, init) {
      const url = input instanceof Request ? input.url : String(input);
      if (url === AMHARIC_SOURCE?.provider.packageUrl) return fetch(appPath("api/translation-packs/amharic"), init);
      if (url === AMHARIC_SOURCE?.provider.checkForUpdatesUrl) return fetch(appPath("api/translation-packs/amharic?operation=update"), init);
      return Promise.reject(new Error("The requested translation-pack source is not enabled in this reader."));
    },
  };
}

let transport: ReaderContentTransport | undefined;

export function getReaderTransport(): ReaderContentTransport {
  transport ??= createServerReaderTransport();
  return transport;
}
