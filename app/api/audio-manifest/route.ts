import { NextResponse } from "next/server";
import { AUDIO_MANIFEST_REVISION, type AudioPackType } from "../../audio-manifest.mjs";
import { fetchAudioManifestFromSource } from "../../content/quran-runtime-source";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") as AudioPackType;
  const id = Number(url.searchParams.get("id"));
  const reciterId = url.searchParams.get("reciter") ?? "alafasy";
  if ((type !== "surah" && type !== "juz") || !Number.isInteger(id) || reciterId !== "alafasy") {
    return NextResponse.json({ error: "Choose a supported surah or juz pack and reciter." }, { status: 400 });
  }
  if ((type === "surah" && (id < 1 || id > 114)) || (type === "juz" && (id < 1 || id > 30))) {
    return NextResponse.json({ error: "Pack number is outside the supported range." }, { status: 400 });
  }
  try {
    const manifest = await fetchAudioManifestFromSource(type, id, reciterId);
    return NextResponse.json(manifest, { headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
      "X-Audio-Manifest-Revision": AUDIO_MANIFEST_REVISION,
    } });
  } catch {
    return NextResponse.json({ error: "The verified audio pack manifest is temporarily unavailable." }, { status: 502 });
  }
}
