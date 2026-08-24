import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PRAYER_GEOLOCATION_OPTIONS,
  getDeviceTimeZone,
  requestPrayerLocation,
} from "../app/prayer-location.ts";

function successNavigator({
  latitude = 38.9072,
  longitude = -77.0369,
  accuracy = 75,
} = {}) {
  return {
    geolocation: {
      getCurrentPosition(success, _error, options) {
        success({
          coords: {
            latitude,
            longitude,
            accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });

        successNavigator.lastOptions = options;
      },
    },
  };
}

successNavigator.lastOptions = null;

function errorNavigator(code) {
  return {
    geolocation: {
      getCurrentPosition(_success, error) {
        error({
          code,
          message: "simulated",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      },
    },
  };
}

test("default geolocation settings favor low-power approximate lookup", () => {
  assert.deepEqual(DEFAULT_PRAYER_GEOLOCATION_OPTIONS, {
    enableHighAccuracy: false,
    timeout: 10_000,
    maximumAge: 6 * 60 * 60 * 1000,
  });
});

test("location acquisition is unsupported when geolocation is absent", async () => {
  const result = await requestPrayerLocation({});

  assert.deepEqual(result, {
    ok: false,
    code: "unsupported",
    message: "Location is not available in this browser or device.",
  });
});

test("successful location acquisition returns validated coordinates", async () => {
  const result = await requestPrayerLocation(
    successNavigator({
      latitude: 38.9072,
      longitude: -77.0369,
      accuracy: 42,
    }),
  );

  assert.deepEqual(result, {
    ok: true,
    coordinates: {
      latitude: 38.9072,
      longitude: -77.0369,
    },
    accuracyMeters: 42,
  });
});

test("default request passes privacy-conscious options to the browser", async () => {
  successNavigator.lastOptions = null;

  await requestPrayerLocation(successNavigator());

  assert.deepEqual(successNavigator.lastOptions, {
    enableHighAccuracy: false,
    timeout: 10_000,
    maximumAge: 6 * 60 * 60 * 1000,
  });
});

test("caller can override geolocation options explicitly", async () => {
  successNavigator.lastOptions = null;

  await requestPrayerLocation(
    successNavigator(),
    {
      enableHighAccuracy: true,
      timeout: 5_000,
      maximumAge: 0,
    },
  );

  assert.deepEqual(successNavigator.lastOptions, {
    enableHighAccuracy: true,
    timeout: 5_000,
    maximumAge: 0,
  });
});

test("invalid device coordinates fail closed", async () => {
  const result = await requestPrayerLocation(
    successNavigator({
      latitude: 120,
      longitude: -77,
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "invalid-position");
});

test("invalid reported accuracy is discarded instead of persisted", async () => {
  const result = await requestPrayerLocation(
    successNavigator({
      accuracy: Number.NaN,
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.accuracyMeters, null);
});

test("permission denial has a distinct user-facing failure", async () => {
  const result = await requestPrayerLocation(errorNavigator(1));

  assert.deepEqual(result, {
    ok: false,
    code: "permission-denied",
    message: "Location permission was denied.",
  });
});

test("position unavailable has a distinct user-facing failure", async () => {
  const result = await requestPrayerLocation(errorNavigator(2));

  assert.equal(result.ok, false);
  assert.equal(result.code, "position-unavailable");
});

test("location timeout has a distinct user-facing failure", async () => {
  const result = await requestPrayerLocation(errorNavigator(3));

  assert.equal(result.ok, false);
  assert.equal(result.code, "timeout");
});

test("unexpected geolocation failures resolve safely", async () => {
  const navigatorLike = {
    geolocation: {
      getCurrentPosition() {
        throw new Error("simulated browser failure");
      },
    },
  };

  const result = await requestPrayerLocation(navigatorLike);

  assert.deepEqual(result, {
    ok: false,
    code: "unknown",
    message: "Unable to request your location.",
  });
});

test("device time zone helper returns a usable zone when available", () => {
  const timeZone = getDeviceTimeZone();

  assert.ok(timeZone === null || typeof timeZone === "string");

  if (timeZone !== null) {
    assert.ok(timeZone.trim().length > 0);
  }
});