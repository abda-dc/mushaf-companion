import { NextResponse } from "next/server";
import { CONTENT_MANIFEST } from "../../../content-manifest";
import { fetchQuranPageFromSource } from "../../../content/quran-runtime-source";

export async function GET(_request: Request, context: { params: Promise<{ page: string }> }) {
  const { page: rawPage } = await context.params;
  const page = Number(rawPage);
  if (!Number.isInteger(page) || page < 1 || page > 604) {
    return NextResponse.json({ error: "Page must be between 1 and 604." }, { status: 400 });
  }
  try {
    const result = await fetchQuranPageFromSource(page);
    return NextResponse.json(result, { headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
      "ETag": `"${result.provenance.pageChecksum}"`,
      "X-Quran-Content-Revision": CONTENT_MANIFEST.revision,
    } });
  } catch {
    return NextResponse.json({ error: "Verified Quran page data is temporarily unavailable." }, { status: 502 });
  }
}
