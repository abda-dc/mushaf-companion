# Product changelog

All notable product changes to Mushaf Companion are documented here.

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
