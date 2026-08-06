# Page-fidelity baselines

These reviewed screenshots lock the current Madani Mushaf ID 1 composition for pages 1, 2, 3, 187, 293, 416, and 604. Together they cover sparse and dense pages, surah openings and boundaries, the At-Tawbah opening without a bismillah, sajdah verses, and the three-surah final page.

- `desktop/`: 1440 × 1200 viewport.
- `mobile/`: 500 × 900 responsive viewport, below the reader's 790 px mobile breakpoint.
- Source geometry: Quran Foundation Content API, Mushaf ID 1, fixed 15-line slots.
- Capture date: 2026-08-06.

The automated gate verifies that all fourteen PNG baselines exist at the locked dimensions. `page-fidelity.json` provides the exact verse, word, occupied-line, boundary, and sajdah expectations used by the full-corpus audit.
