# Islamic Foundations Source Batch 4: Qur'an and Sunnah — Primary Sources of Guidance

## Overview

**Source Batch 4** transitions the **Qur'an and Sunnah** collection (`quran-and-sunnah`) from planned to fully reference-ready, populating all four of its constituent topics with vetted Qur'anic coordinates, canonical Hadith references (ingested via M9H), and verified scholarly locator metadata from Alharamain's Message.

---

## Production Scope & Status

- **Collection**: `quran-and-sunnah` (Qur'an and Sunnah — Primary Sources of Guidance)
- **Topics Populated in Batch 4**: All 4 topics upgraded from `planned` to `reference-ready`:
  1. Qur'an (`quran-and-sunnah-quran`) — 4 references (2 Qur'an, 1 Hadith, 1 Scholarly)
  2. Sunnah (`quran-and-sunnah-sunnah`) — 4 references (2 Qur'an, 1 Hadith, 1 Scholarly)
  3. Hadith (`quran-and-sunnah-hadith`) — 3 references (1 Qur'an, 1 Hadith, 1 Scholarly)
  4. Relationship Between Qur'an and Sunnah (`quran-and-sunnah-relationship-between-quran-and-sunnah`) — 4 references (2 Qur'an, 1 Hadith, 1 Scholarly)
- **Qur'an and Sunnah Collection Status**: **Fully Ready** (4 of 4 topics source-ready, 15 total references)
- **Production Reference Totals**:
  - Production Revision: **`m9r-v4`**
  - Schema Version: **`2`**
  - Collections: **10**
  - Topics: **49** (20 `reference-ready`, 29 `planned`)
  - Total References: **88** (45 Qur'an, 22 Hadith, 21 Scholarly)
  - Qur'an Whitelist Keys: **59** (52 baseline + 7 new)
  - M9H Seeded Records: **17** (13 baseline + 4 new)
    - Sahih al-Bukhari: **9**
    - Sahih Muslim: **8**
    - Other 4 Collections: **0**
  - Unique Internal Hadith Targets: **17**

---

## Authoritative Upstream Workbook & Ingestion Provenance

- **Workbook Source File**: `C:\Users\Kiya\Downloads\HadeethEnc.com_en-v1.25.0.xlsx`
- **Workbook SHA-256 Checksum**: `339d148eb7425b7f2d48dd7521a969e4aa4a35b5d35a7c4a1c1b67043b5ee218`
- **Dataset Provider**: HadeethEnc.com (v1.25.0, English translation baseline)
- **Ingestion Script**: `scripts/import-hadeethenc-m9h.mjs`
- **Generated Dataset**: `content/hadith/hadeethenc-en-v1.25.0.mjs` (17 records)

---

## Newly Ingested Hadith Records

### 1. Sahih al-Bukhari 5027 (HadeethEnc 5913)
- **Canonical Identity**: `collectionId: bukhari`, `canonicalNumber: "5027"`, `canonicalLabel: "Sahih al-Bukhari 5027"`
- **Provider Record ID**: `5913` (distinct from canonical number `5027`)
- **Narrator**: Uthman ibn Affan
- **Title**: *The best of you are those who learn the Qur’an and teach it*
- **Official Classification**: Authentic / Narrated by Al-Bukhāri / Sahih al-Bukhari 5027
- **Grading**: Grade: `"Authentic"`, Grader: `"HadeethEnc Editorial Board"`, Reference: `https://hadeethenc.com/en/browse/hadith/5913`
- **Activation State**: `translation-approved` (English translation only)
- **Arabic Text**: `null` (strictly not activated)
- **Commentary / Benefits**: Strictly excluded
- **Exact UTF-8 SHA-256**: `698fbdc17c7be97dd7efd21fffae41cac1325c9136356edfb7cfbfd07b0a8cbf`
- **Character Count**: 187
- **Plain Source URL**: `https://hadeethenc.com/en/browse/hadith/5913`
- **Rights Policy**: `approved-redistribution`
- **Attribution**: `HadeethEnc.com`

### 2. Sahih Muslim 1401 (HadeethEnc 6078)
- **Canonical Identity**: `collectionId: muslim`, `canonicalNumber: "1401"`, `canonicalLabel: "Sahih Muslim 1401"`
- **Provider Record ID**: `6078` (distinct from canonical number `1401`)
- **Narrator**: Anas ibn Malik
- **Title**: *What is the matter with those people who said such-and-such? But indeed, I pray and sleep, I fast and break the fast, and I marry women. Whoever turns away from my Sunnah does not belong to me*
- **Official Classification**: Authentic / Agreed upon / Sahīh Muslim - 1401
- **Grading**: Grade: `"Authentic"`, Grader: `"HadeethEnc Editorial Board"`, Reference: `https://hadeethenc.com/en/browse/hadith/6078`
- **Canonicalization Decision**: HadeethEnc explicitly designates `Sahīh Muslim - 1401` as the primary reference edition for record 6078. To preserve 100% provider alignment and provenance integrity, M9H canonicalizes this record as `muslim:1401` rather than the parallel narration in Bukhari 5063.
- **Activation State**: `translation-approved` (English translation only)
- **Arabic Text**: `null` (strictly not activated)
- **Commentary / Benefits**: Strictly excluded
- **Exact UTF-8 SHA-256**: `8cb1ac5ae45ec84fd3771e76595f8418fd1f927d04a19ef2851eb528692ece7d`
- **Character Count**: 562
- **Plain Source URL**: `https://hadeethenc.com/en/browse/hadith/6078`
- **Rights Policy**: `approved-redistribution`
- **Attribution**: `HadeethEnc.com`

### 3. Sahih al-Bukhari 3461 (HadeethEnc 3686)
- **Canonical Identity**: `collectionId: bukhari`, `canonicalNumber: "3461"`, `canonicalLabel: "Sahih al-Bukhari 3461"`
- **Provider Record ID**: `3686` (distinct from canonical number `3461`)
- **Narrator**: Abdullah ibn Amr
- **Title**: *Convey from me even if one verse, and narrate from the Children of Israel, and there is no sin in doing that. And whoever intentionally tells a lie about me, let him occupy his seat in Hellfire*
- **Official Classification**: Authentic / Narrated by Al-Bukhāri / Sahih al-Bukhari 3461
- **Grading**: Grade: `"Authentic"`, Grader: `"HadeethEnc Editorial Board"`, Reference: `https://hadeethenc.com/en/browse/hadith/3686`
- **Activation State**: `translation-approved` (English translation only)
- **Arabic Text**: `null` (strictly not activated)
- **Commentary / Benefits**: Strictly excluded
- **Exact UTF-8 SHA-256**: `17e90e7a8fb962ecb80c1c2a67ceefc72f292db750feee491cbeb7ba8c5ba1de`
- **Character Count**: 321
- **Plain Source URL**: `https://hadeethenc.com/en/browse/hadith/3686`
- **Rights Policy**: `approved-redistribution`
- **Attribution**: `HadeethEnc.com`

### 4. Sahih al-Bukhari 7137 (HadeethEnc 6383)
- **Canonical Identity**: `collectionId: bukhari`, `canonicalNumber: "7137"`, `canonicalLabel: "Sahih al-Bukhari 7137"`
- **Provider Record ID**: `6383` (distinct from canonical number `7137`)
- **Narrator**: Abu Hurayrah
- **Title**: *Whoever obeys me has obeyed Allah, and whoever disobeys me has disobeyed Allah; and whoever obeys the leader has obeyed me, and whoever disobeys the leader has disobeyed me*
- **Official Classification**: Authentic hadith / Narrated by Bukhari & Muslim / Sahih al-Bukhari 7137 (Muslim 1835)
- **Grading**: Grade: `"Authentic hadith"`, Grader: `"HadeethEnc Editorial Board"`, Reference: `https://hadeethenc.com/en/browse/hadith/6383`
- **Activation State**: `translation-approved` (English translation only)
- **Arabic Text**: `null` (strictly not activated)
- **Commentary / Benefits**: Strictly excluded
- **Exact UTF-8 SHA-256**: `77e448a101c38d03c481e9c8c3556e3e972e06a43ccfd3869e9c918a61b6f3db`
- **Character Count**: 298
- **Plain Source URL**: `https://hadeethenc.com/en/browse/hadith/6383`
- **Rights Policy**: `approved-redistribution`
- **Attribution**: `HadeethEnc.com`

---

## Taxonomy Delineation: Sunnah vs. Hadith

A rigorous taxonomic distinction is maintained across topics:
1. **Sunnah (`quran-and-sunnah-sunnah`)**: Represents the **normative guidance, practical authority, and living model** of the Prophet Muhammad (ﷺ).
   - Evidence: Surah al-Ahzab 33:21 (The Messenger as an *Uswah Hasanah* / excellent pattern), Surah al-Hashr 59:7 (obligation to accept what the Messenger gives and abstain from what he forbids), Sahih Muslim 1401 (holding fast to the Prophetic Sunnah and rejecting deviation), and scholarly locator pointing to the mandate of following the prophetic example.
2. **Hadith (`quran-and-sunnah-hadith`)**: Represents the **textual transmission, preservation, conveyance, and verification** of Prophetic reports.
   - Evidence: Surah al-Hujurat 49:6 (epistemic verification of transmitted reports / *Tathabbut*), Sahih al-Bukhari 3461 (command to convey from the Prophet accompanied by the stern prohibition of attributing falsehoods), and scholarly locator pointing to accepting authentic reports.

---

## Qur'an Whitelist Expansion

The controlled whitelist in `app/islamic-reference-library.ts` (`APPROVED_QURAN_VERSE_KEYS`) was expanded by exactly **7 canonical keys** (52 $\rightarrow$ 59):
- `"2:2"` (Al-Baqarah 2 — The Book without doubt, guidance for the righteous)
- `"4:59"` (An-Nisa 59 — Obey Allah, obey the Messenger, and refer disputes back to them)
- `"15:9"` (Al-Hijr 9 — Divine preservation of the Revelation)
- `"16:44"` (An-Nahl 44 — Revelation to the Messenger to clarify what was sent down)
- `"33:21"` (Al-Ahzab 21 — The Messenger as the excellent pattern)
- `"49:6"` (Al-Hujurat 6 — Verification of transmitted reports)
- `"59:7"` (Al-Hashr 7 — Taking what the Messenger gives and abstaining from what he forbids)

---

## Detailed Batch 4 Reference Matrix

### 1. Topic: Qur'an (`quran-and-sunnah-quran`)
- **Status**: `reference-ready`
- **Qur'an Reference 1**:
  - ID: `quran:quran-sunnah-quran:15-9`
  - Verse Keys: `["15:9"]` | Locator: `"15:9"`
  - Action: `internal-quran-navigation`
- **Qur'an Reference 2**:
  - ID: `quran:quran-sunnah-quran:2-2`
  - Verse Keys: `["2:2"]` | Locator: `"2:2"`
  - Action: `internal-quran-navigation`
- **Hadith Reference**:
  - ID: `hadith:quran-sunnah-quran:hadeethenc-5913`
  - Title: `"The best of you are those who learn the Qur’an and teach it"`
  - Canonical Target: `hadith:bukhari:5027` (Sahih al-Bukhari 5027)
  - Narrator: Uthman ibn Affan | Locator: `"5027"`
  - Source Record ID: `"5913"` | Plain URL: `https://hadeethenc.com/en/browse/hadith/5913`
  - Action: `internal-hadith-navigation` | Policy: `metadata-only`
- **Scholarly Reference**:
  - ID: `scholarly:quran-sunnah-quran:uthaymin-creed`
  - Work: *A Glimpse into the Islamic Creed* (Muhammad ibn Salih al-Uthaymin)
  - Locator: `"Belief in the Revealed Books"` *(literal heading)*
  - Source URL: `https://risala.prh.gov.sa/en/content/81`
  - Action: `external-link` | Policy: `metadata-only`

### 2. Topic: Sunnah (`quran-and-sunnah-sunnah`)
- **Status**: `reference-ready`
- **Qur'an Reference 1**:
  - ID: `quran:quran-sunnah-sunnah:33-21`
  - Verse Keys: `["33:21"]` | Locator: `"33:21"`
  - Action: `internal-quran-navigation`
- **Qur'an Reference 2**:
  - ID: `quran:quran-sunnah-sunnah:59-7`
  - Verse Keys: `["59:7"]` | Locator: `"59:7"`
  - Action: `internal-quran-navigation`
- **Hadith Reference**:
  - ID: `hadith:quran-sunnah-sunnah:hadeethenc-6078`
  - Title: `"Adherence to the Prophetic Sunnah"`
  - Canonical Target: `hadith:muslim:1401` (Sahih Muslim 1401)
  - Narrator: Anas ibn Malik | Locator: `"1401"`
  - Source Record ID: `"6078"` | Plain URL: `https://hadeethenc.com/en/browse/hadith/6078`
  - Action: `internal-hadith-navigation` | Policy: `metadata-only`
- **Scholarly Reference**:
  - ID: `scholarly:quran-sunnah-sunnah:uthaymin-creed`
  - Work: *A Glimpse into the Islamic Creed* (Muhammad ibn Salih al-Uthaymin)
  - Locator: `"Objectives of the Islamic Creed — following the messengers' example"` *(descriptive sub-locator under literal heading "Objectives of the Islamic Creed")*
  - Source URL: `https://risala.prh.gov.sa/en/content/81`
  - Action: `external-link` | Policy: `metadata-only`

### 3. Topic: Hadith (`quran-and-sunnah-hadith`)
- **Status**: `reference-ready`
- **Qur'an Reference 1**:
  - ID: `quran:quran-sunnah-hadith:49-6`
  - Verse Keys: `["49:6"]` | Locator: `"49:6"`
  - Action: `internal-quran-navigation`
- **Hadith Reference**:
  - ID: `hadith:quran-sunnah-hadith:hadeethenc-3686`
  - Title: `"Convey from me even if one verse"`
  - Canonical Target: `hadith:bukhari:3461` (Sahih al-Bukhari 3461)
  - Narrator: Abdullah ibn Amr | Locator: `"3461"`
  - Source Record ID: `"3686"` | Plain URL: `https://hadeethenc.com/en/browse/hadith/3686`
  - Action: `internal-hadith-navigation` | Policy: `metadata-only`
- **Scholarly Reference**:
  - ID: `scholarly:quran-sunnah-hadith:uthaymin-creed`
  - Work: *A Glimpse into the Islamic Creed* (Muhammad ibn Salih al-Uthaymin)
  - Locator: `"Belief in the Messengers — authentic reports"` *(descriptive sub-locator under literal heading "Belief in the Messengers")*
  - Source URL: `https://risala.prh.gov.sa/en/content/81`
  - Action: `external-link` | Policy: `metadata-only`

### 4. Topic: Relationship Between Qur'an and Sunnah (`quran-and-sunnah-relationship-between-quran-and-sunnah`)
- **Status**: `reference-ready`
- **Qur'an Reference 1**:
  - ID: `quran:quran-sunnah-relationship:16-44`
  - Verse Keys: `["16:44"]` | Locator: `"16:44"`
  - Action: `internal-quran-navigation`
- **Qur'an Reference 2**:
  - ID: `quran:quran-sunnah-relationship:4-59`
  - Verse Keys: `["4:59"]` | Locator: `"4:59"`
  - Action: `internal-quran-navigation`
- **Hadith Reference**:
  - ID: `hadith:quran-sunnah-relationship:hadeethenc-6383`
  - Title: `"Whoever obeys me has obeyed Allah"`
  - Canonical Target: `hadith:bukhari:7137` (Sahih al-Bukhari 7137)
  - Narrator: Abu Hurayrah | Locator: `"7137"`
  - Source Record ID: `"6383"` | Plain URL: `https://hadeethenc.com/en/browse/hadith/6383`
  - Action: `internal-hadith-navigation` | Policy: `metadata-only`
- **Scholarly Reference**:
  - ID: `scholarly:quran-sunnah-relationship:uthaymin-creed`
  - Work: *A Glimpse into the Islamic Creed* (Muhammad ibn Salih al-Uthaymin)
  - Locator: `"Foundations of the Islamic Creed"` *(literal heading)*
  - Source URL: `https://risala.prh.gov.sa/en/content/81`
  - Action: `external-link` | Policy: `metadata-only`

---

## Architectural Safeguards & Domain Separation

1. **No External Body Duplication**: No translated hadith body, explanation, or commentary is bundled in M9R. M9R references remain strictly metadata-only.
2. **Arabic Text Inactivity**: Arabic text remains strictly `null` across all newly ingested M9H records.
3. **Strict Domain Independence**: Core M9H has zero reverse dependency on M9R, and neither M9R nor M9H depends on `EducationProgress`, `Today Study`, or `Evidence`.
4. **Data-Derived UI**: The Learn panel and Islamic Foundations panel derive all counts dynamically from production data without hardcoded values.
