# Islamic Foundations Source Batch 7 — Halal and Haram

## Overview

M9R Source Batch 7 populates all five topics in the `halal-and-haram` collection (*Halal and Haram — The Lawful & The Prohibited*), transitioning the collection from `planned` to `reference-ready`.

Batch 7 introduces:
- 5 vetted Qur'an anchor references (adding 5 new keys to `APPROVED_QURAN_VERSE_KEYS`)
- 5 single-narration HadeethEnc translated Hadith records (adding 5 seeded M9H records across Bukhari and Muslim)
- 2 metadata-only scholarly references referencing *What A Muslim Must Know* (`/en/content/251`)

No schema changes, Hadith bridge changes, or UI component modifications were required.

---

## Source Verification & Provenance

### HadeethEnc Workbook
- **Workbook File:** `HadeethEnc.com_en-v1.25.0.xlsx`
- **Workbook SHA-256 Checksum:** `339d148eb7425b7f2d48dd7521a969e4aa4a35b5d35a7c4a1c1b67043b5ee218`

---

## Locked Topic Matrices & References

### 1. The Lawful and Unlawful (`halal-and-haram-lawful-and-unlawful`)
- **Status:** `reference-ready` (2 references)
- **Reference Order & Types:** `["quran", "hadith"]`
- **Qur'an Reference:** `quran:halal-and-haram-lawful-and-unlawful:16-116` (`["16:116"]`, locator: `16:116`) — *Forbids falsely declaring things lawful or unlawful without divine authority.*
- **Hadith Reference:** `hadith:halal-and-haram-lawful-and-unlawful:hadeethenc-4314`
  - **Provider ID:** `4314` | **Target:** `muslim:1599` (*Sahih Muslim 1599*)
  - **Title:** `"Verily, the lawful is clear, and the unlawful is clear"`
  - **Narrator:** `An-Nu'man ibn Bashir` | **Grade:** `Authentic` | **Takhrij:** `Agreed upon`
  - **URL:** `https://hadeethenc.com/en/browse/hadith/4314`
  - **UTF-8 SHA-256:** `46be4108ee574a13da7a8844e7c5bc2e456e438ea1866606c3b692a3b726155f`
  - **Character Count:** `869`
- **Scholarly Reference:** `NONE`

### 2. Food (`halal-and-haram-food`)
- **Status:** `reference-ready` (2 references)
- **Reference Order & Types:** `["quran", "hadith"]`
- **Qur'an Reference:** `quran:halal-and-haram-food:5-3` (`["5:3"]`, locator: `5:3`) — *Primary enumeration of prohibited dietary categories (carrion, blood, pork, idols).*
- **Hadith Reference:** `hadith:halal-and-haram-food:hadeethenc-64643`
  - **Provider ID:** `64643` | **Target:** `muslim:1934` (*Sahih Muslim 1934*)
  - **Title:** `"forbade (eating the flesh of) all carnivorous animals that have fangs and all birds that have talons"`
  - **Narrator:** `Ibn 'Abbas` | **Grade:** `Authentic` | **Takhrij:** `Narrated by Muslim`
  - **URL:** `https://hadeethenc.com/en/browse/hadith/64643`
  - **UTF-8 SHA-256:** `e21cad17315f8977e5120e11de6196e468947213350a8b605000416a04ac9cf5`
  - **Character Count:** `227`
- **Scholarly Reference:** `NONE`

### 3. Income (`halal-and-haram-income`)
- **Status:** `reference-ready` (3 references)
- **Reference Order & Types:** `["quran", "hadith", "scholarly"]`
- **Qur'an Reference:** `quran:halal-and-haram-income:2-188` (`["2:188"]`, locator: `2:188`) — *Prohibits extortion, consuming wealth wrongfully, and bribery.*
- **Hadith Reference:** `hadith:halal-and-haram-income:hadeethenc-3785`
  - **Provider ID:** `3785` | **Target:** `bukhari:1471` (*Sahih al-Bukhari 1471*)
  - **Title:** `"It is better for one of you to take his rope, go out and gather a bundle of firewood on his back, sell it, and thereby Allah preserves his dignity, than to ask people—whether they give him or withhold from him"`
  - **Narrator:** `Az-Zubayr ibn al-'Awwam` | **Grade:** `Authentic` | **Takhrij:** `Narrated by Al-Bukhari`
  - **URL:** `https://hadeethenc.com/en/browse/hadith/3785`
  - **UTF-8 SHA-256:** `45de60145d96f6f7d5f384a5a807c28819787da4e2de23e9a2ed00215a65f29c`
  - **Character Count:** `346`
- **Scholarly Reference:** `scholarly:halal-and-haram-income:alharamain-251`
  - **Publication:** *What A Muslim Must Know* (`https://risala.prh.gov.sa/en/content/251`)
  - **Locator:** `"Chapter Three: Transactions — rules related to financial transactions, items 4 and 6"`

