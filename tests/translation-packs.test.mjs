import assert from "node:assert/strict";
import test from "node:test";

import {
  AMHARIC_TRANSLATION_SOURCE_ID,
  MemoryTranslationPackMarkerStore,
  MemoryTranslationPackRepository,
  TRANSLATION_PACK_DB_NAME,
  TRANSLATION_PACK_STORES,
  TranslationPackBusyError,
  TranslationPackCorruptionError,
  TranslationPackQuotaError,
  TranslationPackService,
} from "../app/translation-packs.mjs";
import { canonicalizeTranslationRecords, sha256Hex } from "../app/content/providers/types.ts";
import { findTranslationSource } from "../app/content/source-registry.ts";
import { canonicalVerseKeys } from "../app/content/source-registry.schema.ts";

const VERSE_KEYS = canonicalVerseKeys();

async function fixture(revision, word) {
  const source = structuredClone(findTranslationSource(AMHARIC_TRANSLATION_SOURCE_ID));
  source.edition.version = revision.split("-")[0];
  source.edition.revision = revision;
  source.edition.updatedAt = "2026-08-07";
  const bytes = new TextEncoder().encode(`verified-amharic:${revision}:${word}`);
  const records = VERSE_KEYS.map((verseKey) => ({
    verseKey,
    translation: `${word} ${verseKey}`,
    footnotes: "",
  }));
  source.integrity.rawChecksum = await sha256Hex(bytes);
  source.integrity.normalizedChecksum = await sha256Hex(canonicalizeTranslationRecords(records));
  return { source, bytes, records };
}

function deferred() {
  let resolve;
  const promise = new Promise((complete) => { resolve = complete; });
  return { promise, resolve };
}

function harness(initialFixture, options = {}) {
  const repository = options.repository ?? new MemoryTranslationPackRepository();
  const markerStore = options.markerStore ?? new MemoryTranslationPackMarkerStore();
  const state = {
    current: initialFixture,
    updateRevision: options.updateRevision ?? null,
    beforeAcquire: options.beforeAcquire ?? null,
    tamperRaw: false,
    recordsOverride: null,
  };
  const service = new TranslationPackService({
    repository,
    markerStore,
    sourceResolver(sourceId) {
      if (sourceId === AMHARIC_TRANSLATION_SOURCE_ID) return structuredClone(state.current.source);
      return findTranslationSource(sourceId);
    },
    adapterFactory(source) {
      const selected = state.current;
      return {
        describeSource: () => source,
        async acquire() {
          await state.beforeAcquire?.();
          return {
            providerName: source.provider.name,
            providerId: source.provider.id,
            bytes: state.tamperRaw ? new TextEncoder().encode("tampered") : selected.bytes,
            contentType: "application/xml",
            retrievedAt: "2026-08-07T00:00:00.000Z",
            etag: null,
            lastModified: null,
          };
        },
        async normalize() {
          return state.recordsOverride ?? selected.records;
        },
        async validate() {
          throw new Error("The service test adapter delegates validation to the storage boundary.");
        },
        async buildPack(acquired, records) {
          return {
            schemaVersion: 1,
            sourceId: source.sourceId,
            providerName: acquired.providerName,
            providerId: acquired.providerId,
            editionRevision: source.edition.revision,
            language: source.language,
            attribution: source.license.attribution,
            rawChecksum: source.integrity.rawChecksum,
            normalizedChecksum: source.integrity.normalizedChecksum,
            records,
            activated: false,
          };
        },
        async checkForUpdate() {
          return {
            updateAvailable: state.updateRevision !== null && state.updateRevision !== source.edition.revision,
            observedRevision: state.updateRevision ?? source.edition.revision,
          };
        },
      };
    },
    storageEstimate: options.storageEstimate ?? (async () => ({ usage: 0, quota: 100_000_000 })),
  });
  return { repository, markerStore, service, state };
}

