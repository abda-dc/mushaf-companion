import { NextResponse } from "next/server";
import type { QuranChapterInfo } from "../../quran-data";

const API_ROOT = "https://api.quran.com/api/v4";

interface ApiChapter {
  id: number;
  name_simple: string;
  name_complex: string;
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

export async function GET() {
  try {
    const [chapterResponse, juzResponse] = await Promise.all([
      fetch(`${API_ROOT}/chapters?language=en`),
      fetch(`${API_ROOT}/juzs`),
    ]);
    if (!chapterResponse.ok || !juzResponse.ok) throw new Error("Chapter index source unavailable");

    const chapterPayload = (await chapterResponse.json()) as { chapters?: ApiChapter[] };
    const juzPayload = (await juzResponse.json()) as { juzs?: ApiJuz[] };
    if (!chapterPayload.chapters?.length || !juzPayload.juzs?.length) throw new Error("Chapter index incomplete");

    const chapters: QuranChapterInfo[] = chapterPayload.chapters.map((chapter) => ({
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

    return NextResponse.json({ chapters }, { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } });
  } catch {
    return NextResponse.json({ error: "The verified chapter index is temporarily unavailable." }, { status: 502 });
  }
}
