export const PWA_INSTALL_DISMISS_SESSION_KEY = "mushaf:pwa-install-dismissed:v1";

export function isIosLikePlatform(navigatorLike) {
  const userAgent = String(navigatorLike?.userAgent ?? "");
  const platform = String(navigatorLike?.platform ?? "");
  const maxTouchPoints = Number(navigatorLike?.maxTouchPoints ?? 0);

  return /iPad|iPhone|iPod/i.test(userAgent)
    || (/Mac/i.test(platform) && maxTouchPoints > 1);
}

export function isStandalonePwa({ displayModeStandalone = false, navigatorStandalone = false } = {}) {
  return Boolean(displayModeStandalone || navigatorStandalone);
}

export function resolvePwaInstallSurface({ standalone = false, ios = false, promptAvailable = false, dismissed = false } = {}) {
  if (standalone || dismissed) return "hidden";
  if (promptAvailable) return "prompt";
  if (ios) return "ios";
  return "hidden";
}
