"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  MAX_NOTE_BODY_CODE_POINTS,
  MAX_TAG_CODE_POINTS,
  MAX_TAGS_PER_NOTE,
  freezeStudyAnchor,
  focusFirstConnectedStudyTarget,
  normalizeStudyTag,
  searchStudyNotes,
  studyTagFilterAfterRename,
  type StudyAnchor,
  type StudyNote,
} from "./study-notes.mjs";
import type { WordCoordinate } from "./word-study";

type NoteAnchorChoice = "ayah" | "word";

interface StudyNotesPanelProps {
  verseKey: string;
  page: number;
  ayahNotes: StudyNote[];
  wordNotes: StudyNote[];
  selectedWord: WordCoordinate | null;
  onCreate: (anchor: StudyAnchor, body: string, tags: string[]) => Promise<string | null>;
  onUpdate: (id: string, body: string, tags: string[]) => string | null;
  onDelete: (id: string) => void;
}

interface StudyNotesIndexProps {
  notes: StudyNote[];
  onOpen: (note: StudyNote, trigger: HTMLButtonElement) => void;
  onDelete: (id: string) => void;
  onRenameTag: (fromTag: string, toTag: string) => void;
  onRemoveTag: (tag: string) => void;
}

function splitTags(value: string) {
  return value.split(/[,\n]/u);
}

function formatEdited(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

type FocusCandidate = HTMLElement | null | undefined | (() => HTMLElement | null | undefined);

function scheduleFocus(targets: FocusCandidate[]) {
  window.requestAnimationFrame(() => {
    focusFirstConnectedStudyTarget(targets.map((target) => typeof target === "function" ? target() : target));
  });
}

function adjacentNoteAction(article: HTMLElement | null) {
  if (!article?.parentElement) return null;
  const cards = [...article.parentElement.querySelectorAll<HTMLElement>("[data-note-id]")];
  const index = cards.indexOf(article);
  return cards[index + 1]?.querySelector<HTMLElement>("button") ?? cards[index - 1]?.querySelector<HTMLElement>("button") ?? null;
}

function NoteCard({ note, onEdit, onDelete }: { note: StudyNote; onEdit: (note: StudyNote, trigger: HTMLButtonElement) => void; onDelete: (id: string) => void }) {
  const [deleteArmed, setDeleteArmed] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const confirmDeleteRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (deleteArmed) confirmDeleteRef.current?.focus();
  }, [deleteArmed]);

  function confirmDelete() {
    const nextTarget = adjacentNoteAction(articleRef.current);
    onDelete(note.id);
    scheduleFocus([nextTarget, () => document.querySelector<HTMLElement>(".notes-add")]);
  }

  return <article className="private-note-card" ref={articleRef} data-note-id={note.id}>
    <header><div><span>PRIVATE NOTE · USER-AUTHORED</span><strong>{note.anchor.type === "word" ? `Word ${note.anchor.wordPosition} · Ayah ${note.anchor.verseKey}` : note.anchor.type === "lesson" ? `Lesson ${note.anchor.lessonId}` : `Ayah ${note.anchor.verseKey}`}</strong></div><small>Edited {formatEdited(note.updatedAt)}</small></header>
    <p dir="auto">{note.body}</p>
    {note.tags.length > 0 && <div className="private-note-tags" aria-label="Private note tags">{note.tags.map((tag) => <span dir="auto" key={normalizeStudyTag(tag)?.key ?? tag}>{tag}</span>)}</div>}
    <div className="private-note-actions"><button type="button" onClick={(event) => onEdit(note, event.currentTarget)}>Edit</button>{deleteArmed ? <><button ref={confirmDeleteRef} type="button" className="confirm-delete" onClick={confirmDelete}>Confirm delete</button><button type="button" onClick={() => { setDeleteArmed(false); scheduleFocus([() => deleteTriggerRef.current]); }}>Cancel</button></> : <button ref={deleteTriggerRef} type="button" onClick={() => setDeleteArmed(true)}>Delete</button>}</div>
  </article>;
}

