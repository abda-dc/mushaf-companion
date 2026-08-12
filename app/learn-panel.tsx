"use client";

import type { EducationCatalog, EducationCatalogResult, EducationCitation, EducationLesson } from "./education-content.ts";
import { describeEducationCitation } from "./education-citation-presentation.mjs";
import type { EducationProgress } from "./education-state.mjs";
import type { ReviewGrade } from "./review-schedule.mjs";
import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { MAX_NOTE_BODY_CODE_POINTS, MAX_TAGS_PER_NOTE, MAX_TAG_CODE_POINTS, type LessonStudyAnchor, type StudyNote } from "./study-notes.mjs";
import type { TodayStudyPlan, TodayStudyTarget } from "./today-study.mjs";

interface LearnPanelProps {
  catalogResult: EducationCatalogResult | { status: "loading" };
  educationProgress: EducationProgress;
  currentLesson: EducationLesson | null;
  dueCheckIds: Set<string>;
  todayPlan: TodayStudyPlan;
  todayCompletion: { completedSteps: number; totalSteps: number; percent: number };
  todayStudyAction: string;
  todayStudyDisabled: boolean;
  activeEducationReview: { completed: number; total: number; current: Extract<TodayStudyTarget, { checkId: string }> | null } | null;
  hifzDue: number;
  hifzMemorized: number;
  vocabularyDue: number;
  vocabularyAvailable: boolean;
  notes: StudyNote[];
  studyStreak: number;
  onTodayStudy: () => void;
  onOpenLesson: (courseId: string, moduleId: string, lessonId: string) => void;
  onCompleteLesson: (courseId: string, moduleId: string, lessonId: string) => void;
  onRateKnowledgeCheck: (courseId: string, moduleId: string, lessonId: string, checkId: string, grade: ReviewGrade) => void;
  onOpenQuranCitation: (citation: Extract<EducationCitation, { type: "quran" }>) => void;
  onOpenHifz: () => void;
  onOpenVocabulary: () => void;
  onOpenTajweed: () => void;
  onOpenNotes: () => void;
  onOpenReaderStudy: (trigger: HTMLButtonElement) => void;
  onCreateLessonNote: (anchor: LessonStudyAnchor, body: string, tags: string[]) => Promise<string | null>;
  onClose: () => void;
}

function lessonFor(catalog: EducationCatalog, lessonId: string) {
  return catalog.lessons.find((lesson) => lesson.id === lessonId) ?? null;
}

function sourceStatus(result: LearnPanelProps["catalogResult"]) {
  if (result.status === "loading") return "Checking approved education sources…";
  if (result.status === "ready") return `${result.metadata.provider.name} · revision ${result.metadata.revision}`;
  if (result.status === "disabled") return "Guided courses awaiting approved curriculum";
  return "Guided courses could not be safely activated";
}

function LessonCitation({ citation, onOpenQuranCitation }: { citation: EducationCitation; onOpenQuranCitation: LearnPanelProps["onOpenQuranCitation"] }) {
  const presentation = describeEducationCitation(citation);
  return <span className={`lesson-citation citation-${citation.type}`} role="group" aria-label={presentation.accessibleLabel} data-citation-role={presentation.role}>
    <strong className="lesson-citation-category">{presentation.category}</strong>
    {citation.type === "quran"
      ? <button type="button" onClick={() => onOpenQuranCitation(citation)} aria-label={`${presentation.accessibleLabel}. Open trusted verse`}>{presentation.display}</button>
      : presentation.action === "external-source"
        ? <a href={presentation.href ?? undefined} target="_blank" rel={presentation.externalRel ?? undefined} aria-label={`${presentation.accessibleLabel}. Open source in a new tab`}>{presentation.display}</a>
        : <span className="lesson-citation-text">{presentation.display}</span>}
  </span>;
}

