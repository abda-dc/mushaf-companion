# Mushaf Companion Project Status

This is the authoritative high-level status source for the current Mushaf Companion portfolio. Historical milestone and source-batch documents remain evidence of their original snapshots; when they differ from this file, this current baseline and the production registries at the baseline commit take precedence.

## 1. Baseline

| Field | Value |
| --- | --- |
| Date | 2026-08-24 |
| Audit branch | `m7sksystems/m-gov1-portfolio-cleanup` |
| Baseline commit | `73f7c99b2187535d2ec3cfe0c1178e22eaf1397e` |
| Base branch | `main` |
| Package version | `1.1.0` |
| Android version | `versionName 1.0`, `versionCode 1` |
| iOS version | `MARKETING_VERSION 1.0`, `CURRENT_PROJECT_VERSION 1` |
| Latest tag/release | `v0.5.0` pre-release |

## 2. Executive product status

Mushaf Companion is a production-active, installable GitHub Pages PWA and server-backed Capacitor application shell built around a verified 604-page Madani Mushaf. The core reader, M1-M8 study architecture, M9H Hadith reader, M9R Islamic Foundations library, M10 reciter expansion, M11 reading architecture, M12.1 Prayer/Qibla, and M12.2 local-notification architecture are implemented.

Production content remains deliberately narrower than the architecture. Hafs 'an Asim is the only active Quran reading. Saheeh International and Ibn Kathir are the single active online English translation and tafsir. Guided Education, production morphology/vocabulary content, M8 evidence relationships, Warsh, Somali/Oromo translations, and custom Adhan audio remain gated or blocked. Native projects build unsigned artifacts, but current-baseline packaging, signing, store setup, and physical-device QA remain release gates.

## 3. Milestone matrix

| Milestone | Capability | Status | Production state | Dependencies | Next action |
| --- | --- | --- | --- | --- | --- |
| M0 | Quran reader, source integrity, Tajweed, transliteration, search, bookmarks, resume | COMPLETE | ACTIVE | Quran Foundation availability for uncached page data | Preserve verified Hafs/page behavior |
| M1 | Ayah Study Lens | COMPLETE | ACTIVE | Active translation/tafsir sources | Maintain shared selected-ayah ownership |
| M2 | Word-study domain | COMPLETE | GATED | Rights-cleared morphology dataset | Approve an exact source and revision |
| M3 | Tap-a-Word | COMPLETE | PARTIALLY ACTIVE | Approved word metadata for meanings/morphology | Keep unsupported fields unavailable |
| M4 | Vocabulary / Foundation 125 | COMPLETE ARCHITECTURE | BLOCKED | Approved curriculum and word provider | Complete source and editorial approval |
| M5 | Occurrence Explorer | COMPLETE ARCHITECTURE | BLOCKED | Approved lemma/root/occurrence corpus | Activate only through audited provider policy |
| M6 | Today Study | COMPLETE | ACTIVE WITH GATED INPUTS | Hifz and reading are active; education/vocabulary inputs depend on approved content | Preserve due-before-new planning |
| M7 | Private Study Notes | COMPLETE | ACTIVE, DEVICE-LOCAL | User backup discipline | Maintain privacy and anchor validation |
| M8 | Evidence relationships | COMPLETE ARCHITECTURE | GATED; ZERO EDGES | Approved evidence provider, rights, checksum and mapping audit | Acquire and approve a real provider |
| M9 | Guided Education | COMPLETE ARCHITECTURE | GATED; ZERO COURSES | Exact curriculum, rights, integrity and named scholarly review | Complete candidate intake and approval |
| M9H | Hadith reader | COMPLETE | ACTIVE FOR 44 APPROVED ENGLISH RECORDS | Full corpora/Arabic require separate rights and review | Expand only through approved ingestion |
| M9R | Islamic Foundations | COMPLETE | ACTIVE REFERENCE LIBRARY | Source batches remain controlled | Maintain `m9r-v10`: 49/49 topics, 160 references |
| M10 | Hafs reciter expansion | COMPLETE | ACTIVE | Upstream audio availability; offline packs limited to Alafasy | Maintain 160-reciter identity/completeness audit |
| M11 | Qira'at/Riwayat foundation | COMPLETE | HAFS ONLY | Reading-specific text, page geometry, fonts, rights and audio compatibility | Keep Warsh fail-closed until all gates pass |
| M12.1 | Prayer times and Qibla | COMPLETE | ACTIVE, DEVICE-LOCAL | User location and selected calculation method | Physical-device comparison during M13 |
| M12.2 | Adhan/prayer notifications | IMPLEMENTED | NATIVE LOCAL SCHEDULING; PWA TEST-ONLY | Permission, Android exact-alarm setting, physical-device QA; approved cue absent | Validate current baseline on Android/iOS hardware |
| M13 | Native Release Readiness | NOT STARTED | PLANNED | M-GOV1B, version decision, current native packages, signing and QA | Enter only after M-GOV1/M-GOV1B acceptance |
| M14 | Controlled Content Expansion | NOT STARTED | PLANNED | Rights, sources, checksums and content review | Prioritize Hadith, translations and tafsir separately |

