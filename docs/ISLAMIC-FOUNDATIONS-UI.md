# Islamic Foundations Reference Library UI (M9R-3)

## Overview

The **Islamic Foundations Library UI** (`app/islamic-foundations-panel.tsx`) provides an accessible, responsive reference browser inside the Mushaf Companion Learn ecosystem. It enables users to browse the 10 registered foundational Islamic collections, inspect topic and collection-level references, and activate primary evidence through internal readers or verified scholarly resources.

The UI is strictly a **reference library browser**, not a course or learning system. It presents vetted primary metadata citations without embedding unvetted prose, tracking student progress, or generating doctrinal content.

---

## 1. Architecture and Domain Boundaries

### Single Source of Truth
- The UI consumes `app/islamic-reference-library.ts` (`ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY`) as the single source of truth.
- Collection lists, topic statuses, reference counts, and readiness badges are derived dynamically at runtime using pure selectors in `app/islamic-foundations-ui-state.mjs`.
- No duplicate data arrays or hardcoded counts are stored in React components.

### Domain Boundaries & Separation
- **Direction of Dependencies**:
  - `IslamicFoundationsPanel` -> `islamic-foundations-ui-state` -> `islamic-reference-library`
  - For Hadith navigation: `IslamicFoundationsPanel` -> `islamic-reference-hadith-bridge` (`resolveIslamicReferenceHadith`) -> `hadith-resolver` -> Hadith Reader UI.
- **Strict Isolation**:
  - Islamic Foundations has zero dependencies on `EducationProgress`, `EducationCatalog`, `Today Study`, or `EvidenceLayer`.
  - Core M9H Hadith modules (`hadith-registry.mjs`, `hadith-content.mjs`, `hadith-resolver.mjs`) have zero dependencies on M9R.
  - No text bodies (Qur'an translations, Arabic Hadith text, English Hadith text, or scholarly treatise text) are copied or duplicated into the UI layer.

---

## 2. Navigation Model & Hierarchy

The interface operates with a clean hierarchical drill-down navigation model:

```text
[Learn Panel]
     ↓ (Browse Islamic Foundations)
[Foundations Library View] (10 Collections Grid + Local Search)
     ↓ (Click Collection)
[Collection Detail View] (Overview References + Topics List)
     ↓ (Click Source-Ready Topic)
[Topic Detail View] (Grouped Reference Inventory: Qur'an, Hadith, Scholarly)
```

### Back Navigation Semantics
- **Topic View**: The Back button (`‹ Back`) returns to the parent **Collection Detail View**.
- **Collection View**: The Back button returns to the **Foundations Library View**.
- **Library View**: The Close button (`×`) closes the overlay dialog and returns the user to the invoking context in **Learn**.
- **Escape Key**: Closes the dialog from any level.

---

## 3. Views & Behavior

### 1. Library Browser View
- **Hero & Statistics**: Truthfully displays the global summary:
  - 10 Collections
  - 12 Topics Source-Ready
  - 37 Topics Planned
  - 57 Vetted References
- **Local Search**: Fast, client-side search matching collection titles, descriptions, topic titles, topic descriptions, and citation locators (e.g. `2:255`, `Sahih Muslim 8`, `Belief in Allah`).
- **Collection Cards**: Each of the 10 core collections displays:
  - Collection title and neutral description.
  - Dynamic readiness badge:
    - `SOURCE-READY` (e.g. Islam: 5 of 5 topics; Iman: 6 of 6 topics).
    - `PARTIALLY READY` (e.g. Ihsan: 1 source-ready · 3 planned).
    - `PLANNED` (e.g. Tawhid, Akhirah: N topics planned).
  - Clicking any collection opens its Collection Detail view.

### 2. Collection Detail View
- **Header**: Breadcrumb kicker, title, description, and overall collection readiness badge.
- **Overview Sources Section**: Displays collection-level vetted references (e.g. Islam has 2 overview citations; Iman has 5 overview citations).
- **Topics Section**: Lists all registered topics within the collection:
  - **Source-Ready Topics**: Displays `SOURCE-READY` badge and active button `"Open references (N) →"` to navigate into the Topic Detail view.
  - **Planned Topics**: Displays explicit `PLANNED` badge and neutral notice: `"Sources for this topic have not been activated yet."` Planned topic rows are non-actionable; no placeholder references or fabricated teaching content are shown.

### 3. Topic Detail View
- **Header**: Collection kicker, topic title, neutral description, and `SOURCE-READY` badge.
- **Reference Inventory**: References are categorized and presented by type:
  - **Qur'an References**: Displays passage locator (e.g. `Qur'an 2:255`). Clicking `"Open in Muṣḥaf →"` routes through internal navigation to the exact verse in the Mushaf reader.
  - **Hadith References**: Canonical identity is primary (e.g. `Sahih Muslim 8`, `Sahih al-Bukhari 528`), with HadeethEnc provenance record ID and authentic grading label. Clicking `"Open in Hadith Reader →"` runs the M9RH bridge (`resolveIslamicReferenceHadith`) and opens the target internally in the Hadith Reader.
  - **Scholarly References**: Displays work title (*A Glimpse into the Islamic Creed*), author (*Muhammad ibn Salih al-Uthaymin*), section locator (*Belief in Allah Almighty*), and publisher. Clicking `"Verified Source ↗"` opens the external HTTPS URL (`https://risala.prh.gov.sa/en/content/81`) securely in a new tab with `rel="noopener noreferrer"`.

---

## 4. Accessibility and Mobile Responsiveness

- **Accessibility**:
  - `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="foundations-panel-title"`.
  - Full keyboard focus trapping with Tab cycling and Escape key support.
  - Semantic heading hierarchy (`h2` -> `h3` -> `h4`).
  - Readiness states are communicated textually (`SOURCE-READY`, `PARTIALLY READY`, `PLANNED`), not solely through color.
  - Zero use of `dangerouslySetInnerHTML`.
- **Mobile Responsiveness**:
  - Designed for compact screens down to ~390px.
  - Minimum 44px touch target heights for all action buttons and external links.
  - Single-column responsive layouts on screens ≤ 790px and ≤ 430px with zero horizontal clipping.
