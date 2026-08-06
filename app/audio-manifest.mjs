export const AUDIO_MANIFEST_REVISION = "2026-08-06-alafasy-v1";
export const AUDIO_AVERAGE_BYTES_PER_VERSE = 180_000;

export const DOWNLOADABLE_RECITERS = Object.freeze([
  {
    id: "alafasy",
    name: "Mishary Rashid Alafasy",
    scope: "ayah",
    source: "Quran Foundation recitation files",
    sourceUrl: "https://verses.quran.foundation/Alafasy/mp3/",
    license: "Upstream audio terms apply; recordings are not relicensed by this application.",
  },
]);

const VERSE_KEY = /^\d{1,3}:\d{1,3}$/;

export function audioStreamUrl(reciter, verseKey) {
  const [chapter, ayah] = String(verseKey).split(":");
  const file = `${chapter.padStart(3, "0")}${ayah.padStart(3, "0")}.mp3`;
  if (reciter === "abdul-rashid-sufi") return `https://api.kalamalah.com/api/abdul-rashid-sofi/murattal/${chapter.padStart(3, "0")}`;
  if (reciter === "aymen") return `https://everyayah.com/data/Ayman_Sowaid_64kbps/${file}`;
  if (reciter === "minshawi-kids") return `https://everyayah.com/data/Minshawy_Teacher_128kbps/${file}`;
  if (reciter === "saad") return `https://everyayah.com/data/Ghamadi_40kbps/${file}`;
  const folder = reciter === "alafasy" ? "Alafasy" : "AbdulBaset/Murattal";
  return `https://verses.quran.foundation/${folder}/mp3/${file}`;
}

export function audioFileKey(reciterId, verseKey) {
  return `${reciterId}|${verseKey}`;
}

export function audioPackKey(type, id, reciterId = "alafasy") {
  return `${reciterId}|${type}|${id}`;
}

export function estimateAudioBytes(verseCount) {
  return Math.max(0, Number(verseCount) || 0) * AUDIO_AVERAGE_BYTES_PER_VERSE;
}

export function createAudioPackManifest({ type, id, label, reciterId = "alafasy", verseKeys }) {
  if (!new Set(["surah", "juz"]).has(type)) throw new Error("Audio packs must be a surah or juz.");
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || (type === "surah" && (numericId < 1 || numericId > 114)) || (type === "juz" && (numericId < 1 || numericId > 30))) {
    throw new Error("Audio pack number is outside the supported range.");
  }
  const reciter = DOWNLOADABLE_RECITERS.find((item) => item.id === reciterId);
  if (!reciter) throw new Error("This reciter is not available for offline download yet.");
  const uniqueVerseKeys = [...new Set(Array.isArray(verseKeys) ? verseKeys.filter((key) => VERSE_KEY.test(key)) : [])];
  if (!uniqueVerseKeys.length) throw new Error("The audio pack contains no verified verse keys.");
  return {
    schemaVersion: 1,
    revision: AUDIO_MANIFEST_REVISION,
    reciter,
    pack: {
      id: audioPackKey(type, numericId, reciterId),
      type,
      number: numericId,
      label: label || `${type === "surah" ? "Surah" : "Juz"} ${numericId}`,
      verseCount: uniqueVerseKeys.length,
      estimatedBytes: estimateAudioBytes(uniqueVerseKeys.length),
    },
    files: uniqueVerseKeys.map((verseKey) => ({
      key: audioFileKey(reciterId, verseKey),
      verseKey,
      reciterId,
      url: audioStreamUrl(reciterId, verseKey),
      urlRevision: AUDIO_MANIFEST_REVISION,
    })),
  };
}
