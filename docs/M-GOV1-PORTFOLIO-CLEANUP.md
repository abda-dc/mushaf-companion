# M-GOV1 Portfolio Baseline, Governance and Cleanup

## Objective

Establish one evidence-backed product, source, branch, governance, dependency and release baseline before M13. M-GOV1 is documentation/governance work; it does not introduce product functionality or activate content.

## Inspected baseline

- Date: 2026-08-24
- Repository: `abda-dc/mushaf-companion`
- Base: `main`
- Commit: `73f7c99b2187535d2ec3cfe0c1178e22eaf1397e`
- Audit branch: `m7sksystems/m-gov1-portfolio-cleanup`
- Package: `1.1.0`
- Primary `main` worktree was clean and synchronized before the isolated worktree was created.
- Protected legacy worktrees were not modified.

## Evidence reviewed

- Current reader, content manifests, registries and activation policies under `app/`.
- Quran, translation, tafsir, education, Hadith, Islamic Foundations, reading, Warsh and notification manifests.
- Current tests and scripts as implementation evidence; no test/source files were changed.
- Package/lock metadata, Capacitor configuration, Android/iOS version and identity metadata.
- README, changelog, all current portfolio/architecture documentation and historical M9R batch documents.
- Git refs, ancestry, patch equivalence, worktrees, PR history, tags/releases and recent Actions runs.
- GitHub repository visibility, open PR/issues, Pages configuration and `main` protection state.
- `npm audit`, production-only audit, outdated report and installed dependency tree.

## Files changed

- `README.md`
- `CHANGELOG.md`
- `docs/ROADMAP.md`
- `docs/HADITH-ENGLISH-INGESTION.md`
- `docs/ISLAMIC-FOUNDATIONS-REFERENCE-ARCHITECTURE.md`
- `docs/HADITH-READER-FOUNDATION.md`
- `docs/HADITH-READER-UI.md`
- `docs/ISLAMIC-FOUNDATIONS-HADITH-INTEGRATION.md`
- `docs/PRIVATE-STUDY-NOTES.md`
- `docs/PROJECT-STATUS.md`
- `docs/EXTERNAL-DEPENDENCIES.md`
- `docs/APPROVAL-REGISTER.md`
- `docs/BRANCH-INVENTORY.md`
- `docs/RELEASE-BASELINE.md`
- `docs/M-GOV1-PORTFOLIO-CLEANUP.md`

## Files intentionally not changed

- Runtime code under `app/`.
- Tests, scripts, Android, iOS, Pages source and GitHub workflows.
- `package.json`, `package-lock.json` and Capacitor configuration.
- Quran, translation, tafsir, Hadith, Islamic Foundations, education, reading and Adhan source content/manifests.
- Historical `ISLAMIC-FOUNDATIONS-SOURCE-BATCH-*` snapshots.
- Any branch history, tag, release, repository setting or protected legacy worktree.

## Stale information corrected

- Replaced the obsolete translation/tafsir/audio V2 roadmap with the M0-M14 portfolio sequence.
- Replaced the README's six-reciter snapshot with the code-proven 160-reciter M10 state.
- Added current Hadith, Islamic Foundations, reading, Prayer/Qibla and notification boundaries to the README.
- Reconciled the changelog's Unreleased section across M1-M12 without declaring a new release.
- Corrected current aggregate Hadith counts to 44 seeds and Islamic Foundations to `m9r-v10`, 49/49 topics and 160 references while preserving historical batch snapshots.
- Corrected Private Notes current schema from its M7 snapshot to schema v2/preference v8 after Guided Education lesson-anchor extension.
- Documented package/native/tag version drift rather than changing versions.
- Added authoritative project status, dependency, approval, branch and release registers.

## Portfolio findings

- Core Mushaf: 604 pages, 6,236 ayat, 114 surahs and one registered active reading, Hafs 'an Asim.
- Active online English sources: Saheeh International resource 20 and Ibn Kathir (Abridged) resource 169.
- M1-M8 architecture is implemented; production morphology/vocabulary/evidence content remains disabled where sources are unapproved.
- Guided Education production release is disabled with zero courses and lessons.
- Hadith: six collection registries, 44 exact HadeethEnc English translation-approved records; no full-corpus claim.
- Islamic Foundations: `m9r-v10`, 10 collections, 49/49 reference-ready topics, 0 planned and 160 references.
- Audio: 160 verified Hafs reciters; 45 ayah-scoped and 115 surah-scoped; offline packs remain Alafasy-only.
- M11 is merged; Warsh is candidate-only with all activation gates incomplete; Qalun/Khalaf are deferred.
- M12.1 and M12.2 are implemented; PWA closed-app scheduling and native physical-device validation remain bounded gaps.

