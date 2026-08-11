import {
  WORD_STUDY_PROVIDER_REGISTRY,
  coordinatesMatch,
  type WordCoordinate,
  type WordStudyProviderRegistry,
  validateWordCoordinate,
} from "./word-study.ts";

export const VOCABULARY_CURRICULUM_SCHEMA_VERSION = 1;
export const FOUNDATION_125_ID = "foundation-125";

export type VocabularyCurriculumLevel = "foundation-125" | "core-250" | "expanded-500";
export type VocabularyCurriculumApprovalStatus = "approved" | "review-required" | "blocked";

export interface VocabularyCurriculumEntry {
  entryId: string;
  wordId: string;
  rank: number;
  coordinate: WordCoordinate;
}

export interface VocabularyCurriculum {
  schemaVersion: number;
  id: string;
  level: VocabularyCurriculumLevel;
  title: string;
  sourceId: string;
  sourceRevision: string;
  approvalStatus: VocabularyCurriculumApprovalStatus;
  approvalReference: string | null;
  expectedEntryCount: number;
  enabled: boolean;
  entries: VocabularyCurriculumEntry[];
}

export type VocabularyCurriculumDescriptor = Omit<VocabularyCurriculum, "entries">;

export interface VocabularyCurriculumProvider {
  descriptor(): VocabularyCurriculumDescriptor;
  load(): Promise<VocabularyCurriculum>;
}

export type VocabularyCurriculumLoadResult =
  | { status: "ready"; curriculum: VocabularyCurriculum; issues: [] }
  | { status: "unavailable" | "invalid"; curriculum: null; issues: string[] };

const SAFE_ID = /^[a-z0-9][a-z0-9._:@/-]{1,127}$/i;
const LEVELS = new Set<VocabularyCurriculumLevel>(["foundation-125", "core-250", "expanded-500"]);
const APPROVAL_STATUSES = new Set<VocabularyCurriculumApprovalStatus>(["approved", "review-required", "blocked"]);

function safeText(value: unknown, maxLength = 256): value is string {
  return typeof value === "string" && value.trim() === value && value.length > 0 && value.length <= maxLength && !/[<>\u0000-\u001f]/u.test(value);
}

function safeObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function descriptorIssues(value: unknown) {
  const descriptor = safeObject(value);
  if (!descriptor) return ["curriculum descriptor is malformed"];
  const issues: string[] = [];
  if (descriptor.schemaVersion !== VOCABULARY_CURRICULUM_SCHEMA_VERSION) issues.push("unsupported curriculum schema version");
  if (typeof descriptor.id !== "string" || !SAFE_ID.test(descriptor.id)) issues.push("curriculum id is malformed");
  if (!LEVELS.has(descriptor.level as VocabularyCurriculumLevel)) issues.push("curriculum level is invalid");
  if (!safeText(descriptor.title, 160)) issues.push("curriculum title is malformed");
  if (typeof descriptor.sourceId !== "string" || !SAFE_ID.test(descriptor.sourceId)) issues.push("curriculum source ID is malformed");
  if (!safeText(descriptor.sourceRevision, 160)) issues.push("curriculum source revision is malformed");
  if (!APPROVAL_STATUSES.has(descriptor.approvalStatus as VocabularyCurriculumApprovalStatus)) issues.push("curriculum approval status is invalid");
  if (descriptor.approvalReference !== null && !safeText(descriptor.approvalReference, 300)) issues.push("curriculum approval reference is malformed");
  if (!Number.isInteger(descriptor.expectedEntryCount) || Number(descriptor.expectedEntryCount) < 1 || Number(descriptor.expectedEntryCount) > 500) issues.push("curriculum expected entry count is invalid");
  if (descriptor.level === "foundation-125" && descriptor.expectedEntryCount !== 125) issues.push("Foundation 125 must declare exactly 125 entries");
  if (typeof descriptor.enabled !== "boolean") issues.push("curriculum enabled state must be explicit");
  if (descriptor.enabled && descriptor.approvalStatus !== "approved") issues.push("enabled curricula require approved status");
  if (descriptor.enabled && !safeText(descriptor.approvalReference, 300)) issues.push("enabled curricula require an approval reference");
  return issues;
}

function descriptorMatches(descriptor: VocabularyCurriculumDescriptor, curriculum: VocabularyCurriculum) {
  return ([
    "schemaVersion",
    "id",
    "level",
    "title",
    "sourceId",
    "sourceRevision",
    "approvalStatus",
    "approvalReference",
    "expectedEntryCount",
    "enabled",
  ] as const).every((field) => descriptor[field] === curriculum[field]);
}

