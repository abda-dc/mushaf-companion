# Mushaf Companion

[![GitHub Pages](https://github.com/abda-dc/mushaf-companion/actions/workflows/pages.yml/badge.svg)](https://github.com/abda-dc/mushaf-companion/actions/workflows/pages.yml)
[![Native packages](https://github.com/abda-dc/mushaf-companion/actions/workflows/native-packages.yml/badge.svg)](https://github.com/abda-dc/mushaf-companion/actions/workflows/native-packages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-c8a86b.svg)](./LICENSE)

**Mushaf Companion** is a product of **M7SK Technologies**.

Mushaf Companion is a calm, page-first Quran reader designed to preserve the visual rhythm of the Madani mushaf while adding optional learning and recitation tools.

The current implementation supports all 604 Quran pages, a verified 114-sūrah contents index, Tajweed and Hifz tools, the M1-M8 study platform, a Hadith reader, the 49-topic Islamic Foundations reference library, 160 verified Hafs reciters, Prayer Times and Qibla, opt-in native prayer notifications, verified offline Alafasy packs, Saheeh International translation, Ibn Kathir tafsir, bookmarks, search, themes, and last-read resume behavior. Hafs 'an Asim is the only active Quran reading. Guided courses and alternate readings remain unavailable until their exact sources pass the required rights, integrity, mapping, and review gates.

![Mushaf Companion cover](./public/mushaf-companion-cover.jpg)

## Live application

Install or open the public app:

- [GitHub Pages PWA](https://abda-dc.github.io/mushaf-companion/) — the complete standalone reader and installable public application.

## Product principles

- Page fidelity comes before feature density.
- The Arabic mushaf remains the primary reading surface.
- Translation, transliteration, tafsir, and audio are additive layers.
- Unverified Quran content must fail closed rather than render as trusted text.
- Controls should remain calm, reversible, and easy to dismiss.

## Current capabilities

### Mushaf reading

- Page-based reader covering pages 1–604.
- Uthmani text grouped into 15 fixed page-line slots using the authoritative Mushaf ID 1 mapping.
- Page-specific QCF V2 glyph fonts and QCF V4 Tajweed color fonts.
- Surah headings, bismillah lines, ayah markers, juz and hizb metadata.
- Previous and next page controls.
- Touch swipe navigation.
- Arrow, Page Up/Page Down, Home, and End keyboard navigation.
- Direct desktop page-jump input plus a mobile jump sheet with page, sūrah, juz, recent-page, and saved-place shortcuts.
- URL-addressable pages through `?page=<number>`.
- Adjacent-page prefetching.
- Last-read page and ayah persistence in local storage.

### Reading assistance

- Tajweed display toggle.
- Verse transliteration toggle.
- Selected-ayah Saheeh International translation toggle with source attribution and no Arabic-page reflow.
- Selected-ayah state.
- Light and night themes.
- Reading-font picker with Uthman Taha, Amiri, Lateef, and Scheherazade.
- Explicit mobile Tajweed and Transliteration controls.
- Responsive settings panel with versioned display, learning, reciter, speed, bookmark, and Hifz preferences.
- A front-matter Tajweed guide covering all 17 markup categories used by the reader, with five linked Quran examples for each rule.
- Tap a Tajweed-marked word to see its rule name, timing, and reading instruction without leaving the page.

### Study (Tafsir)

- Selected-ayah English Ibn Kathir (Abridged) commentary by Hafiz Ibn Kathir from Quran Foundation/Quran.com resource 169.
- Open from the desktop toolbar, mobile assistance controls, Settings, or selected-ayah actions.
- Responsive long-form study panel with fixed ayah context and previous/next ayah navigation across page boundaries.
- Explicit source, author, edition, revision, licensing, single/multi-ayah section boundaries, and SHA-256 provenance.
- Shared structured-text normalization; raw provider HTML is never inserted into the browser DOM.
- In-session and HTTP caching with clear loading, unavailable, retry, and multi-verse-section states.

### Memorization (Hifz)

- “My Mushaf” dashboard opened from the reader toolbar or Home, with no additional bottom navigation tab.
- Calendar-safe day streak, total memorized ayāt, adjustable daily goal, and today-progress bar stored locally on the device.
- A 604-page mastery map with not-started, learning, due, and strong states.
- Adaptive 5, 10, or 20-minute daily plans that prioritize due reviews before new current-page ayāt.
- Again, Hard, Good, and Easy review ratings with calendar-safe next-review scheduling.
- From/to verse loops for the current page with 3, 5, 7, or 10 passes; optional memory pauses; and 0.75×, 1×, or 1.25× pace.
- Hidden-text page self-test with tap-to-reveal and tap-again-to-hide behavior.
- Selected-ayah actions for marking verses memorized, green rosette rings, and a jumpable memorized list.
- Local JSON export and restore for reading progress, bookmarks, preferences, and Hifz history.

### Guided learning foundation

- A dedicated, responsive Learn destination that coordinates Today’s Study, Hifz/My Mushaf, vocabulary, Tajweed, private notes, reader study, due reviews, and device-local learning progress.
- The existing Read → Ayah Study Lens workflow remains unchanged and remains the owner of selected-ayah study.
- Dedicated course, module, lesson, provider, rights, integrity, audit, citation, knowledge-check, and revision-pinned progress contracts.
- Provider lessons accept bounded structured plain text only; arbitrary provider HTML is rejected.
- Knowledge checks use the shared Again/Hard/Good/Easy review scheduler while retaining separate education progress.
- Today’s Study adds revision-pinned education reviews and lessons without changing Hifz, vocabulary, or reading ownership.
- Private notes support exact source/revision/course/module/lesson/section anchors while existing ayah and word notes migrate unchanged.
- Production contains no approved guided curriculum or substantive synthetic teaching; Learn displays an explicit awaiting-approved-curriculum state.

### Study platform

- M1-M8 provide the Ayah Study Lens, source-neutral word-study and occurrence architecture, vocabulary/review state, Today’s Study, private notes, and a fail-closed evidence-provider boundary.
- Today’s Study actively combines Hifz and reading; vocabulary and Guided Education steps appear only when their exact production sources are approved.
- Private ayah, word, and source-pinned lesson notes remain device-local during normal use and are included only in an explicit user backup.
- Production morphology, Foundation 125 vocabulary, and evidence relationships remain disabled: no approved provider is active and zero evidence edges ship.

### Hadith and Islamic Foundations

- A standalone Hadith reader registers the six canonical collections and displays 44 exact HadeethEnc English translation-approved seed records with source attribution and provider grading. It does not claim to bundle complete Hadith corpora or approved Arabic bodies.
- Islamic Foundations revision `m9r-v10` provides 10 collections, 49 of 49 reference-ready topics, zero planned topics, and 160 reference placements: 78 Quran, 51 Hadith, and 31 scholarly.
- Islamic Foundations is a source-navigation/reference library, not a course, fatwa service, mastery system, or replacement for qualified scholarship.

### Audio

- The M10 registry contains 160 verified complete Hafs reciters: 6 default choices and 154 searchable additional reciters.
- 45 reciters use ayah-scoped audio and 115 use continuous sūrah-scoped audio across Quran Foundation, EveryAyah, Kalamalah, and MP3Quran providers.
- The default group is Mishary Rashid Alafasy, Abdul Basit Abdus Samad, Dr. Aymen Suwayed, Minshawi Kids Repeat, Sheikh Muhammad Ayyub, and Sheikh Abdul Rashid Ali Sufi; Saad Al-Ghamdi is available in the expanded library.
- Verse play/pause and previous/next ayah controls.
- Playback progress with 0.5×, 0.75×, 1×, 1.25×, 1.5×, 1.75×, and 2× speed control.
- Repeat current ayah or a selected range on the current page.
- Double-click a displayed sūrah number to begin complete sūrah playback from āyah 1.
- Stable mini-player plus a full transport/settings bottom sheet on mobile.
- Verse-only controls remain disabled for continuous sūrah sources that do not provide verified verse timing.
- Download Mishary Rashid Alafasy packs by sūrah or juz with estimated size, free-space checks, progress, pause, resume, retry, repair, and deletion.
- SHA-256 verification before and after IndexedDB storage; partial packs never appear complete.
- Downloaded-first playback with streaming fallback when online, plus first-to-last pack sequencing that does not depend on page retrieval.
- Wi-Fi-only safeguards, cellular warnings, storage persistence status, quota visibility, and per-pack totals.

### Prayer Times, Qibla, and notifications

- Device-local prayer calculations through `adhan@4.4.4`, with 12 calculation presets, standard or Hanafi Asr, per-prayer adjustments, local location handling, and Qibla bearing.
- Notifications default off and request permission only after an explicit user action.
- Android and iOS native shells can schedule a seven-day horizon of five-Salah local alerts and reconcile only Mushaf Companion-owned notifications.
- Android exposes user-controlled exact-alarm settings and an inexact fallback; iOS remains subject to Focus, Silent Mode, and OS policy.
- Web/PWA supports explicit permission and test display where available, but reliable timed alerts after the browser/PWA closes require a future Web Push service and are not claimed.
- No approved redistributable Adhan cue is bundled. Native prayer alerts use the system notification sound until a recording passes source, rights, attribution, checksum, duration/format, and device review.

### Finding and saving places

- Search by page number, ayah key, surah name, or Quran text.
- Clickable table of contents for all 114 sūrahs with Arabic and English names, translation, Makkan/Madinan classification, āyah count, page range, juz coverage, and revelation order.
- Page and ayah search results.
- Ayah bookmarks.
- Resume from the last confirmed page and ayah.
- Six device-local recent-page shortcuts for quickly returning to earlier reading positions.

### Installable applications

- Installable PWA with standalone display metadata, app shortcuts, update handling, and a branded offline screen.
- Standalone GitHub Pages PWA containing the real React reader, with repository-base-safe assets and service-worker scope.
- Capacitor 8 Android and iOS projects using `com.mushafcompanion.reader`.
- Automated Android debug APK, unsigned release AAB, and unsigned iOS simulator package builds.
- Store distribution is not release-ready: the last recorded native artifact run predates M11/M12, signed packages and store-account configuration are absent, and physical Android/iPhone/iPad QA remains outstanding.

## Architecture

Mushaf Companion uses one React reader with two content transports. Local/server builds use the vinext API routes. The GitHub Pages build uses browser-safe Quran Foundation requests plus build-produced, rights-compatible static metadata and Amharic package assets. Both modes share the same page, chapter, search, audio-manifest, and tafsir normalization and integrity code.

```text
Shared React reader
  ├─ server transport → same-origin /api/* routes
  ├─ Pages transport  → CORS-safe Quran Foundation Content API
  ├─ shared source normalization and SHA-256 provenance
  ├─ build-verified Amharic package → browser re-verification → IndexedDB
  └─ audio providers → streaming and verified offline packs
```

The shared page source obtains content from the Quran Foundation/Quran.com Content API, validates required payloads, aligns tajweed markup to words, computes page provenance, and returns a normalized page model. Content-fetch failures are not silently presented as verified Quran text.

See [`docs/STANDALONE-PAGES.md`](./docs/STANDALONE-PAGES.md) for the complete static transport, source-rights, PWA, and independent verification design.

See [`docs/GUIDED-EDUCATION.md`](./docs/GUIDED-EDUCATION.md) for the guided-education trust boundary, provider approval requirements, local state model, migration behavior, and release process.

See [`docs/PROJECT-STATUS.md`](./docs/PROJECT-STATUS.md) for the authoritative portfolio status and [`docs/RELEASE-BASELINE.md`](./docs/RELEASE-BASELINE.md) for native release gates and M13 entrance criteria.

The M11 reading registry and transport boundary are active, but only `hafs-an-asim` has a production page edition. Warsh is an artifact/rights/mapping candidate only; Qalun and Khalaf are planned. Unsupported readings fail closed and are never silently rendered with Hafs content.

A disabled-by-default multilingual source registry now records candidate identity, attribution, rights, edition, coverage, and integrity metadata independently of the reader. Provider adapters require exact resource identifiers and can audit candidate packages without enabling or exposing them in the UI. See [`docs/MULTILINGUAL-SOURCES.md`](./docs/MULTILINGUAL-SOURCES.md).

## Local development

### Prerequisites

- Node.js `>=22.13.0`
- npm

### Install and run

```bash
npm ci
npm run dev
```

Open [http://localhost:5550](http://localhost:5550).

The frontend and all `/api/*` routes use the same full-stack server on port `5550`.

### Useful commands

```bash
npm run dev      # Start the development server on port 5550
npm run build    # Create a production build
npm run build:pages   # Create the standalone GitHub Pages reader in _site/
npm run verify:pages  # Reject wrappers, server API paths, bad base paths, and invalid PWA scope
npm run start    # Run the production build on port 5550
npm test         # Build and run the reader/API test suite
npm run lint     # Run ESLint
npm run audit:content        # Verify all 604 pages and 6,236 verse keys against the source API
npm run audit:translations   # Verify registered translation identities, coverage, script, and checksums
npm run mobile:sync           # Sync both native projects
npm run mobile:android:debug  # Build an Android debug APK on Windows
npm run mobile:android:bundle # Build an unsigned Android release AAB on Windows
```

No application environment variables are required for the current read-only Quran API integration.

## API routes

| Route | Purpose | Important behavior |
| --- | --- | --- |
| `GET /api/pages/:page` | Load one Madani mushaf page | Accepts pages 1–604 and fails closed on incomplete upstream content. |
| `GET /api/content-manifest` | Inspect Quran source and integrity metadata | Identifies edition, resource IDs, revision, audit status, and checksum policy. |
| `GET /api/audio-manifest?type=surah&id=1&reciter=alafasy` | Build one offline-audio pack manifest | Supports sūrah or juz scope, paginates every verse key, and identifies its source revision. |
| `GET /api/tafsir?verse=2:255` | Load one source-attributed tafsir section | Uses resource 169, retains multi-ayah boundaries, strips provider markup, and returns SHA-256 provenance. |
| `GET /api/search?q=` | Search pages, ayat, surahs, and text | Falls back to direct page and ayah matching if broad search is unavailable. |
| `GET /api/lookup?verse=` | Resolve an ayah key to its page | Accepts keys such as `2:255`. |
| `GET /api/chapters` | Load the 114-sūrah contents index | Includes page ranges, juz coverage, revelation metadata, and āyah counts. |

## Repository layout

```text
app/
  api/                 Server-mode route adapters
  content/             Shared verified sources plus server/Pages transports
  globals.css          Reader, audio, modal, mobile, and theme styling
  page.tsx             Mushaf reader and interaction state
  quran-data.ts        Shared page, verse, reciter, and search types
  tafsir-source.mjs    Tafsir edition metadata and fail-closed text normalization
  tafsir-panel.tsx     Responsive selected-ayah study surface
  tajweed-guide.ts     Tajweed taxonomy, teaching copy, and 85 linked examples
android/               Capacitor Android Studio project
ios/                   Capacitor Xcode project
pages-static/          Standalone Pages entry, manifest, offline page, and service worker
docs/
  ANALYTICS.md         Future analytics and event contract
  PROJECT-STATUS.md    Authoritative current portfolio status
  RELEASE-BASELINE.md  Web/native baseline and M13 entrance criteria
  EXTERNAL-DEPENDENCIES.md External source, rights, hardware and store blockers
  APPROVAL-REGISTER.md Trust-sensitive source and activation approvals
  BRANCH-INVENTORY.md  Historical branch classifications and namespace policy
  OFFLINE-AUDIO.md     Offline pack integrity, recovery, and platform limits
  MULTILINGUAL-SOURCES.md Candidate translation registry, rights, coverage, checksums, and approval process
  TAFSIR.md            Tafsir source, safety, mapping, and reader behavior
  ROADMAP.md           Prioritized translations, tafsir, and offline roadmap
  UX-REVIEW.md         Current reader UX findings and acceptance checks
  MOBILE.md            Android/iOS packaging and signing guide
  STANDALONE-PAGES.md  GitHub Pages runtime, source, PWA, and verification architecture
tests/
  rendered-html.test.mjs
worker/
  index.ts             Cloudflare/vinext worker entry point
```

## Data integrity expectations

Before a content source or edition is enabled in production, it must have:

- A stable source and edition identifier.
- Documented licensing and attribution.
- Complete surah, ayah, page, and line mappings.
- Automated coverage checks for all 604 pages.
- Sanitization for any markup returned by a content provider.
- Human review of representative page, surah-boundary, sajdah, and long-ayah cases.

The current Phase One gate records a passed 604-page/6,236-ayah audit in [`docs/content-audit.json`](./docs/content-audit.json) and locks fourteen reviewed screenshots for pages 1, 2, 3, 187, 293, 416, and 604 under [`tests/fixtures/page-fidelity`](./tests/fixtures/page-fidelity/README.md).

The bundled Al-Fatihah model is only a fail-safe initial shell while the selected verified page loads. It is not a substitute for successful page retrieval.

## Current limitations

- Hafs 'an Asim is the only active production reading. Warsh remains gated; Qalun and Khalaf are not implemented.
- Translation and tafsir currently provide one active online English edition each. Amharic is an explicit verified optional pack; Somali and Oromo remain blocked by incomplete original attribution.
- Tafsir requires a network connection when a section is not already available in the browser’s ordinary HTTP cache; full offline tafsir packs are not claimed.
- Offline downloads currently support Mishary Rashid Alafasy only; the other reciters continue to stream.
- Offline packs are limited to sūrah and juz scopes while storage behavior is validated; whole-Quran download remains deferred.
- Downloads run while the app is active and resume safely after interruption, but browsers may suspend work in the background.
- The application shell must be opened once online before it can cold-start offline. Verified Quran page retrieval still requires a network connection; saved audio packs can play independently.
- Representative desktop and responsive screenshots are locked, but the reader is not claimed to be pixel-identical on every browser and device.
- Bookmarks and preferences remain local by default; users can export and restore a private JSON backup.
- Native packages currently load the deployed server-backed reader over HTTPS; a fully bundled offline reader remains a future phase.
- Native prayer notifications are implemented but have not completed the required physical Android and iPhone/iPad release matrix. PWA closed-app scheduling is not implemented.
- The custom Adhan asset registry is empty; system notification sound is the current fallback.
- Guided Education, production morphology/vocabulary, and M8 evidence relationships remain disabled pending exact source and approval gates.
- The package, native metadata, user-agent, tag, and GitHub release versions are inconsistent and require an explicit M13 version decision.
- Native workflows produce unsigned artifacts. Release signing, store accounts/configuration, current-baseline native packages, store metadata, and physical-device QA are outstanding.
- Browser storage may be reclaimed unless persistent storage is granted; the Offline Audio manager reports that state and provides verification, repair, and deletion controls.
- A signed iOS `.ipa` requires macOS, Xcode 26+, and an Apple Developer signing team.

## Product planning

- [Authoritative project status](./docs/PROJECT-STATUS.md)
- [Current roadmap](./docs/ROADMAP.md)
- [Release baseline and M13 entrance criteria](./docs/RELEASE-BASELINE.md)
- [External dependencies](./docs/EXTERNAL-DEPENDENCIES.md)
- [Approval register](./docs/APPROVAL-REGISTER.md)
- [Offline audio integrity and recovery](./docs/OFFLINE-AUDIO.md)
- [Tafsir source, safety, and mapping](./docs/TAFSIR.md)
- [Current UX review](./docs/UX-REVIEW.md)
- [Analytics requirements](./docs/ANALYTICS.md)
- [Product changelog](./CHANGELOG.md)

## Deployment

The public application is built and deployed to GitHub Pages by [`.github/workflows/pages.yml`](./.github/workflows/pages.yml). The workflow runs lint, the complete tests, the translation audit, `npm run build:pages`, and artifact verification before uploading `_site/`. The artifact is the React reader itself; it contains no iframe, redirect, or ChatGPT Site runtime dependency.

The local/server reader remains a Cloudflare-compatible vinext application and continues to expose the documented `/api/*` routes. GitHub Pages does not claim or emulate those server routes; its dedicated transport reaches verified browser-safe sources directly and uses base path `/mushaf-companion/` throughout.

Pushes to `main` build and test the full reader before publishing the Pages shell. Version tags beginning with `v` also build downloadable native artifacts.

## Contact and ownership

For product questions and support, contact [hello@aptopsagency.com](mailto:hello@aptopsagency.com).

Copyright © 2026 **M7SK Technologies**. Source code is licensed under the MIT License; Quran text, typography, translations, tafsir, recitation recordings, and third-party data retain their respective rights and licenses.

## License
The application source is available under the [MIT License](./LICENSE). See [CONTRIBUTING.md](./CONTRIBUTING.md) before proposing changes.

Quran text, typography, translations, tafsir, recitation recordings, and data returned by third-party services are not relicensed by the MIT License. They retain the terms and attribution required by their respective providers, including the [Quran.com API](https://api-docs.quran.com/), [EveryAyah](https://everyayah.com/), and other sources documented in the code.
