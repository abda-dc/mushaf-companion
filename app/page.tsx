"use client";

import { useEffect, useRef, useState } from "react";
import {
  FALLBACK_PAGE,
  RECITERS,
  type PageWord,
  type QuranChapterInfo,
  type QuranPage,
  type ReciterId,
  type SearchResult,
} from "./quran-data";
import { TAJWEED_RULES, rulesForTajweedHtml, type TajweedRule } from "./tajweed-guide";

type NavItem = "Home" | "Contents" | "Read" | "Listen" | "Bookmarks" | "Search" | "Settings";
type Overlay = Exclude<NavItem, "Read"> | null;
type RepeatMode = "off" | "ayah" | "range";
type PageEdge = "first" | "last" | null;
type PageScale = "compact" | "comfortable" | "large";
type ReadingFont = "amiri" | "lateef" | "scheherazade" | "uthman-taha";

const TOTAL_PAGES = 604;
const PAGE_DATA_REVISION = "2026-08-05-learning-contents";
const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
const READING_FONTS: Array<{ id: ReadingFont; label: string }> = [
  { id: "uthman-taha", label: "Uthman Taha" },
  { id: "amiri", label: "Amiri" },
  { id: "lateef", label: "Lateef" },
  { id: "scheherazade", label: "Scheherazade" },
];
const NAV_ITEMS: Array<{ label: NavItem; glyph: string }> = [
  { label: "Home", glyph: "⌂" },
  { label: "Contents", glyph: "☷" },
  { label: "Read", glyph: "▤" },
  { label: "Listen", glyph: "◖" },
  { label: "Bookmarks", glyph: "◇" },
  { label: "Search", glyph: "⌕" },
  { label: "Settings", glyph: "⚙" },
];
const FONT_LOADS = new Map<string, Promise<string>>();

