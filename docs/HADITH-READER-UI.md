# M9H-3 Hadith Reader UI

## Overview

The **M9H-3** milestone implements the production Hadith Reader UI for Mushaf Companion. The UI uses the existing M9H registry, content, and pure resolver as its single source of truth, enabling users to browse collections, search approved records, read exact verified English translations, inspect cryptographic provenance, and navigate directly via internal references (e.g. `hadith:muslim:8`).

---

## Architecture & Integration Points

```
Learn Panel (Hub)
  ├── Today's Study
  ├── Hadith Library (Featured Card & Tool Grid) ───► Hadith Reader Panel
  │                                                     ├── Library View (Collections & Global Search)
  │                                                     ├── Collection Detail View (Record List / Empty State)
  │                                                     └── Hadith Reader View (Translation & Provenance)
  ├── Guided Courses
  ├── Due Review
  └── Other Study Tools (My Mushaf, Tajweed, etc.)
```

### Key Component Architecture
- **Component**: [`app/hadith-reader-panel.tsx`](file:///C:/Users/Kiya/Documents/Mushaf-m9h/app/hadith-reader-panel.tsx)
- **Integration**: Rendered as an overlay in [`app/page.tsx`](file:///C:/Users/Kiya/Documents/Mushaf-m9h/app/page.tsx) (`overlay === "Hadith"`).
- **Access Point**: First-class entry in [`app/learn-panel.tsx`](file:///C:/Users/Kiya/Documents/Mushaf-m9h/app/learn-panel.tsx) via `props.onOpenHadith`.
- **Programmatic Contract**: `openHadithLibrary(target?: string | null)` in `app/page.tsx` for direct target navigation.

---

## User Interface Views & Flow

### 1. Library View (Browse & Search)
- **Search Bar**: Real-time filtering across canonical number (e.g. `8`, `528`), canonical label (`Sahih Muslim 8`), collection name, and narrator (`Umar`, `Abu Hurayrah`).
- **Collections Grid**: Displays all 6 registered collections:
  - **Sahih al-Bukhari**: `4 Hadith available locally` (Active badge)
  - **Sahih Muslim**: `7 Hadith available locally` (Active badge)
  - **Sunan Abi Dawud**: `No approved local records yet` (Pending badge)
  - **Jami' at-Tirmidhi**: `No approved local records yet` (Pending badge)
  - **Sunan an-Nasa'i**: `No approved local records yet` (Pending badge)
  - **Sunan Ibn Majah**: `No approved local records yet` (Pending badge)
- **No-Complete-Corpus Claim**: Collection cards never fabricate or imply full corpus availability (e.g. no "7 of 7563").

### 2. Collection Detail View
- **Header**: Displays collection English display name, Arabic title, and local record count.
- **Record List (Bukhari / Muslim)**:
  - Canonical label & number (e.g. `HADITH 8 · Sahih Muslim 8`)
  - Narrator metadata (e.g. `Narrated by 'Umar ibn al-Khattab`)
  - Status pill (`English translation available`)
  - Translation preview snippet
  - Action button: `Read complete Hadith →`
- **Empty State (Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah)**:
  - Truthful explanation: `"No internally approved Hadith records have been added to this collection yet."`
  - Neutral copy: `"Mushaf Companion only ingests records with verified source rights, pinned translations, and cryptographic checksums. More source-verified records can be added as the Hadith library expands."`

### 3. Hadith Reader View
- **Header**: Canonical collection and hadith number (e.g. `SAHIH MUSLIM · 8`), with Arabic collection title.
- **Narrator Box**: Dedicated callout for narrator (e.g. `'Umar ibn al-Khattab`) when available.
- **English Translation Section**:
  - Exact text from HadeethEnc v1.25.0 rendered as plain-text paragraphs.
  - Zero rewording, modernization, grammatical alteration, or truncation.
  - No `dangerouslySetInnerHTML` usage.
- **Arabic Text Section**:
  - Modest, neutral placeholder: `"Arabic text is not yet available internally for this record."`
  - Explanatory note: `"Arabic text requires scholarly review and rights verification before internal activation."`
  - Component is architecturally ready to display Arabic text once `arabic-approved` or `fully-approved` records are activated.
- **Source & Provenance Section**:
  - Structured description list displaying canonical reference, collection, canonical number, translation source (`HadeethEnc.com`), dataset version (`v1.25.0`), upstream provider record ID (`4563`), and rights policy (`Approved translation redistribution`).
  - External link button: `"Open verified source ↗"` pointing directly to the HTTPS URL on `hadeethenc.com` with `target="_blank"` and `rel="noopener noreferrer"`.

---

## Internal Target Navigation

The reader supports direct target resolution using canonical URIs:
- `hadith:muslim:8` ──► Opens Sahih Muslim Hadith 8
- `hadith:bukhari:528` ──► Opens Sahih al-Bukhari Hadith 528
- `hadith:bukhari:4485` ──► Opens Sahih al-Bukhari Hadith 4485

### Fail-Closed Resolution
- **Malformed Target**: Shows user notice: `"Malformed Hadith target '...'."` without crashing.
- **Unknown Collection**: Shows user notice: `"Collection '...' is not registered."`
- **Unseeded Number**: Shows user notice: `"Hadith reference '...' was not found in internal records."`

---

## Accessibility & Responsive Design

- **Modal Semantics**: `role="dialog" aria-modal="true" aria-labelledby="hadith-panel-title"`.
- **Keyboard Navigation**: Focus trap within panel, Escape key to dismiss, autofocus on close button.
- **Touch Target Sizes**: All interactive buttons, inputs, and links adhere to minimum 44px touch targets.
- **Mobile Responsive Layout**: Drill-down hierarchy (`Library` ──► `Collection` ──► `Reader`) with clear back buttons on viewports down to 390px.
- **Motion Sensitivity**: Respects `prefers-reduced-motion: reduce`.
- **Theme Support**: Seamless styling in light and dark reading modes.

---

## Strict Domain Isolation

The Hadith Reader UI is completely decoupled from:
- `EducationProgress` & `EducationCatalog` (no course/quiz/completion semantics)
- `TodayStudy` (no daily lesson/review coupling)
- `M8 Evidence` (no citation graph entanglement)
- `M9R Islamic Foundations` (ready for future one-way invocation via `openHadithTarget`)

---

## Verification & Test Suites

Ran all focused Hadith test suites:
```powershell
node --test tests/hadith-registry.test.mjs tests/hadith-content.test.mjs tests/hadith-resolver.test.mjs tests/hadith-reader-ui.test.mjs
```

**Results**:
- `tests/hadith-registry.test.mjs`: 10 passed
- `tests/hadith-content.test.mjs`: 19 passed
- `tests/hadith-resolver.test.mjs`: 11 passed
- `tests/hadith-reader-ui.test.mjs`: 20 passed
- **Total**: **60 passed**, **0 failed**.
