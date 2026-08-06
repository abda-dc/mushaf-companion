"use client";

import type { TafsirDocument } from "./tafsir-source.mjs";

interface TafsirPanelProps {
  document: TafsirDocument | null;
  loading: boolean;
  error: string;
  verseKey: string;
  arabic: string;
  translation: string;
  canMovePrevious: boolean;
  canMoveNext: boolean;
  onMove: (direction: -1 | 1) => void;
  onRetry: () => void;
  onClose: () => void;
}

export function TafsirPanel({ document, loading, error, verseKey, arabic, translation, canMovePrevious, canMoveNext, onMove, onRetry, onClose }: TafsirPanelProps) {
  return (
    <section className="panel-shell tafsir-panel" role="dialog" aria-modal="true" aria-labelledby="tafsir-title">
      <header>
        <div><span className="panel-kicker">STUDY · AYAH {verseKey}</span><h2 id="tafsir-title">Ibn Kathir <small>Abridged</small></h2></div>
        <button type="button" className="panel-close" onClick={onClose} aria-label="Close tafsir">×</button>
      </header>
      <div className="tafsir-content">
        <section className="tafsir-verse-context" aria-label={`Selected ayah ${verseKey}`}>
          <span>SELECTED AYAH · {verseKey}</span>
          <p lang="ar" dir="rtl" translate="no">{arabic}</p>
          <small>{translation || "Saheeh International translation is temporarily unavailable for this ayah."}</small>
        </section>
        <nav className="tafsir-navigation" aria-label="Move between ayat in tafsir">
          <button type="button" onClick={() => onMove(-1)} disabled={!canMovePrevious} aria-label="Previous ayah in tafsir">‹ Previous ayah</button>
          <span>{document?.sectionLabel ?? `Ayah ${verseKey}`}</span>
          <button type="button" onClick={() => onMove(1)} disabled={!canMoveNext} aria-label="Next ayah in tafsir">Next ayah ›</button>
        </nav>
        {loading && <div className="tafsir-state" role="status"><span className="tafsir-loader" /><strong>Opening verified commentary…</strong><small>The Arabic page remains unchanged.</small></div>}
        {!loading && error && <div className="tafsir-state tafsir-error" role="alert"><strong>Tafsir is unavailable for this ayah.</strong><small>{error}</small><button type="button" onClick={onRetry}>Try again</button></div>}
        {!loading && !error && document && (
          <article className="tafsir-passage" aria-label={`${document.resource.name} for ${document.sectionLabel}`}>
            {document.mappedVerseKeys.length > 1 && <p className="tafsir-mapping">This source comments on {document.sectionLabel.toLowerCase()} as one section.</p>}
            {document.blocks.map((block, index) => block.type === "heading"
              ? <h3 key={index}>{block.text}</h3>
              : block.type === "quote"
                ? <blockquote key={index} dir="auto">{block.text}</blockquote>
                : block.type === "list-item"
                  ? <p className="tafsir-list-item" key={index} dir="auto"><span aria-hidden="true">◆</span>{block.text}</p>
                  : <p key={index} dir="auto">{block.text}</p>)}
          </article>
        )}
        <footer className="tafsir-source">
          <span>SOURCE &amp; EDITION</span>
          <strong>{document?.resource.name ?? "Ibn Kathir (Abridged)"} · Hafiz Ibn Kathir</strong>
          <p>English resource 169 supplied through Quran Foundation/Quran.com. Upstream content terms apply; Mushaf Companion does not relicense this commentary.</p>
          {document && <small>Revision {document.provenance.sourceRevision} · SHA-256 {document.provenance.contentChecksum.slice(0, 12)}… · <a href={document.resource.sourceUrl} target="_blank" rel="noreferrer">view source catalog</a></small>}
        </footer>
      </div>
    </section>
  );
}
