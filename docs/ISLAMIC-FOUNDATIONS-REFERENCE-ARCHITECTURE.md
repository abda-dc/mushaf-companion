# Islamic Foundations Reference Architecture

## Purpose

M9R provides an extensible Islamic Foundations reference library under the Learn product area. It organizes vetted Qur'an coordinates, hadith citation metadata, and scholarly bibliographic metadata so a later interface can help a reader locate approved sources.

M9R is a reference library, not a course. Its data does not represent lessons, quizzes, grades, completion, mastery, review scheduling, or study targets.

## Reference-library semantics

Schema version 2 uses this hierarchy:

```text
library
  -> collections[]
       -> references[]
       -> topics[]
            -> references[]
```

A collection groups a broad subject and may carry overview references that support the collection as a whole. Each collection also contains topics, and each topic may carry its own vetted references. This permits sources such as Hadith Jibril to support an overview while more specific topics retain their own source records.

Collection, topic, and reference arrays are structurally expandable. The validator requires the initial core registry but does not require exactly ten collections, so future collections and topics can be introduced without a schema redesign. Collection IDs are unique, while topic and reference IDs are globally unique to keep future routing unambiguous.

## Islam, Iman, and Ihsan foundation

The initial organization begins with Islam, Iman, and Ihsan:

- **Islam** contains collection-level references for the overview of the Five Pillars, and five reference-ready topics (Shahadah, Salah, Zakat, Sawm, and Hajj) populated in Batch 1.
- **Iman** contains collection-level references for the overview of faith, and all six reference-ready topics for the Articles of Iman (Belief in Allah, Belief in the Angels, Belief in the Revealed Books, Belief in the Messengers, Belief in the Last Day, and Belief in Qadr) completed across initial migration and Batch 2.
- **Ihsan** contains a reference-ready meaning topic supported by the approved Hadith Jibril record.

These labels organize source navigation. They do not add unsourced doctrinal summaries.

## Initial collections

The required core registry contains ten collections:

1. Islam — Outer Practice & Submission (Reference-ready: 5 topics)
2. Iman — Inner Conviction & Faith (Reference-ready: 6 topics)
3. Ihsan — Spiritual Excellence (Reference-ready: 1 topic, Planned: 3 topics)
4. Tawhid — The Oneness of Allah (Reference-ready: 4 topics)
5. Qur'an and Sunnah — Primary Sources of Guidance (Reference-ready: 4 topics)
6. Akhlaq and Adab — Moral Character & Etiquette (Reference-ready: 6 topics)
7. Taharah — Purification & Cleanliness (Reference-ready: 4 topics)
8. Halal and Haram — The Lawful & The Prohibited (Reference-ready: 5 topics)
9. Du'a and Dhikr — Supplication & Remembrance (Planned: 4 topics)
10. Akhirah — Accountability & The Afterlife (Planned: 7 topics)

Total production status: **35 reference-ready topics**, **14 planned topics**, **132 total references** (64 Qur'an, 37 Hadith, 31 Scholarly).

The registry establishes the required production baseline, not a permanent upper limit.

## Topic status

Topics have one of two statuses:

- `reference-ready` means that at least one vetted production reference is present.
- `planned` means that source research is still pending and the production reference array must be empty.

A reference-ready topic is not required to contain one reference of every source type. A single vetted source can establish the initial entry and later source batches can expand it.

Planned topics are not yet source-complete. Their titles and descriptions are neutral navigation metadata only; their presence must not be interpreted as approved teaching content.

## Source and content policies

### Qur'an

Qur'an references store exact `verseKeys` coordinates and a display locator only. They use `internal-quran-navigation`. The library does not duplicate Arabic text, translations, tafsir, or interpretation.

Coordinates must be both syntactically valid and present in the approved coordinate whitelist. New source batches expand that whitelist intentionally; arbitrary coordinates fail closed. Ranges are expanded into exact verse keys, and duplicate keys within a reference are rejected.

### Hadith

HadeethEnc is the approved external hadith source for this version. Hadith records store canonical collection identity (`collectionId`, `collection`, `locator`), narrator when known, explicit grading metadata, HadeethEnc record ID (`sourceRecordId`), and an HTTPS source URL on `hadeethenc.com` (`sourceUrl`).

Under M9RH-1, Hadith references use `action: "internal-hadith-navigation"` and `contentPolicy: "metadata-only"`. They resolve through the Islamic Reference Hadith Bridge to internal M9H Hadith Reader targets (e.g. `hadith:muslim:8`), while the HadeethEnc `sourceUrl` remains preserved for provenance and external fallback. Translated hadith bodies, explanations, copied HTML, excerpts, and other external content are not bundled into M9R.

For detailed cross-domain integration documentation, see [ISLAMIC-FOUNDATIONS-HADITH-INTEGRATION.md](file:///C:/Users/Kiya/Documents/Mushaf-m9rh/docs/ISLAMIC-FOUNDATIONS-HADITH-INTEGRATION.md).

### Scholarly references

The approved scholarly publications are hosted by Alharamain's Message at `risala.prh.gov.sa` and identify the responsible organization as the Presidency of Religious Affairs at the Grand Mosque and the Prophet's Mosque:

1. *A Glimpse into the Islamic Creed* by Muhammad ibn Salih al-Uthaymin (`/en/content/81`)
2. *What A Muslim Must Know* compiled by the Scientific Committee under the Presidency of Religious Affairs at the Sacred Mosque and the Prophet's Mosque (`/en/content/251`)

Scholarly references use `external-link` and `contentPolicy: "metadata-only"`. The external book text is not bundled.

## Neutral copy policy

Production titles and descriptions identify subjects and help readers navigate references. They must remain neutral. Broad editorial outlines are not automatically approved as Islamic teaching text, and substantive doctrinal summaries require a separate, source-reviewed content process before production use.

## Fail-closed validation and immutability

The validator creates a structured clone before inspection so successfully validated data is detached from caller-owned input. It rejects malformed roots, unknown fields, unsupported schema versions or reference types, missing core registries, duplicate or malformed identities, invalid status/reference combinations, unsafe metadata, copied content fields, unapproved Qur'an coordinates, action-policy mismatches, insecure or unapproved external origins, incomplete citation metadata, and non-metadata-only external policies.

Only a fully valid detached library is returned. The validated result is deeply frozen, including collections, topics, references, Qur'an coordinate arrays, and hadith grading metadata.

## Model boundaries

M9R is independent of the M9 EducationCatalog and its course, module, lesson, progress, assessment, and study-target concepts. Reference readiness is source availability, not learner progress or mastery.

M9R is also independent of M8 Evidence. References in this library do not create evidence relationships, and the M9R schema does not depend on Evidence models.

## M9R-3 UI boundary

This milestone defines and validates the reference data only. Learn-panel integration, routing, browsing and search interfaces, bookmarks, notes, and other presentation behavior belong to M9R-3 or later work. UI code must consume this library without changing its reference-only semantics.

## Future content expansion

A future source batch should:

1. Research and approve sources for a planned topic or a new collection/topic.
2. Add citation metadata only, following the source-specific policy.
3. Expand the Qur'an coordinate whitelist only for reviewed coordinates introduced by that batch.
4. Change a topic to `reference-ready` only after at least one vetted reference is present.
5. Keep descriptions neutral unless substantive copy has completed a separate source review.
6. Add focused validation and regression tests for the new source set.
7. Validate and deeply freeze the complete production library before UI consumption.

Until that process is complete, planned topics remain empty placeholders and must not be presented as source-complete.