export function LearnPanel(props: LearnPanelProps) {
  const { onClose } = props;
  const panelRef = useRef<HTMLElement | null>(null);
  const [noteSectionId, setNoteSectionId] = useState<string | null | undefined>(undefined);
  const [noteBody, setNoteBody] = useState("");
  const [noteTags, setNoteTags] = useState("");
  const [noteError, setNoteError] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const ready = props.catalogResult.status === "ready" ? props.catalogResult : null;
  const catalog = ready?.catalog ?? null;
  const sourceCurrent = Boolean(ready && (!props.educationProgress.sourceId || (props.educationProgress.sourceId === ready.metadata.sourceId && props.educationProgress.sourceRevision === ready.metadata.revision)));
  const citations = new Map(catalog?.citations.map((citation) => [citation.id, citation]) ?? []);
  const completedLessons = sourceCurrent ? props.educationProgress.lessons.filter((lesson) => lesson.status === "completed").length : 0;
  const totalLessons = catalog?.lessons.length ?? 0;
  const progressPercent = totalLessons ? Math.round(completedLessons / totalLessons * 100) : 0;
  const lessonNotes = props.currentLesson && ready ? props.notes.filter((note) => note.anchor.type === "lesson" && note.anchor.sourceId === ready.metadata.sourceId && note.anchor.sourceRevision === ready.metadata.revision && note.anchor.lessonId === props.currentLesson?.id) : [];

  function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const controls = [...panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, [tabindex]:not([tabindex="-1"])')].filter((control) => control.isConnected && control.getAttribute("aria-hidden") !== "true");
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function saveLessonNote() {
    if (!props.currentLesson || !ready || noteSectionId === undefined) return;
    setNoteSaving(true);
    const failure = await props.onCreateLessonNote({ type: "lesson", sourceId: ready.metadata.sourceId, sourceRevision: ready.metadata.revision, courseId: props.currentLesson.courseId, moduleId: props.currentLesson.moduleId, lessonId: props.currentLesson.id, sectionId: noteSectionId }, noteBody, noteTags.split(/[\n,]/u));
    if (failure) {
      setNoteError(failure);
      setNoteSaving(false);
      return;
    }
    setNoteSectionId(undefined);
    setNoteBody("");
    setNoteTags("");
    setNoteError("");
    setNoteSaving(false);
  }

  return <section ref={panelRef} className="panel-shell learn-panel" role="dialog" aria-modal="true" aria-labelledby="learn-title" onKeyDown={trapFocus}>
    <header><div><span className="panel-kicker">STRUCTURED LEARNING</span><h2 id="learn-title">Learn</h2></div><button type="button" className="panel-close" onClick={onClose} aria-label="Close Learn" autoFocus>×</button></header>
    <div className="learn-content">
      <section className="learn-hero" aria-labelledby="learn-today-title">
        <div><span>TODAY&apos;S STUDY</span><h3 id="learn-today-title">A focused path through your existing study tools</h3><p>Due work remains first. Learn coordinates the plan without taking ownership away from Hifz, vocabulary, the reader, or the Ayah Study Lens.</p></div>
        <div className="learn-today-progress" role="progressbar" aria-label="Today’s Study progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={props.todayCompletion.percent}><span style={{ width: `${props.todayCompletion.percent}%` }} /><small>{props.todayCompletion.completedSteps} of {props.todayCompletion.totalSteps} steps complete</small></div>
        <div className="learn-plan-preview">{props.todayPlan.steps.map((step, index) => <span key={step.id}><i>{index + 1}</i><strong>{step.title}</strong><small>{step.estimatedMinutes} min</small></span>)}{!props.todayPlan.steps.length && <p>Your plan is clear. Continue reading whenever you are ready.</p>}</div>
        <button type="button" className="learn-primary" onClick={props.onTodayStudy} disabled={props.todayStudyDisabled}>{props.todayStudyAction} <span aria-hidden="true">→</span></button>
      </section>

      <section className={`guided-courses-card status-${props.catalogResult.status}`} aria-labelledby="guided-courses-title">
        <header><div><span>GUIDED COURSES</span><h3 id="guided-courses-title">{ready ? "Approved guided curricula" : "Guided courses awaiting approved curriculum"}</h3></div><strong>{ready ? `${catalog?.courses.length ?? 0} available` : "Unavailable"}</strong></header>
        <p>{ready ? sourceCurrent ? "Every course below passed source identity, rights, integrity, structured-content, and named scholarly-review gates." : "An approved catalog is available, but your existing progress is pinned to a different source revision. It has not been remapped." : "No Islamic lesson content is active. A provider must pass the approved source, rights, integrity, and named scholarly-review requirements before a course can appear."}</p>
        <small role="status">{sourceStatus(props.catalogResult)}</small>
        {catalog && <div className="guided-course-list">{catalog.courses.map((course) => {
          const orderedLessonIds = course.moduleIds.flatMap((moduleId) => catalog.modules.find((module) => module.id === moduleId && module.courseId === course.id)?.lessonIds ?? []);
          const nextLessonId = orderedLessonIds.find((lessonId) => !sourceCurrent || !props.educationProgress.lessons.some((progress) => progress.lessonId === lessonId && progress.status === "completed"));
          const nextLesson = nextLessonId ? lessonFor(catalog, nextLessonId) : null;
          return <article key={course.id}><div><span>APPROVED COURSE</span><h4>{course.title}</h4><p>{course.summary}</p></div>{nextLesson && <button type="button" disabled={!sourceCurrent} onClick={() => props.onOpenLesson(course.id, nextLesson.moduleId, nextLesson.id)}>Open next lesson</button>}</article>;
        })}</div>}
      </section>

      <section className="learn-review-card" aria-labelledby="education-review-title">
        <header><div><span>DUE REVIEW</span><h3 id="education-review-title">{props.activeEducationReview ? `Guided review ${props.activeEducationReview.completed + 1} of ${props.activeEducationReview.total}` : `${props.dueCheckIds.size} guided-learning checks due`}</h3></div><strong>{props.activeEducationReview ? `${props.activeEducationReview.total - props.activeEducationReview.completed} remaining` : "Due before new"}</strong></header>
        {props.activeEducationReview?.current ? <p>Today’s Study is pinned to lesson <strong>{props.activeEducationReview.current.lessonId}</strong>, check <strong>{props.activeEducationReview.current.checkId}</strong>. Rating it advances deterministically to the next remaining target, including targets in another lesson.</p> : <p>{props.dueCheckIds.size ? "Start Today’s Study to work through every due target in its pinned snapshot." : "No approved guided-learning review is due from the active source revision."}</p>}
      </section>

      <section className="learn-current-card" aria-labelledby="current-lesson-title">
        <header><div><span>CURRENT LESSON</span><h3 id="current-lesson-title">{props.currentLesson?.title ?? "No guided lesson in progress"}</h3></div>{props.currentLesson && <small>{props.currentLesson.estimatedMinutes} min</small>}</header>
        {!props.currentLesson && <p>When an approved guided course is available, your exact source and revision-pinned place will appear here.</p>}
        {props.currentLesson && catalog && <>
          <p>{props.currentLesson.summary}</p>
          <div className="lesson-objectives"><strong>Objectives</strong><ul>{props.currentLesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></div>
          <div className="lesson-blocks">{props.currentLesson.blocks.map((block) => <section key={block.id} id={`lesson-section-${block.id}`} tabIndex={-1} className={`lesson-block block-${block.type}`}><strong>{block.type === "heading" ? block.text : ""}</strong>{block.type !== "heading" && <p>{block.text}</p>}{block.citationIds.length > 0 && <div className="lesson-citations" aria-label="Lesson section sources">{block.citationIds.map((citationId) => {
            const citation = citations.get(citationId);
            if (!citation) return null;
            return <LessonCitation key={citation.id} citation={citation} onOpenQuranCitation={props.onOpenQuranCitation} />;
          })}</div>}<button type="button" className="lesson-note-trigger" onClick={() => { setNoteSectionId(block.id); setNoteError(""); }}>Add private note for this section</button></section>)}</div>
          {props.currentLesson.knowledgeChecks.length > 0 && <section className="knowledge-checks" aria-labelledby="knowledge-checks-title"><h4 id="knowledge-checks-title">Knowledge checks</h4>{props.currentLesson.knowledgeChecks.map((check) => {
            const activeReviewTarget = props.activeEducationReview?.current;
            const currentTodayReview = Boolean(activeReviewTarget && props.currentLesson && activeReviewTarget.lessonId === props.currentLesson.id && activeReviewTarget.checkId === check.id);
            return <article className={`${props.dueCheckIds.has(check.id) ? "due" : ""}${currentTodayReview ? " today-review-target" : ""}`} key={check.id}>{currentTodayReview && <small>NOW REVIEWING IN TODAY&apos;S STUDY</small>}<strong>{check.prompt}</strong><details><summary>Reveal reviewed answer</summary><p>{check.answer}</p>{check.citationIds.length > 0 && <div className="lesson-citations" aria-label="Knowledge-check provenance and supporting sources">{check.citationIds.map((citationId) => {
              const citation = citations.get(citationId);
              return citation ? <LessonCitation key={citation.id} citation={citation} onOpenQuranCitation={props.onOpenQuranCitation} /> : null;
            })}</div>}</details><div aria-label={`Rate knowledge check ${check.id}`}>{(["again", "hard", "good", "easy"] as ReviewGrade[]).map((grade) => <button type="button" onClick={() => props.onRateKnowledgeCheck(props.currentLesson!.courseId, props.currentLesson!.moduleId, props.currentLesson!.id, check.id, grade)} key={grade}>{grade}</button>)}</div></article>;
          })}</section>}
          <section className="lesson-notes" aria-labelledby="lesson-notes-title"><header><div><span>PRIVATE NOTES</span><h4 id="lesson-notes-title">Notes for this lesson</h4></div><strong>{lessonNotes.length}</strong></header>{lessonNotes.map((note) => <article key={note.id}><small>{note.anchor.type === "lesson" && note.anchor.sectionId ? `Section ${note.anchor.sectionId}` : "Whole lesson"}</small><p dir="auto">{note.body}</p></article>)}<button type="button" onClick={() => { setNoteSectionId(null); setNoteError(""); }}>Add private lesson note</button></section>
          {noteSectionId !== undefined && <section className="lesson-note-editor" aria-labelledby="lesson-note-editor-title"><header><h4 id="lesson-note-editor-title">Private {noteSectionId ? `section ${noteSectionId}` : "lesson"} note</h4><button type="button" onClick={() => setNoteSectionId(undefined)} aria-label="Close lesson note editor">×</button></header><label><span>NOTE · PLAIN TEXT</span><textarea rows={5} maxLength={MAX_NOTE_BODY_CODE_POINTS * 2} value={noteBody} onChange={(event) => setNoteBody(event.target.value)} dir="auto" /></label><label><span>TAGS · COMMA SEPARATED</span><input maxLength={MAX_TAGS_PER_NOTE * (MAX_TAG_CODE_POINTS * 2 + 2)} value={noteTags} onChange={(event) => setNoteTags(event.target.value)} dir="auto" /></label>{noteError && <p role="alert">{noteError}</p>}<div><button type="button" className="learn-primary" onClick={() => void saveLessonNote()} disabled={noteSaving}>{noteSaving ? "Checking anchor…" : "Save private note"}</button><button type="button" onClick={() => setNoteSectionId(undefined)} disabled={noteSaving}>Cancel</button></div></section>}
          <button type="button" className="learn-primary" onClick={() => props.onCompleteLesson(props.currentLesson!.courseId, props.currentLesson!.moduleId, props.currentLesson!.id)}>Complete lesson</button>
          <footer><span>SOURCE &amp; SCHOLARLY REVIEW</span><strong>{ready?.metadata.provider.sourceTitle}</strong><small>{ready?.metadata.provider.author} · {ready?.metadata.provider.responsibleOrganization} · reviewed by {ready?.metadata.scholarlyReview.reviewers.map((reviewer) => reviewer.name).join(", ")} · revision {ready?.metadata.revision}</small></footer>
        </>}
      </section>

      <section className="learn-progress-card" aria-labelledby="learning-progress-title"><div><span>LEARNING PROGRESS</span><h3 id="learning-progress-title">Your device-local progress</h3><p>Guided progress is stored separately from Hifz and vocabulary and pinned to its exact source revision.</p></div><strong>{progressPercent}%</strong><dl><div><dt>Lessons complete</dt><dd>{completedLessons} / {totalLessons}</dd></div><div><dt>Reviews due</dt><dd>{props.dueCheckIds.size}</dd></div><div><dt>Study rhythm</dt><dd>{props.studyStreak} days</dd></div></dl></section>

      <section className="learn-tool-grid" aria-label="Learning tools">
        <button type="button" onClick={props.onOpenHifz}><span>MY MUSHAF</span><strong>{props.hifzDue} Hifz reviews due</strong><small>{props.hifzMemorized} ayat mapped in the existing Hifz system</small></button>
        <button type="button" onClick={props.onOpenVocabulary} disabled={!props.vocabularyAvailable}><span>QURAN VOCABULARY</span><strong>{props.vocabularyAvailable ? `${props.vocabularyDue} reviews due` : "Awaiting approved source"}</strong><small>Foundation 125 remains owned by the vocabulary system</small></button>
        <button type="button" onClick={props.onOpenTajweed}><span>TAJWEED</span><strong>Open the verified color guide</strong><small>17 existing rule categories with anchored examples</small></button>
        <button type="button" onClick={props.onOpenNotes}><span>PRIVATE NOTES</span><strong>{props.notes.length} saved on this device</strong><small>Ayah, word, and source-pinned lesson notes</small></button>
        <button type="button" onClick={(event) => props.onOpenReaderStudy(event.currentTarget)}><span>READER STUDY</span><strong>Study the selected ayah</strong><small>Open the existing Ayah Study Lens without changing its Read workflow</small></button>
      </section>
    </div>
  </section>;
}
