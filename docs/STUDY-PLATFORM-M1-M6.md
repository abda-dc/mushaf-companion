# Study Platform M1–M6

Status: local implementation and inspection record. This is not a production release or a source-approval decision.

## Repository baseline

- Target: `C:\Users\Kiya\Documents\Mushaf`
- Starting branch: `codex/standalone-github-pages-pwa`
- Starting HEAD: `deaabffeb78800ee9041cd4ac18f702628869be9`
- Package manager: npm (`package-lock.json`)
- Pre-existing working-tree state: untracked `resources/` containing branding/web-manifest images. It is user-owned and outside this work.
- Relevant commands: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `node --experimental-strip-types --test tests/*.test.mjs`, `npm run test`, `npm run build:pages`, `npm run verify:pages`, `npm run audit:content`, and `npm run audit:translations`.

## Inspection summary

### Mushaf Companion

The target already provides the architectural seams needed by the six milestones:

- `app/page.tsx` owns one `selectedVerseKey` shared by page selection, translation, tafsir, audio, bookmarks, Hifz, search navigation, and the existing Ayah Context Lens.
- `app/ayah-context-lens.tsx` is a fixed desktop drawer/mobile bottom sheet outside the Mushaf reading surface. It already has modal semantics, a focus trap, Escape handling, focus return, translation-source attribution, verified offline-pack gating, and reused Ibn Kathir content.
- `app/quran-data.ts` and `app/content/quran-runtime-source.ts` preserve page, line, verse, and upstream word IDs. The normalized page has exactly 15 line slots and a verified page checksum.
- `app/content/source-registry*.ts` establishes a fail-closed precedent for provider identity, edition, rights, coverage, checksums, activation, and offline-storage policy.
- `app/hifz-state.mjs` already contains local-calendar date math, activity/streak logic, Again/Hard/Good/Easy ratings, deterministic due dates, 5/10/20-minute limits, due-first planning, and 604-page mastery mapping.
- `app/preferences.mjs` provides versioned local persistence, legacy migration, normalization, JSON backup, and restore.
- Existing translations, tafsir, audio, offline audio, Tajweed explanations, search, bookmarks, page navigation, reading resume, theme, and Hifz must be reused and regression-tested.

Reusable components and state:

- Reuse the fixed Context Lens shell as the Study Lens; do not create a competing panel.
- Keep `selectedVerseKey` authoritative and add only a word coordinate anchored to it.
- Reuse `moveStudyAyah`, `goToPage`, `openVerse`, audio playback, `toggleMemorized`, and the current tafsir fetch/cache.
- Generalize review primitives where safe, while keeping Hifz and vocabulary records separate.
- Extend the preference document and portable backup instead of adding a second storage key.

### DaruNurIslamicApp

The current mobile reference is a small closed-testing preview with sample data rather than a production scheduling engine. Reusable product ideas are the restrained current-memorization card, visible review queue, goal progress, and at-a-glance streak. Its sample records, achievement presentation, visual design, and lack of persistent scheduling must not be copied.

### NurPathQur'an

Useful patterns include an explicit reader context, practice launched from the selected ayah, audio repeat controls, cached local reader settings, touch-sized ayah actions, and keeping Mushaf and study modes conceptually distinct. Its API-dependent bookmark store, broad dashboard navigation, separate reader selection objects, and server persistence do not fit Mushaf Companion's local-first static architecture and must not be copied.

The repository also contains a source-neutral vocabulary contract and rights-decision model. Its strongest reusable idea is that `review-required` and `blocked` sources fail import approval. It intentionally contains no production Foundation 125 data.

### NurPath-Qur'an-vocab

The reference models ranked lemmas, roots, distinct orthographic occurrences, curriculum tiers, search filters, local progress, export, due-first sessions, and Again/Hard/Good/Easy scheduling. Its source documentation identifies Quranic Arabic Corpus morphology v0.4, an original SHA-256, GPL terms, and corpus-specific conditions.