export function StudyNotesPanel({ verseKey, page, ayahNotes, wordNotes, selectedWord, onCreate, onUpdate, onDelete }: StudyNotesPanelProps) {
  const [editing, setEditing] = useState<StudyNote | null>(null);
  const [adding, setAdding] = useState(false);
  const [draftAnchor, setDraftAnchor] = useState<StudyAnchor | null>(null);
  const [draftAnchors, setDraftAnchors] = useState<{ ayah: StudyAnchor; word: StudyAnchor | null } | null>(null);
  const [body, setBody] = useState("");
  const [tagText, setTagText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const editorReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const bodyLength = [...body].length;

  function resetEditor(returnFocus = false) {
    setEditing(null);
    setAdding(false);
    setDraftAnchor(null);
    setDraftAnchors(null);
    setBody("");
    setTagText("");
    setError("");
    setSaving(false);
    if (returnFocus) scheduleFocus([() => editorReturnFocusRef.current, () => addButtonRef.current]);
  }

  function beginAdd(choice: NoteAnchorChoice, trigger: HTMLButtonElement) {
    const ayahSnapshot = freezeStudyAnchor({ type: "ayah", verseKey, page });
    const wordSnapshot = selectedWord ? freezeStudyAnchor({ type: "word", ...selectedWord }) : null;
    if (!ayahSnapshot) {
      setError("The current ayah anchor could not be captured.");
      return;
    }
    editorReturnFocusRef.current = trigger;
    setEditing(null);
    setAdding(true);
    setDraftAnchors({ ayah: ayahSnapshot, word: wordSnapshot });
    setDraftAnchor(choice === "word" && wordSnapshot ? wordSnapshot : ayahSnapshot);
    setBody("");
    setTagText("");
    setError("");
  }

  function beginEdit(note: StudyNote, trigger: HTMLButtonElement) {
    editorReturnFocusRef.current = trigger;
    setEditing(note);
    setAdding(false);
    setDraftAnchor(freezeStudyAnchor(note.anchor));
    setDraftAnchors(null);
    setBody(note.body);
    setTagText(note.tags.join(", "));
    setError("");
  }

  async function save() {
    const tags = splitTags(tagText);
    if (!editing && !draftAnchor) {
      setError("The captured Quran anchor is unavailable, so the note was not saved.");
      return;
    }
    setSaving(true);
    const failure = editing ? onUpdate(editing.id, body, tags) : await onCreate(draftAnchor!, body, tags);
    if (failure) {
      setError(failure);
      setSaving(false);
      return;
    }
    resetEditor(true);
  }

  const editorOpen = adding || Boolean(editing);
  useEffect(() => {
    if (editorOpen) bodyRef.current?.focus();
  }, [editorOpen]);

  return <div className="notes-tab-content">
    <section className="private-content-banner" aria-label="Private notes privacy status"><span>PRIVATE · STORED ON THIS DEVICE</span><strong>Your own study reflections</strong><p>Notes are plain text, never alter Quran content, and are sent nowhere during normal use. They leave this device only when you explicitly download a backup.</p></section>
    {!editorOpen && <button ref={addButtonRef} type="button" className="context-primary notes-add" onClick={(event) => beginAdd("ayah", event.currentTarget)}>Add private note</button>}
    {editorOpen && <section className="note-editor" aria-labelledby="note-editor-title">
      <header><div><span>{editing ? "EDIT PRIVATE NOTE" : "NEW PRIVATE NOTE"}</span><h3 id="note-editor-title">{draftAnchor?.type === "word" ? `Word ${draftAnchor.wordPosition} · Ayah ${draftAnchor.verseKey}` : draftAnchor?.type === "lesson" ? `Lesson ${draftAnchor.lessonId}` : `Ayah ${draftAnchor?.verseKey ?? verseKey}`}</h3></div><button type="button" onClick={() => resetEditor(true)} aria-label="Close private note editor">×</button></header>
      {!editing && draftAnchors && <fieldset><legend>ATTACH NOTE TO</legend><div className="note-anchor-options"><button type="button" className={draftAnchor?.type === "ayah" ? "active" : ""} aria-pressed={draftAnchor?.type === "ayah"} onClick={() => setDraftAnchor(draftAnchors.ayah)}>Ayah {draftAnchors.ayah.type === "ayah" ? draftAnchors.ayah.verseKey : verseKey}</button><button type="button" className={draftAnchor?.type === "word" ? "active" : ""} aria-pressed={draftAnchor?.type === "word"} disabled={!draftAnchors.word} onClick={() => draftAnchors.word && setDraftAnchor(draftAnchors.word)}>{draftAnchors.word?.type === "word" ? `Word ${draftAnchors.word.wordPosition}` : "Select a trusted word first"}</button></div></fieldset>}
      <label><span>NOTE · PLAIN TEXT</span><textarea ref={bodyRef} value={body} onChange={(event) => setBody(event.target.value)} maxLength={MAX_NOTE_BODY_CODE_POINTS * 2} rows={6} dir="auto" aria-describedby="note-body-limit" /></label>
      <small id="note-body-limit" className={bodyLength > MAX_NOTE_BODY_CODE_POINTS ? "limit-error" : ""}>{bodyLength.toLocaleString("en-US")} / {MAX_NOTE_BODY_CODE_POINTS.toLocaleString("en-US")} characters</small>
      <label><span>TAGS · COMMA SEPARATED</span><input value={tagText} onChange={(event) => setTagText(event.target.value)} maxLength={MAX_TAGS_PER_NOTE * (MAX_TAG_CODE_POINTS * 2 + 2)} placeholder="Ask teacher, Review, دعاء" dir="auto" /><small>Up to {MAX_TAGS_PER_NOTE} tags. Matching is case-insensitive; your visible spelling is preserved.</small></label>
      {error && <p className="note-editor-error" role="alert">{error}</p>}
      <div className="note-editor-actions"><button type="button" className="context-primary" onClick={() => void save()} disabled={saving}>{saving ? "Checking anchor…" : "Save private note"}</button><button type="button" onClick={() => resetEditor(true)} disabled={saving}>Cancel</button></div>
    </section>}

    <section className="anchored-notes" aria-labelledby="ayah-notes-title"><header><div><span>AYAH NOTES</span><h3 id="ayah-notes-title">Ayah {verseKey}</h3></div><strong>{ayahNotes.length}</strong></header>{ayahNotes.map((note) => <NoteCard note={note} onEdit={beginEdit} onDelete={onDelete} key={note.id} />)}{!ayahNotes.length && <p className="empty-state">No private ayah notes yet.</p>}</section>
    {selectedWord && <section className="anchored-notes" aria-labelledby="word-notes-title"><header><div><span>WORD NOTES</span><h3 id="word-notes-title">Word {selectedWord.wordPosition} · line {selectedWord.line}</h3></div><strong>{wordNotes.length}</strong></header>{wordNotes.map((note) => <NoteCard note={note} onEdit={beginEdit} onDelete={onDelete} key={note.id} />)}{!wordNotes.length && <><p className="empty-state">No private notes for this exact trusted word.</p>{!editorOpen && <button type="button" onClick={(event) => beginAdd("word", event.currentTarget)}>Add word note</button>}</>}</section>}
  </div>;
}

function IndexNoteCard({ note, deleteArmed, onArmDelete, onCancelDelete, onOpen, onDelete, fallbackFocus }: {
  note: StudyNote;
  deleteArmed: boolean;
  onArmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onOpen: StudyNotesIndexProps["onOpen"];
  onDelete: StudyNotesIndexProps["onDelete"];
  fallbackFocus: () => HTMLElement | null;
}) {
  const articleRef = useRef<HTMLElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const confirmDeleteRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (deleteArmed) confirmDeleteRef.current?.focus();
  }, [deleteArmed]);
  const anchorLabel = note.anchor.type === "lesson" ? `Lesson ${note.anchor.lessonId}` : `Ayah ${note.anchor.verseKey}${note.anchor.type === "word" ? ` · word ${note.anchor.wordPosition}` : ""}`;
  const locationLabel = note.anchor.type === "lesson" ? `Course ${note.anchor.courseId} · revision ${note.anchor.sourceRevision}` : `Page ${note.anchor.page}`;
  return <article ref={articleRef} data-note-id={note.id}><button type="button" className="note-open" onClick={(event: MouseEvent<HTMLButtonElement>) => onOpen(note, event.currentTarget)}><span>{note.anchor.type === "word" ? "PRIVATE WORD NOTE" : note.anchor.type === "lesson" ? "PRIVATE LESSON NOTE" : "PRIVATE AYAH NOTE"}</span><strong>{anchorLabel}</strong><p dir="auto">{note.body}</p><small>{locationLabel} · edited {formatEdited(note.updatedAt)}</small></button><div>{deleteArmed ? <><button ref={confirmDeleteRef} type="button" className="confirm-delete" onClick={() => { const target = adjacentNoteAction(articleRef.current); onDelete(note.id); scheduleFocus([target, fallbackFocus]); }}>Confirm delete</button><button type="button" onClick={() => { onCancelDelete(); scheduleFocus([() => deleteTriggerRef.current]); }}>Cancel</button></> : <button ref={deleteTriggerRef} type="button" onClick={() => onArmDelete(note.id)} aria-label={`Delete private note for ${anchorLabel}`}>Delete</button>}</div></article>;
}

