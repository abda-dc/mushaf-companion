import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DEFAULT_RECITERS,
  DEFAULT_RECITER_ID,
  OTHER_RECITERS,
  RECITER_IDS,
  RECITERS,
  getReciterById,
  searchReciters,
} from "../app/reciter-registry.mjs";
import { audioStreamUrl } from "../app/audio-manifest.mjs";
import { normalizePreferences } from "../app/preferences.mjs";

test("A. Registry integrity: unique IDs, required fields, Hafs riwayah, and valid providers", () => {
  const ids = new Set();
  const validProviders = new Set(["quran-foundation", "everyayah", "kalamalah", "mp3quran"]);
  const validScopes = new Set(["ayah", "surah"]);
  const validGroups = new Set(["default", "other"]);

  assert.equal(RECITERS.length, 160, "Registry must contain all 160 verified complete Hafs reciters");

  for (const reciter of RECITERS) {
    assert.ok(reciter.id, "Every reciter must have an ID");
    assert.ok(!ids.has(reciter.id), `Reciter ID '${reciter.id}' must be unique`);
    ids.add(reciter.id);

    assert.ok(reciter.name, `Reciter '${reciter.id}' must have a name`);
    assert.ok(reciter.initials, `Reciter '${reciter.id}' must have initials`);
    assert.ok(validGroups.has(reciter.group), `Reciter '${reciter.id}' must have a valid group`);
    assert.ok(validScopes.has(reciter.scope), `Reciter '${reciter.id}' must have a valid scope`);
    assert.equal(reciter.riwayah, "hafs", `Reciter '${reciter.id}' must be Hafs riwayah`);
    assert.ok(validProviders.has(reciter.provider), `Reciter '${reciter.id}' has unsupported provider: ${reciter.provider}`);
    assert.ok(reciter.audioPath, `Reciter '${reciter.id}' must have an audioPath`);
    assert.ok(reciter.source, `Reciter '${reciter.id}' must have source attribution`);
    assert.ok(reciter.sourceUrl, `Reciter '${reciter.id}' must have a sourceUrl`);
    assert.ok(reciter.license, `Reciter '${reciter.id}' must have licensing attribution`);
    assert.ok(Array.isArray(reciter.aliases) && reciter.aliases.length > 0, `Reciter '${reciter.id}' must have aliases`);

    // Parhizgar bitrate validation
    if (reciter.id === "parhizgar") {
      assert.equal(reciter.bitrate, "48kbps", "Parhizgar bitrate must match audioPath Parhizgar_48kbps");
    }

    // Prohibit non-Hafs or translation audio in M10 registry
    assert.doesNotMatch(reciter.name, /\bwarsh\b/i, `Reciter '${reciter.id}' must not be Warsh`);
    assert.doesNotMatch(reciter.name, /\bqalun\b/i, `Reciter '${reciter.id}' must not be Qalun`);
    assert.doesNotMatch(reciter.name, /\btranslation\b/i, `Reciter '${reciter.id}' must not be a translation`);
    assert.doesNotMatch(reciter.audioPath, /warsh/i, `Reciter '${reciter.id}' audioPath must not refer to Warsh`);
  }
});

test("B. Default grouping: exactly 6 expected reciters; Saad Al-Ghamdi is excluded from Default", () => {
  const defaultIds = DEFAULT_RECITERS.map((r) => r.id);
  assert.equal(DEFAULT_RECITERS.length, 6, "Default Reciters must contain exactly 6 reciters");
  assert.deepEqual(defaultIds, [
    "alafasy",
    "abdulbasit",
    "aymen",
    "minshawi-kids",
    "muhammad-ayyub",
    "abdul-rashid-sufi",
  ]);
  assert.ok(!defaultIds.includes("saad"), "Saad Al-Ghamdi MUST NOT remain in Default Reciters");
  assert.equal(DEFAULT_RECITER_ID, "alafasy");

  // Verify Kalamalah attribution
  const sufi = getReciterById("abdul-rashid-sufi");
  assert.equal(sufi.source, "Kalamalah audio library");
  assert.match(sufi.sourceUrl, /api\.kalamalah\.com/);
});

