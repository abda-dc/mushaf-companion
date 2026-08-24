# Islamic Foundations Source Batch 5: Akhlaq and Adab — Moral Character & Etiquette

## Overview

**Source Batch 5** transitions the **Akhlaq and Adab** collection (`akhlaq-and-adab`) from planned to fully reference-ready, populating all six of its constituent topics with vetted Qur'anic coordinates, canonical Hadith references (ingested via M9H), and verified scholarly locator metadata from Alharamain's Message (*A Glimpse into the Islamic Creed*).

---

## Production Scope & Status

- **Collection**: `akhlaq-and-adab` (Akhlaq and Adab — Moral Character & Etiquette)
- **Topics Populated in Batch 5**: All 6 topics upgraded from `planned` to `reference-ready`:
  1. Truthfulness (`akhlaq-and-adab-truthfulness`) — 4 references (2 Qur'an, 1 Hadith, 1 Scholarly)
  2. Humility (`akhlaq-and-adab-humility`) — 3 references (2 Qur'an, 1 Hadith, 0 Scholarly)
  3. Parents and Family (`akhlaq-and-adab-parents-and-family`) — 4 references (2 Qur'an, 1 Hadith, 1 Scholarly)
  4. Neighbors (`akhlaq-and-adab-neighbors`) — 3 references (1 Qur'an, 1 Hadith, 1 Scholarly)
  5. Justice (`akhlaq-and-adab-justice`) — 4 references (2 Qur'an, 1 Hadith, 1 Scholarly)
  6. Good Manners (`akhlaq-and-adab-good-manners`) — 3 references (1 Qur'an, 1 Hadith, 1 Scholarly)
- **Akhlaq and Adab Collection Status**: **Fully Ready** (6 of 6 topics source-ready, 21 total references)
- **Production Reference Totals**:
  - Production Revision: **`m9r-v5`**
  - Schema Version: **`2`**
  - Collections: **10**
  - Topics: **49** (26 `reference-ready`, 23 `planned`)
  - Total References: **109** (55 Qur'an, 28 Hadith, 26 Scholarly)
  - Qur'an Whitelist Keys: **68** (59 baseline + 9 new)
  - M9H Seeded Records: **23** (17 baseline + 6 new)
    - Sahih al-Bukhari: **10**
    - Sahih Muslim: **13**
    - Other 4 Collections: **0**
  - Unique Internal Hadith Targets: **23**

---

## Authoritative Upstream Workbook & Ingestion Provenance

- **Workbook Source File**: `C:\Users\Kiya\Downloads\HadeethEnc.com_en-v1.25.0.xlsx`
- **Workbook SHA-256 Checksum**: `339d148eb7425b7f2d48dd7521a969e4aa4a35b5d35a7c4a1c1b67043b5ee218`
- **Dataset Provider**: HadeethEnc.com (v1.25.0, English translation baseline)
- **Ingestion Script**: `scripts/import-hadeethenc-m9h.mjs`
- **Generated Dataset**: `content/hadith/hadeethenc-en-v1.25.0.mjs` (23 records)

---

## Newly Ingested Hadith Records

### 1. Sahih Muslim 2607 (HadeethEnc 5504)
- **Canonical Identity**: `collectionId: muslim`, `canonicalNumber: "2607"`, `canonicalLabel: "Sahih Muslim 2607"`
- **Provider Record ID**: `5504`
- **Narrator**: Abdullah ibn Mas'ud
- **Title**: *Adhere to truthfulness, for truthfulness leads to righteousness, and righteousness leads to Paradise*
- **Official Classification**: Authentic / Agreed upon / Sahīh Muslim - 2607
- **Grading**: Grade: `"Authentic"`, Grader: `"HadeethEnc Editorial Board"`, Reference: `https://hadeethenc.com/en/browse/hadith/5504`
- **Activation State**: `translation-approved` (English translation only)
- **Arabic Text**: `null` (strictly not activated)
- **Commentary / Benefits**: Strictly excluded
- **Exact UTF-8 SHA-256**: `85cb751bb5f69c8495d41b7f7ea1ae1bf654cbfa79f8f239493464de1e3de12c`
- **Character Count**: 546
- **Plain Source URL**: `https://hadeethenc.com/en/browse/hadith/5504`
- **Rights Policy**: `approved-redistribution`
- **Attribution**: `HadeethEnc.com`

### 2. Sahih Muslim 2865 (HadeethEnc 5497)
- **Canonical Identity**: `collectionId: muslim`, `canonicalNumber: "2865"`, `canonicalLabel: "Sahih Muslim 2865"`
- **Provider Record ID**: `5497`
- **Narrator**: Iyad ibn Himar
- **Title**: *And verily, Allah revealed to me that you must be humble, so that no one boasts of oneself before another or oppresses another*
- **Official Classification**: Authentic / Narrated by Muslim / Sahīh Muslim - 2865
- **Grading**: Grade: `"Authentic"`, Grader: `"HadeethEnc Editorial Board"`, Reference: `https://hadeethenc.com/en/browse/hadith/5497`
- **Activation State**: `translation-approved` (English translation only)
- **Arabic Text**: `null` (strictly not activated)
- **Commentary / Benefits**: Strictly excluded
- **Exact UTF-8 SHA-256**: `6ce0cf8d9f73a07015b85b4aea2c3a3d31accb5752e2a3c31734d6103ea09378`
- **Character Count**: 399
- **Plain Source URL**: `https://hadeethenc.com/en/browse/hadith/5497`
- **Rights Policy**: `approved-redistribution`
- **Attribution**: `HadeethEnc.com`

### 3. Sahih Muslim 2548 (HadeethEnc 4182)
- **Canonical Identity**: `collectionId: muslim`, `canonicalNumber: "2548"`, `canonicalLabel: "Sahih Muslim 2548"`
- **Provider Record ID**: `4182`
- **Narrator**: Abu Hurayrah
- **Title**: *O Messenger of Allah, who is the most entitled among people to my good companionship? He said: Your mother, then your mother, then your mother, then your father, and then those who are the closest to you*
- **Official Classification**: Authentic hadith / Narrated by Muslim - Narrated by Bukhari & Muslim
- **Canonicalization Decision**: HadeethEnc record 4182 contains a composite text including the second narration (*"then those who are closest to you"*), which is uniquely preserved in Sahih Muslim 2548b. Canonicalizing as `muslim:2548` rather than `bukhari:5971` preserves the full provider composite.
- **Grading**: Grade: `"Authentic hadith"`, Grader: `"HadeethEnc Editorial Board"`, Reference: `https://hadeethenc.com/en/browse/hadith/4182`
- **Activation State**: `translation-approved` (English translation only)
- **Arabic Text**: `null` (strictly not activated)
- **Commentary / Benefits**: Strictly excluded
- **Exact UTF-8 SHA-256**: `7cf8bc99f3558acc00ed5cb5da10af518884e17c1bcff9a427662c2d91d4fe31`
- **Character Count**: 677
- **Plain Source URL**: `https://hadeethenc.com/en/browse/hadith/4182`
- **Rights Policy**: `approved-redistribution`
- **Attribution**: `HadeethEnc.com`

### 4. Sahih al-Bukhari 6014 (HadeethEnc 4965)
- **Canonical Identity**: `collectionId: bukhari`, `canonicalNumber: "6014"`, `canonicalLabel: "Sahih al-Bukhari 6014"`
- **Provider Record ID**: `4965`
- **Narrator**: Abdullah ibn Umar
- **Title**: *Jibrīl kept enjoining me regarding the good treatment of the neighbor to the extent that I thought he would inherit him*
- **Official Classification**: Authentic / Agreed upon / Sahīh Al-Bukhāri - 6014
- **Grading**: Grade: `"Authentic"`, Grader: `"HadeethEnc Editorial Board"`, Reference: `https://hadeethenc.com/en/browse/hadith/4965`
- **Activation State**: `translation-approved` (English translation only)
- **Arabic Text**: `null` (strictly not activated)
- **Commentary / Benefits**: Strictly excluded
- **Exact UTF-8 SHA-256**: `b09fd7dac70bfd5bbdc44c7a602873a21fd49aa0fe6a6c1aa4c10375b091153d`
- **Character Count**: 249
- **Plain Source URL**: `https://hadeethenc.com/en/browse/hadith/4965`
- **Rights Policy**: `approved-redistribution`
- **Attribution**: `HadeethEnc.com`

### 5. Sahih Muslim 1827 (HadeethEnc 4935)
- **Canonical Identity**: `collectionId: muslim`, `canonicalNumber: "1827"`, `canonicalLabel: "Sahih Muslim 1827"`
- **Provider Record ID**: `4935`
- **Narrator**: Abdullah ibn Amr
- **Title**: *Those who act justly will be with Allah on pulpits of light at the right Hand of the Most Compassionate, Exalted be He, and both His Hands are right*
- **Official Classification**: Authentic / Narrated by Muslim / Sahīh Muslim - 1827
- **Grading**: Grade: `"Authentic"`, Grader: `"HadeethEnc Editorial Board"`, Reference: `https://hadeethenc.com/en/browse/hadith/4935`
- **Activation State**: `translation-approved` (English translation only)
- **Arabic Text**: `null` (strictly not activated)
- **Commentary / Benefits**: Strictly excluded
- **Exact UTF-8 SHA-256**: `62cae207a5898ff6cbd446a67f3a6d2cfbf5a32b8b387ef2aecc85ec45b9170e`
- **Character Count**: 390
- **Plain Source URL**: `https://hadeethenc.com/en/browse/hadith/4935`
- **Rights Policy**: `approved-redistribution`
- **Attribution**: `HadeethEnc.com`

### 6. Sahih Muslim 2553 (HadeethEnc 4308)
- **Canonical Identity**: `collectionId: muslim`, `canonicalNumber: "2553"`, `canonicalLabel: "Sahih Muslim 2553"`
- **Provider Record ID**: `4308`
- **Narrator**: An-Nawwas ibn Sim'an
- **Title**: *Righteousness is good morals, and sinfulness is what your heart is not at ease with, and you hate that people know about it*
- **Official Classification**: Authentic / Narrated by Muslim / Sahīh Muslim - 2553
- **Grading**: Grade: `"Authentic"`, Grader: `"HadeethEnc Editorial Board"`, Reference: `https://hadeethenc.com/en/browse/hadith/4308`
- **Activation State**: `translation-approved` (English translation only)
- **Arabic Text**: `null` (strictly not activated)
- **Commentary / Benefits**: Strictly excluded
- **Exact UTF-8 SHA-256**: `bf781f3abeb3ed19da51f0e802a4c698920c9a58fdb05b2c0f3fd1f8d8f6675e`
- **Character Count**: 325
- **Plain Source URL**: `https://hadeethenc.com/en/browse/hadith/4308`
- **Rights Policy**: `approved-redistribution`
- **Attribution**: `HadeethEnc.com`

---

## Qur'an Whitelist Expansion

The Qur'an coordinate whitelist (`APPROVED_QURAN_VERSE_KEYS`) expands from 59 to 68 keys (+9 unique new keys):
1. `"4:36"` (Parents & Family / Neighbors)
2. `"4:135"` (Justice)
3. `"5:8"` (Justice)
4. `"9:119"` (Truthfulness)
5. `"17:23"` (Parents & Family)
6. `"25:63"` (Humility)
7. `"31:18"` (Humility)
8. `"33:70"` (Truthfulness)
9. `"68:4"` (Good Manners)

Note: Verse key `"4:36"` is legitimately referenced across two distinct topics (*Parents and Family* and *Neighbors*), creating 10 new Qur'an reference objects while adding 9 unique whitelist entries.

---

## Scholarly Source Locators

Scholarly references preserve the approved production source identity (`https://risala.prh.gov.sa/en/content/81`) from Alharamain's Message (*A Glimpse into the Islamic Creed* by Sheikh Muhammad ibn Salih al-Uthaymin). Locators map to verified sections under the literal heading **"Introduction"**:
1. Truthfulness: `"Introduction — Islam enjoins truthfulness and forbids lying"`
2. Parents and Family: `"Introduction — dutifulness to parents and upholding kinship ties"`
3. Neighbors: `"Introduction — good neighborliness"`
4. Justice: `"Introduction — justice and forbids injustice"`
5. Good Manners: `"Introduction — every good manner and righteous act"`
6. Humility: **Excluded** (0 scholarly references, as the source text does not explicitly enumerate humility by name).

---

## M9RH Hadith Bridge Integration

All 6 new Hadith references resolve dynamically through the existing Islamic Reference Hadith Bridge (`app/islamic-reference-hadith-bridge.mjs`) without production code changes to the bridge:
- `hadith:akhlaq-and-adab-truthfulness:hadeethenc-5504` -> `muslim:2607`
- `hadith:akhlaq-and-adab-humility:hadeethenc-5497` -> `muslim:2865`
- `hadith:akhlaq-and-adab-parents-and-family:hadeethenc-4182` -> `muslim:2548`
- `hadith:akhlaq-and-adab-neighbors:hadeethenc-4965` -> `bukhari:6014`
- `hadith:akhlaq-and-adab-justice:hadeethenc-4935` -> `muslim:1827`
- `hadith:akhlaq-and-adab-good-manners:hadeethenc-4308` -> `muslim:2553`

---

## Source Selection & Exclusion Notes

- **Qur'an 16:90 Exclusion**: Verse `16:90` (*"Indeed, Allah orders justice and good conduct..."*) was considered for *Neighbors* but excluded because `4:36` directly names neighbors (*"and the neighbor who is near, the neighbor who is farther away..."*) and serves as a more precise and direct coordinate anchor.
- **Qur'an 7:199 Exclusion**: Verse `7:199` (*"Take to forgiveness and enjoin what is good..."*) was considered for *Good Manners* but excluded because `68:4` (*"And indeed, you are of a great moral character"*) gives the more direct, overarching general-character anchor.

---

## Good Manners Taxonomy Boundary

- **General Excellence of Character**: The *Good Manners* topic represents general excellence of character (*husn al-khuluq*) in Islamic ethics.
- **No Catch-All Duplication**: *Good Manners* must remain distinct and must not become a catch-all duplicate of specific moral topics such as *Truthfulness*, *Humility*, *Parents and Family*, *Neighbors*, or *Justice*.
- **Distinct Broad-Character Identity**: The combination of Qur'an `68:4`, Sahih Muslim 2553 (*"Righteousness is good morals..."*), and the descriptive scholarly locator (*"Introduction — every good manner and righteous act"*) establishes this distinct broad-character taxonomy boundary without overlapping specific sub-virtues.

---

## Domain Boundaries

- **Education Catalog**: M9R-5 maintains total independence from course, module, lesson, and learner progress models.
- **Evidence / Study Lens / Reciter**: Independent of M8 Evidence, Today's Study, reciters, qira'at, and PWA capabilities.
- **Content Copying**: Zero body prose or commentary from external Hadith or scholarly sources is duplicated into M9R.
