export type IslamicReferenceAction =
  | "internal-quran-navigation"
  | "internal-hadith-navigation"
  | "external-link";
export type IslamicExternalContentPolicy = "metadata-only";
export type IslamicReferenceTopicStatus = "reference-ready" | "planned";

export interface QuranReference {
  id: string;
  type: "quran";
  verseKeys: string[];
  locator: string;
  action: "internal-quran-navigation";
}

export interface HadithReference {
  id: string;
  type: "hadith";
  title: string;
  collectionId: string;
  collection: string;
  locator: string;
  narrator: string | null;
  grading: {
    label: string;
    authority: string | null;
    reference: string | null;
  };
  sourceName: "HadeethEnc";
  sourceRecordId: string;
  sourceUrl: string;
  action: "internal-hadith-navigation";
  contentPolicy: "metadata-only";
}

export interface ScholarlyReference {
  id: string;
  type: "scholarly";
  title: string;
  author: string;
  locator: string;
  sourceName: "Alharamain's Message";
  responsibleOrganization: string;
  sourceUrl: string;
  action: "external-link";
  contentPolicy: "metadata-only";
}

export type IslamicReference =
  | QuranReference
  | HadithReference
  | ScholarlyReference;

export interface IslamicReferenceTopic {
  id: string;
  title: string;
  description: string;
  status: IslamicReferenceTopicStatus;
  references: IslamicReference[];
}

export interface IslamicReferenceCollection {
  id: string;
  title: string;
  description: string;
  references: IslamicReference[];
  topics: IslamicReferenceTopic[];
}

export interface IslamicReferenceLibrary {
  schemaVersion: 2;
  id: "islamic-foundations";
  title: "Islamic Foundations";
  revision: string;
  collections: IslamicReferenceCollection[];
}

export const REQUIRED_CORE_COLLECTION_IDS = Object.freeze([
  "islam",
  "iman",
  "ihsan",
  "tawhid",
  "quran-and-sunnah",
  "akhlaq-and-adab",
  "taharah",
  "halal-and-haram",
  "dua-and-dhikr",
  "akhirah",
] as const);

export const REQUIRED_CORE_TOPIC_IDS = Object.freeze({
  islam: Object.freeze([
    "islam-shahadah",
    "islam-salah",
    "islam-zakat",
    "islam-sawm",
    "islam-hajj",
  ] as const),
  iman: Object.freeze([
    "iman-belief-in-allah",
    "iman-belief-in-angels",
    "iman-belief-in-revealed-books",
    "iman-belief-in-messengers",
    "iman-belief-in-last-day",
    "iman-belief-in-qadr",
  ] as const),
  ihsan: Object.freeze([
    "ihsan-meaning-of-ihsan",
    "ihsan-sincerity",
    "ihsan-awareness-of-allah",
    "ihsan-taqwa",
  ] as const),
  tawhid: Object.freeze([
    "tawhid-worship-of-allah-alone",
    "tawhid-allahs-lordship",
    "tawhid-names-and-attributes",
    "tawhid-shirk",
  ] as const),
  "quran-and-sunnah": Object.freeze([
    "quran-and-sunnah-quran",
    "quran-and-sunnah-sunnah",
    "quran-and-sunnah-hadith",
    "quran-and-sunnah-relationship-between-quran-and-sunnah",
  ] as const),
  "akhlaq-and-adab": Object.freeze([
    "akhlaq-and-adab-truthfulness",
    "akhlaq-and-adab-humility",
    "akhlaq-and-adab-parents-and-family",
    "akhlaq-and-adab-neighbors",
    "akhlaq-and-adab-justice",
    "akhlaq-and-adab-good-manners",
  ] as const),
  taharah: Object.freeze([
    "taharah-purification",
    "taharah-wudu",
    "taharah-ghusl",
    "taharah-cleanliness-and-prayer",
  ] as const),
  "halal-and-haram": Object.freeze([
    "halal-and-haram-lawful-and-unlawful",
    "halal-and-haram-food",
    "halal-and-haram-income",
    "halal-and-haram-transactions",
    "halal-and-haram-relationships-and-conduct",
  ] as const),
  "dua-and-dhikr": Object.freeze([
    "dua-and-dhikr-dua",
    "dua-and-dhikr-dhikr",
    "dua-and-dhikr-morning-and-evening-remembrance",
    "dua-and-dhikr-etiquette-of-supplication",
  ] as const),
  akhirah: Object.freeze([
    "akhirah-death",
    "akhirah-life-of-the-grave",
    "akhirah-resurrection",
    "akhirah-day-of-judgment",
    "akhirah-accountability",
    "akhirah-paradise",
    "akhirah-hellfire",
  ] as const),
});

const SAFE_ID = /^[a-z0-9](?:[a-z0-9:._/-]{0,158}[a-z0-9])?$/;
const VERSE_KEY = /^(?:[1-9]|[1-9]\d|1(?:0\d|1[0-4])):[1-9]\d{0,2}$/;

const APPROVED_QURAN_VERSE_KEYS = new Set([
  "2:2",
  "2:43",
  "2:177",
  "2:183",
  "2:185",
  "2:188",
  "2:255",
  "2:275",
  "2:285",
  "3:3",
  "3:4",
  "3:18",
  "3:97",
  "4:36",
  "4:43",
  "4:48",
  "4:59",
  "4:103",
  "4:135",
  "4:136",
  "4:163",
  "4:164",
  "4:165",
  "5:3",
  "5:6",
  "5:8",
  "5:44",
  "5:45",
  "5:46",
  "5:47",
  "5:48",
  "7:54",
  "7:55",
  "7:180",
  "9:60",
  "9:108",
  "9:119",
  "15:9",
  "16:36",
  "16:44",
  "16:116",
  "17:23",
  "17:32",
  "21:25",
  "22:7",
  "22:27",
  "23:15",
  "23:16",
  "25:63",
  "31:13",
  "31:18",
  "33:21",
  "33:41",
  "33:42",
  "33:70",
  "35:1",
  "39:62",
  "40:60",
  "42:11",
  "47:19",
  "49:6",
  "51:56",
  "54:49",
  "57:22",
  "59:7",
  "59:22",
  "68:4",
  "76:30",
  "99:1",
  "99:2",
  "99:3",
  "99:4",
  "99:5",
  "99:6",
  "99:7",
  "99:8",
  "112:1",
  "112:2",
  "112:3",
  "112:4",
  "3:133",
  "14:27",
  "21:35",
  "66:6",
  "82:19",
  "3:102",
  "57:4",
  "98:5",
]);

const HADEETHENC_RECORD_ID = /^[1-9]\d*$/;
const HADEETHENC_ORIGIN = "https://hadeethenc.com";
const ALHARAMAIN_ORIGIN = "https://risala.prh.gov.sa";

function isRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

function exactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: string[],
) {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) issues.push(`${path}.${key} is not allowed`);
  }
}

function safeId(value: unknown): value is string {
  return typeof value === "string" && SAFE_ID.test(value);
}

function safeText(value: unknown, max = 500): value is string {
  return typeof value === "string"
    && value.trim() === value
    && value.length > 0
    && [...value].length <= max
    && !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value);
}

function safeHttpsUrl(value: unknown, expectedOrigin: string): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.origin === expectedOrigin
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

function validateNullableText(
  value: unknown,
  path: string,
  issues: string[],
  max = 500,
) {
  if (value !== null && !safeText(value, max)) {
    issues.push(`${path} is invalid`);
  }
}

