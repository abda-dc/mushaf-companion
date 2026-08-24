"use client";

import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { appPath } from "./runtime-config";
import {
  PWA_INSTALL_DISMISS_SESSION_KEY,
  isIosLikePlatform,
  isStandalonePwa,
  resolvePwaInstallSurface,
  type PwaInstallSurface,
} from "./pwa-install.mjs";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

const cardStyle: CSSProperties = {
  position: "fixed",
  right: 12,
  bottom: "calc(76px + env(safe-area-inset-bottom))",
  zIndex: 80,
  width: "min(360px, calc(100vw - 24px))",
  padding: 16,
  border: "1px solid rgba(217, 188, 139, .55)",
  borderRadius: 16,
  background: "var(--forest-deep, #0f3028)",
  color: "#fffaf0",
  boxShadow: "0 20px 60px rgba(15, 48, 40, .32)",
};

const eyebrowStyle: CSSProperties = {
  display: "block",
  marginBottom: 5,
  color: "var(--brass-soft, #d9bc8b)",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: ".13em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: "Georgia, serif",
  fontSize: 20,
  lineHeight: 1.2,
  fontWeight: 500,
};

const copyStyle: CSSProperties = {
  margin: "8px 0 14px",
  color: "rgba(255, 250, 240, .78)",
  fontSize: 13,
  lineHeight: 1.5,
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: 40,
  padding: "0 15px",
  border: "1px solid var(--brass-soft, #d9bc8b)",
  borderRadius: 999,
  background: "var(--brass-soft, #d9bc8b)",
  color: "var(--forest-deep, #0f3028)",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: 40,
  padding: "0 11px",
  border: 0,
  background: "transparent",
  color: "rgba(255, 250, 240, .72)",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
};

const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 90,
  padding: "12px 10px calc(12px + env(safe-area-inset-bottom))",
  background: "rgba(9, 29, 24, .58)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const guideStyle: CSSProperties = {
  width: "min(460px, 100%)",
  padding: 20,
  border: "1px solid rgba(164, 124, 67, .34)",
  borderRadius: 20,
  background: "var(--paper, #f6f0e4)",
  color: "var(--ink, #26322d)",
  boxShadow: "0 24px 80px rgba(15, 48, 40, .30)",
};

function detectStandalone(): boolean {
  const displayModeStandalone = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const navigatorStandalone = Boolean((navigator as NavigatorWithStandalone).standalone);
  return isStandalonePwa({ displayModeStandalone, navigatorStandalone });
}

function setSessionDismissed(): void {
  try {
    window.sessionStorage.setItem(PWA_INSTALL_DISMISS_SESSION_KEY, "1");
  } catch {
    // Storage can be unavailable in hardened/private browser modes; in-memory state still suppresses the card.
  }
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosLike, setIosLike] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloading = false;
    const handleControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    navigator.serviceWorker.register(appPath("sw.js"), { scope: appPath(), updateViaCache: "none" }).catch((error) => {
      console.warn("Mushaf Companion service worker registration failed", error);
    });

    return () => navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
  }, []);

  useEffect(() => {
    const displayMode = window.matchMedia?.("(display-mode: standalone)");

    const initializeTimer = window.setTimeout(() => {
      try {
        setDismissed(window.sessionStorage.getItem(PWA_INSTALL_DISMISS_SESSION_KEY) === "1");
      } catch {
        setDismissed(false);
      }

      setIosLike(isIosLikePlatform(navigator));
      setStandalone(detectStandalone());
    }, 0);

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setDeferredPrompt(promptEvent);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setStandalone(true);
      setIosGuideOpen(false);
      try {
        window.sessionStorage.removeItem(PWA_INSTALL_DISMISS_SESSION_KEY);
      } catch {
        // Ignore unavailable session storage.
      }
    };

    const handleDisplayModeChange = () => setStandalone(detectStandalone());

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    displayMode?.addEventListener?.("change", handleDisplayModeChange);

    return () => {
      window.clearTimeout(initializeTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      displayMode?.removeEventListener?.("change", handleDisplayModeChange);
    };
  }, []);

  useEffect(() => {
    if (!iosGuideOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIosGuideOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [iosGuideOpen]);

  const surface = useMemo<PwaInstallSurface>(() => resolvePwaInstallSurface({
    standalone,
    ios: iosLike,
    promptAvailable: Boolean(deferredPrompt),
    dismissed,
  }), [standalone, iosLike, deferredPrompt, dismissed]);

  const dismiss = () => {
    setDismissed(true);
    setIosGuideOpen(false);
    setSessionDismissed();
  };

  const install = async () => {
    if (surface === "ios") {
      setIosGuideOpen(true);
      return;
    }
    if (!deferredPrompt || installing) return;

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === "accepted") {
        setDismissed(true);
        setSessionDismissed();
      } else {
        dismiss();
      }
    } catch (error) {
      console.warn("Mushaf Companion install prompt failed", error);
    } finally {
      setInstalling(false);
    }
  };

  if (surface === "hidden") return null;

  const iosSurface = surface === "ios";

  return (
    <>
      <aside style={cardStyle} aria-label="Install Mushaf Companion">
        <span style={eyebrowStyle}>{iosSurface ? "IPHONE & IPAD" : "INSTALLABLE APP"}</span>
        <h2 style={titleStyle}>{iosSurface ? "Add Mushaf Companion to your Home Screen" : "Install Mushaf Companion"}</h2>
        <p style={copyStyle}>
          {iosSurface
            ? "On iPhone and iPad, installation is completed from Safari's Share menu."
            : "Keep the reader on your Home Screen and launch it in its own app window."}
        </p>
        <div style={actionRowStyle}>
          <button type="button" style={primaryButtonStyle} onClick={install} disabled={installing}>
            {installing ? "Opening…" : iosSurface ? "Show steps" : "Install app"}
          </button>
          <button type="button" style={secondaryButtonStyle} onClick={dismiss}>Not now</button>
        </div>
      </aside>

      {iosGuideOpen && (
        <div style={backdropStyle} role="presentation" onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => {
          if (event.target === event.currentTarget) setIosGuideOpen(false);
        }}>
          <section style={guideStyle} role="dialog" aria-modal="true" aria-labelledby="pwa-ios-install-title">
            <span style={{ ...eyebrowStyle, color: "var(--brass, #a47c43)" }}>INSTALL ON IOS / IPADOS</span>
            <h2 id="pwa-ios-install-title" style={{ ...titleStyle, fontSize: 23 }}>Add Mushaf Companion</h2>
            <ol style={{ margin: "16px 0 18px", paddingLeft: 22, display: "grid", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
              <li>Open this page in <strong>Safari</strong>.</li>
              <li>Tap the <strong>Share</strong> button.</li>
              <li>Choose <strong>Add to Home Screen</strong>.</li>
              <li>If shown, enable <strong>Open as Web App</strong>, then tap <strong>Add</strong>.</li>
            </ol>
            <p style={{ margin: "0 0 16px", color: "var(--ink-soft, #6e756f)", fontSize: 12, lineHeight: 1.5 }}>
              When you launch the new Home Screen icon, Mushaf Companion will open in standalone app mode and this install message will stay hidden.
            </p>
            <div style={actionRowStyle}>
              <button type="button" style={{ ...primaryButtonStyle, borderColor: "var(--forest, #173f34)", background: "var(--forest, #173f34)", color: "#fffaf0" }} onClick={dismiss}>Done</button>
              <button type="button" style={{ ...secondaryButtonStyle, color: "var(--ink-soft, #6e756f)" }} onClick={() => setIosGuideOpen(false)}>Close</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
