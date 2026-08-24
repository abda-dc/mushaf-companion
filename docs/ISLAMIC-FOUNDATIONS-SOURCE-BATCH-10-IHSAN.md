# Islamic Foundations Source Batch 10 — Ihsan Completion

## Overview

Batch 10 completes the Islamic Foundations reference library (`m9r-v10`) by transitioning the final three remaining planned topics in the `ihsan` collection (`ihsan-sincerity`, `ihsan-awareness-of-allah`, `ihsan-taqwa`) to `reference-ready`.

This achieves 100% topic completion for the Islamic Foundations reference library:
- **Total Collections:** 10
- **Total Topics:** 49 (49 reference-ready, 0 planned)
- **Total References:** 160 (78 Qur'an, 51 Hadith, 31 scholarly)
- **Whitelisted Qur'an Verse Keys:** 88 unique keys
- **Seeded M9H Hadith Records:** 44 total (20 Bukhari, 21 Muslim, 1 Abu Dawud, 2 Tirmidhi, 0 Nasa'i, 0 Ibn Majah)

---

## Baseline Verification
- **Baseline Commit SHA:** `dea3d2455428988f5d6e861adc8f53a97bbf0483`
- **Revision:** `m9r-v10`
- **Schema Version:** `2` (Unchanged)
- **Execution Branch:** `codex/m9r10-ihsan-sources` (Isolated worktree `C:\Users\Kiya\Documents\Mushaf-m9r10`)

---

## Final Source Matrix

### 1. Sincerity (`ihsan-sincerity`)
- **Title:** Sincerity
- **Status:** `reference-ready`
- **Qur'an Anchor:** `98:5` (*"And they were not commanded except to worship Allah, [being] sincere to Him in religion..."*)
  - Locator: `98:5`
  - Whitelist Status: NEW key added (`98:5`)
- **Hadith Reference:** HadeethEnc `66511` -> `bukhari:1`
  - HadeethEnc ProviderID: `66511`
  - Provider Title: `Verily, the reward of deeds depends on intentions, and each person will be rewarded according to what he intended`
  - Provider Narrator: `'Umar ibn al-Khattab`
  - Provider Grade: `Authentic`
  - Provider Takhrij: `[It was narrated by the two Imāms of the scholars of Hadīth - Abu ‘Abdullāh Muhammad ibn Ismā‘īl ibn Ibrāhīm ibn al-Mughīrah ibn Bardizbah al-Bukhāri and Abu al-Husayn Muslim ibn al-Hajjāj ibn Muslim a]`
  - Provider-Displayed Locator: `Al-Arba'oon An-Nawawiyyah 1`
  - Independent Canonical Target: `bukhari:1`
  - Canonical Label: `Sahih al-Bukhari 1`
  - Canonical Narrator: `'Umar ibn al-Khattab`
  - M9H Seed Action: NEW seed (`bukhari:1`, 532 chars, SHA-256 `0c065b7ece5d0ed39a3232799ce204541612f0b3899449c82352945ba7f4255c`)
- **Scholarly Reference:** OMIT

### 2. Awareness of Allah (`ihsan-awareness-of-allah`)
- **Title:** Awareness of Allah
- **Status:** `reference-ready`
- **Qur'an Anchor:** `57:4` (*"...And He is with you wherever you are. And Allah, of what you do, is Seeing."*)
  - Locator: `57:4`
  - Whitelist Status: NEW key added (`57:4`)
  - Source-Safe Rationale: Qur'an 57:4 directly establishes Allah's encompassing knowledge and seeing of the servants' deeds and states that He is with them wherever they are.
- **Hadith Reference:** REUSE HadeethEnc `4563` -> `muslim:8` (Hadith of Jibril)
  - Canonical Target: `muslim:8`
  - Canonical Label: `Sahih Muslim 8`
  - M9H Seed Action: REUSE existing seed `muslim:8` (0 new seeds)
  - M9R Reference ID: `hadith:ihsan-awareness-of-allah:hadeethenc-4563`
  - Minimality & Overlap Decision: Hadith of Jibril explicitly provides the Ihsan/watchfulness clause that if the servant does not see Allah, Allah sees the servant. Reusing `muslim:8` with a distinct M9R reference ID satisfies complete topic coverage without creating duplicate M9H seeds. Candidate `4811` (`tirmidhi:2516`) was explicitly rejected to avoid unneeded seed expansion and overlap with Taqwa.
- **Scholarly Reference:** OMIT

### 3. Taqwa (`ihsan-taqwa`)
- **Title:** Taqwa
- **Status:** `reference-ready`
- **Qur'an Anchor:** `3:102` (*"O you who have believed, fear Allah as He should be feared and do not die except as Muslims..."*)
  - Locator: `3:102`
  - Whitelist Status: NEW key added (`3:102`)
- **Hadith Reference:** HadeethEnc `4302` -> `tirmidhi:1987`
  - HadeethEnc ProviderID: `4302`
  - Provider Title: `Fear Allah wherever you are; follow a bad deed with a good deed and it will erase it; and treat people with good morals`
  - Provider Narrator Attribution: `Abu Dharr, Jundub ibn Junādah, and Abu ‘Abdur-Rahmān, Mu‘ādh ibn Jabal (may Allah be pleased with both of them)`
  - Provider Grade: `At-Tirmidhi said: Hasan`
  - Provider Takhrij: `Narrated by At-Tirmidhi`
  - Provider-Displayed Locator: `Al-Arba'oon An-Nawawiyyah 18`
  - Independent Canonical Target: `tirmidhi:1987`
  - Canonical Label: `Jami' at-Tirmidhi 1987`
  - Canonical Narrator: `Abu Dharr` (Primary Companion narrator in Jami' at-Tirmidhi 1987; dual provider attribution documented here)
  - M9H Seed Action: NEW seed (`tirmidhi:1987`, 281 chars, SHA-256 `00a1f06f42e912dedc80854529543ab91a8dc0cef48ab202c07fe5ba052f50ff`)
- **Scholarly Reference:** OMIT

---

## Whitelist & Seeded Record Impact

### Whitelist Changes
- **Previous Keys:** 85
- **New Keys Added (3):** `3:102`, `57:4`, `98:5`
- **Post-Batch Whitelist:** 88 unique keys

### Seeded Hadith Impact
- **Previous Seeds:** 42
- **New Seeds Added (2):** `bukhari:1`, `tirmidhi:1987`
- **Reused Seeds (1):** `muslim:8`
- **Post-Batch Seed Count:** 44 total (`20 bukhari`, `21 muslim`, `1 abu-dawud`, `2 tirmidhi`, `0 nasai`, `0 ibn-majah`)

---

## HadeethEnc Provenance Data
- **Workbook File:** `C:\Users\Kiya\Downloads\HadeethEnc.com_en-v1.25.0.xlsx`
- **Workbook SHA-256:** `339d148eb7425b7f2d48dd7521a969e4aa4a35b5d35a7c4a1c1b67043b5ee218`
- **Provider Origin:** `https://hadeethenc.com`
- **Rights Policy:** `approved-redistribution`
- **Attribution:** `HadeethEnc.com`

---

## Parallel Isolation Verification
- M12.2 Adhan & Notifications work on `codex/m12.2-adhan-notifications` in `C:\Users\Kiya\Documents\Mushaf` was completely untouched.
- Zero M12.2 files, prayer calculation files, notification files, or Capacitor files were altered by M9R-10B.
