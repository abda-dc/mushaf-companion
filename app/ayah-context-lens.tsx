"use client";

import { useCallback, useEffect, useReducer, useRef, useState, type KeyboardEvent } from "react";
import { CONTENT_MANIFEST } from "./content-manifest";
import { findTranslationSource } from "./content/source-registry";
import type { TafsirDocument } from "./tafsir-source.mjs";
import type { TajweedRule } from "./tajweed-guide";
import type { QuranWordStudyRecord, WordCoordinate, WordOccurrence, WordStudySourceMetadata } from "./word-study";
import {
  AMHARIC_TRANSLATION_SOURCE_ID,
  type TranslationPackProgress,
  type TranslationPackService,
} from "./translation-packs.mjs";
import {
  contextLensReducer,
  createContextLensState,
  type ContextLensTab,
  type ContextTranslationId,
} from "./ayah-context-lens-state";

interface AyahContextLensProps {
  service: TranslationPackService;
  initialTab: ContextLensTab;
  verseKey: string;
  surahNumber: number;
  surahName: string;
  surahMeaning: string;
  page: number;
  juz: number;
  hizb: number;
  arabic: string;
  englishTranslation: string;
  tafsirDocument: TafsirDocument | null;
  tafsirLoading: boolean;
  tafsirError: string;
  selectedWord: { coordinate: WordCoordinate; surfaceText: string; tajweedRules: TajweedRule[] } | null;
  wordRecord: QuranWordStudyRecord | null;
  wordStudySource: WordStudySourceMetadata | null;
  wordStudyLoading: boolean;
  occurrenceExplorer: { kind: "lemma" | "root"; identifier: string; label: string; items: WordOccurrence[]; total: number; status: "loading" | "ok" | "unavailable" | "error"; reason: string } | null;
  playing: boolean;
  memorized: boolean;
  tajweedEnabled: boolean;
  canMovePrevious: boolean;
  canMoveNext: boolean;
  onActiveTabChange: (tab: ContextLensTab) => void;
  onMoveAyah: (direction: -1 | 1) => void;
  onRetryTafsir: () => void;
  onTogglePlay: () => void;
  onToggleMemorized: () => void;
  onToggleTajweed: () => void;
  onOpenHifz: () => void;
  onOpenTajweedGuide: () => void;
  onHearWordInAyah: () => void;
  onExploreLemma: (lemmaId: string, label: string) => void;
  onExploreRoot: (rootId: string, label: string) => void;
  onOpenOccurrence: (occurrence: WordOccurrence) => void;
  onCloseOccurrences: () => void;
  onClose: () => void;
}

const AMHARIC_SOURCE = findTranslationSource(AMHARIC_TRANSLATION_SOURCE_ID);
const ENGLISH_SOURCE = findTranslationSource("quran-foundation:translation:20");
const FOCUSABLE = "button:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";
const STUDY_TABS: Array<{ id: ContextLensTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "words", label: "Words" },
  { id: "tafsir", label: "Tafsir" },
  { id: "practice", label: "Practice" },
];

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The translation pack operation could not be completed.";
}

