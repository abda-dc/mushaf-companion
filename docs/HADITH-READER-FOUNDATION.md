# M9H Hadith Reader Foundation (Architecture, Validation & Pure Resolution)

## Overview & Purpose of M9H

The **M9H** initiative establishes a standalone, robust, and reusable Hadith data architecture for Mushaf Companion. It provides the core models, validation schemas, registry definitions, and pure resolution logic needed to reference, cite, cross-check, and navigate Hadith literature reliably.

M9H-1 is **ARCHITECTURE + VALIDATION + RESOLUTION ONLY**.

> [!IMPORTANT]
> **No Corpus Bundling**: Registering collections does **NOT** mean complete Hadith corpora (such as the thousands of hadiths in Sahih al-Bukhari or Sahih Muslim) are bundled or imported. All six core collection definitions remain `contentAvailability: "metadata-only"`; approved individual seed records are tracked separately.
>
> **Bounded Approved Bodies**: The current reader contains 44 exact HadeethEnc English translation-approved seed records with attribution and checksums. It contains no approved Arabic corpus and makes no full-collection claim.

---

## Domain Separation: Why Hadith Reader is Separate from M9R

M9H is designed as a foundational, reusable domain layer with **zero dependencies** on higher-level features:
- `EducationCatalog`, `EducationCourse`, `EducationLesson`, `EducationProgress`
- `Today Study`
- `KnowledgeCheck`
- `M8 Evidence Layer`
- `M9R Islamic Foundations Model`

### Rationale
Hadith literature is a fundamental Islamic source material used across multiple distinct surfaces (Curriculum, Study Notes, Search, Ayah Context Lens, and the future Hadith Reader). Coupling the Hadith domain to the curriculum or education progress model would prevent independent reuse and violate separation of concerns.

Instead, M9R and other components will consume M9H as an external reference provider through the pure resolver API (`resolveHadithReference`, `resolveHadithReferenceByCanonicalLabel`, and target parser `parseHadithTarget`).

---

## Initial Collection Registry

M9H-1 registers the **Six Canonical Sunnah Collections (Kutub al-Sittah)**:

| Collection ID | Display Name | Short Name | Arabic Name | Status | Content Availability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `bukhari` | Sahih al-Bukhari | Bukhari | صحيح البخاري | `metadata-ready` | `metadata-only` |
| `muslim` | Sahih Muslim | Muslim | صحيح مسلم | `metadata-ready` | `metadata-only` |
| `abu-dawud` | Sunan Abi Dawud | Abu Dawud | سنن أبي داود | `metadata-ready` | `metadata-only` |
| `tirmidhi` | Jami' at-Tirmidhi | Tirmidhi | جامع الترمذي | `metadata-ready` | `metadata-only` |
| `nasai` | Sunan an-Nasa'i | Nasa'i | سنن النسائي | `metadata-ready` | `metadata-only` |
| `ibn-majah` | Sunan Ibn Majah | Ibn Majah | سنن ابن ماجه | `metadata-ready` | `metadata-only` |

### Registry Extensibility
The validator requires these six core collections to exist by default, but allows additional collections (such as `muwatta-malik`, `musnad-ahmad`, `darimi`, `riyad-as-salihin`, `nawawi-40`, `adab-al-mufrad`, `bulugh-al-maram`, `shamail`) without requiring any schema modifications.

---

## Hadith Record Identity Model

A Hadith record distinguishes multiple distinct identities:
1. **Internal Identity (`id`)**: Stable Mushaf Companion identifier formatted as `"${collectionId}:${canonicalNumber}"` (e.g. `muslim:8`, `bukhari:528`).
2. **Collection Identity (`collectionId`)**: Foreign key referencing a registered collection ID (`muslim`, `bukhari`).
3. **Canonical/Public Locator (`canonicalNumber`, `canonicalLabel`)**: The public reference number (e.g. `"8"`, `"528"`, `"2249a"`).
   - **Crucial Rule**: Canonical numbers must always be **strings**, never numbers/integers. Valid examples include `"8"`, `"528"`, `"2249a"`, and `"2249b"`.
