# Product changelog

All notable product changes to Mushaf Companion are documented here.

## Unreleased — local changes

### Added

- A dedicated Learn destination and responsive Learn hub for Today’s Study, approved guided courses, the current lesson, due education review, My Mushaf, vocabulary, Tajweed, private notes, reader study, and device-local learning progress without replacing the Read → Ayah Study Lens workflow.
- Source-neutral education course/module/lesson/provider contracts with structured plain-text blocks, separate lesson citations, trusted Quran-reference reconciliation, knowledge checks, and source/revision-pinned local progress.
- Fail-closed education activation requiring exact independent pins for provider and source identity, author and organization, named scholarly review, revision, rights, capabilities, SHA-256 integrity, normalization, audit identity, coverage, and catalog structure.
- Today’s Study schema v2 education-review and education-lesson steps using deterministic due-before-new ordering and the shared Again/Hard/Good/Easy scheduler.
- Study Notes schema v2 source-pinned lesson and section anchors, preference schema v8, and lossless portable restore compatibility from schemas v2 through v8.
- Server and GitHub Pages education transport parity, Pages release metadata and artifact rejection for undeclared education catalogs, plus the guided-curriculum approval and release guide.
- Private ayah and exact-word study notes with bounded plain text, user-defined Unicode tags, explicit editing/deletion, local search, trusted anchor navigation, and Saved Study/My Mushaf access.
- Preference schema v7 migration and portable backup/restore coverage for private notes, tags, anchors, and timestamps while preserving all M1–M6 domains.
- A source-neutral evidence relationship contract with independently pinned provider/source/revision/origin/approval/checksum/normalization identity, complete delivery-specific rights, fail-closed adapter boundaries, canonical semantic edge identity, partial-provider results, trusted Quran reconciliation, and stale-query protection.
- Notes and Evidence tabs in the existing Ayah Study Lens with responsive, accessible layouts and clear private-versus-source-backed labeling.
- A single Ayah Study Lens with Overview, Words, Tafsir, Practice, Notes, and Evidence tabs, shared selected-ayah navigation, responsive drawer/sheet behavior, and reused translation, Ibn Kathir, audio, Tajweed, and Hifz systems.
- A source-neutral Quran word-study contract with deterministic Mushaf coordinates, provider approval/provenance gates, dataset and runtime audits, and a disabled Quranic Arabic Corpus reference descriptor.
- Tap-a-word study context, trusted occurrence navigation, and separate lemma/root exploration that remain unavailable when no approved provider is active.
- A gated Foundation 125 curriculum loader, device-local vocabulary progress, shared Again/Hard/Good/Easy interval semantics, and preference backup/restore support.
- A unified Today’s Study plan for due Hifz, approved vocabulary, and reading, with deterministic 5/10/20-minute budgets, resumable local sessions, skip/exit controls, and calendar-safe activity.

### Reliability

- Production guided courses remain explicitly unavailable: the only production registration is a disabled, empty synthetic reference provider with no approved or substantive Islamic teaching content.
- Curriculum revisions cannot silently reuse lesson completion, review, Today’s Study, or private-note anchors from another source revision.
- The exact catalog instance must pass independent checksum verification, strict structured validation, runtime audit, rights compatibility, and trusted Quran-reference lookup before activation is cached.
- The verified education catalog is now a deeply immutable canonical snapshot; provider, audit-time, and consumer mutations cannot change the cached or subsequently returned curriculum.
- Backdated education reviews preserve existing progress, grouped Today’s Study reviews advance across lessons, Learn restores its exact opener focus, and bounded education state round-trips through local preferences and portable backup.
- Pages now applies its education release declaration across the entire artifact, including public-derived files and compiled assets, rather than only `_site/content/`.
- Private note text and tags remain device-local during normal operation, are never sent to Quran APIs or analytics, and leave the device only through explicit backup download.
- New note drafts freeze their full Quran anchor, exact word anchors are revalidated on save, existing-note edits preserve anchors, secure UUID generation falls back to `crypto.getRandomValues()`, renamed active tag filters remain valid, and backup restore rejects unsupported future schemas.
- No production evidence relationships are bundled: the reference provider remains disabled until a source passes rights, provenance, integrity, runtime audit, and Quran-mapping review.
- Evidence failures and partial coverage remain distinct from authoritative zero; authority labels appear only after successful approved runtime checks, and inferred, synthetic, keyword-, root-, lemma-, embedding-, or AI-derived links cannot enter approved provider results.
- Word-study and curriculum content fail closed on disabled sources, malformed records, duplicate or mismatched coordinates, incomplete provenance, and source-revision changes.
- Production vocabulary, morphology, root, lemma, and occurrence content remains disabled pending explicit source and rights approval; automated tests use synthetic fixtures only.
- Preference schema v7 migrates earlier reader, Hifz, vocabulary, Today's Study, audio, and download settings without replacing existing user state.