function validateQuranReference(
  value: Record<string, unknown>,
  path: string,
  issues: string[],
) {
  exactKeys(
    value,
    ["id", "type", "verseKeys", "locator", "action"],
    path,
    issues,
  );

  if (!safeId(value.id)) issues.push(`${path}.id is invalid`);
  if (value.type !== "quran") issues.push(`${path}.type is invalid`);
  if (!safeText(value.locator, 120)) issues.push(`${path}.locator is invalid`);
  if (value.action !== "internal-quran-navigation") {
    issues.push(`${path}.action must use trusted Quran navigation`);
  }

  if (
    !Array.isArray(value.verseKeys)
    || value.verseKeys.length < 1
    || value.verseKeys.length > 286
    || value.verseKeys.some(
      (verseKey) =>
        typeof verseKey !== "string"
        || !VERSE_KEY.test(verseKey)
        || !APPROVED_QURAN_VERSE_KEYS.has(verseKey),
    )
  ) {
    issues.push(`${path}.verseKeys is invalid`);
  } else if (new Set(value.verseKeys).size !== value.verseKeys.length) {
    issues.push(`${path}.verseKeys contains duplicates`);
  }
}

function validateHadithReference(
  value: Record<string, unknown>,
  path: string,
  issues: string[],
) {
  exactKeys(
    value,
    [
      "id",
      "type",
      "title",
      "collectionId",
      "collection",
      "locator",
      "narrator",
      "grading",
      "sourceName",
      "sourceRecordId",
      "sourceUrl",
      "action",
      "contentPolicy",
    ],
    path,
    issues,
  );

  if (!safeId(value.id)) issues.push(`${path}.id is invalid`);
  if (value.type !== "hadith") issues.push(`${path}.type is invalid`);
  if (!safeText(value.title, 500)) issues.push(`${path}.title is invalid`);
  if (!safeId(value.collectionId)) issues.push(`${path}.collectionId is invalid`);
  if (!safeText(value.collection, 200)) {
    issues.push(`${path}.collection is invalid`);
  }
  if (!safeText(value.locator, 120)) issues.push(`${path}.locator is invalid`);
  validateNullableText(value.narrator, `${path}.narrator`, issues, 300);

  if (!isRecord(value.grading)) {
    issues.push(`${path}.grading is missing`);
  } else {
    exactKeys(
      value.grading,
      ["label", "authority", "reference"],
      `${path}.grading`,
      issues,
    );
    if (!safeText(value.grading.label, 120)) {
      issues.push(`${path}.grading.label is invalid`);
    }
    validateNullableText(
      value.grading.authority,
      `${path}.grading.authority`,
      issues,
      200,
    );
    validateNullableText(
      value.grading.reference,
      `${path}.grading.reference`,
      issues,
      200,
    );
  }

  if (value.sourceName !== "HadeethEnc") {
    issues.push(`${path}.sourceName is not an approved source`);
  }
  if (
    typeof value.sourceRecordId !== "string"
    || !HADEETHENC_RECORD_ID.test(value.sourceRecordId)
  ) {
    issues.push(`${path}.sourceRecordId is invalid`);
  }
  if (!safeHttpsUrl(value.sourceUrl, HADEETHENC_ORIGIN)) {
    issues.push(`${path}.sourceUrl must be an approved HadeethEnc HTTPS URL`);
  }
  if (value.action !== "internal-hadith-navigation") {
    issues.push(`${path}.action must be internal-hadith-navigation`);
  }
  if (value.contentPolicy !== "metadata-only") {
    issues.push(`${path}.contentPolicy must be metadata-only`);
  }
}

function validateScholarlyReference(
  value: Record<string, unknown>,
  path: string,
  issues: string[],
) {
  exactKeys(
    value,
    [
      "id",
      "type",
      "title",
      "author",
      "locator",
      "sourceName",
      "responsibleOrganization",
      "sourceUrl",
      "action",
      "contentPolicy",
    ],
    path,
    issues,
  );

  if (!safeId(value.id)) issues.push(`${path}.id is invalid`);
  if (value.type !== "scholarly") issues.push(`${path}.type is invalid`);
  if (!safeText(value.title, 500)) issues.push(`${path}.title is invalid`);
  if (!safeText(value.author, 300)) issues.push(`${path}.author is invalid`);
  if (!safeText(value.locator, 300)) issues.push(`${path}.locator is invalid`);
  if (value.sourceName !== "Alharamain's Message") {
    issues.push(`${path}.sourceName is not an approved source`);
  }
  if (!safeText(value.responsibleOrganization, 500)) {
    issues.push(`${path}.responsibleOrganization is invalid`);
  }
  if (!safeHttpsUrl(value.sourceUrl, ALHARAMAIN_ORIGIN)) {
    issues.push(`${path}.sourceUrl must be an approved Alharamain HTTPS URL`);
  }
  if (value.action !== "external-link") {
    issues.push(`${path}.action must be external-link`);
  }
  if (value.contentPolicy !== "metadata-only") {
    issues.push(`${path}.contentPolicy must be metadata-only`);
  }
}

function validateReferenceArray(
  value: unknown,
  path: string,
  issues: string[],
  referenceIds: string[],
): value is Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length > 100) {
    issues.push(`${path} is invalid`);
    return false;
  }

  value.forEach((referenceValue, referenceIndex) => {
    const referencePath = `${path}.${referenceIndex}`;
    if (!isRecord(referenceValue)) {
      issues.push(`${referencePath} is malformed`);
      return;
    }

    if (safeId(referenceValue.id)) referenceIds.push(referenceValue.id);

    switch (referenceValue.type) {
      case "quran":
        validateQuranReference(referenceValue, referencePath, issues);
        break;
      case "hadith":
        validateHadithReference(referenceValue, referencePath, issues);
        break;
      case "scholarly":
        validateScholarlyReference(referenceValue, referencePath, issues);
        break;
      default:
        issues.push(`${referencePath}.type is unsupported`);
    }
  });

  return true;
}