4. **Book & Chapter Context (`bookNumber`, `bookName`, `chapterNumber`, `chapterName`)**: In-book hierarchical numbering and division.
5. **Alternate Numbering References (`alternateReferences[]`)**: Numbering according to different editions or scholars.
6. **Source/Provider Records (`sourceRecords[]`)**: The identity and locator in external provider databases (e.g. HadeethEnc record ID `4563`).

```typescript
interface HadithRecord {
  readonly id: string;
  readonly collectionId: string;
  readonly canonicalNumber: string;
  readonly canonicalLabel: string;
  readonly bookNumber: string | null;
  readonly bookName: string | null;
  readonly chapterNumber: string | null;
  readonly chapterName: string | null;
  readonly alternateReferences: readonly HadithAlternateReference[];
  readonly narrator: string | null;
  readonly text: HadithTextContent | null;
  readonly sourceRecords: readonly HadithSourceRecord[];
  readonly provenance: HadithProvenance | null;
  readonly activation: HadithActivationState;
}
```

---

## Canonical vs. Alternate Numbering

Hadith collections have been published under multiple historical and contemporary numbering schemes (e.g., Fu'ad 'Abd al-Baqi, Darussalam, In-Book, Chapter-relative, etc.).

M9H decouples the canonical number from alternate schemes using `HadithAlternateReference`:

```typescript
interface HadithAlternateReference {
  scheme: "collection" | "book" | "in-book" | "edition" | "legacy" | "provider" | string;
  value: string;
  label: string;
}
```

This ensures provider-neutrality without baking any single third-party scheme into the core data model.

---

## Separation of Provider Identity from Canonical Hadith Identity

A provider's internal database ID must **never** be conflated with the canonical hadith number.

> [!NOTE]
> **Concrete Example**:
> - Canonical Hadith: **Sahih Muslim 8** (`collectionId: "muslim"`, `canonicalNumber: "8"`)
> - HadeethEnc Record: **4563** (`provider: "hadeethenc"`, `providerRecordId: "4563"`, URL: `https://hadeethenc.com/en/browse/hadith/4563`)
>
> The provider ID `4563` is stored strictly in `sourceRecords[0].providerRecordId`, distinct from `canonicalNumber: "8"`.

---

## Arabic vs. Translation Text Separation

Arabic original text and English (or other language) translations are modeled independently rather than as a monolithic body string:

```typescript
interface HadithTextContent {
  readonly arabic: HadithArabicText | null;
  readonly translations: readonly HadithTranslationEntry[];
}
```

Each content element contains its own:
- `provenance` / `sourceUrl` / `providerRecordId`
- `rightsPolicy`
- `status` (`arabic-approved`, `translation-approved`, `fully-approved`, etc.)
- Optional cryptographic integrity checksum (`SHA-256`)

This enables separate activation (e.g., displaying an approved translation while Arabic remains unavailable, or vice-versa).

---

## Provenance & Rights Model

Every displayed item must be traceable to its origin and license:

### Rights Policies
- `approved-redistribution`: Content is explicitly licensed/approved for internal display and redistribution; requires non-empty attribution.
- `metadata-only`: Citation and locator metadata may be used, but body text may not be redistributed.
- `external-only`: Entity exists only as an external citation/link target.
- `pending-review`: Upstream license or text is under scholarly/legal review.

---

## Content Activation States (Fail-Closed)

Content activation states enforce strict fail-closed constraints:

| Activation State | Semantics & Constraints |
| :--- | :--- |
| `metadata-only` | Record identity exists internally for citation/linking; `text` **must be null** (no body allowed). |
| `translation-approved` | Approved translation is present and valid; Arabic is null or unapproved. |
| `arabic-approved` | Approved Arabic text is present and valid; translation is null or unapproved. |
| `fully-approved` | Both approved Arabic and approved translation text are present with valid provenance. |
| `external-only` | Record exists strictly for external fallback; `text` **must be null**. |
| `pending-rights` | Source exists upstream but usage rights are unverified; internal display is blocked. |
| `unavailable` | Source content or mapping is unavailable. |

