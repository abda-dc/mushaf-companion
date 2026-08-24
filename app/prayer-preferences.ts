import {
  DEFAULT_PRAYER_ADJUSTMENTS,
  PRAYER_CALCULATION_METHODS,
  normalizePrayerAdjustments,
  validatePrayerCoordinates,
  type AsrCalculation,
  type PrayerAdjustments,
  type PrayerCalculationMethodId,
  type PrayerCoordinates,
  type SalahName,
} from "./prayer-times.ts";
import { findApprovedAdhanCue } from "./adhan-assets.ts";

export const PRAYER_PREFERENCE_STORAGE_KEY = "mushaf:prayer-v2";
export const LEGACY_PRAYER_PREFERENCE_STORAGE_KEY = "mushaf:prayer-v1";
export const PRAYER_PREFERENCE_SCHEMA_VERSION = 2 as const;

export type PrayerNotificationAlertMode =
  | "notification"
  | "notification-with-adhan-cue";

export interface PrayerNotificationPreferences {
  enabled: boolean;
  salah: Record<SalahName, boolean>;
  alertMode: PrayerNotificationAlertMode;
  adhanCueId: string | null;
}

export interface PrayerPreferences {
  schemaVersion: typeof PRAYER_PREFERENCE_SCHEMA_VERSION;
  method: PrayerCalculationMethodId;
  asrCalculation: AsrCalculation;
  adjustments: PrayerAdjustments;
  rememberLocation: boolean;
  rememberedLocation: PrayerCoordinates | null;
  notifications: PrayerNotificationPreferences;
}

interface PrayerPreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const CALCULATION_METHOD_IDS = new Set(
  PRAYER_CALCULATION_METHODS.map((method) => method.id),
);

const DEFAULT_SALAH_NOTIFICATIONS: Readonly<Record<SalahName, boolean>> =
  Object.freeze({
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  });

export const DEFAULT_PRAYER_NOTIFICATION_PREFERENCES: Readonly<PrayerNotificationPreferences> =
  Object.freeze({
    enabled: false,
    salah: DEFAULT_SALAH_NOTIFICATIONS,
    alertMode: "notification",
    adhanCueId: null,
  });

export const DEFAULT_PRAYER_PREFERENCES: Readonly<PrayerPreferences> =
  Object.freeze({
    schemaVersion: PRAYER_PREFERENCE_SCHEMA_VERSION,
    method: "muslim-world-league",
    asrCalculation: "standard",
    adjustments: Object.freeze({ ...DEFAULT_PRAYER_ADJUSTMENTS }),
    rememberLocation: false,
    rememberedLocation: null,
    notifications: DEFAULT_PRAYER_NOTIFICATION_PREFERENCES,
  });

