# Islamic Foundations Source Batch 6 — Taharah (Purification & Cleanliness)

## Overview

M9R Source Batch 6 populates the **Taharah — Purification & Cleanliness** collection with vetted Qur'an coordinates, HadeethEnc citation records, and scholarly bibliographic metadata. All four Taharah topics advance from `planned` to `reference-ready`.

## Locked Production Reference Matrix

### 1. Purification (`taharah-purification`)
- **Status:** `reference-ready`
- **Qur'an:** `quran:taharah-purification:9-108`
  - `verseKeys`: `["9:108"]`
  - `locator`: `"9:108"`
  - **Rationale:** At-Tawbah 9:108 explicitly praises general ritual/material purity ("...wherein are men who love to purify themselves; and Allah loves those who purify themselves"). Primary anchor for Taharah.
- **Hadith:** `hadith:taharah-purification:hadeethenc-65004`
  - **M9H Target:** `muslim:223` (Sahih Muslim 223)
  - **Provider ID:** `65004`
  - **Narrator:** `Abu Malik al-Ash'ari`
  - **Title:** "Purity is half of faith, al-hamdulillāh (praise be to Allah) fills the Scale, and subhān Allah wa al-hamdulillāh (glory and praise be to Allah) fills what is between the heavens and the earth"
- **Scholarly:** `scholarly:taharah-purification:alharamain-251`
  - **Book:** *What A Muslim Must Know*
  - **URL:** `https://risala.prh.gov.sa/en/content/251`
  - **Locator:** `Chapter Two: Matters Related to Acts of Worship — The First Topic: Tahārah (purification)`

### 2. Wudu (`taharah-wudu`)
- **Status:** `reference-ready`
- **Qur'an:** `quran:taharah-wudu:5-6`
  - `verseKeys`: `["5:6"]`
  - `locator`: `"5:6"`
  - **Rationale:** Al-Ma'idah 5:6 (Ayat al-Wudu) establishes the obligatory procedural steps of minor ritual ablution.
- **Hadith:** `hadith:taharah-wudu:hadeethenc-3313`
  - **M9H Target:** `bukhari:164` (Sahih al-Bukhari 164)
  - **Provider ID:** `3313`
  - **Narrator:** `Uthman ibn Affan`
  - **Title:** "If anyone performs ablution like this ablution of mine and offers two Rak'ahs during which he does not think of anything else, Allah will forgive his past sins"
- **Scholarly:** `scholarly:taharah-wudu:alharamain-251`
  - **Book:** *What A Muslim Must Know*
  - **URL:** `https://risala.prh.gov.sa/en/content/251`
  - **Locator:** `Chapter Two: Matters Related to Acts of Worship — The First Topic: Tahārah — Sixth: Rulings of wudū’ (ablution)`

### 3. Ghusl (`taharah-ghusl`)
- **Status:** `reference-ready`
- **Qur'an:** `quran:taharah-ghusl:4-43`
  - `verseKeys`: `["4:43"]`
  - `locator`: `"4:43"`
  - **Rationale:** An-Nisa 4:43 explicitly commands full body washing (Ghusl) for major impurity before approaching prayer.
- **Hadith:** `hadith:taharah-ghusl:hadeethenc-3316`
  - **M9H Target:** `bukhari:272` (Sahih al-Bukhari 272)
  - **Provider ID:** `3316`
  - **Narrator:** `Aishah`
  - **Title:** "On taking a ritual bath from Janābah (major ritual impurity), the Messenger of Allah (may Allah's peace and blessings be upon him) used to wash his hands and perform ablution like that for prayer, then wash himself"
- **Scholarly:** `NONE` (Explicitly no scholarly reference; source publication has no dedicated generic Ghusl section).

### 4. Cleanliness and Prayer (`taharah-cleanliness-and-prayer`)
- **Status:** `reference-ready`
- **Qur'an:** `quran:taharah-cleanliness-and-prayer:5-6`
  - `verseKeys`: `["5:6"]`
  - `locator`: `"5:6"`
  - **Rationale:** Al-Ma'idah 5:6 explicitly conditions standing for prayer upon prior ritual purification.
- **Hadith:** `hadith:taharah-cleanliness-and-prayer:hadeethenc-3534`
  - **M9H Target:** `bukhari:6954` (Sahih al-Bukhari 6954)
  - **Provider ID:** `3534`
  - **Narrator:** `Abu Hurayrah`
  - **Title:** "Allah does not accept the prayer of any of you who is in the state of Hadath (minor ritual impurity) until he performs ablution"
