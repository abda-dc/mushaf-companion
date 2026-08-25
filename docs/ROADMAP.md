# Mushaf Companion Roadmap

Baseline: 2026-08-24 at `73f7c99b2187535d2ec3cfe0c1178e22eaf1397e`.

This roadmap describes portfolio state, not sprint estimates or delivery commitments. Historical milestone/source documents remain evidence of the state when they were written. Current high-level status is maintained in [PROJECT-STATUS.md](./PROJECT-STATUS.md).

## Status language

- **COMPLETE** — implemented and validated at the current baseline.
- **ACTIVE** — available in the current production runtime.
- **GATED** — implementation exists but activation requires explicit source, rights, integrity, approval or device gates.
- **BLOCKED** — progress depends on an external source, right, account, approval or hardware result that is not available.
- **PLANNED** — accepted future work that has not started.
- **DEFERRED** — intentionally outside the near-term release sequence.

## Completed foundation

| Capability | Status | Current boundary |
| --- | --- | --- |
| Page-first Quran reader | COMPLETE / ACTIVE | 604-page Madani Mushaf ID 1; Hafs 'an Asim only |
| Quran trust and provenance | COMPLETE / ACTIVE | 6,236-ayah full audit, per-page SHA-256 provenance, fail-closed source validation |
| Reading assistance | COMPLETE / ACTIVE | Tajweed, transliteration, selection, themes, fonts, page navigation and accessibility controls |
| English translation | COMPLETE / ACTIVE | Saheeh International, Quran Foundation resource 20, online use |
| English tafsir | COMPLETE / ACTIVE | Ibn Kathir (Abridged), resource 169, online when not ordinarily cached |
| Audio and offline packs | COMPLETE / ACTIVE | 160 Hafs reciters; verified offline sūrah/juz packs remain Alafasy-only |
| PWA | COMPLETE / ACTIVE | Standalone GitHub Pages React reader, verified service worker and install metadata |
| Native shell | COMPLETE / GATED FOR DISTRIBUTION | Capacitor Android/iOS projects; signed store packages not yet produced |

## Study platform

| Milestone | Capability | Status | Current boundary |
| --- | --- | --- | --- |
| M1 | Ayah Study Lens | COMPLETE / ACTIVE | Reuses verified translation, tafsir, audio, Tajweed and Hifz ownership |
| M2 | Word-study contracts | COMPLETE / GATED | No approved production morphology/word provider |
| M3 | Tap-a-Word | COMPLETE / PARTIALLY ACTIVE | Coordinate selection works; unapproved linguistic fields stay unavailable |
| M4 | Vocabulary / Foundation 125 | COMPLETE ARCHITECTURE / BLOCKED | Zero approved production entries |
| M5 | Occurrence Explorer | COMPLETE ARCHITECTURE / BLOCKED | Requires approved lemma/root/occurrence corpus |
| M6 | Today Study | COMPLETE / ACTIVE | Hifz and reading active; vocabulary/education steps appear only with approved content |
| M7 | Private Notes | COMPLETE / ACTIVE | Device-local, unencrypted storage and explicit backup only |
| M8 | Evidence relationships | COMPLETE ARCHITECTURE / GATED | No approved provider; zero evidence edges ship |

## Islamic knowledge

| Milestone | Capability | Status | Current boundary |
| --- | --- | --- | --- |
| M9 | Guided Education | COMPLETE ARCHITECTURE / BLOCKED | Zero courses/lessons; exact curriculum, rights, integrity and named scholarly review required |
| M9H | Hadith foundation and reader | COMPLETE / ACTIVE | Six collection registries and 44 approved English seed records; no claim of full corpora |
| M9R | Islamic Foundations | COMPLETE / ACTIVE | `m9r-v10`: 10 collections, 49/49 reference-ready topics, 160 references, 0 planned |

Guided Education is not activated by architectural completeness. Candidate status is not approval.

## Recitation and Quran readings

| Milestone | Capability | Status | Current boundary |
| --- | --- | --- | --- |
| M10 | Expanded reciter library | COMPLETE / ACTIVE | 160 complete Hafs reciters; reading identity remains Hafs |
| M11 | Qira'at/Riwayat architecture | COMPLETE / ACTIVE FOUNDATION | Reading-aware registry, page edition and compatibility layer; Hafs is the only registered runtime reading |
| M11 follow-up | Warsh activation | GATED / BLOCKED | Artifact not received; rights, checksums, page/line geometry, font, adapter and audio compatibility unapproved |
| Future | Qalun | PLANNED | No source, rights record or implementation |
| Future | Khalaf | PLANNED | No source, rights record or implementation |