export function auditVocabularyCurriculum(value: unknown, sourceRevision: string) {
  const curriculum = safeObject(value);
  const issues = descriptorIssues(curriculum);
  if (!curriculum) return { valid: false, issues };
  const entries = Array.isArray(curriculum.entries) ? curriculum.entries : [];
  if (!Array.isArray(curriculum.entries)) issues.push("curriculum entries are malformed");
  if (entries.length !== curriculum.expectedEntryCount) issues.push("curriculum entry count does not match its declared count");
  if (curriculum.sourceRevision !== sourceRevision) issues.push("curriculum source revision does not match the verified word-study provider");
  const entryIds = new Set<string>();
  const wordIds = new Set<string>();
  const ranks = new Set<number>();
  entries.slice(0, 500).forEach((value, index) => {
    const entry = safeObject(value);
    if (!entry) {
      issues.push(`entries.${index} is malformed`);
      return;
    }
    if (typeof entry.entryId !== "string" || !SAFE_ID.test(entry.entryId)) issues.push(`entries.${index}.entryId is malformed`);
    if (typeof entry.wordId !== "string" || !SAFE_ID.test(entry.wordId)) issues.push(`entries.${index}.wordId is malformed`);
    if (typeof entry.entryId === "string" && entryIds.has(entry.entryId)) issues.push(`entries.${index}.entryId is duplicated`);
    if (typeof entry.wordId === "string" && wordIds.has(entry.wordId)) issues.push(`entries.${index}.wordId is duplicated`);
    if (!Number.isInteger(entry.rank) || Number(entry.rank) < 1 || Number(entry.rank) > Number(curriculum.expectedEntryCount)) issues.push(`entries.${index}.rank is invalid`);
    if (typeof entry.rank === "number" && ranks.has(entry.rank)) issues.push(`entries.${index}.rank is duplicated`);
    const coordinateIssues = validateWordCoordinate(entry.coordinate);
    coordinateIssues.forEach((issue) => issues.push(`entries.${index}.coordinate: ${issue}`));
    if (!coordinateIssues.length && safeObject(entry.coordinate)?.sourceWordId === undefined) issues.push(`entries.${index}.coordinate.sourceWordId is required`);
    if (typeof entry.entryId === "string") entryIds.add(entry.entryId);
    if (typeof entry.wordId === "string") wordIds.add(entry.wordId);
    if (typeof entry.rank === "number") ranks.add(entry.rank);
  });
  if (entries.length > 500) issues.push("curriculum exceeds the entry audit bound");
  const expectedEntryCount = Number(curriculum.expectedEntryCount);
  if (Number.isInteger(expectedEntryCount) && ranks.size === expectedEntryCount && Array.from({ length: expectedEntryCount }, (_, index) => index + 1).some((rank) => !ranks.has(rank))) issues.push("curriculum ranks must be contiguous");
  return { valid: issues.length === 0, issues };
}

export class VocabularyCurriculumRegistry {
  readonly #providers = new Map<string, VocabularyCurriculumProvider>();

  register(provider: VocabularyCurriculumProvider) {
    const descriptor = provider.descriptor();
    const issues = descriptorIssues(descriptor);
    if (issues.length) throw new Error(`Vocabulary curriculum descriptor is invalid: ${issues.join("; ")}`);
    if (this.#providers.has(descriptor.id)) throw new Error(`Vocabulary curriculum ${descriptor.id} is already registered.`);
    this.#providers.set(descriptor.id, provider);
  }

  list() {
    return [...this.#providers.values()].map((provider) => provider.descriptor());
  }

  async load(curriculumId: string, wordStudyRegistry: WordStudyProviderRegistry = WORD_STUDY_PROVIDER_REGISTRY): Promise<VocabularyCurriculumLoadResult> {
    const provider = this.#providers.get(curriculumId);
    if (!provider) return { status: "unavailable", curriculum: null, issues: ["Curriculum is not registered."] };
    let descriptor: VocabularyCurriculumDescriptor;
    try {
      descriptor = provider.descriptor();
    } catch {
      return { status: "invalid", curriculum: null, issues: ["Curriculum descriptor could not be read."] };
    }
    const staticIssues = descriptorIssues(descriptor);
    if (staticIssues.length) return { status: "invalid", curriculum: null, issues: staticIssues };
    if (!descriptor.enabled || descriptor.approvalStatus !== "approved" || !descriptor.approvalReference?.trim()) return { status: "unavailable", curriculum: null, issues: ["Curriculum is disabled pending source and editorial approval."] };

    const activation = await wordStudyRegistry.activate(descriptor.sourceId);
    if (activation.status !== "active") return { status: "unavailable", curriculum: null, issues: [`The curriculum word-study source is unavailable: ${activation.reason}`] };
    try {
      const curriculum = await provider.load();
      if (!descriptorMatches(descriptor, curriculum)) return { status: "invalid", curriculum: null, issues: ["Loaded curriculum identity does not match its approved descriptor."] };
      const audit = auditVocabularyCurriculum(curriculum, activation.activation.metadata.revision);
      if (!audit.valid) return { status: "invalid", curriculum: null, issues: audit.issues };
      const mappings = await Promise.all(curriculum.entries.map(async (entry, index) => {
        const record = await wordStudyRegistry.getWord(descriptor.sourceId, entry.coordinate);
        return record && record.id === entry.wordId && coordinatesMatch(entry.coordinate, record.coordinate, true)
          ? null
          : `entries.${index} is not mapped to the verified provider word record`;
      }));
      const mappingIssues = mappings.filter((issue): issue is string => issue !== null);
      return mappingIssues.length ? { status: "invalid", curriculum: null, issues: mappingIssues } : { status: "ready", curriculum, issues: [] };
    } catch {
      return { status: "invalid", curriculum: null, issues: ["Curriculum loading failed closed."] };
    }
  }
}

const FOUNDATION_125_DESCRIPTOR: VocabularyCurriculumDescriptor = Object.freeze({
  schemaVersion: VOCABULARY_CURRICULUM_SCHEMA_VERSION,
  id: FOUNDATION_125_ID,
  level: "foundation-125",
  title: "Foundation 125",
  sourceId: "qac:morphology:0.4",
  sourceRevision: "reference-only-unapproved",
  approvalStatus: "blocked",
  approvalReference: null,
  expectedEntryCount: 125,
  enabled: false,
});

class DisabledFoundation125Provider implements VocabularyCurriculumProvider {
  descriptor() { return FOUNDATION_125_DESCRIPTOR; }
  async load(): Promise<VocabularyCurriculum> { return { ...FOUNDATION_125_DESCRIPTOR, entries: [] }; }
}

export const VOCABULARY_CURRICULUM_REGISTRY = new VocabularyCurriculumRegistry();
VOCABULARY_CURRICULUM_REGISTRY.register(new DisabledFoundation125Provider());
