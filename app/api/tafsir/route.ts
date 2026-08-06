import { NextResponse } from "next/server";
import { normalizeTafsirPayload, TAFSIR_RESOURCE } from "../../tafsir-source.mjs";

const API_ROOT = "https://api.quran.com/api/v4";
const VERSE_KEY = /^[1-9]\d{0,2}:[1-9]\d{0,2}$/;

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function GET(request: Request) {
  const verseKey = new URL(request.url).searchParams.get("verse") ?? "";
  if (!VERSE_KEY.test(verseKey)) {
    return NextResponse.json({ error: "Provide a valid verse key such as 2:255." }, { status: 400 });
  }
  try {
    const response = await fetch(`${API_ROOT}/tafsirs/${TAFSIR_RESOURCE.id}/by_ayah/${encodeURIComponent(verseKey)}`, { next: { revalidate: 604800 } });
    if (!response.ok) {
      return NextResponse.json({ error: response.status === 404 ? "Tafsir is not mapped to this ayah." : "The tafsir source is temporarily unavailable." }, { status: response.status === 404 ? 404 : 502 });
    }
    const document = normalizeTafsirPayload(await response.json(), verseKey);
    const contentChecksum = await sha256Hex(JSON.stringify({
      requestedVerseKey: document.requestedVerseKey,
      mappedVerseKeys: document.mappedVerseKeys,
      resourceId: document.resource.id,
      sourceRevision: document.resource.revision,
      blocks: document.blocks,
    }));
    return NextResponse.json({
      ...document,
      provenance: {
        verified: true,
        checksumAlgorithm: "SHA-256",
        contentChecksum,
        sourceRevision: TAFSIR_RESOURCE.revision,
      },
    }, { headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
      "ETag": `"${contentChecksum}"`,
      "X-Tafsir-Resource": String(TAFSIR_RESOURCE.id),
      "X-Tafsir-Revision": TAFSIR_RESOURCE.revision,
    } });
  } catch {
    return NextResponse.json({ error: "Verified tafsir is temporarily unavailable." }, { status: 502 });
  }
}
