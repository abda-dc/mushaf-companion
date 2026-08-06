import { NextResponse } from "next/server";
import { CONTENT_MANIFEST } from "../../content-manifest";

export async function GET() {
  return NextResponse.json(CONTENT_MANIFEST, {
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
  });
}

