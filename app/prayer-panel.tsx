"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import {
  PRAYER_CALCULATION_METHODS,
  calculatePrayerDay,
  formatPrayerTime,
  getNextPrayer,
  qiblaCardinalDirection,
  type PrayerCalculationMethodId,
  type PrayerCoordinates,
  type PrayerTimeName,
  type SalahName,
} from "./prayer-times.ts";

import {
  DEFAULT_PRAYER_PREFERENCES,
  forgetPrayerLocation,
  loadPrayerPreferences,
  normalizePrayerPreferences,
  rememberPrayerLocation,
  savePrayerPreferences,
  type PrayerPreferences,
  type PrayerNotificationAlertMode,
} from "./prayer-preferences.ts";

import {
  getDeviceTimeZone,
  requestPrayerLocation,
} from "./prayer-location.ts";
import { APPROVED_ADHAN_ASSETS } from "./adhan-assets.ts";
import {
  inspectPrayerNotificationCapabilities,
  openPrayerExactAlarmSettings,
  requestPrayerNotificationPermission,
  sendPrayerNotificationTest,
  synchronizePrayerNotifications,
} from "./prayer-notification-controller.ts";
import type { PrayerNotificationCapabilities } from "./prayer-notification-platform.ts";

export interface PrayerPanelProps {
  onClose: () => void;
}

type LocationState = "idle" | "requesting" | "ready" | "error";

const PRAYER_TIME_ROWS: readonly {
  name: PrayerTimeName;
  label: string;
  isSalah: boolean;
}[] = [
  { name: "fajr", label: "Fajr", isSalah: true },
  { name: "sunrise", label: "Sunrise", isSalah: false },
  { name: "dhuhr", label: "Dhuhr", isSalah: true },
  { name: "asr", label: "Asr", isSalah: true },
  { name: "maghrib", label: "Maghrib", isSalah: true },
  { name: "isha", label: "Isha", isSalah: true },
];

const SALAH_NOTIFICATION_ROWS: readonly {
  name: SalahName;
  label: string;
}[] = [
  { name: "fajr", label: "Fajr" },
  { name: "dhuhr", label: "Dhuhr" },
  { name: "asr", label: "Asr" },
  { name: "maghrib", label: "Maghrib" },
  { name: "isha", label: "Isha" },
];

const INITIAL_NOTIFICATION_CAPABILITIES: PrayerNotificationCapabilities = {
  platform: "unsupported",
  permission: "unsupported",
  displayAvailable: false,
  backgroundSchedulingAvailable: false,
  exactScheduling: "not-applicable",
  message: "Checking notification capabilities…",
};