export function validateIslamicReferenceLibrary(
  input: unknown,
): {
  valid: boolean;
  issues: string[];
  library: IslamicReferenceLibrary | null;
} {
  const issues: string[] = [];
  let value: unknown;

  try {
    value = structuredClone(input);
  } catch {
    return {
      valid: false,
      issues: ["reference library could not be detached safely"],
      library: null,
    };
  }

  if (!isRecord(value)) {
    return {
      valid: false,
      issues: ["reference library is missing or malformed"],
      library: null,
    };
  }

  exactKeys(
    value,
    ["schemaVersion", "id", "title", "revision", "collections"],
    "library",
    issues,
  );

  if (value.schemaVersion !== 2) issues.push("unsupported reference library schema");
  if (value.id !== "islamic-foundations") {
    issues.push("reference library ID is invalid");
  }
  if (value.title !== "Islamic Foundations") {
    issues.push("reference library title is invalid");
  }
  if (!safeText(value.revision, 160)) {
    issues.push("reference library revision is invalid");
  }

  const collectionIds: string[] = [];
  const topicIds: string[] = [];
  const referenceIds: string[] = [];
  const topicsByCollection = new Map<string, Set<string>>();

  if (!Array.isArray(value.collections) || value.collections.length > 100) {
    issues.push("library.collections is invalid");
  } else {
    value.collections.forEach((collectionValue, collectionIndex) => {
      const collectionPath = `library.collections.${collectionIndex}`;
      if (!isRecord(collectionValue)) {
        issues.push(`${collectionPath} is malformed`);
        return;
      }

      exactKeys(
        collectionValue,
        ["id", "title", "description", "references", "topics"],
        collectionPath,
        issues,
      );

      let collectionId: string | null = null;
      if (!safeId(collectionValue.id)) {
        issues.push(`${collectionPath}.id is invalid`);
      } else {
        collectionId = collectionValue.id;
        collectionIds.push(collectionValue.id);
        if (!topicsByCollection.has(collectionValue.id)) {
          topicsByCollection.set(collectionValue.id, new Set());
        }
      }

      if (!safeText(collectionValue.title, 200)) {
        issues.push(`${collectionPath}.title is invalid`);
      }
      if (!safeText(collectionValue.description, 500)) {
        issues.push(`${collectionPath}.description is invalid`);
      }

      validateReferenceArray(
        collectionValue.references,
        `${collectionPath}.references`,
        issues,
        referenceIds,
      );

      if (!Array.isArray(collectionValue.topics) || collectionValue.topics.length > 200) {
        issues.push(`${collectionPath}.topics is invalid`);
        return;
      }

      collectionValue.topics.forEach((topicValue, topicIndex) => {
        const topicPath = `${collectionPath}.topics.${topicIndex}`;
        if (!isRecord(topicValue)) {
          issues.push(`${topicPath} is malformed`);
          return;
        }

        exactKeys(
          topicValue,
          ["id", "title", "description", "status", "references"],
          topicPath,
          issues,
        );

        if (!safeId(topicValue.id)) {
          issues.push(`${topicPath}.id is invalid`);
        } else {
          topicIds.push(topicValue.id);
          if (collectionId) topicsByCollection.get(collectionId)?.add(topicValue.id);
        }

        if (!safeText(topicValue.title, 200)) {
          issues.push(`${topicPath}.title is invalid`);
        }
        if (!safeText(topicValue.description, 500)) {
          issues.push(`${topicPath}.description is invalid`);
        }
        if (
          topicValue.status !== "reference-ready"
          && topicValue.status !== "planned"
        ) {
          issues.push(`${topicPath}.status is invalid`);
        }

        const referencesAreValidArray = validateReferenceArray(
          topicValue.references,
          `${topicPath}.references`,
          issues,
          referenceIds,
        );

        if (referencesAreValidArray) {
          if (topicValue.status === "planned" && topicValue.references.length !== 0) {
            issues.push(`${topicPath} planned topics must not contain references`);
          }
          if (
            topicValue.status === "reference-ready"
            && topicValue.references.length === 0
          ) {
            issues.push(`${topicPath} reference-ready topics require a reference`);
          }
        }
      });
    });
  }

  if (new Set(collectionIds).size !== collectionIds.length) {
    issues.push("collection IDs must be unique");
  }
  if (new Set(topicIds).size !== topicIds.length) {
    issues.push("topic IDs must be globally unique");
  }
  if (new Set(referenceIds).size !== referenceIds.length) {
    issues.push("reference IDs must be globally unique");
  }

  const presentCollectionIds = new Set(collectionIds);
  for (const requiredCollectionId of REQUIRED_CORE_COLLECTION_IDS) {
    if (!presentCollectionIds.has(requiredCollectionId)) {
      issues.push(`required core collection ${requiredCollectionId} is missing`);
    }

    const presentTopicIds = topicsByCollection.get(requiredCollectionId);
    for (const requiredTopicId of REQUIRED_CORE_TOPIC_IDS[requiredCollectionId]) {
      if (!presentTopicIds?.has(requiredTopicId)) {
        issues.push(
          `required topic ${requiredTopicId} is missing from ${requiredCollectionId}`,
        );
      }
    }
  }

  if (issues.length) {
    return { valid: false, issues, library: null };
  }

  return {
    valid: true,
    issues,
    library: deepFreeze(value as unknown as IslamicReferenceLibrary),
  };
}

function quranReference(
  id: string,
  verseKeys: string[],
  locator: string,
): QuranReference {
  return {
    id,
    type: "quran",
    verseKeys,
    locator,
    action: "internal-quran-navigation",
  };
}

function hadithReference(
  id: string,
  title: string,
  collectionId: string,
  collection: string,
  locator: string,
  narrator: string | null,
  sourceRecordId: string,
  gradingReference: string,
  gradingLabel = "Authentic",
): HadithReference {
  return {
    id,
    type: "hadith",
    title,
    collectionId,
    collection,
    locator,
    narrator,
    grading: {
      label: gradingLabel,
      authority: "HadeethEnc",
      reference: gradingReference,
    },
    sourceName: "HadeethEnc",
    sourceRecordId,
    sourceUrl: `https://hadeethenc.com/en/browse/hadith/${sourceRecordId}`,
    action: "internal-hadith-navigation",
    contentPolicy: "metadata-only",
  };
}

function scholarlyReference(id: string, locator: string): ScholarlyReference {
  return {
    id,
    type: "scholarly",
    title: "A Glimpse into the Islamic Creed",
    author: "Muhammad ibn Salih al-Uthaymin",
    locator,
    sourceName: "Alharamain's Message",
    responsibleOrganization:
      "Presidency of Religious Affairs at the Grand Mosque and the Prophet's Mosque",
    sourceUrl: "https://risala.prh.gov.sa/en/content/81",
    action: "external-link",
    contentPolicy: "metadata-only",
  };
}

function whatAMuslimMustKnowScholarlyReference(
  id: string,
  locator: string,
): ScholarlyReference {
  return {
    id,
    type: "scholarly",
    title: "What A Muslim Must Know",
    author:
      "The Scientific Committee under the Presidency of Religious Affairs at the Sacred Mosque and the Prophet's Mosque",
    locator,
    sourceName: "Alharamain's Message",
    responsibleOrganization:
      "Presidency of Religious Affairs at the Grand Mosque and the Prophet's Mosque",
    sourceUrl: "https://risala.prh.gov.sa/en/content/251",
    action: "external-link",
    contentPolicy: "metadata-only",
  };
}

function _plannedTopic(id: string, title: string): IslamicReferenceTopic {
  return {
    id,
    title,
    description: `Explore references related to ${title}.`,
    status: "planned",
    references: [],
  };
}

function referenceReadyTopic(
  id: string,
  title: string,
  references: IslamicReference[],
): IslamicReferenceTopic {
  return {
    id,
    title,
    description: `References related to ${title}.`,
    status: "reference-ready",
    references,
  };
}

