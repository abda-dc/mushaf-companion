import { NextResponse } from "next/server";
import { createProductionEducationRegistry } from "../../../education-content.ts";
import { lookupVerseFromSource } from "../../../content/quran-runtime-source.ts";

export async function GET() {
  const registry = createProductionEducationRegistry(async (verseKey) => lookupVerseFromSource(verseKey));
  const result = await registry.loadFirstApprovedCatalog();
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