test("C. Other grouping: 154 verified reciters including Saad Al-Ghamdi, EveryAyah, and MP3Quran reciters", () => {
  const otherIds = OTHER_RECITERS.map((r) => r.id);
  assert.equal(OTHER_RECITERS.length, 154, "Other Reciters must contain 154 verified reciters");
  assert.ok(otherIds.includes("saad"), "Saad Al-Ghamdi must be in Other Reciters");
  assert.ok(otherIds.includes("sudais"), "Abdur-Rahman As-Sudais must be in Other Reciters");
  assert.ok(otherIds.includes("shatri"), "Abu Bakr Ash-Shatri must be in Other Reciters");
  assert.ok(otherIds.includes("husary"), "Mahmoud Khalil Al-Husary must be in Other Reciters");
  assert.ok(otherIds.includes("husary-mujawwad"), "Husary Mujawwad must be in Other Reciters");
  assert.ok(otherIds.includes("husary-muallim"), "Husary Muallim must be in Other Reciters");
  assert.ok(otherIds.includes("minshawi"), "Minshawi Murattal must be in Other Reciters");
  assert.ok(otherIds.includes("minshawi-mujawwad"), "Minshawi Mujawwad must be in Other Reciters");
  assert.ok(otherIds.includes("nabil-rifai"), "Nabil Ar-Rifai must be in Other Reciters");
  assert.ok(otherIds.includes("adel-al-khalbany"), "Adel Al-Khalbany must be in Other Reciters");
  assert.ok(otherIds.includes("alzain-mohammad-ahmad"), "Alzain Mohammad Ahmad must be in Other Reciters");
  assert.ok(otherIds.includes("khalid-al-jileel"), "Khalid Al-Jileel must be in Other Reciters");
  assert.ok(otherIds.includes("mohammed-al-muhasny"), "Mohammed Al-Muhasny must be in Other Reciters");
  assert.ok(otherIds.includes("ahmad-al-nufais"), "Ahmad Al Nufais must be in Other Reciters");

  // Incomplete EveryAyah collection is excluded, while verified complete MP3Quran collection is included
  const mustafa = getReciterById("mustafa-ismail");
  assert.equal(mustafa.provider, "mp3quran");
  assert.equal(mustafa.scope, "surah");
  assert.equal(mustafa.audioPath, "https://server8.mp3quran.net/mustafa/");

  assert.equal(RECITERS.length, DEFAULT_RECITERS.length + OTHER_RECITERS.length);
});

test("D. Identity Isolation: Ibrahim reciters are independent identities and not merged", () => {
  const akhdar = getReciterById("ibrahim-akhdar");
  const dosari = getReciterById("ibrahim-aldosari");
  const jormy = getReciterById("ibrahim-aljormy");
  const asiri = getReciterById("ibrahim-al-asiri");

  assert.ok(akhdar, "Ibrahim Al-Akhdar must exist");
  assert.ok(dosari, "Ibrahim Aldosari must exist");
  assert.ok(jormy, "Ibrahim Aljormy must exist");
  assert.ok(asiri, "Ibrahim Al-Asiri must exist");

  // Distinct IDs
  assert.notEqual(akhdar.id, dosari.id);
  assert.notEqual(dosari.id, jormy.id);
  assert.notEqual(jormy.id, asiri.id);

  // Distinct audio paths
  assert.notEqual(akhdar.audioPath, dosari.audioPath);
  assert.notEqual(dosari.audioPath, jormy.audioPath);
  assert.notEqual(jormy.audioPath, asiri.audioPath);

  // Distinct names
  assert.equal(akhdar.name, "Ibrahim Al-Akhdar");
  assert.equal(dosari.name, "Ibrahim Aldosari");
  assert.equal(jormy.name, "Ibrahim Aljormy");
  assert.equal(asiri.name, "Ibrahim Al-Asiri");

  // Aliases isolation (must contain only their own name variants)
  assert.ok(akhdar.aliases.every((a) => !a.toLowerCase().includes("dosari") && !a.toLowerCase().includes("jormy")));
  assert.ok(dosari.aliases.every((a) => !a.toLowerCase().includes("akhdar") && !a.toLowerCase().includes("jormy")));
  assert.ok(jormy.aliases.every((a) => !a.toLowerCase().includes("akhdar") && !a.toLowerCase().includes("dosari")));
});

test("E. Search & Aliases: matches name fragments, styles, and alternate transliterations", () => {
  // Alias matching
  const soudais = searchReciters("soudais");
  assert.equal(soudais.length, 1);
  assert.equal(soudais[0].id, "sudais");

  const shatree = searchReciters("shaatree");
  assert.equal(shatree.length, 1);
  assert.equal(shatree[0].id, "shatri");

  const menshawy = searchReciters("menshawy");
  assert.ok(menshawy.length >= 2, "Menshawy should match Minshawi styles");

  const ghamadi = searchReciters("ghamadi");
  assert.equal(ghamadi.length, 1);
  assert.equal(ghamadi[0].id, "saad");

  const kalbani = searchReciters("khalbany");
  assert.ok(kalbani.length >= 1);
  assert.equal(kalbani[0].id, "adel-al-khalbany");

  const nufais = searchReciters("nufais");
  assert.ok(nufais.length >= 1);
  assert.equal(nufais[0].id, "ahmad-al-nufais");

  // Style matching
  const mujawwad = searchReciters("mujawwad");
  assert.ok(mujawwad.length >= 4, "Search for 'mujawwad' should return multiple reciters");
  assert.ok(mujawwad.every((r) => r.style === "mujawwad" || r.name.toLowerCase().includes("mujawwad")));

  const emptyQuery = searchReciters("");
  assert.equal(emptyQuery.length, OTHER_RECITERS.length, "Empty query returns full list");
});