The existing generic verse-to-page lookup remains bound to the active Hafs transport unless a reading-specific page edition is supplied. Unsupported readings fail closed; they must never silently fall back to Hafs.

## Salah

| Milestone | Capability | Status | Current boundary |
| --- | --- | --- | --- |
| M12.1 | Prayer times and Qibla | COMPLETE / ACTIVE | Device-local calculations and location handling; physical-device comparison remains release QA |
| M12.2 | Adhan/prayer notifications | IMPLEMENTED / GATED FOR NATIVE RELEASE | Android/iOS local scheduling implemented; system sound remains the notification fallback because no approved `<30s` custom cue is registered; physical-device QA outstanding |
| Future | Reliable closed-PWA alerts | DEFERRED | Requires separately authorized, privacy-reviewed Web Push infrastructure |

M13D contains two reviewed redistributable full-Adhan release candidates for explicit foreground playback: Regular Adhan (CC0 1.0) and Fajr Adhan (CC BY 3.0); shared-baseline bundling remains pending merge. They are purpose-isolated from notification sounds. No approved `<30s` custom Adhan notification cue is registered, so the platform system sound remains the notification fallback.

### M13D — Adhan Rights, Provenance, and Full Playback

**IMPLEMENTED / VALIDATED — PENDING MERGE.**

M13D establishes a reviewed Regular/Fajr full-playback asset registry, exact SHA-256 identities, provenance and licensing records, Fajr attribution/change disclosure, base-path-safe foreground playback, explicit Play/Stop controls, Pages packaging, and exact artifact-inventory protection.

The boundary remains deliberate:

- full recordings are `full-playback` assets only;
- they can never resolve through the notification-cue registry;
- no custom `<30s` notification cue is currently approved;
- system notification sound remains the native notification fallback;
- full Adhan autoplay while the application is closed or backgrounded is not claimed;
- Android/iOS physical-device validation remains part of native release readiness.

## Current governance milestone

### M-GOV1 — Portfolio Cleanup

**ACTIVE.** Establish the authoritative status, roadmap, branch inventory, dependency/approval registers and release baseline. This milestone changes documentation only.

### M-GOV1B — Legacy Worktree / Branch Cleanup

**PLANNED.** Review the two protected dirty legacy worktrees, preserve any unique work, then execute separately authorized branch/worktree cleanup. Historical PRs and merge evidence are not rewritten.

## Next: M13 Native Release Readiness

**PLANNED — NOT STARTED.**

M13 begins only after M-GOV1 and M-GOV1B acceptance. Its entrance criteria are defined in [RELEASE-BASELINE.md](./RELEASE-BASELINE.md). The milestone must resolve or explicitly accept:

- one release-version decision across package, Android, iOS and release tags;
- current-baseline Android/iOS package verification;
- Android and iPhone/iPad physical-device QA;
- prayer-notification permission, scheduling, exact/inexact, background/closed-app and tap flows;
- Android signing/Play prerequisites and iOS signing/App Store Connect prerequisites;
- security-advisory remediation decisions;
- store artwork, metadata, privacy and support material;
- a release/rollback record with no unverified content activation.

## Then: Native Distribution

**PLANNED.** Signed builds, store submission and rollout are separate from readiness. Distribution requires explicit authorization after M13 evidence is reviewed.

## Then: M14 Controlled Content Expansion

**PLANNED.** Candidate work streams may include:

- Hadith expansion through separately approved datasets;
- translation expansion, beginning only with sources whose attribution and rights are complete;
- tafsir expansion using separately vetted editions;
- approved morphology/vocabulary/evidence providers;
- Warsh activation only after every M11 gate passes.

Each content stream must remain independently reviewable. M14 must not treat a registered candidate as approved or activate multiple trust-sensitive sources in one opaque change.

## Deferred

- Qalun and Khalaf until authoritative artifacts and rights are identified.
- Whole-Quran browser audio downloads and offline packs for all 160 reciters.
- A fully bundled offline native Quran runtime.
- Production analytics until privacy, consent and retention policy are approved.
- Cloud synchronization for private notes and learning state.
