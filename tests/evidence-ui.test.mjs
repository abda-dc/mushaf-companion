import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { LatestEvidenceRequestGate, evidencePresentation } from "../app/evidence-layer.ts";

const EMPTY_OK = { status: "ok", items: [], total: 0, coverageComplete: true };
const RESULT_OK = { status: "ok", items: [{}], total: 1, coverageComplete: true };

test("runtime evidence presentation labels loading, disabled, failures, zero, results, and partial states", () => {
  const loading = evidencePresentation({ status: "loading" });
  assert.equal(loading.eyebrow, "EVIDENCE");
  assert.match(loading.title, /Checking approved sources/i);
  assert.doesNotMatch(`${loading.eyebrow} ${loading.title}`, /verified|audited/i);

  const disabled = evidencePresentation({ status: "disabled", reason: "disabled fixture" });
  assert.equal(disabled.title, "Evidence sources unavailable");
  assert.equal(disabled.description, "No approved evidence source is currently enabled.");
  assert.doesNotMatch(`${disabled.eyebrow} ${disabled.title}`, /verified|audited/i);

  for (const status of ["error", "unavailable"]) {
    const failed = evidencePresentation({ status, reason: "fixture failure" });
    assert.match(failed.title, /could not be checked/i);
    assert.doesNotMatch(`${failed.eyebrow} ${failed.title}`, /verified|audited/i);
  }

  const zero = evidencePresentation(EMPTY_OK);
  assert.match(zero.eyebrow, /SOURCE-VERIFIED/);
  assert.equal(zero.title, "Provider audited");
  assert.match(zero.stateTitle, /No relationships were found in the successfully audited source/i);

  const results = evidencePresentation(RESULT_OK);
  assert.equal(results.title, "Provider audited");
  assert.match(results.stateTitle, /Source-verified relationships/i);

  const partial = evidencePresentation({ status: "partial", items: [], total: 0, failures: [{ providerId: "fixture", status: "error", reason: "failed" }], coverageComplete: false });
  assert.match(partial.eyebrow, /COVERAGE INCOMPLETE/);
  assert.match(partial.stateDescription, /not an authoritative zero/i);
});

test("Evidence panel renders every normalized state and source cards expose pinned provenance", async () => {
  const [lens, panel] = await Promise.all([
    readFile(new URL("../app/ayah-context-lens.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/evidence-panel.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(lens, /id: "evidence", label: "Evidence"/);
  assert.match(lens, /<span>EVIDENCE<\/span>/);
  for (const status of ["loading", "disabled", "unavailable", "error", "partial", "ok"]) assert.match(panel, new RegExp(`result\\.status === "${status}"`));
  for (const label of ["Source", "Author/compiler", "Edition", "Provider", "Reference", "Revision", "Runtime audit"]) assert.match(panel, new RegExp(label));
  assert.match(panel, /SOURCE-VERIFIED RELATIONSHIP/);
  assert.match(panel, /sourceApproval\.expectedChecksum/);
  assert.match(panel, /rel="noreferrer"/);
  assert.match(panel, /Source, rights, and approval identity/);
});

test("evidence navigation remains trusted, lazy, and latest-request protected", async () => {
  const [page, evidence, notes] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/evidence-layer.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/study-notes.mjs", import.meta.url), "utf8"),
  ]);
  const start = page.indexOf("async function openEvidenceAyah");
  const end = page.indexOf("function openTafsir", start);
  const navigation = page.slice(start, end);
  assert.match(navigation, /contentTransport\.lookupVerse\(edge\.to\.verseKey\)/);
  assert.match(navigation, /target\.page !== edge\.targetPage/);
  assert.match(page, /overlay !== "Context" \|\| studyActiveTab !== "evidence"/);
  assert.match(page, /registry\.queryAll/);
  assert.doesNotMatch(evidence, /study-notes|StudyNote|private note/i);
  assert.doesNotMatch(notes, /evidence-layer|EvidenceEdge/i);

  const gate = new LatestEvidenceRequestGate();
  const stale = gate.begin("2:255");
  const current = gate.begin("3:2");
  assert.equal(gate.isCurrent(stale), false);
  assert.equal(gate.isCurrent(current), true);
});