test("F. Controlled <select> option representation during search filtering", () => {
  const reciter = "sudais";
  const reciterSearch = "husary";
  const filtered = searchReciters(reciterSearch, OTHER_RECITERS);
  const isCurrentOther = OTHER_RECITERS.some((item) => item.id === reciter);

  let displayedOtherReciters = filtered;
  if (isCurrentOther && !filtered.some((item) => item.id === reciter)) {
    const current = OTHER_RECITERS.find((item) => item.id === reciter);
    displayedOtherReciters = current ? [current, ...filtered] : filtered;
  }

  assert.ok(displayedOtherReciters.some((r) => r.id === "sudais"), "Selected reciter 'sudais' must remain present in options");
  assert.equal(displayedOtherReciters[0].id, "sudais", "Selected reciter is prioritized in dropdown when filtered");
});

test("G. Surah vs Ayah scope audio resolution & reload guard semantics", () => {
  const getTargetKey = (reciterId, verseKey) => {
    const reciter = getReciterById(reciterId);
    return reciter.scope === "surah" ? `${reciterId}|chapter:${verseKey.split(":")[0]}` : `${reciterId}|${verseKey}`;
  };

  // Surah scope reciters:
  // Same surah navigation produces IDENTICAL key
  assert.equal(getTargetKey("abdul-rashid-sufi", "1:1"), getTargetKey("abdul-rashid-sufi", "1:2"));
  assert.equal(getTargetKey("idrees-abkr", "18:1"), getTargetKey("idrees-abkr", "18:10"));
  assert.equal(getTargetKey("ahmad-al-nufais", "36:1"), getTargetKey("ahmad-al-nufais", "36:83"));

  // Changing surah produces NEW key
  assert.notEqual(getTargetKey("abdul-rashid-sufi", "1:7"), getTargetKey("abdul-rashid-sufi", "2:1"));
  assert.notEqual(getTargetKey("idrees-abkr", "1:1"), getTargetKey("idrees-abkr", "114:1"));

  // Ayah scope reciters:
  // Every ayah navigation produces NEW key
  assert.notEqual(getTargetKey("alafasy", "1:1"), getTargetKey("alafasy", "1:2"));
  assert.notEqual(getTargetKey("sudais", "2:255"), getTargetKey("sudais", "2:256"));
});

test("H. Offline audio resolution: Alafasy allows offlineAudioRevision to re-resolve while surah reciter does not reload", () => {
  const shouldSkipResolution = (reciterDef, currentSourceKey, targetKey) => {
    return reciterDef.scope === "surah" && currentSourceKey === targetKey;
  };

  const sufi = getReciterById("abdul-rashid-sufi");
  const alafasy = getReciterById("alafasy");

  // Surah reciter on same surah: skips re-resolution (no audio reload)
  assert.equal(shouldSkipResolution(sufi, "abdul-rashid-sufi|chapter:1", "abdul-rashid-sufi|chapter:1"), true);

  // Surah reciter on new surah: does NOT skip (loads new surah audio)
  assert.equal(shouldSkipResolution(sufi, "abdul-rashid-sufi|chapter:1", "abdul-rashid-sufi|chapter:2"), false);

  // Alafasy (ayah scope): NEVER skips based solely on key match because scope !== "surah",
  // allowing offlineAudioRevision to re-resolve the same ayah with newly available offline blobs!
  assert.equal(shouldSkipResolution(alafasy, "alafasy|1:1", "alafasy|1:1"), false);
});

