# Guided Islamic Education Platform (M9A)

Status: architecture complete; no production guided curriculum is approved or active.

## Product boundary

Learn is a structured-learning hub. It coordinates links to Today’s Study, Hifz/My Mushaf, vocabulary, Tajweed, private notes, and reader study without taking ownership of those domains. The existing Read → Ayah Study Lens workflow, its selected-ayah state, and its Overview, Words, Tafsir, Practice, Notes, and Evidence tabs remain unchanged.

M9A does not create, infer, paraphrase, translate, or activate Islamic lesson content. The production education registry contains only a disabled, empty reference provider used to exercise the unavailable state. It contains no substantive teaching.

## Education source contract

`app/education-content.ts` defines a source-neutral hierarchy:

- course → ordered modules → ordered lessons;
- structured plain-text lesson blocks (`heading`, `paragraph`, `list-item`, or `reflection`);
- explicit objectives and knowledge checks;
- citations represented separately from prose;
- exact source ID and revision on every catalog.

Arbitrary provider HTML is not accepted. Text containing markup delimiters or control characters fails validation, and unexpected object fields fail the exact structured-content schema.

### Activation requirements

An education provider activates only when all of the following match independent pins:

1. enabled provider and exact provider/source identity;
2. author, responsible organization, source title, HTTPS origin, and source URL;
3. an approved scholarly-review record with named reviewers, their roles, review time, approval reference, and scope statement;
4. exact revision, SHA-256 checksum, and normalization version;
5. explicit application, redistribution, bundling, offline, and modification rights;
6. delivery capabilities compatible with those rights;
7. independent integrity verification of the canonical, key-ordered catalog serialization matching the pinned checksum;
8. a successful runtime audit matching identity, reviewers, integrity, and coverage;
9. a structured catalog whose counts, parent/child sequences, IDs, citations, and knowledge checks pass validation;
10. every Quran citation resolves through the existing trusted verse lookup boundary.

Missing, unknown, mismatched, malformed, or throwing boundaries fail closed. Before verification, provider data is copied into a canonical snapshot with no provider-owned nested references. The snapshot is deeply immutable, its exact serialization is the checksum input, and only that snapshot can be reconciled, audited, cached, or returned. Provider mutation during audit and consumer mutation after activation therefore cannot alter later reads. Successful activation is cached; failed activation is not treated as approved content.

## Citations and Evidence Layer separation

Lesson citations are provider-scoped source references. They are not M8 Evidence Layer edges and do not assert an ayah-to-ayah relationship.

- Quran citations contain an exact canonical verse key and are re-resolved through `ReaderContentTransport.lookupVerse` before navigation.
- Other source citations require a work ID, title, edition, locator, and HTTPS source URL.
- No citation or relationship is derived from lesson prose, tafsir prose, translations, roots, keywords, private notes, embeddings, or AI output.
- M8’s independently approved evidence-provider semantics and runtime remain unchanged.

## Local progress and scheduling

`app/education-state.mjs` stores education progress separately from Hifz and vocabulary:

- exact source ID and revision;
- active course and current lesson/section;
- per-lesson in-progress/completed state;
- per-knowledge-check Again/Hard/Good/Easy history, due dates, intervals, counts, and lapses;
- bounded device-local activity dates.

Knowledge checks reuse `app/review-schedule.mjs`. Backdated ratings are rejected before mutation, while same-day and forward reviews retain monotonic study history and due dates. A different source ID or revision cannot mutate or silently remap existing progress. Old progress remains portable even when its exact source revision is no longer available.

Education progress has both record-count limits and a 750,000-character serialized ceiling. History is pruned oldest-first before current check or lesson state, keeping the education domain comfortably below the bounded preference and portable-backup document limit. A preference or backup that still exceeds the whole-document limit fails before it is written or returned rather than producing a saved record that cannot be read back.

Today’s Study schema v2 adds `education-review` and `education-lesson`. Its deterministic priority is due Hifz, due education, due vocabulary, the next approved education lesson, new approved vocabulary, then reading. A grouped education-review snapshot tracks the first remaining exact target and advances across checks and lessons; resume reopens that target and completion is recorded only after every pinned check is reviewed. When education is unavailable, the existing Hifz/vocabulary/reading plan is unchanged.

## Private lesson notes

Study Notes schema v2 adds source-pinned lesson/section anchors. Existing schema-v1 ayah and word notes normalize losslessly to schema v2. Lesson notes retain source ID, revision, course, module, lesson, and optional section identity.

If a course revision becomes unavailable, the private note remains preserved, searchable, exportable, and deletable. Navigation back into the unavailable lesson is blocked; the anchor is never silently remapped.

## Preference migration

Preference schema v8 adds the independent `education` section. Loading checks `mushaf:preferences-v8` first and migrates v7 through v2 section-by-section. Portable restore accepts v2–v8, rejects future schemas, and preserves all reader, bookmark, Hifz, vocabulary, Today’s Study, note, audio, and download state.

## Server and GitHub Pages

The shared `ReaderContentTransport` exposes `loadEducationCatalog`:

- server mode uses the thin `/api/education/catalog` route;
- Pages mode constructs the same production registry in the browser and uses the same trusted Quran lookup implementation;
- both currently return the explicit disabled state without loading content.

The Pages build first evaluates the production education registry and aborts unless its release is explicitly disabled. Its artifact records `education.bundled: false`, zero courses/lessons, no source identity, and an empty education-artifact declaration. Both the builder and the independent verifier enforce an explicit inventory for every file in `_site`, then scan the whole tree, including public-derived paths and compiled JavaScript, for undeclared curriculum-shaped payloads. An extra static or public-derived file fails even when its name does not advertise education content; suspicious education paths and payloads fail independently. A future Pages package must be declared by exact relative path, media type, and SHA-256 checksum after the provider passes activation and its redistribution, bundling, and offline rights explicitly permit packaging.

## Production approval and release process

1. Obtain the exact curriculum and authoritative provider record. Do not copy reference or sample lessons into production.
2. Record author, organization, source title, edition/revision, audience, language, and provider origin.
3. Obtain a written rights decision covering application use and the intended delivery path. Unknown rights block release.
4. Obtain named qualified scholarly review of the exact revision, with approval reference, date, roles, organizations, and scope statement.
5. Normalize only into the supported structured plain-text schema and calculate the exact SHA-256 checksum.
6. Add an independently pinned approval record. Provider self-claims alone are insufficient.
7. Run the provider audit, full catalog validation, and trusted Quran-citation reconciliation.
8. Add tests using the exact identity and a reviewed fixture subset without weakening fail-closed tests.
9. For Pages, document bundling rights and add each package to the explicit release artifact declaration with its exact path, media type, and SHA-256 checksum. Otherwise keep the provider remote-only.
10. Complete human content, attribution, accessibility, responsive, offline, and rollback review before enabling the provider.

Activation, UI exposure, and Pages packaging should remain independently reviewable changes.
