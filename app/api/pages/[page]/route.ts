import { NextResponse } from "next/server";
import { CONTENT_MANIFEST } from "../../../content-manifest";
import {
  DEFAULT_READING_ID,
  isSupportedReadingId,
} from "../../../reading-registry.mjs";
import { fetchQuranPageForReadingFromSource } from "../../../content/quran-runtime-source";
import { resolveQuranPageEdition } from "../../../content/quran-page-editions";

export async function GET(request: Request, context: { params: Promise<{ page: string }> }) {
  const { page: rawPage } = await context.params;
  const page = Number(rawPage);
  const requestedReadingId = new URL(request.url).searchParams.get("reading");
  const readingId = requestedReadingId ?? DEFAULT_READING_ID;
  if (!isSupportedReadingId(readingId)) {
    return NextResponse.json({ error: "Unsupported Quran reading." }, { status: 400 });
  }

  const edition = resolveQuranPageEdition(readingId);
  if (!Number.isInteger(page) || page < 1 || page > edition.pages) {
    return NextResponse.json(
      { error: `Page must be between 1 and ${edition.pages}.` },
      { status: 400 },
    );
  }

  try {
    const result = await fetchQuranPageForReadingFromSource(readingId, page);
    return NextResponse.json(result, { headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
      "ETag": `"${result.provenance.pageChecksum}"`,
      "X-Quran-Content-Revision": CONTENT_MANIFEST.revision,
      "X-Quran-Reading": readingId,
    } });
  } catch {
    return NextResponse.json({ error: "Verified Quran page data is temporarily unavailable." }, { status: 502 });
  }
}