## 1.1.0 — 2026-08-07

### Added

- A dedicated mobile page-jump sheet with a visible page-number field and Go action.
- Direct sūrah and juz navigation from the jump sheet using verified chapter metadata and the Madani juz page map.
- Six recent-page shortcuts stored only on the device, plus quick access to bookmarked ayat.

### Changed

- The compact mobile header page indicator and lower page number now open the same accessible navigation sheet.
- Reading backups and the versioned preference store now preserve recent-page history.

## 1.0.0 — 2026-08-06

### Added

- A responsive selected-ayah tafsir study panel using Quran Foundation/Quran.com English resource 169, Ibn Kathir (Abridged) by Hafiz Ibn Kathir.
- Tafsir entry points in the reader toolbar, mobile learning controls, selected-ayah actions, and Settings.
- Previous and next ayah study navigation that preserves the underlying mushaf context, including page-boundary movement.
- Explicit single-ayah and multi-ayah section labels, source catalog links, edition and author attribution, revision metadata, and SHA-256 response checksums.
- Clear loading, unavailable, retry, and source-attribution states for long-form commentary.

### Reliability

- Provider markup is converted server-side into a small structured-text model; raw tafsir HTML is never inserted into the browser DOM.
- Tafsir responses fail closed when the resource ID, requested verse mapping, content blocks, or checksum contract is invalid.
- Sampled real one-verse and multi-verse mappings for 1:1, 2:8–9, 3:1–4, 93:1–10, and 2:255.
- Added sanitizer, edition, mapping, API, accessibility-contract, and source-attribution regression coverage.

## 0.9.0 — 2026-08-06

### Added

- Downloadable Mishary Rashid Alafasy audio packs by sūrah or juz, with file-count and size estimates before download.
- A responsive Offline Audio library with progress, pause, resume, retry, verification, repair, playback, and storage-safe deletion controls.
- Versioned audio manifests containing stable verse keys, source revision, provider attribution, and deterministic file identities.
- IndexedDB-backed audio storage with SHA-256 verification both before and after each file is committed.
- Wi-Fi-only preferences, cellular warnings, browser quota visibility, persistent-storage requests, and per-pack storage totals.
- Downloaded-first playback with online streaming fallback, plus an offline queue that advances from the first to last verified verse without a page API request.

### Reliability

- Partial or interrupted packs remain visibly incomplete and resume without redownloading verified files.
- Missing, truncated, or corrupt files fail closed and can be repaired from the pack manager.
- Downloads use bounded concurrency and retry only recoverable failures; the interface does not promise unsupported background execution.
- Added manifest pagination, URL stability, checksum, retry, migration, and partial-pack regression coverage.

## 0.8.0 — 2026-08-06

### Added

- A versioned Quran content manifest identifying the Madani Mushaf edition, Hafs riwayah, Arabic, Tajweed, transliteration, and Saheeh International resources.
- SHA-256 provenance on every verified page response, plus manifest revision and source headers.
- A full-corpus audit covering all 604 pages and all 6,236 stable verse keys, with per-page and corpus checksums.
- Fourteen reviewed page-fidelity baselines across desktop and responsive viewports for seven representative pages.
- A selected-ayah Saheeh International translation layer that never reflows the Arabic page.
- “My Mushaf,” with a 604-page mastery map, due-review counts, adaptive 5/10/20-minute plans, and Again/Hard/Good/Easy scheduling.
- Private JSON backup and restore for bookmarks, reading preferences, and memorization progress.