- **Scholarly:** `scholarly:taharah-cleanliness-and-prayer:alharamain-251`
  - **Book:** *What A Muslim Must Know*
  - **URL:** `https://risala.prh.gov.sa/en/content/251`
  - **Locator:** `Chapter Two: Matters Related to Acts of Worship — The First Topic: Tahārah — Third: Things forbidden for Muhdith (one in the state of ritual impurity)`

---

## HadeethEnc Workbook & Fingerprint Integrity

* **Source Workbook:** `HadeethEnc.com_en-v1.25.0.xlsx`
* **Workbook SHA-256:** `339d148eb7425b7f2d48dd7521a969e4aa4a35b5d35a7c4a1c1b67043b5ee218`

### Approved Record Fingerprints
1. **65004** (`muslim:223`)
   - **SHA-256:** `b0530eeaf152e71f2c82523593a6f282f95dbe254c36809ce1afbffaa26a7b22`
   - **Character Count:** `567`
2. **3313** (`bukhari:164`)
   - **SHA-256:** `cb5f110912a12528ab23925eea1b09afe2433d211d2093aeb4789860071d1c30`
   - **Character Count:** `785`
3. **3316** (`bukhari:272`)
   - **SHA-256:** `b170c2c653db7366b75d92d42208f9502e598527a94638a46825272d1acca700`
   - **Character Count:** `654`
4. **3534** (`bukhari:6954`)
   - **SHA-256:** `5666f4183729e662de2d381e50ea50e8b694e8f17c8fc6e3e1c09402da8055a4`
   - **Character Count:** `253`

### Canonicalization Decision: HadeethEnc 65004 vs 66526
* **Decision:** `65004` is selected for `muslim:223`.
* **Primary Rationale:** `65004` explicitly exposes Sahih Muslim 223 as its canonical source locator, whereas `66526` presents the narration under Al-Arba‘oon An-Nawawiyyah 23 without displaying the Sahih Muslim 223 source locator. `65004` is therefore the canonical M9H provider record for `muslim:223`.
* **Secondary Observations:** Consistency with existing `650xx`-series Muslim provider records (`65000`, `65003`, `65007`, `65038`, `65046`) and standard English honorific text formatting.

---

## Qur'an Whitelist & Candidate Evaluation

* **Pre-Count:** 68 keys
* **Added Keys (+3):** `4:43`, `5:6`, `9:108`
* **Post-Count:** 71 keys
* **Intentional Key Reuse:** `5:6` is reused across Wudu (procedural steps) and Cleanliness & Prayer (prerequisite condition for Salah).
* **Candidate Rejections:**
  - `2:222`: Rejected as general Taharah anchor because its immediate context is menstruation.
  - `74:4`: Rejected because interpretive scope varies (physical garment purity vs. metaphorical purity of deeds).

---

## Scholarly Source & Ghusl Decision

* **Second Scholarly Source:** *What A Muslim Must Know* (`https://risala.prh.gov.sa/en/content/251`) compiled by The Scientific Committee under the Presidency of Religious Affairs at the Sacred Mosque and the Prophet's Mosque.
* **Ghusl Scholarly Reference:** `NONE`. The source publication lacks a dedicated generic section for Ghusl. Under M9R schema rules, inventing an un-targeted reference is prohibited; `reference-ready` topics backed by vetted Qur'an and Hadith references are fully compliant without a scholarly reference.

---

## Post-State Production Baseline (`m9r-v6`)

* **Revision:** `m9r-v6`
* **Schema Version:** `2`
* **Collections:** `10`
* **Topics:** `49`
* **Reference-Ready Topics:** `30` (+4)
* **Planned Topics:** `19` (-4)
* **Total References:** `120` (+11: 59 Qur'an, 32 Hadith, 29 Scholarly)
* **Qur'an Whitelist Keys:** `71` (+3)
* **M9H Seeded Records:** `27` (+4: 13 Bukhari, 14 Muslim)
* **Unique Internal Hadith Targets:** `27` (+4)

---

## Integration Scoping

* **Hadith Bridge (`app/islamic-reference-hadith-bridge.mjs`):** `NO CHANGE`. Resolves all 4 Taharah Hadith references through the generic bridge.
* **Production UI Files:** `NO CHANGE`. Consumes reference library metadata dynamically.
