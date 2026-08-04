"use client";

import { useEffect, useRef, useState } from "react";
import {
  FALLBACK_PAGE,
  RECITERS,
  type QuranPage,
  type ReciterId,
  type SearchResult,
} from "./quran-data";

type NavItem = "Home" | "Read" | "Listen" | "Bookmarks" | "Search" | "Settings";
type RepeatMode = "off" | "ayah" | "range";
type PageEdge = "first" | "last" | null;

const TOTAL_PAGES = 604;
const NAV_ITEMS: Array<{ label: NavItem; glyph: string }> = [
  { label: "Home", glyph: "⌂" },
  { label: "Read", glyph: "▤" },
  { label: "Listen", glyph: "◖" },
  { label: "Bookmarks", glyph: "◇" },
  { label: "Search", glyph: "⌕" },
  { label: "Settings", glyph: "⚙" },
];

function clampPage(value: number) {
  return Math.min(TOTAL_PAGES, Math.max(1, Math.round(value)));
}

function audioUrl(reciter: ReciterId, verseKey: string) {
  const [chapter, ayah] = verseKey.split(":");
  const file = `${chapter.padStart(3, "0")}${ayah.padStart(3, "0")}.mp3`;
  if (reciter === "saad") return `https://everyayah.com/data/Ghamadi_40kbps/${file}`;
  const folder = reciter === "alafasy" ? "Alafasy" : "AbdulBaset/Murattal";
  return `https://verses.quran.foundation/${folder}/mp3/${file}`;
}

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function chapterForVerse(pageData: QuranPage, verseKey: string) {
  const chapterId = Number(verseKey.split(":")[0]);
  return pageData.chapters.find((chapter) => chapter.id === chapterId) ?? pageData.chapters[0];
}

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavItem>("Read");
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState<QuranPage>(FALLBACK_PAGE);
  const [jumpValue, setJumpValue] = useState("1");
  const [loadingPage, setLoadingPage] = useState(false);
  const [turnDirection, setTurnDirection] = useState<"next" | "previous" | "">("");
  const [tajweed, setTajweed] = useState(true);
  const [transliteration, setTransliteration] = useState(false);
  const [dark, setDark] = useState(false);
  const [selectedVerseKey, setSelectedVerseKey] = useState("1:1");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookmarkPanelOpen, setBookmarkPanelOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [reciter, setReciter] = useState<ReciterId>("alafasy");
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [rangeStart, setRangeStart] = useState("1:1");
  const [rangeEnd, setRangeEnd] = useState("1:7");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [audioExpanded, setAudioExpanded] = useState(false);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pageCacheRef = useRef(new Map<number, QuranPage>());
  const lastGoodPageRef = useRef(FALLBACK_PAGE);
  const pendingVerseRef = useRef<string | null>(null);
  const pendingEdgeRef = useRef<PageEdge>(null);

  const selectedVerse = pageData.verses.find((verse) => verse.key === selectedVerseKey) ?? pageData.verses[0];
  const currentChapter = chapterForVerse(pageData, selectedVerse?.key ?? "1:1");
  const currentVerseIndex = pageData.verses.findIndex((verse) => verse.key === selectedVerseKey);
  const currentBookmark = `${pageData.page}|${selectedVerseKey}`;
  const pageProgress = (pageData.page / TOTAL_PAGES) * 100;

  useEffect(() => {
    const urlPage = Number(new URL(window.location.href).searchParams.get("page"));
    const savedPage = Number(localStorage.getItem("mushaf:last-page") ?? "1");
    const initialPage = clampPage(Number.isInteger(urlPage) && urlPage >= 1 && urlPage <= TOTAL_PAGES ? urlPage : savedPage);
    const savedVerse = localStorage.getItem("mushaf:last-verse");
    const savedVersePage = Number(localStorage.getItem("mushaf:last-verse-page") ?? "0");
    const savedBookmarks = JSON.parse(localStorage.getItem("mushaf:bookmarks-v2") ?? "[]") as string[];
    pendingVerseRef.current = savedVersePage === initialPage ? savedVerse : null;
    setPage(initialPage);
    setJumpValue(String(initialPage));
    setBookmarks(savedBookmarks.filter((item) => /^\d{1,3}\|\d{1,3}:\d{1,3}$/.test(item)));
    setDark(localStorage.getItem("mushaf:theme") === "dark");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const cached = pageCacheRef.current.get(page);

    const applyPage = (data: QuranPage) => {
      if (cancelled) return;
      lastGoodPageRef.current = data;
      setPageData(data);
      setLoadingPage(false);
      setJumpValue(String(data.page));
      const requestedVerse = pendingVerseRef.current;
      const edge = pendingEdgeRef.current;
      const nextVerse = requestedVerse && data.verses.some((verse) => verse.key === requestedVerse)
        ? requestedVerse
        : edge === "last"
          ? data.verses.at(-1)?.key
          : data.verses[0]?.key;
      if (nextVerse) setSelectedVerseKey(nextVerse);
      setRangeStart(data.verses[0]?.key ?? "");
      setRangeEnd(data.verses.at(-1)?.key ?? "");
      pendingVerseRef.current = null;
      pendingEdgeRef.current = null;
      localStorage.setItem("mushaf:last-page", String(data.page));
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("page", String(data.page));
      window.history.replaceState(null, "", nextUrl);
      window.setTimeout(() => setTurnDirection(""), 420);
    };

    if (cached) {
      applyPage(cached);
      return () => { cancelled = true; };
    }

    setLoadingPage(true);
    fetch(`/api/pages/${page}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Page unavailable");
        return response.json() as Promise<QuranPage>;
      })
      .then((data) => {
        pageCacheRef.current.set(page, data);
        applyPage(data);
        [page - 1, page + 1].filter((item) => item >= 1 && item <= TOTAL_PAGES && !pageCacheRef.current.has(item)).forEach((item) => {
          fetch(`/api/pages/${item}`).then((response) => response.ok ? response.json() as Promise<QuranPage> : null).then((next) => {
            if (next) pageCacheRef.current.set(item, next);
          }).catch(() => undefined);
        });
      })
      .catch(() => {
        if (cancelled) return;
        const previous = lastGoodPageRef.current;
        setPage(previous.page);
        setJumpValue(String(previous.page));
        setLoadingPage(false);
        setTurnDirection("");
        setNotice("Verified page data is temporarily unavailable. Your last confirmed page is still open.");
      });
    return () => { cancelled = true; };
  }, [page, hydrated]);

  useEffect(() => {
    if (!hydrated || !selectedVerseKey) return;
    localStorage.setItem("mushaf:last-verse", selectedVerseKey);
    localStorage.setItem("mushaf:last-verse-page", String(pageData.page));
    localStorage.setItem("mushaf:bookmarks-v2", JSON.stringify(bookmarks));
    localStorage.setItem("mushaf:theme", dark ? "dark" : "light");
  }, [selectedVerseKey, pageData.page, bookmarks, dark, hydrated]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedVerseKey) return;
    audio.load();
    setProgress(0);
    setDuration(0);
    if (playing) audio.play().catch(() => setPlaying(false));
  }, [selectedVerseKey, reciter]);

  useEffect(() => {
    if (!searchOpen) return;
    if (!search.trim()) {
      setSearchResults(pageData.verses.slice(0, 10).map((verse) => ({
        id: `current-${verse.key}`,
        type: "verse",
        label: `Ayah ${verse.key}`,
        detail: verse.transliteration || `Current page · ${currentChapter?.name ?? "Quran"}`,
        arabic: verse.uthmani,
        page: pageData.page,
        verseKey: verse.key,
      })));
      return;
    }
    const timer = window.setTimeout(() => {
      setSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(search)}`)
        .then(async (response) => {
          if (!response.ok) throw new Error("Search unavailable");
          return response.json() as Promise<{ results: SearchResult[] }>;
        })
        .then((payload) => setSearchResults(payload.results))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 320);
    return () => window.clearTimeout(timer);
  }, [search, searchOpen, pageData, currentChapter?.name]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (searchOpen || bookmarkPanelOpen || loadingPage) return;
      const target = event.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        goToPage(page + 1, "next");
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goToPage(page - 1, "previous");
      }
      if (event.key === "Home") {
        event.preventDefault();
        goToPage(1, "previous");
      }
      if (event.key === "End") {
        event.preventDefault();
        goToPage(TOTAL_PAGES, "next");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [page, searchOpen, bookmarkPanelOpen, loadingPage]);

  function goToPage(target: number, direction?: "next" | "previous", verseKey?: string, keepPlaying = false) {
    const next = clampPage(target);
    if (next === pageData.page && !verseKey) return;
    if (!keepPlaying) {
      audioRef.current?.pause();
      setPlaying(false);
    }
    pendingVerseRef.current = verseKey ?? null;
    setTurnDirection(direction ?? (next > pageData.page ? "next" : "previous"));
    setPage(next);
    setJumpValue(String(next));
  }

  function submitJump(event: React.FormEvent) {
    event.preventDefault();
    const target = Number(jumpValue);
    if (!Number.isFinite(target) || target < 1 || target > TOTAL_PAGES) {
      setJumpValue(String(pageData.page));
      setNotice("Enter a page number from 1 to 604.");
      return;
    }
    goToPage(target);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") touchStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || event.pointerType !== "touch") return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 58 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    if (deltaX < 0) goToPage(page + 1, "next");
    else goToPage(page - 1, "previous");
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setNotice("Audio could not start. Check your connection and try again."));
    }
  }

  function moveAyah(direction: -1 | 1) {
    const nextIndex = currentVerseIndex + direction;
    if (pageData.verses[nextIndex]) {
      setSelectedVerseKey(pageData.verses[nextIndex].key);
      return;
    }
    if (direction === 1 && pageData.page < TOTAL_PAGES) {
      pendingEdgeRef.current = "first";
      goToPage(pageData.page + 1, "next", undefined, playing);
    }
    if (direction === -1 && pageData.page > 1) {
      pendingEdgeRef.current = "last";
      goToPage(pageData.page - 1, "previous", undefined, playing);
    }
  }

  function handleEnded() {
    const audio = audioRef.current;
    if (!audio) return;
    if (repeatMode === "ayah") {
      audio.currentTime = 0;
      audio.play();
      return;
    }
    if (repeatMode === "range") {
      const startIndex = pageData.verses.findIndex((verse) => verse.key === rangeStart);
      const endIndex = pageData.verses.findIndex((verse) => verse.key === rangeEnd);
      if (currentVerseIndex >= 0 && currentVerseIndex < endIndex) setSelectedVerseKey(pageData.verses[currentVerseIndex + 1].key);
      else if (startIndex >= 0) setSelectedVerseKey(pageData.verses[startIndex].key);
      return;
    }
    moveAyah(1);
  }

  function toggleBookmark() {
    const exists = bookmarks.includes(currentBookmark);
    setBookmarks((current) => exists ? current.filter((item) => item !== currentBookmark) : [...current, currentBookmark]);
    setNotice(exists ? "Bookmark removed" : `Bookmarked page ${pageData.page}, ayah ${selectedVerseKey}`);
  }

  function chooseNav(item: NavItem) {
    if (item === "Read" || item === "Listen") {
      setActiveNav(item);
      setAudioExpanded(item === "Listen");
      return;
    }
    if (item === "Search") {
      setSearchOpen(true);
      return;
    }
    if (item === "Bookmarks") {
      setBookmarkPanelOpen(true);
      return;
    }
    setActiveNav(item);
    setNotice(item === "Home" ? `Last read: page ${pageData.page}, ayah ${selectedVerseKey}` : "Reader settings are available in the header controls.");
  }

  async function openSearchResult(result: SearchResult) {
    if (result.page) {
      goToPage(result.page, undefined, result.verseKey);
      setSearchOpen(false);
      return;
    }
    if (!result.verseKey) return;
    try {
      const response = await fetch(`/api/lookup?verse=${encodeURIComponent(result.verseKey)}`);
      if (!response.ok) throw new Error("Lookup failed");
      const target = await response.json() as { page: number; verseKey: string };
      goToPage(target.page, undefined, target.verseKey);
      setSearchOpen(false);
    } catch {
      setNotice("That ayah’s page could not be confirmed right now.");
    }
  }

  function renderLine(lineNumber: number) {
    const line = pageData.lines.find((item) => item.number === lineNumber);
    const chapterStart = pageData.chapterStarts.find((item) => item.headerLine === lineNumber);
    const bismillahStart = pageData.chapterStarts.find((item) => item.bismillahLine === lineNumber);
    if (chapterStart) {
      const chapter = pageData.chapters.find((item) => item.id === chapterStart.chapterId);
      return <div className="surah-line" lang="ar" dir="rtl" translate="no"><span>سُورَةُ</span><strong>{chapter?.arabicName}</strong><span>{chapter?.revelationPlace === "madinah" ? "مَدَنِيَّة" : "مَكِّيَّة"}</span></div>;
    }
    if (bismillahStart) {
      return <div className="bismillah-line" lang="ar" dir="rtl" translate="no">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>;
    }
    const wordCount = line?.words.length ?? 0;
    return (
      <div className={`mushaf-line${wordCount > 7 ? " dense" : ""} word-count-${Math.min(12, wordCount)}`} dir="rtl" lang="ar" translate="no">
        {line?.words.map((word) => (
          <button
            key={word.id}
            className={`${word.isEnd ? "ayah-end" : "mushaf-word"}${word.verseKey === selectedVerseKey ? " selected" : ""}`}
            onClick={() => setSelectedVerseKey(word.verseKey)}
            onDoubleClick={toggleBookmark}
            tabIndex={word.isEnd ? 0 : -1}
            aria-label={word.isEnd ? `Select ayah ${word.verseKey}` : undefined}
          >
            {tajweed && !word.isEnd ? <span className="tajweed-on" dangerouslySetInnerHTML={{ __html: word.tajweedHtml }} /> : word.text}
          </button>
        ))}
      </div>
    );
  }

  return (
    <main className={dark ? "app-shell dark" : "app-shell"}>
      <a className="skip-link" href="#mushaf-page">Skip to mushaf page</a>
      <aside className="side-rail" aria-label="Primary navigation">
        <button className="brand-mark" aria-label="Mushaf Companion home" onClick={() => chooseNav("Home")}>م</button>
        <nav>{NAV_ITEMS.map((item) => <button key={item.label} className={activeNav === item.label ? "nav-button active" : "nav-button"} onClick={() => chooseNav(item.label)} aria-label={item.label} title={item.label}><span aria-hidden="true">{item.glyph}</span><small>{item.label}</small></button>)}</nav>
        <button className="profile-button" aria-label="Reader profile">KA</button>
      </aside>

      <section className="workspace">
        <header className="reader-header">
          <div className="surah-identity">
            <span className="eyebrow">Juz {pageData.juz} · Hizb {pageData.hizb}</span>
            <div className="title-row"><h1>{currentChapter?.name ?? "The Quran"}</h1><span className="arabic-title" lang="ar" dir="rtl" translate="no">{currentChapter?.arabicName}</span></div>
          </div>
          <form className="header-page-jump" onSubmit={submitJump} aria-label="Jump to Quran page">
            <label htmlFor="page-jump">Page</label>
            <input id="page-jump" type="number" min="1" max={TOTAL_PAGES} inputMode="numeric" value={jumpValue} onChange={(event) => setJumpValue(event.target.value)} />
            <span>of {TOTAL_PAGES}</span><button type="submit">Go</button>
          </form>
          <div className="header-tools">
            <button className={tajweed ? "toggle-control active" : "toggle-control"} onClick={() => setTajweed(!tajweed)} aria-pressed={tajweed}><span className="tajweed-dot" /> <span>Tajweed</span></button>
            <button className={transliteration ? "toggle-control active" : "toggle-control"} onClick={() => setTransliteration(!transliteration)} aria-pressed={transliteration}>Aa <span>Transliteration</span></button>
            <button className="icon-button" onClick={() => setSearchOpen(true)} aria-label="Search">⌕</button>
            <button className={bookmarks.includes(currentBookmark) ? "icon-button bookmarked" : "icon-button"} onClick={toggleBookmark} aria-label="Bookmark selected ayah">◇</button>
            <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle night mode">{dark ? "☀" : "☾"}</button>
          </div>
        </header>
        <div className="page-progress" aria-hidden="true"><span style={{ width: `${pageProgress}%` }} /></div>

        <section className="reading-area" aria-label="Mushaf reader">
          <button className="page-turn-control previous" onClick={() => goToPage(page - 1, "previous")} disabled={pageData.page === 1 || loadingPage} aria-label="Previous page"><span>‹</span><small>Previous</small></button>
          <div className="reader-column">
            <div className="book-meta"><span>Page {pageData.page}</span><span>Swipe or use ← →</span><span>{currentChapter?.translatedName}</span></div>
            <div className="book-stage" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
              <article id="mushaf-page" className={`mushaf-page ${turnDirection ? `turn-${turnDirection}` : ""}`} aria-label={`Quran page ${pageData.page}`} aria-busy={loadingPage}>
                <div className="page-stack stack-one" /><div className="page-stack stack-two" />
                <div className="frame-line frame-outer" /><div className="frame-line frame-inner" />
                <div className="corner corner-tl" /><div className="corner corner-tr" /><div className="corner corner-bl" /><div className="corner corner-br" />
                <div className="mushaf-lines">{Array.from({ length: 15 }, (_, index) => <div className="line-slot" key={index + 1}>{renderLine(index + 1)}</div>)}</div>
                <footer className="page-footer"><span>Madani · Hafs</span><span className="page-medallion">{pageData.page}</span><span>{pageData.page} / {TOTAL_PAGES}</span></footer>
                {loadingPage && <div className="page-loading" role="status"><span className="loading-ornament">◆</span><strong>Turning to page {page}</strong><small>Loading verified mushaf text</small></div>}
              </article>
            </div>
            {transliteration && selectedVerse && <aside className="learning-strip" aria-live="polite"><span>{selectedVerse.key}</span><p>{selectedVerse.transliteration || "Transliteration is unavailable for this ayah."}</p></aside>}
            <div className="mobile-page-controls"><button onClick={() => goToPage(page - 1, "previous")} disabled={pageData.page === 1}>‹ Previous</button><form onSubmit={submitJump}><input aria-label="Page number" type="number" min="1" max={TOTAL_PAGES} value={jumpValue} onChange={(event) => setJumpValue(event.target.value)} /><span>/ {TOTAL_PAGES}</span></form><button onClick={() => goToPage(page + 1, "next")} disabled={pageData.page === TOTAL_PAGES}>Next ›</button></div>
          </div>
          <button className="page-turn-control next" onClick={() => goToPage(page + 1, "next")} disabled={pageData.page === TOTAL_PAGES || loadingPage} aria-label="Next page"><span>›</span><small>Next</small></button>
        </section>

        <section className={audioExpanded ? "audio-dock expanded" : "audio-dock"} aria-label="Audio player">
          <button className="drag-handle" aria-label={audioExpanded ? "Collapse player" : "Expand player"} onClick={() => setAudioExpanded(!audioExpanded)}><span /></button>
          <div className="now-playing"><div className="reciter-avatar" aria-hidden="true">{RECITERS.find((item) => item.id === reciter)?.initials}</div><div><span className="eyebrow">Page {pageData.page} · Ayah {selectedVerseKey}</span><strong>{RECITERS.find((item) => item.id === reciter)?.name}</strong></div></div>
          <div className="transport"><button onClick={() => moveAyah(-1)} aria-label="Previous ayah">|‹</button><button className="play-button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>{playing ? "Ⅱ" : "▶"}</button><button onClick={() => moveAyah(1)} aria-label="Next ayah">›|</button></div>
          <div className="progress-cluster"><span>{formatTime(progress)}</span><input type="range" min="0" max={duration || 1} step="0.1" value={Math.min(progress, duration || 1)} onChange={(event) => { const next = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = next; setProgress(next); }} aria-label="Audio progress" style={{ "--progress": `${duration ? (progress / duration) * 100 : 0}%` } as React.CSSProperties} /><span>{formatTime(duration)}</span></div>
          <div className="audio-actions"><button className={repeatMode !== "off" ? "active" : ""} onClick={() => setRepeatMode(repeatMode === "off" ? "ayah" : repeatMode === "ayah" ? "range" : "off")} aria-label={`Repeat mode: ${repeatMode}`}>↻ <small>{repeatMode === "off" ? "Off" : repeatMode === "ayah" ? "Ayah" : "Range"}</small></button><button onClick={() => setSpeed(speed === 1 ? .75 : speed === .75 ? 1.25 : 1)} aria-label="Playback speed">{speed}×</button><button onClick={() => setAudioExpanded(!audioExpanded)} aria-label="Audio settings">•••</button></div>
          {audioExpanded && <div className="audio-options"><label>Reciter<select value={reciter} onChange={(event) => setReciter(event.target.value as ReciterId)}>{RECITERS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Repeat<select value={repeatMode} onChange={(event) => setRepeatMode(event.target.value as RepeatMode)}><option value="off">Off</option><option value="ayah">Current ayah</option><option value="range">Ayah range</option></select></label>{repeatMode === "range" && <div className="range-inputs"><label>From<select value={rangeStart} onChange={(event) => setRangeStart(event.target.value)}>{pageData.verses.map((verse) => <option key={verse.key} value={verse.key}>{verse.key}</option>)}</select></label><label>To<select value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)}>{pageData.verses.map((verse) => <option key={verse.key} value={verse.key}>{verse.key}</option>)}</select></label></div>}</div>}
          <audio ref={audioRef} src={audioUrl(reciter, selectedVerseKey)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onEnded={handleEnded} preload="metadata" />
        </section>
      </section>

      <nav className="mobile-nav" aria-label="Mobile navigation">{NAV_ITEMS.slice(0, 5).map((item) => <button key={item.label} className={activeNav === item.label ? "active" : ""} onClick={() => chooseNav(item.label)}><span>{item.glyph}</span>{item.label}</button>)}</nav>

      {searchOpen && <div className="modal-backdrop" onMouseDown={() => setSearchOpen(false)}><section className="search-panel" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search Quran"><header><div><span className="eyebrow">Find your place</span><h2>Search all 604 pages</h2></div><button onClick={() => setSearchOpen(false)} aria-label="Close search">×</button></header><div className="search-field"><span>⌕</span><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Surah, ayah, phrase, or page number" /></div><div className="search-meta"><span>{search ? "Quran-wide results" : `Current page ${pageData.page}`}</span><span>{searching ? "Searching…" : `${searchResults.length} results`}</span></div><div className="search-results">{searchResults.map((result) => <button key={result.id} onClick={() => openSearchResult(result)}><span className="result-number">{result.type === "page" ? result.page : result.verseKey?.split(":")[1] ?? result.label.split(".")[0]}</span><span><strong>{result.label}</strong><small>{result.detail}</small>{result.arabic && <em lang="ar" dir="rtl" translate="no">{result.arabic}</em>}</span><span className="result-arrow">→</span></button>)}{!searchResults.length && !searching && <p className="empty-state">No verified results found. Try a surah name, ayah key such as 2:255, or a page number.</p>}</div></section></div>}

      {bookmarkPanelOpen && <div className="modal-backdrop" onMouseDown={() => setBookmarkPanelOpen(false)}><section className="bookmark-panel" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Bookmarks"><header><div><span className="eyebrow">Saved places</span><h2>Bookmarks</h2></div><button onClick={() => setBookmarkPanelOpen(false)} aria-label="Close bookmarks">×</button></header><div className="bookmark-list">{bookmarks.map((bookmark) => { const [savedPage, verseKey] = bookmark.split("|"); return <div key={bookmark}><button onClick={() => { goToPage(Number(savedPage), undefined, verseKey); setBookmarkPanelOpen(false); }}><span>Page {savedPage}</span><strong>Ayah {verseKey}</strong></button><button aria-label={`Remove bookmark ${verseKey}`} onClick={() => setBookmarks((current) => current.filter((item) => item !== bookmark))}>×</button></div>; })}{!bookmarks.length && <p className="empty-state">Select an ayah, then use the bookmark control to save your place.</p>}</div></section></div>}

      {notice && <button className="toast" onClick={() => setNotice("")} aria-live="polite">{notice}<span>×</span></button>}
      <div className="sr-only" aria-live="polite">Page {pageData.page} of {TOTAL_PAGES}. {loadingPage ? "Loading page." : "Page ready."}</div>
    </main>
  );
}
