import {
  ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY,
} from "./islamic-reference-library.ts";
import {
  resolveIslamicReferenceHadith,
  getIslamicReferenceHadithTarget,
} from "./islamic-reference-hadith-bridge.mjs";

/**
 * Computes readiness state for a collection from its topics.
 * @param {Array<{ status: string }>} topics
 * @returns {"fully-ready" | "partially-ready" | "planned"}
 */
export function computeCollectionReadiness(topics) {
  if (!topics || topics.length === 0) return "planned";
  const readyCount = topics.filter((t) => t.status === "reference-ready").length;
  if (readyCount === topics.length) return "fully-ready";
  if (readyCount > 0) return "partially-ready";
  return "planned";
}

/**
 * Computes a human-readable readiness label for a collection.
 * @param {number} readyCount
 * @param {number} totalCount
 * @returns {string}
 */
export function formatCollectionReadinessLabel(readyCount, totalCount) {
  if (totalCount === 0) return "0 topics";
  if (readyCount === totalCount) return `${readyCount} of ${totalCount} topics source-ready`;
  if (readyCount > 0) {
    const plannedCount = totalCount - readyCount;
    return `${readyCount} source-ready · ${plannedCount} planned`;
  }
  return `${totalCount} topics planned`;
}

/**
 * Groups references by type.
 * @param {Array<any>} references
 * @returns {{ quran: Array<any>, hadith: Array<any>, scholarly: Array<any> }}
 */
export function groupReferencesByType(references) {
  const result = { quran: [], hadith: [], scholarly: [] };
  if (!Array.isArray(references)) return result;
  for (const ref of references) {
    if (ref.type === "quran") result.quran.push(ref);
    else if (ref.type === "hadith") result.hadith.push(ref);
    else if (ref.type === "scholarly") result.scholarly.push(ref);
  }
  return result;
}

/**
 * Returns all collections with derived UI metadata.
 * @param {any} [library]
 * @returns {Array<any>}
 */
export function listCollectionsForUi(library = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY) {
  return library.collections.map((col) => {
    const totalTopics = col.topics.length;
    const readyTopics = col.topics.filter((t) => t.status === "reference-ready").length;
    const plannedTopics = totalTopics - readyTopics;
    const readiness = computeCollectionReadiness(col.topics);
    const readinessLabel = formatCollectionReadinessLabel(readyTopics, totalTopics);
    const topicReferencesCount = col.topics.reduce((acc, t) => acc + t.references.length, 0);
    const totalReferencesCount = col.references.length + topicReferencesCount;

    return {
      id: col.id,
      title: col.title,
      description: col.description,
      topicsCount: totalTopics,
      readyTopicsCount: readyTopics,
      plannedTopicsCount: plannedTopics,
      readinessState: readiness,
      readinessLabel,
      overviewReferencesCount: col.references.length,
      totalReferencesCount,
    };
  });
}

/**
 * Returns detailed collection metadata for UI.
 * @param {string} collectionId
 * @param {any} [library]
 * @returns {any | null}
 */
export function getCollectionForUi(collectionId, library = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY) {
  const col = library.collections.find((c) => c.id === collectionId);
  if (!col) return null;

  const totalTopics = col.topics.length;
  const readyTopics = col.topics.filter((t) => t.status === "reference-ready").length;
  const plannedTopics = totalTopics - readyTopics;
  const readiness = computeCollectionReadiness(col.topics);
  const readinessLabel = formatCollectionReadinessLabel(readyTopics, totalTopics);

  return {
    id: col.id,
    title: col.title,
    description: col.description,
    topicsCount: totalTopics,
    readyTopicsCount: readyTopics,
    plannedTopicsCount: plannedTopics,
    readinessState: readiness,
    readinessLabel,
    overviewReferences: col.references,
    groupedOverviewReferences: groupReferencesByType(col.references),
    topics: col.topics.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      referencesCount: t.references.length,
    })),
  };
}

/**
 * Returns detailed topic metadata for UI.
 * @param {string} collectionId
 * @param {string} topicId
 * @param {any} [library]
 * @returns {any | null}
 */
export function getTopicForUi(collectionId, topicId, library = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY) {
  const col = library.collections.find((c) => c.id === collectionId);
  if (!col) return null;
  const topic = col.topics.find((t) => t.id === topicId);
  if (!topic) return null;

  return {
    id: topic.id,
    collectionId: col.id,
    collectionTitle: col.title,
    title: topic.title,
    description: topic.description,
    status: topic.status,
    references: topic.references,
    groupedReferences: groupReferencesByType(topic.references),
    referencesCount: topic.references.length,
  };
}

/**
 * Pure local search over collection and topic metadata.
 * @param {string} query
 * @param {any} [library]
 * @returns {{ matchedCollections: Array<any>, matchedTopics: Array<any> }}
 */
export function searchFoundationsLibrary(query, library = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY) {
  const clean = query.trim().toLocaleLowerCase();
  if (!clean) {
    return { matchedCollections: [], matchedTopics: [] };
  }

  const matchedCollections = [];
  const matchedTopics = [];

  for (const col of library.collections) {
    const colMatches =
      col.title.toLocaleLowerCase().includes(clean) ||
      col.description.toLocaleLowerCase().includes(clean);

    if (colMatches) {
      const totalTopics = col.topics.length;
      const readyTopics = col.topics.filter((t) => t.status === "reference-ready").length;
      matchedCollections.push({
        id: col.id,
        title: col.title,
        description: col.description,
        readinessState: computeCollectionReadiness(col.topics),
        readinessLabel: formatCollectionReadinessLabel(readyTopics, totalTopics),
      });
    }

    for (const topic of col.topics) {
      const topicMatches =
        topic.title.toLocaleLowerCase().includes(clean) ||
        topic.description.toLocaleLowerCase().includes(clean) ||
        topic.references.some((ref) => {
          if (ref.type === "hadith") {
            return (
              (ref.collection ?? "").toLocaleLowerCase().includes(clean) ||
              (ref.locator ?? "").toLocaleLowerCase().includes(clean) ||
              (ref.sourceRecordId ?? "").toLocaleLowerCase().includes(clean)
            );
          }
          if (ref.type === "quran") {
            return (
              (ref.locator ?? "").toLocaleLowerCase().includes(clean) ||
              (ref.verseKeys ?? []).some((k) => k.includes(clean))
            );
          }
          if (ref.type === "scholarly") {
            return (
              (ref.title ?? "").toLocaleLowerCase().includes(clean) ||
              (ref.author ?? "").toLocaleLowerCase().includes(clean) ||
              (ref.locator ?? "").toLocaleLowerCase().includes(clean)
            );
          }
          return false;
        });

      if (topicMatches) {
        matchedTopics.push({
          id: topic.id,
          collectionId: col.id,
          collectionTitle: col.title,
          title: topic.title,
          description: topic.description,
          status: topic.status,
          referencesCount: topic.references.length,
        });
      }
    }
  }

  return { matchedCollections, matchedTopics };
}

export { resolveIslamicReferenceHadith, getIslamicReferenceHadithTarget };