test("verified Amharic install stages and atomically exposes exactly 114 surahs and 6,236 ayat", async () => {
  const v1 = await fixture("1.0.1-xml.1", "ትርጉም");
  const { repository, service } = harness(v1);
  const progress = [];

  const result = await service.install(undefined, { onProgress: (item) => progress.push(item) });
  assert.equal(result.status, "installed");
  assert.equal(result.pack.sourceId, AMHARIC_TRANSLATION_SOURCE_ID);
  assert.equal(result.pack.surahCount, 114);
  assert.equal(result.pack.verseCount, 6236);
  assert.equal(result.pack.rawChecksum, v1.source.integrity.rawChecksum);
  assert.equal(result.pack.normalizedChecksum, v1.source.integrity.normalizedChecksum);
  assert.equal(TRANSLATION_PACK_DB_NAME, "mushaf-translation-packs-v1");
  assert.notEqual(TRANSLATION_PACK_DB_NAME, "mushaf-offline-audio-v1");
  assert.deepEqual(Object.values(TRANSLATION_PACK_STORES), ["packs", "verses", "state", "installs", "locks"]);

  assert.deepEqual(await service.getByVerseKey("2:255"), {
    verseKey: "2:255",
    translation: "ትርጉም 2:255",
    footnotes: "",
  });
  assert.deepEqual(await service.getByPageVerseKeys(["1:7", "2:1", "1:7"]), [
    { verseKey: "1:7", translation: "ትርጉም 1:7", footnotes: "" },
    { verseKey: "2:1", translation: "ትርጉም 2:1", footnotes: "" },
    { verseKey: "1:7", translation: "ትርጉም 1:7", footnotes: "" },
  ]);
  assert.equal((await service.verifyActive()).records, 6236);
  assert.equal(repository.snapshot().installs.length, 0);
  assert.deepEqual(progress.map((item) => item.phase), ["preparing", "downloading", "normalizing", "validating", "staging", "verifying", "activating", "complete"]);
  assert.equal(progress.at(-1).percent, 100);
  assert.equal(progress.at(-1).completedRecords, 6236);
});

test("raw, normalized, coverage, and stored-record corruption fail closed and repair is explicit", async () => {
  const v1 = await fixture("1.0.1-xml.1", "መልእክት");
  const { repository, service, state } = harness(v1);
  await service.install();
  const active = (await service.getStatus()).activePackKey;

  repository.corruptVerse(active, "1:1", "tampered");
  await assert.rejects(service.verifyActive(), TranslationPackCorruptionError);
  const repaired = await service.repair();
  assert.equal(repaired.status, "repaired");
  assert.equal((await service.getByVerseKey("1:1")).translation, "መልእክት 1:1");

  await service.deleteSource();
  state.tamperRaw = true;
  await assert.rejects(service.install(), /Raw translation checksum mismatch/);
  assert.equal((await service.getStatus()).activePackKey, null);

  state.tamperRaw = false;
  state.recordsOverride = v1.records.slice(0, -1);
  await assert.rejects(service.install(), /exactly 6,236 ayat/);
  assert.equal(repository.snapshot().packs.length, 0);
});

test("interrupted staging is reclaimed without exposing a partial pack", async () => {
  const v1 = await fixture("1.0.1-xml.1", "መጽሐፍ");
  const { repository, service } = harness(v1);
  repository.seedInterruptedInstall({
    installId: "dead-install",
    operationId: "dead-operation",
    ownerId: "dead-owner",
    sourceId: AMHARIC_TRANSLATION_SOURCE_ID,
    packKey: "orphan-pack",
    editionRevision: "orphan",
    expectedRecords: 6236,
    startedAt: "2026-08-07T00:00:00.000Z",
  }, v1.records.slice(0, 10));

  assert.equal(repository.snapshot().verses.length, 10);
  assert.equal(await service.cleanupInterruptedInstalls(), 1);
  assert.equal(repository.snapshot().verses.length, 0);
  assert.equal(repository.snapshot().installs.length, 0);
  assert.equal((await service.getStatus()).activePackKey, null);
});

test("a newly installed version preserves one verified rollback target", async () => {
  const v1 = await fixture("1.0.1-xml.1", "አንድ");
  const v2 = await fixture("1.0.2-xml.1", "ሁለት");
  const { service, state } = harness(v1);
  const first = await service.install();
  state.current = v2;
  const second = await service.install();

  let status = await service.getStatus();
  assert.equal(status.activePackKey, second.pack.packKey);
  assert.equal(status.previousPackKey, first.pack.packKey);
  assert.equal((await service.getByVerseKey("1:1")).translation, "ሁለት 1:1");

  const rolledBack = await service.rollback();
  status = await service.getStatus();
  assert.equal(rolledBack.packKey, first.pack.packKey);
  assert.equal(status.activePackKey, first.pack.packKey);
  assert.equal(status.previousPackKey, second.pack.packKey);
  assert.equal((await service.getByVerseKey("1:1")).translation, "አንድ 1:1");
});

