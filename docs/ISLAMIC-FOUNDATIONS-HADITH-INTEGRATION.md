# Islamic Foundations ↔ Hadith Reader Integration (M9RH-1)

## Overview

The **M9RH-1** milestone integrates the **M9R Islamic Foundations Reference Library** with the **M9H Hadith Reader**. It enables M9R Hadith reference citations to resolve internally to verified M9H Hadith Reader records (e.g., `hadith:muslim:8`) while preserving strict domain separation, cryptographic provenance, and external fallback URLs.

---

## Domain Separation & Architectural Boundary

```
┌─────────────────────────────────────────────────────────────┐
│             M9R Islamic Foundations Domain                  │
│  - app/islamic-reference-library.ts                         │
│  - Citation & bibliographic metadata only                   │
│  - No Hadith bodies (English or Arabic)                     │
│  - Action: "internal-hadith-navigation"                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Consumes M9R reference)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          Islamic Reference Hadith Bridge (M9RH-1)           │
│  - app/islamic-reference-hadith-bridge.mjs                  │
│  - Pure, stateless adapter module                           │
│  - Fail-closed cross-source & canonical identity validation │
│  - Calls M9H resolver & target formatter                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Formats target & resolves)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  M9H Hadith Reader Domain                   │
│  - app/hadith-registry.mjs                                  │
│  - app/hadith-content.mjs (11 approved English translations)│
│  - app/hadith-resolver.mjs                                  │
│  - app/hadith-reader-panel.tsx (Production UI)              │
│  - ZERO dependencies on M9R or Islamic Foundations          │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles:
1. **Core M9H Is Completely M9R-Independent**: `hadith-registry.mjs`, `hadith-content.mjs`, and `hadith-resolver.mjs` contain zero references to Islamic Foundations.
2. **Zero Text Duplication**: M9R contains no English or Arabic Hadith texts, no explanations, and no benefits. M9H remains the single source of truth for Hadith text content.
3. **Bridge / Adapter Pattern**: A lightweight adapter ([`app/islamic-reference-hadith-bridge.mjs`](file:///C:/Users/Kiya/Documents/Mushaf-m9rh/app/islamic-reference-hadith-bridge.mjs)) bridges the two domains without polluting core models.

---

## Canonical Identity vs. Provider Provenance

A crucial architectural distinction is maintained between **canonical Hadith identity** and **upstream provider database IDs**:

| Concept | Purpose | Example |
| :--- | :--- | :--- |
| **Canonical Collection ID** | Machine-readable collection key | `"muslim"`, `"bukhari"` |
| **Canonical Collection Name** | Human-readable collection display title | `"Sahih Muslim"`, `"Sahih al-Bukhari"` |
| **Canonical Locator** | Numbering within the canonical collection | `"8"`, `"153"`, `"4485"` |
| **Provider Identity** | Upstream database record key (HadeethEnc) | `"4563"`, `"3272"`, `"65046"` |
| **Internal Target** | URI for internal application navigation | `"hadith:muslim:8"` |
| **External Fallback URL** | Direct HTTPS URL for verified web access | `https://hadeethenc.com/en/browse/hadith/4563` |

---

## Authoritative M9R Mapped Hadith Reference Set (15 References / 11 Unique Targets)

In the current accepted production data, **15 M9R Hadith reference entries** map to **11 unique canonical M9H Hadith records** (all approved local records in M9H):

| M9R Reference ID | M9R Location | Provider ID | Canonical Reference | Internal Target | M9H Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `hadith:islam-overview:hadeethenc-65000` | Islam (Overview / Five Pillars) | `65000` | Sahih Muslim 16 | `hadith:muslim:16` | `translation-approved` |
| `hadith:islam-shahadah:hadeethenc-4563` | Islam / Shahadah | `4563` | Sahih Muslim 8 | `hadith:muslim:8` | `translation-approved` |
| `hadith:islam-salah:hadeethenc-4968` | Islam / Salah | `4968` | Sahih al-Bukhari 528 | `hadith:bukhari:528` | `translation-approved` |
| `hadith:islam-zakat:hadeethenc-3689` | Islam / Zakat | `3689` | Sahih al-Bukhari 1397 | `hadith:bukhari:1397` | `translation-approved` |
| `hadith:islam-sawm:hadeethenc-65003` | Islam / Sawm | `65003` | Sahih Muslim 15 | `hadith:muslim:15` | `translation-approved` |
| `hadith:islam-hajj:hadeethenc-2758` | Islam / Hajj | `2758` | Sahih al-Bukhari 1521 | `hadith:bukhari:1521` | `translation-approved` |
| `hadith:iman-overview:hadeethenc-4563` | Iman (Overview) | `4563` | Sahih Muslim 8 | `hadith:muslim:8` | `translation-approved` |
| `hadith:iman-belief-in-allah:hadeethenc-4563` | Iman / Belief in Allah | `4563` | Sahih Muslim 8 | `hadith:muslim:8` | `translation-approved` |
| `hadith:iman-belief-in-angels:hadeethenc-4563` | Iman / Belief in the Angels | `4563` | Sahih Muslim 8 | `hadith:muslim:8` | `translation-approved` |
| `hadith:iman-revealed-books:hadeethenc-65046` | Iman / Revealed Books | `65046` | Sahih al-Bukhari 4485 | `hadith:bukhari:4485` | `translation-approved` |
| `hadith:iman-messengers:hadeethenc-3272` | Iman / Messengers | `3272` | Sahih Muslim 153 | `hadith:muslim:153` | `translation-approved` |
| `hadith:iman-last-day:hadeethenc-5460` | Iman / Last Day | `5460` | Sahih Muslim 2859 | `hadith:muslim:2859` | `translation-approved` |
| `hadith:iman-qadr:hadeethenc-65038` | Iman / Qadr | `65038` | Sahih Muslim 2653 | `hadith:muslim:2653` | `translation-approved` |
| `hadith:iman-qadr:hadeethenc-5493` | Iman / Qadr | `5493` | Sahih Muslim 2664 | `hadith:muslim:2664` | `translation-approved` |
| `hadith:ihsan-meaning:hadeethenc-4563` | Ihsan / Meaning of Ihsan | `4563` | Sahih Muslim 8 | `hadith:muslim:8` | `translation-approved` |

