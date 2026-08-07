import { findTranslationSource } from "../../../content/source-registry";
import { readResponseBytesWithLimit, sha256Hex } from "../../../content/providers/types";
import { AMHARIC_TRANSLATION_SOURCE_ID } from "../../../translation-packs.mjs";

const SOURCE = findTranslationSource(AMHARIC_TRANSLATION_SOURCE_ID);

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  if (!SOURCE?.provider.packageUrl || !SOURCE.provider.checkForUpdatesUrl) {
    return errorResponse("The verified Amharic source is unavailable.", 503);
  }

  const operation = new URL(request.url).searchParams.get("operation") ?? "package";
  if (operation !== "package" && operation !== "update") {
    return errorResponse("Unsupported translation-pack operation.", 400);
  }

  const upstreamUrl = operation === "update" ? SOURCE.provider.checkForUpdatesUrl : SOURCE.provider.packageUrl;
  try {
    const upstream = await fetch(upstreamUrl, {
      cache: "no-store",
      redirect: "follow",
      headers: { accept: operation === "update" ? "application/json,text/plain;q=0.9" : "application/xml,text/xml;q=0.9" },
    });
    if (!upstream.ok) return errorResponse("The verified Amharic source is temporarily unavailable.", 502);

    const bytes = await readResponseBytesWithLimit(upstream, operation === "update" ? 128 * 1024 : undefined);
    if (operation === "package") {
      const rawChecksum = await sha256Hex(bytes);
      if (rawChecksum !== SOURCE.integrity.rawChecksum) {
        return errorResponse("The Amharic source failed its pinned raw checksum.", 502);
      }
      return new Response(bytes, {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/xml; charset=utf-8",
          "X-Translation-Source": SOURCE.sourceId,
          "X-Translation-Raw-SHA256": rawChecksum,
        },
      });
    }

    return new Response(bytes, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": upstream.headers.get("content-type") ?? "text/plain; charset=utf-8",
        "X-Translation-Source": SOURCE.sourceId,
      },
    });
  } catch {
    return errorResponse("The verified Amharic source is temporarily unavailable.", 502);
  }
}