### Changed

- Consolidated legacy local-storage values into a versioned preference document with lossless migration.
- Made unverified or structurally invalid page responses fail closed before they can enter the reader cache.
- Added visible edition, revision, and checksum attribution in Settings.

### Reliability

- Locked sparse, dense, surah-boundary, At-Tawbah, sajdah, and final-page geometry to official fixture data.
- Added regression coverage for preference migration, backup round trips, review scheduling, mastery status, provenance, screenshots, and the stored corpus audit.

## 0.7.0 — 2026-08-06

### Added

- A dedicated Hifz surface reachable from the reader toolbar and Home without adding another bottom navigation tab.
- Local day-streak, total memorized-ayah, adjustable daily-goal, and today-progress tracking.
- Current-page verse loops with range selection, 3/5/7/10 passes, memory pauses, and 0.75×/1×/1.25× pace controls.
- A hidden-text self-test that blurs every ayah until it is tapped, with page-level mode guidance.
- Selected-ayah actions for marking verses memorized, green memorized rosette rings, and a jumpable memorized list.

### Reliability

- Calendar-day streak tests cover missed days, same-day activity, leap day, month changes, and year changes without relying on 24-hour timestamp arithmetic.

## 0.6.0 — 2026-08-05

### Added

- Installable PWA metadata, app shortcuts, update registration, a branded app icon, and an offline shell.
- A GitHub Pages PWA entry point and automated Pages deployment workflow.
- An MIT software license, contributing guide, and private security-reporting policy.
- An unsigned Android release App Bundle artifact alongside the existing debug APK.

### Changed

- The existing Sites reader is now the public server-backed runtime for both the GitHub Pages PWA and Capacitor shells.
- Corrected the Android instrumented-test package assertion to the production app ID.

## 0.5.0 — 2026-08-05

### Added

- Playback speeds at 0.5×, 1.5×, 1.75×, and 2× in addition to the existing choices.
- A front-matter Tajweed guide covering all 17 rule categories present in the verified markup, with five linked Quran examples per rule.
- Contextual Tajweed explanations when a marked word is selected in the muṣḥaf.
- A clickable 114-sūrah table of contents with Arabic/English names, meaning, Makkan/Madinan classification, āyah count, page range, juz coverage, and revelation order.
- Complete sūrah playback initiated by double-clicking a displayed sūrah number.
- Capacitor 8 Android and iOS projects, a verified local Android debug APK build, and a GitHub Actions native packaging workflow.

### Changed

- Page 1 now leads backward to the Tajweed guide as unnumbered front matter.
- Complete sūrah mode automatically advances verified āyah files for verse-scoped reciters and uses continuous sūrah audio where supported.
- Mobile navigation now includes the contents destination, and the reading-assistance bar includes direct guide access.

### Reliability

- The contents route combines the verified chapter catalog with juz mappings and removes duplicate juz entries.
- The native shells enforce HTTPS and retain the reader’s same-origin local preferences.

## 0.4.0 — 2026-08-05

### Added

- Reading-font picker with persisted Amiri, Lateef, Scheherazade, and page-faithful Uthman Taha choices.
- Dr. Aymen Suwayed and Minshawi Kids Repeat as verified ayah-by-ayah reciters.
- Sheikh Abdul Rashid Ali Sufi as clearly identified continuous sūrah playback, with verse-only controls disabled when that source is selected.

### Fixed

- Replaced the early-page number-outline fallback with a visibly ornamental scalloped rosette on every ayah ending that lacks a native QCF marker.
- Added a page-data revision key so pages 1 and 3 no longer reuse a stale cached API payload after marker fixes.
- Kept native QCF rosettes for every page that provides them, including when a non-QCF reading font is selected.

