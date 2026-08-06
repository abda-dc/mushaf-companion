# V2 product roadmap

> Foundation update — 2026-08-06: Phase 0 is complete in version 0.8.0. The gate now includes a versioned content manifest, fail-closed page checksums, preference migration, a 604-page/6,236-ayah source audit, and fourteen reviewed desktop/responsive baselines for seven representative pages.

This roadmap covers translations, tafsir, and offline audio without compromising the page-first reading experience.

## Prioritization model

Impact measures expected improvement to reading comprehension, retention, and reliable daily use. Effort includes product design, engineering, content licensing, content validation, QA, and release operations.

| Rating | Impact definition | Effort guide |
| --- | --- | --- |
| High | Benefits a large share of readers or protects trust in Quran content. | Large: approximately 3–5 engineer-weeks plus content review. |
| Medium | Improves an important workflow for a meaningful segment. | Medium: approximately 1–2 engineer-weeks. |
| Low | Useful refinement with limited effect on core reading. | Small: approximately 2–5 engineer-days. |

Estimates assume one product engineer with part-time design and qualified content review. They are planning ranges, not delivery commitments.

## Ranked initiatives

| Order | Initiative | Impact | Effort | Why it is ranked here |
| ---: | --- | --- | --- | --- |
| 0 | Page-fidelity and content-provenance gate | High | Medium | Every new layer depends on a trustworthy verse/page anchor. Fixing line geometry and recording source editions prevents translation or tafsir from attaching to the wrong content. |
| 1 | Translation MVP | High | Medium | Delivers immediate comprehension value with limited storage and playback complexity. It can reuse the current selected-ayah model. |
| 2 | Real settings and content-layer architecture | High | Medium | Makes translation, tafsir, reciter, display, download, and accessibility preferences coherent on desktop and mobile. |
| 3 | Offline audio MVP | High | Large | Directly strengthens the existing listening use case, but requires storage, download recovery, integrity, and quota management. |
| 4 | Tafsir MVP | High | Large | High learning value, but source licensing, structured long-form content, citations, and careful presentation make it more complex than translation. |
| 5 | Multiple translations and comparison | Medium | Medium | Valuable after the single-translation interaction and source model are proven. |
| 6 | Offline download management and smart packs | Medium | Medium | Improves a working offline core with Wi-Fi rules, cleanup, repair, and recommended download scopes. |
| 7 | Expanded tafsir library and cross-references | Medium | Large | Should follow evidence that readers use the focused single-source tafsir flow without disrupting recitation. |

## Phase 0 — foundation and trust gate

Status: completed 2026-08-06.

### Deliverables

- Validate line mapping against the selected printed Madani edition.
- Add visual fixtures for pages 1, 2, 3, a surah boundary, a dense page, a sajdah page, and page 604.
- Create a content manifest with source, edition, language, author, license, attribution, revision, and checksum fields.
- Use stable `verse_key` identifiers across Arabic, translation, tafsir, bookmarks, audio, and analytics.
- Introduce a versioned preference store with migration from the current local-storage keys.
- Build a single responsive settings panel/sheet.
- Define loading, unavailable, outdated, and source-attribution states for every optional content layer.
- Adopt the event contract in [ANALYTICS.md](./ANALYTICS.md) before shipping new features.

### Exit criteria

- Representative page screenshots match the chosen reference edition within approved tolerances.
- All 604 pages have valid verse and page mappings.
- No optional layer can change Arabic page line breaks or page dimensions.
- Content responses identify their source edition and revision.
- Existing reader preferences migrate without data loss.

Evidence: [`content-audit.json`](./content-audit.json), [`page-fidelity.json`](../tests/fixtures/page-fidelity.json), and the [reviewed screenshot baselines](../tests/fixtures/page-fidelity/README.md).

## Phase 1 — translation MVP

Target: one to two sprints after Phase 0.

### Scope

- Launch with one vetted, licensed English translation.
- Add a translation toggle to the settings panel and a compact reader shortcut.
- Display translation in a dismissible side panel on wide screens and bottom sheet on narrow screens.
- Keep the selected ayah synchronized between Arabic, translation, bookmarks, search, and audio.
- Support next/previous ayah inside the panel without reflowing the mushaf page.
- Show translator name, edition, revision, attribution, and footnotes.
- Cache translation data by page and edition.
- Preserve the last selected translation and panel state as user preferences.

### Deliberate exclusions

- No inline translation between Arabic lines.
- No translation comparison in the first release.
- No machine-generated translation presented as Quran translation.