export function StudyNotesIndex({ notes, onOpen, onDelete, onRenameTag, onRemoveTag }: StudyNotesIndexProps) {
  const [query, setQuery] = useState("");
  const [anchorType, setAnchorType] = useState<"all" | "ayah" | "word" | "lesson">("all");
  const [tag, setTag] = useState("");
  const [deleteArmed, setDeleteArmed] = useState("");
  const [editingTag, setEditingTag] = useState("");
  const [replacementTag, setReplacementTag] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tags = useMemo(() => {
    const values = new Map<string, string>();
    for (const note of notes) for (const item of note.tags) {
      const normalized = normalizeStudyTag(item);
      if (normalized && !values.has(normalized.key)) values.set(normalized.key, normalized.visible);
    }
    return [...values.values()].sort((left, right) => left.localeCompare(right));
  }, [notes]);
  const filtered = useMemo(() => searchStudyNotes({ schemaVersion: 2, notes }, query, anchorType, tag), [notes, query, anchorType, tag]);

  function beginTagRename(value: string) {
    setEditingTag(value);
    setReplacementTag(value);
  }

  function commitTagRename() {
    if (editingTag && replacementTag) {
      setTag((current) => studyTagFilterAfterRename(current, editingTag, replacementTag));
      onRenameTag(editingTag, replacementTag);
    }
    setEditingTag("");
    setReplacementTag("");
  }

  return <div className="notes-index">
    <section className="private-content-banner"><span>MY PRIVATE NOTES</span><strong>{notes.length.toLocaleString("en-US")} saved on this device</strong><p>Search happens locally. Note text and tags are never added to Quran search requests.</p></section>
    <div className="notes-index-tools"><label><span className="sr-only">Search private notes</span><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search note text, tag, verse, or lesson" dir="auto" /></label><label><span className="sr-only">Filter note anchor</span><select value={anchorType} onChange={(event) => setAnchorType(event.target.value as "all" | "ayah" | "word" | "lesson")}><option value="all">All notes</option><option value="ayah">Ayah notes</option><option value="word">Word notes</option><option value="lesson">Lesson notes</option></select></label></div>
    {tags.length > 0 && <div className="notes-tag-filter" aria-label="Filter private notes by tag"><button type="button" className={!tag ? "active" : ""} onClick={() => setTag("")}>All tags</button>{tags.map((item) => <button type="button" className={normalizeStudyTag(item)?.key === normalizeStudyTag(tag)?.key ? "active" : ""} onClick={() => setTag(item)} dir="auto" key={normalizeStudyTag(item)?.key}>{item}</button>)}</div>}
    <div className="notes-index-list">{filtered.map((note) => <IndexNoteCard note={note} deleteArmed={deleteArmed === note.id} onArmDelete={setDeleteArmed} onCancelDelete={() => setDeleteArmed("")} onOpen={onOpen} onDelete={onDelete} fallbackFocus={() => searchInputRef.current} key={note.id} />)}{!filtered.length && <p className="empty-state">No private notes match this local filter.</p>}</div>
    {tags.length > 0 && <details className="notes-tag-manager"><summary>Manage private tags</summary>{tags.map((item) => <div key={normalizeStudyTag(item)?.key}><span dir="auto">{item}</span>{editingTag === item ? <><input value={replacementTag} onChange={(event) => setReplacementTag(event.target.value)} dir="auto" aria-label={`Rename tag ${item}`} /><button type="button" onClick={commitTagRename}>Save</button><button type="button" onClick={() => setEditingTag("")}>Cancel</button></> : <><button type="button" onClick={() => beginTagRename(item)}>Rename</button><button type="button" onClick={() => { onRemoveTag(item); if (normalizeStudyTag(tag)?.key === normalizeStudyTag(item)?.key) setTag(""); }}>Remove</button></>}</div>)}</details>}
  </div>;
}