function cloneDefaults(): PrayerPreferences {
  return {
    schemaVersion: PRAYER_PREFERENCE_SCHEMA_VERSION,
    method: DEFAULT_PRAYER_PREFERENCES.method,
    asrCalculation: DEFAULT_PRAYER_PREFERENCES.asrCalculation,
    adjustments: { ...DEFAULT_PRAYER_ADJUSTMENTS },
    rememberLocation: false,
    rememberedLocation: null,
    notifications: {
      enabled: false,
      salah: { ...DEFAULT_SALAH_NOTIFICATIONS },
      alertMode: "notification",
      adhanCueId: null,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCalculationMethod(
  value: unknown,
): value is PrayerCalculationMethodId {
  return (
    typeof value === "string" &&
    CALCULATION_METHOD_IDS.has(value as PrayerCalculationMethodId)
  );
}

function isAsrCalculation(value: unknown): value is AsrCalculation {
  return value === "standard" || value === "hanafi";
}

function normalizeNotificationPreferences(
  value: unknown,
): PrayerNotificationPreferences {
  const normalized: PrayerNotificationPreferences = {
    enabled: false,
    salah: { ...DEFAULT_SALAH_NOTIFICATIONS },
    alertMode: "notification",
    adhanCueId: null,
  };

  if (!isRecord(value)) {
    return normalized;
  }

  normalized.enabled = value.enabled === true;

  if (isRecord(value.salah)) {
    for (const salah of Object.keys(
      DEFAULT_SALAH_NOTIFICATIONS,
    ) as SalahName[]) {
      if (typeof value.salah[salah] === "boolean") {
        normalized.salah[salah] = value.salah[salah];
      }
    }
  }

  const approvedCue = findApprovedAdhanCue(value.adhanCueId);
  if (
    value.alertMode === "notification-with-adhan-cue" &&
    approvedCue
  ) {
    normalized.alertMode = "notification-with-adhan-cue";
    normalized.adhanCueId = approvedCue.id;
  }

  return normalized;
}

/**
 * Prayer and Qibla calculations do not need meter-level precision.
 * Remembered coordinates are rounded to 3 decimal places (~111 m latitude)
 * so the app does not persist unnecessarily precise device location data.
 */
export function roundRememberedCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function sanitizeRememberedPrayerLocation(
  value: unknown,
): PrayerCoordinates | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.latitude !== "number" ||
    typeof value.longitude !== "number"
  ) {
    return null;
  }

  try {
    const coordinates = validatePrayerCoordinates({
      latitude: value.latitude,
      longitude: value.longitude,
    });

    return {
      latitude: roundRememberedCoordinate(coordinates.latitude),
      longitude: roundRememberedCoordinate(coordinates.longitude),
    };
  } catch {
    return null;
  }
}

/** Accepts both schema v1 and v2. V1 receives notification-safe defaults. */
export function normalizePrayerPreferences(
  value: unknown,
): PrayerPreferences {
  if (!isRecord(value)) {
    return cloneDefaults();
  }

  if (value.schemaVersion !== 1 && value.schemaVersion !== 2) {
    return cloneDefaults();
  }

  const preferences = cloneDefaults();

  if (isCalculationMethod(value.method)) {
    preferences.method = value.method;
  }

  if (isAsrCalculation(value.asrCalculation)) {
    preferences.asrCalculation = value.asrCalculation;
  }

  if (isRecord(value.adjustments)) {
    try {
      preferences.adjustments = normalizePrayerAdjustments({
        fajr:
          typeof value.adjustments.fajr === "number"
            ? value.adjustments.fajr
            : undefined,
        sunrise:
          typeof value.adjustments.sunrise === "number"
            ? value.adjustments.sunrise
            : undefined,
        dhuhr:
          typeof value.adjustments.dhuhr === "number"
            ? value.adjustments.dhuhr
            : undefined,
        asr:
          typeof value.adjustments.asr === "number"
            ? value.adjustments.asr
            : undefined,
        maghrib:
          typeof value.adjustments.maghrib === "number"
            ? value.adjustments.maghrib
            : undefined,
        isha:
          typeof value.adjustments.isha === "number"
            ? value.adjustments.isha
            : undefined,
      });
    } catch {
      preferences.adjustments = { ...DEFAULT_PRAYER_ADJUSTMENTS };
    }
  }

  if (value.rememberLocation === true) {
    const location = sanitizeRememberedPrayerLocation(
      value.rememberedLocation,
    );

    if (location) {
      preferences.rememberLocation = true;
      preferences.rememberedLocation = location;
    }
  }

  if (value.schemaVersion === 2) {
    preferences.notifications = normalizeNotificationPreferences(
      value.notifications,
    );
  }

  return preferences;
}

function browserStorage(): PrayerPreferenceStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadPrayerPreferences(
  storage: PrayerPreferenceStorage | null = browserStorage(),
): PrayerPreferences {
  if (!storage) {
    return cloneDefaults();
  }

  try {
    const currentRaw = storage.getItem(PRAYER_PREFERENCE_STORAGE_KEY);

    if (currentRaw) {
      try {
        return normalizePrayerPreferences(JSON.parse(currentRaw));
      } catch {
        // A valid legacy record can still recover an unreadable v2 record.
      }
    }

    const legacyRaw = storage.getItem(
      LEGACY_PRAYER_PREFERENCE_STORAGE_KEY,
    );
    if (!legacyRaw) {
      return cloneDefaults();
    }

    const migrated = normalizePrayerPreferences(JSON.parse(legacyRaw));
    try {
      storage.setItem(
        PRAYER_PREFERENCE_STORAGE_KEY,
        JSON.stringify(migrated),
      );
    } catch {
      // A readable v1 record remains usable when storage is read-only.
    }
    return migrated;
  } catch {
    return cloneDefaults();
  }
}

export function savePrayerPreferences(
  value: unknown,
  storage: PrayerPreferenceStorage | null = browserStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  const preferences = normalizePrayerPreferences(value);

  try {
    storage.setItem(
      PRAYER_PREFERENCE_STORAGE_KEY,
      JSON.stringify(preferences),
    );
    return true;
  } catch {
    return false;
  }
}

export function rememberPrayerLocation(
  current: PrayerPreferences,
  coordinates: PrayerCoordinates,
): PrayerPreferences {
  const validated = validatePrayerCoordinates(coordinates);

  return {
    ...normalizePrayerPreferences(current),
    rememberLocation: true,
    rememberedLocation: {
      latitude: roundRememberedCoordinate(validated.latitude),
      longitude: roundRememberedCoordinate(validated.longitude),
    },
  };
}

export function forgetPrayerLocation(
  current: PrayerPreferences,
): PrayerPreferences {
  return {
    ...normalizePrayerPreferences(current),
    rememberLocation: false,
    rememberedLocation: null,
  };
}
