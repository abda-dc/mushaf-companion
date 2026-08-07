import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_MANIFEST } from "../app/content-manifest.ts";
import {
  TRANSLATION_SOURCE_REGISTRY,
  findEnabledTranslationSource,
  findTranslationSource,
} from "../app/content/source-registry.ts";
import {
  assertOfflinePackPermitted,
  assertSourceCanBeEnabled,
  assertSourceRegistryEntryShape,
  createDiscoveredSource,
  validateSourceForActivation,
} from "../app/content/source-registry.schema.ts";
import { TAFSIR_RESOURCE } from "../app/tafsir-source.mjs";

function copySource(sourceId) {
  const source = findTranslationSource(sourceId);
  assert.ok(source, `expected registry source ${sourceId}`);
  return structuredClone(source);
}

test("newly discovered translation sources default to disabled", () => {
  const source = copySource("quranenc:amharic_zain");
  delete source.enabled;
  const registered = createDiscoveredSource(source);
  assert.equal(registered.enabled, false);
  assert.ok(TRANSLATION_SOURCE_REGISTRY.every((entry) => entry.enabled === false));
});

test("incomplete registry entries and missing publishers cannot be activated", () => {
  const incomplete = copySource("quranenc:amharic_zain");
  delete incomplete.title;
  assert.throws(() => assertSourceRegistryEntryShape(incomplete), /title/);

  const missingPublisher = copySource("quranenc:amharic_zain");
  missingPublisher.publisher = null;
  assert.throws(() => assertSourceCanBeEnabled(missingPublisher), /Publisher is required/);
  assert.equal(validateSourceForActivation(missingPublisher).valid, false);
});

test("permanent packs reject unsupported offline-storage rights", () => {
  const source = copySource("quranenc:amharic_zain");
  source.license.offlineStorage = "temporary_only";
  assert.throws(() => assertOfflinePackPermitted(source), /Permanent offline storage is not permitted/);
});

test("candidate status and blockers are fail-closed", () => {
  const amharic = copySource("quranenc:amharic_zain");
  const somali = copySource("quranenc:somali_yacob");
  const oromo = copySource("quranenc:oromo_ababor");
  assert.equal(validateSourceForActivation(amharic).valid, true);
  assert.match(validateSourceForActivation(somali).errors.join(" "), /blocked.*Publisher is required/is);
  assert.match(validateSourceForActivation(oromo).errors.join(" "), /blocked.*Publisher is required/is);
});

test("unavailable languages do not silently resolve to English", () => {
  assert.equal(findEnabledTranslationSource("am"), null);
  assert.equal(findEnabledTranslationSource("so"), null);
  assert.equal(findEnabledTranslationSource("om"), null);
  assert.equal(findEnabledTranslationSource("en"), null);
});

test("legacy Saheeh International and Ibn Kathir identities remain unchanged", () => {
  assert.deepEqual(CONTENT_MANIFEST.resources.translation, {
    id: 20,
    author: "Saheeh International",
    language: "en",
    edition: "Quran.com resource 20",
    source: "Quran Foundation Content API",
    sourceUrl: "https://api-docs.quran.foundation/",
    attribution: "Saheeh International translation displayed from Quran.com resource 20.",
    license: "Upstream content terms apply; this application does not relicense the translation.",
  });
  assert.deepEqual(TAFSIR_RESOURCE, {
    id: 169,
    name: "Ibn Kathir (Abridged)",
    author: "Hafiz Ibn Kathir",
    language: "en",
    edition: "Quran.com resource 169",
    revision: "2026-08-06-resource-169-v1",
    source: "Quran Foundation Content API",
    sourceUrl: "https://api.quran.com/api/v4/resources/tafsirs",
    attribution: "Ibn Kathir (Abridged), supplied through Quran Foundation/Quran.com resource 169.",
    license: "Upstream content terms apply; this application does not relicense the tafsir.",
  });
});
