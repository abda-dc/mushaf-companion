import { NextResponse } from "next/server";
import { AUDIO_MANIFEST_REVISION, createAudioPackManifest } from "../../audio-manifest.mjs";

const API_ROOT = "https://api.quran.com/api/v4";

interface VersePayload {
  verses?: Array<{ verse_key?: string }>;
  pagination?: { current_page?: number; next_page?: number | null; total_pages?: number };
}

async function fetchVerseKeys(type: "surah" | "juz", id: number) {
  const verseKeys: string[] = [];
  let page = 1;
  while (page <= 20) {
    const endpoint = type === "surah" ? `verses/by_chapter/${id}` : `verses/by_juz/${id}`;
    const response = await fetch(`${API_ROOT}/${endpoint}?words=false&per_page=50&page=${page}`, { next: { revalidate: 604800 } });
    if (!response.ok) throw new Error("Verified verse list is unavailable.");
    const payload = await response.json() as VersePayload;
    const batch = (payload.verses ?? []).map((verse) => verse.verse_key ?? "").filter((key) => /^\d{1,3}:\d{1,3}$/.test(key));
    if (!batch.length) break;
    verseKeys.push(...batch);
    const nextPage = payload.pagination?.next_page;
    if (!nextPage || nextPage <= page) break;
    page = nextPage;
  }
  return [...new Set(verseKeys)];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const id = Number(url.searchParams.get("id"));
  const reciterId = url.searchParams.get("reciter") ?? "alafasy";
  if ((type !== "surah" && type !== "juz") || !Number.isInteger(id) || reciterId !== "alafasy") {
    return NextResponse.json({ error: "Choose a supported surah or juz pack and reciter." }, { status: 400 });
  }
  if ((type === "surah" && (id < 1 || id > 114)) || (type === "juz" && (id < 1 || id > 30))) {
    return NextResponse.json({ error: "Pack number is outside the supported range." }, { status: 400 });
  }
  try {
    const verseKeys = await fetchVerseKeys(type, id);
    const manifest = createAudioPackManifest({ type, id, reciterId, verseKeys });
    return NextResponse.json(manifest, { headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
      "X-Audio-Manifest-Revision": AUDIO_MANIFEST_REVISION,
    } });
  } catch {
    return NextResponse.json({ error: "The verified audio pack manifest is temporarily unavailable." }, { status: 502 });
  }
}
