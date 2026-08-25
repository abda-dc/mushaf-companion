# Branch Inventory and Namespace Governance

Baseline: 2026-08-24 after `git fetch --prune origin`, with `main` at `73f7c99b2187535d2ec3cfe0c1178e22eaf1397e`.

## Namespace policy

All new Mushaf Companion feature/work branches use `m7sksystems/*`. Existing `codex/*` branches are historical evidence and are not renamed. Historical PRs, merge commits and Actions records remain unchanged.

M-GOV1 performs classification only. It does not delete branches or worktrees. Any cleanup is a separately authorized M-GOV1B operation.

## Summary

- Existing `codex/*` names: **24**
- Local `codex/*` refs: **23**
- Remote `origin/codex/*` refs: **22**
- Total local plus remote `codex/*` refs: **45**
- Codex classifications: **19 merged**, **3 superseded**, **2 review required**, **0 active**, **0 blocked**
- Codex safe-deletion candidates: **22 unique names**
- Codex migration candidates: **0**
- Protected branches: **2**, both `REVIEW REQUIRED — PRESERVE`
- Other historical feature refs: `origin/agent/pr-ci-validation`, merged and a safe-deletion candidate
- Current M-GOV1 branch: `m7sksystems/m-gov1-portfolio-cleanup`, active and retained through review

## Current baseline and active governance branch

| Branch | Tip | Relation to main | Classification | Recommended action |
| --- | --- | --- | --- | --- |
| `main` | `73f7c99` | Authoritative baseline | BASELINE | RETAIN |
| `m7sksystems/m-gov1-portfolio-cleanup` | `73f7c99` plus uncommitted documentation diff | Created from verified current main | ACTIVE | RETAIN through M-GOV1 review; do not commit without authorization |

## Existing `codex/*` branches

Ahead/behind is reported as `behind/ahead` against `origin/main` using the remote tip when present.

