import assert from "node:assert/strict";
import test from "node:test";
import {
  PWA_INSTALL_DISMISS_SESSION_KEY,
  isIosLikePlatform,
  isStandalonePwa,
  resolvePwaInstallSurface,
} from "../app/pwa-install.mjs";

test("iPhone, iPad, and touch-enabled iPadOS desktop identity are treated as iOS-like", () => {
  assert.equal(isIosLikePlatform({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" }), true);
  assert.equal(isIosLikePlatform({ userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)" }), true);
  assert.equal(isIosLikePlatform({ userAgent: "Mozilla/5.0", platform: "MacIntel", maxTouchPoints: 5 }), true);
});

test("ordinary desktop macOS is not mistaken for iPadOS", () => {
  assert.equal(isIosLikePlatform({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)", platform: "MacIntel", maxTouchPoints: 0 }), false);
});

test("standalone detection accepts either display-mode or legacy iOS navigator signal", () => {
  assert.equal(isStandalonePwa({ displayModeStandalone: true }), true);
  assert.equal(isStandalonePwa({ navigatorStandalone: true }), true);
  assert.equal(isStandalonePwa({ displayModeStandalone: false, navigatorStandalone: false }), false);
});

test("native browser install prompt takes precedence when available", () => {
  assert.equal(resolvePwaInstallSurface({ promptAvailable: true }), "prompt");
  assert.equal(resolvePwaInstallSurface({ ios: true, promptAvailable: true }), "prompt");
});

test("iOS receives guided Home Screen installation only when not already installed", () => {
  assert.equal(resolvePwaInstallSurface({ ios: true }), "ios");
  assert.equal(resolvePwaInstallSurface({ ios: true, standalone: true }), "hidden");
});

test("dismissal suppresses the install surface for the current browser session", () => {
  assert.equal(resolvePwaInstallSurface({ ios: true, dismissed: true }), "hidden");
  assert.equal(resolvePwaInstallSurface({ promptAvailable: true, dismissed: true }), "hidden");
  assert.equal(PWA_INSTALL_DISMISS_SESSION_KEY, "mushaf:pwa-install-dismissed:v1");
});

test("unsupported browsers stay quiet instead of showing a broken install action", () => {
  assert.equal(resolvePwaInstallSurface({}), "hidden");
});
