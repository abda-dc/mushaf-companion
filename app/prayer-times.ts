import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
  Qibla,
} from "adhan";

export const PRAYER_CALCULATION_METHODS = [
  { id: "muslim-world-league", label: "Muslim World League" },
  { id: "egyptian", label: "Egyptian General Authority of Survey" },
  { id: "karachi", label: "University of Islamic Sciences, Karachi" },
  { id: "umm-al-qura", label: "Umm al-Qura University, Makkah" },
  { id: "dubai", label: "Dubai / UAE" },
  { id: "qatar", label: "Qatar" },
  { id: "kuwait", label: "Kuwait" },
  { id: "moonsighting-committee", label: "Moonsighting Committee Worldwide" },
  { id: "singapore", label: "Singapore" },
  { id: "turkey", label: "Turkey / Diyanet approximation" },
  { id: "tehran", label: "Institute of Geophysics, Tehran" },
  { id: "north-america", label: "ISNA / North America" },
] as const;

export type PrayerCalculationMethodId =
  (typeof PRAYER_CALCULATION_METHODS)[number]["id"];

export type AsrCalculation = "standard" | "hanafi";

export type SalahName =
  | "fajr"
  | "dhuhr"
  | "asr"
  | "maghrib"
  | "isha";

export type PrayerTimeName = SalahName | "sunrise";

export interface PrayerCoordinates {
  latitude: number;
  longitude: number;
}

