import { NextResponse } from "next/server";
import { searchQuranSource } from "../../content/quran-runtime-source";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const result = await searchQuranSource(query);
  return NextResponse.json(result, { status: result.error && !result.results.length ? 502 : 200, headers: { "Cache-Control": "public, max-age=300" } });
}
