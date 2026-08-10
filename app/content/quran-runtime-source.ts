import { AUDIO_MANIFEST_REVISION, createAudioPackManifest, type AudioPackManifest, type AudioPackType } from "../audio-manifest.mjs";
import { CONTENT_MANIFEST } from "../content-manifest.ts";
import type { ChapterStart, PageChapter, PageLine, PageVerse, PageWord, QuranChapterInfo, QuranPage, SearchResult } from "../quran-data.ts";
import { normalizeTafsirPayload, TAFSIR_RESOURCE, type TafsirDocument } from "../tafsir-source.mjs";
import type { SearchResponse } from "./runtime-transport.types.ts";

export const QURAN_API_ROOT = "https://api.quran.com/api/v4";

interface ApiWord {
  id: number;
  text_uthmani: string;
  text_qpc_hafs?: string;
  text: string;
  code_v2?: string;
  code_v4?: string;
  char_type_name: string;
  line_number: number;
  page_number?: number;
}

interface ApiVerse {
  verse_number: number;
  verse_key: string;
  juz_number: number;
  hizb_number: number;
  text_uthmani: string;
  words: ApiWord[];
  sajdah_number?: number | null;
  translations?: Array<{ resource_id?: number; text: string }>;
}

interface ApiChapter {
  id: number;
  name_complex: string;
  name_simple: string;
  name_arabic: string;
  revelation_place: "makkah" | "madinah";
  revelation_order: number;
  verses_count: number;
  pages: [number, number];
  bismillah_pre: boolean;
  translated_name: { name: string };
}

interface ApiJuz {
  juz_number: number;
  verse_mapping: Record<string, string>;
}

interface VerseListPayload {
  verses?: Array<{ verse_key?: string }>;
  pagination?: { next_page?: number | null };
}

function qcfGlyphFromWord(value?: string) {
  if (!value) return undefined;
  return /[\uFB50-\uFDFF\uFE70-\uFEFF]/u.test(value) ? value : undefined;
}

