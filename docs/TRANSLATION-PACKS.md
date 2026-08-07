# Verified Translation Packs

This storage foundation installs only the verified QuranEnc Amharic source `quranenc:amharic_zain`. It does not add a translation selector, change reader rendering, or enable any source in the source registry. The existing online Saheeh International resource 20 and Ibn Kathir tafsir remain outside this subsystem.

## Pinned Amharic pack

| Field | Pinned value |
| --- | --- |
| Provider / resource | QuranEnc / `amharic_zain` |
| Edition / revision | `1.0.1` / `1.0.1-xml.1` |
| Language | Amharic (`am`, `amh`), Ethiopic, LTR |
| Coverage | Exactly 114 surahs and 6,236 canonical ayat |
| Raw XML SHA-256 | `3b765a67dc43eb54fc08518c66964ea246209c1284def73d1a69d8c7663780f9` |
| Normalized JSONL SHA-256 | `77ac2ad5f35ba878b07bc7aed9f233ee418a6f43dbe4d095d6ae32f3153ffb13` |
| Normalization | `translation-record-jsonl-v1` |

The installer uses the exact registry provider name, resource ID, URL, edition revision, coverage, and checksums. It rejects wrong-provider responses, raw checksum drift, normalized checksum drift, malformed or unsafe content, missing or duplicate verse keys, empty translations, non-Ethiopic translation records, and any chapter boundary that differs from the canonical 114-surah layout.

## IndexedDB schema

Translation data uses `mushaf-translation-packs-v1`, schema version 1. This is a separate database from `mushaf-offline-audio-v1`; the translation service never opens or changes offline-audio storage.

| Object store | Key | Purpose |
| --- | --- | --- |
| `packs` | `packKey` | Immutable verified version metadata. Indexed by `sourceId`. |
| `verses` | `id` = `packKey\|verseKey` | Immutable normalized translation and footnotes. Indexed by `packKey`; the compound `packVerse` index is unique. |
| `state` | `sourceId` | Mutable active and previous pack pointers, activation timestamp, and an observed update notice. |
| `installs` | `installId` | Staging journal used to identify and remove interrupted installations. Indexed by `sourceId`. |
| `locks` | `sourceId` | Expiring owner/operation lease that serializes install, update-check, repair, rollback, deletion, and cleanup operations across tabs. |

The immutable version identity is:

```text
sourceId@editionRevision#normalizedSha256
```

There is no API that updates a stored pack or verse in place. Repair removes a corrupt version and performs a new verified staged installation under the same immutable identity.

## Install and activation lifecycle

1. Resolve the exact source registry entry and fail before acquisition unless it is the approved Amharic source with permanent offline-storage permission.
2. Acquire the per-source lease and remove only expired, interrupted staging journals.
3. Download through the QuranEnc adapter with no fallback provider or resource.
4. Normalize and verify raw SHA-256, normalized SHA-256, exact 114/6,236 coverage, canonical boundaries, text safety, and Ethiopic script.
5. Check `navigator.storage.estimate()` headroom when available.
6. Create an `installs` journal, then stage all 6,236 records in bounded IndexedDB transactions. The current active pointer is unchanged during staging.
7. Read the staged records back and recompute the normalized checksum.
8. In one IndexedDB transaction, add immutable pack metadata, move the current active pointer to `previousPackKey`, point `activePackKey` to the new version, and remove the staging journal.
9. Write a small `localStorage` sentinel after activation. IndexedDB remains authoritative; the sentinel exists only to detect later browser storage reclamation.

Any download, validation, quota, staging, or readback failure removes the staging journal and staged records. Because activation is only the final pointer transaction, the previous active version remains readable after failure or interruption.

## Updates and rollback

`checkForUpdate()` stores the observed upstream revision and check time in `state`. It reports `replacementPerformed: false` and never downloads, installs, activates, or deletes a version. A newly observed revision must first be reviewed and pinned in the source registry before a later explicit installation can accept it.

Each successful activation retains the former active version as `previousPackKey`. `rollback()` first recomputes that version's normalized checksum, then atomically swaps the active and previous pointers. Missing or corrupt rollback data fails closed.

## Repair, deletion, and reclamation

- `verifyActive()` reads all active records and verifies their canonical coverage and normalized checksum.
- `repair()` returns without writes for a healthy pack. For a missing or corrupt active pack, it removes the bad version and explicitly repeats the pinned download, staging, verification, and activation process.
- `deleteVersion()` removes one version and its verses. Deleting the active version moves the verified previous version into the active slot when one exists.
- `deleteSource()` removes every installed Amharic version, state, staging journal, and reclamation sentinel.
- `cleanupInterruptedInstalls()` deletes expired staging journals and their orphan verse records while leaving live leased operations untouched.
- `detectStorageReclamation()` compares the sentinel with IndexedDB. A missing active state, pack metadata record, or incomplete 6,236-record set is reported as reclaimed and can be repaired explicitly.

## Repository and service access

`IndexedDbTranslationPackRepository` provides version-scoped `getRecord(packKey, verseKey)` and ordered `getRecordsByVerseKeys(packKey, verseKeys)` access. `TranslationPackService` resolves the active immutable version and exposes:

- `getByVerseKey(verseKey)` for one canonical `chapter:verse` key.
- `getByPageVerseKeys(verseKeys)` for the reader page's ordered verse keys, preserving order and duplicates and returning `null` for every key when no pack is active.

These are storage APIs only. They are not wired into reader UI in this milestone.

## Sources that remain blocked

- `quranenc:somali_yacob`: source registry remains disabled and pack installation fails before acquisition because publisher/responsible-organization attribution is unresolved.
- `quranenc:oromo_ababor`: source registry remains disabled and pack installation fails before acquisition because original publisher attribution is unresolved.
- `quran-foundation:translation:20`: existing Saheeh International stays online-only. Permanent offline storage fails before acquisition because the documented terms permit temporary storage only.

No fallback to English or another source is performed.

## Validation

Run the focused lifecycle tests with:

```bash
node --experimental-strip-types --test tests/translation-packs.test.mjs
```

The focused suite covers successful staged activation, raw/normalized/record corruption, interrupted-install cleanup, rollback, version/source deletion, install/update concurrency, quota failure, browser-storage reclamation and repair, update detection without replacement, and all three blocked permanent-pack sources.
