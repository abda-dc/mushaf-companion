import { NextResponse } from "next/server";

const API_ROOT = "https://api.quran.com/api/v4";

export async function GET(request: Request) {
  const verse = new URL(request.url).searchParams.get("verse")?.trim() ?? "";
  if (!/^\d{1,3}:\d{1,3}$/.test(verse)) return NextResponse.json({ error: "Invalid ayah key." }, { status: 400 });
  try {
    const response = await fetch(`${API_ROOT}/verses/by_key/${verse}?fields=page_number`);
    if (!response.ok) throw new Error("Lookup failed");
    const payload = (await response.json()) as { verse?: { page_number?: number; verse_key?: string } };
    if (!payload.verse?.page_number) throw new Error("No page mapping");
    return NextResponse.json({ page: payload.verse.page_number, verseKey: payload.verse.verse_key ?? verse }, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch {
    return NextResponse.json({ error: "Ayah page mapping is temporarily unavailable." }, { status: 502 });
  }
}