test("deletion removes a version, falls back atomically, and can remove the full source", async () => {
  const v1 = await fixture("1.0.1-xml.1", "ቀዳሚ");
  const v2 = await fixture("1.0.2-xml.1", "ተከታይ");
  const { markerStore, repository, service, state } = harness(v1);
  const first = await service.install();
  state.current = v2;
  const second = await service.install();

  assert.equal(await service.deleteVersion(second.pack.packKey), true);
  assert.equal((await service.getStatus()).activePackKey, first.pack.packKey);
  assert.equal((await service.getByVerseKey("1:1")).translation, "ቀዳሚ 1:1");
  repository.seedInterruptedInstall({
    installId: "delete-orphan",
    operationId: "dead-delete-operation",
    ownerId: "dead-delete-owner",
    sourceId: AMHARIC_TRANSLATION_SOURCE_ID,
    packKey: "delete-orphan-pack",
    editionRevision: "orphan",
    expectedRecords: 6236,
    startedAt: "2026-08-07T00:00:00.000Z",
  }, v1.records.slice(0, 2));
  assert.equal(await service.deleteSource(), 1);
  assert.equal((await service.getStatus()).installedPacks.length, 0);
  assert.equal(await service.getByVerseKey("1:1"), null);
  assert.equal(markerStore.get(AMHARIC_TRANSLATION_SOURCE_ID), null);
  assert.equal(repository.snapshot().verses.length, 0);
});

test("install and update leases reject concurrent operations", async () => {
  const v1 = await fixture("1.0.1-xml.1", "መቆለፊያ");
  const gate = deferred();
  const entered = deferred();
  let acquireCount = 0;
  const sharedRepository = new MemoryTranslationPackRepository();
  const sharedMarker = new MemoryTranslationPackMarkerStore();
  const first = harness(v1, {
    repository: sharedRepository,
    markerStore: sharedMarker,
    beforeAcquire: async () => {
      acquireCount += 1;
      entered.resolve();
      await gate.promise;
    },
  });
  const second = harness(v1, { repository: sharedRepository, markerStore: sharedMarker });

  const installing = first.service.install();
  await entered.promise;
  await assert.rejects(second.service.install(), TranslationPackBusyError);
  await assert.rejects(first.service.checkForUpdate(), TranslationPackBusyError);
  assert.equal(acquireCount, 1);
  gate.resolve();
  await installing;
});

test("quota failure cleans staging and leaves the prior version active", async () => {
  const v1 = await fixture("1.0.1-xml.1", "የቆየ");
  const v2 = await fixture("1.0.2-xml.1", "አዲስ");
  const { repository, service, state } = harness(v1);
  const first = await service.install();
  state.current = v2;
  repository.failNextStage(new DOMException("Quota exceeded while staging", "QuotaExceededError"));

  await assert.rejects(service.install(), TranslationPackQuotaError);
  const status = await service.getStatus();
  assert.equal(status.activePackKey, first.pack.packKey);
  assert.equal(status.installedPacks.length, 1);
  assert.equal(repository.snapshot().installs.length, 0);
  assert.equal(repository.snapshot().verses.length, 6236);
});

test("a surviving sentinel detects IndexedDB reclamation and repair restores the pack", async () => {
  const v1 = await fixture("1.0.1-xml.1", "መልሶ");
  const { repository, service } = harness(v1);
  const installed = await service.install();
  repository.simulateStorageReclamation();

  assert.deepEqual(await service.detectStorageReclamation(), {
    reclaimed: true,
    expectedPackKey: installed.pack.packKey,
    reason: "active-state-missing",
  });
  const repaired = await service.repair();
  assert.equal(repaired.status, "repaired");
  assert.equal((await service.detectStorageReclamation()).reclaimed, false);
  assert.equal((await service.getByVerseKey("114:6")).translation, "መልሶ 114:6");
});

test("update detection records a notice and never silently replaces the active pack", async () => {
  const v1 = await fixture("1.0.1-xml.1", "የአሁን");
  const { service, state } = harness(v1, { updateRevision: "1.0.2-xml.1" });
  const installed = await service.install();
  const update = await service.checkForUpdate();
  const status = await service.getStatus();

  assert.equal(update.updateAvailable, true);
  assert.equal(update.observedRevision, "1.0.2-xml.1");
  assert.equal(update.replacementPerformed, false);
  assert.equal(update.activePackKey, installed.pack.packKey);
  assert.equal(status.activePackKey, installed.pack.packKey);
  assert.equal(status.installedPacks.length, 1);
  assert.equal(status.updateNotice.observedRevision, "1.0.2-xml.1");
  state.updateRevision = null;
});

test("Somali, Afaan Oromoo, and permanent offline English fail before acquisition", async () => {
  const v1 = await fixture("1.0.1-xml.1", "ታግዷል");
  const { service } = harness(v1);

  await assert.rejects(service.install("quranenc:somali_yacob"), /blocked|Publisher is required/i);
  await assert.rejects(service.install("quranenc:oromo_ababor"), /blocked|Publisher is required/i);
  await assert.rejects(service.install("quran-foundation:translation:20"), /Permanent offline storage is not permitted/i);
  assert.equal((await service.getStatus()).installedPacks.length, 0);
});
