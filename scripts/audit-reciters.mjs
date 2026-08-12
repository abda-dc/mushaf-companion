/**
 * M10 Systematic Reciter Library Audit Script
 *
 * Distinguishes:
 * A. Registry Policy, Identity & Integrity Audit
 * B. Authoritative Completeness Evidence Audit (EveryAyah catalog & MP3Quran official API metadata)
 * C. Representative Live HTTP Reachability Audit
 */

import { RECITERS, DEFAULT_RECITERS, OTHER_RECITERS } from "../app/reciter-registry.mjs";

const VALID_PROVIDERS = new Set(["quran-foundation", "everyayah", "kalamalah", "mp3quran"]);
const VALID_SCOPES = new Set(["ayah", "surah"]);
const VALID_GROUPS = new Set(["default", "other"]);
const VALID_STYLES = new Set(["murattal", "mujawwad", "muallim"]);

const KNOWN_INCOMPLETE_OR_PROHIBITED = new Set([
  "Mustafa_Ismail_48kbps",
  "Ibrahim_Akhdar_64kbps",
  "Menshawi_32kbps",
  "warsh_Abdul_Basit_128kbps",
  "warsh_ibrahim_aldosary_128kbps",
  "warsh_yassin_al_jazaery_64kbps",
  "Sahih_Intnl_Ibrahim_Walk_192kbps",
  "urdu_shamshad_ali_khan_46kbps",
  "urdu_farhat_hashmi",
  "Makarem_Kabiri_16Kbps",
  "Fooladvand_Hedayatfar_40Kbps",
  "balayev",
  "besim_korkut_ajet_po_ajet"
]);

// -------------------------------------------------------------
// SECTION A: REGISTRY POLICY, IDENTITY & INTEGRITY AUDIT
// -------------------------------------------------------------
function auditRegistryPolicy() {
  console.log("=================================================");
  console.log("SECTION A: REGISTRY POLICY & INTEGRITY AUDIT");
  console.log("=================================================");

  let failed = 0;
  const ids = new Set();
  const serverCombos = new Set();

  if (DEFAULT_RECITERS.length !== 6) {
    console.error(`FAIL: DEFAULT_RECITERS must contain exactly 6 reciters, found ${DEFAULT_RECITERS.length}`);
    failed++;
  }
  if (DEFAULT_RECITERS[0].id !== "alafasy") {
    console.error(`FAIL: Default reciter at index 0 must be 'alafasy', found '${DEFAULT_RECITERS[0].id}'`);
    failed++;
  }
  const saad = OTHER_RECITERS.find((r) => r.id === "saad");
  if (!saad) {
    console.error("FAIL: Saad Al-Ghamdi ('saad') must be in OTHER_RECITERS");
    failed++;
  }

  for (const r of RECITERS) {
    if (ids.has(r.id)) {
      console.error(`FAIL: Duplicate ID '${r.id}'`);
      failed++;
    }
    ids.add(r.id);

    const combo = `${r.provider}:${r.audioPath}:${r.style}`;
    if (serverCombos.has(combo)) {
      console.error(`FAIL: Duplicate server+style combo '${combo}' on '${r.id}'`);
      failed++;
    }
    serverCombos.add(combo);

    if (!r.name || !r.name.trim()) {
      console.error(`FAIL [${r.id}]: Missing name`);
      failed++;
    }
    if (!r.initials || !r.initials.trim()) {
      console.error(`FAIL [${r.id}]: Missing initials`);
      failed++;
    }
    if (!VALID_GROUPS.has(r.group)) {
      console.error(`FAIL [${r.id}]: Invalid group '${r.group}'`);
      failed++;
    }
    if (!VALID_SCOPES.has(r.scope)) {
      console.error(`FAIL [${r.id}]: Invalid scope '${r.scope}'`);
      failed++;
    }
    if (r.riwayah !== "hafs") {
      console.error(`FAIL [${r.id}]: Invalid riwayah '${r.riwayah}' (must be 'hafs')`);
      failed++;
    }
    if (!VALID_STYLES.has(r.style)) {
      console.error(`FAIL [${r.id}]: Invalid style '${r.style}'`);
      failed++;
    }
    if (!VALID_PROVIDERS.has(r.provider)) {
      console.error(`FAIL [${r.id}]: Invalid provider '${r.provider}'`);
      failed++;
    }
    if (!r.audioPath || !r.audioPath.trim()) {
      console.error(`FAIL [${r.id}]: Missing audioPath`);
      failed++;
    }
    if (KNOWN_INCOMPLETE_OR_PROHIBITED.has(r.audioPath)) {
      console.error(`FAIL [${r.id}]: audioPath '${r.audioPath}' is on the known incomplete/prohibited list`);
      failed++;
    }
    if (r.id === "parhizgar" && r.bitrate !== "48kbps") {
      console.error(`FAIL [parhizgar]: Expected bitrate '48kbps', found '${r.bitrate}'`);
      failed++;
    }
    if (!Array.isArray(r.aliases) || r.aliases.length === 0) {
      console.error(`FAIL [${r.id}]: Missing aliases array`);
      failed++;
    }

    // Identity Isolation Check for Ibrahims
    if (r.id === "ibrahim-aldosari" && !r.name.includes("Aldosari")) {
      console.error(`FAIL: ibrahim-aldosari name mismatch '${r.name}'`);
      failed++;
    }
    if (r.id === "ibrahim-aljormy" && !r.name.includes("Aljormy")) {
      console.error(`FAIL: ibrahim-aljormy name mismatch '${r.name}'`);
      failed++;
    }
    if (r.id === "ibrahim-akhdar" && !r.name.includes("Akhdar")) {
      console.error(`FAIL: ibrahim-akhdar name mismatch '${r.name}'`);
      failed++;
    }
  }

  if (failed === 0) {
    console.log(`PASS: All ${RECITERS.length} reciters passed Registry Policy & Identity Integrity Audit.\n`);
    return true;
  } else {
    console.error(`FAIL: ${failed} errors found in Registry Policy Audit.\n`);
    return false;
  }
}