const RAW_ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY: IslamicReferenceLibrary = {
  schemaVersion: 2,
  id: "islamic-foundations",
  title: "Islamic Foundations",
  revision: "m9r-v10",
  collections: [
    {
      id: "islam",
      title: "Islam — Outer Practice & Submission",
      description: "Browse references and topics related to Islam.",
      references: [
        hadithReference(
          "hadith:islam-overview:hadeethenc-65000",
          "Foundations of Islam (Five Pillars)",
          "muslim",
          "Sahih Muslim",
          "16",
          null,
          "65000",
          "Sahih Muslim 16",
        ),
        scholarlyReference(
          "scholarly:islam-overview:uthaymin-creed",
          "Pillars of Islam",
        ),
      ],
      topics: [
        referenceReadyTopic(
          "islam-shahadah",
          "Shahadah",
          [
            quranReference(
              "quran:islam-shahadah:3-18",
              ["3:18"],
              "3:18",
            ),
            quranReference(
              "quran:islam-shahadah:47-19",
              ["47:19"],
              "47:19",
            ),
            hadithReference(
              "hadith:islam-shahadah:hadeethenc-4563",
              "Hadith of Jibril (Testimony of Faith)",
              "muslim",
              "Sahih Muslim",
              "8",
              "Umar ibn al-Khattab",
              "4563",
              "Sahih Muslim 8",
            ),
            scholarlyReference(
              "scholarly:islam-shahadah:uthaymin-creed",
              "Pillars of Islam — testimony of faith",
            ),
          ],
        ),
        referenceReadyTopic(
          "islam-salah",
          "Salah",
          [
            quranReference(
              "quran:islam-salah:2-43",
              ["2:43"],
              "2:43",
            ),
            quranReference(
              "quran:islam-salah:4-103",
              ["4:103"],
              "4:103",
            ),
            hadithReference(
              "hadith:islam-salah:hadeethenc-4968",
              "Five Daily Prayers",
              "bukhari",
              "Sahih al-Bukhari",
              "528",
              "Abu Hurayrah",
              "4968",
              "Sahih al-Bukhari 528",
            ),
            scholarlyReference(
              "scholarly:islam-salah:uthaymin-creed",
              "Pillars of Islam — establishment of prayer",
            ),
          ],
        ),
        referenceReadyTopic(
          "islam-zakat",
          "Zakat",
          [
            quranReference(
              "quran:islam-zakat:2-43",
              ["2:43"],
              "2:43",
            ),
            quranReference(
              "quran:islam-zakat:9-60",
              ["9:60"],
              "9:60",
            ),
            hadithReference(
              "hadith:islam-zakat:hadeethenc-3689",
              "Obligation of Zakat",
              "bukhari",
              "Sahih al-Bukhari",
              "1397",
              null,
              "3689",
              "Sahih al-Bukhari 1397",
            ),
            scholarlyReference(
              "scholarly:islam-zakat:uthaymin-creed",
              "Pillars of Islam — paying Zakah",
            ),
          ],
        ),
        referenceReadyTopic(
          "islam-sawm",
          "Sawm",
          [
            quranReference(
              "quran:islam-sawm:2-183",
              ["2:183"],
              "2:183",
            ),
            quranReference(
              "quran:islam-sawm:2-185",
              ["2:185"],
              "2:185",
            ),
            hadithReference(
              "hadith:islam-sawm:hadeethenc-65003",
              "Obligation of Fasting Ramadan",
              "muslim",
              "Sahih Muslim",
              "15",
              null,
              "65003",
              "Sahih Muslim 15",
            ),
            scholarlyReference(
              "scholarly:islam-sawm:uthaymin-creed",
              "Pillars of Islam — fasting Ramadan",
            ),
          ],
        ),
        referenceReadyTopic(
          "islam-hajj",
          "Hajj",
          [
            quranReference(
              "quran:islam-hajj:3-97",
              ["3:97"],
              "3:97",
            ),
            quranReference(
              "quran:islam-hajj:22-27",
              ["22:27"],
              "22:27",
            ),
            hadithReference(
              "hadith:islam-hajj:hadeethenc-2758",
              "Obligation of Hajj",
              "bukhari",
              "Sahih al-Bukhari",
              "1521",
              "Abu Hurayrah",
              "2758",
              "Sahih al-Bukhari 1521",
            ),
            scholarlyReference(
              "scholarly:islam-hajj:uthaymin-creed",
              "Pillars of Islam — Hajj",
            ),
          ],
        ),
      ],
    },
    {
      id: "iman",
      title: "Iman — Inner Conviction & Faith",
      description: "Browse references and topics related to Iman.",
      references: [
        quranReference("quran:iman-overview:2-177", ["2:177"], "2:177"),
        quranReference("quran:iman-overview:4-136", ["4:136"], "4:136"),
        quranReference("quran:iman-overview:54-49", ["54:49"], "54:49"),
        hadithReference(
          "hadith:iman-overview:hadeethenc-4563",
          "Hadith of Jibril",
          "muslim",
          "Sahih Muslim",
          "8",
          "Umar ibn al-Khattab",
          "4563",
          "Sahih Muslim 8",
        ),
        scholarlyReference(
          "scholarly:iman-overview:uthaymin-creed",
          "Foundations of the Islamic Creed",
        ),
      ],
      topics: [
        referenceReadyTopic(
          "iman-belief-in-allah",
          "Belief in Allah",
          [
            quranReference(
              "quran:iman-belief-in-allah:2-255",
              ["2:255"],
              "2:255",
            ),
            quranReference(
              "quran:iman-belief-in-allah:59-22",
              ["59:22"],
              "59:22",
            ),
            hadithReference(
              "hadith:iman-belief-in-allah:hadeethenc-4563",
              "Hadith of Jibril (Belief in Allah)",
              "muslim",
              "Sahih Muslim",
              "8",
              "Umar ibn al-Khattab",
              "4563",
              "Sahih Muslim 8",
            ),
            scholarlyReference(
              "scholarly:iman-belief-in-allah:uthaymin-creed",
              "Belief in Allah Almighty",
            ),
          ],
        ),
        referenceReadyTopic(
          "iman-belief-in-angels",
          "Belief in the Angels",
          [
            quranReference(
              "quran:iman-belief-in-angels:2-285",
              ["2:285"],
              "2:285",
            ),
            quranReference(
              "quran:iman-belief-in-angels:35-1",
              ["35:1"],
              "35:1",
            ),
            hadithReference(
              "hadith:iman-belief-in-angels:hadeethenc-4563",
              "Hadith of Jibril (Belief in the Angels)",
              "muslim",
              "Sahih Muslim",
              "8",
              "Umar ibn al-Khattab",
              "4563",
              "Sahih Muslim 8",
            ),
            scholarlyReference(
              "scholarly:iman-belief-in-angels:uthaymin-creed",
              "Belief in the Angels",
            ),
          ],
        ),
        referenceReadyTopic(
          "iman-belief-in-revealed-books",
          "Belief in Allah's Revealed Books",
          [
            quranReference(
              "quran:iman-revealed-books:2-285",
              ["2:285"],
              "2:285",
            ),
            quranReference(
              "quran:iman-revealed-books:3-3-4",
              ["3:3", "3:4"],
              "3:3-4",
            ),
            quranReference(
              "quran:iman-revealed-books:5-44-48",
              ["5:44", "5:45", "5:46", "5:47", "5:48"],
              "5:44-48",
            ),
            hadithReference(
              "hadith:iman-revealed-books:hadeethenc-65046",
              "Reference concerning the People of the Book",
              "bukhari",
              "Sahih al-Bukhari",
              "4485",
              "Abu Hurayrah",
              "65046",
              "Sahih al-Bukhari 4485",
            ),
            scholarlyReference(
              "scholarly:iman-revealed-books:uthaymin-creed",
              "Belief in the Revealed Books",
            ),
          ],
        ),
        referenceReadyTopic(
          "iman-belief-in-messengers",
          "Belief in the Messengers",
          [
            quranReference(
              "quran:iman-messengers:2-285",
              ["2:285"],
              "2:285",
            ),
            quranReference(
              "quran:iman-messengers:4-163-165",
              ["4:163", "4:164", "4:165"],
              "4:163-165",
            ),
            quranReference(
              "quran:iman-messengers:21-25",
              ["21:25"],
              "21:25",
            ),
            hadithReference(
              "hadith:iman-messengers:hadeethenc-3272",
              "Belief in the message of Prophet Muhammad",
              "muslim",
              "Sahih Muslim",
              "153",
              "Abu Hurayrah",
              "3272",
              "Sahih Muslim 153",
            ),
            scholarlyReference(
              "scholarly:iman-messengers:uthaymin-creed",
              "Belief in the Messengers",
            ),
          ],
        ),
        referenceReadyTopic(
          "iman-belief-in-last-day",
          "Belief in the Last Day",
          [
            quranReference("quran:iman-last-day:22-7", ["22:7"], "22:7"),
            quranReference(
              "quran:iman-last-day:23-15-16",
              ["23:15", "23:16"],
              "23:15-16",
            ),
            quranReference(
              "quran:iman-last-day:99",
              ["99:1", "99:2", "99:3", "99:4", "99:5", "99:6", "99:7", "99:8"],
              "Surah 99",
            ),
            hadithReference(
              "hadith:iman-last-day:hadeethenc-5460",
              "People will be gathered on the Day of Judgment",
              "muslim",
              "Sahih Muslim",
              "2859",
              "Aishah",
              "5460",
              "Sahih Muslim 2859",
            ),
            scholarlyReference(
              "scholarly:iman-last-day:uthaymin-creed",
              "Belief in the Last Day",
            ),
          ],
        ),
        referenceReadyTopic(
          "iman-belief-in-qadr",
          "Belief in Qadr",
          [
            quranReference("quran:iman-qadr:54-49", ["54:49"], "54:49"),
            quranReference("quran:iman-qadr:57-22", ["57:22"], "57:22"),
            quranReference("quran:iman-qadr:76-30", ["76:30"], "76:30"),
            hadithReference(
              "hadith:iman-qadr:hadeethenc-65038",
              "Allah decreed the destinies of the creatures",
              "muslim",
              "Sahih Muslim",
              "2653",
              "Abdullah ibn Amr ibn al-As",
              "65038",
              "Sahih Muslim 2653",
            ),
            hadithReference(
              "hadith:iman-qadr:hadeethenc-5493",
              "The strong believer is better and dearer to Allah than the weak believer",
              "muslim",
              "Sahih Muslim",
              "2664",
              "Abu Hurayrah",
              "5493",
              "Sahih Muslim 2664",
            ),
            scholarlyReference(
              "scholarly:iman-qadr:uthaymin-creed",
              "Belief in Destiny",
            ),
          ],
        ),
      ],
    },
    {
      id: "ihsan",
      title: "Ihsan — Spiritual Excellence",
      description: "Browse references and topics related to Ihsan.",
      references: [],
      topics: [
        referenceReadyTopic("ihsan-meaning-of-ihsan", "Meaning of Ihsan", [
          hadithReference(
            "hadith:ihsan-meaning:hadeethenc-4563",
            "Hadith of Jibril",
            "muslim",
            "Sahih Muslim",
            "8",
            "Umar ibn al-Khattab",
            "4563",
            "Sahih Muslim 8",
          ),
        ]),
        referenceReadyTopic("ihsan-sincerity", "Sincerity", [
          quranReference(
            "quran:ihsan-sincerity:98-5",
            ["98:5"],
            "98:5",
          ),
          hadithReference(
            "hadith:ihsan-sincerity:hadeethenc-66511",
            "Hadith of Intention",
            "bukhari",
            "Sahih al-Bukhari",
            "1",
            "'Umar ibn al-Khattab",
            "66511",
            "Sahih al-Bukhari 1",
          ),
        ]),
        referenceReadyTopic("ihsan-awareness-of-allah", "Awareness of Allah", [
          quranReference(
            "quran:ihsan-awareness-of-allah:57-4",
            ["57:4"],
            "57:4",
          ),
          hadithReference(
            "hadith:ihsan-awareness-of-allah:hadeethenc-4563",
            "Hadith of Jibril (Awareness of Allah)",
            "muslim",
            "Sahih Muslim",
            "8",
            "Umar ibn al-Khattab",
            "4563",
            "Sahih Muslim 8",
          ),
        ]),
        referenceReadyTopic("ihsan-taqwa", "Taqwa", [
          quranReference(
            "quran:ihsan-taqwa:3-102",
            ["3:102"],
            "3:102",
          ),
          hadithReference(
            "hadith:ihsan-taqwa:hadeethenc-4302",
            "Fear Allah Wherever You Are",
            "tirmidhi",
            "Jami' at-Tirmidhi",
            "1987",
            "Abu Dharr",
            "4302",
            "Jami' at-Tirmidhi 1987",
            "At-Tirmidhi said: Hasan",
          ),
        ]),
      ],
    },
    {
      id: "tawhid",
      title: "Tawhid — The Oneness of Allah",
      description: "Browse references and topics related to Tawhid.",
      references: [],
      topics: [
        referenceReadyTopic(
          "tawhid-worship-of-allah-alone",
          "Worship of Allah Alone",
          [
            quranReference(
              "quran:tawhid-worship:51-56",
              ["51:56"],
              "51:56",
            ),
            quranReference(
              "quran:tawhid-worship:16-36",
              ["16:36"],
              "16:36",
            ),
            hadithReference(
              "hadith:tawhid-worship:hadeethenc-65007",
              "Allah's right upon His servants",
              "bukhari",
              "Sahih al-Bukhari",
              "2856",
              "Mu'adh ibn Jabal",
              "65007",
              "Sahih al-Bukhari 2856",
            ),
            scholarlyReference(
              "scholarly:tawhid-worship:uthaymin-creed",
              "Belief in Allah Almighty — His divinity",
            ),
          ],
        ),
        referenceReadyTopic(
          "tawhid-allahs-lordship",
          "Allah's Lordship",
          [
            quranReference(
              "quran:tawhid-lordship:7-54",
              ["7:54"],
              "7:54",
            ),
            quranReference(
              "quran:tawhid-lordship:39-62",
              ["39:62"],
              "39:62",
            ),
            scholarlyReference(
              "scholarly:tawhid-lordship:uthaymin-creed",
              "Belief in Allah Almighty — His lordship",
            ),
          ],
        ),
        referenceReadyTopic(
          "tawhid-names-and-attributes",
          "Names and Attributes",
          [
            quranReference(
              "quran:tawhid-names:42-11",
              ["42:11"],
              "42:11",
            ),
            quranReference(
              "quran:tawhid-names:7-180",
              ["7:180"],
              "7:180",
            ),
            quranReference(
              "quran:tawhid-names:112",
              ["112:1", "112:2", "112:3", "112:4"],
              "Surah 112",
            ),
            hadithReference(
              "hadith:tawhid-names:hadeethenc-64673",
              "Ninety-nine Names of Allah",
              "bukhari",
              "Sahih al-Bukhari",
              "2736",
              "Abu Hurayrah",
              "64673",
              "Sahih al-Bukhari 2736",
            ),
            scholarlyReference(
              "scholarly:tawhid-names:uthaymin-creed",
              "Belief in Allah Almighty — His names and attributes",
            ),
          ],
        ),
        referenceReadyTopic(
          "tawhid-shirk",
          "Shirk",
          [
            quranReference(
              "quran:tawhid-shirk:4-48",
              ["4:48"],
              "4:48",
            ),
            quranReference(
              "quran:tawhid-shirk:31-13",
              ["31:13"],
              "31:13",
            ),
            hadithReference(
              "hadith:tawhid-shirk:hadeethenc-65007",
              "Allah's right upon His servants",
              "bukhari",
              "Sahih al-Bukhari",
              "2856",
              "Mu'adh ibn Jabal",
              "65007",
              "Sahih al-Bukhari 2856",
            ),
            scholarlyReference(
              "scholarly:tawhid-shirk:uthaymin-creed",
              "Belief in Allah Almighty — His divinity",
            ),
          ],
        ),
      ],
    },
    {
      id: "quran-and-sunnah",
      title: "Qur'an and Sunnah — Primary Sources of Guidance",
      description: "Browse references and topics related to the Qur'an and Sunnah.",
      references: [],
      topics: [
        referenceReadyTopic(
          "quran-and-sunnah-quran",
          "Qur'an",
          [
            quranReference(
              "quran:quran-sunnah-quran:15-9",
              ["15:9"],
              "15:9",
            ),
            quranReference(
              "quran:quran-sunnah-quran:2-2",
              ["2:2"],
              "2:2",
            ),
            hadithReference(
              "hadith:quran-sunnah-quran:hadeethenc-5913",
              "The best of you are those who learn the Qur’an and teach it",
              "bukhari",
              "Sahih al-Bukhari",
              "5027",
              "Uthman ibn Affan",
              "5913",
              "Sahih al-Bukhari 5027",
            ),
            scholarlyReference(
              "scholarly:quran-sunnah-quran:uthaymin-creed",
              "Belief in the Revealed Books",
            ),
          ],
        ),
        referenceReadyTopic(
          "quran-and-sunnah-sunnah",
          "Sunnah",
          [
            quranReference(
              "quran:quran-sunnah-sunnah:33-21",
              ["33:21"],
              "33:21",
            ),
            quranReference(
              "quran:quran-sunnah-sunnah:59-7",
              ["59:7"],
              "59:7",
            ),
            hadithReference(
              "hadith:quran-sunnah-sunnah:hadeethenc-6078",
              "Adherence to the Prophetic Sunnah",
              "muslim",
              "Sahih Muslim",
              "1401",
              "Anas ibn Malik",
              "6078",
              "Sahih Muslim 1401",
            ),
            scholarlyReference(
              "scholarly:quran-sunnah-sunnah:uthaymin-creed",
              "Objectives of the Islamic Creed — following the messengers' example",
            ),
          ],
        ),
        referenceReadyTopic(
          "quran-and-sunnah-hadith",
          "Hadith",
          [
            quranReference(
              "quran:quran-sunnah-hadith:49-6",
              ["49:6"],
              "49:6",
            ),
            hadithReference(
              "hadith:quran-sunnah-hadith:hadeethenc-3686",
              "Convey from me even if one verse",
              "bukhari",
              "Sahih al-Bukhari",
              "3461",
              "Abdullah ibn Amr",
              "3686",
              "Sahih al-Bukhari 3461",
            ),
            scholarlyReference(
              "scholarly:quran-sunnah-hadith:uthaymin-creed",
              "Belief in the Messengers — authentic reports",
            ),
          ],
        ),
        referenceReadyTopic(
          "quran-and-sunnah-relationship-between-quran-and-sunnah",
          "Relationship Between Qur'an and Sunnah",
          [
            quranReference(
              "quran:quran-sunnah-relationship:16-44",
              ["16:44"],
              "16:44",
            ),
            quranReference(
              "quran:quran-sunnah-relationship:4-59",
              ["4:59"],
              "4:59",
            ),
            hadithReference(
              "hadith:quran-sunnah-relationship:hadeethenc-6383",
              "Whoever obeys me has obeyed Allah",
              "bukhari",
              "Sahih al-Bukhari",
              "7137",
              "Abu Hurayrah",
              "6383",
              "Sahih al-Bukhari 7137",
            ),
            scholarlyReference(
              "scholarly:quran-sunnah-relationship:uthaymin-creed",
              "Foundations of the Islamic Creed",
            ),
          ],
        ),
      ],
    },
    {
      id: "akhlaq-and-adab",
      title: "Akhlaq and Adab — Moral Character & Etiquette",
      description: "Browse references and topics related to Akhlaq and Adab.",
      references: [],
      topics: [
        referenceReadyTopic(
          "akhlaq-and-adab-truthfulness",
          "Truthfulness",
          [
            quranReference(
              "quran:akhlaq-and-adab-truthfulness:9-119",
              ["9:119"],
              "9:119",
            ),
            quranReference(
              "quran:akhlaq-and-adab-truthfulness:33-70",
              ["33:70"],
              "33:70",
            ),
            hadithReference(
              "hadith:akhlaq-and-adab-truthfulness:hadeethenc-5504",
              "Adhere to truthfulness, for truthfulness leads to righteousness, and righteousness leads to Paradise",
              "muslim",
              "Sahih Muslim",
              "2607",
              "Abdullah ibn Mas'ud",
              "5504",
              "Sahih Muslim 2607",
            ),
            scholarlyReference(
              "scholarly:akhlaq-and-adab-truthfulness:uthaymin-creed",
              "Introduction — Islam enjoins truthfulness and forbids lying",
            ),
          ],
        ),
        referenceReadyTopic(
          "akhlaq-and-adab-humility",
          "Humility",
          [
            quranReference(
              "quran:akhlaq-and-adab-humility:25-63",
              ["25:63"],
              "25:63",
            ),
            quranReference(
              "quran:akhlaq-and-adab-humility:31-18",
              ["31:18"],
              "31:18",
            ),
            hadithReference(
              "hadith:akhlaq-and-adab-humility:hadeethenc-5497",
              "And verily, Allah revealed to me that you must be humble, so that no one boasts of oneself before another or oppresses another",
              "muslim",
              "Sahih Muslim",
              "2865",
              "Iyad ibn Himar",
              "5497",
              "Sahih Muslim 2865",
            ),
          ],
        ),
        referenceReadyTopic(
          "akhlaq-and-adab-parents-and-family",
          "Parents and Family",
          [
            quranReference(
              "quran:akhlaq-and-adab-parents-and-family:17-23",
              ["17:23"],
              "17:23",
            ),
            quranReference(
              "quran:akhlaq-and-adab-parents-and-family:4-36",
              ["4:36"],
              "4:36",
            ),
            hadithReference(
              "hadith:akhlaq-and-adab-parents-and-family:hadeethenc-4182",
              "O Messenger of Allah, who is the most entitled among people to my good companionship?",
              "muslim",
              "Sahih Muslim",
              "2548",
              "Abu Hurayrah",
              "4182",
              "Sahih Muslim 2548",
            ),
            scholarlyReference(
              "scholarly:akhlaq-and-adab-parents-and-family:uthaymin-creed",
              "Introduction — dutifulness to parents and upholding kinship ties",
            ),
          ],
        ),
        referenceReadyTopic(
          "akhlaq-and-adab-neighbors",
          "Neighbors",
          [
            quranReference(
              "quran:akhlaq-and-adab-neighbors:4-36",
              ["4:36"],
              "4:36",
            ),
            hadithReference(
              "hadith:akhlaq-and-adab-neighbors:hadeethenc-4965",
              "Jibrīl kept enjoining me regarding the good treatment of the neighbor",
              "bukhari",
              "Sahih al-Bukhari",
              "6014",
              "Abdullah ibn Umar",
              "4965",
              "Sahih al-Bukhari 6014",
            ),
            scholarlyReference(
              "scholarly:akhlaq-and-adab-neighbors:uthaymin-creed",
              "Introduction — good neighborliness",
            ),
          ],
        ),
        referenceReadyTopic(
          "akhlaq-and-adab-justice",
          "Justice",
          [
            quranReference(
              "quran:akhlaq-and-adab-justice:4-135",
              ["4:135"],
              "4:135",
            ),
            quranReference(
              "quran:akhlaq-and-adab-justice:5-8",
              ["5:8"],
              "5:8",
            ),
            hadithReference(
              "hadith:akhlaq-and-adab-justice:hadeethenc-4935",
              "Those who act justly will be with Allah on pulpits of light",
              "muslim",
              "Sahih Muslim",
              "1827",
              "Abdullah ibn Amr",
              "4935",
              "Sahih Muslim 1827",
            ),
            scholarlyReference(
              "scholarly:akhlaq-and-adab-justice:uthaymin-creed",
              "Introduction — justice and forbids injustice",
            ),
          ],
        ),
        referenceReadyTopic(
          "akhlaq-and-adab-good-manners",
          "Good Manners",
          [
            quranReference(
              "quran:akhlaq-and-adab-good-manners:68-4",
              ["68:4"],
              "68:4",
            ),
            hadithReference(
              "hadith:akhlaq-and-adab-good-manners:hadeethenc-4308",
              "Righteousness is good morals, and sinfulness is what your heart is not at ease with",
              "muslim",
              "Sahih Muslim",
              "2553",
              "An-Nawwas ibn Sim'an",
              "4308",
              "Sahih Muslim 2553",
            ),
            scholarlyReference(
              "scholarly:akhlaq-and-adab-good-manners:uthaymin-creed",
              "Introduction — every good manner and righteous act",
            ),
          ],
        ),
      ],
    },
    {
      id: "taharah",
      title: "Taharah — Purification & Cleanliness",
      description: "Browse references and topics related to Taharah.",
      references: [],
      topics: [
        referenceReadyTopic(
          "taharah-purification",
          "Purification",
          [
            quranReference(
              "quran:taharah-purification:9-108",
              ["9:108"],
              "9:108",
            ),
            hadithReference(
              "hadith:taharah-purification:hadeethenc-65004",
              "Purity is half of faith, al-hamdulillāh (praise be to Allah) fills the Scale, and subhān Allah wa al-hamdulillāh (glory and praise be to Allah) fills what is between the heavens and the earth",
              "muslim",
              "Sahih Muslim",
              "223",
              "Abu Malik al-Ash'ari",
              "65004",
              "Sahih Muslim 223",
            ),
            whatAMuslimMustKnowScholarlyReference(
              "scholarly:taharah-purification:alharamain-251",
              "Chapter Two: Matters Related to Acts of Worship — The First Topic: Tahārah (purification)",
            ),
          ],
        ),
        referenceReadyTopic(
          "taharah-wudu",
          "Wudu",
          [
            quranReference(
              "quran:taharah-wudu:5-6",
              ["5:6"],
              "5:6",
            ),
            hadithReference(
              "hadith:taharah-wudu:hadeethenc-3313",
              "If anyone performs ablution like this ablution of mine and offers two Rak'ahs during which he does not think of anything else, Allah will forgive his past sins",
              "bukhari",
              "Sahih al-Bukhari",
              "164",
              "Uthman ibn Affan",
              "3313",
              "Sahih al-Bukhari 164",
            ),
            whatAMuslimMustKnowScholarlyReference(
              "scholarly:taharah-wudu:alharamain-251",
              "Chapter Two: Matters Related to Acts of Worship — The First Topic: Tahārah — Sixth: Rulings of wudū’ (ablution)",
            ),
          ],
        ),
        referenceReadyTopic(
          "taharah-ghusl",
          "Ghusl",
          [
            quranReference(
              "quran:taharah-ghusl:4-43",
              ["4:43"],
              "4:43",
            ),
            hadithReference(
              "hadith:taharah-ghusl:hadeethenc-3316",
              "On taking a ritual bath from Janābah (major ritual impurity), the Messenger of Allah (may Allah's peace and blessings be upon him) used to wash his hands and perform ablution like that for prayer, then wash himself",
              "bukhari",
              "Sahih al-Bukhari",
              "272",
              "Aishah",
              "3316",
              "Sahih al-Bukhari 272",
            ),
          ],
        ),
        referenceReadyTopic(
          "taharah-cleanliness-and-prayer",
          "Cleanliness and Prayer",
          [
            quranReference(
              "quran:taharah-cleanliness-and-prayer:5-6",
              ["5:6"],
              "5:6",
            ),
            hadithReference(
              "hadith:taharah-cleanliness-and-prayer:hadeethenc-3534",
              "Allah does not accept the prayer of any of you who is in the state of Hadath (minor ritual impurity) until he performs ablution",
              "bukhari",
              "Sahih al-Bukhari",
              "6954",
              "Abu Hurayrah",
              "3534",
              "Sahih al-Bukhari 6954",
            ),
            whatAMuslimMustKnowScholarlyReference(
              "scholarly:taharah-cleanliness-and-prayer:alharamain-251",
              "Chapter Two: Matters Related to Acts of Worship — The First Topic: Tahārah — Third: Things forbidden for Muhdith (one in the state of ritual impurity)",
            ),
          ],
        ),
      ],
    },
    {
      id: "halal-and-haram",
      title: "Halal and Haram — The Lawful & The Prohibited",
      description: "Browse references and topics related to Halal and Haram.",
      references: [],
      topics: [
        referenceReadyTopic(
          "halal-and-haram-lawful-and-unlawful",
          "The Lawful and Unlawful",
          [
            quranReference(
              "quran:halal-and-haram-lawful-and-unlawful:16-116",
              ["16:116"],
              "16:116",
            ),
            hadithReference(
              "hadith:halal-and-haram-lawful-and-unlawful:hadeethenc-4314",
              "Verily, the lawful is clear, and the unlawful is clear",
              "muslim",
              "Sahih Muslim",
              "1599",
              "An-Nu'man ibn Bashir",
              "4314",
              "Sahih Muslim 1599",
            ),
          ],
        ),
        referenceReadyTopic(
          "halal-and-haram-food",
          "Food",
          [
            quranReference(
              "quran:halal-and-haram-food:5-3",
              ["5:3"],
              "5:3",
            ),
            hadithReference(
              "hadith:halal-and-haram-food:hadeethenc-64643",
              "forbade (eating the flesh of) all carnivorous animals that have fangs and all birds that have talons",
              "muslim",
              "Sahih Muslim",
              "1934",
              "Ibn 'Abbas",
              "64643",
              "Sahih Muslim 1934",
            ),
          ],
        ),
        referenceReadyTopic(
          "halal-and-haram-income",
          "Income",
          [
            quranReference(
              "quran:halal-and-haram-income:2-188",
              ["2:188"],
              "2:188",
            ),
            hadithReference(
              "hadith:halal-and-haram-income:hadeethenc-3785",
              "It is better for one of you to take his rope, go out and gather a bundle of firewood on his back, sell it, and thereby Allah preserves his dignity, than to ask people—whether they give him or withhold from him",
              "bukhari",
              "Sahih al-Bukhari",
              "1471",
              "Az-Zubayr ibn al-'Awwam",
              "3785",
              "Sahih al-Bukhari 1471",
            ),
            whatAMuslimMustKnowScholarlyReference(
              "scholarly:halal-and-haram-income:alharamain-251",
              "Chapter Three: Transactions — rules related to financial transactions, items 4 and 6",
            ),
          ],
        ),
        referenceReadyTopic(
          "halal-and-haram-transactions",
          "Transactions",
          [
            quranReference(
              "quran:halal-and-haram-transactions:2-275",
              ["2:275"],
              "2:275",
            ),
            hadithReference(
              "hadith:halal-and-haram-transactions:hadeethenc-5918",
              "Do not go out to meet the riders (in a trade caravan), do not urge buyers to cancel a sale transaction to make a new one with you, do not bid against each other (to fool another bidder), a townsman must not buy on behalf of a Bedouin, and do not tie up the udders of camels and sheep",
              "muslim",
              "Sahih Muslim",
              "1515",
              "Abu Hurayrah",
              "5918",
              "Sahih Muslim 1515",
            ),
            whatAMuslimMustKnowScholarlyReference(
              "scholarly:halal-and-haram-transactions:alharamain-251",
              "Chapter Three: Transactions",
            ),
          ],
        ),
        referenceReadyTopic(
          "halal-and-haram-relationships-and-conduct",
          "Relationships and Conduct",
          [
            quranReference(
              "quran:halal-and-haram-relationships-and-conduct:17-32",
              ["17:32"],
              "17:32",
            ),
            hadithReference(
              "hadith:halal-and-haram-relationships-and-conduct:hadeethenc-5888",
              "\"Beware of entering upon women.\" A man from the Ansār said: O Messenger of Allah, what about the Hamw (brother-in-law)? He said: \"The Hamw is death\"",
              "bukhari",
              "Sahih al-Bukhari",
              "5232",
              "Uqbah ibn Amir",
              "5888",
              "Sahih al-Bukhari 5232",
            ),
          ],
        ),
      ],
    },
    {
      id: "dua-and-dhikr",
      title: "Du'a and Dhikr — Supplication & Remembrance",
      description: "Browse references and topics related to Du'a and Dhikr.",
      references: [],
      topics: [
        referenceReadyTopic(
          "dua-and-dhikr-dua",
          "Du'a",
          [
            quranReference(
              "quran:dua-and-dhikr-dua:40-60",
              ["40:60"],
              "40:60",
            ),
            hadithReference(
              "hadith:dua-and-dhikr-dua:hadeethenc-5502",
              "Supplication for good in this world and the Hereafter",
              "bukhari",
              "Sahih al-Bukhari",
              "6389",
              "Anas ibn Malik",
              "5502",
              "Sahih al-Bukhari 6389",
            ),
          ],
        ),
        referenceReadyTopic(
          "dua-and-dhikr-dhikr",
          "Dhikr",
          [
            quranReference(
              "quran:dua-and-dhikr-dhikr:33-41",
              ["33:41"],
              "33:41",
            ),
            hadithReference(
              "hadith:dua-and-dhikr-dhikr:hadeethenc-8402",
              "The Prophet used to remember Allah at all times",
              "muslim",
              "Sahih Muslim",
              "373",
              "Aishah",
              "8402",
              "Sahih Muslim 373",
            ),
          ],
        ),
        referenceReadyTopic(
          "dua-and-dhikr-morning-and-evening-remembrance",
          "Morning and Evening Remembrance",
          [
            quranReference(
              "quran:dua-and-dhikr-morning-and-evening-remembrance:33-42",
              ["33:42"],
              "33:42",
            ),
            hadithReference(
              "hadith:dua-and-dhikr-morning-and-evening-remembrance:hadeethenc-5485",
              "O Allah, I ask You for well-being in this world and the Hereafter",
              "abu-dawud",
              "Sunan Abi Dawud",
              "5074",
              "Abdullah ibn Umar",
              "5485",
              "Sunan Abi Dawud 5074",
            ),
          ],
        ),
        referenceReadyTopic(
          "dua-and-dhikr-etiquette-of-supplication",
          "Etiquette of Supplication",
          [
            quranReference(
              "quran:dua-and-dhikr-etiquette-of-supplication:7-55",
              ["7:55"],
              "7:55",
            ),
            hadithReference(
              "hadith:dua-and-dhikr-etiquette-of-supplication:hadeethenc-3232",
              "Supplication is answered as long as one is not hasty",
              "muslim",
              "Sahih Muslim",
              "2735",
              "Abu Hurayrah",
              "3232",
              "Sahih Muslim 2735",
            ),
          ],
        ),
      ],
    },
    {
      id: "akhirah",
      title: "Akhirah — Accountability & The Afterlife",
      description: "Browse references and topics related to the Akhirah.",
      references: [],
      topics: [
        referenceReadyTopic("akhirah-death", "Death", [
          quranReference(
            "quran:akhirah-death:21-35",
            ["21:35"],
            "21:35",
          ),
          hadithReference(
            "hadith:akhirah-death:hadeethenc-66232",
            "Remember the destroyer of pleasures frequently,\" meaning death",
            "tirmidhi",
            "Jami' at-Tirmidhi",
            "2307",
            "Abu Hurayrah",
            "66232",
            "https://hadeethenc.com/en/browse/hadith/66232",
          ),
        ]),
        referenceReadyTopic("akhirah-life-of-the-grave", "Life of the Grave", [
          quranReference(
            "quran:akhirah-life-of-the-grave:14-27",
            ["14:27"],
            "14:27",
          ),
          hadithReference(
            "hadith:akhirah-life-of-the-grave:hadeethenc-4206",
            "When a Muslim is questioned in the grave, he testifies that no deity is worthy of worship except Allah and that Muhammad is the Messenger of Allah",
            "bukhari",
            "Sahih al-Bukhari",
            "4699",
            "Al-Bara' ibn 'Azib",
            "4206",
            "https://hadeethenc.com/en/browse/hadith/4206",
          ),
        ]),
        referenceReadyTopic("akhirah-resurrection", "Resurrection", [
          quranReference(
            "quran:akhirah-resurrection:22-7",
            ["22:7"],
            "22:7",
          ),
          hadithReference(
            "hadith:akhirah-resurrection:hadeethenc-5460",
            "People will be gathered on the Day of Judgment barefooted, naked, and uncircumcised",
            "muslim",
            "Sahih Muslim",
            "2859",
            "'Aishah",
            "5460",
            "https://hadeethenc.com/en/browse/hadith/5460",
          ),
        ]),
        referenceReadyTopic("akhirah-day-of-judgment", "Day of Judgment", [
          quranReference(
            "quran:akhirah-day-of-judgment:82-19",
            ["82:19"],
            "82:19",
          ),
          hadithReference(
            "hadith:akhirah-day-of-judgment:hadeethenc-8345",
            "Allah will gather the people, the first and the last, in one place, where they will hear the caller and they will be sighted clearly...",
            "bukhari",
            "Sahih al-Bukhari",
            "4712",
            "Abu Hurayrah",
            "8345",
            "https://hadeethenc.com/en/browse/hadith/8345",
          ),
        ]),
        referenceReadyTopic("akhirah-accountability", "Accountability", [
          quranReference(
            "quran:akhirah-accountability:99-7-8",
            ["99:7", "99:8"],
            "99:7-8",
          ),
          hadithReference(
            "hadith:akhirah-accountability:hadeethenc-3165",
            "The bankrupt in my Ummah is the one who will come on the Day of Judgment with prayer, fasting and Zakah, but since he hurled abuse at others...",
            "muslim",
            "Sahih Muslim",
            "2581",
            "Abu Hurayrah",
            "3165",
            "https://hadeethenc.com/en/browse/hadith/3165",
          ),
        ]),
        referenceReadyTopic("akhirah-paradise", "Paradise", [
          quranReference(
            "quran:akhirah-paradise:3-133",
            ["3:133"],
            "3:133",
          ),
          hadithReference(
            "hadith:akhirah-paradise:hadeethenc-10404",
            "Allah, the Blessed and Exalted, said: I have prepared for My righteous slaves what no eye has ever seen, no ear has ever heard, and no human heart has ever imagined",
            "bukhari",
            "Sahih al-Bukhari",
            "4779",
            "Abu Hurayrah",
            "10404",
            "https://hadeethenc.com/en/browse/hadith/10404",
          ),
        ]),
        referenceReadyTopic("akhirah-hellfire", "Hellfire", [
          quranReference(
            "quran:akhirah-hellfire:66-6",
            ["66:6"],
            "66:6",
          ),
          hadithReference(
            "hadith:akhirah-hellfire:hadeethenc-3370",
            "This is a stone that was thrown into Hellfire seventy years ago and it was falling into Hellfire until it reached its bottom",
            "muslim",
            "Sahih Muslim",
            "2844",
            "Abu Hurayrah",
            "3370",
            "https://hadeethenc.com/en/browse/hadith/3370",
          ),
        ]),
      ],
    },
  ],
};

const productionValidation = validateIslamicReferenceLibrary(
  RAW_ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY,
);

if (!productionValidation.valid || !productionValidation.library) {
  throw new Error(
    `Invalid Islamic Foundations reference library: ${productionValidation.issues.join("; ")}`,
  );
}

export const ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY =
  productionValidation.library;
