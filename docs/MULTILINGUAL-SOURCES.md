# Multilingual Quran Translation Sources

This document records the source-registry foundation. It does not enable a translation selector or expose a new translation in the reader. All registry entries remain disabled by default. The approved Amharic source now has a separate verified storage foundation documented in `docs/TRANSLATION-PACKS.md`; no reader UI consumes it. The existing Saheeh International translation continues through the legacy singular resource in `app/content-manifest.ts`; Ibn Kathir resource 169 is unchanged.

## Activation policy

A translation can be enabled through the registry only after all of the following are present and verified:

- Exact provider and provider-resource identity.
- Translation title, translator or responsible organization, and original publisher.
- Language, BCP-47 and ISO 639-3 identifiers, script, and direction.
- License, documented permission, required attribution, redistribution rights, offline-storage rights, modification restrictions, and commercial-use status.
- Edition version, package revision, publication date, and update date.
- Exactly 114 surahs and 6,236 ayat using the canonical chapter boundaries.
- No missing, duplicate, empty, invalid, or wrong-script verse records.
- SHA-256 checksums for the raw package and deterministic normalized JSONL representation.
- Retrieval and validation dates.

Missing information is represented explicitly and blocks activation. The application must never replace an unavailable requested language with English or another provider result.

## Registered candidates

All checksums below were calculated from the exact provider responses retrieved on 2026-08-07. Normalized checksums use `translation-record-jsonl-v1`: records sorted by canonical `chapter:verse`, with exact translation and footnote strings serialized as one JSON object per line.

| Source ID | Language / script | Translator; organization; publisher | Status | Edition / revision | Coverage | Offline status |
| --- | --- | --- | --- | --- | --- | --- |
| `quranenc:amharic_zain` | Amharic (`am`, `amh`), Ethiopic, LTR | Muhammad Zain Zahruddin; Africa Academy; publisher: Africa Academy | Approved candidate; registry disabled; storage-only pack foundation; not exposed in the reader | `1.0.1`; `1.0.1-xml.1`; published 2024-06-11; updated 2026-01-20 | 114 surahs, 6,236 ayat; no missing, duplicate, empty, invalid, or wrong-script records | QuranEnc permits download and republication under its conditions; explicit verified installation is supported by `app/translation-packs.mjs` |
| `quranenc:somali_yacob` | Somali (`so`, `som`), Latin, LTR | Abdullah Hasan Yaqoub; responsible organization not confirmed; publisher not confirmed | Blocked | `1.0.26`; `1.0.26-xml.1`; published/updated 2025-09-04 | 114 surahs, 6,236 ayat; no missing, duplicate, empty, invalid, or wrong-script records | Technically permitted by QuranEnc terms, but activation and pack creation are blocked until publisher/responsible-organization attribution is confirmed |
| `quranenc:oromo_ababor` | Afaan Oromoo (`om`, `orm`), Latin, LTR | Gali Ababor Abaghona; publisher not confirmed | Blocked | `1.0.3`; `1.0.3-xml.1`; published/updated 2025-07-13 | 114 surahs, 6,236 ayat; no missing, duplicate, empty, invalid, or wrong-script records | Technically permitted by QuranEnc terms, but activation and pack creation are blocked until original publisher attribution is confirmed |
| `quran-foundation:translation:20` | English (`en`, `eng`), Latin, LTR | Saheeh International; Quran Foundation content services; publisher: Saheeh International | Existing online legacy source; new registry disabled | Quran.com resource `20`; registry revision `2026-08-06-resource-20-legacy-online`; upstream publication date not supplied | 114 surahs and 6,236 non-empty exact-resource records in the audit response | Permanent storage prohibited by registry policy without express Quran Foundation permission; no permanent pack URL is registered |

## Checksums

