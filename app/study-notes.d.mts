export type AyahStudyAnchor = { type: "ayah"; verseKey: string; page: number };
export type WordStudyAnchor = { type: "word"; verseKey: string; wordPosition: number; page: number; line: number; sourceWordId: number };
export type LessonStudyAnchor = { type: "lesson"; sourceId: string; sourceRevision: string; courseId: string; moduleId: string; lessonId: string; sectionId: string | null };
export type StudyAnchor = AyahStudyAnchor | WordStudyAnchor | LessonStudyAnchor;

export interface StudyNote {
  id: string;
  anchor: StudyAnchor;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  schemaVersion: 2;
}

export interface StudyNotesState { schemaVersion: 2; notes: StudyNote[] }

export const STUDY_NOTE_SCHEMA_VERSION: 2;
export const MAX_STUDY_NOTES: 250;
export const MAX_NOTE_BODY_CODE_POINTS: 4000;
export const MAX_TAGS_PER_NOTE: 12;
export const MAX_TAG_CODE_POINTS: 40;
export const DEFAULT_STUDY_NOTES: Readonly<StudyNotesState>;

export function isValidStudyNoteInstant(value: unknown): value is string;
export function normalizeStudyTag(value: unknown): { visible: string; key: string } | null;
export function normalizeStudyTags(value: unknown): string[];
export function normalizeStudyAnchor(value: unknown): StudyAnchor | null;
export function studyAnchorKey(anchor: unknown): string | null;
export function freezeStudyAnchor(value: unknown): StudyAnchor | null;
export function revalidateStudyAnchor(value: unknown, resolvers: { resolveVerse?(verseKey: string): Promise<unknown>; resolveWord?(anchor: WordStudyAnchor): Promise<unknown>; resolveLesson?(anchor: LessonStudyAnchor): Promise<unknown> }): Promise<StudyAnchor | null>;
export function studyTagFilterAfterRename(currentTag: unknown, fromTag: unknown, toTag: unknown): string;
export function focusFirstConnectedStudyTarget(targets: unknown): boolean;
export function createSecureStudyNoteUuid(cryptoProvider?: { randomUUID?: () => string; getRandomValues?: <T extends ArrayBufferView | null>(array: T) => T }): string;
export function normalizeStudyNotes(value: unknown): StudyNotesState;
export function createStudyNote(state: unknown, input: { anchor: unknown; body: unknown; tags?: unknown }, options?: { now?: string; uuid?: string; crypto?: { randomUUID?: () => string; getRandomValues?: <T extends ArrayBufferView | null>(array: T) => T } }): { state: StudyNotesState; note: StudyNote };
export function updateStudyNote(state: unknown, id: string, changes: { body: unknown; tags?: unknown }, updatedAt?: string): StudyNotesState;
export function deleteStudyNote(state: unknown, id: string): StudyNotesState;
export function renameStudyTag(state: unknown, fromTag: unknown, toTag: unknown): StudyNotesState;
export function removeStudyTag(state: unknown, tag: unknown): StudyNotesState;
export function buildStudyNoteIndex(state: unknown): { notes: StudyNote[]; byAnchor: Map<string, StudyNote[]>; byTag: Map<string, StudyNote[]> };
export function searchStudyNotes(state: unknown, query: unknown, anchorType?: "all" | "ayah" | "word" | "lesson", tag?: unknown): StudyNote[];
