"use client";

import {
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  getHadithCollection,
  listHadithCollections,
} from "./hadith-registry.mjs";
import {
  getHadithRecord,
  HADEETHENC_DATASET_MANIFEST,
  listHadithRecords,
} from "./hadith-content.mjs";
import {
  formatHadithTarget,
  parseHadithTarget,
  resolveHadithReference,
  searchHadithMetadata,
} from "./hadith-resolver.mjs";

export type HadithReaderView = "library" | "collection" | "reader";

export interface HadithReaderPanelProps {
  initialTarget?: string | null;
  initialCollectionId?: string | null;
  initialRecordId?: string | null;
  onClose: () => void;
}

interface InitialHadithState {
  view: HadithReaderView;
  selectedCollectionId: string | null;
  selectedRecordId: string | null;
  errorMessage: string | null;
}

function deriveInitialHadithState(
  initialTarget?: string | null,
  initialCollectionId?: string | null,
  initialRecordId?: string | null
): InitialHadithState {
  if (initialTarget) {
    const parsed = parseHadithTarget(initialTarget);
    if (parsed) {
      const resolution = resolveHadithReference(parsed);
      if (resolution.record) {
        return {
          view: "reader",
          selectedCollectionId: resolution.record.collectionId,
          selectedRecordId: resolution.record.id,
          errorMessage: null,
        };
      }
      return {
        view: "library",
        selectedCollectionId: null,
        selectedRecordId: null,
        errorMessage:
          resolution.reason ?? `Hadith target '${initialTarget}' could not be resolved.`,
      };
    }
    return {
      view: "library",
      selectedCollectionId: null,
      selectedRecordId: null,
      errorMessage: `Malformed Hadith target '${initialTarget}'.`,
    };
  }

  if (initialRecordId) {
    const record = getHadithRecord(initialRecordId);
    if (record) {
      return {
        view: "reader",
        selectedCollectionId: record.collectionId,
        selectedRecordId: record.id,
        errorMessage: null,
      };
    }
    return {
      view: "library",
      selectedCollectionId: null,
      selectedRecordId: null,
      errorMessage: null,
    };
  }

  if (initialCollectionId) {
    const col = getHadithCollection(initialCollectionId);
    if (col) {
      return {
        view: "collection",
        selectedCollectionId: col.id,
        selectedRecordId: null,
        errorMessage: null,
      };
    }
  }

  return {
    view: "library",
    selectedCollectionId: null,
    selectedRecordId: null,
    errorMessage: null,
  };
}