No QAC-derived morphology, gloss, root, lemma, frequency, curriculum, or occurrence record will be copied into Mushaf Companion during this work. Possession of a reference copy and its notice is not an approval to transform or redistribute it in this target. The target will ship a source-neutral contract, an explicit disabled provider record, and synthetic test fixtures only.

## Components and patterns not to copy

- No generic dashboard replacing the page-faithful reader.
- No permanent vocabulary navigation item or panel that reduces Mushaf width.
- No second selected-ayah, audio, tafsir, bookmark, Hifz, persistence, streak, or daily-planner system.
- No reference database, cloud account, server bookmark API, or full-corpus payload in the initial reader bundle.
- No sample/demo Arabic vocabulary displayed as authoritative production content.
- No guessed roots, lemmas, meanings, morphology, frequency, coverage, or occurrence totals.
- No browser speech presented as verified Quran recitation or isolated-word audio.

## Proposed architecture

### M1 — Study Lens

Evolve `AyahContextLens` into a calm Study Lens. M1–M6 introduced Overview, Words, Tafsir, and Practice; M7–M8 subsequently added Notes and Evidence. Overview reuses translation and ayah identity; Tafsir reuses the current normalized document; Practice delegates to existing audio and Hifz callbacks. It remains a fixed overlay so it cannot change the 15-line page geometry.

### M2 — word-study foundation

Add a lazy, source-neutral `word-study` domain with:

- `WordCoordinate`: `verseKey`, one-based `wordPosition`, `page`, `line`, and the authoritative source word ID where the page source supplies one.
- `QuranWordStudyRecord`: stable provider-scoped ID, surface linkage, optional meaning/transliteration/lemma/root/morphology, and provenance.
- Distinct lemma, root, occurrence, vocabulary-entry, curriculum, and provider metadata types.
- A provider registry with disabled-by-default registration and approval/audit gates.
- Audits for canonical verse keys, positions, page/line bounds, duplicate identities and occurrences, malformed linguistic identifiers, missing mappings, unsupported versions, incomplete provenance, and attempted use of disabled/unapproved providers.

The authoritative Arabic remains `PageWord`; word-study records may annotate but can never replace it.

### M3 — word selection

Derive a deterministic one-based content-word position from the ordered non-end words of an ayah. Keep `selectedWord` in `app/page.tsx`, clear it on unrelated navigation, and pass it to the Study Lens. A word click preserves Tajweed behavior and opens one coherent word context. Only source-backed fields render. Without an approved provider, the UI explains that study metadata is unavailable and still exposes Tajweed and **Hear in Ayah** accurately.

### M4 — Foundation 125

Add a curriculum/provider loader and a separate normalized vocabulary progress record using shared calendar and rating semantics. Foundation 125 remains disabled until an explicitly approved 125-entry source passes audit. Test fixtures exercise learning, due, strong, migration, backup/restore, and deterministic scheduling without entering the production registry.

### M5 — occurrence explorer

Expose provider queries by lemma and root. Results are audited `WordCoordinate` values only. Navigation resolves the verse through the existing trusted lookup, opens its page, selects the ayah, and requests the matching word position. With no approved provider the explorer is present but unavailable; it never shows guessed counts.

### M6 — Today's Study

Extend My Mushaf with one daily plan composed from due Hifz, due vocabulary, new vocabulary (only when the curriculum is available), and continue reading. Due work precedes new content. The 5/10/20-minute budgets are deterministic, the session can be skipped or exited, and completion records meaningful activity. Existing Hifz progress and streak semantics remain intact; unified activity is additive and version-migrated.

## Source and provenance requirements

Every word-study provider must record provider and dataset IDs, edition/version, revision, stable source URL, license name/URL, attribution, redistribution/offline/modification status, checksum algorithm/value where applicable, normalization version, coverage counts, audit timestamp/status, and explicit approval status. Production resolution requires all of the following:

1. provider enabled;
2. exact schema/version supported;
3. rights and attribution complete;
4. explicit approval for the requested use case;
5. integrity and coordinate audit passed;
6. `provider.audit()` ran successfully and returned a verified identity matching the metadata source, dataset, revision, algorithm, checksum, and declared counts;
7. no duplicate or invalid mappings.

