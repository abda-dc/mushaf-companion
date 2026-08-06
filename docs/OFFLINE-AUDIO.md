# Offline audio integrity and recovery

Version 0.9.0 delivers the Phase 2 offline-audio MVP for Mishary Rashid Alafasy. Users explicitly choose a sūrah or juz pack; the application never caches recitation opportunistically.

## Pack lifecycle

1. `GET /api/audio-manifest?type=surah&id=1&reciter=alafasy` (or `type=juz`) resolves the verified verse-key sequence and returns a versioned download manifest.
2. The browser checks its reported storage quota and the user’s Wi-Fi-only preference before starting.
3. Files download with a maximum concurrency of two. Completed files are retained when a download is paused, interrupted, or retried.
4. Each response is hashed with SHA-256, committed to IndexedDB, read back, and hashed again. A file is not marked complete until both hashes match.
5. A pack becomes playable only after every manifest entry has a stored checksum. Partial packs stay visibly incomplete.
6. Playback asks IndexedDB for a verified blob first. If it is unavailable and the device is online, playback falls back to the attributed streaming URL.

## Recovery and storage

- **Pause and resume:** active requests are aborted; already verified files are preserved and excluded from the next run.
- **Retry:** only failed or missing files are requested again, with bounded transient retries.
- **Verify and repair:** the manager re-hashes every stored file, removes mismatches, and downloads only the missing results.
- **Delete:** removing a pack reclaims its files unless another saved pack references the same verse recording.
- **Storage visibility:** the manager reports audio bytes used, browser quota, persistence status, and totals for every pack.

## Supported scope and platform limits

- Offline packs currently support Mishary Rashid Alafasy only. The other reciters continue to stream.
- Pack scopes are sūrah and juz. Whole-Quran download is deliberately deferred until real-world quota behavior is proven.
- The browser may stop downloads when the tab or installed PWA is suspended. The app keeps completed files and clearly asks the user to resume; it does not claim background-download support.
- Browser storage can be reclaimed by the operating system unless persistent storage is granted. The manager exposes that state and can request persistence where supported.
- The application shell must have been opened once online so its service worker can prepare cold-start assets. Verified Quran page data still requires the content API; saved audio packs can sequence independently of page retrieval.

## Source and integrity metadata

- Reciter: Mishary Rashid Alafasy
- Provider: Quran Foundation recitation files
- Manifest revision: `2026-08-06-alafasy-v1`
- Stable identity: `reciterId|verse_key`
- Integrity algorithm: SHA-256 computed locally after download and again after IndexedDB readback
- Licensing: upstream audio terms apply; the application does not relicense recordings