export function HadithReaderPanel(props: HadithReaderPanelProps) {
  const { initialTarget, initialCollectionId, initialRecordId, onClose } = props;

  const panelRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [initialState] = useState(() =>
    deriveInitialHadithState(initialTarget, initialCollectionId, initialRecordId)
  );

  const [view, setView] = useState<HadithReaderView>(initialState.view);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    initialState.selectedCollectionId
  );
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    initialState.selectedRecordId
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialState.errorMessage
  );

  const collections = listHadithCollections();
  const allRecords = listHadithRecords();

  // Map record counts by collection
  const recordCountByCollection = new Map<string, number>();
  for (const record of allRecords) {
    recordCountByCollection.set(
      record.collectionId,
      (recordCountByCollection.get(record.collectionId) ?? 0) + 1
    );
  }

  // Trap focus within the panel for accessibility
  function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const controls = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'
      ),
    ].filter((c) => c.isConnected && c.getAttribute("aria-hidden") !== "true");

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

  function handleSelectCollection(collectionId: string) {
    setSelectedCollectionId(collectionId);
    setView("collection");
    setSearchQuery("");
    setErrorMessage(null);
  }

  function handleOpenRecord(recordId: string) {
    const record = getHadithRecord(recordId);
    if (record) {
      setSelectedCollectionId(record.collectionId);
      setSelectedRecordId(record.id);
      setView("reader");
      setErrorMessage(null);
    }
  }

  function handleBackToLibrary() {
    setView("library");
    setSelectedCollectionId(null);
    setSelectedRecordId(null);
    setSearchQuery("");
    setErrorMessage(null);
  }

  function handleBackToCollection() {
    if (selectedCollectionId) {
      setView("collection");
      setSelectedRecordId(null);
    } else {
      handleBackToLibrary();
    }
  }

  // Active collection and record
  const currentCollection = selectedCollectionId
    ? getHadithCollection(selectedCollectionId)
    : null;
  const currentRecord = selectedRecordId
    ? getHadithRecord(selectedRecordId)
    : null;

  // Collection records
  const collectionRecords = currentCollection
    ? allRecords.filter((r) => r.collectionId === currentCollection.id)
    : [];

  // Search results (if searching)
  const searchResults = searchQuery.trim()
    ? searchHadithMetadata(searchQuery)
    : [];

  return (
    <div
      className="layer-backdrop hadith-layer"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={panelRef}
        className="panel-shell hadith-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hadith-panel-title"
        onKeyDown={trapFocus}
      >
        {/* Header */}
        <header className="hadith-header">
          <div>
            <span className="panel-kicker">
              {view === "reader" && currentRecord
                ? `${currentCollection?.displayName.toUpperCase() ?? "HADITH"} · ${currentRecord.canonicalNumber}`
                : view === "collection" && currentCollection
                ? currentCollection.displayName.toUpperCase()
                : "HADITH REFERENCE LIBRARY"}
            </span>
            <h2 id="hadith-panel-title">
              {view === "reader" && currentRecord
                ? currentRecord.canonicalLabel
                : view === "collection" && currentCollection
                ? currentCollection.displayName
                : "Hadith Library"}
            </h2>
          </div>
          <button
            type="button"
            className="panel-close"
            onClick={onClose}
            aria-label="Close Hadith Library"
            autoFocus
          >
            ×
          </button>
        </header>

        {/* Panel Content */}
        <div className="hadith-content">
          {errorMessage && (
            <div className="hadith-notice error-notice" role="alert">
              <strong>Notice</strong>
              <p>{errorMessage}</p>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                aria-label="Dismiss notice"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* VIEW 1: LIBRARY VIEW */}
          {view === "library" && (
            <div className="hadith-library-view">
              {/* Search Bar */}
              <div className="hadith-search-bar">
                <label htmlFor="hadith-search-input" className="sr-only">
                  Search Hadith Library
                </label>
                <input
                  id="hadith-search-input"
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by number (e.g. 8, 528), narrator (e.g. Umar), or collection…"
                  aria-label="Search Hadith Library"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="hadith-search-clear"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Search Results */}
              {searchQuery.trim().length > 0 ? (
                <section
                  className="hadith-search-results"
                  aria-label="Search Results"
                >
                  <div className="hadith-section-heading">
                    <span>
                      {searchResults.length}{" "}
                      {searchResults.length === 1 ? "result" : "results"} found
                    </span>
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="hadith-results-grid">
                      {searchResults.map((rec) => {
                        const col = getHadithCollection(rec.collectionId);
                        const trans = rec.text?.translations?.[0];
                        return (
                          <button
                            key={rec.id}
                            type="button"
                            className="hadith-search-result-card"
                            onClick={() => handleOpenRecord(rec.id)}
                            aria-label={`Open ${rec.canonicalLabel}`}
                          >
                            <div className="result-card-top">
                              <span className="collection-tag">
                                {col?.shortName ?? rec.collectionId}
                              </span>
                              <strong>{rec.canonicalLabel}</strong>
                            </div>
                            {rec.narrator && (
                              <small className="result-narrator">
                                Narrated by {rec.narrator}
                              </small>
                            )}
                            {trans && (
                              <p className="result-snippet">
                                {trans.text.length > 140
                                  ? `${trans.text.slice(0, 140)}…`
                                  : trans.text}
                              </p>
                            )}
                            <span className="result-action">Read Hadith →</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="hadith-empty-state">
                      No approved local Hadith records match “{searchQuery}”.
                    </p>
                  )}
                </section>
              ) : (
                /* Collections Browser */
                <section
                  className="hadith-collections-section"
                  aria-labelledby="hadith-collections-title"
                >
                  <div className="hadith-hero-banner">
                    <div>
                      <span className="banner-kicker">RIGHTS-VERIFIED EDITIONS</span>
                      <h3 id="hadith-collections-title">Primary Hadith Collections</h3>
                      <p>
                        Explore vetted Hadith records with authorized English translations
                        sourced from HadeethEnc.com (dataset {HADEETHENC_DATASET_MANIFEST.datasetVersion}) and complete cryptographic provenance.
                      </p>
                    </div>
                    <div className="hadith-hero-stat">
                      <strong>{allRecords.length}</strong>
                      <small>Hadith available locally</small>
                    </div>
                  </div>

                  <div className="hadith-collections-grid">
                    {collections.map((collection) => {
                      const count = recordCountByCollection.get(collection.id) ?? 0;
                      const hasRecords = count > 0;
                      return (
                        <article
                          key={collection.id}
                          className={`hadith-collection-card ${
                            hasRecords ? "has-records" : "empty-collection"
                          }`}
                        >
                          <header>
                            <div className="collection-names">
                              <h4>{collection.displayName}</h4>
                              <em lang="ar" dir="rtl" className="arabic-collection-name">
                                {collection.arabicName}
                              </em>
                            </div>
                            <span
                              className={`collection-count-badge ${
                                hasRecords ? "active-badge" : "pending-badge"
                              }`}
                            >
                              {hasRecords
                                ? `${count} Hadith available locally`
                                : "No approved local records yet"}
                            </span>
                          </header>
                          <p className="collection-summary">
                            {collection.id === "muslim"
                              ? "Compiled by Imam Muslim ibn al-Hajjaj. Includes key foundational narrations."
                              : collection.id === "bukhari"
                              ? "Compiled by Imam Muhammad al-Bukhari. Includes key foundational narrations."
                              : `Compiled by Imam ${collection.displayName}. Internally approved records will be added upon rights and text verification.`}
                          </p>
                          <button
                            type="button"
                            className="collection-open-button"
                            onClick={() => handleSelectCollection(collection.id)}
                            aria-label={`Open ${collection.displayName}`}
                          >
                            {hasRecords ? "Browse records →" : "View collection status →"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* VIEW 2: COLLECTION DETAIL VIEW */}
          {view === "collection" && currentCollection && (
            <div className="hadith-collection-view">
              <div className="hadith-view-nav">
                <button
                  type="button"
                  className="hadith-back-button"
                  onClick={handleBackToLibrary}
                  aria-label="Back to all collections"
                >
                  ← All Collections
                </button>
                <span className="collection-status-pill">
                  {collectionRecords.length > 0
                    ? `${collectionRecords.length} Hadith available locally`
                    : "No local records"}
                </span>
              </div>

              <div className="collection-view-header">
                <div>
                  <span className="collection-eyebrow">
                    COLLECTION · {currentCollection.shortName.toUpperCase()}
                  </span>
                  <h3>{currentCollection.displayName}</h3>
                  <em lang="ar" dir="rtl" className="collection-header-arabic">
                    {currentCollection.arabicName}
                  </em>
                </div>
              </div>

              {collectionRecords.length > 0 ? (
                <div className="collection-records-list">
                  {collectionRecords.map((record) => {
                    const trans = record.text?.translations?.[0];
                    return (
                      <article
                        key={record.id}
                        className="hadith-list-card"
                      >
                        <header>
                          <div>
                            <span className="record-number-tag">
                              HADITH {record.canonicalNumber}
                            </span>
                            <h4>{record.canonicalLabel}</h4>
                          </div>
                          <span className="activation-badge">
                            English translation available
                          </span>
                        </header>

                        {record.narrator && (
                          <div className="record-narrator-row">
                            <span>Narrated by</span>
                            <strong>{record.narrator}</strong>
                          </div>
                        )}

                        {trans && (
                          <p className="record-preview-snippet">
                            {trans.text.length > 200
                              ? `${trans.text.slice(0, 200)}…`
                              : trans.text}
                          </p>
                        )}

                        <div className="record-card-actions">
                          <button
                            type="button"
                            className="read-hadith-button"
                            onClick={() => handleOpenRecord(record.id)}
                            aria-label={`Read ${record.canonicalLabel}`}
                          >
                            Read complete Hadith <span aria-hidden="true">→</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-collection-view">
                  <span className="empty-collection-icon">◇</span>
                  <h4>No approved local records yet</h4>
                  <p>
                    No internally approved Hadith records have been added to{" "}
                    <strong>{currentCollection.displayName}</strong> yet.
                  </p>
                  <p className="neutral-note">
                    Mushaf Companion only ingests records with verified source
                    rights, pinned translations, and cryptographic checksums.
                    More source-verified records can be added as the Hadith library expands.
                  </p>
                  <button
                    type="button"
                    className="learn-primary"
                    onClick={handleBackToLibrary}
                  >
                    Return to Collections
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: HADITH READER VIEW */}
          {view === "reader" && currentRecord && (
            <div className="hadith-reader-view">
              <div className="hadith-view-nav">
                <button
                  type="button"
                  className="hadith-back-button"
                  onClick={handleBackToCollection}
                  aria-label={`Back to ${currentCollection?.displayName ?? "Collection"}`}
                >
                  ← {currentCollection?.displayName ?? "Back"}
                </button>
                <span className="hadith-target-tag">
                  {formatHadithTarget(currentRecord.collectionId, currentRecord.canonicalNumber)}
                </span>
              </div>

              {/* Reader Header */}
              <div className="reader-record-header">
                <div>
                  <span className="reader-collection-name">
                    {currentCollection?.displayName}
                  </span>
                  <h3>{currentRecord.canonicalLabel}</h3>
                </div>
                {currentCollection?.arabicName && (
                  <em lang="ar" dir="rtl" className="reader-arabic-collection">
                    {currentCollection.arabicName}
                  </em>
                )}
              </div>

              {/* Narrator */}
              {currentRecord.narrator && (
                <div className="reader-narrator-box">
                  <span>NARRATED BY</span>
                  <strong>{currentRecord.narrator}</strong>
                </div>
              )}

              {/* ENGLISH TRANSLATION SECTION */}
              <section
                className="reader-content-section english-section"
                aria-labelledby="english-translation-heading"
              >
                <header className="section-header">
                  <div>
                    <span>APPROVED TRANSLATION</span>
                    <h4 id="english-translation-heading">English</h4>
                  </div>
                  <span className="provenance-chip">
                    {currentRecord.text?.translations?.[0]?.attribution ?? "HadeethEnc.com"} · {currentRecord.text?.translations?.[0]?.version ?? HADEETHENC_DATASET_MANIFEST.datasetVersion}
                  </span>
                </header>

                {currentRecord.text?.translations &&
                currentRecord.text.translations.length > 0 ? (
                  <div className="hadith-translation-body">
                    {currentRecord.text.translations[0].text
                      .split("\n\n")
                      .map((paragraph, index) => (
                        <p key={index} className="hadith-text-paragraph">
                          {paragraph}
                        </p>
                      ))}
                  </div>
                ) : (
                  <p className="unavailable-text-notice">
                    English translation is not available internally for this record.
                  </p>
                )}
              </section>

              {/* ARABIC TEXT SECTION (Architectural Readiness) */}
              <section
                className="reader-content-section arabic-section"
                aria-labelledby="arabic-text-heading"
              >
                <header className="section-header">
                  <div>
                    <span>ARABIC TEXT</span>
                    <h4 id="arabic-text-heading">العربية</h4>
                  </div>
                  <span className="arabic-status-tag">Pending Review</span>
                </header>

                {currentRecord.text?.arabic ? (
                  <div className="hadith-arabic-body" dir="rtl" lang="ar">
                    <p>{currentRecord.text.arabic.text}</p>
                  </div>
                ) : (
                  <div className="arabic-unavailable-box">
                    <p>Arabic text is not yet available internally for this record.</p>
                    <small>
                      Arabic text requires scholarly review and rights verification
                      before internal activation.
                    </small>
                  </div>
                )}
              </section>

              {/* SOURCE & PROVENANCE SECTION */}
              <section
                className="reader-provenance-section"
                aria-labelledby="provenance-heading"
              >
                <header>
                  <div>
                    <span>PROVENANCE &amp; RIGHTS</span>
                    <h4 id="provenance-heading">Source Information</h4>
                  </div>
                </header>

                <dl className="provenance-grid">
                  <div>
                    <dt>Canonical reference</dt>
                    <dd>{currentRecord.canonicalLabel}</dd>
                  </div>
                  <div>
                    <dt>Collection</dt>
                    <dd>{currentCollection?.displayName ?? currentRecord.collectionId}</dd>
                  </div>
                  <div>
                    <dt>Canonical number</dt>
                    <dd>{currentRecord.canonicalNumber}</dd>
                  </div>
                  <div>
                    <dt>Translation source</dt>
                    <dd>
                      {currentRecord.text?.translations?.[0]?.attribution ?? "HadeethEnc.com"}
                    </dd>
                  </div>
                  <div>
                    <dt>Dataset version</dt>
                    <dd>
                      {currentRecord.text?.translations?.[0]?.version ?? HADEETHENC_DATASET_MANIFEST.datasetVersion}
                    </dd>
                  </div>
                  <div>
                    <dt>HadeethEnc record ID</dt>
                    <dd>
                      {currentRecord.sourceRecords?.[0]?.providerRecordId ?? "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt>Rights policy</dt>
                    <dd>Approved translation redistribution</dd>
                  </div>
                </dl>

                {currentRecord.sourceRecords?.[0]?.sourceUrl && (
                  <div className="external-source-action">
                    <a
                      href={currentRecord.sourceRecords[0].sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="open-source-link"
                      aria-label={`Open verified source for ${currentRecord.canonicalLabel} on HadeethEnc.com (opens in new tab)`}
                    >
                      Open verified source ↗
                    </a>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
