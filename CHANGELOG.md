# Product changelog

All notable product changes to Mushaf Companion are documented here.

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
