import type {
  IslamicFoundationsReferenceLibrary,
  IslamicReferenceCollection,
  IslamicReferenceTopic,
  IslamicReferenceEntry,
  IslamicReferenceReadinessStatus,
} from "./islamic-reference-library.ts";
import type {
  IslamicReferenceHadithResolution,
} from "./islamic-reference-hadith-bridge.d.mts";

export type CollectionReadinessState = "fully-ready" | "partially-ready" | "planned";

export interface UiCollectionSummary {
  id: string;
  title: string;
  description: string;
  topicsCount: number;
  readyTopicsCount: number;
  plannedTopicsCount: number;
  readinessState: CollectionReadinessState;
  readinessLabel: string;
  overviewReferencesCount: number;
  totalReferencesCount: number;
}

export interface UiTopicSummary {
  id: string;
  title: string;
  description: string;
  status: IslamicReferenceReadinessStatus;
  referencesCount: number;
}

export interface UiCollectionDetail {
  id: string;
  title: string;
  description: string;
  topicsCount: number;
  readyTopicsCount: number;
  plannedTopicsCount: number;
  readinessState: CollectionReadinessState;
  readinessLabel: string;
  overviewReferences: readonly IslamicReferenceEntry[];
  groupedOverviewReferences: {
    quran: IslamicReferenceEntry[];
    hadith: IslamicReferenceEntry[];
    scholarly: IslamicReferenceEntry[];
  };
  topics: UiTopicSummary[];
}

export interface UiTopicDetail {
  id: string;
  collectionId: string;
  collectionTitle: string;
  title: string;
  description: string;
  status: IslamicReferenceReadinessStatus;
  references: readonly IslamicReferenceEntry[];
  groupedReferences: {
    quran: IslamicReferenceEntry[];
    hadith: IslamicReferenceEntry[];
    scholarly: IslamicReferenceEntry[];
  };
  referencesCount: number;
}

export interface UiSearchResult {
  matchedCollections: Array<{
    id: string;
    title: string;
    description: string;
    readinessState: CollectionReadinessState;
    readinessLabel: string;
  }>;
  matchedTopics: Array<{
    id: string;
    collectionId: string;
    collectionTitle: string;
    title: string;
    description: string;
    status: IslamicReferenceReadinessStatus;
    referencesCount: number;
  }>;
}

export function computeCollectionReadiness(
  topics: ReadonlyArray<{ status: IslamicReferenceReadinessStatus }>
): CollectionReadinessState;

export function formatCollectionReadinessLabel(
  readyCount: number,
  totalCount: number
): string;

export function groupReferencesByType(
  references: ReadonlyArray<IslamicReferenceEntry>
): {
  quran: IslamicReferenceEntry[];
  hadith: IslamicReferenceEntry[];
  scholarly: IslamicReferenceEntry[];
};

export function listCollectionsForUi(
  library?: IslamicFoundationsReferenceLibrary
): UiCollectionSummary[];

export function getCollectionForUi(
  collectionId: string,
  library?: IslamicFoundationsReferenceLibrary
): UiCollectionDetail | null;

export function getTopicForUi(
  collectionId: string,
  topicId: string,
  library?: IslamicFoundationsReferenceLibrary
): UiTopicDetail | null;

export function searchFoundationsLibrary(
  query: string,
  library?: IslamicFoundationsReferenceLibrary
): UiSearchResult;

export function resolveIslamicReferenceHadith(
  reference: unknown
): IslamicReferenceHadithResolution;

export function getIslamicReferenceHadithTarget(
  reference: unknown
): string | null;
