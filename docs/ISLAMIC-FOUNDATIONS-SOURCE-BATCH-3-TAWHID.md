# Islamic Foundations Source Batch 3: Tawhid — The Oneness of Allah

## Overview

**Source Batch 3** transitions the **Tawhid** collection (`tawhid`) from planned to fully reference-ready, populating all four of its constituent topics with vetted Qur'anic coordinates, canonical Hadith references (ingested via M9H-2B), and verified scholarly locator metadata.

---

## Production Scope & Status

- **Collection**: `tawhid` (Tawhid — The Oneness of Allah)
- **Topics Populated in Batch 3**: All 4 topics upgraded from `planned` to `reference-ready`:
  1. Worship of Allah Alone (`tawhid-worship-of-allah-alone`) — 4 references
  2. Allah's Lordship (`tawhid-allahs-lordship`) — 3 references
  3. Names and Attributes (`tawhid-names-and-attributes`) — 5 references
  4. Shirk (`tawhid-shirk`) — 4 references
- **Tawhid Collection Status**: **Fully Ready** (4 of 4 topics source-ready, 16 total references)
- **Production Reference Totals**:
  - Production Revision: **`m9r-v3`**
  - Schema Version: **`2`**
  - Collections: **10**
  - Topics: **49** (16 `reference-ready`, 33 `planned`)
  - Total References: **73** (38 Qur'an, 18 Hadith, 17 Scholarly)
  - Qur'an Whitelist Keys: **52** (40 baseline + 12 new)
  - M9H Seeded Records: **13** (11 baseline + 2 new)
  - Unique Internal Hadith Targets: **13**

---

## Authoritative Upstream Workbook & Ingestion Provenance

- **Workbook Source File**: `C:\Users\Kiya\Downloads\HadeethEnc.com_en-v1.25.0.xlsx`
- **Workbook SHA-256 Checksum**: `339d148eb7425b7f2d48dd7521a969e4aa4a35b5d35a7c4a1c1b67043b5ee218`
- **Dataset Provider**: HadeethEnc.com (v1.25.0, English translation baseline)
- **Ingestion Script**: `scripts/import-hadeethenc-m9h.mjs`
- **Generated Dataset**: `content/hadith/hadeethenc-en-v1.25.0.mjs` (13 records)

---

## Newly Ingested Hadith Records (M9H-2B)

### 1. Sahih al-Bukhari 2856 (HadeethEnc 65007)
- **Canonical Identity**: `collectionId: bukhari`, `canonicalNumber: "2856"`, `canonicalLabel: "Sahih al-Bukhari 2856"`
- **Provider Record ID**: `65007` (distinct from canonical number `2856`)
- **Narrator**: Mu'adh ibn Jabal
- **Title**: *Allah's right upon His servants*
- **Official Classification**: Authentic / Agreed upon / Sahih al-Bukhari 2856
- **Grading**: Grade: `"Authentic"`, Grader: `"HadeethEnc Editorial Board"`, Reference: `https://hadeethenc.com/en/browse/hadith/65007`
- **Activation State**: `translation-approved` (English translation only)
- **Arabic Text**: `null` (strictly not activated; requires separate review and rights verification)
- **Commentary / Benefits**: Strictly excluded
- **Exact UTF-8 SHA-256**: `bac4903c9922728d6b4c2e7662e52f061212a6d9d913ca90415421af73c4148f`
- **Character Count**: 751
- **Plain Source URL**: `https://hadeethenc.com/en/browse/hadith/65007`
- **Rights Policy**: `approved-redistribution`
- **Attribution**: `HadeethEnc.com`

### 2. Sahih al-Bukhari 2736 (HadeethEnc 64673)
- **Canonical Identity**: `collectionId: bukhari`, `canonicalNumber: "2736"`, `canonicalLabel: "Sahih al-Bukhari 2736"`
- **Provider Record ID**: `64673` (distinct from canonical number `2736`)
- **Narrator**: Abu Hurayrah
- **Title**: *Ninety-nine Names of Allah*
- **Official Classification**: Authentic hadith / Narrated by Bukhari & Muslim / Sahih al-Bukhari 2736
- **Grading**: Grade: `"Authentic hadith"`, Grader: `"HadeethEnc Editorial Board"`, Reference: `https://hadeethenc.com/en/browse/hadith/64673`
- **Activation State**: `translation-approved` (English translation only)
- **Arabic Text**: `null` (strictly not activated)
- **Commentary / Benefits**: Strictly excluded
- **Exact UTF-8 SHA-256**: `8fddebc2783d825b8d6434e52c187f2564df65c99c41538e5b51ee49b22cbddf`
- **Character Count**: 243
- **Plain Source URL**: `https://hadeethenc.com/en/browse/hadith/64673`
- **Rights Policy**: `approved-redistribution`
- **Attribution**: `HadeethEnc.com`

---

## Qur'an Whitelist Expansion

The controlled whitelist in `app/islamic-reference-library.ts` (`APPROVED_QURAN_VERSE_KEYS`) was expanded by exactly **12 canonical keys** (40 $\rightarrow$ 52):
- `"4:48"` (An-Nisa 48 — Shirk unforgiven without repentance)
- `"7:54"` (Al-A'raf 54 — Lordship & Creation)
- `"7:180"` (Al-A'raf 180 — The Most Beautiful Names)
- `"16:36"` (An-Nahl 36 — Purpose of Messengers: Worship Allah alone)
- `"31:13"` (Luqman 13 — Shirk is a tremendous injustice)
- `"39:62"` (Az-Zumar 62 — Allah is Creator and Disposer of all things)
- `"42:11"` (Ash-Shura 11 — There is nothing like unto Him)
- `"51:56"` (Adh-Dhariyat 56 — Purpose of creation of Jinn & Mankind)
- `"112:1"`, `"112:2"`, `"112:3"`, `"112:4"` (Surah al-Ikhlas complete — Pure Monotheism)

---

## Detailed Batch 3 Tawhid Reference Matrix

### 1. Topic: Worship of Allah Alone (`tawhid-worship-of-allah-alone`)
- **Status**: `reference-ready`
- **Qur'an Reference 1**:
  - ID: `quran:tawhid-worship:51-56`
  - Verse Keys: `["51:56"]` | Locator: `"51:56"`
  - Action: `internal-quran-navigation`
- **Qur'an Reference 2**:
  - ID: `quran:tawhid-worship:16-36`
  - Verse Keys: `["16:36"]` | Locator: `"16:36"`
  - Action: `internal-quran-navigation`
- **Hadith Reference**:
  - ID: `hadith:tawhid-worship:hadeethenc-65007`
  - Canonical Target: `hadith:bukhari:2856` (Sahih al-Bukhari 2856)
  - Narrator: Mu'adh ibn Jabal | Locator: `"2856"`
  - Source Record ID: `"65007"` | Plain URL: `https://hadeethenc.com/en/browse/hadith/65007`
  - Action: `internal-hadith-navigation` | Policy: `metadata-only`
- **Scholarly Reference**:
  - ID: `scholarly:tawhid-worship:uthaymin-creed`
  - Work: *A Glimpse into the Islamic Creed* (Muhammad ibn Salih al-Uthaymin)
  - Locator: `"Belief in Allah Almighty — His divinity"` *(verified descriptive sub-locator within "Belief in Allah Almighty")*
  - Source URL: `https://risala.prh.gov.sa/en/content/81`
  - Action: `external-link` | Policy: `metadata-only`

### 2. Topic: Allah's Lordship (`tawhid-allahs-lordship`)
- **Status**: `reference-ready`
- **Qur'an Reference 1**:
  - ID: `quran:tawhid-lordship:7-54`
  - Verse Keys: `["7:54"]` | Locator: `"7:54"`
  - Action: `internal-quran-navigation`
- **Qur'an Reference 2**:
  - ID: `quran:tawhid-lordship:39-62`
  - Verse Keys: `["39:62"]` | Locator: `"39:62"`
  - Action: `internal-quran-navigation`
- **Scholarly Reference**:
  - ID: `scholarly:tawhid-lordship:uthaymin-creed`
  - Work: *A Glimpse into the Islamic Creed* (Muhammad ibn Salih al-Uthaymin)
  - Locator: `"Belief in Allah Almighty — His lordship"` *(verified descriptive sub-locator)*
  - Source URL: `https://risala.prh.gov.sa/en/content/81`
  - Action: `external-link` | Policy: `metadata-only`

### 3. Topic: Names and Attributes (`tawhid-names-and-attributes`)
- **Status**: `reference-ready`
- **Qur'an Reference 1**:
  - ID: `quran:tawhid-names:42-11`
  - Verse Keys: `["42:11"]` | Locator: `"42:11"`
  - Action: `internal-quran-navigation`
- **Qur'an Reference 2**:
  - ID: `quran:tawhid-names:7-180`
  - Verse Keys: `["7:180"]` | Locator: `"7:180"`
  - Action: `internal-quran-navigation`
- **Qur'an Reference 3 (Grouped Surah 112)**:
  - ID: `quran:tawhid-names:112`
  - Verse Keys: `["112:1", "112:2", "112:3", "112:4"]` | Locator: `"Surah 112"`
  - Action: `internal-quran-navigation`
- **Hadith Reference**:
  - ID: `hadith:tawhid-names:hadeethenc-64673`
  - Canonical Target: `hadith:bukhari:2736` (Sahih al-Bukhari 2736)
  - Narrator: Abu Hurayrah | Locator: `"2736"`
  - Source Record ID: `"64673"` | Plain URL: `https://hadeethenc.com/en/browse/hadith/64673`
  - Action: `internal-hadith-navigation` | Policy: `metadata-only`
- **Scholarly Reference**:
  - ID: `scholarly:tawhid-names:uthaymin-creed`
  - Work: *A Glimpse into the Islamic Creed* (Muhammad ibn Salih al-Uthaymin)
  - Locator: `"Belief in Allah Almighty — His names and attributes"` *(verified descriptive sub-locator)*
  - Source URL: `https://risala.prh.gov.sa/en/content/81`
  - Action: `external-link` | Policy: `metadata-only`

### 4. Topic: Shirk (`tawhid-shirk`)
- **Status**: `reference-ready`
- **Qur'an Reference 1**:
  - ID: `quran:tawhid-shirk:4-48`
  - Verse Keys: `["4:48"]` | Locator: `"4:48"`
  - Action: `internal-quran-navigation`
- **Qur'an Reference 2**:
  - ID: `quran:tawhid-shirk:31-13`
  - Verse Keys: `["31:13"]` | Locator: `"31:13"`
  - Action: `internal-quran-navigation`
- **Hadith Reference (Multi-Citation Reuse of Record 65007)**:
  - ID: `hadith:tawhid-shirk:hadeethenc-65007`
  - Canonical Target: `hadith:bukhari:2856` (Sahih al-Bukhari 2856)
  - Narrator: Mu'adh ibn Jabal | Locator: `"2856"`
  - Source Record ID: `"65007"` | Plain URL: `https://hadeethenc.com/en/browse/hadith/65007`
  - Action: `internal-hadith-navigation` | Policy: `metadata-only`
- **Scholarly Reference**:
  - ID: `scholarly:tawhid-shirk:uthaymin-creed`
  - Work: *A Glimpse into the Islamic Creed* (Muhammad ibn Salih al-Uthaymin)
  - Locator: `"Belief in Allah Almighty — His divinity"` *(verified descriptive sub-locator)*
  - Source URL: `https://risala.prh.gov.sa/en/content/81`
  - Action: `external-link` | Policy: `metadata-only`

---

## Scholarly Locator Terminology

In the first-party source `https://risala.prh.gov.sa/en/content/81` (*A Glimpse into the Islamic Creed*), the actual literal chapter heading is **`Belief in Allah Almighty`** (Arabic: `الإيمان بالله تعالى`).

The body text systematically expounds the four elements of belief in Allah:
1. His existence
2. His lordship
3. His divinity / worship & refutation of polytheism
4. His names and attributes

The locator strings `"Belief in Allah Almighty — His lordship"`, `"Belief in Allah Almighty — His divinity"`, and `"Belief in Allah Almighty — His names and attributes"` are **verified descriptive sub-locators** pointing within the literal `"Belief in Allah Almighty"` chapter. They follow the exact pattern used in production for `"Pillars of Islam — testimony of faith"`, `"Pillars of Islam — establishment of prayer"`, etc.

---

## Before / After Production Counts

| Metric | Before Batch 3 | After Batch 3 | Delta |
| :--- | :--- | :--- | :--- |
| **Collections** | 10 | 10 | 0 |
| **Topics Total** | 49 | 49 | 0 |
| **Reference-Ready Topics** | 12 | 16 | +4 |
| **Planned Topics** | 37 | 33 | -4 |
| **Total References** | 57 | 73 | +16 |
| **Qur'an References** | 29 | 38 | +9 |
| **Hadith References** | 15 | 18 | +3 |
| **Scholarly References** | 13 | 17 | +4 |
| **Qur'an Whitelist Keys** | 40 | 52 | +12 |
| **Approved M9H Records** | 11 | 13 | +2 |
| **Unique Internal Hadith Targets** | 11 | 13 | +2 |
| **Sahih al-Bukhari Local Count** | 4 | 6 | +2 |
| **Sahih Muslim Local Count** | 7 | 7 | 0 |
| **Other Collections Local Count** | 0 | 0 | 0 |

---

## Strict Domain Boundaries

1. **Architectural Isolation**:
   - Core M9H and M9R modules remain isolated from `EducationProgress`, `EducationCatalog`, Today Study, `AyahContextLens`, Evidence, M10, M11, and PWA implementation layers. The Learn panel is an aggregation UI surface and may consume existing read-only M9H/M9R APIs without creating reverse dependencies from the core Hadith or reference-library modules.
   - Core M9H modules (`hadith-registry.mjs`, `hadith-content.mjs`, `hadith-resolver.mjs`) have zero imports or knowledge of M9R.
   - The M9RH bridge (`islamic-reference-hadith-bridge.mjs`) remains text-free and delegates Hadith resolution to the M9H resolver.
   - No course or progress tracking semantics are added to the reference library.
2. **Zero Content Bundling in M9R**:
   - No Qur'an text bodies or translations are bundled in M9R.
   - No Hadith texts or commentary bodies are copied into M9R.
   - No scholarly book chapters or prose bodies are ingested.
3. **No Activation of Arabic Hadith Text**:
   - Arabic Hadith text remains `null` pending separate source/rights approval.