function OccurrenceExplorer({ explorer, surahNumber, onOpen, onClose }: { explorer: NonNullable<AyahContextLensProps["occurrenceExplorer"]>; surahNumber: number; onOpen: (occurrence: WordOccurrence) => void; onClose: () => void }) {
  const [filter, setFilter] = useState<"all" | "surah">("all");
  const [limit, setLimit] = useState(50);
  const filtered = filter === "surah" ? explorer.items.filter((item) => Number(item.coordinate.verseKey.split(":")[0]) === surahNumber) : explorer.items;
  const visible = filtered.slice(0, limit);
  return <section className="occurrence-explorer" aria-labelledby="occurrence-explorer-title">
    <header><div><span>{explorer.kind.toUpperCase()} OCCURRENCES</span><h4 id="occurrence-explorer-title">{explorer.label}</h4><small>{explorer.status === "loading" ? "Checking audited coordinates…" : explorer.status === "ok" ? filter === "all" ? `Showing ${visible.length} of ${explorer.total} audited occurrences` : `Showing ${visible.length} of ${filtered.length} sūrah matches from ${explorer.total} audited occurrences` : "Audited occurrence count unavailable"}</small></div><button type="button" onClick={onClose} aria-label="Close occurrence explorer">×</button></header>
    <label><span>FILTER</span><select value={filter} onChange={(event) => { setFilter(event.target.value as "all" | "surah"); setLimit(50); }}><option value="all">All Quran results</option><option value="surah">Current sūrah only</option></select></label>
    {(explorer.status === "unavailable" || explorer.status === "error") && <p className="occurrence-error" role="alert">{explorer.reason}</p>}
    {explorer.status === "ok" && <div className="occurrence-results">{visible.map((item) => <button type="button" onClick={() => onOpen(item)} key={`${item.wordId}|${item.coordinate.verseKey}|${item.coordinate.wordPosition}|${item.coordinate.page}|${item.coordinate.line}|${item.coordinate.sourceWordId ?? "missing"}`}><span><strong>{item.coordinate.verseKey}</strong><small>Page {item.coordinate.page} · line {item.coordinate.line} · word {item.coordinate.wordPosition}</small></span><span aria-hidden="true">›</span></button>)}{!filtered.length && <p>No audited occurrences match this filter.</p>}</div>}
    {visible.length < filtered.length && <button type="button" className="occurrence-more" onClick={() => setLimit((value) => value + 50)}>Show 50 more <span>{visible.length} of {filtered.length}</span></button>}
  </section>;
}

