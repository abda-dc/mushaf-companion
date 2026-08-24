# Islamic Foundations Source Batch 9 — Akhirah

## Overview

M9R Source Batch 9 populates all seven topics in the `akhirah` collection (*Akhirah — Accountability & The Afterlife*), transitioning the collection from `planned` to fully `reference-ready`.

Batch 9 introduces:
- 7 vetted Qur'an anchor references, adding 5 new verse keys to `APPROVED_QURAN_VERSE_KEYS` (`21:35`, `14:27`, `82:19`, `3:133`, `66:6`) and reusing 3 existing whitelisted verse keys (`22:7`, `99:7`, `99:8`).
- 7 single-narration HadeethEnc translated Hadith records, adding 6 new seeded M9H records across Sahih al-Bukhari, Sahih Muslim, and Jami' at-Tirmidhi, and reusing 1 existing seeded record (`muslim:2859`).
- 0 scholarly references (satisfying strict minimality rule: 1 Qur'an + 1 Hadith per topic provides 100% complete topic coverage).

No schema changes, Hadith bridge changes, Hadith resolver changes, or UI component modifications were required.

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
- **Post-Batch Generated Dataset Count:** `42`

The provider record ID is provenance identity and is not treated as the canonical Hadith collection number. Canonical M9H collection/number mappings are stored separately.

---

## Locked Topic Matrices & References

### 1. Death (`akhirah-death`)

- **Status:** `reference-ready` (2 references)
- **Reference Order & Types:** `["quran", "hadith"]`
- **Qur'an Reference:** `quran:akhirah-death:21-35`
  - **Verse Keys:** `["21:35"]`
  - **Locator:** `21:35`
  - **Text Summary:** "Every soul will taste death. And We test you with evil and with good as trial; and to Us you will be returned."
- **Hadith Reference:** `hadith:akhirah-death:hadeethenc-66232`
  - **Provider ID:** `66232`
  - **Canonical Target:** `tirmidhi:2307`
  - **Canonical Label:** `Jami' at-Tirmidhi 2307`
  - **HadeethEnc Title:** `Remember the destroyer of pleasures frequently," meaning death`
  - **Narrator:** `Abu Hurayrah`
  - **Grade:** `Hasan`
  - **Takhrij:** `[Narrated by At-Tirmidhi, An-Nasā’i, Ibn Mājah]`
  - **Source URL:** `https://hadeethenc.com/en/browse/hadith/66232`
  - **UTF-8 SHA-256:** `f6ff559e78e246e702ec3583bd81c85b7f1f4a65ea504b21a85aa4c1cee1c759`
  - **Character Count:** `194`
  - **Canonical Mapping Evidence Rationale:** HadeethEnc provider 66232 is narrated from Abu Hurayrah and graded Hasan by HadeethEnc. Its takhrij lists At-Tirmidhi, An-Nasa'i, and Ibn Majah, and HadeethEnc's displayed web locator is Ibn Majah 4258. Independent canonical verification confirms the exact same narration at Jami' at-Tirmidhi 2307 (*Kitab az-Zuhd*). `tirmidhi:2307` is therefore a verified canonical target supported by the exact narration, not an inferred number. The M9H provider identity remains 66232 and is separate from the canonical target. No architectural change is required.
- **Scholarly Reference:** `NONE`

### 2. Life of the Grave (`akhirah-life-of-the-grave`)

- **Status:** `reference-ready` (2 references)
- **Reference Order & Types:** `["quran", "hadith"]`
- **Qur'an Reference:** `quran:akhirah-life-of-the-grave:14-27`
  - **Verse Keys:** `["14:27"]`
  - **Locator:** `14:27`
  - **Text Summary:** "Allah keeps firm those who believe, with the firm word, in worldly life and in the Hereafter..." (Revealed concerning the questioning in the grave).
- **Hadith Reference:** `hadith:akhirah-life-of-the-grave:hadeethenc-4206`
  - **Provider ID:** `4206`
  - **Canonical Target:** `bukhari:4699`
  - **Canonical Label:** `Sahih al-Bukhari 4699`
  - **HadeethEnc Title:** `When a Muslim is questioned in the grave, he testifies that no deity is worthy of worship except Allah and that Muhammad is the Messenger of Allah`
  - **Narrator:** `Al-Bara' ibn 'Azib`
  - **Grade:** `Authentic`
  - **Takhrij:** `[Agreed upon]`
  - **Source URL:** `https://hadeethenc.com/en/browse/hadith/4206`
  - **UTF-8 SHA-256:** `006f1567bf6f9ac0070684f506658c6ef8a774800d5431a142d41dee97625773`
  - **Character Count:** `449`
- **Scholarly Reference:** `NONE`

### 3. Resurrection (`akhirah-resurrection`)

- **Status:** `reference-ready` (2 references)
- **Reference Order & Types:** `["quran", "hadith"]`
- **Qur'an Reference:** `quran:akhirah-resurrection:22-7`
  - **Verse Keys:** `["22:7"]`
  - **Locator:** `22:7`
  - **Text Summary:** "And that the Hour is coming, no doubt about it, and that Allah will resurrect those in the graves."
- **Hadith Reference:** `hadith:akhirah-resurrection:hadeethenc-5460`
  - **Provider ID:** `5460`
  - **Canonical Target:** `muslim:2859`
  - **Canonical Label:** `Sahih Muslim 2859`
  - **HadeethEnc Title:** `People will be gathered on the Day of Judgment barefooted, naked, and uncircumcised`
  - **Narrator:** `'Aishah`
  - **Grade:** `Authentic`
  - **Takhrij:** `[Agreed upon]`
  - **Source URL:** `https://hadeethenc.com/en/browse/hadith/5460`
  - **UTF-8 SHA-256:** `4c7f7aa0693e504dbbe6f82309dd0c15d7d9d1c66a04fa30aa402938c1279baa`
  - **Character Count:** `422`
  - **Reuse Note:** Reused existing seeded M9H record `muslim:2859`.
- **Scholarly Reference:** `NONE`

### 4. Day of Judgment (`akhirah-day-of-judgment`)

- **Status:** `reference-ready` (2 references)
- **Reference Order & Types:** `["quran", "hadith"]`
- **Qur'an Reference:** `quran:akhirah-day-of-judgment:82-19`
  - **Verse Keys:** `["82:19"]`
  - **Locator:** `82:19`
  - **Text Summary:** "It is the Day when a soul will not possess for another soul anything, and the command, that Day, is [entirely] with Allah."
- **Hadith Reference:** `hadith:akhirah-day-of-judgment:hadeethenc-8345`
  - **Provider ID:** `8345`
  - **Canonical Target:** `bukhari:4712`
  - **Canonical Label:** `Sahih al-Bukhari 4712`
  - **HadeethEnc Title:** `Allah will gather the people, the first and the last, in one place, where they will hear the caller and they will be sighted clearly...`
  - **Narrator:** `Abu Hurayrah`
  - **Grade:** `Authentic`
  - **Takhrij:** `[Agreed upon]`
  - **Source URL:** `https://hadeethenc.com/en/browse/hadith/8345`
  - **UTF-8 SHA-256:** `1bcec4bd491a824f9c35b084a3bb6e3e5ccf436ea4162a1c4ebf4367d52027d0`
  - **Character Count:** `4132`
- **Scholarly Reference:** `NONE`

### 5. Accountability (`akhirah-accountability`)

- **Status:** `reference-ready` (2 references)
- **Reference Order & Types:** `["quran", "hadith"]`
- **Qur'an Reference:** `quran:akhirah-accountability:99-7-8`
  - **Verse Keys:** `["99:7", "99:8"]`
  - **Locator:** `99:7-8`
  - **Text Summary:** "So whoever does an atom's weight of good will see it, and whoever does an atom's weight of evil will see it."
- **Hadith Reference:** `hadith:akhirah-accountability:hadeethenc-3165`
  - **Provider ID:** `3165`
  - **Canonical Target:** `muslim:2581`
  - **Canonical Label:** `Sahih Muslim 2581`
  - **HadeethEnc Title:** `The bankrupt in my Ummah is the one who will come on the Day of Judgment with prayer, fasting and Zakah...`
  - **Narrator:** `Abu Hurayrah`
  - **Grade:** `Authentic hadith`
  - **Takhrij:** `[Narrated by Muslim]`
  - **Source URL:** `https://hadeethenc.com/en/browse/hadith/3165`
  - **UTF-8 SHA-256:** `aefbf27e0764258e2d9146e0a6d100f4033eb3585562ef92883ec91c75e99f62`
  - **Character Count:** `752`
  - **Provider Selection Rationale:** In v1.25.0, Sahih Muslim 2581 is translated under provider IDs 3165 and 6454. Record 3165 is selected because its title explicitly highlights the core concept of the Ummah's bankrupt person, while 6454 is rejected to enforce single-provider minimality.
- **Scholarly Reference:** `NONE`

### 6. Paradise (`akhirah-paradise`)

- **Status:** `reference-ready` (2 references)
- **Reference Order & Types:** `["quran", "hadith"]`
- **Qur'an Reference:** `quran:akhirah-paradise:3-133`
  - **Verse Keys:** `["3:133"]`
  - **Locator:** `3:133`
  - **Text Summary:** "And hasten to forgiveness from your Lord and a garden as wide as the heavens and the earth, prepared for the righteous."
- **Hadith Reference:** `hadith:akhirah-paradise:hadeethenc-10404`
  - **Provider ID:** `10404`
  - **Canonical Target:** `bukhari:4779`
  - **Canonical Label:** `Sahih al-Bukhari 4779`
  - **HadeethEnc Title:** `Allah, the Blessed and Exalted, said: I have prepared for My righteous slaves what no eye has ever seen, no ear has ever heard, and no human heart has ever imagined`
  - **Narrator:** `Abu Hurayrah`
  - **Grade:** `Authentic`
  - **Takhrij:** `[Agreed upon]`
  - **Source URL:** `https://hadeethenc.com/en/browse/hadith/10404`
  - **UTF-8 SHA-256:** `c0bd33da7f68e6010473a21c75c1b27305b8a0029c03108e290f50516ec87a4c`
  - **Character Count:** `419`
- **Scholarly Reference:** `NONE`

### 7. Hellfire (`akhirah-hellfire`)

- **Status:** `reference-ready` (2 references)
- **Reference Order & Types:** `["quran", "hadith"]`
- **Qur'an Reference:** `quran:akhirah-hellfire:66-6`
  - **Verse Keys:** `["66:6"]`
  - **Locator:** `66:6`
  - **Text Summary:** "O you who have believed, protect yourselves and your families from a Fire whose fuel is people and stones..."
- **Hadith Reference:** `hadith:akhirah-hellfire:hadeethenc-3370`
  - **Provider ID:** `3370`
  - **Canonical Target:** `muslim:2844`
  - **Canonical Label:** `Sahih Muslim 2844`
  - **HadeethEnc Title:** `This is a stone that was thrown into Hellfire seventy years ago and it was falling into Hellfire until it reached its bottom`
  - **Narrator:** `Abu Hurayrah`
  - **Grade:** `Authentic`
  - **Takhrij:** `[Narrated by Muslim]`
  - **Source URL:** `https://hadeethenc.com/en/browse/hadith/3370`
  - **UTF-8 SHA-256:** `8182c788c0a749eff4c9fd2a73d2428c3dc3ce96900895842e39fa2f076b426b`
  - **Character Count:** `455`
- **Scholarly Reference:** `NONE`

---

## Production Post-State Metrics

- **Library Revision:** `m9r-v9`
- **Total Collections:** `10`
- **Total Topics:** `49`
- **Reference-Ready Topics:** `46`
- **Planned Topics:** `3` (`ihsan-sincerity`, `ihsan-awareness-of-allah`, `ihsan-taqwa`)
- **Total Reference Count:** `154`
- **Qur'an Reference Count:** `75`
- **Hadith Reference Count:** `48`
- **Scholarly Reference Count:** `31`
- **Whitelisted Qur'an Verse Keys:** `85`
- **Unique Hadith Targets:** `42`
- **Seeded M9H Hadith Records:** `42`
  - **Sahih al-Bukhari (`bukhari`):** `19`
  - **Sahih Muslim (`muslim`):** `21`
  - **Sunan Abi Dawud (`abu-dawud`):** `1`
  - **Jami' at-Tirmidhi (`tirmidhi`):** `1`
  - **Sunan an-Nasa'i (`nasai`):** `0`
  - **Sunan Ibn Majah (`ibn-majah`):** `0`
