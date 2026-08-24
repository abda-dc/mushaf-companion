export const PWA_INSTALL_DISMISS_SESSION_KEY: "mushaf:pwa-install-dismissed:v1";

export interface NavigatorLike {
  userAgent?: string | null;
  platform?: string | null;
  maxTouchPoints?: number | null;
}

export interface StandalonePwaInput {
  displayModeStandalone?: boolean;
  navigatorStandalone?: boolean;
}

export type PwaInstallSurface = "hidden" | "prompt" | "ios";

export interface PwaInstallSurfaceInput {
  standalone?: boolean;
  ios?: boolean;
  promptAvailable?: boolean;
  dismissed?: boolean;
}

export function isIosLikePlatform(navigatorLike: NavigatorLike | null | undefined): boolean;
export function isStandalonePwa(input?: StandalonePwaInput): boolean;
export function resolvePwaInstallSurface(input?: PwaInstallSurfaceInput): PwaInstallSurface;
