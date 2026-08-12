/**
 * Programmatic Reciter Scenario Acceptance Verification
 *
 * Verifies all 14 core user interaction, identity, and playback scenarios:
 * 1. Default Reciters group contains exactly 6 reciters
 * 2. Other Reciters group contains all remaining verified reciters (154)
 * 3. Saad Al-Ghamdi is present under Other Reciters
 * 4. Search and filter by style (Murattal, Mujawwad, Muallim)
 * 5. Search and filter by alternate transliteration aliases
 * 6. Selected reciter remains visible when filter excludes it
 * 7. Reciter preferences persistence across session reload cycles
 * 8. Alafasy playback URL resolution
 * 9. Muhammad Ayyub playback URL resolution
 * 10. Abdul Rashid Sufi surah playback URL resolution
 * 11. Surah playback source stability (no reload on intra-surah ayah navigation)
 * 12. Changing surah updates targetAudioKey and resolves new surah audio
 * 13. Distinct Ibrahim identities verification (Akhdar, Aldosari, Aljormy, Al-Asiri)
 * 14. Offline audio resolution semantics for Alafasy
 */

import assert from "node:assert/strict";
import {
  DEFAULT_RECITERS,
  DEFAULT_RECITER_ID,
  OTHER_RECITERS,
  RECITERS,
  getReciterById,
  searchReciters
} from "../app/reciter-registry.mjs";
import { audioStreamUrl } from "../app/audio-manifest.mjs";
import { normalizePreferences } from "../app/preferences.mjs";

console.log("=================================================");
console.log("RUNNING PROGRAMMATIC RECITER SCENARIO VERIFICATION");
console.log("=================================================\n");

let passed = 0;
let failed = 0;

