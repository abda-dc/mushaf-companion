export type LearnFocusCandidate = HTMLElement | null | undefined | (() => HTMLElement | null | undefined);
export function focusFirstUsableLearnTarget(candidates: unknown): boolean;
export function scheduleLearnFocusRestore(candidates: LearnFocusCandidate[], schedule?: (callback: () => void) => unknown): void;
