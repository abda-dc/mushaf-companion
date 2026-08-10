import { NextResponse } from "next/server";
import { fetchTafsirFromSource } from "../../content/quran-runtime-source";
import { TAFSIR_RESOURCE } from "../../tafsir-source.mjs";

export async function GET(request: Request) {
  const verseKey = new URL(request.url).searchParams.get("verse") ?? "";
  if (!/^[1-9]\d{0,2}:[1-9]\d{0,2}$/.test(verseKey)) {
    return NextResponse.json({ error: "Provide a valid verse key such as 2:255." }, { status: 400 });
  }
  try {
    const document = await fetchTafsirFromSource(verseKey);
    return NextResponse.json(document, { headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
      "ETag": `"${document.provenance.contentChecksum}"`,
      "X-Tafsir-Resource": String(TAFSIR_RESOURCE.id),
      "X-Tafsir-Revision": TAFSIR_RESOURCE.revision,
    } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verified tafsir is temporarily unavailable.";
    return NextResponse.json({ error: message }, { status: message.includes("not mapped") ? 404 : 502 });
  }
}