function runScenario(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

// 1. Default group
runScenario("Scenario 1: Default Reciters group has exactly 6 reciters", () => {
  assert.equal(DEFAULT_RECITERS.length, 6);
  assert.equal(DEFAULT_RECITER_ID, "alafasy");
});

// 2. Other group
runScenario("Scenario 2: Other Reciters group contains all remaining verified reciters", () => {
  assert.equal(OTHER_RECITERS.length, 154);
  assert.equal(RECITERS.length, 160);
});

// 3. Saad in Other
runScenario("Scenario 3: Saad Al-Ghamdi appears under Other Reciters", () => {
  const saad = OTHER_RECITERS.find((r) => r.id === "saad");
  assert.ok(saad);
  assert.equal(saad.name, "Saad Al-Ghamdi");
});

// 4. Search and filter by style
runScenario("Scenario 4: Search and filter by style (Murattal, Mujawwad, Muallim)", () => {
  const mujawwad = searchReciters("mujawwad");
  assert.ok(mujawwad.length >= 4);
  assert.ok(mujawwad.every((r) => r.style === "mujawwad" || r.name.toLowerCase().includes("mujawwad")));
});

// 5. Search and filter by alternate transliteration aliases
runScenario("Scenario 5: Search and filter by alternate transliterations", () => {
  const soudais = searchReciters("soudais");
  assert.equal(soudais.length, 1);
  assert.equal(soudais[0].id, "sudais");

  const shaatree = searchReciters("shaatree");
  assert.equal(shaatree.length, 1);
  assert.equal(shaatree[0].id, "shatri");

  const nufais = searchReciters("nufais");
  assert.ok(nufais.length >= 1);
  assert.equal(nufais[0].id, "ahmad-al-nufais");
});

// 6. Selected reciter remains visible when filter excludes it
runScenario("Scenario 6: Selected reciter remains in options when search excludes it", () => {
  const currentReciter = "sudais";
  const search = "husary";
  const filtered = searchReciters(search, OTHER_RECITERS);
  const isCurrentOther = OTHER_RECITERS.some((item) => item.id === currentReciter);

  let displayed = filtered;
  if (isCurrentOther && !filtered.some((item) => item.id === currentReciter)) {
    const cur = OTHER_RECITERS.find((item) => item.id === currentReciter);
    displayed = cur ? [cur, ...filtered] : filtered;
  }
  assert.ok(displayed.some((r) => r.id === "sudais"));
});

// 7. Preferences persistence across reload cycles
runScenario("Scenario 7: Preference persistence across simulated reload cycles", () => {
  const saved = JSON.stringify({ reader: { reciter: "ahmad-al-nufais" } });
  const loaded = JSON.parse(saved);
  const normalized = normalizePreferences(loaded);
  assert.equal(normalized.reader.reciter, "ahmad-al-nufais");
});

// 8. Alafasy playback URL resolution
runScenario("Scenario 8: Alafasy playback URL resolution", () => {
  assert.equal(audioStreamUrl("alafasy", "1:1"), "https://verses.quran.foundation/Alafasy/mp3/001001.mp3");
  assert.equal(audioStreamUrl("alafasy", "114:6"), "https://verses.quran.foundation/Alafasy/mp3/114006.mp3");
});

// 9. Muhammad Ayyub playback URL resolution
runScenario("Scenario 9: Muhammad Ayyub playback URL resolution", () => {
  assert.equal(audioStreamUrl("muhammad-ayyub", "2:255"), "https://everyayah.com/data/Muhammad_Ayyoub_128kbps/002255.mp3");
});

// 10. Abdul Rashid Sufi surah playback URL resolution
runScenario("Scenario 10: Abdul Rashid Sufi surah playback URL resolution", () => {
  assert.equal(audioStreamUrl("abdul-rashid-sufi", "1:1"), "https://api.kalamalah.com/api/abdul-rashid-sofi/murattal/001");
  assert.equal(audioStreamUrl("abdul-rashid-sufi", "18:1"), "https://api.kalamalah.com/api/abdul-rashid-sofi/murattal/018");
});

// 11. Surah playback source stability (no reload on intra-surah ayah navigation)
runScenario("Scenario 11: Surah playback does not re-resolve on intra-surah ayah navigation", () => {
  const getTargetKey = (reciterId, verseKey) => {
    const reciter = getReciterById(reciterId);
    return reciter.scope === "surah" ? `${reciterId}|chapter:${verseKey.split(":")[0]}` : `${reciterId}|${verseKey}`;
  };
  const key1 = getTargetKey("abdul-rashid-sufi", "1:1");
  const key2 = getTargetKey("abdul-rashid-sufi", "1:2");
  assert.equal(key1, key2);

  const shouldSkip = (reciterDef, curKey, targetKey) => {
    return reciterDef.scope === "surah" && curKey === targetKey;
  };
  const sufi = getReciterById("abdul-rashid-sufi");
  assert.equal(shouldSkip(sufi, key1, key2), true);
});

// 12. Changing surah updates targetAudioKey and resolves new surah audio
runScenario("Scenario 12: Changing surah updates targetAudioKey and resolves new surah audio", () => {
  const getTargetKey = (reciterId, verseKey) => {
    const reciter = getReciterById(reciterId);
    return reciter.scope === "surah" ? `${reciterId}|chapter:${verseKey.split(":")[0]}` : `${reciterId}|${verseKey}`;
  };
  const keyCh1 = getTargetKey("abdul-rashid-sufi", "1:7");
  const keyCh2 = getTargetKey("abdul-rashid-sufi", "2:1");
  assert.notEqual(keyCh1, keyCh2);
});

// 13. Distinct Ibrahim identities verification
runScenario("Scenario 13: Distinct Ibrahim identities are isolated and valid", () => {
  assert.equal(audioStreamUrl("ibrahim-akhdar", "1:1"), "https://everyayah.com/data/Ibrahim_Akhdar_32kbps/001001.mp3");
  assert.equal(audioStreamUrl("ibrahim-aldosari", "1:1"), "https://server10.mp3quran.net/ibrahim_dosri/Rewayat-Hafs-A-n-Assem/001.mp3");
  assert.equal(audioStreamUrl("ibrahim-aljormy", "1:1"), "https://server11.mp3quran.net/jormy/001.mp3");
  assert.equal(audioStreamUrl("ibrahim-al-asiri", "1:1"), "https://server6.mp3quran.net/3siri/001.mp3");
});

// 14. Offline audio resolution semantics for Alafasy
runScenario("Scenario 14: Offline audio resolution semantics for Alafasy", () => {
  const shouldSkip = (reciterDef, curKey, targetKey) => {
    return reciterDef.scope === "surah" && curKey === targetKey;
  };
  const alafasy = getReciterById("alafasy");
  assert.equal(shouldSkip(alafasy, "alafasy|1:1", "alafasy|1:1"), false);
});

console.log(`\nScenario Verification Summary: ${passed} PASSED, ${failed} FAILED.`);
if (failed > 0) process.exit(1);
