import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { focusFirstUsableLearnTarget, scheduleLearnFocusRestore } from "../app/learn-focus.mjs";

test("Learn is a real desktop and five-item mobile destination while Ayah Study Lens remains in Read", async () => {
  const [page, learn, lens, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/learn-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/ayah-context-lens.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /const NAV_ITEMS[\s\S]*\{ label: "Learn", glyph:/);
  assert.doesNotMatch(page, /NAV_ITEMS\.splice/);
  assert.match(page, /MOBILE_NAV_ITEMS/);
  assert.match(css, /\.mobile-nav\s*\{[^}]*grid-template-columns:\s*repeat\(5,\s*1fr\)/s);
  assert.match(page, /overlay === "Learn"/);
  assert.match(page, /<LearnPanel/);
  assert.match(page, /openContextLens\(event\.currentTarget\)/, "reader Study button remains the existing Ayah Study Lens entry");
  assert.match(lens, /Ayah Study Lens/);
  assert.match(lens, /STUDY_TABS/);
  assert.doesNotMatch(lens, /LearnPanel|education-content|education-state/);
  assert.match(learn, /Open the existing Ayah Study Lens without changing its Read workflow/);
});

test("Learn renders every required hub section and explicit unavailable production copy", async () => {
  const learn = await readFile(new URL("../app/learn-panel.tsx", import.meta.url), "utf8");
  for (const label of ["TODAY&apos;S STUDY", "GUIDED COURSES", "CURRENT LESSON", "LEARNING PROGRESS", "MY MUSHAF", "QURAN VOCABULARY", "TAJWEED", "PRIVATE NOTES", "READER STUDY"]) assert.match(learn, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(learn, /Guided courses awaiting approved curriculum/);
  assert.match(learn, /No Islamic lesson content is active/);
  assert.match(learn, /source and revision-pinned/);
});

test("Learn lesson rendering is structured text-only and keeps citations separate from M8 Evidence", async () => {
  const [learn, education, evidence] = await Promise.all([
    readFile(new URL("../app/learn-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/education-content.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/evidence-layer.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(learn, /dangerouslySetInnerHTML/);
  assert.match(education, /EducationLessonBlockType/);
  assert.match(education, /Quran citation/);
  assert.doesNotMatch(education, /ResolvedEvidenceEdge|EvidenceProviderRegistry|evidence-layer/);
  assert.doesNotMatch(evidence, /EducationCourse|education-state|education-content/);
});

test("Learn dialog and controls retain accessible semantics and touch-size floors", async () => {
  const [learn, css] = await Promise.all([
    readFile(new URL("../app/learn-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(learn, /role="dialog" aria-modal="true" aria-labelledby="learn-title"/);
  assert.match(learn, /aria-label="Close Learn"/);
  assert.match(learn, /aria-label="Close Learn" autoFocus/);
  assert.match(learn, /event\.key === "Escape"/);
  assert.match(learn, /onKeyDown=\{trapFocus\}/);
  assert.match(learn, /button:not\(:disabled\).*\[tabindex/, "Learn traps keyboard focus among enabled controls");
  assert.match(learn, /role="progressbar"/);
  assert.match(learn, /aria-label={`Rate knowledge check/);
  for (const selector of [".learn-primary", ".knowledge-checks button", ".lesson-citations button", ".lesson-note-trigger", ".lesson-notes > button"]) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(css, new RegExp(`${escaped}[^{}]*\\{[^}]*min-height:\\s*44px`, "s"), `${selector} should retain a 44px target`);
  }
});

test("Learn focus restoration prefers the actual opener and safely falls back when it disappears", () => {
  const calls = [];
  const opener = { isConnected: true, getClientRects: () => [1], focus: () => calls.push("opener") };
  const desktopFallback = { isConnected: true, getClientRects: () => [1], focus: () => calls.push("desktop") };
  assert.equal(focusFirstUsableLearnTarget([opener, desktopFallback]), true);
  assert.deepEqual(calls, ["opener"]);

  calls.length = 0;
  opener.isConnected = false;
  const hidden = { isConnected: true, getClientRects: () => [], focus: () => calls.push("hidden") };
  let scheduled = false;
  scheduleLearnFocusRestore([() => opener, hidden, () => desktopFallback], (callback) => { scheduled = true; callback(); });
  assert.equal(scheduled, true);
  assert.deepEqual(calls, ["desktop"]);
});

test("desktop and mobile Learn controls capture their invoking element for close, Escape, and backdrop restoration", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /learnTriggerRef\.current = trigger/);
  assert.match(page, /desktopLearnNavRef/);
  assert.match(page, /mobileLearnNavRef/);
  assert.match(page, /function closeLearn\(\)[\s\S]*scheduleLearnFocusRestore/);
  assert.match(page, /overlay === "Learn"\) closeLearn\(\)/, "backdrop dismissal restores Learn focus");
  assert.match(page, /if \(overlay === "Learn"\)[\s\S]*closeLearn\(\)/, "Escape restores Learn focus");
});

test("lesson notes are source-pinned and locally revalidated without altering ayah/word note paths", async () => {
  const [page, learn, notes] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/learn-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/study-notes.mjs", import.meta.url), "utf8"),
  ]);
  assert.match(learn, /sourceId: ready\.metadata\.sourceId/);
  assert.match(learn, /sourceRevision: ready\.metadata\.revision/);
  assert.match(page, /resolveLesson/);
  assert.match(page, /pinned guided-course revision is unavailable/);
  assert.match(notes, /lesson\|\$\{normalized\.sourceId\}/);
  assert.match(page, /resolveWord:/, "word anchors retain their trusted Quran coordinate revalidation");
  assert.match(page, /resolveVerse:/, "ayah anchors retain trusted verse revalidation");
});

test("server and Pages transports expose the same education operation", async () => {
  const [types, server, pages, route] = await Promise.all([
    readFile(new URL("../app/content/runtime-transport.types.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/content/runtime-transport.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/content/pages-runtime-transport.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/education/catalog/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(types, /loadEducationCatalog/);
  assert.match(server, /api\/education\/catalog/);
  assert.match(pages, /createProductionEducationRegistry/);
  assert.match(route, /createProductionEducationRegistry/);
  assert.match(route, /lookupVerseFromSource/);
});

test("Pages release build fails closed before packaging undeclared education content", async () => {
  const [build, verifier] = await Promise.all([
    readFile(new URL("../scripts/build-pages.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/verify-pages-artifact.mjs", import.meta.url), "utf8"),
  ]);
  assert.match(build, /createProductionEducationRegistry/);
  assert.match(build, /educationReleaseCheck\.status !== "disabled"/);
  assert.match(build, /PRODUCTION_EDUCATION_RELEASE/);
  assert.match(verifier, /buildMetadata\.education/);
  assert.match(verifier, /unapproved education catalog/);
  assert.match(verifier, /undeclared content asset/);
});