## 0.3.1 — 2026-08-05

### Fixed

- Restored the page-font ayah rosettes on pages 1–3 when the Quran content response exposes QCF glyphs through the word text field instead of the optional code fields.
- Added a decorative double-ring rosette fallback for any ayah ending that has no usable QCF glyph, preventing plain number-only markers on any page.
- Added regression coverage for early-page end markers without `code_v2` or `code_v4` fields.

## 0.3.0 — 2026-08-05

### Added

- Prioritized roadmap for translation, tafsir, and offline audio.
- Evidence-based desktop and mobile UX review.
- Privacy-conscious analytics and event-tracking requirements.
- Product-specific setup, architecture, integrity, and deployment documentation.
- Page-specific QCF V2 and V4 Tajweed font loading for the selected Madani page.
- A real responsive Settings panel for theme, page size, Tajweed, transliteration, reciter, and playback speed.
- Explicit one-tap Tajweed and Transliteration controls on mobile.
- Stable audio mini-player with previous, play/pause, and next controls at every breakpoint.
- A dedicated responsive audio bottom sheet with reciter, speed, repeat, range, transport, and progress controls.
- Real Home, Listen, Bookmarks, Search, and Settings destinations with shared dialog behavior.

### Changed

- Locked every rendered page to 15 equal line slots and the authoritative QCF word-to-line mapping for Mushaf ID 1.
- Replaced responsive Arabic reflow and generic word spacing with page-specific glyph metrics.
- Made all six navigation destinations available on desktop and mobile.
- Standardized overlay dismissal through backdrop clicks, explicit Close actions, and the Escape key.
- Persisted reading-assistance, page-size, reciter, speed, and theme preferences.

### Planned

- Representative-page visual regression fixtures.
- Translation MVP with one vetted, licensed English edition.
- Offline audio packs with integrity verification and storage management.
- Tafsir MVP with one vetted, licensed source.

## 0.2.0 — 2026-08-05

### Added

- Dynamic reader covering Quran pages 1–604.
- Verified same-origin page API backed by Quran Foundation/Quran.com content services.
- Page-to-line, word, verse, chapter, juz, and hizb data model.
- Tajweed markup alignment and per-page transliteration data.
- Previous and next page controls.
- Touch swipe navigation.
- Arrow, Page Up/Page Down, Home, and End keyboard navigation.
- Direct page-jump inputs for desktop and mobile.
- URL-addressable selected pages.
- Adjacent-page prefetching and visible loading states.
- Last-read page and ayah resume behavior.
- Quran-wide search by page, ayah key, surah, and text.
- Ayah bookmarks with a bookmark panel.
- Verse-to-page lookup API.
- Three reciters with verse-level audio.
- Repeat-current-ayah and current-page range modes.
- Playback speed and progress controls.
- Responsive desktop and mobile navigation.
- Automated server-render, feature-contract, and page-mapping tests.

### Changed

- Replaced the single static Al-Fatihah experience with page-first navigation.
- Made page navigation the dominant reader interaction.
- Reworked the visual system around a framed physical-page metaphor.
- Moved development and production-local serving to unified port `5550`.
- Updated metadata to describe the complete 604-page reader.

### Reliability

- Rejects page numbers outside 1–604.
- Returns fail-safe errors for incomplete or unavailable verified content.
- Retains the last confirmed page when a requested page cannot load.
- Caches successful page and lookup responses.

## 0.1.0 — 2026-08-04

### Added

- Initial Mushaf Companion reader prototype.
- Faithful page-first Al-Fatihah reading surface.
- Decorative mushaf frame and warm neutral visual direction.
- Tajweed and transliteration toggles.
- Three-reciter selector and prototype audio controls.
- Bookmarks, search, night mode, and resume-position concepts.

### Limitations

- Only the bundled Al-Fatihah page was available.
- Page navigation controls did not load additional Quran pages.
- Several navigation items represented prototype states rather than complete views.