### 4. Transactions (`halal-and-haram-transactions`)
- **Status:** `reference-ready` (3 references)
- **Reference Order & Types:** `["quran", "hadith", "scholarly"]`
- **Qur'an Reference:** `quran:halal-and-haram-transactions:2-275` (`["2:275"]`, locator: `2:275`) — *Foundational legal distinction between permitted trade and forbidden usury.*
- **Hadith Reference:** `hadith:halal-and-haram-transactions:hadeethenc-5918`
  - **Provider ID:** `5918` | **Target:** `muslim:1515` (*Sahih Muslim 1515*)
  - **Title:** `"Do not go out to meet the riders (in a trade caravan), do not urge buyers to cancel a sale transaction to make a new one with you, do not bid against each other (to fool another bidder), a townsman must not buy on behalf of a Bedouin, and do not tie up the udders of camels and sheep"`
  - **Narrator:** `Abu Hurayrah` | **Grade:** `Authentic hadith` | **Takhrij:** `Narrated by Muslim - Narrated by Bukhari & Muslim`
  - **URL:** `https://hadeethenc.com/en/browse/hadith/5918`
  - **UTF-8 SHA-256:** `8caaa69c4e10387d8809b0bfb373f00648da6383d2e50b8f4b911243424fb522`
  - **Character Count:** `688`
  - **Canonicalization Documentation Note:** The live HadeethEnc provider page for `5918` displays `[Narrated by Muslim - Narrated by Bukhari & Muslim]` without an explicit canonical index number. Canonical Sahih Muslim reference sources independently establish the exact narration at `Sahih Muslim 1515c` (*Kitab al-Buayu' / Bab Tahrim Talaqqi al-Rukban*), which maps to base canonical target `muslim:1515` under M9H canonical-number architecture.
- **Scholarly Reference:** `scholarly:halal-and-haram-transactions:alharamain-251`
  - **Publication:** *What A Muslim Must Know* (`https://risala.prh.gov.sa/en/content/251`)
  - **Locator:** `"Chapter Three: Transactions"`

### 5. Relationships and Conduct (`halal-and-haram-relationships-and-conduct`)
- **Status:** `reference-ready` (2 references)
- **Reference Order & Types:** `["quran", "hadith"]`
- **Qur'an Reference:** `quran:halal-and-haram-relationships-and-conduct:17-32` (`["17:32"]`, locator: `17:32`) — *Legal boundary prohibition regarding unlawful intimate relationships.*
- **Hadith Reference:** `hadith:halal-and-haram-relationships-and-conduct:hadeethenc-5888`
  - **Provider ID:** `5888` | **Target:** `bukhari:5232` (*Sahih al-Bukhari 5232*)
  - **Title:** `"\"Beware of entering upon women.\" A man from the Ansār said: O Messenger of Allah, what about the Hamw (brother-in-law)? He said: \"The Hamw is death\""`
  - **Narrator:** `Uqbah ibn Amir` | **Grade:** `Authentic` | **Takhrij:** `Agreed upon`
  - **URL:** `https://hadeethenc.com/en/browse/hadith/5888`
  - **UTF-8 SHA-256:** `c75436b93499bd02dd9dcc88a7652c5386f0789a5d66273e7506d7c43eb91291`
  - **Character Count:** `287`
- **Scholarly Reference:** `NONE`

---

## Non-Activation Decisions

The following provider records were audited and explicitly kept **UNACTIVATED**:
1. **HadeethEnc 3752:** Composite provider record containing two separate Bukhari narrations (2072 and 2073); rejected to avoid corrupting single-narration canonical target alignment.
2. **HadeethEnc 66515:** Nawawi 6 secondary duplicate of 4314.
3. **HadeethEnc 4316 / 66518:** Nawawi 10 secondary duplicate/alternate of Sahih Muslim 1015; rejected in favor of single-narration work record 3785.
4. **HadeethEnc 3165 / 6454:** Bankrupt Hadith; categorized under moral character/blameworthy manners, rejected for Relationships & Conduct to avoid duplicating the Akhlaq and Adab collection.
5. **HadeethEnc 58259:** Alternate intoxicants Hadith; rejected for Food in favor of 64643 (broader dietary law species classification).

---

## Minimal Qur'an Selection Decision

Secondary Qur'an candidates (`5:87`, `2:172`, `5:1`, `24:30`) were evaluated under the strict minimal production rule (*"What coverage is lost if omitted?"*). Each was rejected because the primary anchors (`16:116`, `5:3`, `2:188`, `2:275`, `17:32`) fully establish the essential legal coverage without redundancy.

---

## Production Post-State Metrics (`m9r-v7`)

- **Revision:** `m9r-v7`
- **Schema Version:** `2`
- **Collections:** `10`
- **Topics:** `49` total (**35 reference-ready**, **14 planned**)
- **Total References:** `132` (**64 Qur'an**, **37 Hadith**, **31 Scholarly**)
- **Qur'an Whitelist Count:** **76 unique keys**
- **M9H Seeded Records Count:** **32 records** (**15 Sahih al-Bukhari**, **17 Sahih Muslim**)
- **Unique Internal Hadith Targets:** **32 targets**