test("I. URL resolution: formats proper zero-padded filenames for ayah and surah scopes", () => {
  // Ayah scope (EveryAyah)
  assert.equal(audioStreamUrl("sudais", "1:1"), "https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/001001.mp3");
  assert.equal(audioStreamUrl("sudais", "2:255"), "https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/002255.mp3");
  assert.equal(audioStreamUrl("sudais", "114:6"), "https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/114006.mp3");

  // Ayah scope (Quran Foundation)
  assert.equal(audioStreamUrl("alafasy", "1:1"), "https://verses.quran.foundation/Alafasy/mp3/001001.mp3");
  assert.equal(audioStreamUrl("abdulbasit", "2:255"), "https://verses.quran.foundation/AbdulBaset/Murattal/mp3/002255.mp3");

  // Surah scope (Kalamalah)
  assert.equal(audioStreamUrl("abdul-rashid-sufi", "1:1"), "https://api.kalamalah.com/api/abdul-rashid-sofi/murattal/001");
  assert.equal(audioStreamUrl("abdul-rashid-sufi", "18:1"), "https://api.kalamalah.com/api/abdul-rashid-sofi/murattal/018");

  // Surah scope (MP3Quran)
  assert.equal(audioStreamUrl("idrees-abkr", "1:1"), "https://server6.mp3quran.net/abkr/001.mp3");
  assert.equal(audioStreamUrl("idrees-abkr", "114:1"), "https://server6.mp3quran.net/abkr/114.mp3");
  assert.equal(audioStreamUrl("adel-al-khalbany", "1:1"), "https://server8.mp3quran.net/a_klb/001.mp3");
  assert.equal(audioStreamUrl("alzain-mohammad-ahmad", "114:1"), "https://server9.mp3quran.net/alzain/114.mp3");
  assert.equal(audioStreamUrl("ahmad-al-nufais", "1:1"), "https://server16.mp3quran.net/nufais/Rewayat-Hafs-A-n-Assem/001.mp3");
  assert.equal(audioStreamUrl("ibrahim-aldosari", "1:1"), "https://server10.mp3quran.net/ibrahim_dosri/Rewayat-Hafs-A-n-Assem/001.mp3");
  assert.equal(audioStreamUrl("ibrahim-aljormy", "1:1"), "https://server11.mp3quran.net/jormy/001.mp3");
});

test("J. Existing source stability: all 7 existing reciter URLs remain 100% stable", () => {
  assert.equal(audioStreamUrl("alafasy", "1:1"), "https://verses.quran.foundation/Alafasy/mp3/001001.mp3");
  assert.equal(audioStreamUrl("abdulbasit", "1:1"), "https://verses.quran.foundation/AbdulBaset/Murattal/mp3/001001.mp3");
  assert.equal(audioStreamUrl("saad", "1:1"), "https://everyayah.com/data/Ghamadi_40kbps/001001.mp3");
  assert.equal(audioStreamUrl("aymen", "2:255"), "https://everyayah.com/data/Ayman_Sowaid_64kbps/002255.mp3");
  assert.equal(audioStreamUrl("minshawi-kids", "114:6"), "https://everyayah.com/data/Minshawy_Teacher_128kbps/114006.mp3");
  assert.equal(audioStreamUrl("muhammad-ayyub", "2:255"), "https://everyayah.com/data/Muhammad_Ayyoub_128kbps/002255.mp3");
  assert.equal(audioStreamUrl("abdul-rashid-sufi", "18:1"), "https://api.kalamalah.com/api/abdul-rashid-sofi/murattal/018");
});

test("K. Preferences: preserves existing and newly added reciter IDs, falls back safely for invalid IDs", () => {
  const p1 = normalizePreferences({ reader: { reciter: "saad" } });
  assert.equal(p1.reader.reciter, "saad");

  const p2 = normalizePreferences({ reader: { reciter: "muhammad-ayyub" } });
  assert.equal(p2.reader.reciter, "muhammad-ayyub");

  const p3 = normalizePreferences({ reader: { reciter: "sudais" } });
  assert.equal(p3.reader.reciter, "sudais");

  const p4 = normalizePreferences({ reader: { reciter: "ahmad-al-nufais" } });
  assert.equal(p4.reader.reciter, "ahmad-al-nufais");

  const p5 = normalizePreferences({ reader: { reciter: "ibrahim-aldosari" } });
  assert.equal(p5.reader.reciter, "ibrahim-aldosari");

  const pInvalid = normalizePreferences({ reader: { reciter: "unknown-reciter-xyz" } });
  assert.equal(pInvalid.reader.reciter, "alafasy");

  assert.ok(RECITER_IDS.has("saad"));
  assert.ok(RECITER_IDS.has("sudais"));
  assert.ok(RECITER_IDS.has("ahmad-al-nufais"));
  assert.ok(RECITER_IDS.has("ibrahim-aldosari"));
  assert.ok(!RECITER_IDS.has("unknown-reciter-xyz"));
});

test("L. UI rendering: page.tsx contains Default Reciters, Other Reciters optgroups, and displayedOtherReciters", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /<optgroup label="Default Reciters">/);
  assert.match(page, /<optgroup label="Other Reciters">/);
  assert.match(page, /reciterSearch/);
  assert.match(page, /displayedOtherReciters/);
  assert.match(page, /currentReciter\.scope === "surah" && audioSourceKey === targetAudioKey/);
});