The registry does not use self-declared `auditStatus` as activation evidence. A checksum-shaped declaration is metadata, not proof: activation accepts content only after a provider audit reports `integrity.status: "verified"`. The generic in-memory dataset audit deliberately reports `declared-only`; a future production adapter must perform and own the actual dataset verification before it may return `verified`.

Failure at any step returns no study content and never blocks Quran page rendering.

Current source status:

- Mushaf Arabic, lines, Tajweed, translation, and transliteration: existing Quran Foundation content pipeline and manifest.
- Tafsir: existing Ibn Kathir (Abridged), Quran.com resource 169.
- Audio: existing reciter manifest and verified offline-pack system.
- Word study/morphology/vocabulary: no approved production provider. The QAC reference is disabled/unapproved for target import.

## Milestone dependencies

1. M1 establishes the shared UI surface and callbacks.
2. M2 establishes coordinates, providers, audits, and provenance.
3. M3 connects page words to M1 through M2 coordinates.
4. M4 consumes provider-backed vocabulary entries and shared review primitives.
5. M5 consumes audited lemma/root occurrences and trusted navigation.
6. M6 composes existing reading/Hifz state with M4 state.

## Migration and performance risks

- Preference schema migration must preserve v2–v4 data and all Hifz records.
- A one-based word position must consistently exclude ayah-end markers and must be tested across line breaks.
- Upstream word IDs are edition-scoped authoritative anchors. Where the rendered page supplies one, it is required together with verse, content position, page, and line; editions with different position semantics need an explicit audited crosswalk.
- The page fetch must not wait for word-study data. Providers are queried only after opening the Words surface.
- No full morphology corpus belongs in `page.tsx`, the main bundle, or static Pages artifacts without a future approved, profiled import design.
- Word selection and Tajweed must share one click target without nested dialogs or unsafe source HTML.
- Cross-page navigation needs a pending word coordinate, cleared if the destination mapping does not match.
- Local state must be bounded and normalized so malformed backups fail safely.
- Today/streak calculations must use local calendar keys, never UTC date slicing.

## Test strategy

- M1: source-level integration plus reducer tests for opening/closing, shared ayah identity, next/previous and page edges, tabs, translation/tafsir/audio/Hifz callbacks, focus trap, Escape, and responsive fixed overlay.
- M2: unit tests for coordinate stability, provider registration, disabled/unapproved behavior, provenance/version validation, malformed roots/lemmas, duplicates, invalid pages/lines/positions, and missing mappings.
- M3: unit and source-integration tests for word-position derivation, selection clearing/remapping, Tajweed coexistence, keyboard access, supported-field omission, and **Hear in Ayah** labeling.
- M4: scheduler, status, progress, curriculum audit, unavailable source, persistence migration, backup/restore, and corruption tests using fixtures only.
- M5: fixture-provider root/lemma lookup, exact audited counts, deduplication, invalid mapping rejection, and destination word selection.
- M6: due-first ordering, deterministic 5/10/20-minute budgets, resumption/completion/skipping, day boundaries, Hifz compatibility, vocabulary compatibility, and unified activity.
- Regression gates: lint, TypeScript, focused milestone tests, full tests, production build, content audits, Pages build, and Pages verification. Existing 604-page/page-fidelity, search, bookmarks, resume, theme, settings, translation, tafsir, audio, offline audio, Tajweed, Hifz, mobile, and static behavior remain release gates.

## Known limitation carried into implementation

Without an approved word-study dataset, M2–M6 can provide complete contracts, interaction, scheduling, persistence, auditing, and unavailable states, but production meanings, morphology, roots, lemmas, Foundation 125 lessons, and occurrence results must remain disabled.

## Implemented architecture

### M1 — Ayah Study Lens

