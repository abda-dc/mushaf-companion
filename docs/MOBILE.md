# Native mobile packages

Mushaf Companion uses Capacitor 8 to provide Android and iOS projects around the deployed, server-backed reader.

## Architecture

- App ID: `com.mushafcompanion.reader`
- Production reader: `https://mushaf-companion.abda-dc.chatgpt.site`
- The native shell opens the production reader over HTTPS because the 604-page data, search, chapter index, and lookup endpoints are server-rendered.
- A bundled `mobile-shell/index.html` supplies a calm offline/error surface.

## Prepare projects

```bash
npm install
npm run mobile:sync
```

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

1. Deploy and verify the production Sites version.
2. Run `npm run mobile:sync` so both native projects receive the current configuration.
3. Test page gestures, audio continuation, external audio hosts, keyboard/accessibility focus, and safe-area layouts on physical devices.
4. Replace development icons and splash assets with approved store artwork.
5. Configure Android signing or the Apple Development Team outside source control.
