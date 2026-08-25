# External Dependency Register

Baseline: 2026-08-24 at `73f7c99b2187535d2ec3cfe0c1178e22eaf1397e`.

Unknown information is recorded as unknown. Candidate metadata, an upstream URL or implemented gates do not constitute approval.

| Dependency | Feature / milestone | Required from | Current state | Blocking? | Evidence | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| QuranMorph / SinaLab / Birzeit morphology dataset | M2-M5, M14 | Dataset owner/provider | **WAITING FOR EXTERNAL SOURCE** — no request, response, acquired dataset, rights record or production intake evidence was found in the repository | Yes | Repository search at baseline | Identify exact dataset/version and open a documented rights/source intake |
| Quranic Arabic Corpus morphology 0.4 | M2-M5 | Corpus owner and internal approver | **WAITING FOR RIGHTS** — reference metadata/checksum exists; zero records imported; transformation/redistribution approval not granted | Yes | `app/word-study.ts` | Resolve target-use rights, then perform exact dataset and coordinate audit |
| Production evidence provider | M8 | External source and internal approval | **WAITING FOR EXTERNAL SOURCE** — disabled reference descriptor only; zero edges | Yes | `app/evidence-layer.ts`, `docs/EVIDENCE-RELATIONSHIPS.md` | Select provider, record rights/revision/checksum and audit Quran mappings |
| Exact Guided Education curriculum | M9 | Nasiha Community Center or another authorized owner | **WAITING FOR EXTERNAL SOURCE** — candidate title only; no source URL/document reference, author, revision or received date | Yes | `content/education/candidates/nasiha-level2-iman/source-manifest.json` | Receive and identify the exact immutable source documents |
| Guided Education rights | M9 | Rights owner/authorized signatory | **WAITING FOR RIGHTS** — owner, signatory, license, attribution and all grants unknown | Yes | Candidate `rights-intake.json` | Obtain written application, redistribution, bundling, offline and modification decisions |
| Guided Education scholarly review | M9 | Named qualified reviewers | **WAITING FOR SCHOLARLY REVIEW** — no reviewers, source revision, checksum, scope or approval reference | Yes | Candidate `scholarly-review-intake.json` | Review the exact normalized package after source and rights intake |
| Warsh source artifact | M11 | King Fahd Glorious Qur'an Printing Complex | **WAITING FOR EXTERNAL SOURCE** — official index metadata only; artifact/download URL/readme absent | Yes | Warsh `source-manifest.json` | Acquire exact package and record local SHA-256 |
| Warsh rights | M11 | KFGQPC / rights owner | **WAITING FOR RIGHTS** — license/readme absent; application, redistribution, bundling, offline and modification grants unknown | Yes | Warsh `rights-intake.json` | Obtain and review authoritative package terms |
| Warsh edition validation | M11 | Internal Quran/source review and QA | **BLOCKED** — checksum, ayah identity, numbering, page boundaries, multipage ayat, line geometry, font, adapter and audio gates are all false | Yes | Warsh `activation-gates.json` | Run controlled intake only after artifact and rights are available |
| Qalun source and rights | Future M11/M14 | Authoritative provider and rights owner | **DEFERRED** — no artifact, rights record or implementation | Yes for activation | Repository baseline | Identify source and create a separate candidate intake |
| Khalaf source and rights | Future M11/M14 | Authoritative provider and rights owner | **DEFERRED** — no artifact, rights record or implementation | Yes for activation | Repository baseline | Identify source and create a separate candidate intake |
| Somali original publisher/responsible organization | M14 translations | QuranEnc catalog/source owner | **WAITING FOR EXTERNAL SOURCE** — coverage/checksums pass; attribution remains incomplete | Yes | `quranenc:somali_yacob` registry entry | Confirm authoritative publisher/organization and revise attribution review |
| Oromo original publisher | M14 translations | QuranEnc catalog/source owner | **WAITING FOR EXTERNAL SOURCE** — coverage/checksums pass; publisher remains unknown | Yes | `quranenc:oromo_ababor` registry entry | Confirm authoritative publisher and revise attribution review |
| Saheeh International permanent offline rights | Future translation packs | Quran Foundation / rights holder | **WAITING FOR RIGHTS** — current online use retained; permanent storage requires express permission | Yes for offline pack; no for current online display | `quran-foundation:translation:20` registry entry | Seek permission only if an offline English pack is prioritized |
| Approved Adhan recording/cue | M12.2 / M13 | Rights-cleared recording owner | **WAITING FOR EXTERNAL SOURCE / RIGHTS** — registry empty; no provenance, license, checksum, attribution or platform validation | Custom audio only | `app/adhan-assets.ts` | Acquire a redistributable cue and validate iOS duration/native placement |
| Android release signing | M13 / distribution | Product owner | **WAITING FOR STORE ACCOUNT / SIGNING** — no release keystore/signing configuration stored | Yes | `docs/MOBILE.md`, workflow | Confirm secure keystore ownership and release-signing process |
| Google Play configuration | Distribution | Product owner / Google Play | **WAITING FOR STORE ACCOUNT / SIGNING** — account, listing, policy and release-track readiness not evidenced | Yes | Repository baseline | Confirm account, package ownership, listing and privacy declarations |
| Android physical-device QA | M13 | Android hardware/test owner | **WAITING FOR HARDWARE QA** — notification, Doze, exact/inexact, closed-app, audio and navigation matrix outstanding | Yes | `docs/M12.2-ADHAN-NOTIFICATIONS.md` | Execute documented device/OS matrix at current baseline |
| iOS signing and provisioning | M13 / distribution | Product owner / Apple Developer | **WAITING FOR STORE ACCOUNT / SIGNING** — team, certificates and provisioning not evidenced | Yes | Xcode project, `docs/MOBILE.md` | Confirm team, identifiers, certificates and provisioning workflow |
| App Store Connect readiness | Distribution | Product owner / Apple | **WAITING FOR STORE ACCOUNT / SIGNING** — listing, policies and submission configuration not evidenced | Yes | Repository baseline | Confirm account, app record, metadata, privacy and review assets |
| iPhone/iPad physical-device QA | M13 | Apple hardware/macOS test owner | **WAITING FOR HARDWARE QA** — foreground/background/closed alerts, Focus/Silent Mode, tap, audio and layout outstanding | Yes | `docs/M12.2-ADHAN-NOTIFICATIONS.md` | Execute iPhone/iPad matrix on macOS/Xcode |

## Current ready dependencies

- Quran Foundation/Quran.com current online Hafs, Saheeh International and Ibn Kathir paths are production-active under their recorded upstream terms and fail-closed runtime policies.
- Amharic `amharic_zain` has complete attribution, conditional redistribution terms, 114/6,236 coverage and pinned checksums for the existing explicit verified-pack flow.
- HadeethEnc English dataset v1.25.0 supports the 44 approved seed records with recorded attribution and checksums.

Ready means ready for the currently documented use only; it does not expand rights to new packaging, modification or distribution modes.
