import {
  EXPECTED_AYAH_COUNT,
  EXPECTED_SURAH_COUNT,
  QURAN_CHAPTER_VERSE_COUNTS,
  SOURCE_REGISTRY_SCHEMA_VERSION,
  createDiscoveredSource,
  type TranslationCoverageReport,
  type TranslationSourceRegistryEntry,
} from "./source-registry.schema.ts";
import { TRANSLATION_NORMALIZATION_VERSION } from "./providers/types.ts";

export const TRANSLATION_SOURCE_REGISTRY_REVISION = "2026-08-07-multilingual-foundation-v1";

function completeCoverage(validatedAt: string): TranslationCoverageReport {
  return {
    expectedSurahs: EXPECTED_SURAH_COUNT,
    actualSurahs: EXPECTED_SURAH_COUNT,
    expectedAyahs: EXPECTED_AYAH_COUNT,
    actualAyahs: EXPECTED_AYAH_COUNT,
    chapterVerseCounts: QURAN_CHAPTER_VERSE_COUNTS,
    missingVerseKeys: [],
    duplicateVerseKeys: [],
    emptyVerseKeys: [],
    invalidVerseKeys: [],
    invalidScriptVerseKeys: [],
    validatedAt,
  };
}

const quranEncLicense = {
  name: "QuranEnc translation republication terms",
  url: "https://quranenc.com/en/browse/amharic_zain",
  documentedPermission: "QuranEnc permits download and republication when content is unchanged, the publisher and QuranEnc are credited, the version and transcript metadata are retained, updates are followed, and unsuitable advertising is excluded.",
  redistribution: "permitted_with_conditions",
  offlineStorage: "permitted",
  modification: "prohibited",
  commercialUse: "not_restricted_by_documented_terms",
} as const;

const AMHARIC_ZAIN = createDiscoveredSource({
  schemaVersion: SOURCE_REGISTRY_SCHEMA_VERSION,
  sourceId: "quranenc:amharic_zain",
  contentKind: "quran_translation",
  candidateStatus: "approved_candidate",
  blockers: [],
  title: "Translation of the Meanings of the Noble Quran — Amharic Translation — Africa Academy",
  translator: ["Muhammad Zain Zahruddin"],
  responsibleOrganization: ["Africa Academy"],
  publisher: "Africa Academy",
  language: { name: "Amharic", bcp47: "am", iso6393: "amh", script: "Ethi", direction: "ltr" },
  provider: {
    name: "QuranEnc",
    id: "amharic_zain",
    sourceUrl: "https://quranenc.com/en/browse/amharic_zain",
    packageUrl: "https://quranenc.com/en/home/download/xml/amharic_zain",
    checkForUpdatesUrl: "https://quranenc.com/check/amharic_zain/v1.0.1-xml.1",
  },
  license: {
    ...quranEncLicense,
    url: "https://quranenc.com/en/browse/amharic_zain",
    attribution: "Amharic translation by Muhammad Zain Zahruddin, published by Africa Academy, supplied by QuranEnc.com, version 1.0.1.",
  },
  edition: {
    name: "Africa Academy Amharic translation",
    version: "1.0.1",
    revision: "1.0.1-xml.1",
    publishedAt: "2024-06-11",
    updatedAt: "2026-01-20",
  },
  coverage: completeCoverage("2026-08-07"),
  integrity: {
    algorithm: "SHA-256",
    rawFormat: "xml",
    rawChecksum: "3b765a67dc43eb54fc08518c66964ea246209c1284def73d1a69d8c7663780f9",
    normalizedChecksum: "77ac2ad5f35ba878b07bc7aed9f233ee418a6f43dbe4d095d6ae32f3153ffb13",
    normalizationVersion: TRANSLATION_NORMALIZATION_VERSION,
  },
  retrieval: {
    retrievedAt: "2026-08-07",
    url: "https://quranenc.com/en/home/download/xml/amharic_zain",
    etag: null,
    lastModified: null,
  },
});

