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
type Overlay = Exclude<NavItem, "Read"> | null;
type RepeatMode = "off" | "ayah" | "range";
type PageEdge = "first" | "last" | null;
type PageScale = "compact" | "comfortable" | "large";

const TOTAL_PAGES = 604;
const NAV_ITEMS: Array<{ label: NavItem; glyph: string }> = [
  { label: "Home", glyph: "⌂" },
  { label: "Read", glyph: "▤" },
  { label: "Listen", glyph: "◖" },
  { label: "Bookmarks", glyph: "◇" },
  { label: "Search", glyph: "⌕" },
  { label: "Settings", glyph: "⚙" },
];
const FONT_LOADS = new Map<string, Promise<string>>();

function clampPage(value: number) {
  return Math.min(TOTAL_PAGES, Math.max(1, Math.round(value)));
}

function safeBookmarks(value: string | null) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && /^\d{1,3}\|\d{1,3}:\d{1,3}$/.test(item)) : [];
  } catch {
    return [];
  }
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
  return `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, "0")}`;
}

function chapterForVerse(pageData: QuranPage, verseKey: string) {
  const chapterId = Number(verseKey.split(":")[0]);
  return pageData.chapters.find((chapter) => chapter.id === chapterId) ?? pageData.chapters[0];
}

