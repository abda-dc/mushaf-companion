# Mushaf Companion

[![GitHub Pages](https://github.com/abda-dc/mushaf-companion/actions/workflows/pages.yml/badge.svg)](https://github.com/abda-dc/mushaf-companion/actions/workflows/pages.yml)
[![Native packages](https://github.com/abda-dc/mushaf-companion/actions/workflows/native-packages.yml/badge.svg)](https://github.com/abda-dc/mushaf-companion/actions/workflows/native-packages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-c8a86b.svg)](./LICENSE)

Mushaf Companion is a calm, page-first Quran reader designed to preserve the visual rhythm of the Madani mushaf while adding optional learning and recitation tools.

The current implementation supports all 604 Quran pages, a verified 114-sūrah contents index, an interactive Tajweed primer, Hifz memorization tools, direct page navigation, verse and sūrah playback, transliteration, bookmarks, search, night mode, and last-read resume behavior.

![Mushaf Companion preview](./public/og.png)

## Live application

Install or open the public app:

- [GitHub Pages PWA](https://abda-dc.github.io/mushaf-companion/) — the public, installable entry point.
- [Direct reader](https://mushaf-companion.abda-dc.chatgpt.site/) — the server-backed application used by the PWA and native shells.

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
- Direct page-jump input.
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

### Audio

- Mishary Rashid Alafasy.
- Abdul Basit Abdus Samad.
- Saad Al-Ghamdi.
- Dr. Aymen Suwayed.
- Minshawi Kids Repeat.
- Sheikh Abdul Rashid Ali Sufi.
- Verse play/pause and previous/next ayah controls.
- Playback progress with 0.5×, 0.75×, 1×, 1.25×, 1.5×, 1.75×, and 2× speed control.
- Repeat current ayah or a selected range on the current page.
- Double-click a displayed sūrah number to begin complete sūrah playback from āyah 1.
- Stable mini-player plus a full transport/settings bottom sheet on mobile.
- Five reciters use ayah-by-ayah files; Sheikh Abdul Rashid Ali Sufi uses clearly labeled continuous sūrah playback because verified verse timing is not available from the source.

### Finding and saving places

- Search by page number, ayah key, surah name, or Quran text.
- Clickable table of contents for all 114 sūrahs with Arabic and English names, translation, Makkan/Madinan classification, āyah count, page range, juz coverage, and revelation order.
- Page and ayah search results.
- Ayah bookmarks.
- Resume from the last confirmed page and ayah.

### Installable applications

- Installable PWA with standalone display metadata, app shortcuts, update handling, and a branded offline screen.
- GitHub Pages PWA entry point with an install prompt on supported browsers.
- Capacitor 8 Android and iOS projects using `com.mushafcompanion.reader`.
- Automated Android debug APK, unsigned release AAB, and unsigned iOS simulator package builds.

## Architecture

Mushaf Companion is a full-stack React application built with Next-compatible App Router conventions through vinext and Vite. Client and API routes are served by one process.

```text
Browser reader
  ├─ /api/pages/:page  ── verified page, line, tajweed and transliteration data
  ├─ /api/search       ── page, surah and verse search
  ├─ /api/lookup       ── verse-to-page mapping
  ├─ /api/chapters     ── verified chapter, juz and revelation index
  └─ audio providers   ── verse-level recitation files
```

The page API obtains content from the Quran Foundation/Quran.com Content API, validates required payloads, aligns tajweed markup to words, and returns a normalized page model. Content-fetch failures return an error response; they are not silently presented as verified Quran text.

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
npm run start    # Run the production build on port 5550
npm test         # Build and run the reader/API test suite
npm run lint     # Run ESLint
npm run audit:content        # Verify all 604 pages and 6,236 verse keys against the source API
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
| `GET /api/search?q=` | Search pages, ayat, surahs, and text | Falls back to direct page and ayah matching if broad search is unavailable. |
| `GET /api/lookup?verse=` | Resolve an ayah key to its page | Accepts keys such as `2:255`. |
| `GET /api/chapters` | Load the 114-sūrah contents index | Includes page ranges, juz coverage, revelation metadata, and āyah counts. |

## Repository layout

```text
app/
  api/                 Server-side Quran data adapters
  globals.css          Reader, audio, modal, mobile, and theme styling
  page.tsx             Mushaf reader and interaction state
  quran-data.ts        Shared page, verse, reciter, and search types
  tajweed-guide.ts     Tajweed taxonomy, teaching copy, and 85 linked examples
android/               Capacitor Android Studio project
ios/                   Capacitor Xcode project
github-pages/          Static installable PWA shell deployed by GitHub Actions
docs/
  ANALYTICS.md         Future analytics and event contract
  ROADMAP.md           Prioritized translations, tafsir, and offline roadmap
  UX-REVIEW.md         Current reader UX findings and acceptance checks
  MOBILE.md            Android/iOS packaging and signing guide
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

- Translation is currently one vetted selected-ayah English layer; translation comparison and tafsir are not implemented yet.
- Audio requires a network connection and cannot be downloaded yet.
- Offline reading is not supported.
- Representative desktop and responsive screenshots are locked, but the reader is not claimed to be pixel-identical on every browser and device.
- Bookmarks and preferences remain local by default; users can export and restore a private JSON backup.
- Native packages currently load the deployed server-backed reader over HTTPS; a fully bundled offline reader remains a future phase.
- The PWA caches its application/offline shell, but Quran page verification and recitation still require a network connection.
- A signed iOS `.ipa` requires macOS, Xcode 26+, and an Apple Developer signing team.

## Product planning

- [V2 roadmap](./docs/ROADMAP.md)
- [Current UX review](./docs/UX-REVIEW.md)
- [Analytics requirements](./docs/ANALYTICS.md)
- [Product changelog](./CHANGELOG.md)

## Deployment

The public entry point is deployed to GitHub Pages by [`.github/workflows/pages.yml`](./.github/workflows/pages.yml). GitHub Pages serves the installable PWA shell and loads the public server-backed reader full-screen.

The reader itself remains a Cloudflare-compatible vinext application because page, search, chapter, and lookup endpoints execute on the server. Keeping those endpoints on the existing Sites deployment avoids shipping an incomplete static build while preserving a public GitHub Pages URL for installation and discovery.

Pushes to `main` build and test the full reader before publishing the Pages shell. Version tags beginning with `v` also build downloadable native artifacts.

## License

The application source is available under the [MIT License](./LICENSE). See [CONTRIBUTING.md](./CONTRIBUTING.md) before proposing changes.

Quran text, typography, translations, tafsir, recitation recordings, and data returned by third-party services are not relicensed by the MIT License. They retain the terms and attribution required by their respective providers, including the [Quran.com API](https://api-docs.quran.com/), [EveryAyah](https://everyayah.com/), and other sources documented in the code.
