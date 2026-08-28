# Native mobile packages

Mushaf Companion uses Capacitor 8 to package the audited React reader locally in its Android and iOS applications.

## Architecture

- App ID: `com.mushafcompanion.reader`
- Native web output: `native-runtime/`
- `npm run build:native` builds the shared standalone reader with native-local asset paths, reviewed release-owned media, and `content/native-build.json` provenance.
- Capacitor has no production `server.url`; Android and iOS start the packaged `index.html`, JavaScript, and stylesheet.
- Quran pages, search, chapter metadata, tafsir, and non-release-owned recitation media remain intentional network-provider requests through the shared static-reader transport.
- GitHub Pages remains a separate `_site/` build with `/mushaf-companion/` base paths, manifest, offline document, and service worker. Those Pages behaviors are not registered by the native runtime.

## Prepare projects

```bash
npm install
npm run mobile:sync
```

`mobile:sync`, `mobile:android`, and `mobile:ios` build the deterministic native reader before Capacitor synchronization. For an inspection-only build, use `npm run build:native`, `npm run verify:native`, and `npm run smoke:native`.

## Android

Open `android/` with Android Studio 2025.2.1 or newer. Capacitor 8 requires Android SDK API 24 or newer; this project targets the SDK selected by the generated Capacitor template.

On Windows, a local debug APK can be produced with:

```powershell
npm run mobile:android:debug
```

The APK is written under `android/app/build/outputs/apk/debug/`.

An unsigned release App Bundle can be produced with:

```powershell
npm run mobile:android:bundle
```

The `.aab` is written under `android/app/build/outputs/bundle/release/`. Configure a release keystore outside source control before uploading a signed bundle to Google Play.

## iOS

Open `ios/App/App.xcodeproj` on macOS with Xcode 26 or newer. Run `npm run mobile:ios` before opening Xcode after web or native dependency changes.

An App Store `.ipa` requires an Apple Developer team, bundle signing, and a macOS/Xcode build. Those credentials are intentionally not stored in this repository. The native packaging workflow produces an unsigned simulator `.app` so the Xcode scaffold is continuously verified without storing signing credentials.

## Release checklist

1. Build and verify the native web runtime and inspect `content/native-build.json` for the intended source revision.
2. Run `npm run mobile:sync` so both native projects receive the same verified local runtime.
3. Inspect the native packages for the reader JS/CSS and exact Regular/Fajr Adhan hashes.
4. Test page gestures, notifications, Adhan playback, external content providers, keyboard/accessibility focus, and safe-area layouts on physical devices.
5. Replace development icons and splash assets with approved store artwork.
6. Configure Android signing or the Apple Development Team outside source control.
