import { NextResponse } from "next/server";
import type { ChapterStart, PageChapter, PageLine, PageVerse, PageWord, QuranPage } from "../../../quran-data";

const API_ROOT = "https://api.quran.com/api/v4";

interface ApiWord {
  id: number;
  text_uthmani: string;
  text: string;
  char_type_name: string;
  line_number: number;
}

interface ApiVerse {
  verse_number: number;
  verse_key: string;
  juz_number: number;
  hizb_number: number;
  text_uthmani: string;
  words: ApiWord[];
  translations?: Array<{ text: string }>;
}

interface ApiChapter {
  id: number;
  name_complex: string;
  name_simple: string;
  name_arabic: string;
  revelation_place: string;
  translated_name: { name: string };
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

export async function GET(_request: Request, context: { params: Promise<{ page: string }> }) {
  const { page: rawPage } = await context.params;
  const page = Number(rawPage);
  if (!Number.isInteger(page) || page < 1 || page > 604) {
    return NextResponse.json({ error: "Page must be between 1 and 604." }, { status: 400 });
  }

  const pageQuery = new URLSearchParams({
    words: "true",
    translations: "57",
    fields: "text_uthmani",
    word_fields: "line_number,text_uthmani",
    per_page: "50",
  });

  try {
    const [verseResponse, tajweedResponse, chapterResponse] = await Promise.all([
      fetch(`${API_ROOT}/verses/by_page/${page}?${pageQuery}`),
      fetch(`${API_ROOT}/quran/verses/uthmani_tajweed?page_number=${page}`),
      fetch(`${API_ROOT}/chapters?language=en`),
    ]);

    if (!verseResponse.ok || !tajweedResponse.ok || !chapterResponse.ok) {
      throw new Error("Quran content source returned an error.");
    }

    const versePayload = (await verseResponse.json()) as { verses?: ApiVerse[] };
    const tajweedPayload = (await tajweedResponse.json()) as { verses?: Array<{ verse_key: string; text_uthmani_tajweed: string }> };
    const chapterPayload = (await chapterResponse.json()) as { chapters?: ApiChapter[] };
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
        transliteration: verse.translations?.[0]?.text ?? "",
      });

      const contentWords = verse.words.filter((word) => word.char_type_name !== "end");
      const alignedTajweed = splitTajweedWords(tajweedByVerse.get(verse.verse_key) ?? "", contentWords.length);
      let contentIndex = 0;
      for (const word of verse.words) {
        const isEnd = word.char_type_name === "end";
        const mapped: PageWord = {
          id: word.id,
          text: word.text_uthmani || word.text,
          tajweedHtml: isEnd ? "" : alignedTajweed[contentIndex] ?? (word.text_uthmani || word.text),
          verseKey: verse.verse_key,
          isEnd,
        };
        if (!isEnd) contentIndex += 1;
        const line = lineMap.get(word.line_number) ?? [];
        line.push(mapped);
        lineMap.set(word.line_number, line);
      }

      if (verse.verse_number === 1) {
        const firstLine = verse.words[0]?.line_number ?? 1;
        const hasBismillah = chapterId !== 1 && chapterId !== 9;
        chapterStarts.push({
          chapterId,
          headerLine: Math.max(1, firstLine - (hasBismillah ? 2 : 1)),
          bismillahLine: hasBismillah ? Math.max(1, firstLine - 1) : null,
        });
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
    const result: QuranPage = {
      page,
      juz: firstVerse.juz_number,
      hizb: firstVerse.hizb_number,
      lines,
      verses,
      chapters,
      chapterStarts,
    };

    return NextResponse.json(result, { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } });
  } catch {
    return NextResponse.json({ error: "Verified Quran page data is temporarily unavailable." }, { status: 502 });
  }
}