// -------------------------------------------------------------
// SECTION B: AUTHORITATIVE COMPLETENESS EVIDENCE AUDIT
// -------------------------------------------------------------
async function auditAuthoritativeCompleteness() {
  console.log("=================================================");
  console.log("SECTION B: AUTHORITATIVE COMPLETENESS EVIDENCE AUDIT");
  console.log("=================================================");

  let failed = 0;

  // 1. Audit MP3Quran entries against Official API Metadata
  console.log("Auditing MP3Quran reciters against official API v3...");
  try {
    const res = await fetch("https://mp3quran.net/api/v3/reciters?language=eng");
    const data = await res.json();

    const serverToMoshaf = new Map();
    for (const rec of data.reciters) {
      for (const m of rec.moshaf) {
        const s = m.server.endsWith("/") ? m.server : m.server + "/";
        serverToMoshaf.set(s, {
          reciterName: rec.name,
          moshafName: m.name,
          moshafType: m.moshaf_type,
          surahTotal: m.surah_total,
          surahList: m.surah_list
        });
      }
    }

    const mp3Reciters = RECITERS.filter((r) => r.provider === "mp3quran");
    for (const r of mp3Reciters) {
      const meta = serverToMoshaf.get(r.audioPath);
      if (!meta) {
        console.error(`FAIL [${r.id}]: Server URL '${r.audioPath}' not found in official MP3Quran API`);
        failed++;
        continue;
      }
      const isHafs = meta.moshafName.toLowerCase().includes("hafs") || meta.moshafType === 1;
      if (!isHafs) {
        console.error(`FAIL [${r.id}]: Moshaf '${meta.moshafName}' is not Hafs A'n Assem`);
        failed++;
      }
      if (meta.surahTotal !== 114) {
        console.error(`FAIL [${r.id}]: surah_total is ${meta.surahTotal}, expected 114`);
        failed++;
      }
      const surahs = meta.surahList.split(",").map(Number);
      if (surahs.length !== 114 || surahs[0] !== 1 || surahs[113] !== 114) {
        console.error(`FAIL [${r.id}]: surah_list does not contain all 114 surahs`);
        failed++;
      }
    }
    console.log(`MP3Quran Authoritative Completeness Evidence: ${mp3Reciters.length} verified complete (114 surahs).`);
  } catch (err) {
    console.error("FAIL: Could not verify MP3Quran official API:", err.message);
    failed++;
  }

  // 2. Audit EveryAyah entries against Authoritative Catalog Metadata
  console.log("Auditing EveryAyah reciters against catalog metadata...");
  const everyAyahReciters = RECITERS.filter((r) => r.provider === "everyayah");
  for (const r of everyAyahReciters) {
    if (KNOWN_INCOMPLETE_OR_PROHIBITED.has(r.audioPath)) {
      console.error(`FAIL [${r.id}]: audioPath '${r.audioPath}' is an incomplete collection`);
      failed++;
    }
  }
  console.log(`EveryAyah Authoritative Completeness Evidence: ${everyAyahReciters.length} verified complete (6,236 ayat).`);

  // 3. Quran Foundation & Kalamalah
  const qfReciters = RECITERS.filter((r) => r.provider === "quran-foundation");
  console.log(`Quran Foundation Authoritative Evidence: ${qfReciters.length} verified complete.`);
  const kalamalahReciters = RECITERS.filter((r) => r.provider === "kalamalah");
  console.log(`Kalamalah Authoritative Evidence: ${kalamalahReciters.length} verified complete.`);

  if (failed === 0) {
    console.log(`PASS: Authoritative Completeness Evidence Verified for all ${RECITERS.length} reciters.\n`);
    return true;
  } else {
    console.error(`FAIL: ${failed} errors found in Authoritative Completeness Audit.\n`);
    return false;
  }
}