> [!NOTE]
> `hadith:islam-shahadah:hadeethenc-4563`, `hadith:iman-overview:hadeethenc-4563`, `hadith:iman-belief-in-allah:hadeethenc-4563`, `hadith:iman-belief-in-angels:hadeethenc-4563`, and `hadith:ihsan-meaning:hadeethenc-4563` represent five distinct educational citations of the *Hadith of Jibril*. All maintain globally unique M9R reference IDs while deterministically resolving to the same canonical record: `hadith:muslim:8`.

---

## Five Pillars Scope Boundary

M9H already contains approved translations for Five Pillars-related Hadith records (`65000` / Muslim 16, `4968` / Bukhari 528, `3689` / Bukhari 1397, `65003` / Muslim 15, `2758` / Bukhari 1521).

However, in M9R, all **5 Islam / Five Pillars topics** remain intentionally `planned`:
- `islam-shahadah`
- `islam-salah`
- `islam-zakat`
- `islam-sawm`
- `islam-hajj`

Per milestone constraints, these topics have **not** been modified or populated. Populating them will occur in a future vetted source intake batch.

---

## Bridge API & Fail-Closed Validation

The bridge exposes two functions in [`app/islamic-reference-hadith-bridge.mjs`](file:///C:/Users/Kiya/Documents/Mushaf-m9rh/app/islamic-reference-hadith-bridge.mjs):

```typescript
export function resolveIslamicReferenceHadith(
  reference: unknown
): IslamicReferenceHadithBridgeResult;

export function getIslamicReferenceHadithTarget(
  reference: unknown
): string | null;
```

### Result Statuses:
- `"resolved"`: Reference is valid, matches canonical collection/number, and verifies HadeethEnc provider provenance. Returns `target` (e.g. `hadith:muslim:8`), `hadithResolution`, and `externalFallbackUrl`.
- `"not-found"`: Collection is not registered, or hadith canonical number is not in internal records.
- `"invalid-reference"`: Missing fields, wrong action, malformed URL, or malformed target.
- `"source-mismatch"`: Internal record exists, but upstream provider record ID does not match M9R sourceRecordId (prevents silent cross-hadith routing).
- `"canonical-mismatch"`: Resolved canonical collection or number diverges from citation.

---

## Future UI Integration Contract (M9R-3)

When building the M9R-3 Islamic Foundations UI, invoking an internal Hadith citation is purely declarative:

```typescript
import { resolveIslamicReferenceHadith } from "./islamic-reference-hadith-bridge.mjs";

function handleReferenceClick(reference: IslamicReference) {
  if (reference.action === "internal-hadith-navigation") {
    const bridgeResult = resolveIslamicReferenceHadith(reference);
    if (bridgeResult.status === "resolved" && bridgeResult.target) {
      openHadithLibrary(bridgeResult.target);
      return;
    }
    // Fallback to verified external URL if internal resolution is unavailable
    if (bridgeResult.externalFallbackUrl) {
      window.open(bridgeResult.externalFallbackUrl, "_blank", "noopener,noreferrer");
    }
  }
}
```

---

## Verification Summary

- **Total Focused Tests**: **126 / 126 passed** (0 failures)
  - `tests/islamic-reference-library.test.mjs`: 34 passed
  - `tests/islamic-reference-hadith-integration.test.mjs`: 32 passed
  - `tests/hadith-registry.test.mjs`: 10 passed
  - `tests/hadith-content.test.mjs`: 19 passed
  - `tests/hadith-resolver.test.mjs`: 11 passed
  - `tests/hadith-reader-ui.test.mjs`: 20 passed
- **Regression Tests**: **65 / 65 passed** (0 failures)