const SOMALI_YACOUB = createDiscoveredSource({
  schemaVersion: SOURCE_REGISTRY_SCHEMA_VERSION,
  sourceId: "quranenc:somali_yacob",
  contentKind: "quran_translation",
  candidateStatus: "blocked",
  blockers: ["Original publisher or responsible organization is not confirmed by the authoritative catalog metadata."],
  title: "Translation of the Meanings of the Noble Quran — Somali Translation — Abdullah Hasan Yaqoub",
  translator: ["Abdullah Hasan Yaqoub"],
  responsibleOrganization: [],
  publisher: null,
  language: { name: "Somali", bcp47: "so", iso6393: "som", script: "Latn", direction: "ltr" },
  provider: {
    name: "QuranEnc",
    id: "somali_yacob",
    sourceUrl: "https://quranenc.com/en/browse/somali_yacob",
    packageUrl: "https://quranenc.com/en/home/download/xml/somali_yacob",
    checkForUpdatesUrl: "https://quranenc.com/check/somali_yacob/v1.0.26-xml.1",
  },
  license: {
    ...quranEncLicense,
    url: "https://quranenc.com/en/browse/somali_yacob",
    attribution: "Somali translation by Abdullah Hasan Yaqoub, supplied by QuranEnc.com, version 1.0.26. Original publisher attribution remains unresolved.",
  },
  edition: {
    name: "Abdullah Hasan Yaqoub Somali translation",
    version: "1.0.26",
    revision: "1.0.26-xml.1",
    publishedAt: "2025-09-04",
    updatedAt: "2025-09-04",
  },
  coverage: completeCoverage("2026-08-07"),
  integrity: {
    algorithm: "SHA-256",
    rawFormat: "xml",
    rawChecksum: "32b315a18f33ae4abe89dba8042fbb60be3ac94e85cbf63c8f042f96ee6ad5ff",
    normalizedChecksum: "18e728f1254649d581e004084d4b74176c690042d7455842591156a03aea4536",
    normalizationVersion: TRANSLATION_NORMALIZATION_VERSION,
  },
  retrieval: {
    retrievedAt: "2026-08-07",
    url: "https://quranenc.com/en/home/download/xml/somali_yacob",
    etag: null,
    lastModified: null,
  },
});

const OROMO_ABABOR = createDiscoveredSource({
  schemaVersion: SOURCE_REGISTRY_SCHEMA_VERSION,
  sourceId: "quranenc:oromo_ababor",
  contentKind: "quran_translation",
  candidateStatus: "blocked",
  blockers: ["Original publisher is not confirmed by the authoritative catalog metadata."],
  title: "Translation of the Meanings of the Noble Quran — Oromo Translation — Gali Ababor",
  translator: ["Gali Ababor Abaghona"],
  responsibleOrganization: [],
  publisher: null,
  language: { name: "Afaan Oromoo", bcp47: "om", iso6393: "orm", script: "Latn", direction: "ltr" },
  provider: {
    name: "QuranEnc",
    id: "oromo_ababor",
    sourceUrl: "https://quranenc.com/en/browse/oromo_ababor",
    packageUrl: "https://quranenc.com/en/home/download/xml/oromo_ababor",
    checkForUpdatesUrl: "https://quranenc.com/check/oromo_ababor/v1.0.3-xml.1",
  },
  license: {
    ...quranEncLicense,
    url: "https://quranenc.com/en/browse/oromo_ababor",
    attribution: "Afaan Oromoo translation by Gali Ababor Abaghona, supplied by QuranEnc.com, version 1.0.3. Original publisher attribution remains unresolved.",
  },
  edition: {
    name: "Gali Ababor Afaan Oromoo translation",
    version: "1.0.3",
    revision: "1.0.3-xml.1",
    publishedAt: "2025-07-13",
    updatedAt: "2025-07-13",
  },
  coverage: completeCoverage("2026-08-07"),
  integrity: {
    algorithm: "SHA-256",
    rawFormat: "xml",
    rawChecksum: "585d0dab94f5361a4ba077037e66df815632805abc6e160f6ca79d08dda137b2",
    normalizedChecksum: "cc733e686cf50904e453d7714534bfc0296f53f7d4c3129357634bee9ad23b8f",
    normalizationVersion: TRANSLATION_NORMALIZATION_VERSION,
  },
  retrieval: {
    retrievedAt: "2026-08-07",
    url: "https://quranenc.com/en/home/download/xml/oromo_ababor",
    etag: null,
    lastModified: null,
  },
});

