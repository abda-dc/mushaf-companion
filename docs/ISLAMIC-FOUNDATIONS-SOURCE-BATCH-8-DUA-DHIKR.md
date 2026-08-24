# Islamic Foundations Source Batch 8 — Du'a and Dhikr

## Overview

M9R Source Batch 8 populates all four topics in the `dua-and-dhikr` collection (*Du'a and Dhikr — Supplication & Remembrance*), transitioning the collection from `planned` to fully `reference-ready`.

Batch 8 introduces:
- 4 vetted Qur'an anchor references, adding 4 new keys to `APPROVED_QURAN_VERSE_KEYS`
- 4 single-narration HadeethEnc translated Hadith records, adding 4 seeded M9H records across Sahih al-Bukhari, Sahih Muslim, and Sunan Abi Dawud
- 0 scholarly references

No schema changes, Hadith bridge changes, Hadith resolver changes, or UI component modifications were required.

Batch 8 is also the first M9R source batch to activate a local Abu Dawud record. This exposed a pre-existing M9H content-ID validator inconsistency: the Hadith registry and resolver already supported safe hyphenated collection IDs such as `abu-dawud`, while the content record validator did not. A narrowly scoped validator correction aligned the content-ID grammar with the existing registered collection grammar. No collection registry, resolver, bridge, schema, or routing semantics were changed.

---

## Source Verification & Provenance

### HadeethEnc Workbook

- **Workbook File:** `HadeethEnc.com_en-v1.25.0.xlsx`
- **Dataset Version:** `v1.25.0`
- **Last Upstream Update:** `2026-05-10 17:43:35`
- **Provider:** `https://hadeethenc.com/en`
- **Update Check:** `https://hadeethenc.com/en/check/en/v1.25.0`
- **Rights Policy:** `approved-redistribution`
- **Content Scope:** `translated-hadith-text`
- **Workbook SHA-256 Checksum:** `339d148eb7425b7f2d48dd7521a969e4aa4a35b5d35a7c4a1c1b67043b5ee218`
- **Post-Batch Generated Dataset Count:** `36`

The provider record ID is provenance identity and is not treated as the canonical Hadith collection number. Canonical M9H collection/number mappings are stored separately.

---

## Locked Topic Matrices & References

### 1. Du'a (`dua-and-dhikr-dua`)

- **Status:** `reference-ready` (2 references)
- **Reference Order & Types:** `["quran", "hadith"]`
- **Qur'an Reference:** `quran:dua-and-dhikr-dua:40-60`
  - **Verse Keys:** `["40:60"]`
  - **Locator:** `40:60`
- **Hadith Reference:** `hadith:dua-and-dhikr-dua:hadeethenc-5502`
  - **Provider ID:** `5502`
  - **Canonical Target:** `bukhari:6389`
  - **Canonical Label:** `Sahih al-Bukhari 6389`
  - **HadeethEnc Title:** `The supplication that the Prophet (may Allah's peace and blessings be upon him) recited most was: "Allāhumma rabbana ātina fi ad-dunya hasanah wa fi al-ākhirati hasanah wa qina ‘adhāb an-nār (O Allah our Lord, give us in this world that which is good and in the Hereafter that which is good and protect us from the torment of the Fire)`
  - **Narrator:** `Anas ibn Malik`
  - **Grade:** `Authentic`
  - **Takhrij:** `Agreed upon`
  - **URL:** `https://hadeethenc.com/en/browse/hadith/5502`
  - **UTF-8 SHA-256:** `3b176e8e371c9ae05c294d502c7a624b3da3d1dc1524b7431752f0746bf48b62`
  - **Character Count:** `383`
- **Scholarly Reference:** `NONE`

### 2. Dhikr (`dua-and-dhikr-dhikr`)

- **Status:** `reference-ready` (2 references)
- **Reference Order & Types:** `["quran", "hadith"]`
- **Qur'an Reference:** `quran:dua-and-dhikr-dhikr:33-41`
  - **Verse Keys:** `["33:41"]`
  - **Locator:** `33:41`
- **Hadith Reference:** `hadith:dua-and-dhikr-dhikr:hadeethenc-8402`
  - **Provider ID:** `8402`
  - **Canonical Target:** `muslim:373`
  - **Canonical Label:** `Sahih Muslim 373`
  - **HadeethEnc Title:** `The Prophet (may Allah's peace and blessings be upon him) used to remember Allah at all times`
  - **Narrator:** `Aishah`
  - **Grade:** `Authentic`
  - **Takhrij:** `Narrated by Muslim`
  - **URL:** `https://hadeethenc.com/en/browse/hadith/8402`
  - **UTF-8 SHA-256:** `a10510f63ee1878a6e0c54a0747924322d4c3fcd97c0296e38941fc593ad60b3`
  - **Character Count:** `145`
- **Scholarly Reference:** `NONE`

### 3. Morning and Evening Remembrance (`dua-and-dhikr-morning-and-evening-remembrance`)

- **Status:** `reference-ready` (2 references)
- **Reference Order & Types:** `["quran", "hadith"]`
- **Qur'an Reference:** `quran:dua-and-dhikr-morning-and-evening-remembrance:33-42`
  - **Verse Keys:** `["33:42"]`
  - **Locator:** `33:42`
- **Hadith Reference:** `hadith:dua-and-dhikr-morning-and-evening-remembrance:hadeethenc-5485`
  - **Provider ID:** `5485`
  - **Canonical Target:** `abu-dawud:5074`
  - **Canonical Label:** `Sunan Abi Dawud 5074`
  - **HadeethEnc Title:** `O Allah, I ask You for well-being in this world and the Hereafter`
  - **Narrator:** `Abdullah ibn Umar`
  - **Grade:** `Authentic`
  - **Takhrij:** `Narrated by Abu Dāwūd, An-Nasā’i, Ibn Mājah, and Ahmad`
  - **URL:** `https://hadeethenc.com/en/browse/hadith/5485`
  - **UTF-8 SHA-256:** `d933a95e597b58a6e2c52942a8f77e20ab5940f754a7637c3489d617d04ffde0`
  - **Character Count:** `633`
- **Scholarly Reference:** `NONE`

### 4. Etiquette of Supplication (`dua-and-dhikr-etiquette-of-supplication`)

- **Status:** `reference-ready` (2 references)
- **Reference Order & Types:** `["quran", "hadith"]`
- **Qur'an Reference:** `quran:dua-and-dhikr-etiquette-of-supplication:7-55`
  - **Verse Keys:** `["7:55"]`
  - **Locator:** `7:55`
- **Hadith Reference:** `hadith:dua-and-dhikr-etiquette-of-supplication:hadeethenc-3232`
  - **Provider ID:** `3232`
  - **Canonical Target:** `muslim:2735`
  - **Canonical Label:** `Sahih Muslim 2735`
  - **HadeethEnc Title:** `Your supplication is answered as long as one of you is not in haste, saying: I have supplicated to my Lord, but He has not yet answered me`
  - **Narrator:** `Abu Hurayrah`
  - **Grade:** `Authentic hadith`
  - **Takhrij:** `Narrated by Bukhari & Muslim`
  - **URL:** `https://hadeethenc.com/en/browse/hadith/3232`
  - **UTF-8 SHA-256:** `6d1c3a64cdf561e921dd3e4d01258ec1f4fa24216e6a2d150709c7acef2749ab`
  - **Character Count:** `648`
- **Scholarly Reference:** `NONE`

---

## Minimal Qur'an Selection Decision

The approved Batch 8 Qur'an anchors are:

1. `40:60` — Du'a
2. `33:41` — Dhikr
3. `33:42` — Morning and Evening Remembrance
4. `7:55` — Etiquette of Supplication

The following secondary candidates were reviewed and deliberately omitted:

- `2:186`
- `13:28`
- `7:205`

They were evaluated under the strict minimal production rule:

> What coverage is lost if omitted?

No essential topic coverage was lost by omitting these secondary coordinates, so they remain outside `APPROVED_QURAN_VERSE_KEYS`.

---

## Scholarly Source Decision

No scholarly reference was added in Batch 8.

Each topic already has one focused Qur'an anchor and one directly relevant, source-verified Hadith reference. Adding a general scholarly reference would not close a distinct source-coverage gap and would therefore violate the batch's minimality rule.

---

## Hadith Activation Decision

Exactly four HadeethEnc provider records were activated for Batch 8:

| Topic | Provider ID | Canonical Target | Collection |
| --- | ---: | --- | --- |
| Du'a | `5502` | `bukhari:6389` | Sahih al-Bukhari |
| Dhikr | `8402` | `muslim:373` | Sahih Muslim |
| Morning and Evening Remembrance | `5485` | `abu-dawud:5074` | Sunan Abi Dawud |
| Etiquette of Supplication | `3232` | `muslim:2735` | Sahih Muslim |

No additional provider record was activated merely to increase citation volume.

---

## M9H Hyphenated Collection-ID Compatibility Note

Batch 8 introduces the first locally seeded `abu-dawud` record.

The existing architecture already registered `abu-dawud` as a core collection and the resolver already accepted hyphenated collection IDs. During activation, the M9H content validator was found to use a narrower ID grammar that rejected the otherwise-valid record ID `abu-dawud:5074`.

The content validator was minimally aligned to the existing safe collection grammar so that:

- `abu-dawud:5074` is accepted
- architectural IDs such as `ibn-majah:2249a` are accepted by the same grammar
- malformed IDs such as `abu--dawud`, `-abu-dawud`, and `abu-dawud-` remain rejected
- existing Bukhari and Muslim behavior remains unchanged

No Hadith registry, resolver, bridge, schema, or navigation contract was modified.

---

## Production Post-State Metrics (`m9r-v8`)

- **Revision:** `m9r-v8`
- **Schema Version:** `2`
- **Collections:** `10`
- **Topics:** `49` total (**39 reference-ready**, **10 planned**)
- **Total References:** `140` (**68 Qur'an**, **41 Hadith**, **31 Scholarly**)
- **Qur'an Whitelist Count:** **80 unique keys**
- **M9H Seeded Records Count:** **36 records**
  - **16 Sahih al-Bukhari**
  - **19 Sahih Muslim**
  - **1 Sunan Abi Dawud**
  - **0 Jami' at-Tirmidhi**
  - **0 Sunan an-Nasa'i**
  - **0 Sunan Ibn Majah**
- **Unique Internal Hadith Targets:** **36 targets**