| Branch | Local / remote | Tip | Relation to main | Classification | PR | Recommended action |
| --- | --- | --- | --- | --- | --- | --- |
| `codex/ayah-context-lens` | Both | `bd30fe4` | `62/0`; ancestor | MERGED | #6 | SAFE-DELETION-CANDIDATE |
| `codex/branding-assets` | Both | `5f5ecca` | `68/0`; ancestor | MERGED | #3 | SAFE-DELETION-CANDIDATE |
| `codex/guided-education-m9a` | Both | `3170da7` | `51/1`; patch-equivalent commit already in main | SUPERSEDED | #9 | SAFE-DELETION-CANDIDATE |
| `codex/hifz-mode` | Both; tips differ | remote `bd9781e`; local `4831af9` | Both incorporated into main | MERGED | #1, #2 | SAFE-DELETION-CANDIDATE |
| `codex/m10-expanded-reciter-library` | Both; clean worktree attached | `3696a65` | `47/0`; ancestor | MERGED | #11 | SAFE-DELETION-CANDIDATE after clean worktree retirement |
| `codex/m11-qiraat-riwayat-foundation` | Both; clean worktree attached | `79a864e` | `1/0`; ancestor | MERGED | #26 | SAFE-DELETION-CANDIDATE after clean worktree retirement |
| `codex/m12-prayer-qibla-core` | Both; clean worktree attached | `5bf3a21` | `29/0`; ancestor | MERGED | #19 | SAFE-DELETION-CANDIDATE after clean worktree retirement |
| `codex/m12.2-adhan-notifications` | Both | `c647b9e` | `22/0`; ancestor | MERGED | #22 | SAFE-DELETION-CANDIDATE |
| `codex/m12.2a-exact-alarm-reconciliation` | Remote only | `125b67a` | `17/0`; ancestor | MERGED | #23 | SAFE-DELETION-CANDIDATE |
| `codex/m9b-citation-provenance-intake` | Both | `5e461e4` | `49/1`; patch-equivalent commit already in main | SUPERSEDED | #12 | SAFE-DELETION-CANDIDATE |
| `codex/m9b-citation-provenance-integration` | Both; clean worktree attached | `bc8c740` | `46/1`; patch-equivalent to integrated PR #12 work | SUPERSEDED | #12 related | SAFE-DELETION-CANDIDATE after clean worktree retirement |
| `codex/m9h-hadith-reader-foundation` | Local only; dirty protected worktree | `763c2f0` | Tip is ancestor; worktree has 3 tracked modifications and 16 untracked files that differ partly from main | REVIEW REQUIRED | Successor work reached #13 | **REVIEW REQUIRED — PRESERVE** |
| `codex/m9h2b-m9r3-tawhid-sources` | Both; clean worktree attached | `19fc1d4` | `40/0`; ancestor | MERGED | #14 | SAFE-DELETION-CANDIDATE after clean worktree retirement |
| `codex/m9r-foundations-reference-library` | Local only; dirty protected worktree | `763c2f0` | Tip is ancestor; worktree has 3 untracked files that differ from main | REVIEW REQUIRED | Successor work reached #13 | **REVIEW REQUIRED — PRESERVE** |
| `codex/m9r10-ihsan-sources` | Both | `fd6744b` | `13/0`; ancestor | MERGED | #24 | SAFE-DELETION-CANDIDATE |
| `codex/m9r10a-tirmidhi-grading` | Both; clean worktree attached | `a298be6` | `8/0`; ancestor | MERGED | #25 | SAFE-DELETION-CANDIDATE after clean worktree retirement |
| `codex/m9r4-quran-sunnah-sources` | Both; clean worktree attached | `ac7b648` | `38/0`; ancestor | MERGED | #15 | SAFE-DELETION-CANDIDATE after clean worktree retirement |
| `codex/m9r5-akhlaq-adab-sources` | Both; clean worktree attached | `3509e59` | `36/0`; ancestor | MERGED | #16 | SAFE-DELETION-CANDIDATE after clean worktree retirement |
| `codex/m9r9-akhirah-sources` | Both | `b408394` | `24/0`; ancestor | MERGED | #21 | SAFE-DELETION-CANDIDATE |
| `codex/m9rh-islamic-foundations-hadith-integration` | Both; clean worktree attached | `73768ec` | `43/0`; ancestor | MERGED | #13 | SAFE-DELETION-CANDIDATE after clean worktree retirement |
| `codex/multilingual-source-registry` | Both | `026603e` | `66/0`; ancestor | MERGED | #4 | SAFE-DELETION-CANDIDATE |
| `codex/multilingual-translation-packs` | Both | `9727967` | `64/0`; ancestor | MERGED | #5 | SAFE-DELETION-CANDIDATE |
| `codex/standalone-github-pages-pwa` | Both | `deaabff` | `60/0`; ancestor | MERGED | #7 | SAFE-DELETION-CANDIDATE |
| `codex/study-platform-m1-m6` | Both | `8e91368` | `58/0`; ancestor | MERGED | Incorporated before/through later study PRs | SAFE-DELETION-CANDIDATE |

`git cherry -v origin/main` reports `-` for each of the three superseded tips, confirming that their patches are already represented in main despite non-ancestral tip history.

## Other historical branch

| Branch | Tip | Relation | Classification | PR | Recommended action |
| --- | --- | --- | --- | --- | --- |
| `origin/agent/pr-ci-validation` | `2ffb577` | Incorporated into main | MERGED | #10 | SAFE-DELETION-CANDIDATE after explicit authorization |

## Protected worktree policy

The worktrees for `codex/m9h-hadith-reader-foundation` and `codex/m9r-foundations-reference-library` contain uncommitted user material. They must not be modified, staged, stashed, reset, cleaned, committed, removed, renamed or deleted during M-GOV1. M-GOV1B must compare and preserve any unique work before deciding their disposition.

## Migration recommendation

No historical branch contains unique committed active or blocked work that should be migrated. Therefore no `codex/*` to `m7sksystems/*` migration is recommended.

Future work begins directly from current `main` under names such as:

```text
main
|
+-- m7sksystems/m13-native-release-readiness
+-- m7sksystems/m13-native-distribution
+-- m7sksystems/m14-hadith-expansion
+-- m7sksystems/m14-translations
+-- m7sksystems/m14-tafsir-expansion
`-- m7sksystems/m11-warsh-activation
```

These example branches were not created by M-GOV1.