const SAHEEH_INTERNATIONAL_LEGACY = createDiscoveredSource({
  schemaVersion: SOURCE_REGISTRY_SCHEMA_VERSION,
  sourceId: "quran-foundation:translation:20",
  contentKind: "quran_translation",
  candidateStatus: "legacy_online",
  blockers: ["Permanent offline storage is not permitted without express Quran Foundation permission.", "The upstream translation publication date is not present in the current API metadata."],
  title: "Saheeh International",
  translator: ["Saheeh International"],
  responsibleOrganization: ["Quran Foundation content services"],
  publisher: "Saheeh International",
  language: { name: "English", bcp47: "en", iso6393: "eng", script: "Latn", direction: "ltr" },
  provider: {
    name: "Quran Foundation Content API",
    id: "20",
    sourceUrl: "https://api.quran.com/api/v4/resources/translations",
    packageUrl: null,
    checkForUpdatesUrl: "https://api.quran.com/api/v4/resources/translations",
  },
  license: {
    name: "Quran Foundation Developer Terms of Service",
    url: "https://api-docs.quran.foundation/legal/developer-terms/",
    documentedPermission: "Existing online use is preserved. Quran Foundation content may not be cached or stored for longer than one week without express permission.",
    attribution: "Saheeh International translation displayed from Quran Foundation/Quran.com resource 20.",
    redistribution: "requires_permission",
    offlineStorage: "temporary_only",
    modification: "requires_permission",
    commercialUse: "requires_permission",
  },
  edition: {
    name: "Quran.com resource 20",
    version: "20",
    revision: "2026-08-06-resource-20-legacy-online",
    publishedAt: null,
    updatedAt: "2026-08-07",
  },
  coverage: completeCoverage("2026-08-07"),
  integrity: {
    algorithm: "SHA-256",
    rawFormat: "json",
    rawChecksum: "5b9a94b31978b3255698572dfe071c4a5f0c25bac070ecfedfd2eacd38ac4984",
    normalizedChecksum: "ec543b89673694120b424e8dbbc226adef588e63afb08e607d901886f833acc7",
    normalizationVersion: TRANSLATION_NORMALIZATION_VERSION,
  },
  retrieval: {
    retrievedAt: "2026-08-07",
    url: "https://api.quran.com/api/v4/quran/translations/20",
    etag: null,
    lastModified: null,
  },
});

export const TRANSLATION_SOURCE_REGISTRY: readonly TranslationSourceRegistryEntry[] = Object.freeze([
  AMHARIC_ZAIN,
  SOMALI_YACOUB,
  OROMO_ABABOR,
  SAHEEH_INTERNATIONAL_LEGACY,
]);

export const TRANSLATION_SOURCE_REGISTRY_MANIFEST = Object.freeze({
  schemaVersion: SOURCE_REGISTRY_SCHEMA_VERSION,
  revision: TRANSLATION_SOURCE_REGISTRY_REVISION,
  activationPolicy: "New sources default to disabled and must pass complete identity, rights, coverage, and integrity validation before activation.",
  sources: TRANSLATION_SOURCE_REGISTRY,
});

export function findTranslationSource(sourceId: string): TranslationSourceRegistryEntry | null {
  return TRANSLATION_SOURCE_REGISTRY.find((source) => source.sourceId === sourceId) ?? null;
}

export function findEnabledTranslationSource(language: string): TranslationSourceRegistryEntry | null {
  return TRANSLATION_SOURCE_REGISTRY.find((source) => source.enabled && (source.language.bcp47 === language || source.language.iso6393 === language)) ?? null;
}