## Branch findings

- 24 unique existing `codex/*` names remain: 19 merged, 3 superseded and 2 `REVIEW REQUIRED — PRESERVE`.
- 22 historical codex names are safe-deletion candidates after explicit authorization; none should be renamed.
- No historical branch requires `m7sksystems/*` migration.
- The two dirty local-only branches remain protected for M-GOV1B.
- All new work uses `m7sksystems/*`.

## Release findings

- Package/changelog version is `1.1.0`; Android/iOS are `1.0` build/code 1; user-agent is `0.6`; latest tag/release is `v0.5.0` pre-release.
- Pages CI passed at the baseline SHA.
- The last native artifact workflow passed at `v0.5.0`, before current M11/M12 work.
- Android/iOS identity is consistently `com.mushafcompanion.reader`.
- Native outputs remain unsigned and store/device readiness is incomplete.

## Governance findings

- Repository is public; default branch is `main`; Pages is public and HTTPS-enforced.
- No open PRs or issues were present at audit time.
- `main` has no branch protection.
- PR CI, Pages and native packaging workflows are present and active.
- `SECURITY.md` and `CONTRIBUTING.md` exist.
- CODEOWNERS, Dependabot configuration, issue templates, PR template and a standalone release-process document are absent.
- Future governance should require PRs, passing PR CI, no force pushes/deletion and optionally resolved conversations. No setting was changed in M-GOV1.

## Dependency findings

- 823 locked package entries; 9 direct production and 17 direct development dependencies.
- Full audit: 22 vulnerable nodes — 14 high, 7 moderate, 1 low, no critical.
- Production-only audit: one transitive high-severity `nanoid` advisory.
- No dependency or lockfile remediation was performed. M13 must triage and validate compatible changes separately.

## Known risks

- Version inconsistency and absence of a post-1.1.0 release/tag decision.
- Current-baseline native packaging and all physical-device QA are missing.
- Signing/store prerequisites are not evidenced.
- Custom Adhan audio lacks source, rights and device validation.
- Several trust-sensitive sources remain blocked by rights, attribution, artifact or scholarly-review gaps.
- Unprotected `main` and missing repository governance templates/configuration.

## Unresolved questions

- Which public version should M13 assign, and how should native build numbers advance?
- Who owns Android/iOS signing and store accounts?
- Which devices/OS versions form the required release QA matrix?
- Does either protected legacy worktree contain unique work worth preserving?
- Which dependency advisories affect deployed paths and which compatible upgrades will M13 accept?
- Which, if any, external content source should enter M14 first?

## Validation results

The documentation-only candidate passed the required M-GOV1 validation on 2026-08-24:

- `git diff --check`: passed.
- `npm run lint`: passed with 0 errors and 21 existing warnings (unused imports/variables in application, script and test files). No warning was suppressed or mechanically changed during the documentation-only audit.
- `npm test`: passed; the production build completed and all 584 tests passed with 0 failures and 0 skipped tests.
- `npm run audit:translations`: passed for all four registered sources. Each returned 114 surahs and 6,236 ayat; status/enablement remained unchanged.
- `npm run build:pages`: passed and verified the 6,236-ayat Amharic package. Vite reported a non-fatal 834.73 kB JavaScript chunk-size warning.
- `npm run verify:pages`: passed; repository scope, reader assets, standalone operation and absence of iframe/ChatGPT Site dependencies were verified.
- `npm run smoke:pages`: passed; initial load, query refresh, assets, manifest, service worker, scope and wrapper removal were verified.
- `npm run audit:content`: not rerun. The command unconditionally rewrites the tracked religious-content audit report with a new timestamp, which would violate this pass's documentation-only/content-preservation boundary. The existing 2026-08-06 report remains `passed` for 604 pages and 6,236 unique verse keys.

The build/test output also repeated the non-fatal large-chunk warning. These warnings and the dependency advisories documented above remain M13 triage items; they do not invalidate the M-GOV1 documentation baseline.

## Recommendation

Accept M-GOV1 only after the documentation diff and required validation are reviewed. Then run the narrow M-GOV1B protected-worktree/branch cleanup. Do not state that M13 has started.

Exact sequence:

```text
M-GOV1 Portfolio Cleanup
  -> M-GOV1B Legacy Worktree / Branch Cleanup
  -> M13 Native Release Readiness
  -> Native Distribution
  -> M14 Controlled Content Expansion
```