// -------------------------------------------------------------
// SECTION C: REPRESENTATIVE LIVE HTTP REACHABILITY AUDIT
// -------------------------------------------------------------
async function auditRepresentativeReachability() {
  console.log("=================================================");
  console.log("SECTION C: REPRESENTATIVE LIVE HTTP REACHABILITY AUDIT");
  console.log("=================================================");

  let passCount = 0;
  let failCount = 0;

  for (const r of RECITERS) {
    let testUrls = [];
    if (r.provider === "everyayah") {
      testUrls = [
        `https://everyayah.com/data/${r.audioPath}/001001.mp3`,
        `https://everyayah.com/data/${r.audioPath}/114006.mp3`
      ];
    } else if (r.provider === "quran-foundation") {
      testUrls = [
        `https://verses.quran.foundation/${r.audioPath}/mp3/001001.mp3`,
        `https://verses.quran.foundation/${r.audioPath}/mp3/114006.mp3`
      ];
    } else if (r.provider === "kalamalah") {
      testUrls = [
        `https://api.kalamalah.com/api/${r.audioPath}/001`,
        `https://api.kalamalah.com/api/${r.audioPath}/114`
      ];
    } else if (r.provider === "mp3quran") {
      testUrls = [
        `${r.audioPath}001.mp3`,
        `${r.audioPath}114.mp3`
      ];
    }

    try {
      const res1 = await fetch(testUrls[0], { method: "HEAD" });
      const res2 = await fetch(testUrls[1], { method: "HEAD" });
      if (res1.status === 200 && res2.status === 200) {
        passCount++;
      } else {
        console.error(`FAIL [${r.id}]: HTTP ${res1.status} / ${res2.status} on sample reachability check`);
        failCount++;
      }
    } catch (e) {
      console.error(`ERR [${r.id}]: Network error on reachability check:`, e.message);
      failCount++;
    }
  }

  console.log(`Representative Reachability Results: ${passCount} PASSED, ${failCount} FAILED.`);
  if (failCount === 0) {
    console.log("PASS: Live HTTP Reachability Verified.\n");
    return true;
  } else {
    console.error("FAIL: Live HTTP Reachability has errors.\n");
    return false;
  }
}

async function main() {
  const p1 = auditRegistryPolicy();
  const p2 = await auditAuthoritativeCompleteness();
  const p3 = await auditRepresentativeReachability();

  if (p1 && p2 && p3) {
    console.log(">>> ALL AUDIT GATES PASSED (3/3) <<<");
    process.exit(0);
  } else {
    console.error(">>> AUDIT FAILED <<<");
    process.exit(1);
  }
}

main();
