"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  getCollectionForUi,
  getTopicForUi,
  listCollectionsForUi,
  resolveIslamicReferenceHadith,
  searchFoundationsLibrary,
  type CollectionReadinessState,
  type UiCollectionDetail,
  type UiTopicDetail,
} from "./islamic-foundations-ui-state.mjs";
import type {
  IslamicReferenceEntry,
  IslamicReferenceReadinessStatus,
} from "./islamic-reference-library.ts";

export type FoundationsView = "library" | "collection" | "topic";

export interface IslamicFoundationsPanelProps {
  initialCollectionId?: string | null;
  initialTopicId?: string | null;
  onNavigateToQuranVerse?: (verseKey: string) => void;
  onOpenHadithTarget?: (target: string) => void;
  onClose: () => void;
}

export function IslamicFoundationsPanel(props: IslamicFoundationsPanelProps) {
  const {
    initialCollectionId,
    initialTopicId,
    onNavigateToQuranVerse,
    onOpenHadithTarget,
    onClose,
  } = props;

  const panelRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const [view, setView] = useState<FoundationsView>("library");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hadithError, setHadithError] = useState<string | null>(null);

  const collections = listCollectionsForUi();

  // Initialize view from props if provided
  useEffect(() => {
    if (initialCollectionId && initialTopicId) {
      const topic = getTopicForUi(initialCollectionId, initialTopicId);
      if (topic) {
        setSelectedCollectionId(initialCollectionId);
        setSelectedTopicId(initialTopicId);
        setView("topic");
        setHadithError(null);
        return;
      }
    }
    if (initialCollectionId) {
      const col = getCollectionForUi(initialCollectionId);
      if (col) {
        setSelectedCollectionId(initialCollectionId);
        setSelectedTopicId(null);
        setView("collection");
        setHadithError(null);
        return;
      }
    }
  }, [initialCollectionId, initialTopicId]);

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
    const col = getCollectionForUi(collectionId);
    if (col) {
      setSelectedCollectionId(collectionId);
      setSelectedTopicId(null);
      setView("collection");
      setSearchQuery("");
      setHadithError(null);
      window.requestAnimationFrame(() => headingRef.current?.focus());
    }
  }

  function handleSelectTopic(topicId: string) {
    if (!selectedCollectionId) return;
    const topic = getTopicForUi(selectedCollectionId, topicId);
    if (topic && topic.status === "reference-ready") {
      setSelectedTopicId(topicId);
      setView("topic");
      setHadithError(null);
      window.requestAnimationFrame(() => headingRef.current?.focus());
    }
  }

  function handleBackToLibrary() {
    setView("library");
    setSelectedCollectionId(null);
    setSelectedTopicId(null);
    setSearchQuery("");
    setHadithError(null);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }

  function handleBackToCollection() {
    setView("collection");
    setSelectedTopicId(null);
    setHadithError(null);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }

  function handleOpenQuran(verseLocator: string) {
    if (onNavigateToQuranVerse) {
      // If locator is a range like "3:3-4", take the start verse "3:3"
      const primaryCoordinate = verseLocator.includes("-")
        ? verseLocator.split("-")[0]
        : verseLocator;
      onNavigateToQuranVerse(primaryCoordinate);
    }
  }

  function handleOpenHadith(ref: IslamicReferenceEntry) {
    const resolution = resolveIslamicReferenceHadith(ref);
    if (resolution.status === "resolved" && resolution.target) {
      setHadithError(null);
      if (onOpenHadithTarget) {
        onOpenHadithTarget(resolution.target);
      }
    } else {
      setHadithError(
        resolution.reason ??
          `Hadith citation '${ref.collection ?? "Hadith"} ${ref.locator}' could not be resolved internally.`
      );
    }
  }

  // Active details
  const activeCollection: UiCollectionDetail | null = selectedCollectionId
    ? getCollectionForUi(selectedCollectionId)
    : null;

  const activeTopic: UiTopicDetail | null =
    selectedCollectionId && selectedTopicId
      ? getTopicForUi(selectedCollectionId, selectedTopicId)
      : null;

  const searchResults = searchQuery.trim()
    ? searchFoundationsLibrary(searchQuery)
    : null;

  function renderStatusBadge(status: IslamicReferenceReadinessStatus | CollectionReadinessState) {
    if (status === "reference-ready" || status === "fully-ready") {
      return (
        <span className="foundations-badge badge-ready" role="status">
          <span className="badge-dot" aria-hidden="true" /> SOURCE-READY
        </span>
      );
    }
    if (status === "partially-ready") {
      return (
        <span className="foundations-badge badge-partial" role="status">
          <span className="badge-dot" aria-hidden="true" /> PARTIALLY READY
        </span>
      );
    }
    return (
      <span className="foundations-badge badge-planned" role="status">
        <span className="badge-dot" aria-hidden="true" /> PLANNED
      </span>
    );
  }

  function renderReferenceCard(ref: IslamicReferenceEntry, keyPrefix = "") {
    if (ref.type === "quran") {
      return (
        <article
          key={`${keyPrefix}-${ref.id}`}
          className="foundations-ref-card ref-quran"
        >
          <div className="ref-card-main">
            <div className="ref-card-header">
              <span className="ref-type-tag">QUR&apos;AN REFERENCE</span>
              <strong className="ref-title">Qur&apos;an {ref.locator}</strong>
            </div>
            <p className="ref-description">
              Primary revelation coordinate in the authenticated Madani Muṣḥaf.
            </p>
          </div>
          <div className="ref-card-action">
            <button
              type="button"
              className="foundations-action-button"
              onClick={() => handleOpenQuran(ref.locator)}
              aria-label={`Open Qur'an ${ref.locator} in reader`}
            >
              Open in Muṣḥaf <span aria-hidden="true">→</span>
            </button>
          </div>
        </article>
      );
    }

    if (ref.type === "hadith") {
      return (
        <article
          key={`${keyPrefix}-${ref.id}`}
          className="foundations-ref-card ref-hadith"
        >
          <div className="ref-card-main">
            <div className="ref-card-header">
              <span className="ref-type-tag">HADITH REFERENCE</span>
              <strong className="ref-title">
                {ref.collection} {ref.locator}
              </strong>
              {ref.grading && (
                <span className="ref-grading-tag">{ref.grading.label}</span>
              )}
            </div>
            <p className="ref-provenance">
              Verified through {ref.sourceName} · Provider record{" "}
              {ref.sourceRecordId}
            </p>
          </div>
          <div className="ref-card-action">
            <button
              type="button"
              className="foundations-action-button"
              onClick={() => handleOpenHadith(ref)}
              aria-label={`Open ${ref.collection} ${ref.locator} in Hadith Reader`}
            >
              Open in Hadith Reader <span aria-hidden="true">→</span>
            </button>
          </div>
        </article>
      );
    }

    if (ref.type === "scholarly") {
      return (
        <article
          key={`${keyPrefix}-${ref.id}`}
          className="foundations-ref-card ref-scholarly"
        >
          <div className="ref-card-main">
            <div className="ref-card-header">
              <span className="ref-type-tag">SCHOLARLY REFERENCE</span>
              <strong className="ref-title">{ref.title}</strong>
              <span className="ref-author">{ref.author}</span>
            </div>
            <p className="ref-locator">
              Section: <em>{ref.locator}</em>
            </p>
            <p className="ref-provenance">
              Source: {ref.sourceName} ({ref.responsibleOrganization})
            </p>
          </div>
          <div className="ref-card-action">
            <a
              href={ref.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="foundations-action-link"
              aria-label={`Open ${ref.title} on ${ref.sourceName} in new tab`}
            >
              Verified Source <span aria-hidden="true">↗</span>
            </a>
          </div>
        </article>
      );
    }

    return null;
  }

  return (
    <section
      ref={panelRef}
      className="panel-shell islamic-foundations-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="foundations-panel-title"
      onKeyDown={trapFocus}
    >
      {/* Top Panel Header */}
      <header className="foundations-panel-header">
        <div className="foundations-header-titles">
          <span className="panel-kicker">ISLAMIC FOUNDATIONS</span>
          <h2 id="foundations-panel-title" ref={headingRef} tabIndex={-1}>
            {view === "library"
              ? "Reference Library"
              : view === "collection" && activeCollection
              ? activeCollection.title
              : activeTopic
              ? activeTopic.title
              : "Reference Library"}
          </h2>
        </div>
        <div className="foundations-header-controls">
          {view !== "library" && (
            <button
              type="button"
              className="foundations-back-button"
              onClick={
                view === "topic" ? handleBackToCollection : handleBackToLibrary
              }
              aria-label={
                view === "topic"
                  ? `Back to ${activeCollection?.title ?? "collection"}`
                  : "Back to all collections"
              }
            >
              ‹ Back
            </button>
          )}
          <button
            type="button"
            className="panel-close"
            onClick={onClose}
            aria-label="Close Islamic Foundations"
            autoFocus={view === "library"}
          >
            ×
          </button>
        </div>
      </header>

      {/* Main Panel Content Area */}
      <div className="foundations-panel-content">
        {hadithError && (
          <div className="foundations-error-banner" role="alert">
            <span>⚠</span>
            <p>{hadithError}</p>
            <button
              type="button"
              onClick={() => setHadithError(null)}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* 1. LIBRARY BROWSER VIEW */}
        {view === "library" && (
          <div className="foundations-library-view">
            <section className="foundations-hero-card" aria-labelledby="foundations-hero-title">
              <div>
                <span className="hero-kicker">CORE ISLAMIC CURRICULUM</span>
                <h3 id="foundations-hero-title">
                  Curated primary evidence across 10 foundational collections
                </h3>
                <p>
                  Explore vetted Qur&apos;an coordinates, authenticated Hadith
                  citations resolving into the internal reader, and verified
                  scholarly texts. Truthfully organized by subject with explicit
                  readiness tracking.
                </p>
              </div>
              <div className="foundations-library-stats">
                <div>
                  <strong>10</strong>
                  <small>Collections</small>
                </div>
                <div>
                  <strong>12</strong>
                  <small>Topics Ready</small>
                </div>
                <div>
                  <strong>37</strong>
                  <small>Topics Planned</small>
                </div>
                <div>
                  <strong>57</strong>
                  <small>Vetted References</small>
                </div>
              </div>
            </section>

            {/* Local Search Bar */}
            <div className="foundations-search-bar">
              <label htmlFor="foundations-search-input" className="sr-only">
                Search Islamic Foundations
              </label>
              <input
                id="foundations-search-input"
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collections, topics, or citations…"
                aria-label="Search Islamic Foundations"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search query"
                >
                  ×
                </button>
              )}
            </div>

            {/* If Search Active */}
            {searchResults && (
              <section
                className="foundations-search-results-section"
                aria-label="Search results"
              >
                <div className="search-results-summary">
                  <h4>Search results for &ldquo;{searchQuery}&rdquo;</h4>
                  <small>
                    {searchResults.matchedCollections.length} collections ·{" "}
                    {searchResults.matchedTopics.length} topics
                  </small>
                </div>

                {searchResults.matchedCollections.length > 0 && (
                  <div className="search-group">
                    <h5>Matched Collections</h5>
                    <div className="foundations-collection-grid">
                      {searchResults.matchedCollections.map((col) => (
                        <button
                          type="button"
                          key={col.id}
                          className="foundations-collection-card"
                          onClick={() => handleSelectCollection(col.id)}
                        >
                          <header>
                            <strong>{col.title}</strong>
                            {renderStatusBadge(col.readinessState)}
                          </header>
                          <p>{col.description}</p>
                          <footer>
                            <small>{col.readinessLabel}</small>
                            <span aria-hidden="true">Explore →</span>
                          </footer>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.matchedTopics.length > 0 && (
                  <div className="search-group">
                    <h5>Matched Topics</h5>
                    <div className="foundations-topic-list">
                      {searchResults.matchedTopics.map((topic) => (
                        <article
                          key={topic.id}
                          className={`foundations-topic-card status-${topic.status}`}
                        >
                          <div className="topic-card-body">
                            <span className="topic-collection-tag">
                              {topic.collectionTitle}
                            </span>
                            <h4>{topic.title}</h4>
                            <p>{topic.description}</p>
                          </div>
                          <div className="topic-card-actions">
                            {renderStatusBadge(topic.status)}
                            {topic.status === "reference-ready" ? (
                              <button
                                type="button"
                                className="foundations-primary-action"
                                onClick={() => {
                                  setSelectedCollectionId(topic.collectionId);
                                  setSelectedTopicId(topic.id);
                                  setView("topic");
                                }}
                              >
                                View {topic.referencesCount} references →
                              </button>
                            ) : (
                              <span className="topic-planned-note">
                                Sources planned
                              </span>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.matchedCollections.length === 0 &&
                  searchResults.matchedTopics.length === 0 && (
                    <p className="foundations-empty-search">
                      No collections, topics, or references match &ldquo;
                      {searchQuery}&rdquo;.
                    </p>
                  )}
              </section>
            )}

            {/* Standard Collection Grid */}
            {!searchResults && (
              <section
                className="foundations-collection-grid-section"
                aria-label="All registered collections"
              >
                <div className="section-title-row">
                  <h3>All Core Collections</h3>
                  <small>Select any collection to view topics and references</small>
                </div>
                <div className="foundations-collection-grid">
                  {collections.map((col) => (
                    <button
                      type="button"
                      key={col.id}
                      className={`foundations-collection-card status-${col.readinessState}`}
                      onClick={() => handleSelectCollection(col.id)}
                    >
                      <header>
                        <strong>{col.title}</strong>
                        {renderStatusBadge(col.readinessState)}
                      </header>
                      <p>{col.description}</p>
                      <footer>
                        <small>{col.readinessLabel}</small>
                        <span className="card-arrow" aria-hidden="true">
                          →
                        </span>
                      </footer>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* 2. COLLECTION DETAIL VIEW */}
        {view === "collection" && activeCollection && (
          <div className="foundations-collection-view">
            <header className="collection-view-header">
              <div className="collection-view-meta">
                <span className="view-kicker">COLLECTION OVERVIEW</span>
                <h3>{activeCollection.title}</h3>
                <p>{activeCollection.description}</p>
              </div>
              <div className="collection-readiness-summary">
                {renderStatusBadge(activeCollection.readinessState)}
                <small>{activeCollection.readinessLabel}</small>
              </div>
            </header>

            {/* Collection-Level Overview References (if any) */}
            {activeCollection.overviewReferences.length > 0 && (
              <section
                className="foundations-overview-references-section"
                aria-labelledby="overview-references-title"
              >
                <header className="sub-section-header">
                  <div>
                    <span className="section-kicker">OVERVIEW SOURCES</span>
                    <h4 id="overview-references-title">
                      Collection-Level References ({activeCollection.overviewReferences.length})
                    </h4>
                  </div>
                  <small>Vetted sources supporting the collection overview</small>
                </header>
                <div className="foundations-reference-list">
                  {activeCollection.overviewReferences.map((ref) =>
                    renderReferenceCard(ref, "col-overview")
                  )}
                </div>
              </section>
            )}

            {/* Topics List */}
            <section
              className="foundations-topics-section"
              aria-labelledby="collection-topics-title"
            >
              <header className="sub-section-header">
                <div>
                  <span className="section-kicker">CURRICULUM TOPICS</span>
                  <h4 id="collection-topics-title">
                    Topics ({activeCollection.topics.length})
                  </h4>
                </div>
                <small>
                  {activeCollection.readyTopicsCount} source-ready ·{" "}
                  {activeCollection.plannedTopicsCount} planned
                </small>
              </header>

              <div className="foundations-topic-list">
                {activeCollection.topics.map((topic) => {
                  const isReady = topic.status === "reference-ready";
                  return (
                    <article
                      key={topic.id}
                      className={`foundations-topic-card status-${topic.status}`}
                    >
                      <div className="topic-card-body">
                        <h4>{topic.title}</h4>
                        <p>{topic.description}</p>
                        {!isReady && (
                          <p className="topic-planned-explainer">
                            Sources for this topic have not been activated yet.
                          </p>
                        )}
                      </div>
                      <div className="topic-card-actions">
                        {renderStatusBadge(topic.status)}
                        {isReady ? (
                          <button
                            type="button"
                            className="foundations-primary-action"
                            onClick={() => handleSelectTopic(topic.id)}
                            aria-label={`Open topic ${topic.title} with ${topic.referencesCount} references`}
                          >
                            Open references ({topic.referencesCount}) →
                          </button>
                        ) : (
                          <span
                            className="topic-planned-note"
                            aria-label="Topic planned"
                          >
                            Planned topic
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* 3. TOPIC DETAIL VIEW */}
        {view === "topic" && activeTopic && activeCollection && (
          <div className="foundations-topic-view">
            <header className="topic-view-header">
              <div className="topic-view-meta">
                <span className="view-kicker">
                  {activeCollection.title.toUpperCase()} · TOPIC
                </span>
                <h3>{activeTopic.title}</h3>
                <p>{activeTopic.description}</p>
              </div>
              <div className="topic-readiness-summary">
                {renderStatusBadge(activeTopic.status)}
                <small>{activeTopic.referencesCount} vetted references</small>
              </div>
            </header>

            {/* Reference Inventory Grouped by Type */}
            <div className="foundations-topic-references-container">
              {/* Qur'an References */}
              {activeTopic.groupedReferences.quran.length > 0 && (
                <section
                  className="foundations-reference-group-section"
                  aria-labelledby="topic-quran-title"
                >
                  <header className="group-header">
                    <div>
                      <span className="group-kicker">DIVINE REVELATION</span>
                      <h4 id="topic-quran-title">
                        Qur&apos;an References ({activeTopic.groupedReferences.quran.length})
                      </h4>
                    </div>
                    <small>Direct passages from the verified Madani Muṣḥaf</small>
                  </header>
                  <div className="foundations-reference-list">
                    {activeTopic.groupedReferences.quran.map((ref) =>
                      renderReferenceCard(ref, "topic-quran")
                    )}
                  </div>
                </section>
              )}

              {/* Hadith References */}
              {activeTopic.groupedReferences.hadith.length > 0 && (
                <section
                  className="foundations-reference-group-section"
                  aria-labelledby="topic-hadith-title"
                >
                  <header className="group-header">
                    <div>
                      <span className="group-kicker">PROPHETIC SUNNAH</span>
                      <h4 id="topic-hadith-title">
                        Hadith References ({activeTopic.groupedReferences.hadith.length})
                      </h4>
                    </div>
                    <small>
                      Authenticated traditions with internal reader resolution
                    </small>
                  </header>
                  <div className="foundations-reference-list">
                    {activeTopic.groupedReferences.hadith.map((ref) =>
                      renderReferenceCard(ref, "topic-hadith")
                    )}
                  </div>
                </section>
              )}

              {/* Scholarly References */}
              {activeTopic.groupedReferences.scholarly.length > 0 && (
                <section
                  className="foundations-reference-group-section"
                  aria-labelledby="topic-scholarly-title"
                >
                  <header className="group-header">
                    <div>
                      <span className="group-kicker">CLASSICAL SCHOLARSHIP</span>
                      <h4 id="topic-scholarly-title">
                        Scholarly References ({activeTopic.groupedReferences.scholarly.length})
                      </h4>
                    </div>
                    <small>
                      Verified external references from recognized scholarly works
                    </small>
                  </header>
                  <div className="foundations-reference-list">
                    {activeTopic.groupedReferences.scholarly.map((ref) =>
                      renderReferenceCard(ref, "topic-scholarly")
                    )}
                  </div>
                </section>
              )}
            </div>

            <footer className="topic-view-footer">
              <p>
                All references are source-vetted metadata citations connecting
                to primary texts and recognized scholarly resources.
              </p>
            </footer>
          </div>
        )}
      </div>
    </section>
  );
}