## 4. Production-active capabilities

- Verified Madani Mushaf ID 1, Hafs 'an Asim, 604 pages, 6,236 ayat, 114-surah index, 15-line page geometry, QCF/Tajweed rendering, transliteration, navigation, search, bookmarks, recent pages and last-read state.
- Saheeh International online translation (Quran Foundation resource 20) and Ibn Kathir (Abridged) online tafsir (resource 169).
- Optional checksum-verified Amharic pack installation inside the Study Lens; the source registry remains disabled by default until the complete pack is installed and verified.
- Hifz, Ayah Study Lens, Today Study, Private Notes, and the device-local progress/review infrastructure.
- Hadith reader with six registered canonical collections and 44 HadeethEnc English translation-approved seed records; this is not a bundled full corpus.
- Islamic Foundations revision `m9r-v10`: 10 collections, 49 reference-ready topics, 0 planned topics and 160 reference placements (78 Quran, 51 Hadith, 31 scholarly).
- 160 verified Hafs reciters: 45 ayah-scoped and 115 surah-scoped; only Alafasy supports verified offline packs.
- Device-local prayer calculations, 12 calculation presets, standard/Hanafi Asr choices, adjustments, local/remembered approximate location and Qibla.
- Opt-in Android/iOS local prayer scheduling and explicit web/PWA test notifications; reliable closed-PWA scheduling is not claimed.
- Installable GitHub Pages PWA plus Capacitor Android/iOS projects and unsigned native artifact workflows.

## 5. Implemented but gated capabilities

- Guided Education contracts, UI, state, transport and release gates: production release is explicitly disabled with zero courses and lessons.
- Word meaning, morphology, root/lemma exploration, Foundation 125 vocabulary and occurrence exploration: contracts exist, but the production provider is disabled and contains zero records.
- M8 evidence provider architecture: no approved production provider and zero shipped edges.
- Reading-aware transports, registries and reciter compatibility: only Hafs has an active page edition.
- Warsh candidate intake records: artifact, rights, integrity, mapping, font, runtime and audio gates all remain incomplete.

## 6. Externally blocked capabilities

- QuranMorph/SinaLab/Birzeit or another production morphology dataset: no repository evidence of a received dataset, approved rights or completed production intake.
- Quranic Arabic Corpus morphology 0.4: reference metadata exists, but target transformation/redistribution approval is not granted and no records are imported.
- Nasiha Guided Education candidate: exact documents, owner/signatory, revision, rights, checksums and named scholarly review are absent.
- Warsh artifact and redistribution/bundling/offline rights; Qalun and Khalaf sources and rights.
- Somali responsible-organization/publisher attribution and Oromo publisher attribution.
- Approved redistributable Adhan notification cue/full recording.
- Android/iOS signing, store accounts/configuration and physical-device QA.

## 7. Deferred capabilities

- Qalun and Khalaf implementation.
- Full Hadith corpora and Arabic Hadith text beyond separately approved records.
- Whole-Quran offline audio packs and offline packs for reciters other than Alafasy.
- Fully bundled offline native Quran runtime.
- Web Push infrastructure for reliable closed-PWA prayer alerts.
- Production analytics implementation.

## 8. Current release risks

- Version truth is inconsistent: package/changelog `1.1.0`, Android/iOS `1.0`/build 1, Capacitor user-agent `0.6`, and latest tag/release `v0.5.0`.
- The last successful native artifact workflow ran at `5bbadf7` (`v0.5.0`), before M11 and M12. Current-baseline native artifacts are not yet recorded.
- `npm audit` reports 22 vulnerable dependency nodes (14 high, 7 moderate, 1 low); production-only audit reports one transitive high-severity `nanoid` advisory. Remediation requires a separately reviewed dependency change.
- `main` is not branch-protected. CODEOWNERS, Dependabot configuration, issue templates and a PR template are absent.
- Native notification behavior has automated coverage but still needs Android and iPhone/iPad device validation.
- No approved custom Adhan audio is distributed; system notification sound is the functional fallback.

## 9. Next milestone sequence

M13 has not started. The approved sequence is:

```text
M-GOV1 Portfolio Cleanup
  -> M-GOV1B Legacy Worktree / Branch Cleanup
  -> M13 Native Release Readiness
  -> Native Distribution
  -> M14 Controlled Content Expansion
```
