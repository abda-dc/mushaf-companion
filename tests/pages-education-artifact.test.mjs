import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { listPagesArtifactFiles, verifyEducationArtifactPolicy } from "../scripts/education-artifact-policy.mjs";

const DISABLED_RELEASE = {
  status: "disabled",
  bundled: false,
  providerId: null,
  sourceId: null,
  revision: null,
  courseCount: 0,
  lessonCount: 0,
  artifacts: [],
  reason: "No approved guided education curriculum is configured.",
};

async function rejectedFixture(t, relativePath, content) {
  const root = await mkdtemp(join(tmpdir(), "mushaf-pages-education-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, relativePath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
  await assert.rejects(
    verifyEducationArtifactPolicy(root, await listPagesArtifactFiles(root), DISABLED_RELEASE),
    /undeclared (?:artifact|education)|education.*payload|curriculum-shaped|compiled or serialized/i,
  );
}

test("Pages policy rejects an education package under compiled assets", async (t) => {
  await rejectedFixture(t, "assets/education-package.json", '{"sourceRevision":"r1","courses":[{}],"modules":[{}],"lessons":[{}]}');
});

test("Pages policy rejects curriculum data copied through a public-derived path", async (t) => {
  await rejectedFixture(t, "copied-public/course-data.json", '{"sourceRevision":"r1","courses":[{"id":"c"}],"modules":[{"id":"m"}],"lessons":[{"id":"l"}]}');
});

test("Pages policy rejects an undeclared static text education payload outside content", async (t) => {
  await rejectedFixture(t, "static/guide-data.txt", "guided curriculum education catalog\ncourseId=course:x\nmoduleId=module:x\nlessonId=lesson:x\nknowledgeChecks=[]");
});

test("Pages policy rejects a non-empty education catalog embedded in compiled JavaScript", async (t) => {
  await rejectedFixture(t, "assets/index-adversarial.js", 'const catalog={schemaVersion:1,sourceId:"source:x",sourceRevision:"r1",courses:[{id:"c"}],modules:[{id:"m"}],lessons:[{id:"l",blocks:[{text:"payload"}],knowledgeChecks:[]}],citations:[]};');
});

test("Pages policy rejects a candidate-intake file even without lesson prose", async (t) => {
  await rejectedFixture(t, "content/education/candidates/nasiha-level2-iman/source-manifest.json", '{"sourceStatus":"pending","productionEligible":false}');
});

test("Pages exact inventory rejects candidate-shaped data under a non-education-looking path", async (t) => {
  await rejectedFixture(t, "assets/cache/data.json", '{"sourceStatus":"pending","productionEligible":false}');
});
