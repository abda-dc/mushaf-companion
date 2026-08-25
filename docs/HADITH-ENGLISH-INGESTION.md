# M9H-2A HadeethEnc English Translation Ingestion

> Historical milestone snapshot: M9H-2A began with 11 approved records. Later controlled Islamic Foundations batches expanded the current production seed to 44 records. See [PROJECT-STATUS.md](./PROJECT-STATUS.md) for the current aggregate state; the figures below preserve the original M9H-2A evidence.

## Overview

The **M9H-2A** milestone executes the verified ingestion of official English Hadith translations from the HadeethEnc encyclopedia into Mushaf Companion for the **11 already-vetted M9H records**.

This upgrades the 11 records from `metadata-only` to `translation-approved`, allowing the future Hadith Reader to internally display exact, rights-cleared English translations while preserving strict provenance and integrity guarantees.

---

## Official Source Manifest

The source data is ingested directly from the official HadeethEnc English Excel workbook:

- **Source File Name**: `HadeethEnc.com_en-v1.25.0.xlsx`
- **Workbook SHA-256**: `339d148eb7425b7f2d48dd7521a969e4aa4a35b5d35a7c4a1c1b67043b5ee218`
- **Source Provider**: HadeethEnc (`hadeethenc`)
- **Dataset Version**: `v1.25.0`
- **Source Language**: `English` (`en`)
- **Last Upstream Update**: `2026-05-10 17:43:35`
- **Upstream Origin URL**: `https://hadeethenc.com/en`
- **Update Check URL**: `https://hadeethenc.com/en/check/en/v1.25.0`
- **Attribution Statement**: `HadeethEnc.com`
- **Rights Policy**: `approved-redistribution`
- **Content Scope**: `translated-hadith-text`

---

## Allowed Ingestion Fields vs. Excluded Fields

From the 15-column HadeethEnc workbook schema:

### Ingested Fields (Active Production Data)
1. `id`: HadeethEnc provider record ID (e.g. `"4563"`)
2. `title`: Upstream title descriptor
3. `hadith_text`: **Exact English Hadith translation**
4. `grade`: Upstream grading label (e.g. `"[Authentic]"`)
5. `takhrij`: Upstream extraction reference (e.g. `"[Narrated by Muslim]"`)
6. `lang`: Language code (`"en"`)
7. `link`: Canonical HTTPS web locator (`https://hadeethenc.com/en/browse/hadith/<id>`)

### Excluded Fields (Intentionally Not Ingested into Active Content)
- `title_ar`: Arabic title (not ingested)
- `hadith_text_ar`: Arabic hadith body (remains `pending-review` / not ingested)
- `explanation_ar` & `explanation`: Upstream commentary / explanation (excluded from M9H core translation model)
- `benefits_ar` & `benefits`: Upstream extracted benefits (excluded from M9H core translation model)
- `grade_ar` & `takhrij_ar`: Arabic grading / extraction labels (excluded from English translation pack)

---

## Critical Text Integrity & No-Modification Policy

The English `hadith_text` value is preserved **byte-for-byte** from the official workbook:
- No rewording or modernizing of spelling
- No alteration of grammar or punctuation
- No alteration of transliteration diacritics (e.g. `‘Umar`, `Jibrīl`, `Ramadān`, `‘Ā’ishah`)
- No mixing of translation text with commentary, explanation, or benefits
- Exact UTF-8 bytes are validated against deterministic SHA-256 checksums.

---

## The 11 Approved Ingested Records

| Canonical Reference | Internal ID | HadeethEnc ID | Translation Char Count | Translation SHA-256 Checksum |
| :--- | :--- | :--- | :--- | :--- |
| **Sahih Muslim 8** | `muslim:8` | `4563` | 1886 | `f0abe0a43f6a03cb1c557714216cbf0a482feebce284ea3f254219523b50e31c` |
| **Sahih Muslim 153** | `muslim:153` | `3272` | 385 | `901c9d829629724d7a73805fad966faa5a2dba4c066e5e4c1164d19288de2e6e` |
| **Sahih al-Bukhari 4485** | `bukhari:4485` | `65046` | 380 | `af87aabda2fe222aa06386d831a53658fc1cb48784dab02e6bfbc776495d7a3c` |
| **Sahih Muslim 2859** | `muslim:2859` | `5460` | 422 | `4c7f7aa0693e504dbbe6f82309dd0c15d7d9d1c66a04fa30aa402938c1279baa` |
| **Sahih Muslim 2653** | `muslim:2653` | `65038` | 313 | `edebe2c9c34cd15b472b28216a14a8e42fb79ad17ec1ba865cd3a8b39f752c16` |
| **Sahih Muslim 2664** | `muslim:2664` | `5493` | 543 | `a249a17d98eaccd187c1566608690c8519f1dfd9a30e729ed7b5f3d1d9b05a49` |
| **Sahih Muslim 16** | `muslim:16` | `65000` | 364 | `0095a7e0820be67dbdd9e3206a1913d95eb2ddecfd96998a635bc745d7cb6a9c` |
| **Sahih al-Bukhari 528** | `bukhari:528` | `4968` | 404 | `3ce42af3809e1d2170017f9d3932ac7bd51213dd8feda414733c2759fdc08d54` |
| **Sahih al-Bukhari 1397** | `bukhari:1397` | `3689` | 592 | `f3ff017718c6d331f946b87bf1ed5e55630ec246e3a59ce0b7c725350936969a` |
| **Sahih Muslim 15** | `muslim:15` | `65003` | 405 | `6fee64c862636b57aff7e33cd22e0d1242c256ab594133836042ef5f648a0eb3` |
| **Sahih al-Bukhari 1521** | `bukhari:1521` | `2758` | 291 | `e3ea18090673d180b8b547df88e76d78f2522a6889cd980fa1a8bd9028a669ea` |

---

## Canonical vs. Provider Separation

The canonical numbering (e.g. Sahih Muslim 8) remains strictly separate from the provider database ID (HadeethEnc 4563). The provider record ID is stored exclusively in `sourceRecords[0].providerRecordId` and `translations[0].providerRecordId`.

---

## Activation State Semantics

- **Current State**: `translation-approved`
- **Meaning**: The English translation is approved for internal display and redistribution under the documented HadeethEnc terms.
- **Arabic Text**: Remains `null` / unapproved. The activation state is **NOT** `fully-approved`.
- **Pure Resolver Status**: Returns `resolved-translation-approved`.

---

## Deterministic Ingestion Tooling

The deterministic ingestion script is located at:
`scripts/import-hadeethenc-m9h.mjs`

To re-ingest or verify upstream releases:
```powershell
node scripts/import-hadeethenc-m9h.mjs <optional-path-to-xlsx>
```

The script:
1. Validates the row 1 manifest transcript.
2. Validates the row 2 column header positions.
3. Selects only the approved IDs.
4. Generates the frozen production module `content/hadith/hadeethenc-en-v1.25.0.mjs`.
5. Asserts that the read-only source workbook remains completely untouched.

---

## No Complete-Corpus Claim

Registering `bukhari` and `muslim` collections does **NOT** claim or imply that complete corpora exist in Mushaf Companion. Only the 11 individually vetted hadith records have approved internal English translations in M9H-2A.
