# Release Baseline

Baseline date: 2026-08-24. Baseline commit: `73f7c99b2187535d2ec3cfe0c1178e22eaf1397e`.

## Version truth

| Surface | Version / state |
| --- | --- |
| `package.json` | `1.1.0` |
| Latest changelog release heading | `1.1.0` (2026-08-07) |
| Android | `versionName "1.0"`, `versionCode 1` |
| iOS | `MARKETING_VERSION 1.0`, `CURRENT_PROJECT_VERSION 1` |
| Capacitor user agent | `MushafCompanionNative/0.6` |
| Latest Git tag | `v0.5.0` |
| GitHub release | `v0.5.0` pre-release |

M-GOV1 does not change these values. M13 must choose one public version and define monotonically increasing Android/iOS build numbers before signed distribution.

## Web and PWA

- GitHub Pages is public, HTTPS-enforced and workflow-deployed from `main` at `https://abda-dc.github.io/mushaf-companion/`.
- Baseline Pages workflow run `32757118932` succeeded for `73f7c99` on 2026-08-24.
- The artifact is the standalone React reader with repository-safe paths, a generated service worker, offline shell/navigation fallback, verified Amharic artifact controls and no same-origin server API dependency.
- Quran pages, online English translation/tafsir and most audio still depend on their approved upstream network paths. The shell can install/cold-start after its initial online preparation; a fully offline Quran reader is not claimed.
- PWA notifications support explicit permission and test display where supported. Reliable timed delivery after closure requires future Web Push and is not implemented.

## Android packaging

- Capacitor 8 project and application ID `com.mushafcompanion.reader` are present.
- CI defines a debug APK and unsigned release AAB build.
- The last successful native artifact runs were at `5bbadf7` / `v0.5.0` on 2026-08-05, not at the current baseline.
- Android metadata remains version `1.0` / code 1.
- `SCHEDULE_EXACT_ALARM` is declared; `USE_EXACT_ALARM` is intentionally absent.
- Release keystore, Google Play account/configuration, current signed AAB, store metadata and physical-device QA are not evidenced.

## iOS packaging

- Capacitor 8 Xcode project and bundle identifier `com.mushafcompanion.reader` are present.
- CI defines an unsigned iOS simulator `.app` build on macOS; no signed `.ipa` is produced.
- The last successful native artifact run predates the current baseline.
- iOS metadata remains marketing version `1.0` / build 1.
- Apple Developer team, certificates, provisioning, App Store Connect record, signed archive and iPhone/iPad QA are not evidenced.
- The current Windows audit environment cannot compile the iOS target locally.

## Adhan and notifications

- M12.2 implements opt-in Android/iOS device-local scheduling for five Salah over a seven-day horizon, deterministic ownership/IDs and bounded reconciliation.
- Android exact-alarm access is user-controlled; unavailable access uses an explicit inexact fallback.
- iOS scheduling follows Local Notifications and OS Focus/Silent Mode policy.
- Web/PWA supports explicit permission and a test notification, not reliable closed-app scheduling.
- `APPROVED_ADHAN_ASSETS` is empty. Native notifications use the system sound; no custom cue or full Adhan recording is distributed.
- Physical Android and iPhone/iPad notification validation remains outstanding.

## M11 and Quran readings

- M11 reading registry, page-edition boundary, reading-aware transport and reciter compatibility layer are merged.
- Only `hafs-an-asim` is registered and selectable. All 160 registered reciters are Hafs.
- Warsh exists only as a candidate intake with no artifact and all activation gates false.
- Qalun and Khalaf have no source intake or implementation.
- Unsupported readings fail closed. No alternate reading may silently use Hafs page content.

## Dependency and security baseline

- Lockfile version: 3.
- Locked package entries: 823 (24 production entries reported by audit, 761 development entries, plus optional/peer accounting).
- Direct dependencies: 9 production and 17 development.
- Full `npm audit`: 22 vulnerable nodes — 14 high, 7 moderate, 1 low, 0 critical.
- Production-only `npm audit --omit=dev`: one transitive high-severity `nanoid` advisory.
- Direct affected development/tooling packages include Capacitor CLI, Cloudflare Vite plugin, drizzle-kit, react-server-dom-webpack, vinext, Vite and Wrangler; several fixes require coordinated or potentially breaking version changes.
- M-GOV1 ran no remediation. M13 must triage exposure, select compatible upgrades, rerun the complete validation/native matrix and document accepted residual risk.

## Validation state

The M-GOV1 candidate passed `git diff --check`, lint, the full 584-test suite, the four-source translation audit, the Pages build, Pages artifact verification and Pages smoke test on 2026-08-24. Lint retained 21 warnings and the production/Pages builds retained a non-fatal large-chunk warning. The optional full content audit was not rerun because its script unconditionally rewrites the tracked religious-content audit report; the existing 2026-08-06 report remains passed for all 604 pages and 6,236 verse keys. Exact command outcomes are recorded in [M-GOV1-PORTFOLIO-CLEANUP.md](./M-GOV1-PORTFOLIO-CLEANUP.md).

## Known external blockers

- Exact morphology/evidence/Guided Education sources and approvals.
- Warsh artifact, rights and edition audits.
- Somali/Oromo attribution completion.
- Approved redistributable Adhan cue.
- Android/iOS accounts, signing and physical hardware QA.

See [EXTERNAL-DEPENDENCIES.md](./EXTERNAL-DEPENDENCIES.md) and [APPROVAL-REGISTER.md](./APPROVAL-REGISTER.md).

## M13 entrance criteria

M13 is not started. It may begin only after all of these entrance conditions are met or explicitly accepted by the authorized owner:

- [ ] M-GOV1 documentation reviewed and accepted.
- [ ] M-GOV1B reviews the two protected dirty worktrees and completes any authorized legacy cleanup.
- [ ] No unexplained tracked working-tree changes remain.
- [ ] Current roadmap, project status, external dependency register, approval register and branch inventory are authoritative.
- [ ] One release-version decision covers package, Android, iOS, user-agent and release/tag policy.
- [ ] Required validation passes at the accepted baseline. The current uncommitted M-GOV1 candidate passed lint, 584 tests, translation audit, Pages build, Pages verification and Pages smoke; rerun if review changes the candidate.
- [ ] Dependency advisories are triaged; upgrades or explicit risk acceptance are documented.
- [ ] Android debug APK and unsigned release AAB build from the current accepted commit.
- [ ] iOS simulator package builds from the current accepted commit on macOS/Xcode.
- [ ] Android signing/Play ownership and iOS signing/App Store Connect prerequisites are identified and assigned.
- [ ] Physical-device QA matrix covers supported Android versions and at least representative iPhone/iPad versions.
- [ ] Prayer notifications are validated for permission, exact/inexact behavior, scheduling, reconciliation, background/closed-app delivery and tap navigation.
- [ ] PWA notification limitations and Adhan audio licensing gap remain explicit in user/store copy.
- [ ] Package identity is confirmed consistently as `com.mushafcompanion.reader`.
- [ ] Store artwork, descriptions, privacy disclosures, support contact and release/rollback plan are prepared.
- [ ] No Quran reading, translation, tafsir, Hadith, Guided Education, morphology or Adhan source is activated as a side effect of native release work.

## Release sequence

```text
M-GOV1 Portfolio Cleanup
  -> M-GOV1B Legacy Worktree / Branch Cleanup
  -> M13 Native Release Readiness
  -> Native Distribution
  -> M14 Controlled Content Expansion
```