export function AyahContextLens({
  service,
  initialTab,
  verseKey,
  surahNumber,
  surahName,
  surahMeaning,
  page,
  juz,
  hizb,
  arabic,
  englishTranslation,
  tafsirDocument,
  tafsirLoading,
  tafsirError,
  selectedWord,
  wordRecord,
  wordStudySource,
  wordStudyLoading,
  occurrenceExplorer,
  playing,
  memorized,
  tajweedEnabled,
  canMovePrevious,
  canMoveNext,
  onActiveTabChange,
  onMoveAyah,
  onRetryTafsir,
  onTogglePlay,
  onToggleMemorized,
  onToggleTajweed,
  onOpenHifz,
  onOpenTajweedGuide,
  onHearWordInAyah,
  onExploreLemma,
  onExploreRoot,
  onOpenOccurrence,
  onCloseOccurrences,
  onClose,
}: AyahContextLensProps) {
  const [state, dispatch] = useReducer(contextLensReducer, initialTab, createContextLensState);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const loadPack = useCallback(async (selectAmharic = false) => {
    dispatch({ type: "PACK_CHECKING" });
    try {
      const status = await service.getStatus(AMHARIC_TRANSLATION_SOURCE_ID);
      if (status.storageReclaimed) {
        dispatch({ type: "PACK_RECLAIMED" });
        return;
      }
      if (!status.activePackKey) {
        dispatch({ type: "PACK_ABSENT" });
        return;
      }
      const record = await service.getByVerseKey(verseKey, AMHARIC_TRANSLATION_SOURCE_ID);
      const pack = status.installedPacks.find((item) => item.packKey === status.activePackKey) ?? null;
      if (!record || !pack) {
        dispatch({ type: "PACK_RECLAIMED" });
        return;
      }
      dispatch({ type: "PACK_READY", pack, record, selectAmharic });
    } catch (error) {
      dispatch({ type: "PACK_FAILURE", action: "install", error: errorMessage(error) });
    }
  }, [service, verseKey]);

  useEffect(() => {
    if (state.activeTab === "overview") loadPack().catch(() => undefined);
  }, [loadPack, state.activeTab]);

  useEffect(() => {
    onActiveTabChange(state.activeTab);
  }, [onActiveTabChange, state.activeTab]);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  function progressOptions() {
    return { onProgress: (progress: TranslationPackProgress) => dispatch({ type: "PACK_PROGRESS", progress }) };
  }

  async function installPack() {
    dispatch({ type: "PACK_OPERATION", operation: "install" });
    try {
      await service.install(AMHARIC_TRANSLATION_SOURCE_ID, progressOptions());
      await loadPack(true);
    } catch (error) {
      dispatch({ type: "PACK_FAILURE", action: "install", error: errorMessage(error) });
    }
  }

  async function verifyPack() {
    dispatch({ type: "PACK_OPERATION", operation: "verify" });
    try {
      await service.verifyActive(AMHARIC_TRANSLATION_SOURCE_ID);
      await loadPack();
    } catch (error) {
      dispatch({ type: "PACK_FAILURE", action: "repair", error: errorMessage(error) });
    }
  }

  async function repairPack() {
    dispatch({ type: "PACK_OPERATION", operation: "repair" });
    try {
      await service.repair(AMHARIC_TRANSLATION_SOURCE_ID, progressOptions());
      await loadPack(true);
    } catch (error) {
      dispatch({ type: "PACK_FAILURE", action: "repair", error: errorMessage(error) });
    }
  }

  async function deletePack(force = false) {
    if (!state.deleteArmed && !force) {
      dispatch({ type: "ARM_DELETE" });
      return;
    }
    dispatch({ type: "PACK_OPERATION", operation: "delete" });
    try {
      await service.deleteSource(AMHARIC_TRANSLATION_SOURCE_ID);
      dispatch({ type: "PACK_DELETED" });
    } catch (error) {
      dispatch({ type: "PACK_FAILURE", action: "delete", error: errorMessage(error) });
    }
  }

  function retryPackOperation() {
    if (state.retryAction === "repair") return repairPack();
    if (state.retryAction === "delete") return deletePack(true);
    return installPack();
  }

  function selectTranslation(translation: ContextTranslationId) {
    dispatch({ type: "SELECT_TRANSLATION", translation });
  }

  function selectTab(tab: ContextLensTab) {
    dispatch({ type: "SELECT_TAB", tab });
  }

  function handleTabsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = Math.max(0, STUDY_TABS.findIndex((tab) => tab.id === state.activeTab));
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? STUDY_TABS.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + STUDY_TABS.length) % STUDY_TABS.length;
    selectTab(STUDY_TABS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => !item.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1) ?? first;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const amharicAvailable = state.packStatus === "installed" && Boolean(state.amharicRecord);
  const activeTranslation = state.activeTranslation === "amharic-zain" && state.amharicRecord
    ? state.amharicRecord.translation
    : englishTranslation;
  const activeSource = state.activeTranslation === "amharic-zain" ? AMHARIC_SOURCE : ENGLISH_SOURCE;
  const progress = state.progress;
  const operationLabel = state.operation === "delete" ? "Deleting Amharic pack…" : state.operation === "verify" ? "Verifying installed pack…" : progress?.message ?? "Preparing verified translation pack…";

  return (
    <section
      ref={dialogRef}
      className="panel-shell context-lens-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="context-lens-title"
      aria-describedby="context-lens-description"
      onKeyDown={handleDialogKeyDown}
    >
      <div className="context-sheet-handle" aria-hidden="true" />
      <header>
        <div><span className="panel-kicker">AYAH STUDY · PAGE {page}</span><h2 id="context-lens-title">Ayah Study Lens</h2></div>
        <button ref={closeRef} type="button" className="panel-close" onClick={onClose} aria-label="Close Ayah Study Lens">×</button>
      </header>

      <div className="context-lens-scroll">
        <section className="context-identity" aria-label={`Sūrah ${surahNumber}, ayah ${verseKey.split(":")[1]}`}>
          <div><span>SŪRAH {surahNumber}</span><strong>{surahName}</strong><small>{surahMeaning}</small></div>
          <div className="context-location"><span><small>AYAH</small><strong>{verseKey}</strong></span><span><small>PAGE</small><strong>{page}</strong></span><span><small>JUZ</small><strong>{juz}</strong></span><span><small>HIZB</small><strong>{hizb}</strong></span></div>
        </section>

        <section className="context-arabic" aria-labelledby="verified-arabic-title">
          <div><span id="verified-arabic-title">VERIFIED ARABIC AYAH</span><small>Madani Mushaf · Hafs · Quran Foundation</small></div>
          <p lang="ar" dir="rtl" translate="no">{arabic}</p>
          <small id="context-lens-description">Arabic text and page position remain anchored to the selected ayah.</small>
        </section>

        <nav className="study-ayah-navigation" aria-label="Move between ayat in the Study Lens">
          <button type="button" onClick={() => onMoveAyah(-1)} disabled={!canMovePrevious} aria-label="Previous ayah in Study Lens">‹ Previous ayah</button>
          <strong>Ayah {verseKey}</strong>
          <button type="button" onClick={() => onMoveAyah(1)} disabled={!canMoveNext} aria-label="Next ayah in Study Lens">Next ayah ›</button>
        </nav>

        <div className="context-tabs" role="tablist" aria-label="Ayah context sections" onKeyDown={handleTabsKeyDown}>
          {STUDY_TABS.map((tab, index) => <button ref={(node) => { tabRefs.current[index] = node; }} type="button" role="tab" id={`context-${tab.id}-tab`} aria-selected={state.activeTab === tab.id} aria-controls={`context-${tab.id}-panel`} tabIndex={state.activeTab === tab.id ? 0 : -1} onClick={() => selectTab(tab.id)} key={tab.id}>{tab.label}</button>)}
        </div>

        {state.activeTab === "overview" && (
          <div className="context-tab-panel" id="context-overview-panel" role="tabpanel" aria-labelledby="context-overview-tab">
            <div className="study-section-heading"><span>TRANSLATION</span><h3>Meaning for the selected ayah</h3><p>The translation is an annotation layer and never changes the Mushaf text or line geometry.</p></div>
            <label className="context-translation-select" htmlFor="context-translation-choice"><span>TRANSLATION</span><select id="context-translation-choice" value={state.activeTranslation} onChange={(event) => selectTranslation(event.target.value as ContextTranslationId)} aria-describedby="translation-availability"><option value="english-saheeh">English · Saheeh International</option><option value="amharic-zain" disabled={!amharicAvailable}>Amharic · Muhammad Zain Zahruddin{amharicAvailable ? "" : " · download required"}</option></select></label>
            <p className={`context-translation-copy ${state.activeTranslation === "amharic-zain" ? "amharic-copy" : ""}`} lang={state.activeTranslation === "amharic-zain" ? "am" : "en"} dir="ltr">{activeTranslation || "This translation is temporarily unavailable for the selected ayah."}</p>
            {state.amharicRecord?.footnotes && state.activeTranslation === "amharic-zain" && <p className="context-footnotes" lang="am">{state.amharicRecord.footnotes}</p>}
            <p className="context-selection-note" id="translation-availability">{amharicAvailable ? "The Amharic option is available because all 6,236 ayat passed checksum verification." : "Amharic stays unavailable until its complete checksum-verified pack is installed."}</p>
            {state.selectionBlocked && <p className="context-inline-warning" role="alert">Install and verify the complete Amharic pack before selecting it.</p>}

            <section className="context-source-card" aria-label="Selected translation attribution">
              <span>SOURCE, EDITION &amp; ATTRIBUTION</span>
              <dl>
                <div><dt>Source</dt><dd>{activeSource?.provider.name ?? CONTENT_MANIFEST.resources.translation.source}</dd></div>
                <div><dt>Translator</dt><dd>{activeSource?.translator.join(", ") ?? CONTENT_MANIFEST.resources.translation.author}</dd></div>
                <div><dt>Publisher</dt><dd>{activeSource?.publisher ?? "Saheeh International"}</dd></div>
                <div><dt>Edition</dt><dd>{activeSource?.edition.name ?? CONTENT_MANIFEST.resources.translation.edition}{activeSource?.edition.version ? ` · ${activeSource.edition.version}` : ""}</dd></div>
              </dl>
              <p>{activeSource?.license.attribution ?? CONTENT_MANIFEST.resources.translation.attribution}</p>
              {activeSource && <a href={activeSource.provider.sourceUrl} target="_blank" rel="noreferrer">View source catalog</a>}
            </section>

            <section className={`context-pack-card status-${state.packStatus}`} aria-label="Amharic translation pack controls">
              <header><div><span>AMHARIC OFFLINE PACK</span><strong>{state.packStatus === "installed" ? "Verified and ready" : state.packStatus === "reclaimed" ? "Storage reclaimed" : state.packStatus === "failed" ? "Action needed" : state.packStatus === "working" ? "Working securely" : state.packStatus === "checking" ? "Checking this device" : "Not installed"}</strong></div><span className="context-pack-badge">{state.packStatus === "installed" ? "6,236 / 6,236" : state.packStatus === "working" ? `${progress?.percent ?? 0}%` : "v1.0.1"}</span></header>

              {state.packStatus === "checking" && <p role="status">Checking this browser for a complete verified pack…</p>}
              {state.packStatus === "not-installed" && <><p>Download the immutable QuranEnc `amharic_zain` pack. English remains online and unchanged.</p><button type="button" className="context-primary" onClick={installPack}>Download verified Amharic pack</button></>}
              {state.packStatus === "working" && <div className="context-pack-progress" role="status"><div role="progressbar" aria-label="Amharic pack installation progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress?.percent ?? 0} aria-valuetext={operationLabel}><span style={{ width: `${progress?.percent ?? (state.operation === "delete" ? 55 : 12)}%` }} /></div><strong>{operationLabel}</strong><small>{progress?.completedRecords ? `${progress.completedRecords.toLocaleString("en-US")} of ${progress.totalRecords.toLocaleString("en-US")} ayat checked` : "The active translation will not change until verification completes."}</small></div>}
              {state.packStatus === "installed" && <><p>Revision {state.pack?.editionRevision} · normalized SHA-256 {state.pack?.normalizedChecksum.slice(0, 12)}…</p><div className="context-pack-actions"><button type="button" onClick={verifyPack}>Verify</button><button type="button" onClick={repairPack}>Repair</button><button type="button" className={state.deleteArmed ? "confirm-delete" : ""} onClick={() => deletePack()}>{state.deleteArmed ? "Confirm delete" : "Delete"}</button>{state.deleteArmed && <button type="button" onClick={() => dispatch({ type: "CANCEL_DELETE" })}>Cancel</button>}</div></>}
              {state.packStatus === "reclaimed" && <div className="context-storage-warning" role="alert"><strong>Browser storage removed the installed Amharic pack.</strong><p>English remains available. Repair downloads and verifies the pinned pack again.</p><button type="button" className="context-primary" onClick={repairPack}>Repair Amharic pack</button></div>}
              {state.packStatus === "failed" && <div className="context-pack-error" role="alert"><strong>The Amharic pack action failed.</strong><p>{state.error}</p><button type="button" className="context-primary" onClick={retryPackOperation}>{state.retryAction === "repair" ? "Retry repair" : state.retryAction === "delete" ? "Retry deletion" : "Retry installation"}</button></div>}
            </section>
          </div>
        )}

        {state.activeTab === "words" && (
          <div className="context-tab-panel" id="context-words-panel" role="tabpanel" aria-labelledby="context-words-tab">
            <div className="study-section-heading"><span>QURAN WORDS</span><h3>Word study</h3><p>Select a word on the Mushaf page to inspect source-approved metadata here.</p></div>
            {!selectedWord && <div className="study-unavailable" role="status"><strong>No word is selected.</strong><p>Close the Lens and select a word on the verified Mushaf page. Ayah-end markers select the ayah without inventing a word coordinate.</p></div>}
            {selectedWord && <section className="word-context" aria-labelledby="selected-word-title">
              <header><div><span>AYAH {selectedWord.coordinate.verseKey} · WORD {selectedWord.coordinate.wordPosition}</span><h3 id="selected-word-title" lang="ar" dir="rtl" translate="no">{selectedWord.surfaceText}</h3></div><small>Page {selectedWord.coordinate.page} · line {selectedWord.coordinate.line}</small></header>
              {wordStudyLoading && <div className="word-study-status" role="status">Checking the approved word-study source…</div>}
              {!wordStudyLoading && wordRecord && <div className="word-study-fields">
                {wordRecord.meanings?.length ? <div><span>MEANING</span>{wordRecord.meanings.map((meaning, index) => <p lang={meaning.language} key={`${meaning.language}-${index}`}>{meaning.text}</p>)}</div> : null}
                {wordRecord.transliteration && <div><span>TRANSLITERATION</span><p>{wordRecord.transliteration}</p></div>}
                {wordRecord.lemma && <div><span>LEMMA</span><p lang="ar" dir="rtl">{wordRecord.lemma.arabic}</p></div>}
                {wordRecord.root && <div><span>ROOT</span><p lang="ar" dir="rtl">{wordRecord.root.letters.join(" ")}</p></div>}
                {wordRecord.morphology?.partOfSpeech && <div><span>PART OF SPEECH</span><p>{wordRecord.morphology.partOfSpeech}</p></div>}
                {wordRecord.morphology?.grammaticalDescription && <div><span>MORPHOLOGY</span><p>{wordRecord.morphology.grammaticalDescription}</p></div>}
              </div>}
              {!wordStudyLoading && !wordRecord && <div className="study-unavailable" role="status"><strong>No approved metadata is available for this word.</strong><p>Meaning, transliteration, lemma, root, morphology, and occurrence actions are omitted. The word remains anchored to its verified ayah coordinate.</p></div>}
              {selectedWord.tajweedRules.length > 0 && <section className="word-tajweed" aria-label="Tajweed for selected word"><span>TAJWEED</span>{selectedWord.tajweedRules.map((rule) => <div key={rule.id}><i className={`rule-swatch rule-${rule.id}`} aria-hidden="true" /><p><strong>{rule.name}</strong><small>{rule.instruction}</small></p></div>)}</section>}
              <div className="word-context-actions"><button type="button" className="context-primary" onClick={onHearWordInAyah}>{playing ? "Pause ayah" : "Hear in Ayah"}</button>{wordRecord?.lemma && <button type="button" onClick={() => onExploreLemma(wordRecord.lemma!.id, wordRecord.lemma!.arabic)}>See lemma occurrences</button>}{wordRecord?.root && <button type="button" onClick={() => onExploreRoot(wordRecord.root!.id, wordRecord.root!.letters.join(" "))}>See root occurrences</button>}</div>
              {wordRecord && wordStudySource && <details className="word-source"><summary>Source and attribution</summary><dl><div><dt>Provider</dt><dd>{wordStudySource.provider}</dd></div><div><dt>Dataset</dt><dd>{wordStudySource.dataset}</dd></div><div><dt>Edition</dt><dd>{wordStudySource.edition} · {wordStudySource.version}</dd></div><div><dt>Revision</dt><dd>{wordStudySource.revision}</dd></div></dl><p>{wordStudySource.license.attribution}</p><a href={wordStudySource.sourceUrl} target="_blank" rel="noreferrer">View source</a></details>}
              {occurrenceExplorer && <OccurrenceExplorer key={`${occurrenceExplorer.kind}:${occurrenceExplorer.identifier}`} explorer={occurrenceExplorer} surahNumber={surahNumber} onOpen={onOpenOccurrence} onClose={onCloseOccurrences} />}
            </section>}
          </div>
        )}

        {state.activeTab === "tafsir" && (
          <div className="context-tab-panel context-tafsir-panel" id="context-tafsir-panel" role="tabpanel" aria-labelledby="context-tafsir-tab">
            <div className="study-section-heading"><span>IBN KATHIR · ABRIDGED</span><h3>{tafsirDocument?.sectionLabel ?? `Tafsir for ayah ${verseKey}`}</h3><p>The existing verified tafsir source and normalization are reused here.</p></div>
            {tafsirLoading && <div className="tafsir-state" role="status"><span className="tafsir-loader" /><strong>Opening verified commentary…</strong><small>The Arabic page remains unchanged.</small></div>}
            {!tafsirLoading && tafsirError && <div className="tafsir-state tafsir-error" role="alert"><strong>Tafsir is unavailable for this ayah.</strong><small>{tafsirError}</small><button type="button" onClick={onRetryTafsir}>Try again</button></div>}
            {!tafsirLoading && !tafsirError && tafsirDocument && <article className="tafsir-passage" aria-label={`${tafsirDocument.resource.name} for ${tafsirDocument.sectionLabel}`}>{tafsirDocument.mappedVerseKeys.length > 1 && <p className="tafsir-mapping">This source comments on {tafsirDocument.sectionLabel.toLowerCase()} as one section.</p>}{tafsirDocument.blocks.map((block, index) => block.type === "heading" ? <h3 key={index}>{block.text}</h3> : block.type === "quote" ? <blockquote key={index} dir="auto">{block.text}</blockquote> : block.type === "list-item" ? <p className="tafsir-list-item" key={index} dir="auto"><span aria-hidden="true">◆</span>{block.text}</p> : <p key={index} dir="auto">{block.text}</p>)}</article>}
            <footer className="tafsir-source"><span>SOURCE &amp; EDITION</span><strong>{tafsirDocument?.resource.name ?? "Ibn Kathir (Abridged)"} · Hafiz Ibn Kathir</strong><p>English resource 169 supplied through Quran Foundation/Quran.com. Upstream content terms apply; Mushaf Companion does not relicense or translate this commentary.</p>{tafsirDocument && <small>Revision {tafsirDocument.provenance.sourceRevision} · SHA-256 {tafsirDocument.provenance.contentChecksum.slice(0, 12)}… · <a href={tafsirDocument.resource.sourceUrl} target="_blank" rel="noreferrer">view source catalog</a></small>}</footer>
          </div>
        )}

        {state.activeTab === "practice" && (
          <div className="context-tab-panel" id="context-practice-panel" role="tabpanel" aria-labelledby="context-practice-tab">
            <div className="study-section-heading"><span>LISTEN &amp; MEMORIZE</span><h3>Practice this ayah</h3><p>These controls use the reader&apos;s existing audio, Tajweed, and My Mushaf state.</p></div>
            <div className="study-practice-grid">
              <button type="button" className="study-practice-primary" onClick={onTogglePlay}><span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span><strong>{playing ? "Pause ayah" : "Hear this ayah"}</strong><small>{playing ? "Pause the current recitation" : "Play in the existing ayah audio player"}</small></button>
              <button type="button" className={memorized ? "active" : ""} onClick={onToggleMemorized} aria-pressed={memorized}><span aria-hidden="true">✓</span><strong>{memorized ? "Marked memorized" : "Mark memorized"}</strong><small>Update the existing My Mushaf map</small></button>
              <button type="button" className={tajweedEnabled ? "active" : ""} onClick={onToggleTajweed} aria-pressed={tajweedEnabled}><span className="tajweed-dot" aria-hidden="true" /><strong>{tajweedEnabled ? "Tajweed is on" : "Tajweed is off"}</strong><small>Toggle the page&apos;s existing Tajweed layer</small></button>
              <button type="button" onClick={onOpenTajweedGuide}><span aria-hidden="true">?</span><strong>Open Tajweed guide</strong><small>Review the verified color explanations</small></button>
            </div>
            <button type="button" className="context-primary study-open-hifz" onClick={onOpenHifz}>Open My Mushaf practice</button>
          </div>
        )}
      </div>
    </section>
  );
}
