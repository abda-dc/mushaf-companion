export type ReviewGrade = "again" | "hard" | "good" | "easy";
export const REVIEW_GRADES: readonly ReviewGrade[];
export function isReviewGrade(value: unknown): value is ReviewGrade;
export function nextReviewIntervalDays(previousIntervalDays: number | undefined, grade: ReviewGrade, hasPrevious?: boolean): number;
