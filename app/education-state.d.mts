import type { ReviewGrade } from "./review-schedule.mjs";
import type { EducationCatalog } from "./education-content.ts";

export interface EducationSourceIdentity { sourceId: string; sourceRevision: string }
export interface EducationLessonTarget { courseId: string; moduleId: string; lessonId: string; sectionId?: string | null }
export interface EducationKnowledgeCheckTarget extends EducationLessonTarget { checkId: string }
export interface EducationLessonProgress { courseId: string; moduleId: string; lessonId: string; status: "in-progress" | "completed"; startedAt: string; completedAt: string | null }
export interface EducationKnowledgeCheckProgress { checkId: string; lessonId: string; firstStudied: string; lastStudied: string; dueAt: string; grade: ReviewGrade; intervalDays: number; reviewCount: number; lapses: number }
export interface EducationProgress { schemaVersion: 1; sourceId: string | null; sourceRevision: string | null; activeCourseId: string | null; currentLesson: EducationLessonTarget | null; lessons: EducationLessonProgress[]; knowledgeChecks: EducationKnowledgeCheckProgress[]; reviewHistory: Array<{ checkId: string; lessonId: string; grade: ReviewGrade; reviewedAt: string; dueAt: string; intervalDays: number }>; activityDates: string[] }
export const EDUCATION_PROGRESS_SCHEMA_VERSION: 1;
export const MAX_EDUCATION_PROGRESS_CHARACTERS: 750000;
export const DEFAULT_EDUCATION_PROGRESS: Readonly<EducationProgress>;
export function normalizeEducationProgress(value: unknown): EducationProgress;
export function educationSourceMatches(progress: unknown, identity: EducationSourceIdentity): boolean;
export function startEducationLesson(progress: unknown, identity: EducationSourceIdentity, target: EducationLessonTarget, date?: Date | string): EducationProgress;
export function completeEducationLesson(progress: unknown, identity: EducationSourceIdentity, target: EducationLessonTarget, date?: Date | string): EducationProgress;
export function recordEducationKnowledgeReview(progress: unknown, identity: EducationSourceIdentity, target: EducationKnowledgeCheckTarget, grade: ReviewGrade, date?: Date | string): EducationProgress;
export function dueEducationReviews(progress: unknown, date?: Date | string): EducationKnowledgeCheckProgress[];
export function nextEducationLesson(progress: unknown, catalog: EducationCatalog | null): ({ courseId: string; moduleId: string; lessonId: string; title: string; estimatedMinutes: number }) | null;
export function educationProgressSummary(progress: unknown, catalog: EducationCatalog | null, date?: Date | string): { totalLessons: number; completedLessons: number; inProgressLessons: number; dueReviews: number; percent: number; sourceCurrent: boolean };
