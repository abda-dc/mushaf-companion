# M10 — Expanded Verified Reciter Library (Post-Identity Audit Implementation)

## 1. Purpose & Overview
Milestone 10 (M10) transforms Mushaf Companion's recitation layer into an evidence-driven, systematic Hafs recitation library with **160 verified complete recitations**, strictly enforcing person-level identity isolation.

Key architectural highlights:
- **Single Source of Truth**: The canonical registry in `app/reciter-registry.mjs` (and `app/reciter-registry.d.mts`) defines all supported reciters, metadata, aliases, styles, scopes, and providers.
- **Strict Identity Isolation**:
  - Each reciter represents a verified unique individual.
  - Distinct reciters sharing names (e.g. Ibrahim Al-Akhdar, Ibrahim Aldosari, Ibrahim Aljormy, Ibrahim Al-Asiri) maintain completely separate identities, IDs, server paths, and aliases.
  - Aliases contain transliterations and name variants belonging strictly to that same individual.
- **Strict M10 Hafs Scope**: M10 is exclusively dedicated to complete, verified Hafs recitations. Alternate readings (Warsh, Qalun, etc.) and translations/commentaries are excluded.
- **UI Grouping & Controlled Selection**:
  - **Default Reciters** (exactly 6; Alafasy is default).
  - **Other Reciters** (154 verified reciters, including Saad Al-Ghamdi).
  - **Controlled Select Persistence**: The selected reciter remains present in `<select>` option lists even when active search filtering does not match it.
- **Multi-Field Alias / Search**:
  - Searches reciter name, style, ID, and real alternate transliterations (`aliases` array) such as "soudais", "shaatree", "menshawy", "ghamadi", "kalbani", "sowaid", "nufais", etc.
- **Surah-Level Source-Resolution & Offline Audio Fix**:
  - `targetAudioKey` for surah-scope reciters is computed using the chapter identifier (`${reciter}|chapter:${selectedChapterId}`).
  - The source resolution `useEffect` skips re-resolution only when `currentReciter.scope === "surah" && audioSourceKey === targetAudioKey`, preventing intra-surah ayah clicks from calling `audio.load()` or restarting playback.
  - Alafasy (`scope: "ayah"`) is never skipped based on key matching alone, allowing `offlineAudioRevision` changes to switch the current ayah to newly downloaded verified offline blobs.
- **Parhizgar Metadata**:
  - `audioPath: "Parhizgar_48kbps"`, `bitrate: "48kbps"`.
- **Kalamalah Attribution**:
  - Sheikh Abdul Rashid Ali Sufi attribution is verified as `Kalamalah audio library` (`https://api.kalamalah.com/api/...`).
- **Offline Boundary**:
  - Offline pack downloads remain strictly bounded to Mishary Rashid Alafasy.

---

## 2. Reciter Inventory Breakdown

- **Total Reciters**: **160**
- **Default Group**: **6** (Mishary Rashid Alafasy, Abdul Basit Abdus Samad, Dr. Aymen Suwayed, Minshawi Kids Repeat, Sheikh Muhammad Ayyub, Sheikh Abdul Rashid Ali Sufi)
- **Other Group**: **154**
- **Provider Breakdown**:
  - MP3Quran: **114**
  - EveryAyah: **43** (3 Default + 40 Other)
  - Quran Foundation: **2** (2 Default)
  - Kalamalah: **1** (1 Default)
- **Scope Breakdown**:
  - Surah scope (`scope: "surah"`): **115** (114 MP3Quran + 1 Kalamalah)
  - Ayah scope (`scope: "ayah"`): **45** (43 EveryAyah + 2 Quran Foundation)

---

## 3. Identity Audit & Ibrahim Reciters Isolation

MP3Quran and EveryAyah reciters sharing first names are strictly isolated:
- `ibrahim-akhdar`: Sheikh Ibrahim Al-Akhdar (EveryAyah `Ibrahim_Akhdar_32kbps`, ayah scope).
- `ibrahim-aldosari`: Sheikh Dr. Ibrahim Aldosari (MP3Quran `https://server10.mp3quran.net/ibrahim_dosri/Rewayat-Hafs-A-n-Assem/`, surah scope).
- `ibrahim-aljormy`: Sheikh Ibrahim Aljormy (MP3Quran `https://server11.mp3quran.net/jormy/`, surah scope).
- `ibrahim-al-asiri`: Sheikh Ibrahim Al-Asiri (MP3Quran `https://server6.mp3quran.net/3siri/`, surah scope).

---

## 4. Excluded & Prohibited Collections (Completeness Evidence)

1. **Incomplete Collections**:
   - `Mustafa_Ismail_48kbps` (EveryAyah collection: 4,220 files missing; replaced by MP3Quran 114-surah complete collection `mustafa-ismail`).
   - `Ibrahim_Akhdar_64kbps` (EveryAyah: 6,236 files missing; complete 32kbps set is used).
   - `Menshawi_32kbps` (EveryAyah: 303 files missing; complete 128kbps set is used).
   - `Abdullah Al-Kandari`, `Ahmed Amer`, `Mohammed Osman Khan`, `Abdulmohsin Al-Harthy` (MP3Quran API entries returning HTTP 404 on server endpoints).
2. **Warsh / Alternate Riwayahs (Reserved for M11)**:
   - `warsh_Abdul_Basit_128kbps` (47 files missing), `warsh_ibrahim_aldosary_128kbps`, `warsh_yassin_al_jazaery_64kbps`.
3. **Translations & Commentary**:
   - `Sahih_Intnl_Ibrahim_Walk_192kbps` (English), `urdu_shamshad_ali_khan_46kbps`, `urdu_farhat_hashmi`, `Makarem_Kabiri_16Kbps`, `Fooladvand_Hedayatfar_40Kbps`, `balayev`, `besim_korkut_ajet_po_ajet`.

---

## 5. Verification Results

1. **Registry Policy & Identity Audit (`scripts/audit-reciters.mjs` Section A)**: 160/160 passed.
2. **Authoritative Completeness Audit (`scripts/audit-reciters.mjs` Section B)**: 160/160 passed.
3. **Representative Reachability Audit (`scripts/audit-reciters.mjs` Section C)**: 160/160 passed (HTTP 200 on sample endpoints).
4. **Programmatic Reciter Scenario Verifications (`scripts/verify-reciter-scenarios.mjs`)**: 14/14 scenarios passed.
5. **Focused M10 Unit Tests (`tests/reciter-registry.test.mjs`)**: 12/12 test suites passed.
6. **Full Repository Test Suite (`tests/*.test.mjs`)**: 158/158 passed with 0 failures.
7. **Production Build (`node ./node_modules/vinext/dist/cli.js build`)**: 0 errors.