### Acceptance criteria

- Translation coverage is complete for all 6,236 numbered ayat in the selected edition.
- Opening or closing translation causes zero shift in Arabic page line breaks.
- Cached translation appears within 150 ms on a typical supported device.
- Every displayed passage includes accessible source attribution.
- Footnote markup is sanitized and keyboard accessible.
- A missing translation never suppresses or alters verified Arabic content.

## Phase 2 — offline audio MVP

Target: two to three sprints after translation MVP.

### Scope

- Download audio by surah and juz; defer whole-Quran downloads until storage behavior is proven.
- Support one reciter initially, then enable all three through the same manifest contract.
- Provide estimated size, free-space check, progress, pause, resume, cancel, retry, and delete actions.
- Store a versioned audio manifest containing reciter, verse key, URL revision, byte size, and checksum.
- Verify each file before marking it available offline.
- Prefer downloaded audio automatically and fall back to streaming when online.
- Add Wi-Fi-only downloads, cellular warning, and storage-location information.
- Handle partial packs and interrupted downloads without making the pack appear complete.
- Expose a storage manager in Settings with per-reciter and per-pack totals.

### Technical direction

- For the web application, use a service worker plus Cache Storage or IndexedDB-backed blobs after a quota proof of concept.
- Keep the manifest and download state separate from cached files.
- Queue downloads with bounded concurrency and retry only transient failures.
- Do not cache audio opportunistically without user intent.
- Design the manifest so a future native wrapper can use device file storage without changing product semantics.

### Acceptance criteria

- A completed pack plays in airplane/offline mode from its first to last verse.
- Corrupt or truncated files are detected and repaired.
- Interrupted downloads resume without restarting completed files.
- Users can see and reclaim all storage used by the app.
- Audio event ordering, repeat behavior, and page-follow mode remain correct offline.
- Download controls meet platform background-execution limits without promising unsupported behavior.

## Phase 3 — tafsir MVP

Target: two to three sprints after the shared content panel has proven stable.

### Scope

- Launch with one vetted, licensed tafsir source in one language.
- Open tafsir from the selected ayah action menu and the study panel.
- Use the same responsive side-panel/bottom-sheet shell as translation.
- Display source, author, edition, section boundaries, citations, and footnotes.
- Preserve ayah context while scrolling long commentary.
- Support next/previous ayah without losing the reader’s position in the mushaf.
- Cache recently opened tafsir sections; do not claim full offline support initially.
- Provide a clear unavailable state when a source does not map one-to-one to an ayah.

### Deliberate exclusions

- No AI-generated tafsir.
- No unattributed excerpts.
- No mixing multiple tafsir sources into a synthetic answer.
- No automatic opening during normal recitation.

### Acceptance criteria

- Every tafsir passage identifies its exact source and edition.
- Verse and multi-verse section mappings pass content-review sampling.
- Long-form reading is keyboard and screen-reader accessible.
- Opening tafsir never changes the Arabic page geometry.
- Users can return to the exact selected ayah with one action.

## Phase 4 — expansion after evidence

Prioritize these only after Phase 1–3 metrics meet their adoption and reliability thresholds:

- Additional licensed translations and a two-column comparison mode.
- Additional tafsir sources with explicit source switching.
- Translation and tafsir language packs.
- Smart audio packs for recently read pages or memorization ranges.
- Background download scheduling where the host platform supports it.
- Optional offline translation and tafsir packs.

## Recommended release gates

| Gate | Required signal |
| --- | --- |
| Trust | Content-source metadata, coverage checks, and human sampling are complete. |
| Fidelity | Optional layers do not alter page dimensions, Arabic text, or line breaks. |
| Performance | Reader remains responsive on a representative low-to-mid-range mobile device. |
| Accessibility | All new controls have stable names, focus handling, and keyboard operation. |
| Offline integrity | Downloads have checksums, explicit states, repair, and deletion paths. |
| Analytics | Required events pass schema tests without collecting prohibited data. |
| Rollback | A feature flag can disable a content source or offline subsystem without blocking core reading. |

## Suggested outcome metrics

- Translation: percentage of weekly readers who open translation and continue reading for at least two ayat.
- Offline audio: successful pack completion rate and offline playback success rate.
- Tafsir: percentage of tafsir opens that return to the same ayah and continue reading.
- Reader health: page-load success, page-turn latency, audio-start success, and crash-free sessions.
- Trust: zero known mismatches between Arabic text, page, ayah, translation, tafsir, and audio anchors.
