import { findTranslationSource } from "./source-registry.ts";
import { appPath } from "../runtime-config.ts";
import {
  fetchAudioManifestFromSource,
  fetchChaptersFromSource,
  fetchQuranPageFromSource,
  fetchTafsirFromSource,
  lookupVerseFromSource,
  searchQuranSource,
} from "./quran-runtime-source.ts";
import type { ReaderContentTransport } from "./runtime-transport.types.ts";

const AMHARIC_SOURCE = findTranslationSource("quranenc:amharic_zain");

export function createPagesReaderTransport(fetchImpl: typeof fetch = fetch): ReaderContentTransport {
  return {
    mode: "pages",
    contentManifestUrl: appPath("content/content-manifest.json"),
    loadPage(page, signal) {
      return fetchQuranPageFromSource(page, fetchImpl, signal);
    },
    search(query, signal) {
      return searchQuranSource(query, fetchImpl, signal);
    },
    loadChapters(signal) {
      return fetchChaptersFromSource(fetchImpl, signal);
    },
    lookupVerse(verseKey, signal) {
      return lookupVerseFromSource(verseKey, fetchImpl, signal);
    },
    loadTafsir(verseKey, signal) {
      return fetchTafsirFromSource(verseKey, fetchImpl, signal);
    },
    loadAudioManifest(type, id, reciterId = "alafasy", signal) {
      return fetchAudioManifestFromSource(type, id, reciterId, fetchImpl, signal);
    },
    fetchTranslationPackSource(input, init) {
      const url = input instanceof Request ? input.url : String(input);
      if (url === AMHARIC_SOURCE?.provider.packageUrl) return fetchImpl(appPath("content/amharic_zain.xml"), init);
      if (url === AMHARIC_SOURCE?.provider.checkForUpdatesUrl) return fetchImpl(appPath("content/amharic_zain-update.txt"), init);
      return Promise.reject(new Error("The requested translation-pack source is not enabled in this reader."));
    },
  };
}

let transport: ReaderContentTransport | undefined;

export function getReaderTransport(): ReaderContentTransport {
  transport ??= createPagesReaderTransport();
  return transport;
}