function createTomorrowDate(date: Date): Date {
  const tomorrow = new Date(date.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

function formatCountdown(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return "Now";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${Math.max(1, minutes)}m`;
}

function displayPrayerName(name: string): string {
  switch (name) {
    case "fajr":
      return "Fajr";
    case "dhuhr":
      return "Dhuhr";
    case "asr":
      return "Asr";
    case "maghrib":
      return "Maghrib";
    case "isha":
      return "Isha";
    default:
      return name;
  }
}

export function PrayerPanel({ onClose }: PrayerPanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const [preferences, setPreferences] = useState<PrayerPreferences>(() =>
    normalizePrayerPreferences(DEFAULT_PRAYER_PREFERENCES),
  );

  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [coordinates, setCoordinates] = useState<PrayerCoordinates | null>(null);
  const [timeZone, setTimeZone] = useState<string | null>(null);
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [locationMessage, setLocationMessage] = useState(
    "Use your device location to calculate prayer times and Qibla.",
  );
  const [now, setNow] = useState(() => new Date());
  const [notificationCapabilities, setNotificationCapabilities] =
    useState<PrayerNotificationCapabilities>(
      INITIAL_NOTIFICATION_CAPABILITIES,
    );
  const [notificationStatus, setNotificationStatus] = useState(
    "Prayer notifications are off by default.",
  );
  const [notificationBusy, setNotificationBusy] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const loaded = loadPrayerPreferences();

      setPreferences(loaded);
      setTimeZone(getDeviceTimeZone());

      if (loaded.rememberLocation && loaded.rememberedLocation) {
        setCoordinates({ ...loaded.rememberedLocation });
        setLocationState("ready");
        setLocationMessage("Using your remembered approximate location.");
      }

      setPreferencesLoaded(true);

      void inspectPrayerNotificationCapabilities().then(
        setNotificationCapabilities,
      );
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    savePrayerPreferences(preferences);
  }, [preferences, preferencesLoaded]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    let cancelled = false;
    const synchronize = async () => {
      const result = await synchronizePrayerNotifications({
        preferences,
        coordinates,
      });
      const capabilities = await inspectPrayerNotificationCapabilities();
      if (cancelled) {
        return;
      }
      setNotificationStatus(result.message);
      setNotificationCapabilities(capabilities);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setTimeZone(getDeviceTimeZone());
        void synchronize();
      }
    };

    void synchronize();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [coordinates, preferences, preferencesLoaded]);

  const calculationState = useMemo(() => {
    if (!coordinates) {
      return {
        today: null,
        tomorrow: null,
        nextPrayer: null,
        error: null,
      };
    }

    try {
      const today = calculatePrayerDay({
        coordinates,
        date: now,
        method: preferences.method,
        asrCalculation: preferences.asrCalculation,
        adjustments: preferences.adjustments,
      });

      const tomorrow = calculatePrayerDay({
        coordinates,
        date: createTomorrowDate(now),
        method: preferences.method,
        asrCalculation: preferences.asrCalculation,
        adjustments: preferences.adjustments,
      });

      return {
        today,
        tomorrow,
        nextPrayer: getNextPrayer(today, now, tomorrow),
        error: null,
      };
    } catch (error) {
      return {
        today: null,
        tomorrow: null,
        nextPrayer: null,
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate prayer times.",
      };
    }
  }, [coordinates, now, preferences]);

  function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab" || !panelRef.current) {
      return;
    }

    const controls = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, [tabindex]:not([tabindex="-1"])',
      ),
    ].filter(
      (control) =>
        control.isConnected &&
        control.getAttribute("aria-hidden") !== "true",
    );

    const first = controls[0];
    const last = controls.at(-1);

    if (!first || !last) {
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleUseMyLocation() {
    setLocationState("requesting");
    setLocationMessage("Requesting location permission...");

    const result = await requestPrayerLocation();

    if (!result.ok) {
      setLocationState("error");
      setLocationMessage(result.message);
      return;
    }

    setCoordinates(result.coordinates);
    setLocationState("ready");

    const accuracyCopy =
      result.accuracyMeters === null
        ? ""
        : ` Approximate accuracy: ${Math.round(result.accuracyMeters)} m.`;

    setLocationMessage(`Device location active.${accuracyCopy}`);

    setPreferences((current) =>
      current.rememberLocation
        ? rememberPrayerLocation(current, result.coordinates)
        : current,
    );
  }

  function handleRememberLocation(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.checked) {
      setPreferences((current) => forgetPrayerLocation(current));
      setLocationMessage(
        coordinates
          ? "Device location active. It will not be remembered after you clear browser data or change devices."
          : "Location memory is off.",
      );
      return;
    }

    if (!coordinates) {
      setLocationMessage(
        "Use my location first, then choose to remember the approximate location.",
      );
      return;
    }

    setPreferences((current) =>
      rememberPrayerLocation(current, coordinates),
    );

    setLocationMessage(
      "Approximate location will be remembered on this device.",
    );
  }

  function handleMethodChange(event: ChangeEvent<HTMLSelectElement>) {
    setPreferences((current) => ({
      ...current,
      method: event.target.value as PrayerCalculationMethodId,
    }));
  }

  function handleAsrChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;

    if (value !== "standard" && value !== "hanafi") {
      return;
    }

    setPreferences((current) => ({
      ...current,
      asrCalculation: value,
    }));
  }

  function handleAdjustmentChange(
    prayer: PrayerTimeName,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const value = Number(event.target.value);

    if (!Number.isInteger(value) || value < -30 || value > 30) {
      return;
    }

    setPreferences((current) => ({
      ...current,
      adjustments: {
        ...current.adjustments,
        [prayer]: value,
      },
    }));
  }

  async function handleNotificationsEnabled(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const enabled = event.target.checked;

    if (!enabled) {
      setPreferences((current) => ({
        ...current,
        notifications: { ...current.notifications, enabled: false },
      }));
      setNotificationStatus("Prayer notifications are off.");
      return;
    }

    setNotificationBusy(true);
    try {
      let capabilities = await inspectPrayerNotificationCapabilities();
      if (capabilities.permission === "prompt") {
        capabilities = await requestPrayerNotificationPermission();
      }

      setNotificationCapabilities(capabilities);
      setPreferences((current) => ({
        ...current,
        notifications: { ...current.notifications, enabled: true },
      }));

      setNotificationStatus(
        capabilities.permission === "granted"
          ? capabilities.backgroundSchedulingAvailable
            ? "Permission granted. Synchronizing the next seven days."
            : "Permission granted for browser tests. Closed-app scheduling requires future Web Push infrastructure."
          : capabilities.permission === "denied"
            ? "Notifications are blocked by the OS or browser. Your prayer settings remain saved."
            : capabilities.message,
      );
    } finally {
      setNotificationBusy(false);
    }
  }

  function handleSalahNotification(
    salah: SalahName,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setPreferences((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        salah: {
          ...current.notifications.salah,
          [salah]: event.target.checked,
        },
      },
    }));
  }

  function handleAlertMode(event: ChangeEvent<HTMLSelectElement>) {
    const mode = event.target.value as PrayerNotificationAlertMode;
    if (
      mode !== "notification" &&
      mode !== "notification-with-adhan-cue"
    ) {
      return;
    }

    const cue = APPROVED_ADHAN_ASSETS[0] ?? null;
    setPreferences((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        alertMode:
          mode === "notification-with-adhan-cue" && cue
            ? mode
            : "notification",
        adhanCueId:
          mode === "notification-with-adhan-cue" && cue ? cue.id : null,
      },
    }));
  }

  function handleAdhanCue(event: ChangeEvent<HTMLSelectElement>) {
    const cue = APPROVED_ADHAN_ASSETS.find(
      (asset) => asset.id === event.target.value,
    );
    if (!cue) return;
    setPreferences((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        alertMode: "notification-with-adhan-cue",
        adhanCueId: cue.id,
      },
    }));
  }

  async function handleSendTestNotification() {
    setNotificationBusy(true);
    try {
      let capabilities = await inspectPrayerNotificationCapabilities();
      if (capabilities.permission === "prompt") {
        capabilities = await requestPrayerNotificationPermission();
        setNotificationCapabilities(capabilities);
      }

      if (capabilities.permission !== "granted") {
        setNotificationStatus(
          capabilities.permission === "denied"
            ? "Notifications are blocked in OS or browser settings."
            : capabilities.message,
        );
        return;
      }

      const result = await sendPrayerNotificationTest();
      setNotificationStatus(result.message);
    } finally {
      setNotificationBusy(false);
    }
  }

  async function handleOpenExactAlarmSettings() {
    setNotificationBusy(true);
    try {
      const result = await openPrayerExactAlarmSettings();
      setNotificationStatus(result.message);
    } finally {
      setNotificationBusy(false);
    }
  }

  function formatTime(date: Date): string {
    if (!timeZone) {
      return "Time zone unavailable";
    }

    try {
      return formatPrayerTime(date, timeZone);
    } catch {
      return "Time unavailable";
    }
  }

  const nextPrayer = calculationState.nextPrayer;

  return (
    <section
      ref={panelRef}
      className="panel-shell prayer-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prayer-panel-title"
      onKeyDown={trapFocus}
    >
      <header className="prayer-panel-header">
        <div>
          <span className="panel-kicker">PRAYER &amp; QIBLA</span>
          <h2
            id="prayer-panel-title"
            ref={headingRef}
            tabIndex={-1}
          >
            Salah Times
          </h2>
          <p>
            Device-local prayer calculations with explicit method settings.
          </p>
        </div>

        <button
          type="button"
          className="panel-close"
          onClick={onClose}
          aria-label="Close Prayer and Qibla"
          autoFocus
        >
          ×
        </button>
      </header>

      <div className="prayer-panel-content">
        <section
          className={`prayer-location-card state-${locationState}`}
          aria-labelledby="prayer-location-heading"
        >
          <div>
            <span className="prayer-section-kicker">LOCATION</span>
            <h3 id="prayer-location-heading">Calculate for this device</h3>
            <p role={locationState === "error" ? "alert" : "status"}>
              {locationMessage}
            </p>
            <small>
              Location is requested only when you press the button. Prayer
              calculations run on this device and do not require sending your
              coordinates to a prayer-time server.
            </small>
          </div>

          <div className="prayer-location-actions">
            <button
              type="button"
              className="prayer-primary-action"
              onClick={handleUseMyLocation}
              disabled={locationState === "requesting"}
            >
              {locationState === "requesting"
                ? "Finding location..."
                : "Use my location"}
            </button>

            <label className="prayer-remember-location">
              <input
                type="checkbox"
                checked={preferences.rememberLocation}
                onChange={handleRememberLocation}
              />
              Remember approximate location on this device
            </label>
          </div>
        </section>

        {calculationState.error && (
          <div className="prayer-error-banner" role="alert">
            {calculationState.error}
          </div>
        )}

        {!coordinates && (
          <section className="prayer-empty-state">
            <span aria-hidden="true">◉</span>
            <h3>Location needed</h3>
            <p>
              Use your location to calculate today&apos;s Salah times and the
              direction of the Qibla.
            </p>
          </section>
        )}

        {coordinates && calculationState.today && (
          <>
            <section
              className="prayer-next-card"
              aria-labelledby="next-prayer-heading"
            >
              <div>
                <span className="prayer-section-kicker">NEXT PRAYER</span>
                <h3 id="next-prayer-heading">
                  {nextPrayer
                    ? displayPrayerName(nextPrayer.name)
                    : "Calculating"}
                </h3>
                {nextPrayer && (
                  <p>
                    {formatTime(nextPrayer.at)}
                    {nextPrayer.isTomorrow ? " · Tomorrow" : ""}
                  </p>
                )}
              </div>

              {nextPrayer && (
                <strong className="prayer-countdown">
                  {formatCountdown(
                    nextPrayer.at.getTime() - now.getTime(),
                  )}
                </strong>
              )}
            </section>

            <section
              className="prayer-times-card"
              aria-labelledby="today-prayer-times-heading"
            >
              <header>
                <div>
                  <span className="prayer-section-kicker">TODAY</span>
                  <h3 id="today-prayer-times-heading">Prayer times</h3>
                </div>

                {timeZone && (
                  <small className="prayer-timezone">
                    {timeZone}
                  </small>
                )}
              </header>

              <div className="prayer-times-list">
                {PRAYER_TIME_ROWS.map((row) => (
                  <div
                    key={row.name}
                    className={`prayer-time-row${
                      row.isSalah ? "" : " prayer-time-context"
                    }`}
                  >
                    <div>
                      <strong>{row.label}</strong>
                      {!row.isSalah && (
                        <small>
                          Solar marker · not a Salah or Adhan target
                        </small>
                      )}
                    </div>
                    <time
                      dateTime={
                        calculationState.today.times[
                          row.name
                        ].toISOString()
                      }
                    >
                      {formatTime(
                        calculationState.today.times[row.name],
                      )}
                    </time>
                  </div>
                ))}
              </div>
            </section>

            <section
              className="prayer-qibla-card"
              aria-labelledby="qibla-heading"
            >
              <div className="prayer-qibla-copy">
                <span className="prayer-section-kicker">QIBLA</span>
                <h3 id="qibla-heading">Direction to the Ka&apos;bah</h3>
                <p>
                  Bearing is measured clockwise from true north. Device compass
                  support can be added separately without changing this
                  calculation.
                </p>
              </div>

              <div
                className="prayer-qibla-bearing"
                aria-label={`Qibla bearing ${Math.round(
                  calculationState.today.qiblaDegrees,
                )} degrees ${qiblaCardinalDirection(
                  calculationState.today.qiblaDegrees,
                )}`}
              >
                <strong>
                  {Math.round(calculationState.today.qiblaDegrees)}°
                </strong>
                <span>
                  {qiblaCardinalDirection(
                    calculationState.today.qiblaDegrees,
                  )}
                </span>
              </div>
            </section>
          </>
        )}

        <details className="prayer-settings-card">
          <summary>Prayer calculation settings</summary>

          <div className="prayer-settings-content">
            <label>
              <span>Calculation method</span>
              <select
                value={preferences.method}
                onChange={handleMethodChange}
              >
                {PRAYER_CALCULATION_METHODS.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Asr calculation</span>
              <select
                value={preferences.asrCalculation}
                onChange={handleAsrChange}
              >
                <option value="standard">
                  Standard (Shafi, Maliki, Hanbali)
                </option>
                <option value="hanafi">Hanafi</option>
              </select>
            </label>

            <div className="prayer-adjustments">
              <div>
                <strong>Manual adjustments</strong>
                <small>
                  Optional local corrections in whole minutes, from -30 to +30.
                </small>
              </div>

              {PRAYER_TIME_ROWS.map((row) => (
                <label key={row.name}>
                  <span>{row.label}</span>
                  <input
                    type="number"
                    min="-30"
                    max="30"
                    step="1"
                    value={preferences.adjustments[row.name]}
                    onChange={(event) =>
                      handleAdjustmentChange(row.name, event)
                    }
                    aria-label={`${row.label} adjustment in minutes`}
                  />
                </label>
              ))}
            </div>
          </div>
        </details>

        <section
          className="prayer-notifications-card"
          aria-labelledby="prayer-notifications-heading"
        >
          <header>
            <div>
              <span className="prayer-section-kicker">ADHAN &amp; NOTIFICATIONS</span>
              <h3 id="prayer-notifications-heading">Prayer alerts</h3>
            </div>
            <span className={`prayer-notification-state state-${notificationCapabilities.permission}`}>
              {notificationCapabilities.permission === "granted"
                ? "Allowed"
                : notificationCapabilities.permission === "denied"
                  ? "Blocked"
                  : notificationCapabilities.permission === "prompt"
                    ? "Not requested"
                    : "Unavailable"}
            </span>
          </header>

          <label className="prayer-notification-master">
            <span>
              <strong>Prayer notifications</strong>
              <small>
                Permission is requested only when you turn this on.
              </small>
            </span>
            <input
              type="checkbox"
              checked={preferences.notifications.enabled}
              onChange={handleNotificationsEnabled}
              disabled={notificationBusy}
              aria-label="Enable prayer notifications"
            />
          </label>

          <fieldset
            className="prayer-notification-prayers"
            disabled={!preferences.notifications.enabled || notificationBusy}
          >
            <legend>Salah alerts</legend>
            {SALAH_NOTIFICATION_ROWS.map((row) => (
              <label key={row.name}>
                <input
                  type="checkbox"
                  checked={preferences.notifications.salah[row.name]}
                  onChange={(event) =>
                    handleSalahNotification(row.name, event)
                  }
                />
                {row.label}
              </label>
            ))}
          </fieldset>

          <label className="prayer-notification-select">
            <span>Alert sound</span>
            <select
              value={preferences.notifications.alertMode}
              onChange={handleAlertMode}
              disabled={!preferences.notifications.enabled || notificationBusy}
            >
              <option value="notification">System notification sound</option>
              {APPROVED_ADHAN_ASSETS.length > 0 && (
                <option value="notification-with-adhan-cue">
                  Approved short Adhan cue
                </option>
              )}
            </select>
          </label>

          {preferences.notifications.alertMode ===
            "notification-with-adhan-cue" &&
            APPROVED_ADHAN_ASSETS.length > 0 && (
              <label className="prayer-notification-select">
                <span>Adhan cue</span>
                <select
                  value={preferences.notifications.adhanCueId ?? ""}
                  onChange={handleAdhanCue}
                  disabled={notificationBusy}
                >
                  {APPROVED_ADHAN_ASSETS.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.displayName}
                    </option>
                  ))}
                </select>
              </label>
            )}

          <div className="prayer-notification-actions">
            <button
              type="button"
              className="prayer-primary-action"
              onClick={handleSendTestNotification}
              disabled={
                notificationBusy ||
                !notificationCapabilities.displayAvailable ||
                notificationCapabilities.permission === "denied"
              }
            >
              Send test notification
            </button>

            {notificationCapabilities.platform === "native-android" &&
              notificationCapabilities.exactScheduling === "unavailable" && (
                <button
                  type="button"
                  className="prayer-secondary-action"
                  onClick={handleOpenExactAlarmSettings}
                  disabled={notificationBusy}
                >
                  Open Alarms &amp; reminders
                </button>
              )}
          </div>

          <p className="prayer-notification-status" role="status" aria-live="polite">
            {notificationStatus}
          </p>
          <p className="prayer-notification-capability">
            {notificationCapabilities.message}
          </p>
          {APPROVED_ADHAN_ASSETS.length === 0 && (
            <small className="prayer-notification-asset-note">
              No licensed Adhan recording is bundled. Alerts use the system
              notification sound; a short cue will appear only after its license
              and provenance are approved.
            </small>
          )}
        </section>

        <footer className="prayer-panel-note">
          <strong>About calculated times</strong>
          <p>
            Calculation methods and local mosque schedules can differ by several
            minutes. Use the method and adjustments appropriate for your local
            community.
          </p>
        </footer>
      </div>
    </section>
  );
}
