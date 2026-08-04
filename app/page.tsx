"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RECITERS, SURAH_FATIHAH, type ReciterId } from "./quran-data";

type NavItem = "Home" | "Read" | "Listen" | "Bookmarks" | "Search" | "Settings";
type RepeatMode = "off" | "ayah" | "range";

const NAV_ITEMS: Array<{ label: NavItem; glyph: string }> = [
  { label: "Home", glyph: "⌂" },
  { label: "Read", glyph: "▤" },
  { label: "Listen", glyph: "◖" },
  { label: "Bookmarks", glyph: "◇" },
  { label: "Search", glyph: "⌕" },
  { label: "Settings", glyph: "⚙" },
];

const AUDIO_ROOT = "https://verses.quran.foundation/";

function audioUrl(reciter: ReciterId, ayah: number) {
  const paddedAyah = String(ayah).padStart(3, "0");
  if (reciter === "saad") {
    return `https://everyayah.com/data/Ghamadi_40kbps/001${paddedAyah}.mp3`;
  }
  const folder = reciter === "alafasy" ? "Alafasy" : "AbdulBaset/Murattal";
  return `${AUDIO_ROOT}${folder}/mp3/001${paddedAyah}.mp3`;
}

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavItem>("Read");
  const [tajweed, setTajweed] = useState(true);
  const [transliteration, setTransliteration] = useState(false);
  const [dark, setDark] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState(1);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [reciter, setReciter] = useState<ReciterId>("alafasy");
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(7);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [audioExpanded, setAudioExpanded] = useState(false);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const savedAyah = Number(localStorage.getItem("mushaf:last-ayah") ?? "1");
    const savedBookmarks = JSON.parse(localStorage.getItem("mushaf:bookmarks") ?? "[]") as number[];
    const savedDark = localStorage.getItem("mushaf:theme") === "dark";
    if (savedAyah >= 1 && savedAyah <= 7) setSelectedAyah(savedAyah);
    setBookmarks(savedBookmarks.filter((value) => value >= 1 && value <= 7));
    setDark(savedDark);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("mushaf:last-ayah", String(selectedAyah));
    localStorage.setItem("mushaf:bookmarks", JSON.stringify(bookmarks));
    localStorage.setItem("mushaf:theme", dark ? "dark" : "light");
  }, [selectedAyah, bookmarks, dark, hydrated]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    setProgress(0);
    setDuration(0);
    if (playing) {
      audio.play().catch(() => setPlaying(false));
    }
  }, [selectedAyah, reciter]);

  const currentVerse = SURAH_FATIHAH[selectedAyah - 1];
  const filteredSearch = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return SURAH_FATIHAH;
    return SURAH_FATIHAH.filter(
      (verse) =>
        verse.key.includes(query) ||
        verse.transliteration.toLowerCase().includes(query) ||
        "al-fatihah the opener page 1 juz 1".includes(query),
    );
  }, [search]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {
        setNotice("Audio could not start. Check your connection and try again.");
      });
    }
  }

  function moveAyah(direction: -1 | 1) {
    setSelectedAyah((current) => Math.min(7, Math.max(1, current + direction)));
  }

  function handleEnded() {
    const audio = audioRef.current;
    if (!audio) return;
    if (repeatMode === "ayah") {
      audio.currentTime = 0;
      audio.play();
      return;
    }
    const boundary = repeatMode === "range" ? rangeEnd : 7;
    if (selectedAyah < boundary) {
      setSelectedAyah((current) => current + 1);
    } else if (repeatMode === "range") {
      setSelectedAyah(rangeStart);
    } else {
      setPlaying(false);
    }
  }

  function toggleBookmark(ayah = selectedAyah) {
    setBookmarks((current) =>
      current.includes(ayah) ? current.filter((item) => item !== ayah) : [...current, ayah].sort(),
    );
    setNotice(bookmarks.includes(ayah) ? `Ayah ${ayah} removed from bookmarks` : `Ayah ${ayah} bookmarked`);
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
    setActiveNav(item);
    setNotice(`${item} is represented in this reader prototype.`);
  }

  return (
    <main className={dark ? "app-shell dark" : "app-shell"}>
      <a className="skip-link" href="#mushaf-page">Skip to mushaf page</a>
      <aside className="side-rail" aria-label="Primary navigation">
        <button className="brand-mark" aria-label="Mushaf Companion home" onClick={() => chooseNav("Home")}>م</button>
        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={activeNav === item.label ? "nav-button active" : "nav-button"}
              onClick={() => chooseNav(item.label)}
              aria-label={item.label}
              title={item.label}
            >
              <span aria-hidden="true">{item.glyph}</span>
              <small>{item.label}</small>
            </button>
          ))}
        </nav>
        <button className="profile-button" aria-label="Reader profile">KA</button>
      </aside>

      <section className="workspace">
        <header className="reader-header">
          <div className="surah-identity">
            <span className="eyebrow">Juz 1 · Hizb 1</span>
            <div className="title-row">
              <h1>Al-Fātiḥah</h1>
              <span className="arabic-title" lang="ar" dir="rtl" translate="no">الفاتحة</span>
            </div>
          </div>
          <div className="header-tools">
            <button className={tajweed ? "toggle-control active" : "toggle-control"} onClick={() => setTajweed(!tajweed)} aria-pressed={tajweed}>
              <span className="tajweed-dot" /> Tajweed
            </button>
            <button className={transliteration ? "toggle-control active" : "toggle-control"} onClick={() => setTransliteration(!transliteration)} aria-pressed={transliteration}>
              Aa <span>Transliteration</span>
            </button>
            <button className="icon-button" onClick={() => setSearchOpen(true)} aria-label="Search">⌕</button>
            <button className={bookmarks.includes(selectedAyah) ? "icon-button bookmarked" : "icon-button"} onClick={() => toggleBookmark()} aria-label="Bookmark selected ayah">◇</button>
            <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle night mode">{dark ? "☀" : "☾"}</button>
          </div>
        </header>

        <section className="reading-area" aria-label="Mushaf reader">
          <div className="page-rail left-page-rail">
            <span>١</span>
            <small>JUZ</small>
          </div>

          <article id="mushaf-page" className="mushaf-page" aria-label="Page 1, Surah Al-Fatihah">
            <div className="frame-line frame-outer" />
            <div className="frame-line frame-inner" />
            <div className="corner corner-tl" /><div className="corner corner-tr" />
            <div className="corner corner-bl" /><div className="corner corner-br" />
            <div className="page-heading">
              <span>سُورَةُ</span>
              <strong lang="ar" dir="rtl" translate="no">ٱلْفَاتِحَةِ</strong>
              <span>مَكِّيَّة</span>
            </div>
            <div className="ornament" aria-hidden="true"><span>◆</span></div>
            <div className="verses" dir="rtl" lang="ar" translate="no">
              {SURAH_FATIHAH.map((verse) => (
                <div key={verse.key} className="verse-block">
                  <button
                    className={selectedAyah === verse.number ? "verse selected" : "verse"}
                    onClick={() => setSelectedAyah(verse.number)}
                    onDoubleClick={() => toggleBookmark(verse.number)}
                    aria-label={`Select ayah ${verse.number}`}
                  >
                    <span
                      className={tajweed ? "verse-text tajweed-on" : "verse-text"}
                      dangerouslySetInnerHTML={{ __html: tajweed ? verse.tajweed : verse.uthmani }}
                    />
                    {!tajweed && <span className="ayah-marker">{verse.arabicNumber}</span>}
                  </button>
                  {transliteration && (
                    <p className="transliteration" dir="ltr" lang="en" translate="no">
                      <span>{verse.key}</span>{verse.transliteration}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <footer className="page-footer">
              <span>Madani · Hafs</span>
              <span className="page-medallion">١</span>
              <span>Page 1</span>
            </footer>
          </article>

          <div className="page-rail right-page-rail">
            <button aria-label="Previous page" disabled>‹</button>
            <span>1 / 604</span>
            <button aria-label="Next page" onClick={() => setNotice("Only the authenticated first page is bundled in this prototype.")}>›</button>
          </div>
        </section>

        <section className={audioExpanded ? "audio-dock expanded" : "audio-dock"} aria-label="Audio player">
          <button className="drag-handle" aria-label={audioExpanded ? "Collapse player" : "Expand player"} onClick={() => setAudioExpanded(!audioExpanded)}><span /></button>
          <div className="now-playing">
            <div className="reciter-avatar" aria-hidden="true">{RECITERS.find((item) => item.id === reciter)?.initials}</div>
            <div>
              <span className="eyebrow">Now reciting · Ayah {selectedAyah}</span>
              <strong>{RECITERS.find((item) => item.id === reciter)?.name}</strong>
            </div>
          </div>
          <div className="transport">
            <button onClick={() => moveAyah(-1)} disabled={selectedAyah === 1} aria-label="Previous ayah">|‹</button>
            <button className="play-button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>{playing ? "Ⅱ" : "▶"}</button>
            <button onClick={() => moveAyah(1)} disabled={selectedAyah === 7} aria-label="Next ayah">›|</button>
          </div>
          <div className="progress-cluster">
            <span>{formatTime(progress)}</span>
            <input
              type="range"
              min="0"
              max={duration || 1}
              step="0.1"
              value={Math.min(progress, duration || 1)}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (audioRef.current) audioRef.current.currentTime = next;
                setProgress(next);
              }}
              aria-label="Audio progress"
              style={{ "--progress": `${duration ? (progress / duration) * 100 : 0}%` } as React.CSSProperties}
            />
            <span>{formatTime(duration)}</span>
          </div>
          <div className="audio-actions">
            <button className={repeatMode !== "off" ? "active" : ""} onClick={() => setRepeatMode(repeatMode === "off" ? "ayah" : repeatMode === "ayah" ? "range" : "off")} aria-label={`Repeat mode: ${repeatMode}`}>
              ↻ <small>{repeatMode === "off" ? "Off" : repeatMode === "ayah" ? "Ayah" : "Range"}</small>
            </button>
            <button onClick={() => setSpeed(speed === 1 ? 0.75 : speed === 0.75 ? 1.25 : 1)} aria-label="Playback speed">{speed}×</button>
            <button onClick={() => setAudioExpanded(!audioExpanded)} aria-label="Audio settings">•••</button>
          </div>
          {audioExpanded && (
            <div className="audio-options">
              <label>Reciter
                <select value={reciter} onChange={(event) => setReciter(event.target.value as ReciterId)}>
                  {RECITERS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label>Repeat
                <select value={repeatMode} onChange={(event) => setRepeatMode(event.target.value as RepeatMode)}>
                  <option value="off">Off</option><option value="ayah">Current ayah</option><option value="range">Ayah range</option>
                </select>
              </label>
              {repeatMode === "range" && <div className="range-inputs">
                <label>From <select value={rangeStart} onChange={(event) => setRangeStart(Math.min(Number(event.target.value), rangeEnd))}>{SURAH_FATIHAH.map((v) => <option key={v.key} value={v.number}>{v.number}</option>)}</select></label>
                <label>To <select value={rangeEnd} onChange={(event) => setRangeEnd(Math.max(Number(event.target.value), rangeStart))}>{SURAH_FATIHAH.map((v) => <option key={v.key} value={v.number}>{v.number}</option>)}</select></label>
              </div>}
            </div>
          )}
          <audio
            ref={audioRef}
            src={audioUrl(reciter, selectedAyah)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            onEnded={handleEnded}
            preload="metadata"
          />
        </section>
      </section>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {NAV_ITEMS.slice(0, 5).map((item) => <button key={item.label} className={activeNav === item.label ? "active" : ""} onClick={() => chooseNav(item.label)}><span>{item.glyph}</span>{item.label}</button>)}
      </nav>

      {searchOpen && (
        <div className="modal-backdrop" onMouseDown={() => setSearchOpen(false)}>
          <section className="search-panel" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search Quran">
            <header><div><span className="eyebrow">Find your place</span><h2>Search the mushaf</h2></div><button onClick={() => setSearchOpen(false)} aria-label="Close search">×</button></header>
            <div className="search-field"><span>⌕</span><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Surah, ayah, page or juz" /></div>
            <div className="search-meta"><span>Al-Fātiḥah · Page 1</span><span>{filteredSearch.length} results</span></div>
            <div className="search-results">
              {filteredSearch.map((verse) => <button key={verse.key} onClick={() => { setSelectedAyah(verse.number); setSearchOpen(false); }}><span className="result-number">{verse.arabicNumber}</span><span><strong>Al-Fātiḥah · {verse.key}</strong><small>{verse.transliteration}</small></span><span className="result-arrow">→</span></button>)}
              {!filteredSearch.length && <p className="empty-state">No matches in the bundled page. Production search will cover all 604 pages.</p>}
            </div>
          </section>
        </div>
      )}

      {notice && <button className="toast" onClick={() => setNotice("")} aria-live="polite">{notice}<span>×</span></button>}
    </main>
  );
}
