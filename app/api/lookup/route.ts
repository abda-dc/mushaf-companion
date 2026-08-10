import { NextResponse } from "next/server";
import { lookupVerseFromSource } from "../../content/quran-runtime-source";

export async function GET(request: Request) {
  const verse = new URL(request.url).searchParams.get("verse")?.trim() ?? "";
  if (!/^\d{1,3}:\d{1,3}$/.test(verse)) return NextResponse.json({ error: "Invalid ayah key." }, { status: 400 });
  try {
    return NextResponse.json(await lookupVerseFromSource(verse), { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch {
    return NextResponse.json({ error: "Ayah page mapping is temporarily unavailable." }, { status: 502 });
  }
}