export interface PrayerAdjustments {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface CalculatePrayerDayInput {
  coordinates: PrayerCoordinates;
  date: Date;
  method: PrayerCalculationMethodId;
  asrCalculation: AsrCalculation;
  adjustments?: Partial<PrayerAdjustments>;
}

export interface CalculatedPrayerDay {
  date: Date;
  coordinates: PrayerCoordinates;
  method: PrayerCalculationMethodId;
  asrCalculation: AsrCalculation;
  adjustments: PrayerAdjustments;
  qiblaDegrees: number;
  times: Record<PrayerTimeName, Date>;
}

export interface NextPrayer {
  name: SalahName;
  at: Date;
  isTomorrow: boolean;
}

export const DEFAULT_PRAYER_ADJUSTMENTS: Readonly<PrayerAdjustments> =
  Object.freeze({
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  });

/**
 * Sunrise is intentionally excluded. It is useful contextual information,
 * but it is not one of the five obligatory daily prayers and must never
 * become an Adhan target.
 */
export const SALAH_ORDER: readonly SalahName[] = Object.freeze([
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
]);

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number.`);
  }
}

export function validatePrayerCoordinates(
  coordinates: PrayerCoordinates,
): PrayerCoordinates {
  assertFiniteNumber(coordinates.latitude, "Latitude");
  assertFiniteNumber(coordinates.longitude, "Longitude");

  if (coordinates.latitude < -90 || coordinates.latitude > 90) {
    throw new RangeError("Latitude must be between -90 and 90 degrees.");
  }

  if (coordinates.longitude < -180 || coordinates.longitude > 180) {
    throw new RangeError("Longitude must be between -180 and 180 degrees.");
  }

  return coordinates;
}

function normalizeAdjustment(value: number | undefined, name: PrayerTimeName) {
  const normalized = value ?? 0;
  assertFiniteNumber(normalized, `${name} adjustment`);

  if (!Number.isInteger(normalized)) {
    throw new RangeError(`${name} adjustment must be a whole number of minutes.`);
  }

  if (normalized < -30 || normalized > 30) {
    throw new RangeError(
      `${name} adjustment must be between -30 and 30 minutes.`,
    );
  }

  return normalized;
}

export function normalizePrayerAdjustments(
  adjustments: Partial<PrayerAdjustments> = {},
): PrayerAdjustments {
  return {
    fajr: normalizeAdjustment(adjustments.fajr, "fajr"),
    sunrise: normalizeAdjustment(adjustments.sunrise, "sunrise"),
    dhuhr: normalizeAdjustment(adjustments.dhuhr, "dhuhr"),
    asr: normalizeAdjustment(adjustments.asr, "asr"),
    maghrib: normalizeAdjustment(adjustments.maghrib, "maghrib"),
    isha: normalizeAdjustment(adjustments.isha, "isha"),
  };
}

function calculationParameters(method: PrayerCalculationMethodId) {
  switch (method) {
    case "muslim-world-league":
      return CalculationMethod.MuslimWorldLeague();
    case "egyptian":
      return CalculationMethod.Egyptian();
    case "karachi":
      return CalculationMethod.Karachi();
    case "umm-al-qura":
      return CalculationMethod.UmmAlQura();
    case "dubai":
      return CalculationMethod.Dubai();
    case "qatar":
      return CalculationMethod.Qatar();
    case "kuwait":
      return CalculationMethod.Kuwait();
    case "moonsighting-committee":
      return CalculationMethod.MoonsightingCommittee();
    case "singapore":
      return CalculationMethod.Singapore();
    case "turkey":
      return CalculationMethod.Turkey();
    case "tehran":
      return CalculationMethod.Tehran();
    case "north-america":
      return CalculationMethod.NorthAmerica();
    default: {
      const exhaustive: never = method;
      throw new Error(`Unsupported prayer calculation method: ${exhaustive}`);
    }
  }
}

function requireValidDate(value: unknown, label: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`Unable to calculate a valid ${label} time.`);
  }

  return value;
}

export function calculatePrayerDay(
  input: CalculatePrayerDayInput,
): CalculatedPrayerDay {
  const validatedCoordinates = validatePrayerCoordinates(input.coordinates);

  if (
    !(input.date instanceof Date) ||
    Number.isNaN(input.date.getTime())
  ) {
    throw new RangeError("Prayer calculation date must be a valid Date.");
  }

  const adjustments = normalizePrayerAdjustments(input.adjustments);
  const coordinates = new Coordinates(
    validatedCoordinates.latitude,
    validatedCoordinates.longitude,
  );

  const parameters = calculationParameters(input.method);
  parameters.madhab =
    input.asrCalculation === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  parameters.adjustments = { ...adjustments };

  const calculated = new PrayerTimes(coordinates, input.date, parameters);

  const rawQibla = Qibla(coordinates);
  if (!Number.isFinite(rawQibla)) {
    throw new Error("Unable to calculate a valid Qibla bearing.");
  }

  return {
    date: new Date(input.date.getTime()),
    coordinates: { ...validatedCoordinates },
    method: input.method,
    asrCalculation: input.asrCalculation,
    adjustments,
    qiblaDegrees: (rawQibla + 360) % 360,
    times: {
      fajr: requireValidDate(calculated.fajr, "Fajr"),
      sunrise: requireValidDate(calculated.sunrise, "Sunrise"),
      dhuhr: requireValidDate(calculated.dhuhr, "Dhuhr"),
      asr: requireValidDate(calculated.asr, "Asr"),
      maghrib: requireValidDate(calculated.maghrib, "Maghrib"),
      isha: requireValidDate(calculated.isha, "Isha"),
    },
  };
}

export function getNextPrayer(
  day: CalculatedPrayerDay,
  now: Date,
  tomorrow?: CalculatedPrayerDay,
): NextPrayer | null {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new RangeError("Current time must be a valid Date.");
  }

  for (const name of SALAH_ORDER) {
    const at = day.times[name];

    if (at.getTime() > now.getTime()) {
      return {
        name,
        at,
        isTomorrow: false,
      };
    }
  }

  if (!tomorrow) {
    return null;
  }

  return {
    name: "fajr",
    at: tomorrow.times.fajr,
    isTomorrow: true,
  };
}

export function qiblaCardinalDirection(degrees: number): string {
  assertFiniteNumber(degrees, "Qibla bearing");

  const normalized = ((degrees % 360) + 360) % 360;
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
  const index = Math.round(normalized / 45) % directions.length;

  return directions[index];
}

export function formatPrayerTime(
  date: Date,
  timeZone: string,
  locale = "en-US",
): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new RangeError("Prayer time must be a valid Date.");
  }

  if (!timeZone.trim()) {
    throw new RangeError("A time zone is required to format prayer times.");
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}