The existing `AyahContextLens` is now the shared Study Lens. Its six tabs are Overview, Words, Tafsir, Practice, Notes, and Evidence. It retains the fixed desktop drawer/mobile sheet, modal semantics, focus trap, Escape handling, and focus return. `selectedVerseKey` in `app/page.tsx` remains authoritative. Translation packs, normalized Ibn Kathir, recitation, Hifz, and Tajweed actions are reused through callbacks; none were reimplemented.

### M2 — word-study domain

`app/word-study.ts` defines source-neutral word, coordinate, meaning, lemma, root, morphology, occurrence, provenance, provider, dataset, and audit contracts. The registry requires structurally valid metadata, a supported source/revision/checksum algorithm, explicit approval and enablement, an approval reference, HTTPS source/license references, permitted redistribution/offline/modification rights, integrity metadata, and declared coverage. It then runs the provider audit and caches content access only after the returned verified identity and counts match.

Dataset audits reject non-canonical verse keys, out-of-range page/line/position values, duplicate IDs or coordinates, missing occurrence mappings, malformed linguistic identities, provenance mismatches, unsupported versions, and declared coverage mismatches. Runtime word and occurrence responses are also checked and fail closed.

`QAC_REFERENCE_METADATA` records the investigated Quranic Arabic Corpus morphology 0.4 reference and its checksum/attribution, but marks redistribution, storage, and modification as review-required. Its provider is disabled and returns no content.

### M3 — trusted word selection

`buildPageWordCoordinateIndex` derives one-based positions from ordered, non-end `PageWord` records while preserving verse, page, line, and source word ID. Provider records, occurrences, remapping, and highlight state must match that complete identity. The selected word is subordinate to the selected ayah and is cleared on normal ayah/page navigation. Tajweed rules and word study share the Lens. Unsupported fields are omitted, and the only available audio action is labeled **Hear in Ayah**.

### M4 — vocabulary curriculum and state

`app/vocabulary-curriculum.ts` requires a descriptor/document match for identity, level, source, revision, count, enabled/approval state, and approval reference. It activates the word provider and requires every one of the 125 unique, contiguous entries to resolve to the exact verified provider word ID and complete coordinate. The production descriptor is blocked and contains no entries.

`app/vocabulary-state.mjs` stores a bounded schema-v1 device-local record: curriculum/source identity, per-entry first/last study dates, due date, rating, interval, review count, lapses, bounded review history, activity dates, and daily-new goal. Status is deterministic (`not-started`, `learning`, `due`, or `strong`). A source-revision mismatch never silently remaps progress.

Hifz and vocabulary keep separate records but use `app/review-schedule.mjs` for the same deterministic Again/Hard/Good/Easy interval semantics. This avoids a second incompatible scheduler without combining the two learning domains.

### M5 — occurrence explorer

The provider boundary exposes distinct lemma and root queries with explicit `ok`, `unavailable`, and `error` results. Only a successful query may report authoritative zero. Results preserve the provider total, are validated against the query identifier and provider provenance, deduplicated by the complete word coordinate, and rejected as a whole when invalid. A latest-request gate prevents a stale root/lemma response, navigation, or closed Lens from overwriting current state. Navigation confirms verse/page identity with `lookupVerse`, loads the trusted page, remaps the full word coordinate, and highlights only an exact match.

The UI is scoped to the Words tab, offers all-Quran/current-surah filtering, and paginates in batches of 50. No estimated counts or guessed results are shown.

### M6 — Today’s Study

`app/today-study.mjs` composes one plan in this tested priority order:

1. due Hifz and first strength checks, budgeted at two minutes per ayah;
2. due approved vocabulary, budgeted at one minute per entry;
3. new approved vocabulary, budgeted at one minute per entry;
4. continued reading, budgeted at three minutes per page.

Plans accept only 5, 10, or 20 minutes and never exceed the selected budget. When Foundation 125 is unavailable, vocabulary tasks are omitted rather than synthesized. Starting a session snapshots the plan; a same-day duration change cannot replace it, and the selector is locked while work is pending. Step IDs are canonical and unique after restore. A reading step becomes completable only after its target page and ayah are reached and the step is recorded as started. Completion is idempotent, skip remains distinct, and only completion records activity. Exiting leaves the session resumable, while a stale prior-day session cannot be completed against a new local date.