---

## Source Contracts & Upstream Policies

### 1. HadeethEnc (`hadeethenc`)
- **Approved Origin**: Strictly HTTPS `https://hadeethenc.com`
- **M9H-1 role:** Citation, metadata, grading verification, and external reference URL target; the original architecture milestone imported no bodies.
- **Current role:** The controlled v1.25.0 ingestion supplies 44 exact English translation-approved records. Arabic remains absent and all other collection records remain metadata-only/unavailable.

### 2. Sunnah.com (`sunnah`)
- **Role in M9H-1**: External citation and numbering cross-check only (`external-only`).
- **Strict Prohibitions**:
  - **Do NOT scrape Sunnah.com**.
  - **Do NOT mass-copy Sunnah.com corpora**.
  - **Do NOT bundle Sunnah.com translation bodies**.
  - Sunnah.com is **not** a production dependency.

---

## Current Milestone Status (M9H-1, M9H-2A, M9H-3 Completed)

- **M9H-1**: Hadith Reader Foundation (Registry, fail-closed schemas, pure resolver, deep freeze).
- **M9H-2A and controlled source batches**: HadeethEnc English Translation Ingestion (44 approved records at the current baseline, exact source preservation, SHA-256 verification, v1.25.0 manifest).
- **M9H-3**: Production Hadith Reader UI (`app/hadith-reader-panel.tsx`), Learn Hub integration, collection browser, reader views, search, direct target navigation, accessibility, and responsive drill-down.

For detailed UI documentation, see [HADITH-READER-UI.md](./HADITH-READER-UI.md).
For ingestion architecture and the original M9H-2A snapshot, see [HADITH-ENGLISH-INGESTION.md](./HADITH-ENGLISH-INGESTION.md). Current aggregate counts come from `app/hadith-content.mjs` and [PROJECT-STATUS.md](./PROJECT-STATUS.md).

---

## Pure Resolver & Internal Navigation Targets

### Internal Navigation Target Format
- Format: `hadith:<collectionId>:<canonicalNumber>`
- Examples: `hadith:muslim:8`, `hadith:bukhari:528`, `hadith:abu-dawud:2249a`
- Helper utilities:
  - `formatHadithTarget(collectionId, number)`: returns normalized string.
  - `parseHadithTarget(target)`: parses target into `{ collectionId, number }`, or `null` if invalid.

### Resolution API
```typescript
resolveHadithReference({ collectionId: "muslim", number: "8" })
// => {
//      status: "resolved-metadata-only",
//      target: "hadith:muslim:8",
//      record: { ... },
//      collection: { id: "muslim", displayName: "Sahih Muslim", ... },
//      sourceRecord: { provider: "hadeethenc", providerRecordId: "4563", ... },
//      externalUrl: "https://hadeethenc.com/en/browse/hadith/4563",
//      reason: null
//    }
```

Also supports canonical string label parsing:
```typescript
resolveHadithReferenceByCanonicalLabel("Sahih Muslim 8");
resolveHadithReferenceByCanonicalLabel("Sahih al-Bukhari 528");
resolveHadithReferenceByCanonicalLabel("Bukhari 4485");
```

---

## Roadmap

### M9H-2: Controlled verified-record ingestion — COMPLETE FOR CURRENT SEEDS
- The current release includes 44 exact approved English records, not complete collection corpora.
- Full offline collections and approved Arabic text remain future source/rights/review work.

### M9H-3: Hadith Reader UI — COMPLETE
- Collection browsing, search, record display and deep linking from internal targets such as `hadith:muslim:8` are implemented.
- Dual Arabic/translation display remains bounded by approved text availability; current seeds are English-only.

### M9R Integration
- Connect M9R Curriculum citations to M9H Pure Resolver to enable direct in-app citation lookup and metadata preview.
