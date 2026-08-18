# Islamic Foundations Source Batch 1: Islam / Five Pillars

## Overview

**Source Batch 1** upgrades the `islam` collection from a structural shell into a source-ready reference collection. It populates the collection-level overview and all five Five Pillars topics with vetted Qur'an coordinates, internal Hadith Reader citations, and verified scholarly metadata.

---

## Production Scope & Status

- **Collection**: `islam` (Islam — Outer Practice & Submission)
- **Topics Populated**: 5 (all upgraded from `planned` to `reference-ready`)
- **Collection-Level References**: 2 (1 Hadith, 1 Scholarly)
- **Topic-Level References**: 20 (10 Qur'an, 5 Hadith, 5 Scholarly)
- **Batch 1 Total References Added**: 22
- **New Production Totals**:
  - Collections: **10**
  - Topics: **49** (10 `reference-ready`, 39 `planned`)
  - Total References: **49** (25 Qur'an, 13 Hadith, 11 Scholarly)
  - Unique Internal Hadith Targets: **11**

---

## Detailed Batch 1 Source Inventory

### 1. Collection Overview: Islam
- **Hadith**:
  - ID: `hadith:islam-overview:hadeethenc-65000`
  - Canonical Reference: **Sahih Muslim 16**
  - Upstream Provider: HadeethEnc `65000`
  - Target: `hadith:muslim:16`
  - Action: `internal-hadith-navigation`
- **Scholarly**:
  - ID: `scholarly:islam-overview:uthaymin-creed`
  - Work: *A Glimpse into the Islamic Creed* (Muhammad ibn Salih al-Uthaymin)
  - Locator: "Pillars of Islam"
  - Source URL: `https://risala.prh.gov.sa/en/content/81`

---

### 2. Topic: Shahadah (`islam-shahadah`)
- **Status**: `reference-ready`
- **Qur'an**:
  - `quran:islam-shahadah:3-18` (Surah 3:18)
  - `quran:islam-shahadah:47-19` (Surah 47:19)
- **Hadith**:
  - ID: `hadith:islam-shahadah:hadeethenc-4563`
  - Canonical Reference: **Sahih Muslim 8** (Hadith of Jibril)
  - Upstream Provider: HadeethEnc `4563`
  - Target: `hadith:muslim:8`
- **Scholarly**:
  - ID: `scholarly:islam-shahadah:uthaymin-creed`
  - Locator: "Pillars of Islam — testimony of faith"
  - Source URL: `https://risala.prh.gov.sa/en/content/81`

---

### 3. Topic: Salah (`islam-salah`)
- **Status**: `reference-ready`
- **Qur'an**:
  - `quran:islam-salah:2-43` (Surah 2:43)
  - `quran:islam-salah:4-103` (Surah 4:103)
- **Hadith**:
  - ID: `hadith:islam-salah:hadeethenc-4968`
  - Canonical Reference: **Sahih al-Bukhari 528** (Five Daily Prayers)
  - Upstream Provider: HadeethEnc `4968`
  - Target: `hadith:bukhari:528`
- **Scholarly**:
  - ID: `scholarly:islam-salah:uthaymin-creed`
  - Locator: "Pillars of Islam — establishment of prayer"
  - Source URL: `https://risala.prh.gov.sa/en/content/81`

---

### 4. Topic: Zakat (`islam-zakat`)
- **Status**: `reference-ready`
- **Qur'an**:
  - `quran:islam-zakat:2-43` (Surah 2:43)
  - `quran:islam-zakat:9-60` (Surah 9:60)
- **Hadith**:
  - ID: `hadith:islam-zakat:hadeethenc-3689`
  - Canonical Reference: **Sahih al-Bukhari 1397** (Obligation of Zakat)
  - Upstream Provider: HadeethEnc `3689`
  - Target: `hadith:bukhari:1397`
- **Scholarly**:
  - ID: `scholarly:islam-zakat:uthaymin-creed`
  - Locator: "Pillars of Islam — paying Zakah"
  - Source URL: `https://risala.prh.gov.sa/en/content/81`

---

### 5. Topic: Sawm (`islam-sawm`)
- **Status**: `reference-ready`
- **Qur'an**:
  - `quran:islam-sawm:2-183` (Surah 2:183)
  - `quran:islam-sawm:2-185` (Surah 2:185)
- **Hadith**:
  - ID: `hadith:islam-sawm:hadeethenc-65003`
  - Canonical Reference: **Sahih Muslim 15** (Obligation of Fasting Ramadan)
  - Upstream Provider: HadeethEnc `65003`
  - Target: `hadith:muslim:15`
- **Scholarly**:
  - ID: `scholarly:islam-sawm:uthaymin-creed`
  - Locator: "Pillars of Islam — fasting Ramadan"
  - Source URL: `https://risala.prh.gov.sa/en/content/81`

---

### 6. Topic: Hajj (`islam-hajj`)
- **Status**: `reference-ready`
- **Qur'an**:
  - `quran:islam-hajj:3-97` (Surah 3:97)
  - `quran:islam-hajj:22-27` (Surah 22:27)
- **Hadith**:
  - ID: `hadith:islam-hajj:hadeethenc-2758`
  - Canonical Reference: **Sahih al-Bukhari 1521** (Obligation of Hajj)
  - Upstream Provider: HadeethEnc `2758`
  - Target: `hadith:bukhari:1521`
- **Scholarly**:
  - ID: `scholarly:islam-hajj:uthaymin-creed`
  - Locator: "Pillars of Islam — Hajj"
  - Source URL: `https://risala.prh.gov.sa/en/content/81`

---

## Content Policies & Boundaries

1. **No Fiqh Overextension**:
   - Specific rulings (e.g. 2.5% rate, nisab thresholds, hawl duration, specific invalidators of fasting, detailed rites of pilgrimage) are intentionally omitted. Those belong to future dedicated fiqh reference material.
2. **Metadata-Only Representation**:
   - Zero Qur'an text or translation is bundled.
   - Zero Hadith body text or explanations are bundled in M9R.
   - Zero scholarly book text is bundled in M9R.
3. **Internal Hadith Resolution**:
   - All 6 Hadith citations resolve directly via the bridge to approved M9H Hadith Reader records with verified English translations.
4. **Remaining Planned Topics**:
   - The remaining 39 planned topics across other collections remain empty and are not presented as source-complete.
