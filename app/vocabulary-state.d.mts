import type { ReviewGrade } from "./review-schedule.mjs";

export type VocabularyStatus = "not-started" | "learning" | "due" | "strong";
export interface VocabularyReviewEntry { entryId: string; firstStudied: string; lastStudied: string; dueAt: string; grade: ReviewGrade; intervalDays: number; reviewCount: number; lapses: number; }
export interface VocabularyReviewHistory { entryId: string; grade: ReviewGrade; reviewedAt: string; dueAt: string; intervalDays: number; }
export interface VocabularyProgress { schemaVersion: 1; curriculumId: string; sourceRevision: string | null; entries: VocabularyReviewEntry[]; history: VocabularyReviewHistory[]; activityDates: string[]; dailyNewGoal: number; }
export interface VocabularyCurriculumIdentity { id: string; sourceRevision: string; }
export const VOCABULARY_PROGRESS_SCHEMA_VERSION: 1;
export const DEFAULT_VOCABULARY_PROGRESS: Readonly<VocabularyProgress>;
export function normalizeVocabularyProgress(value: unknown): VocabularyProgress;
export function vocabularyEntryStatus(progress: VocabularyProgress, entryId: string, date?: Date | string): VocabularyStatus;
export function recordVocabularyReview(progress: VocabularyProgress, curriculum: VocabularyCurriculumIdentity, entryId: string, grade: ReviewGrade, date?: Date | string): VocabularyProgress;
export function dueVocabularyEntries(progress: VocabularyProgress, date?: Date | string): VocabularyReviewEntry[];
export function vocabularyCurriculumProgress(progress: VocabularyProgress, curriculumEntryIds: string[], date?: Date | string): { total: number; studied: number; due: number; strong: number; remaining: number };
export function nextNewVocabularyIds(progress: VocabularyProgress, curriculumEntryIds: string[], limit: number): string[];
