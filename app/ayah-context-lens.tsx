"use client";

import { useCallback, useEffect, useReducer, useRef, type KeyboardEvent } from "react";
import { CONTENT_MANIFEST } from "./content-manifest";
import { findTranslationSource } from "./content/source-registry";
import type { TafsirDocument } from "./tafsir-source.mjs";
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
  canMovePrevious: boolean;
  canMoveNext: boolean;
  onMoveTafsir: (direction: -1 | 1) => void;
  onRetryTafsir: () => void;
  onClose: () => void;
}

const AMHARIC_SOURCE = findTranslationSource(AMHARIC_TRANSLATION_SOURCE_ID);
const ENGLISH_SOURCE = findTranslationSource("quran-foundation:translation:20");
const FOCUSABLE = "button:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The translation pack operation could not be completed.";
}

export function AyahContextLens({
  service,
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
  canMovePrevious,
  canMoveNext,
  onMoveTafsir,
  onRetryTafsir,
  onClose,
}: AyahContextLensProps) {
  const [state, dispatch] = useReducer(contextLensReducer, undefined, createContextLensState);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const translationTabRef = useRef<HTMLButtonElement>(null);
  const tafsirTabRef = useRef<HTMLButtonElement>(null);

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
    loadPack().catch(() => undefined);
    closeRef.current?.focus();
  }, [loadPack]);

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
    const next = event.key === "Home" || event.key === "ArrowLeft" ? "translation" : "tafsir";
    selectTab(next);
    (next === "translation" ? translationTabRef : tafsirTabRef).current?.focus();
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
        <div><span className="panel-kicker">AYAH CONTEXT · PAGE {page}</span><h2 id="context-lens-title">Ayah Context Lens</h2></div>
        <button ref={closeRef} type="button" className="panel-close" onClick={onClose} aria-label="Close Ayah Context Lens">×</button>
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

        <div className="context-tabs" role="tablist" aria-label="Ayah context sections" onKeyDown={handleTabsKeyDown}>
          <button ref={translationTabRef} type="button" role="tab" id="context-translation-tab" aria-selected={state.activeTab === "translation"} aria-controls="context-translation-panel" tabIndex={state.activeTab === "translation" ? 0 : -1} onClick={() => selectTab("translation")}>Translation</button>
          <button ref={tafsirTabRef} type="button" role="tab" id="context-tafsir-tab" aria-selected={state.activeTab === "tafsir"} aria-controls="context-tafsir-panel" tabIndex={state.activeTab === "tafsir" ? 0 : -1} onClick={() => selectTab("tafsir")}>Ibn Kathir tafsir</button>
        </div>

        {state.activeTab === "translation" && (
          <div className="context-tab-panel" id="context-translation-panel" role="tabpanel" aria-labelledby="context-translation-tab">
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
              {state.packStatus === "installed" && <><p>Revision {state.pack?.editionRevision} · normalized SHA-256 {state.pack?.normalizedChecksum.slice(0, 12)}…</p><div className="context-pack-actions"><button type="button" onClick={verifyPack}>Verify</button><button type="button" onClick={repairPack}>Repair</button><button type="button" className={state.deleteArmed ? "confirm-delete" : ""} onClick={deletePack}>{state.deleteArmed ? "Confirm delete" : "Delete"}</button>{state.deleteArmed && <button type="button" onClick={() => dispatch({ type: "CANCEL_DELETE" })}>Cancel</button>}</div></>}
              {state.packStatus === "reclaimed" && <div className="context-storage-warning" role="alert"><strong>Browser storage removed the installed Amharic pack.</strong><p>English remains available. Repair downloads and verifies the pinned pack again.</p><button type="button" className="context-primary" onClick={repairPack}>Repair Amharic pack</button></div>}
              {state.packStatus === "failed" && <div className="context-pack-error" role="alert"><strong>The Amharic pack action failed.</strong><p>{state.error}</p><button type="button" className="context-primary" onClick={retryPackOperation}>{state.retryAction === "repair" ? "Retry repair" : state.retryAction === "delete" ? "Retry deletion" : "Retry installation"}</button></div>}
            </section>
          </div>
        )}

        {state.activeTab === "tafsir" && (
          <div className="context-tab-panel context-tafsir-panel" id="context-tafsir-panel" role="tabpanel" aria-labelledby="context-tafsir-tab">
            <nav className="tafsir-navigation" aria-label="Move between ayat in Ayah Context Lens tafsir">
              <button type="button" onClick={() => onMoveTafsir(-1)} disabled={!canMovePrevious} aria-label="Previous ayah in tafsir">‹ Previous ayah</button>
              <span>{tafsirDocument?.sectionLabel ?? `Ayah ${verseKey}`}</span>
              <button type="button" onClick={() => onMoveTafsir(1)} disabled={!canMoveNext} aria-label="Next ayah in tafsir">Next ayah ›</button>
            </nav>
            {tafsirLoading && <div className="tafsir-state" role="status"><span className="tafsir-loader" /><strong>Opening verified commentary…</strong><small>The Arabic page remains unchanged.</small></div>}
            {!tafsirLoading && tafsirError && <div className="tafsir-state tafsir-error" role="alert"><strong>Tafsir is unavailable for this ayah.</strong><small>{tafsirError}</small><button type="button" onClick={onRetryTafsir}>Try again</button></div>}
            {!tafsirLoading && !tafsirError && tafsirDocument && <article className="tafsir-passage" aria-label={`${tafsirDocument.resource.name} for ${tafsirDocument.sectionLabel}`}>{tafsirDocument.mappedVerseKeys.length > 1 && <p className="tafsir-mapping">This source comments on {tafsirDocument.sectionLabel.toLowerCase()} as one section.</p>}{tafsirDocument.blocks.map((block, index) => block.type === "heading" ? <h3 key={index}>{block.text}</h3> : block.type === "quote" ? <blockquote key={index} dir="auto">{block.text}</blockquote> : block.type === "list-item" ? <p className="tafsir-list-item" key={index} dir="auto"><span aria-hidden="true">◆</span>{block.text}</p> : <p key={index} dir="auto">{block.text}</p>)}</article>}
            <footer className="tafsir-source"><span>SOURCE &amp; EDITION</span><strong>{tafsirDocument?.resource.name ?? "Ibn Kathir (Abridged)"} · Hafiz Ibn Kathir</strong><p>English resource 169 supplied through Quran Foundation/Quran.com. Upstream content terms apply; Mushaf Companion does not relicense or translate this commentary.</p>{tafsirDocument && <small>Revision {tafsirDocument.provenance.sourceRevision} · SHA-256 {tafsirDocument.provenance.contentChecksum.slice(0, 12)}… · <a href={tafsirDocument.resource.sourceUrl} target="_blank" rel="noreferrer">view source catalog</a></small>}</footer>
          </div>
        )}
      </div>
    </section>
  );
}
