import { NextResponse } from "next/server";
import type { SearchResult } from "../../quran-data";

const API_ROOT = "https://api.quran.com/api/v4";

function plainText(value: string) {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function searchKey(value: string) {
  return value.normalize("NFD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]/gu, "");
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query) return NextResponse.json({ results: [] });

  const pageMatch = query.match(/^(?:page\s*)?(\d{1,3})$/i);
  const pageResult: SearchResult[] = pageMatch && Number(pageMatch[1]) >= 1 && Number(pageMatch[1]) <= 604
    ? [{ id: `page-${pageMatch[1]}`, type: "page", label: `Page ${pageMatch[1]}`, detail: "Go directly to this Madani mushaf page", page: Number(pageMatch[1]) }]
    : [];
  const ayahMatch = query.match(/^(\d{1,3}):(\d{1,3})$/);
  const ayahResult: SearchResult[] = ayahMatch
    ? [{ id: `direct-${query}`, type: "verse", label: `Ayah ${query}`, detail: "Open this ayah in its Madani mushaf page", verseKey: query }]
    : [];

  try {
    const [searchResponse, chapterResponse] = await Promise.all([
      fetch(`${API_ROOT}/search?${new URLSearchParams({ q: query, size: "10", page: "0", language: "en" })}`),
      fetch(`${API_ROOT}/chapters?language=en`),
    ]);
    if (!searchResponse.ok || !chapterResponse.ok) throw new Error("Search source unavailable");
    const searchPayload = (await searchResponse.json()) as { search?: { results?: Array<{ verse_key: string; text: string; translations?: Array<{ text: string }> }> } };
    const chapterPayload = (await chapterResponse.json()) as { chapters?: Array<{ id: number; name_simple: string; name_complex: string; name_arabic: string; pages: [number, number]; translated_name: { name: string } }> };
    const normalized = searchKey(query);
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
    return NextResponse.json({ results: [...pageResult, ...ayahResult, ...chapterResults, ...verseResults].slice(0, 12) }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch {
    const fallbackResults = [...pageResult, ...ayahResult];
    return NextResponse.json({ results: fallbackResults, error: "Search is temporarily limited to page and ayah numbers." }, { status: fallbackResults.length ? 200 : 502 });
  }
}
