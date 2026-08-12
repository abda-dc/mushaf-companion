function resolveCandidate(candidate) {
  try {
    return typeof candidate === "function" ? candidate() : candidate;
  } catch {
    return null;
  }
}

export function focusFirstUsableLearnTarget(candidates) {
  if (!Array.isArray(candidates)) return false;
  for (const candidate of candidates) {
    const target = resolveCandidate(candidate);
    if (!target?.isConnected || typeof target.focus !== "function") continue;
    if (typeof target.getClientRects === "function" && target.getClientRects().length === 0) continue;
    target.focus();
    return true;
  }
  return false;
}

export function scheduleLearnFocusRestore(candidates, schedule = (callback) => globalThis.requestAnimationFrame(callback)) {
  schedule(() => focusFirstUsableLearnTarget(candidates));
}