function cleanLearningText(value?: string) {
  return (value ?? "")
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function plainText(value: string) {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function searchKey(value: string) {
  return value.normalize("NFD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]/gu, "");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function assertVerifiedStructure(page: number, verses: ApiVerse[], lineMap: Map<number, PageWord[]>) {
  if (!verses.length || !verses.every((verse) => /^\d{1,3}:\d{1,3}$/.test(verse.verse_key) && verse.words.length)) {
    throw new Error("Verified verse identity coverage is incomplete.");
  }
  const mappedWords = Array.from(lineMap.entries()).flatMap(([lineNumber, words]) => words.map((word) => ({ lineNumber, word })));
  if (!mappedWords.length || mappedWords.some(({ lineNumber, word }) => lineNumber < 1 || lineNumber > 15 || word.pageNumber !== page)) {
    throw new Error("Verified page-line mapping is invalid.");
  }
}

function splitTajweedWords(raw: string, expectedWords: number) {
  const cleaned = raw
    .replace(/<span\s+class=(?:["']?end["']?)[^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/<tajweed\s+class=(?:["']?)([a-z_]+)(?:["']?)>/gi, '<tajweed class="$1">')
    .replace(/<(?!\/?tajweed\b)[^>]+>/gi, "")
    .trim();
  const tokens = cleaned.match(/<[^>]+>|[^<]+/g) ?? [];
  const openTags: string[] = [];
  const words: string[] = [];
  let current = "";
  let hasVisibleText = false;
  const finishWord = () => {
    if (!hasVisibleText) return;
    current += openTags.slice().reverse().map(() => "</tajweed>").join("");
    words.push(current);
    current = openTags.join("");
    hasVisibleText = false;
  };
  for (const token of tokens) {
    if (token.startsWith("<tajweed")) {
      current += token;
      openTags.push(token);
      continue;
    }
    if (token === "</tajweed>") {
      current += token;
      openTags.pop();
      continue;
    }
    for (const character of Array.from(token)) {
      if (/\s/u.test(character)) finishWord();
      else {
        current += character;
        hasVisibleText = true;
      }
    }
  }
  finishWord();
  return words.length === expectedWords ? words : [];
}

export async function normalizeQuranPage(
  page: number,
  versePayload: { verses?: ApiVerse[] },
  tajweedPayload: { verses?: Array<{ verse_key: string; text_uthmani_tajweed: string }> },
  chapterPayload: { chapters?: ApiChapter[] },
): Promise<QuranPage> {
  if (!Number.isInteger(page) || page < 1 || page > 604) throw new Error("Page must be between 1 and 604.");
  if (!versePayload.verses?.length || !tajweedPayload.verses?.length || !chapterPayload.chapters?.length) {
    throw new Error("Verified page content is incomplete.");
  }
  const tajweedByVerse = new Map(tajweedPayload.verses.map((verse) => [verse.verse_key, verse.text_uthmani_tajweed]));
  const lineMap = new Map<number, PageWord[]>();
  const verses: PageVerse[] = [];
  const chapterIds = new Set<number>();
  const chapterStarts: ChapterStart[] = [];

  for (const verse of versePayload.verses) {
    const [chapterId] = verse.verse_key.split(":").map(Number);
    chapterIds.add(chapterId);
    verses.push({
      key: verse.verse_key,
      number: verse.verse_number,
      chapterId,
      uthmani: verse.text_uthmani,
      transliteration: cleanLearningText(verse.translations?.find((item) => item.resource_id === CONTENT_MANIFEST.resources.transliteration.id)?.text ?? verse.translations?.[1]?.text),
      translation: cleanLearningText(verse.translations?.find((item) => item.resource_id === CONTENT_MANIFEST.resources.translation.id)?.text ?? verse.translations?.[0]?.text),
      sajdahNumber: verse.sajdah_number ?? undefined,
    });
    const contentWords = verse.words.filter((word) => word.char_type_name !== "end");
    const alignedTajweed = splitTajweedWords(tajweedByVerse.get(verse.verse_key) ?? "", contentWords.length);
    let contentIndex = 0;
    for (const word of verse.words) {
      const isEnd = word.char_type_name === "end";
      const qcfCode = word.code_v2 ?? qcfGlyphFromWord(word.text);
      const mapped: PageWord = {
        id: word.id,
        text: word.text_qpc_hafs || word.text_uthmani || word.text,
        tajweedHtml: isEnd ? "" : alignedTajweed[contentIndex] ?? (word.text_qpc_hafs || word.text_uthmani || word.text),
        verseKey: verse.verse_key,
        isEnd,
        qcfCode,
        qcfTajweedCode: word.code_v4 ?? qcfCode,
        pageNumber: word.page_number ?? page,
      };
      if (!isEnd) contentIndex += 1;
      const line = lineMap.get(word.line_number) ?? [];
      line.push(mapped);
      lineMap.set(word.line_number, line);
    }
    if (verse.verse_number === 1) {
      const firstLine = verse.words[0]?.line_number ?? 1;
      const hasBismillah = chapterId !== 1 && chapterId !== 9;
      chapterStarts.push({ chapterId, headerLine: Math.max(1, firstLine - (hasBismillah ? 2 : 1)), bismillahLine: hasBismillah ? Math.max(1, firstLine - 1) : null });
    }
  }

  const chapters: PageChapter[] = chapterPayload.chapters
    .filter((chapter) => chapterIds.has(chapter.id))
    .map((chapter) => ({
      id: chapter.id,
      name: chapter.name_complex || chapter.name_simple,
      translatedName: chapter.translated_name.name,
      arabicName: chapter.name_arabic,
      revelationPlace: chapter.revelation_place,
    }));
  const lines: PageLine[] = Array.from({ length: 15 }, (_, index) => ({ number: index + 1, words: lineMap.get(index + 1) ?? [] }));
  const firstVerse = versePayload.verses[0];
  assertVerifiedStructure(page, versePayload.verses, lineMap);
  const pageChecksum = await sha256Hex(JSON.stringify({
    page,
    verses: verses.map((verse) => ({ key: verse.key, uthmani: verse.uthmani, translation: verse.translation, transliteration: verse.transliteration })),
    lines: lines.map((line) => ({ number: line.number, words: line.words.map((word) => ({ id: word.id, verseKey: word.verseKey, text: word.text, isEnd: word.isEnd })) })),
  }));
  return {
    page,
    juz: firstVerse.juz_number,
    hizb: firstVerse.hizb_number,
    lines,
    verses,
    chapters,
    chapterStarts,
    provenance: {
      verified: true,
      manifestRevision: CONTENT_MANIFEST.revision,
      mushafId: CONTENT_MANIFEST.edition.mushafId,
      arabicResource: CONTENT_MANIFEST.resources.arabic.id,
      tajweedResource: CONTENT_MANIFEST.resources.tajweed.id,
      translationResource: CONTENT_MANIFEST.resources.translation.id,
      transliterationResource: CONTENT_MANIFEST.resources.transliteration.id,
      pageChecksum,
    },
  };
}

export async function fetchQuranPageFromSource(page: number, fetchImpl: typeof fetch = fetch, signal?: AbortSignal): Promise<QuranPage> {
  const pageQuery = new URLSearchParams({
    mushaf: "1",
    words: "true",
    translations: "20,57",
    fields: "text_uthmani,sajdah_number",
    word_fields: "line_number,page_number,text_uthmani,text_qpc_hafs,code_v2,code_v4",
    per_page: "50",
  });
  const [verseResponse, tajweedResponse, chapterResponse] = await Promise.all([
    fetchImpl(`${QURAN_API_ROOT}/verses/by_page/${page}?${pageQuery}`, { signal }),
    fetchImpl(`${QURAN_API_ROOT}/quran/verses/uthmani_tajweed?page_number=${page}`, { signal }),
    fetchImpl(`${QURAN_API_ROOT}/chapters?language=en`, { signal }),
  ]);
  if (!verseResponse.ok || !tajweedResponse.ok || !chapterResponse.ok) throw new Error("Quran content source returned an error.");
  return normalizeQuranPage(page, await verseResponse.json(), await tajweedResponse.json(), await chapterResponse.json());
}

export function normalizeChapters(chapterPayload: { chapters?: ApiChapter[] }, juzPayload: { juzs?: ApiJuz[] }): QuranChapterInfo[] {
  if (chapterPayload.chapters?.length !== 114 || !juzPayload.juzs?.length) throw new Error("Chapter index incomplete.");
  return chapterPayload.chapters.map((chapter) => ({
    id: chapter.id,
    name: chapter.name_complex || chapter.name_simple,
    simpleName: chapter.name_simple,
    arabicName: chapter.name_arabic,
    translatedName: chapter.translated_name.name,
    revelationPlace: chapter.revelation_place,
    revelationOrder: chapter.revelation_order,
    versesCount: chapter.verses_count,
    startPage: chapter.pages[0],
    endPage: chapter.pages[1],
    juzs: Array.from(new Set(juzPayload.juzs.filter((juz) => chapter.id.toString() in juz.verse_mapping).map((juz) => juz.juz_number))).sort((a, b) => a - b),
    bismillahPre: chapter.bismillah_pre,
  }));
}

export async function fetchChaptersFromSource(fetchImpl: typeof fetch = fetch, signal?: AbortSignal): Promise<QuranChapterInfo[]> {
  const [chapterResponse, juzResponse] = await Promise.all([
    fetchImpl(`${QURAN_API_ROOT}/chapters?language=en`, { signal }),
    fetchImpl(`${QURAN_API_ROOT}/juzs`, { signal }),
  ]);
  if (!chapterResponse.ok || !juzResponse.ok) throw new Error("Chapter index source unavailable.");
  return normalizeChapters(await chapterResponse.json(), await juzResponse.json());
}

function directSearchResults(query: string): SearchResult[] {
  const pageMatch = query.match(/^(?:page\s*)?(\d{1,3})$/i);
  const pageResult: SearchResult[] = pageMatch && Number(pageMatch[1]) >= 1 && Number(pageMatch[1]) <= 604
    ? [{ id: `page-${pageMatch[1]}`, type: "page", label: `Page ${pageMatch[1]}`, detail: "Go directly to this Madani mushaf page", page: Number(pageMatch[1]) }]
    : [];
  const ayahMatch = query.match(/^(\d{1,3}):(\d{1,3})$/);
  const ayahResult: SearchResult[] = ayahMatch
    ? [{ id: `direct-${query}`, type: "verse", label: `Ayah ${query}`, detail: "Open this ayah in its Madani mushaf page", verseKey: query }]
    : [];
  return [...pageResult, ...ayahResult];
}

export async function searchQuranSource(query: string, fetchImpl: typeof fetch = fetch, signal?: AbortSignal): Promise<SearchResponse> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return { results: [] };
  const direct = directSearchResults(cleanQuery);
  try {
    const [searchResponse, chapterResponse] = await Promise.all([
      fetchImpl(`${QURAN_API_ROOT}/search?${new URLSearchParams({ q: cleanQuery, size: "10", page: "0", language: "en" })}`, { signal }),
      fetchImpl(`${QURAN_API_ROOT}/chapters?language=en`, { signal }),
    ]);
    if (!searchResponse.ok || !chapterResponse.ok) throw new Error("Search source unavailable.");
    const searchPayload = await searchResponse.json() as { search?: { results?: Array<{ verse_key: string; text: string; translations?: Array<{ text: string }> }> } };
    const chapterPayload = await chapterResponse.json() as { chapters?: ApiChapter[] };
    const normalized = searchKey(cleanQuery);
    const chapterResults: SearchResult[] = (chapterPayload.chapters ?? [])
      .filter((chapter) => normalized.length > 0 && searchKey(`${chapter.id}${chapter.name_simple}${chapter.name_complex}${chapter.name_arabic}${chapter.translated_name.name}`).includes(normalized))
      .slice(0, 5)
      .map((chapter) => ({
        id: `chapter-${chapter.id}`,
        type: "chapter",
        label: `${chapter.id}. ${chapter.name_complex}`,
        detail: `${chapter.translated_name.name} · Page ${chapter.pages[0]}`,
        arabic: chapter.name_arabic,
        page: chapter.pages[0],
        verseKey: `${chapter.id}:1`,
      }));
    const verseResults: SearchResult[] = (searchPayload.search?.results ?? []).slice(0, 10).map((verse) => ({
      id: `verse-${verse.verse_key}`,
      type: "verse",
      label: `Ayah ${verse.verse_key}`,
      detail: plainText(verse.translations?.[0]?.text ?? "Quran verse"),
      arabic: verse.text,
      verseKey: verse.verse_key,
    }));
    return { results: [...direct, ...chapterResults, ...verseResults].slice(0, 12) };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { results: direct, error: "Search is temporarily limited to page and ayah numbers." };
  }
}

export async function lookupVerseFromSource(verseKey: string, fetchImpl: typeof fetch = fetch, signal?: AbortSignal) {
  if (!/^\d{1,3}:\d{1,3}$/.test(verseKey)) throw new Error("Invalid ayah key.");
  const response = await fetchImpl(`${QURAN_API_ROOT}/verses/by_key/${encodeURIComponent(verseKey)}?fields=page_number`, { signal });
  if (!response.ok) throw new Error("Ayah page mapping is temporarily unavailable.");
  const payload = await response.json() as { verse?: { page_number?: number; verse_key?: string } };
  if (!payload.verse?.page_number) throw new Error("Ayah page mapping is incomplete.");
  return { page: payload.verse.page_number, verseKey: payload.verse.verse_key ?? verseKey };
}

async function fetchVerseKeys(type: AudioPackType, id: number, fetchImpl: typeof fetch, signal?: AbortSignal) {
  const verseKeys: string[] = [];
  let page = 1;
  while (page <= 20) {
    const endpoint = type === "surah" ? `verses/by_chapter/${id}` : `verses/by_juz/${id}`;
    const response = await fetchImpl(`${QURAN_API_ROOT}/${endpoint}?words=false&per_page=50&page=${page}`, { signal });
    if (!response.ok) throw new Error("Verified verse list is unavailable.");
    const payload = await response.json() as VerseListPayload;
    const batch = (payload.verses ?? []).map((verse) => verse.verse_key ?? "").filter((key) => /^\d{1,3}:\d{1,3}$/.test(key));
    if (!batch.length) break;
    verseKeys.push(...batch);
    const nextPage = payload.pagination?.next_page;
    if (!nextPage || nextPage <= page) break;
    page = nextPage;
  }
  return [...new Set(verseKeys)];
}

export async function fetchAudioManifestFromSource(type: AudioPackType, id: number, reciterId = "alafasy", fetchImpl: typeof fetch = fetch, signal?: AbortSignal): Promise<AudioPackManifest> {
  if ((type !== "surah" && type !== "juz") || !Number.isInteger(id) || reciterId !== "alafasy") throw new Error("Choose a supported surah or juz pack and reciter.");
  if ((type === "surah" && (id < 1 || id > 114)) || (type === "juz" && (id < 1 || id > 30))) throw new Error("Pack number is outside the supported range.");
  const verseKeys = await fetchVerseKeys(type, id, fetchImpl, signal);
  const manifest = createAudioPackManifest({ type, id, reciterId, verseKeys });
  if (manifest.revision !== AUDIO_MANIFEST_REVISION) throw new Error("Audio manifest revision mismatch.");
  return manifest;
}

export async function fetchTafsirFromSource(verseKey: string, fetchImpl: typeof fetch = fetch, signal?: AbortSignal): Promise<TafsirDocument> {
  if (!/^[1-9]\d{0,2}:[1-9]\d{0,2}$/.test(verseKey)) throw new Error("Provide a valid verse key such as 2:255.");
  const response = await fetchImpl(`${QURAN_API_ROOT}/tafsirs/${TAFSIR_RESOURCE.id}/by_ayah/${encodeURIComponent(verseKey)}`, { signal });
  if (!response.ok) throw new Error(response.status === 404 ? "Tafsir is not mapped to this ayah." : "The tafsir source is temporarily unavailable.");
  const document = normalizeTafsirPayload(await response.json(), verseKey);
  const contentChecksum = await sha256Hex(JSON.stringify({
    requestedVerseKey: document.requestedVerseKey,
    mappedVerseKeys: document.mappedVerseKeys,
    resourceId: document.resource.id,
    sourceRevision: document.resource.revision,
    blocks: document.blocks,
  }));
  return {
    ...document,
    provenance: { verified: true, checksumAlgorithm: "SHA-256", contentChecksum, sourceRevision: TAFSIR_RESOURCE.revision },
  };
}
