import {
  validatePrayerCoordinates,
  type PrayerCoordinates,
} from "./prayer-times.ts";

export const DEFAULT_PRAYER_GEOLOCATION_OPTIONS: Readonly<PositionOptions> =
  Object.freeze({
    enableHighAccuracy: false,
    timeout: 10_000,
    maximumAge: 6 * 60 * 60 * 1000,
  });

export type PrayerLocationErrorCode =
  | "unsupported"
  | "permission-denied"
  | "position-unavailable"
  | "timeout"
  | "invalid-position"
  | "unknown";

export interface PrayerLocationSuccess {
  ok: true;
  coordinates: PrayerCoordinates;
  accuracyMeters: number | null;
}

export interface PrayerLocationFailure {
  ok: false;
  code: PrayerLocationErrorCode;
  message: string;
}

export type PrayerLocationResult =
  | PrayerLocationSuccess
  | PrayerLocationFailure;

interface GeolocationLike {
  getCurrentPosition(
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    options?: PositionOptions,
  ): void;
}

interface NavigatorLike {
  geolocation?: GeolocationLike;
}

function browserNavigator(): NavigatorLike | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  return navigator;
}

function failure(
  code: PrayerLocationErrorCode,
  message: string,
): PrayerLocationFailure {
  return {
    ok: false,
    code,
    message,
  };
}

function mapGeolocationError(error: GeolocationPositionError) {
  switch (error.code) {
    case 1:
      return failure(
        "permission-denied",
        "Location permission was denied.",
      );
    case 2:
      return failure(
        "position-unavailable",
        "Your location is currently unavailable.",
      );
    case 3:
      return failure(
        "timeout",
        "Location lookup timed out.",
      );
    default:
      return failure(
        "unknown",
        "Unable to determine your location.",
      );
  }
}

/**
 * Requests the device's current coordinates only when this function is
 * explicitly called by the UI. Importing this module never triggers a
 * permission prompt or starts location acquisition.
 */
export function requestPrayerLocation(
  navigatorLike: NavigatorLike | null = browserNavigator(),
  options: PositionOptions = DEFAULT_PRAYER_GEOLOCATION_OPTIONS,
): Promise<PrayerLocationResult> {
  const geolocation = navigatorLike?.geolocation;

  if (!geolocation) {
    return Promise.resolve(
      failure(
        "unsupported",
        "Location is not available in this browser or device.",
      ),
    );
  }

  return new Promise((resolve) => {
    try {
      geolocation.getCurrentPosition(
        (position) => {
          try {
            const coordinates = validatePrayerCoordinates({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });

            const accuracy =
              Number.isFinite(position.coords.accuracy) &&
              position.coords.accuracy >= 0
                ? position.coords.accuracy
                : null;

            resolve({
              ok: true,
              coordinates: { ...coordinates },
              accuracyMeters: accuracy,
            });
          } catch {
            resolve(
              failure(
                "invalid-position",
                "The device returned an invalid location.",
              ),
            );
          }
        },
        (error) => {
          resolve(mapGeolocationError(error));
        },
        {
          enableHighAccuracy: options.enableHighAccuracy ?? false,
          timeout: options.timeout ?? 10_000,
          maximumAge: options.maximumAge ?? 6 * 60 * 60 * 1000,
        },
      );
    } catch {
      resolve(
        failure(
          "unknown",
          "Unable to request your location.",
        ),
      );
    }
  });
}

export function getDeviceTimeZone(): string | null {
  try {
    const timeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone;

    return typeof timeZone === "string" && timeZone.trim()
      ? timeZone
      : null;
  } catch {
    return null;
  }
}