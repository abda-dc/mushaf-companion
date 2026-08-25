# Approval Register

Baseline: 2026-08-24 at `73f7c99b2187535d2ec3cfe0c1178e22eaf1397e`.

This register separates source identity, rights, integrity, content review, runtime state and production eligibility. `Candidate`, `metadata-ready`, `reference-ready` and `implemented` are not synonyms for approved content activation.

| Subject | Source | Rights status | Integrity status | Scholarly/content-review status | Runtime status | Production eligibility | Outstanding gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hafs 'an Asim Madani Mushaf | Quran Foundation, Mushaf ID 1 | Upstream terms recorded | 604 pages / 6,236 ayat audited; corpus and page checksums recorded | Current approved Quran baseline | ACTIVE; only registered reading/page edition | ELIGIBLE for current runtime | Preserve source and geometry controls |
| Warsh 'an Nafi' candidate | KFGQPC official index metadata | UNKNOWN | Artifact absent; no local checksums or mapping/font audit | NOT REVIEWED | DISABLED / not registered | NOT ELIGIBLE | Artifact, rights, checksum, page/line/font/adapter/audio approvals |
| Qalun candidate | Not identified | UNKNOWN | NOT STARTED | NOT REVIEWED | NOT IMPLEMENTED | NOT ELIGIBLE | Authoritative source and complete intake |
| Khalaf candidate | Not identified | UNKNOWN | NOT STARTED | NOT REVIEWED | NOT IMPLEMENTED | NOT ELIGIBLE | Authoritative source and complete intake |
| Saheeh International English translation | Quran Foundation resource 20 | Online use retained; permanent offline storage requires permission | 114 surahs / 6,236 ayat and pinned registry checksum | Existing vetted English edition | ACTIVE ONLINE; registry entry disabled for new pack activation | ELIGIBLE for current online use only | Permission required for permanent offline packaging |
| Amharic translation | QuranEnc `amharic_zain`, Muhammad Zain Zahruddin / Africa Academy | Conditional redistribution/offline use recorded; modification prohibited | 114/6,236; pinned raw and normalized SHA-256 | Attribution/source review complete for candidate flow | Available only after explicit full-pack verification; registry disabled by default | ELIGIBLE for existing verified-pack path | Keep update, attribution and checksum pins current |
| Somali translation | QuranEnc `somali_yacob` | Conditional provider terms recorded | 114/6,236; checksums pinned | Attribution incomplete | DISABLED | NOT ELIGIBLE | Confirm original publisher/responsible organization |
| Afaan Oromoo translation | QuranEnc `oromo_ababor` | Conditional provider terms recorded | 114/6,236; checksums pinned | Attribution incomplete | DISABLED | NOT ELIGIBLE | Confirm original publisher |
| Ibn Kathir (Abridged) tafsir | Quran Foundation resource 169 | Upstream terms recorded; not relicensed | Resource/revision mapping and normalized response checksums | Existing vetted English tafsir | ACTIVE ONLINE | ELIGIBLE for current online use | Separate approval for another edition/offline pack |
| HadeethEnc English seeds | HadeethEnc v1.25.0 | `approved-redistribution` with attribution | Workbook checksum plus 44 record checksums | 44 records translation-approved; provider grading preserved | ACTIVE in Hadith reader | ELIGIBLE for the 44 exact records only | New records require controlled ingestion; Arabic/full corpora separate |
| Six Hadith collection registries | Canonical collection metadata | Metadata use only for registry | Schema/identity validation | Metadata-ready, not corpus approval | ACTIVE registry; Nasai/Ibn Majah have zero seeds | ELIGIBLE as metadata/navigation | Full body text requires separate source/rights/review |
| Scholarly references | Alharamain's Message publications 81 and 251 | External-link metadata only | URL/identity validated; text not bundled | Approved as bibliographic source metadata | ACTIVE external links | ELIGIBLE as metadata only | Any copied teaching text requires separate review/rights |
| Islamic Foundations `m9r-v10` | Quran coordinates, HadeethEnc metadata, Alharamain references | Source-specific metadata policies | Full registry validates/deep-freezes | 49/49 reference-ready; neutral navigation copy | ACTIVE | ELIGIBLE as reference library, not course | New sources/topics require batch review |
| Guided Education candidate | Nasiha Level 2 Iman candidate | UNKNOWN | No received revision/checksum | No named reviewer or approval | DISABLED; zero courses/lessons | NOT ELIGIBLE | Exact source, owner/signatory, rights, checksums and named review |
| Quranic Arabic Corpus morphology 0.4 | corpus.quran.com reference metadata | Transformation/redistribution review required | Reference checksum only; zero imported records | NOT APPROVED for target use | DISABLED | NOT ELIGIBLE | Rights decision and complete coordinate/dataset audit |
| QuranMorph/SinaLab/Birzeit morphology | No repository intake record | UNKNOWN | No dataset | NOT REVIEWED | NOT CONFIGURED | NOT ELIGIBLE | Exact source/request/response/rights evidence |
| M8 evidence relationships | Disabled reference provider | UNKNOWN for production source | No production checksum/audit; zero edges | No provider approval | DISABLED | NOT ELIGIBLE | Approved source, rights, pinned revision/checksum and mapping review |
| System notification sound | Android/iOS platform default | Platform-provided | Platform-owned | Not religious content | ACTIVE fallback | ELIGIBLE | Physical-device QA |
| Custom Adhan cue/recording | No asset registered | UNKNOWN | No file/checksum | NOT REVIEWED | DISABLED | NOT ELIGIBLE | Provenance, redistribution, attribution, duration/format and native QA |
| Native publishing | `com.mushafcompanion.reader` Android/iOS projects | Product source code licensed; store rights/accounts not evidenced | Unsigned CI scaffold only; current-baseline package not recorded | Store/privacy/content declarations pending | NOT DISTRIBUTED through stores | NOT ELIGIBLE | Version decision, signing, accounts, current artifacts, physical QA and store authorization |

## Activation rule

A trust-sensitive source becomes production-eligible only when its exact immutable identity and revision, rights for the intended delivery mode, integrity evidence, required content/scholarly review, runtime fail-closed behavior and explicit approval reference all agree. Missing or unknown evidence remains a gate; it is never inferred from technical completeness.
