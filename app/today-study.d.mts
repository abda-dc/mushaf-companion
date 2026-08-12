import type { HifzProgress } from "./hifz-state.mjs";
import type { VocabularyProgress } from "./vocabulary-state.mjs";
import type { EducationCatalog } from "./education-content.ts";
import type { EducationProgress } from "./education-state.mjs";
export type TodayStudyStepKind = "hifz-review" | "education-review" | "vocabulary-review" | "education-lesson" | "vocabulary-new" | "reading";
export type TodayStudyTarget =
  | { verseKey: string; page: number }
  | { entryId: string }
  | { page: number; verseKey: string; pages: number }
  | { sourceId: string; sourceRevision: string; courseId: string; moduleId: string; lessonId: string; checkId: string }
  | { sourceId: string; sourceRevision: string; courseId: string; moduleId: string; lessonId: string; estimatedMinutes: number };
export interface TodayStudyStep { id: string; kind: TodayStudyStepKind; title: string; estimatedMinutes: number; targets: TodayStudyTarget[]; }
export interface TodayStudyPlan { dateKey: string; sessionMinutes: 5 | 10 | 20; steps: TodayStudyStep[]; totalEstimatedMinutes: number; }
export interface TodayStudySession { id: string; dateKey: string; sessionMinutes: 5 | 10 | 20; steps: TodayStudyStep[]; currentStepIndex: number; startedStepIds: string[]; completedStepIds: string[]; skippedStepIds: string[]; startedAt: string; }
export interface TodayStudyProgress { schemaVersion: 2; activityDates: string[]; activeSession: TodayStudySession | null; completions: Array<{ dateKey: string; stepId: string; kind: TodayStudyStepKind; units: number }>; }
export const TODAY_STUDY_SCHEMA_VERSION: 2;
export const DEFAULT_TODAY_STUDY_PROGRESS: Readonly<TodayStudyProgress>;
export function buildTodayStudyPlan(input: { hifzProgress: HifzProgress; vocabularyProgress: VocabularyProgress; educationProgress?: EducationProgress; educationCatalog?: EducationCatalog | null; curriculumEntryIds?: string[]; reading: { page: number; verseKey: string }; sessionMinutes?: 5 | 10 | 20; date?: Date | string }): TodayStudyPlan;
export function remainingEducationReviewTargets(step: TodayStudyStep | null | undefined, progress: unknown, date?: Date | string): Array<Extract<TodayStudyTarget, { checkId: string }>>;
export function educationReviewStepComplete(step: TodayStudyStep | null | undefined, progress: unknown, date?: Date | string): boolean;
export function normalizeTodayStudyProgress(value: unknown): TodayStudyProgress;
export function startOrResumeTodayStudy(progress: TodayStudyProgress, plan: TodayStudyPlan, startedAt?: string): TodayStudyProgress;
export function startTodayStudyStep(progress: TodayStudyProgress, stepId: string, date?: Date | string): TodayStudyProgress;
export function completeTodayStudyStep(progress: TodayStudyProgress, stepId: string, date?: Date | string): TodayStudyProgress;
export function skipTodayStudyStep(progress: TodayStudyProgress, stepId: string, date?: Date | string): TodayStudyProgress;
export function currentTodayStudyStep(progress: TodayStudyProgress, date?: Date | string): TodayStudyStep | null;
export function todayStudyCompletion(progress: TodayStudyProgress, plan: TodayStudyPlan, date?: Date | string): { completedSteps: number; totalSteps: number; percent: number };