interface TajweedFocus {
  word: string;
  verseKey: string;
  rules: TajweedRule[];
}

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
  if (reciter === "abdul-rashid-sufi") return `https://api.kalamalah.com/api/abdul-rashid-sofi/murattal/${chapter.padStart(3, "0")}`;
  if (reciter === "aymen") return `https://everyayah.com/data/Ayman_Sowaid_64kbps/${file}`;
  if (reciter === "minshawi-kids") return `https://everyayah.com/data/Minshawy_Teacher_128kbps/${file}`;
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
  const [readingFont, setReadingFont] = useState<ReadingFont>("uthman-taha");
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
  const [chapters, setChapters] = useState<QuranChapterInfo[]>([]);
  const [contentsQuery, setContentsQuery] = useState("");
  const [contentsJuz, setContentsJuz] = useState(0);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [tajweedGuideOpen, setTajweedGuideOpen] = useState(false);
  const [tajweedFocus, setTajweedFocus] = useState<TajweedFocus | null>(null);
  const [surahPlaybackChapter, setSurahPlaybackChapter] = useState<number | null>(null);
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
  const pendingAutoplayRef = useRef(false);
  const surahPlaybackRef = useRef<number | null>(null);

  const activeNav: NavItem = overlay ?? "Read";
  const selectedVerse = pageData.verses.find((verse) => verse.key === selectedVerseKey) ?? pageData.verses[0];
  const currentChapter = chapterForVerse(pageData, selectedVerse?.key ?? "1:1");
  const currentVerseIndex = pageData.verses.findIndex((verse) => verse.key === selectedVerseKey);
  const currentBookmark = `${pageData.page}|${selectedVerseKey}`;
  const pageProgress = (pageData.page / TOTAL_PAGES) * 100;
  const currentReciter = RECITERS.find((item) => item.id === reciter) ?? RECITERS[0];
  const isSurahPlayback = currentReciter.scope === "surah" || surahPlaybackChapter !== null;
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
  const filteredChapters = chapters.filter((chapter) => {
    const query = contentsQuery.trim().toLocaleLowerCase();
    const matchesQuery = !query || `${chapter.id} ${chapter.name} ${chapter.simpleName} ${chapter.translatedName} ${chapter.arabicName}`.toLocaleLowerCase().includes(query);
    const matchesJuz = contentsJuz === 0 || chapter.juzs.includes(contentsJuz);
    return matchesQuery && matchesJuz;
  });

  useEffect(() => {
    const urlPage = Number(new URL(window.location.href).searchParams.get("page"));
    const savedPage = Number(localStorage.getItem("mushaf:last-page") ?? "1");
    const initialPage = clampPage(Number.isInteger(urlPage) && urlPage >= 1 && urlPage <= TOTAL_PAGES ? urlPage : savedPage);
    const savedVerse = localStorage.getItem("mushaf:last-verse");
    const savedVersePage = Number(localStorage.getItem("mushaf:last-verse-page") ?? "0");
    const savedReciter = localStorage.getItem("mushaf:reciter") as ReciterId | null;
    const savedScale = localStorage.getItem("mushaf:page-scale") as PageScale | null;
    const savedReadingFont = localStorage.getItem("mushaf:reading-font") as ReadingFont | null;
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
    if (READING_FONTS.some((item) => item.id === savedReadingFont)) setReadingFont(savedReadingFont as ReadingFont);
    const savedSpeed = Number(localStorage.getItem("mushaf:speed") ?? "1");
    if (PLAYBACK_SPEEDS.includes(savedSpeed as (typeof PLAYBACK_SPEEDS)[number])) setSpeed(savedSpeed);
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
      setTajweedFocus(null);
      setLoadingPage(false);
      setJumpValue(String(data.page));
      const requestedVerse = pendingVerseRef.current;
      const edge = pendingEdgeRef.current;
      const nextVerse = requestedVerse && data.verses.some((verse) => verse.key === requestedVerse)
        ? requestedVerse
        : edge === "last" ? data.verses.at(-1)?.key : data.verses[0]?.key;
      if (nextVerse) {
        const nextChapterId = Number(nextVerse.split(":")[0]);
        if (surahPlaybackRef.current !== null && nextChapterId !== surahPlaybackRef.current) {
          pendingAutoplayRef.current = false;
          updateSurahPlayback(null);
          updatePlaying(false);
        }
        setSelectedVerseKey(nextVerse);
      }
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
    fetch(`/api/pages/${page}?v=${PAGE_DATA_REVISION}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Page unavailable");
        return response.json() as Promise<QuranPage>;
      })
      .then((data) => {
        pageCacheRef.current.set(page, data);
        applyPage(data);
        [page - 1, page + 1].filter((item) => item >= 1 && item <= TOTAL_PAGES && !pageCacheRef.current.has(item)).forEach((item) => {
          fetch(`/api/pages/${item}?v=${PAGE_DATA_REVISION}`).then((response) => response.ok ? response.json() as Promise<QuranPage> : null).then((next) => {
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
    localStorage.setItem("mushaf:reading-font", readingFont);
  }, [selectedVerseKey, pageData.page, bookmarks, dark, tajweed, transliteration, reciter, speed, pageScale, readingFont, hydrated]);

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
    const shouldAutoplay = playingRef.current || pendingAutoplayRef.current;
    pendingAutoplayRef.current = false;
    audio.load();
    setProgress(0);
    setDuration(0);
    if (shouldAutoplay) audio.play().then(() => updatePlaying(true)).catch(() => {
      updatePlaying(false);
      setNotice("The recitation is ready. Tap play to begin.");
    });
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
      if (event.key === "Escape" && (overlay || tajweedGuideOpen)) {
        event.preventDefault();
        setOverlay(null);
        setTajweedGuideOpen(false);
        return;
      }
      if (overlay || tajweedGuideOpen || loadingPage) return;
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
  }, [page, overlay, tajweedGuideOpen, loadingPage]);

  useEffect(() => {
    document.body.style.overflow = overlay || tajweedGuideOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [overlay, tajweedGuideOpen]);

  function updatePlaying(value: boolean) {
    playingRef.current = value;
    setPlaying(value);
  }

  function updateSurahPlayback(chapterId: number | null) {
    surahPlaybackRef.current = chapterId;
    setSurahPlaybackChapter(chapterId);
  }

  function selectReciter(nextReciter: ReciterId) {
    setReciter(nextReciter);
    if (RECITERS.find((item) => item.id === nextReciter)?.scope === "surah") setRepeatMode("off");
  }

  function goToPage(target: number, direction?: "next" | "previous", verseKey?: string, keepPlaying = false) {
    const next = clampPage(target);
    if (next === pageData.page && !verseKey) return;
    audioRef.current?.pause();
    if (!keepPlaying) updatePlaying(false);
    if (next === pageData.page && verseKey) {
      pendingVerseRef.current = null;
      setSelectedVerseKey(verseKey);
      setTurnDirection("");
      return;
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

  function previousPage() {
    if (pageData.page === 1) {
      setTajweedGuideOpen(true);
      return;
    }
    goToPage(pageData.page - 1, "previous");
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
    if (surahPlaybackRef.current !== null) {
      if (currentReciter.scope === "surah") {
        updateSurahPlayback(null);
        updatePlaying(false);
        return;
      }
      const nextVerse = pageData.verses[currentVerseIndex + 1];
      if (nextVerse) {
        if (nextVerse.chapterId === surahPlaybackRef.current) setSelectedVerseKey(nextVerse.key);
        else {
          updateSurahPlayback(null);
          updatePlaying(false);
        }
      } else if (pageData.page < TOTAL_PAGES) {
        pendingEdgeRef.current = "first";
        goToPage(pageData.page + 1, "next", undefined, true);
      } else {
        updateSurahPlayback(null);
        updatePlaying(false);
      }
      return;
    }
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
    if (item === "Contents") {
      openContents();
      return;
    }
    setOverlay(item === "Read" ? null : item);
  }

  function openContents() {
    setOverlay("Contents");
    if (chapters.length || contentsLoading) return;
    setContentsLoading(true);
    fetch("/api/chapters")
      .then(async (response) => {
        if (!response.ok) throw new Error("Contents unavailable");
        return response.json() as Promise<{ chapters: QuranChapterInfo[] }>;
      })
      .then((payload) => setChapters(payload.chapters))
      .catch(() => setNotice("The verified table of contents could not be opened. Please try again."))
      .finally(() => setContentsLoading(false));
  }

  function selectMushafWord(word: PageWord) {
    setSelectedVerseKey(word.verseKey);
    if (!tajweed || word.isEnd) {
      setTajweedFocus(null);
      return;
    }
    const rules = rulesForTajweedHtml(word.tajweedHtml);
    setTajweedFocus(rules.length ? { word: word.text, verseKey: word.verseKey, rules } : null);
  }

  async function startSurahPlayback(chapterId: number) {
    const verseKey = `${chapterId}:1`;
    audioRef.current?.pause();
    updatePlaying(false);
    updateSurahPlayback(chapterId);
    setRepeatMode("off");
    pendingAutoplayRef.current = true;
    setOverlay("Listen");
    setNotice(`Starting complete sūrah playback for Sūrah ${chapterId}.`);
    if (pageData.verses.some((verse) => verse.key === verseKey)) {
      setSelectedVerseKey(verseKey);
    } else {
      try {
        const response = await fetch(`/api/lookup?verse=${encodeURIComponent(verseKey)}`);
        if (!response.ok) throw new Error("Lookup failed");
        const target = await response.json() as { page: number; verseKey: string };
        goToPage(target.page, undefined, target.verseKey);
      } catch {
        pendingAutoplayRef.current = false;
        updateSurahPlayback(null);
        setNotice("The beginning of that sūrah could not be confirmed right now.");
      }
      return;
    }
    if (selectedVerseKey === verseKey) {
      window.setTimeout(() => {
        const audio = audioRef.current;
        pendingAutoplayRef.current = false;
        audio?.load();
        audio?.play().then(() => updatePlaying(true)).catch(() => setNotice("The sūrah is ready. Tap play to begin."));
      }, 0);
    }
  }

  async function openVerse(verseKey: string, closeGuide = false) {
    try {
      const response = await fetch(`/api/lookup?verse=${encodeURIComponent(verseKey)}`);
      if (!response.ok) throw new Error("Lookup failed");
      const target = await response.json() as { page: number; verseKey: string };
      goToPage(target.page, undefined, target.verseKey);
      setOverlay(null);
      if (closeGuide) setTajweedGuideOpen(false);
    } catch {
      setNotice("That example’s page could not be confirmed right now.");
    }
  }

  function openChapter(chapter: QuranChapterInfo) {
    goToPage(chapter.startPage, undefined, `${chapter.id}:1`);
    setOverlay(null);
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
      return <div className="surah-line" lang="ar" dir="rtl" translate="no"><span>سُورَةُ</span><strong>{chapter?.arabicName}</strong>{chapter && <button type="button" className="surah-number" onClick={() => setNotice(`Double-click Sūrah ${chapter.id} to play it from the beginning.`)} onDoubleClick={() => startSurahPlayback(chapter.id)} aria-label={`Sūrah ${chapter.id}. Double-click to play the complete sūrah`} title="Double-click to play the complete sūrah">{chapter.id}</button>}<span>{chapter?.revelationPlace === "madinah" ? "مَدَنِيَّة" : "مَكِّيَّة"}</span></div>;
    }
    if (bismillahStart) {
      return <div className="bismillah-line" lang="ar" dir="rtl" translate="no">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>;
    }
    if (!line?.words.length) return <div className="empty-line" aria-hidden="true" />;
    return (
      <div className="mushaf-line" lang="ar" dir="rtl" translate="no" style={fontReady && readingFont === "uthman-taha" ? { fontFamily: `"${fontName}"` } : undefined}>
        {line.words.map((word) => {
          const glyph = tajweed ? (word.qcfTajweedCode ?? word.qcfCode) : word.qcfCode;
          const useQcfGlyph = fontReady && glyph && (readingFont === "uthman-taha" || word.isEnd);
          return (
            <button
              type="button"
              key={word.id}
              className={`mushaf-word${word.isEnd ? " ayah-end" : ""}${selectedVerseKey === word.verseKey ? " selected" : ""}`}
              onClick={() => selectMushafWord(word)}
              aria-label={`${tajweed && rulesForTajweedHtml(word.tajweedHtml).length ? "Explain Tajweed in" : "Select"} ayah ${word.verseKey}`}
              tabIndex={word.isEnd ? 0 : -1}
            >
              {useQcfGlyph
                ? <span className="qcf-glyph" style={{ fontFamily: `"${fontName}"` }} dangerouslySetInnerHTML={{ __html: glyph }} />
                : word.isEnd
                  ? <span className="ayah-rosette"><span>{word.text}</span></span>
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
            <button type="button" className="icon-button" onClick={() => setTajweedGuideOpen(true)} aria-label="Open Tajweed guide">?</button>
            <button type="button" className={`icon-button ${bookmarks.includes(currentBookmark) ? "active" : ""}`} onClick={toggleBookmark} aria-label="Bookmark selected ayah">◇</button>
            <button type="button" className="icon-button" onClick={() => setOverlay("Search")} aria-label="Search Quran">⌕</button>
            <button type="button" className="icon-button settings-shortcut" onClick={() => setOverlay("Settings")} aria-label="Open settings">⚙</button>
          </div>
        </header>
        <div className="page-progress" aria-hidden="true"><span style={{ width: `${pageProgress}%` }} /></div>

        <div className="mobile-layer-bar" aria-label="Reading assistance">
          <button type="button" className={tajweed ? "active" : ""} onClick={() => setTajweed((value) => !value)} aria-pressed={tajweed}><span className="tajweed-dot" /> Tajweed</button>
          <button type="button" className={transliteration ? "active" : ""} onClick={() => setTransliteration((value) => !value)} aria-pressed={transliteration}>Transliteration</button>
          <button type="button" onClick={() => setTajweedGuideOpen(true)} aria-label="Open Tajweed guide">Guide</button>
        </div>

        <section className="reading-area" aria-label="Mushaf reader">
          <button type="button" className="page-turn-control previous" onClick={previousPage} disabled={loadingPage} aria-label={pageData.page === 1 ? "Open Tajweed guide before page one" : "Previous page"}><span>‹</span><small>{pageData.page === 1 ? "GUIDE" : "PREVIOUS"}</small></button>
          <div className="book-stage">
            <div className="book-meta"><span>JUZ {pageData.juz}</span>{currentChapter ? <button type="button" onClick={() => setNotice(`Double-click Sūrah ${currentChapter.id} to play it from the beginning.`)} onDoubleClick={() => startSurahPlayback(currentChapter.id)} aria-label={`Sūrah ${currentChapter.id}, ${currentChapter.name}. Double-click to play from the beginning`}>{currentChapter.id} · {currentChapter.name}</button> : <span>Quran</span>}<span>HIZB {pageData.hizb}</span></div>
            <article
              className={`mushaf-page reading-font-${readingFont} ${turnDirection ? `turn-${turnDirection}` : ""}`}
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
            {tajweedFocus && <aside className="tajweed-explanation" aria-live="polite"><header><div><span>TAJWEED IN AYAH {tajweedFocus.verseKey}</span><strong lang="ar" dir="rtl">{tajweedFocus.word}</strong></div><button type="button" onClick={() => setTajweedFocus(null)} aria-label="Close Tajweed explanation">×</button></header>{tajweedFocus.rules.map((rule) => <div className={`tajweed-explanation-rule rule-${rule.id}`} key={rule.id}><span className="rule-swatch" /><div><strong>{rule.name}</strong><small>{rule.arabicName}{rule.count ? ` · ${rule.count}` : ""}</small><p>{rule.instruction}</p></div></div>)}<button type="button" className="open-guide-link" onClick={() => setTajweedGuideOpen(true)}>Open the complete Tajweed guide</button></aside>}
            {transliteration && selectedVerse && <aside className="learning-strip" aria-live="polite"><span>AYAH {selectedVerse.key}</span><p>{selectedVerse.transliteration || "Transliteration is not available for this ayah."}</p></aside>}
            <div className="mobile-page-controls">
              <button type="button" onClick={previousPage}>{pageData.page === 1 ? "‹ Guide" : "‹ Previous"}</button>
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
          <span><small>NOW PLAYING · {isSurahPlayback ? `SURAH ${surahPlaybackChapter ?? selectedVerseKey.split(":")[0]}` : `AYAH ${selectedVerseKey}`}</small><strong>{currentReciter.name}</strong></span>
        </button>
        <div className="mini-transport">
          <button type="button" onClick={() => moveAyah(-1)} disabled={currentReciter.scope === "surah"} aria-label="Previous ayah">‹</button>
          <button type="button" className="mini-play" onClick={togglePlay} aria-label={playing ? "Pause recitation" : "Play recitation"}>{playing ? "Ⅱ" : "▶"}</button>
          <button type="button" onClick={() => moveAyah(1)} disabled={currentReciter.scope === "surah"} aria-label="Next ayah">›</button>
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
              <div className="home-shortcuts"><button type="button" onClick={openContents}><span>☷</span><strong>Table of contents</strong><small>114 sūrahs with juz and revelation details</small></button><button type="button" onClick={() => { setOverlay(null); setTajweedGuideOpen(true); }}><span>?</span><strong>Learn Tajweed</strong><small>17 color rules with five examples each</small></button><button type="button" onClick={() => setOverlay("Search")}><span>⌕</span><strong>Find a passage</strong><small>Sūrah, āyah, page, or juz</small></button><button type="button" onClick={() => setOverlay("Bookmarks")}><span>◇</span><strong>Saved places</strong><small>{bookmarks.length} bookmarks</small></button></div>
            </section>
          )}

          {overlay === "Contents" && (
            <section className="panel-shell contents-panel" role="dialog" aria-modal="true" aria-labelledby="contents-title">
              <header><div><span className="panel-kicker">QURAN INDEX</span><h2 id="contents-title">Table of contents</h2></div>{closeButton}</header>
              <div className="contents-tools"><label><span className="sr-only">Filter sūrahs</span><input value={contentsQuery} onChange={(event) => setContentsQuery(event.target.value)} placeholder="Search sūrah name or number" aria-label="Filter sūrahs" /></label><label><span className="sr-only">Filter by juz</span><select value={contentsJuz} onChange={(event) => setContentsJuz(Number(event.target.value))} aria-label="Filter by juz"><option value={0}>All 30 juz</option>{Array.from({ length: 30 }, (_, index) => <option value={index + 1} key={index + 1}>Juz {index + 1}</option>)}</select></label></div>
              <button type="button" className="contents-guide-card" onClick={() => { setOverlay(null); setTajweedGuideOpen(true); }}><span className="guide-number">00</span><span><strong>Begin with the Tajweed guide</strong><small>All 17 color categories · five verified examples for every rule</small></span><span>›</span></button>
              <div className="contents-heading" aria-hidden="true"><span>SŪRAH</span><span>DETAILS</span><span>LOCATION</span></div>
              <div className="contents-list">
                {filteredChapters.map((chapter) => {
                  const firstJuz = chapter.juzs[0];
                  const lastJuz = chapter.juzs.at(-1);
                  const juzLabel = firstJuz === lastJuz ? `Juz ${firstJuz}` : `Juz ${firstJuz}–${lastJuz}`;
                  return <button type="button" key={chapter.id} onClick={() => openChapter(chapter)} aria-label={`Open Sūrah ${chapter.id}, ${chapter.name}, page ${chapter.startPage}`}><span className="chapter-number">{chapter.id.toString().padStart(3, "0")}</span><span className="chapter-name"><strong>{chapter.name}</strong><em lang="ar" dir="rtl" translate="no">{chapter.arabicName}</em><small>{chapter.translatedName}</small></span><span className="chapter-facts"><strong>{chapter.revelationPlace === "madinah" ? "Madinan" : "Makkan"}</strong><small>{chapter.versesCount} āyāt · {juzLabel}</small><small>Pages {chapter.startPage}–{chapter.endPage} · Revelation {chapter.revelationOrder}</small></span><span className="result-arrow">›</span></button>;
                })}
                {contentsLoading && <p className="empty-state">Opening the verified sūrah index…</p>}
                {!contentsLoading && !filteredChapters.length && <p className="empty-state">No sūrahs match this filter.</p>}
              </div>
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
                <section className="settings-group"><h3>Appearance</h3><div className="setting-row"><span><strong>Theme</strong><small>Choose the reading surface.</small></span><div className="segmented"><button type="button" className={!dark ? "active" : ""} onClick={() => setDark(false)}>Light</button><button type="button" className={dark ? "active" : ""} onClick={() => setDark(true)}>Night</button></div></div><div className="setting-row"><span><strong>Page size</strong><small>Preserves all 15 line slots.</small></span><select value={pageScale} onChange={(event) => setPageScale(event.target.value as PageScale)} aria-label="Page size"><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="large">Large</option></select></div><div className="setting-row"><span><strong>Reading font</strong><small>Uthman Taha is the page-faithful default.</small></span><select value={readingFont} onChange={(event) => setReadingFont(event.target.value as ReadingFont)} aria-label="Reading font">{READING_FONTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div></section>
                <section className="settings-group"><h3>Reading assistance</h3><label className="setting-row"><span><strong>Tajweed colors</strong><small>Use the verified QCF tajweed font.</small></span><input className="switch" type="checkbox" checked={tajweed} onChange={(event) => setTajweed(event.target.checked)} /></label><label className="setting-row"><span><strong>Transliteration</strong><small>Show pronunciation below the selected ayah.</small></span><input className="switch" type="checkbox" checked={transliteration} onChange={(event) => setTransliteration(event.target.checked)} /></label></section>
                <section className="settings-group"><h3>Audio</h3><div className="setting-row"><span><strong>Default reciter</strong><small>{currentReciter.scope === "surah" ? "Continuous sūrah playback." : "Used for verse playback."}</small></span><select value={reciter} onChange={(event) => selectReciter(event.target.value as ReciterId)} aria-label="Default reciter">{RECITERS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="setting-row"><span><strong>Playback speed</strong><small>Applies immediately.</small></span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} aria-label="Playback speed">{PLAYBACK_SPEEDS.map((rate) => <option key={rate} value={rate}>{rate}×</option>)}</select></div></section>
                <footer className="edition-note"><span>TEXT EDITION</span><strong>Madani Mushaf · Hafs · 15-line page map</strong></footer>
              </div>
            </section>
          )}

          {overlay === "Listen" && (
            <section className="panel-shell audio-sheet" role="dialog" aria-modal="true" aria-labelledby="audio-title">
              <div className="sheet-handle" aria-hidden="true" />
              <header><div><span className="panel-kicker">{isSurahPlayback ? "SURAH RECITATION" : "VERSE RECITATION"}</span><h2 id="audio-title">{isSurahPlayback ? (currentChapter?.name ?? "Quran") : `Ayah ${selectedVerseKey}`}</h2></div>{closeButton}</header>
              <div className="sheet-now-playing"><span className="reciter-avatar large">{currentReciter.initials}</span><div><strong>{currentReciter.name}</strong><small>{currentChapter?.name} · Page {pageData.page}</small></div></div>
              <div className="sheet-transport"><button type="button" onClick={() => moveAyah(-1)} disabled={currentReciter.scope === "surah"} aria-label="Previous ayah">‹</button><button type="button" className="sheet-play" onClick={togglePlay} aria-label={playing ? "Pause recitation" : "Play recitation"}>{playing ? "Ⅱ" : "▶"}</button><button type="button" onClick={() => moveAyah(1)} disabled={currentReciter.scope === "surah"} aria-label="Next ayah">›</button></div>
              <div className="sheet-progress"><input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(progress, duration || 0)} style={{ "--progress": `${duration ? (progress / duration) * 100 : 0}%` } as React.CSSProperties} onChange={(event) => { if (audioRef.current) audioRef.current.currentTime = Number(event.target.value); }} aria-label="Audio progress" /><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div>
              <div className="audio-settings-grid"><label>RECITER<select value={reciter} onChange={(event) => selectReciter(event.target.value as ReciterId)}>{RECITERS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>SPEED<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>{PLAYBACK_SPEEDS.map((rate) => <option key={rate} value={rate}>{rate}×</option>)}</select></label><label>REPEAT<select value={repeatMode} onChange={(event) => setRepeatMode(event.target.value as RepeatMode)} disabled={isSurahPlayback}><option value="off">{isSurahPlayback ? "Sūrah playback" : "Off"}</option><option value="ayah">Current ayah</option><option value="range">Ayah range</option></select></label></div>
              {currentReciter.scope === "surah" && <p className="audio-scope-note">This recitation is provided as continuous sūrah audio. Ayah repeat remains available with the five verse-by-verse reciters.</p>}
              {surahPlaybackChapter !== null && currentReciter.scope === "ayah" && <p className="audio-scope-note">Complete sūrah mode is active. Each verified āyah file will continue in order until the end of this sūrah.</p>}
              {repeatMode === "range" && <div className="range-settings"><label>FROM<select value={rangeStart} onChange={(event) => setRangeStart(event.target.value)}>{pageData.verses.map((verse) => <option key={verse.key} value={verse.key}>{verse.key}</option>)}</select></label><span>to</span><label>TO<select value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)}>{pageData.verses.map((verse) => <option key={verse.key} value={verse.key}>{verse.key}</option>)}</select></label></div>}
            </section>
          )}
        </div>
      )}

      {tajweedGuideOpen && (
        <div className="layer-backdrop guide-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) setTajweedGuideOpen(false); }}>
          <section className="panel-shell tajweed-guide-panel" role="dialog" aria-modal="true" aria-labelledby="tajweed-guide-title">
            <header><div><span className="panel-kicker">BEFORE PAGE ONE</span><h2 id="tajweed-guide-title">Tajweed color guide</h2></div><button type="button" className="panel-close" onClick={() => setTajweedGuideOpen(false)} aria-label="Close Tajweed guide">×</button></header>
            <div className="tajweed-guide-content">
              <section className="guide-intro"><div><span>17 RULES · 85 EXAMPLES</span><h3>Read the color, then hear it in context.</h3><p>Each card explains one markup category used by this reader. Select any example to open its verified muṣḥaf page. A qualified teacher remains the best guide for articulation and timing.</p></div><button type="button" onClick={() => { goToPage(1, "previous", "1:1"); setTajweedGuideOpen(false); }}>Begin reading · Page 1</button></section>
              <div className="tajweed-rule-grid">
                {TAJWEED_RULES.map((rule, index) => <article className={`tajweed-rule-card rule-${rule.id}`} key={rule.id}><header><span className="rule-index">{(index + 1).toString().padStart(2, "0")}</span><span className="rule-swatch" /><div><small>{rule.family}</small><h3>{rule.name}</h3><em lang="ar" dir="rtl">{rule.arabicName}</em></div>{rule.count && <strong className="rule-count">{rule.count}</strong>}</header><p>{rule.instruction}</p><div className="tajweed-examples" aria-label={`Five examples of ${rule.name}`}>{rule.examples.map((example) => <button type="button" key={`${rule.id}-${example.verseKey}`} onClick={() => openVerse(example.verseKey, true)}><span lang="ar" dir="rtl" translate="no">{example.text}</span><small>{example.verseKey}</small></button>)}</div></article>)}
              </div>
            </div>
          </section>
        </div>
      )}

      {notice && <button type="button" className="toast" onClick={() => setNotice("")}><span>◇</span>{notice}<strong>×</strong></button>}
    </main>
  );
}
