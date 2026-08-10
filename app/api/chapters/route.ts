import { NextResponse } from "next/server";
import { fetchChaptersFromSource } from "../../content/quran-runtime-source";

export async function GET() {
  try {
    return NextResponse.json({ chapters: await fetchChaptersFromSource() }, { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } });
  } catch {
    return NextResponse.json({ error: "The verified chapter index is temporarily unavailable." }, { status: 502 });
  }
}
