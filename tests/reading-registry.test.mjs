import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_READING_ID,
  QURAN_READINGS,
  READING_REGISTRY,
  getDefaultReading,
  getReadingById,
  isSupportedReadingId,
  isValidReadingDefinition,
  validateReadingDefinition,
} from "../app/reading-registry.mjs";
import {
  assertReciterCompatibleWithReading,
  isReciterCompatibleWithReading,
  resolveCompatibleReciters,
} from "../app/reading-compatibility.mjs";
import { RECITERS } from "../app/reciter-registry.mjs";

test("default reading is Hafs an Asim", () => {
  const reading = getDefaultReading();

  assert.equal(DEFAULT_READING_ID, "hafs-an-asim");
  assert.equal(reading.id, "hafs-an-asim");
  assert.equal(reading.qiraah, "asim");
  assert.equal(reading.riwayah, "hafs");
  assert.equal(reading.label, "Ḥafṣ ʿan ʿĀṣim");
  assert.equal(reading.arabicLabel, "حفص عن عاصم");
});

test("reading registry contains exactly one immutable active definition", () => {
  assert.equal(QURAN_READINGS.length, 1);
  assert.equal(READING_REGISTRY, QURAN_READINGS);
  assert.ok(Object.isFrozen(QURAN_READINGS));
  assert.ok(Object.isFrozen(QURAN_READINGS[0]));
  assert.throws(() => QURAN_READINGS.push(getDefaultReading()), TypeError);
  assert.throws(() => {
    QURAN_READINGS[0].riwayah = "warsh";
  }, TypeError);
});

test("canonical lookup succeeds and unknown lookup never substitutes Hafs", () => {
  assert.equal(getReadingById("hafs-an-asim"), getDefaultReading());
  assert.equal(getReadingById("warsh-an-nafi"), undefined);
  assert.notEqual(getReadingById("warsh-an-nafi"), getDefaultReading());
});

test("supported-reading checks are exact and deny unknown values", () => {
  assert.equal(isSupportedReadingId("hafs-an-asim"), true);
  assert.equal(isSupportedReadingId("HAFS-AN-ASIM"), false);
  assert.equal(isSupportedReadingId("warsh-an-nafi"), false);
  assert.equal(isSupportedReadingId(null), false);
});

test("all existing Hafs reciters are compatible with the default reading", () => {
  const reading = getDefaultReading();
  assert.ok(RECITERS.every((reciter) => isReciterCompatibleWithReading(reciter, reading)));

  const compatible = resolveCompatibleReciters(reading);
  assert.equal(compatible.length, RECITERS.length);
  assert.deepEqual(compatible.map((reciter) => reciter.id), RECITERS.map((reciter) => reciter.id));
  assert.equal(assertReciterCompatibleWithReading("alafasy", reading).id, "alafasy");
});

test("malformed reading definitions are rejected", () => {
  const valid = {
    id: "hafs-an-asim",
    qiraah: "asim",
    riwayah: "hafs",
    label: "Ḥafṣ ʿan ʿĀṣim",
    arabicLabel: "حفص عن عاصم",
  };

  assert.equal(validateReadingDefinition(valid), valid);
  assert.equal(isValidReadingDefinition(valid), true);
  assert.throws(() => validateReadingDefinition(null), /must be an object/i);
  assert.throws(() => validateReadingDefinition({ ...valid, id: "" }), /field 'id'/i);
  assert.throws(() => validateReadingDefinition({ ...valid, qiraah: "nafi" }), /unsupported qiraah/i);
  assert.throws(() => validateReadingDefinition({ ...valid, riwayah: "warsh" }), /unsupported riwayah/i);
  assert.throws(() => validateReadingDefinition({ ...valid, label: "" }), /field 'label'/i);
  assert.throws(() => validateReadingDefinition({ ...valid, arabicLabel: null }), /field 'arabicLabel'/i);
  assert.equal(isValidReadingDefinition({ ...valid, riwayah: "warsh" }), false);
});

test("reading compatibility is deny-by-default", () => {
  assert.equal(isReciterCompatibleWithReading("alafasy", "unknown-reading"), false);
  assert.equal(isReciterCompatibleWithReading("unknown-reciter", "hafs-an-asim"), false);
  assert.equal(isReciterCompatibleWithReading({ id: "unregistered", riwayah: "hafs" }, getDefaultReading()), false);
  assert.deepEqual(resolveCompatibleReciters("unknown-reading"), []);
  assert.throws(
    () => assertReciterCompatibleWithReading("alafasy", "unknown-reading"),
    (error) => error?.code === "unsupported_reading" && /not supported/i.test(error.message),
  );
  assert.throws(
    () => assertReciterCompatibleWithReading("unknown-reciter", getDefaultReading()),
    (error) => error?.code === "unknown_reciter" && /not registered/i.test(error.message),
  );
});
