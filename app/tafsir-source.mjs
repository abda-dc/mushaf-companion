export const TAFSIR_RESOURCE = Object.freeze({
  id: 169,
  name: "Ibn Kathir (Abridged)",
  author: "Hafiz Ibn Kathir",
  language: "en",
  edition: "Quran.com resource 169",
  revision: "2026-08-06-resource-169-v1",
  source: "Quran Foundation Content API",
  sourceUrl: "https://api.quran.com/api/v4/resources/tafsirs",
  attribution: "Ibn Kathir (Abridged), supplied through Quran Foundation/Quran.com resource 169.",
  license: "Upstream content terms apply; this application does not relicense the tafsir.",
});

const VERSE_KEY = /^[1-9]\d{0,2}:[1-9]\d{0,2}$/;
const UNSAFE_BLOCKS = /<(script|style|iframe|object|embed|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const CONTENT_BLOCKS = /<(h[1-6]|p|blockquote|li)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi;

function decodeHtmlEntities(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };
  return String(value).replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi, (match, entity) => {
    if (entity[0] === "#") {
      const hexadecimal = entity[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      if (Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 0x10ffff) return String.fromCodePoint(codePoint);
      return "";
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

function textFromHtml(value) {
  return decodeHtmlEntities(String(value)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .replace(/[\t\f\v ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

export function normalizeTafsirBlocks(html) {
  const safeInput = String(html ?? "").replace(UNSAFE_BLOCKS, " ").replace(/<!--[\s\S]*?-->/g, " ");
  const blocks = [];
  let match;
  CONTENT_BLOCKS.lastIndex = 0;
  while ((match = CONTENT_BLOCKS.exec(safeInput)) && blocks.length < 500) {
    const text = textFromHtml(match[2]).slice(0, 30_000);
    if (!text) continue;
    const tag = match[1].toLowerCase();
    const type = tag.startsWith("h") ? "heading" : tag === "blockquote" ? "quote" : tag === "li" ? "list-item" : "paragraph";
    blocks.push({ type, text });
  }
  if (!blocks.length) {
    const text = textFromHtml(safeInput).slice(0, 100_000);
    if (text) blocks.push({ type: "paragraph", text });
  }
  return blocks;
}

function compareVerseKeys(left, right) {
  const [leftChapter, leftVerse] = left.split(":").map(Number);
  const [rightChapter, rightVerse] = right.split(":").map(Number);
  return leftChapter - rightChapter || leftVerse - rightVerse;
}

export function normalizeTafsirPayload(payload, requestedVerseKey) {
  if (!VERSE_KEY.test(String(requestedVerseKey))) throw new Error("Tafsir requires a valid verse key.");
  const tafsir = payload?.tafsir;
  if (!tafsir || tafsir.resource_id !== TAFSIR_RESOURCE.id || typeof tafsir.text !== "string") {
    throw new Error("The tafsir source did not return the selected edition.");
  }
  const blocks = normalizeTafsirBlocks(tafsir.text);
  if (!blocks.length) throw new Error("The tafsir passage is empty.");
  const mappedVerseKeys = Object.keys(tafsir.verses ?? {}).filter((key) => VERSE_KEY.test(key)).sort(compareVerseKeys);
  if (!mappedVerseKeys.length) mappedVerseKeys.push(requestedVerseKey);
  if (!mappedVerseKeys.includes(requestedVerseKey)) throw new Error("The tafsir passage does not map to the requested verse.");
  return {
    schemaVersion: 1,
    requestedVerseKey,
    mappedVerseKeys,
    sectionLabel: mappedVerseKeys.length === 1 ? `Ayah ${mappedVerseKeys[0]}` : `Ayat ${mappedVerseKeys[0]}–${mappedVerseKeys.at(-1)}`,
    resource: TAFSIR_RESOURCE,
    blocks,
  };
}
