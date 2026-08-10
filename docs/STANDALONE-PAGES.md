# Standalone GitHub Pages PWA

## Outcome

`https://abda-dc.github.io/mushaf-companion/` hosts the Mushaf Companion React reader directly. The deployment artifact is not the retired iframe wrapper and has no ChatGPT Site redirect, iframe, fetch, or rendering dependency.

The Pages build is:

```bash
npm run build:pages
```

It writes the complete deployment artifact to `_site/`. `_site/` is generated and ignored by Git; the source entry and PWA files live in `pages-static/`.

## One reader, two transports

`app/page.tsx`, its components, and `app/globals.css` are reused as the product UI in both modes. `vite.pages.config.ts` aliases only the transport provider during the Pages build:

- local/server mode uses `app/content/runtime-transport.ts` and the existing same-origin `/api/*` routes;
- Pages mode uses `app/content/pages-runtime-transport.ts` and never calls a same-origin server API.

Both modes call `app/content/quran-runtime-source.ts` for provider payload normalization, 604-page constraints, 15-line geometry, verse identity validation, tajweed alignment, chapter/juz shaping, search result shaping, audio manifests, tafsir sanitization, and SHA-256 provenance. The server route files are intentionally thin wrappers around that shared implementation.

## Former API dependencies on Pages

| Server route | Pages behavior |
| --- | --- |
| `/api/pages/[page]` | Fetches Quran Foundation `verses/by_page`, `uthmani_tajweed`, and chapter metadata in the browser, then runs the shared fail-closed page normalizer and checksum calculation. |
| `/api/chapters` | Fetches the CORS-enabled chapter and juz indexes and requires all 114 chapters before producing the index. |
| `/api/lookup` | Uses the CORS-enabled `verses/by_key` page mapping and validates the ayah key and returned page. |
| `/api/search` | Uses the CORS-enabled Quran search and chapter endpoints. Numeric page/ayah fallback remains deterministic if broad search is unavailable. |
| `/api/tafsir` | Fetches Ibn Kathir resource 169 from the CORS-enabled Quran Foundation endpoint, then applies the same sanitization, verse mapping, edition check, and SHA-256 provenance as server mode. |
| `/api/audio-manifest` | Fetches verified verse-key pagination for a surah or juz and builds the existing versioned Alafasy manifest in the browser. Audio download checksums and IndexedDB behavior are unchanged. |
| `/api/content-manifest` | Reads `_site/content/content-manifest.json`, produced from the repository manifest at build time. |
| `/api/translation-packs/amharic` | Reads the build-produced `_site/content/amharic_zain.xml` and revision file; the browser repeats raw checksum, XML safety, 114-surah/6,236-ayah coverage, script, normalized checksum, staging, and activation checks. |

## Source rights and browser compatibility

Quran Foundation page, tajweed, chapter, juz, lookup, search, tafsir, verse-list, and Alafasy audio responses were verified from an `Origin: https://abda-dc.github.io` request. The Quran endpoints and audio CDN return `Access-Control-Allow-Origin: *`, so the Pages transport can acquire them without a proxy.

QuranEnc does not advertise `Access-Control-Allow-Origin` on the Amharic XML download. The registry explicitly records conditional redistribution and offline-storage permission for `quranenc:amharic_zain`, so `build:pages` acquires the exact XML and refuses to emit it unless these pins match:

- 114 surahs and 6,236 ayat;
- raw SHA-256 `3b765a67dc43eb54fc08518c66964ea246209c1284def73d1a69d8c7663780f9`;
- normalized SHA-256 `77ac2ad5f35ba878b07bc7aed9f233ee418a6f43dbe4d095d6ae32f3153ffb13`;
- provider, edition revision, script, attribution, and package safety rules.

The browser repeats all verification before staging and activating the pack in the existing, separate `mushaf-translation-packs-v1` IndexedDB. Install progress, atomic activation, verification, repair, deletion, rollback, quota handling, and storage-reclamation detection are unchanged. Somali and Afaan Oromoo remain blocked. Saheeh International resource 20 and Ibn Kathir resource 169 remain online-only and are never packaged into the Pages artifact.

QuranEnc's update-check URL currently resolves to a large HTML page rather than a bounded machine-readable response and also lacks browser CORS. The Pages build therefore exposes the revision already proven by the exact verified XML package. A package or registry checksum drift fails the build; the reader never scrapes the HTML or uses a hidden backend.

## Repository base path

`app/runtime-config.ts` owns runtime mode and base-path URL generation. The Pages entry configures `/mushaf-companion/`; server mode defaults to `/`. Reader assets, content-manifest links, Amharic acquisition, manifest paths, icon paths, service-worker registration, `start_url`, and scope all use this mechanism or an explicit Pages manifest path.

The Pages build copies `index.html` to `404.html`. GitHub Pages refreshes therefore boot the same reader application, including query-addressed locations such as `?page=42`.

## PWA and cache migration

The Pages service worker registers at `/mushaf-companion/sw.js` with scope `/mushaf-companion/` and `updateViaCache: "none"`. The build injects the emitted hashed reader JavaScript and stylesheet into its pre-cache list. Cache `mushaf-pages-v5-standalone-reader` deletes older `mushaf-pages-*` wrapper caches and `mushaf-companion-*` caches on activation. Navigation is network-first with the standalone `index.html` as the offline application fallback; a branded offline page remains the final fallback.

The service worker does not intercept cross-origin Quran, tafsir, font, or audio requests. It also bypasses the Amharic package path so translation installation and deletion semantics remain controlled by the checksum-verifying IndexedDB service rather than an opaque application-shell cache.

## Deployment and independent verification

`.github/workflows/pages.yml` checks out the repository, installs dependencies, runs lint, tests, the translation audit, the standalone build, and artifact verification, then uploads `_site/` to GitHub Pages.

To verify Pages independently of any other deployment:

```bash
npm ci
npm run lint
npm test
npm run audit:translations
npm run build:pages
npm run verify:pages
npm run smoke:pages
```

`verify:pages` fails if the artifact contains an iframe or ChatGPT Site reference, lacks the React JS/CSS application or Context Lens, contains a same-origin `/api/` dependency, uses assets outside `/mushaf-companion/`, has a wrong manifest start URL or service-worker scope, lacks navigation fallback, or does not contain the exact verified Amharic package.