My Mushaf presents the plan, due counts, reading resume, completion, and the union of existing Hifz, vocabulary, and study activity as a calendar-safe study rhythm. Original Hifz records and activity dates are preserved.

## Persistence and migration

Preference schema v7 preserves the v6 `vocabulary` and `study` domains and adds sectional private-note state to the existing local preference document and portable JSON backup. Loading probes v7, then v6 through v2, then fragmented legacy keys. Each domain normalizes independently; strict local-calendar validation rejects impossible dates, and malformed arrays, coordinates, session targets, note anchors, or incompatible schema versions fail safely. Entries, histories, steps, targets, notes, tags, activity dates, bookmarks, and raw backup JSON are bounded before expensive deduplication or scanning.

No account, server database, sync, analytics event, or cloud write was introduced.

## Performance and static deployment

The initial reader imports contracts and a disabled descriptor, not a Quran morphology corpus. Provider activation/queries occur only in the Words tab after a word is selected; Tafsir loads only in the Tafsir surface, and Amharic pack status is checked only in Overview. Occurrence lists render in batches of 50 while retaining the audited total. Word-study failures do not participate in page loading. All new user state uses the existing local preference path, so the feature adds no server-only runtime dependency to the static Pages application.

## Accessibility implementation

- Study Lens modal labeling, focus containment, and Escape remain intact. Close returns focus to a connected original trigger, remapped word, selected ayah, visible Study control, or the reader in that order.
- Tabs expose `tablist`/`tab`/`tabpanel` roles with roving focus and Arrow/Home/End behavior.
- Mushaf words and occurrence results use semantic buttons and descriptive labels; each word action's accessible name retains the trusted visible Arabic word text.
- Arabic values declare RTL/language context; UI copy remains LTR.
- Loading, failure, unavailable, and progress states use status, alert, or progressbar semantics.
- Desktop and mobile layouts remain overlays and preserve all 15 Quran lines.

## M7–M8 extensions

M7 Private Study Notes and the M8 evidence integration boundary extend this architecture without changing M1–M6 ownership. Notes use preference schema v7, freeze exact Quran anchors at draft start, and revalidate them on save. Evidence uses a separate independently pinned approval policy and is queried only from its Study Lens tab. See `docs/PRIVATE-STUDY-NOTES.md` and `docs/EVIDENCE-RELATIONSHIPS.md`.

M8 is architecture/source-integration ready pending an approved source; it is not a production evidence release. No production evidence provider is active and zero edges ship. No link is extracted from tafsir prose or inferred from word-study data. Private notes never become evidence.

## Future extension points

- Approve and register a rights-cleared word-study dataset without changing reader ownership of Arabic.
- Activate Foundation 125 only after the exact production curriculum and provider pass the documented audits.
- Add Core 250 or Expanded 500 as new curriculum descriptors rather than changing Foundation progress identity.
- Add a page/current-juz occurrence filter using verified chapter/juz mappings if an approved corpus makes result volume warrant it.
- Consider IndexedDB or chunked static provider assets only after an approved dataset is profiled; do not place a full corpus in the initial bundle.

## Current limitations

- Production meaning, transliteration, lemma, root, morphology, vocabulary lessons, and occurrence results are unavailable because no source is approved for target import and redistribution.
- The disabled Foundation 125 dashboard therefore reports `0 / 125`, zero due items, and an explicit source-approval requirement.
- Vocabulary session execution is implemented and fixture-tested at the state/planner boundary, but no production word lesson can be entered until the curriculum gate opens.
- The unified “study rhythm” is the union of preserved domain activity dates. It does not delete or reinterpret Hifz history.
- The open reader schedules a bounded refresh at the next local midnight and defensively recomputes the local day before study actions.
- TypeScript is not fully clean: the repository's seven pre-existing diagnostics remain outside the files changed for these corrections; no complete-TypeScript guarantee is claimed.