| Source ID | Raw SHA-256 | Normalized SHA-256 |
| --- | --- | --- |
| `quranenc:amharic_zain` | `3b765a67dc43eb54fc08518c66964ea246209c1284def73d1a69d8c7663780f9` | `77ac2ad5f35ba878b07bc7aed9f233ee418a6f43dbe4d095d6ae32f3153ffb13` |
| `quranenc:somali_yacob` | `32b315a18f33ae4abe89dba8042fbb60be3ac94e85cbf63c8f042f96ee6ad5ff` | `18e728f1254649d581e004084d4b74176c690042d7455842591156a03aea4536` |
| `quranenc:oromo_ababor` | `585d0dab94f5361a4ba077037e66df815632805abc6e160f6ca79d08dda137b2` | `cc733e686cf50904e453d7714534bfc0296f53f7d4c3129357634bee9ad23b8f` |
| `quran-foundation:translation:20` | `5b9a94b31978b3255698572dfe071c4a5f0c25bac070ecfedfd2eacd38ac4984` | `ec543b89673694120b424e8dbbc226adef588e63afb08e607d901886f833acc7` |

## Source attribution and licensing

### QuranEnc candidates

- Source catalog and package provider: [QuranEnc](https://quranenc.com/en/).
- Amharic catalog: [Africa Academy Amharic translation](https://quranenc.com/en/browse/amharic_zain).
- Somali catalog: [Abdullah Hasan Yaqoub Somali translation](https://quranenc.com/en/browse/somali_yacob).
- Afaan Oromoo catalog: [Gali Ababor Oromo translation](https://quranenc.com/en/browse/oromo_ababor).
- QuranEnc permits translation downloads and republication when content is not modified, publisher and QuranEnc attribution is displayed, the version and transcript metadata are retained, update notices are followed, and inappropriate advertising is excluded.
- Each enabled source must display its source-specific attribution verbatim from the registry.

### Existing English translation

- Translation: Saheeh International.
- Provider: Quran Foundation/Quran.com resource 20.
- Attribution: “Saheeh International translation displayed from Quran Foundation/Quran.com resource 20.”
- The [Quran Foundation Developer Terms](https://api-docs.quran.foundation/legal/developer-terms/) prohibit storing Quran Foundation content for more than one week without express permission. Resource 20 therefore remains online-only and outside the future permanent-pack activation path.

### Existing tafsir

Ibn Kathir (Abridged), Hafiz Ibn Kathir, Quran Foundation resource 169, revision `2026-08-06-resource-169-v1`, remains exactly as defined in `app/tafsir-source.mjs`. The translation registry does not register, translate, modify, or package tafsir.

## Audit command

Run the deterministic source audit against the exact registered provider resources:

```bash
npm run audit:translations
```

For a metadata-only check without network acquisition:

```bash
npm run audit:translations -- --registry-only
```

For one exact source:

```bash
npm run audit:translations -- --source quranenc:amharic_zain
```

The audit rejects provider-ID or revision mismatches, DTD/entity-bearing or oversized XML, malformed UTF-8, unsafe provider markup, wrong chapter boundaries, missing/duplicate/empty verses, unexpected script, and checksum drift. It writes no translation package and never activates a source.

## Approving another translation

1. Obtain an authoritative catalog record and exact downloadable or API resource identifier.
2. Record the translator, responsible organization, original publisher, language/script identifiers, edition, revision, dates, license, and every rights field. Do not use placeholders for activation.
3. Add the source through `createDiscoveredSource`; it must remain `enabled: false`.
4. Implement or select a provider adapter that verifies the exact requested provider and resource ID before acquisition.
5. Retrieve the exact package through the audit path. Never scrape, combine sources, or use a first-result fallback.
6. Verify 114 surahs, 6,236 canonical verse keys, non-empty values, script, raw SHA-256, and normalized SHA-256.
7. Obtain human review of the attribution and permission record. Resolve every blocker in the registry and documentation.
8. Run lint, the full test suite, the production build, and `npm run audit:translations`.
9. Enable the source and expose it in the reader only in a later, separately reviewed milestone. Storage foundations and UI exposure must remain independently reviewable.