export default function Home() {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState<QuranPage>(FALLBACK_PAGE);
  const [jumpValue, setJumpValue] = useState("1");
  const [loadingPage, setLoadingPage] = useState(false);
  const [turnDirection, setTurnDirection] = useState<"next" | "previous" | "">("");
  const [tajweed, setTajweed] = useState(true);
  const [transliteration, setTransliteration] = useState(false);
  const [dark, setDark] = useState(false);
  const [pageScale, setPageScale] = useState<PageScale>("comfortable");
  const [selectedVerseKey, setSelectedVerseKey] = useState("1:1");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [reciter, setReciter] = useState<ReciterId>("alafasy");
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [rangeStart, setRangeStart] = useState("1:1");
  const [rangeEnd, setRangeEnd] = useState("1:7");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [fontName, setFontName] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const playingRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pageCacheRef = useRef(new Map<number, QuranPage>());
  const lastGoodPageRef = useRef(FALLBACK_PAGE);
  const pendingVerseRef = useRef<string | null>(null);
  const pendingEdgeRef = useRef<PageEdge>(null);

  const activeNav: NavItem = overlay ?? "Read";
  const selectedVerse = pageData.verses.find((verse) => verse.key === selectedVerseKey) ?? pageData.verses[0];
  const currentChapter = chapterForVerse(pageData, selectedVerse?.key ?? "1:1");
  const currentVerseIndex = pageData.verses.findIndex((verse) => verse.key === selectedVerseKey);
  const currentBookmark = `${pageData.page}|${selectedVerseKey}`;
  const pageProgress = (pageData.page / TOTAL_PAGES) * 100;
  const currentReciter = RECITERS.find((item) => item.id === reciter) ?? RECITERS[0];
  const fontKey = `MushafPage${pageData.page}${tajweed ? "v4" : "v2"}${tajweed ? (dark ? "dark" : "light") : "plain"}`;
  const fontReady = fontName === fontKey;
  const displayedSearchResults: SearchResult[] = search.trim() ? searchResults : pageData.verses.slice(0, 10).map((verse) => ({
    id: `current-${verse.key}`,
    type: "verse",
    label: `Ayah ${verse.key}`,
    detail: verse.transliteration || `Current page · ${currentChapter?.name ?? "Quran"}`,
    arabic: verse.uthmani,
    page: pageData.page,
    verseKey: verse.key,
  }));

  useEffect(() => {
    const urlPage = Number(new URL(window.location.href).searchParams.get("page"));
    const savedPage = Number(localStorage.getItem("mushaf:last-page") ?? "1");
    const initialPage = clampPage(Number.isInteger(urlPage) && urlPage >= 1 && urlPage <= TOTAL_PAGES ? urlPage : savedPage);
    const savedVerse = localStorage.getItem("mushaf:last-verse");
    const savedVersePage = Number(localStorage.getItem("mushaf:last-verse-page") ?? "0");
    const savedReciter = localStorage.getItem("mushaf:reciter") as ReciterId | null;
    const savedScale = localStorage.getItem("mushaf:page-scale") as PageScale | null;
    pendingVerseRef.current = savedVersePage === initialPage ? savedVerse : null;
    // Browser-only persistence is intentionally hydrated after the server shell.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(initialPage);
    setJumpValue(String(initialPage));
    setBookmarks(safeBookmarks(localStorage.getItem("mushaf:bookmarks-v2")));
    setDark(localStorage.getItem("mushaf:theme") === "dark");
    setTajweed(localStorage.getItem("mushaf:tajweed") !== "false");
    setTransliteration(localStorage.getItem("mushaf:transliteration") === "true");
    if (RECITERS.some((item) => item.id === savedReciter)) setReciter(savedReciter as ReciterId);
    if (["compact", "comfortable", "large"].includes(savedScale ?? "")) setPageScale(savedScale as PageScale);
    const savedSpeed = Number(localStorage.getItem("mushaf:speed") ?? "1");
    if ([0.75, 1, 1.25].includes(savedSpeed)) setSpeed(savedSpeed);
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
        : edge === "last" ? data.verses.at(-1)?.key : data.verses[0]?.key;
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
    if (!hydrated) return;
    localStorage.setItem("mushaf:last-verse", selectedVerseKey);
    localStorage.setItem("mushaf:last-verse-page", String(pageData.page));
    localStorage.setItem("mushaf:bookmarks-v2", JSON.stringify(bookmarks));
    localStorage.setItem("mushaf:theme", dark ? "dark" : "light");
    localStorage.setItem("mushaf:tajweed", String(tajweed));
    localStorage.setItem("mushaf:transliteration", String(transliteration));
    localStorage.setItem("mushaf:reciter", reciter);
    localStorage.setItem("mushaf:speed", String(speed));
    localStorage.setItem("mushaf:page-scale", pageScale);
  }, [selectedVerseKey, pageData.page, bookmarks, dark, tajweed, transliteration, reciter, speed, pageScale, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof FontFace === "undefined") return;
    let cancelled = false;
    const palette = dark ? "dark" : "light";
    const name = fontKey;
    const firefox = navigator.userAgent.includes("Firefox");
    const url = tajweed
      ? firefox
        ? `https://verses.quran.foundation/fonts/quran/hafs/v4/ot-svg/${palette}/woff2/p${pageData.page}.woff2`
        : `https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p${pageData.page}.woff2`
      : `https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p${pageData.page}.woff2`;
    let request = FONT_LOADS.get(name);
    if (!request) {
      request = new FontFace(name, `url("${url}")`, { display: "block" }).load().then((face) => {
        document.fonts.add(face);
        return name;
      });
      FONT_LOADS.set(name, request);
    }
    request.then((loadedName) => {
      if (!cancelled) {
        setFontName(loadedName);
      }
    }).catch(() => {
      FONT_LOADS.delete(name);
      if (!cancelled) setFontName("");
    });
    return () => { cancelled = true; };
  }, [pageData.page, tajweed, dark, hydrated, fontKey]);

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
    if (playingRef.current) audio.play().catch(() => updatePlaying(false));
  }, [selectedVerseKey, reciter]);

  useEffect(() => {
    if (overlay !== "Search") return;
    if (!search.trim()) return;
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
  }, [search, overlay]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && overlay) {
        event.preventDefault();
        setOverlay(null);
        return;
      }
      if (overlay || loadingPage) return;
      const target = event.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        goToPage(page + 1, "next");
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goToPage(page - 1, "previous");
      } else if (event.key === "Home") {
        event.preventDefault();
        goToPage(1, "previous");
      } else if (event.key === "End") {
        event.preventDefault();
        goToPage(TOTAL_PAGES, "next");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // goToPage is a render-local command whose latest closure is intentionally used.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, overlay, loadingPage]);

  useEffect(() => {
    document.body.style.overflow = overlay ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [overlay]);

  function updatePlaying(value: boolean) {
    playingRef.current = value;
    setPlaying(value);
  }

  function goToPage(target: number, direction?: "next" | "previous", verseKey?: string, keepPlaying = false) {
    const next = clampPage(target);
    if (next === pageData.page && !verseKey) return;
    audioRef.current?.pause();
    if (!keepPlaying) updatePlaying(false);
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
      updatePlaying(false);
    } else {
      audio.play().then(() => updatePlaying(true)).catch(() => setNotice("Audio could not start. Check your connection and try again."));
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
    } else if (direction === -1 && pageData.page > 1) {
      pendingEdgeRef.current = "last";
      goToPage(pageData.page - 1, "previous", undefined, playing);
    }
  }

  function handleEnded() {
    const audio = audioRef.current;
    if (!audio) return;
    if (repeatMode === "ayah") {
      audio.currentTime = 0;
      audio.play().catch(() => updatePlaying(false));
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
    setOverlay(item === "Read" ? null : item);
  }

  async function openSearchResult(result: SearchResult) {
    if (result.page) {
      goToPage(result.page, undefined, result.verseKey);
      setOverlay(null);
      return;
    }
    if (!result.verseKey) return;
    try {
      const response = await fetch(`/api/lookup?verse=${encodeURIComponent(result.verseKey)}`);
      if (!response.ok) throw new Error("Lookup failed");
      const target = await response.json() as { page: number; verseKey: string };
      goToPage(target.page, undefined, target.verseKey);
      setOverlay(null);
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
      return <div className="bismillah-line" lang="ar" dir="rtl" translate="no">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>;
    }
    if (!line?.words.length) return <div className="empty-line" aria-hidden="true" />;
    return (
      <div className="mushaf-line" lang="ar" dir="rtl" translate="no" style={fontReady ? { fontFamily: `"${fontName}"` } : undefined}>
        {line.words.map((word) => {
          const glyph = tajweed ? (word.qcfTajweedCode ?? word.qcfCode) : word.qcfCode;
          return (
            <button
              type="button"
              key={word.id}
              className={`mushaf-word${word.isEnd ? " ayah-end" : ""}${selectedVerseKey === word.verseKey ? " selected" : ""}`}
              onClick={() => setSelectedVerseKey(word.verseKey)}
              aria-label={`Select ayah ${word.verseKey}`}
              tabIndex={word.isEnd ? 0 : -1}
            >
              {fontReady && glyph
                ? <span className="qcf-glyph" dangerouslySetInnerHTML={{ __html: glyph }} />
                : word.isEnd
                  ? <span className="ayah-number">{word.text}</span>
                  : tajweed
                    ? <span dangerouslySetInnerHTML={{ __html: word.tajweedHtml }} />
                    : word.text}
            </button>
          );
        })}
      </div>
    );
  }

  const closeButton = <button type="button" className="panel-close" onClick={() => setOverlay(null)} aria-label="Close panel">×</button>;

  return (
    <main className={`app-shell ${dark ? "dark" : ""} page-scale-${pageScale}`}>
      <aside className="side-rail" aria-label="Primary navigation">
        <div className="brand-mark" aria-label="Mushaf Companion"><span>م</span></div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <button key={item.label} type="button" className={activeNav === item.label ? "active" : ""} onClick={() => chooseNav(item.label)} aria-label={item.label} aria-current={activeNav === item.label ? "page" : undefined}>
              <span>{item.glyph}</span><small>{item.label}</small>
            </button>
          ))}
        </nav>
        <button type="button" className="theme-rail" onClick={() => setDark((value) => !value)} aria-label={dark ? "Use light theme" : "Use night theme"}>{dark ? "☀" : "◐"}</button>
      </aside>

      <section className="reader-shell">
        <header className="reader-header">
          <div className="surah-identity">
            <span className="eyebrow">NOW READING</span>
            <div className="title-row"><h1>{currentChapter?.name ?? "The Quran"}</h1><span>{currentChapter?.translatedName}</span></div>
          </div>
          <form className="header-page-jump" onSubmit={submitJump} aria-label="Jump to Quran page">
            <label htmlFor="page-jump">PAGE</label>
            <input id="page-jump" type="number" min="1" max={TOTAL_PAGES} inputMode="numeric" value={jumpValue} onChange={(event) => setJumpValue(event.target.value)} aria-label="Page number" />
            <span>/ {TOTAL_PAGES}</span><button type="submit">Go</button>
          </form>
          <div className="header-tools">
            <button type="button" className={`toggle-control desktop-learning-toggle ${tajweed ? "active" : ""}`} onClick={() => setTajweed((value) => !value)} aria-label="Toggle Tajweed"><span className="tajweed-dot" /> <span>Tajweed</span></button>
            <button type="button" className={`toggle-control desktop-learning-toggle ${transliteration ? "active" : ""}`} onClick={() => setTransliteration((value) => !value)} aria-label="Toggle Transliteration"><span>Transliteration</span></button>
            <button type="button" className={`icon-button ${bookmarks.includes(currentBookmark) ? "active" : ""}`} onClick={toggleBookmark} aria-label="Bookmark selected ayah">◇</button>
            <button type="button" className="icon-button" onClick={() => setOverlay("Search")} aria-label="Search Quran">⌕</button>
            <button type="button" className="icon-button settings-shortcut" onClick={() => setOverlay("Settings")} aria-label="Open settings">⚙</button>
          </div>
        </header>
        <div className="page-progress" aria-hidden="true"><span style={{ width: `${pageProgress}%` }} /></div>

        <div className="mobile-layer-bar" aria-label="Reading assistance">
          <button type="button" className={tajweed ? "active" : ""} onClick={() => setTajweed((value) => !value)} aria-pressed={tajweed}><span className="tajweed-dot" /> Tajweed</button>
          <button type="button" className={transliteration ? "active" : ""} onClick={() => setTransliteration((value) => !value)} aria-pressed={transliteration}>Transliteration</button>
        </div>

        <section className="reading-area" aria-label="Mushaf reader">
          <button type="button" className="page-turn-control previous" onClick={() => goToPage(page - 1, "previous")} disabled={pageData.page <= 1 || loadingPage} aria-label="Previous page"><span>‹</span><small>PREVIOUS</small></button>
          <div className="book-stage">
            <div className="book-meta"><span>JUZ {pageData.juz}</span><span>{currentChapter?.name ?? "Quran"}</span><span>HIZB {pageData.hizb}</span></div>
            <article
              className={`mushaf-page ${turnDirection ? `turn-${turnDirection}` : ""}`}
              aria-label={`Quran page ${pageData.page}`}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
            >
              <div className="frame-outer" aria-hidden="true" /><div className="frame-inner" aria-hidden="true" />
              <span className="corner corner-tl" aria-hidden="true" /><span className="corner corner-tr" aria-hidden="true" /><span className="corner corner-bl" aria-hidden="true" /><span className="corner corner-br" aria-hidden="true" />
              <div className="mushaf-lines">{Array.from({ length: 15 }, (_, index) => <div className="line-slot" key={index + 1} data-line={index + 1}>{renderLine(index + 1)}</div>)}</div>
              <footer className="page-footer"><span>◈</span><strong>{pageData.page}</strong><span>◈</span></footer>
              {loadingPage && <div className="page-loading" role="status"><span /><p>Opening verified page {page}…</p></div>}
            </article>
            {transliteration && selectedVerse && <aside className="learning-strip" aria-live="polite"><span>AYAH {selectedVerse.key}</span><p>{selectedVerse.transliteration || "Transliteration is not available for this ayah."}</p></aside>}
            <div className="mobile-page-controls">
              <button type="button" onClick={() => goToPage(page - 1, "previous")} disabled={pageData.page <= 1}>‹ Previous</button>
              <form onSubmit={submitJump}><label className="sr-only" htmlFor="mobile-page-jump">Jump to page</label><input id="mobile-page-jump" type="number" min="1" max={TOTAL_PAGES} value={jumpValue} onChange={(event) => setJumpValue(event.target.value)} /><span>/ {TOTAL_PAGES}</span></form>
              <button type="button" onClick={() => goToPage(page + 1, "next")} disabled={pageData.page >= TOTAL_PAGES}>Next ›</button>
            </div>
          </div>
          <button type="button" className="page-turn-control next" onClick={() => goToPage(page + 1, "next")} disabled={pageData.page >= TOTAL_PAGES || loadingPage} aria-label="Next page"><span>›</span><small>NEXT</small></button>
        </section>
      </section>

      <section className="audio-mini" aria-label="Audio mini player">
        <button type="button" className="mini-now-playing" onClick={() => setOverlay("Listen")} aria-label="Open full audio player">
          <span className="reciter-avatar">{currentReciter.initials}</span>
          <span><small>NOW PLAYING · AYAH {selectedVerseKey}</small><strong>{currentReciter.name}</strong></span>
        </button>
        <div className="mini-transport">
          <button type="button" onClick={() => moveAyah(-1)} aria-label="Previous ayah">‹</button>
          <button type="button" className="mini-play" onClick={togglePlay} aria-label={playing ? "Pause recitation" : "Play recitation"}>{playing ? "Ⅱ" : "▶"}</button>
          <button type="button" onClick={() => moveAyah(1)} aria-label="Next ayah">›</button>
        </div>
        <div className="mini-progress-cluster">
          <span>{formatTime(progress)}</span>
          <input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(progress, duration || 0)} style={{ "--progress": `${duration ? (progress / duration) * 100 : 0}%` } as React.CSSProperties} onChange={(event) => { if (audioRef.current) audioRef.current.currentTime = Number(event.target.value); }} aria-label="Audio progress" />
          <span>{formatTime(duration)}</span>
        </div>
        <button type="button" className={`mini-repeat ${repeatMode !== "off" ? "active" : ""}`} onClick={() => setOverlay("Listen")} aria-label="Open repeat controls">↻ <small>{repeatMode}</small></button>
        <div className="mobile-mini-progress" aria-hidden="true"><span style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} /></div>
      </section>

      <audio ref={audioRef} src={selectedVerse ? audioUrl(reciter, selectedVerse.key) : undefined} onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onEnded={handleEnded} onPlay={() => updatePlaying(true)} onPause={() => updatePlaying(false)} preload="metadata" />

      <nav className="mobile-nav" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => <button key={item.label} type="button" className={activeNav === item.label ? "active" : ""} onClick={() => chooseNav(item.label)} aria-label={item.label} aria-current={activeNav === item.label ? "page" : undefined}><span>{item.glyph}</span><small>{item.label}</small></button>)}
      </nav>

      {overlay && (
        <div className={`layer-backdrop ${overlay === "Listen" ? "audio-layer" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setOverlay(null); }}>
          {overlay === "Home" && (
            <section className="panel-shell home-panel" role="dialog" aria-modal="true" aria-labelledby="home-title">
              <header><div><span className="panel-kicker">MUSHAF COMPANION</span><h2 id="home-title">Peaceful return</h2></div>{closeButton}</header>
              <div className="continue-card"><span>LAST READ</span><strong>{currentChapter?.name ?? "Quran"}</strong><p>Page {pageData.page} · Ayah {selectedVerseKey}</p><button type="button" onClick={() => setOverlay(null)}>Continue reading</button></div>
              <div className="home-shortcuts"><button type="button" onClick={() => setOverlay("Search")}><span>⌕</span><strong>Find a passage</strong><small>Surah, ayah, page, or juz</small></button><button type="button" onClick={() => setOverlay("Bookmarks")}><span>◇</span><strong>Saved places</strong><small>{bookmarks.length} bookmarks</small></button></div>
            </section>
          )}

          {overlay === "Search" && (
            <section className="panel-shell search-panel" role="dialog" aria-modal="true" aria-labelledby="search-title">
              <header><div><span className="panel-kicker">NAVIGATE</span><h2 id="search-title">Search the Quran</h2></div>{closeButton}</header>
              <label className="search-field"><span>⌕</span><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Surah, 2:255, page 42, juz 30…" aria-label="Search the Quran" /></label>
              <div className="search-meta"><span>{searching ? "Searching…" : search ? `${displayedSearchResults.length} results` : "On this page"}</span><span>PAGE {pageData.page}</span></div>
              <div className="search-results">
                {displayedSearchResults.map((result, index) => <button type="button" key={result.id} onClick={() => openSearchResult(result)}><span className="result-number">{index + 1}</span><span><strong>{result.label}</strong><small>{result.detail}</small>{result.arabic && <em lang="ar" dir="rtl">{result.arabic}</em>}</span><span className="result-arrow">›</span></button>)}
                {!searching && !displayedSearchResults.length && <p className="empty-state">No verified results found.</p>}
              </div>
            </section>
          )}

          {overlay === "Bookmarks" && (
            <section className="panel-shell bookmark-panel" role="dialog" aria-modal="true" aria-labelledby="bookmarks-title">
              <header><div><span className="panel-kicker">SAVED PLACES</span><h2 id="bookmarks-title">Bookmarks</h2></div>{closeButton}</header>
              <div className="bookmark-list">
                {bookmarks.map((bookmark) => {
                  const [savedPage, verseKey] = bookmark.split("|");
                  return <div key={bookmark}><button type="button" onClick={() => { goToPage(Number(savedPage), undefined, verseKey); setOverlay(null); }}><span>PAGE {savedPage}</span><strong>Ayah {verseKey}</strong></button><button type="button" onClick={() => setBookmarks((items) => items.filter((item) => item !== bookmark))} aria-label={`Remove bookmark ${verseKey}`}>×</button></div>;
                })}
                {!bookmarks.length && <p className="empty-state">Bookmark an ayah to keep your place here.</p>}
              </div>
            </section>
          )}

          {overlay === "Settings" && (
            <section className="panel-shell settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
              <header><div><span className="panel-kicker">READER PREFERENCES</span><h2 id="settings-title">Settings</h2></div>{closeButton}</header>
              <div className="settings-content">
                <section className="settings-group"><h3>Appearance</h3><div className="setting-row"><span><strong>Theme</strong><small>Choose the reading surface.</small></span><div className="segmented"><button type="button" className={!dark ? "active" : ""} onClick={() => setDark(false)}>Light</button><button type="button" className={dark ? "active" : ""} onClick={() => setDark(true)}>Night</button></div></div><div className="setting-row"><span><strong>Page size</strong><small>Preserves all 15 line slots.</small></span><select value={pageScale} onChange={(event) => setPageScale(event.target.value as PageScale)} aria-label="Page size"><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="large">Large</option></select></div></section>
                <section className="settings-group"><h3>Reading assistance</h3><label className="setting-row"><span><strong>Tajweed colors</strong><small>Use the verified QCF tajweed font.</small></span><input className="switch" type="checkbox" checked={tajweed} onChange={(event) => setTajweed(event.target.checked)} /></label><label className="setting-row"><span><strong>Transliteration</strong><small>Show pronunciation below the selected ayah.</small></span><input className="switch" type="checkbox" checked={transliteration} onChange={(event) => setTransliteration(event.target.checked)} /></label></section>
                <section className="settings-group"><h3>Audio</h3><div className="setting-row"><span><strong>Default reciter</strong><small>Used for verse playback.</small></span><select value={reciter} onChange={(event) => setReciter(event.target.value as ReciterId)} aria-label="Default reciter">{RECITERS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="setting-row"><span><strong>Playback speed</strong><small>Applies immediately.</small></span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} aria-label="Playback speed"><option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option></select></div></section>
                <footer className="edition-note"><span>TEXT EDITION</span><strong>Madani Mushaf · Hafs · QCF V2 / V4 Tajweed</strong></footer>
              </div>
            </section>
          )}

          {overlay === "Listen" && (
            <section className="panel-shell audio-sheet" role="dialog" aria-modal="true" aria-labelledby="audio-title">
              <div className="sheet-handle" aria-hidden="true" />
              <header><div><span className="panel-kicker">VERSE RECITATION</span><h2 id="audio-title">Ayah {selectedVerseKey}</h2></div>{closeButton}</header>
              <div className="sheet-now-playing"><span className="reciter-avatar large">{currentReciter.initials}</span><div><strong>{currentReciter.name}</strong><small>{currentChapter?.name} · Page {pageData.page}</small></div></div>
              <div className="sheet-transport"><button type="button" onClick={() => moveAyah(-1)} aria-label="Previous ayah">‹</button><button type="button" className="sheet-play" onClick={togglePlay} aria-label={playing ? "Pause recitation" : "Play recitation"}>{playing ? "Ⅱ" : "▶"}</button><button type="button" onClick={() => moveAyah(1)} aria-label="Next ayah">›</button></div>
              <div className="sheet-progress"><input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(progress, duration || 0)} style={{ "--progress": `${duration ? (progress / duration) * 100 : 0}%` } as React.CSSProperties} onChange={(event) => { if (audioRef.current) audioRef.current.currentTime = Number(event.target.value); }} aria-label="Audio progress" /><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div>
              <div className="audio-settings-grid"><label>RECITER<select value={reciter} onChange={(event) => setReciter(event.target.value as ReciterId)}>{RECITERS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>SPEED<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option></select></label><label>REPEAT<select value={repeatMode} onChange={(event) => setRepeatMode(event.target.value as RepeatMode)}><option value="off">Off</option><option value="ayah">Current ayah</option><option value="range">Ayah range</option></select></label></div>
              {repeatMode === "range" && <div className="range-settings"><label>FROM<select value={rangeStart} onChange={(event) => setRangeStart(event.target.value)}>{pageData.verses.map((verse) => <option key={verse.key} value={verse.key}>{verse.key}</option>)}</select></label><span>to</span><label>TO<select value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)}>{pageData.verses.map((verse) => <option key={verse.key} value={verse.key}>{verse.key}</option>)}</select></label></div>}
            </section>
          )}
        </div>
      )}

      {notice && <button type="button" className="toast" onClick={() => setNotice("")}><span>◇</span>{notice}<strong>×</strong></button>}
    </main>
  );
}
