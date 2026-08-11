export const REVIEW_GRADES = Object.freeze(["again", "hard", "good", "easy"]);
const REVIEW_GRADE_SET = new Set(REVIEW_GRADES);

export function isReviewGrade(value) {
  return REVIEW_GRADE_SET.has(value);
}

export function nextReviewIntervalDays(previousIntervalDays, grade, hasPrevious = Number.isInteger(previousIntervalDays)) {
  if (!isReviewGrade(grade)) return 1;
  const base = Number.isInteger(previousIntervalDays) && previousIntervalDays >= 1 ? Math.min(previousIntervalDays, 365) : 1;
  if (grade === "again") return 1;
  if (grade === "hard") return Math.max(2, Math.round(base * 1.2));
  if (grade === "easy") return hasPrevious ? Math.min(365, Math.max(7, Math.round(base * 3))) : 7;
  return hasPrevious ? Math.min(365, Math.max(3, Math.round(base * 2))) : 3;
}
