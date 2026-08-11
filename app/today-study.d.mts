import type { HifzProgress } from "./hifz-state.mjs";
import type { VocabularyProgress } from "./vocabulary-state.mjs";
export type TodayStudyStepKind = "hifz-review" | "vocabulary-review" | "vocabulary-new" | "reading";
export type TodayStudyTarget = { verseKey: string; page: number } | { entryId: string } | { page: number; verseKey: string; pages: number };
export interface TodayStudyStep { id: string; kind: TodayStudyStepKind; title: string; estimatedMinutes: number; targets: TodayStudyTarget[]; }
export interface TodayStudyPlan { dateKey: string; sessionMinutes: 5 | 10 | 20; steps: TodayStudyStep[]; totalEstimatedMinutes: number; }
export interface TodayStudySession { id: string; dateKey: string; sessionMinutes: 5 | 10 | 20; steps: TodayStudyStep[]; currentStepIndex: number; startedStepIds: string[]; completedStepIds: string[]; skippedStepIds: string[]; startedAt: string; }
export interface TodayStudyProgress { schemaVersion: 1; activityDates: string[]; activeSession: TodayStudySession | null; completions: Array<{ dateKey: string; stepId: string; kind: TodayStudyStepKind; units: number }>; }
export const TODAY_STUDY_SCHEMA_VERSION: 1;
export const DEFAULT_TODAY_STUDY_PROGRESS: Readonly<TodayStudyProgress>;
export function buildTodayStudyPlan(input: { hifzProgress: HifzProgress; vocabularyProgress: VocabularyProgress; curriculumEntryIds?: string[]; reading: { page: number; verseKey: string }; sessionMinutes?: 5 | 10 | 20; date?: Date | string }): TodayStudyPlan;
export function normalizeTodayStudyProgress(value: unknown): TodayStudyProgress;
export function startOrResumeTodayStudy(progress: TodayStudyProgress, plan: TodayStudyPlan, startedAt?: string): TodayStudyProgress;
export function startTodayStudyStep(progress: TodayStudyProgress, stepId: string, date?: Date | string): TodayStudyProgress;
export function completeTodayStudyStep(progress: TodayStudyProgress, stepId: string, date?: Date | string): TodayStudyProgress;
export function skipTodayStudyStep(progress: TodayStudyProgress, stepId: string, date?: Date | string): TodayStudyProgress;
export function currentTodayStudyStep(progress: TodayStudyProgress, date?: Date | string): TodayStudyStep | null;
export function todayStudyCompletion(progress: TodayStudyProgress, plan: TodayStudyPlan, date?: Date | string): { completedSteps: number; totalSteps: number; percent: number };
