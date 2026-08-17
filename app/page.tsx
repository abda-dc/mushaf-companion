"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  DEFAULT_RECITERS,
  FALLBACK_PAGE,
  OTHER_RECITERS,
  RECITERS,
  searchReciters,
  type PageWord,
  type QuranChapterInfo,
  type QuranPage,
  type ReciterId,
  type SearchResult,
} from "./quran-data";
import { TAJWEED_RULES, rulesForTajweedHtml, type TajweedRule } from "./tajweed-guide";
import { audioStreamUrl } from "./audio-manifest.mjs";
import { OfflineAudioPanel } from "./offline-audio-panel";
import { formatAudioBytes, getOfflineAudioStats, getVerifiedAudioBlob, type OfflineAudioPack } from "./offline-audio.mjs";
import { TafsirPanel } from "./tafsir-panel";
import type { TafsirDocument } from "./tafsir-source.mjs";
import { AyahContextLens } from "./ayah-context-lens";
import type { ContextLensTab } from "./ayah-context-lens-state";
import { StudyNotesIndex } from "./study-notes-ui";
import { LearnPanel } from "./learn-panel";
import { scheduleLearnFocusRestore } from "./learn-focus.mjs";
import { getReaderTransport } from "./content/runtime-transport";
import { resolveQuranPageEdition } from "./content/quran-page-editions";
import { DEFAULT_READING_ID, type ReadingId } from "./reading-registry.mjs";
import { appPath } from "./runtime-config";
import { createTranslationPackService, type TranslationPackService } from "./translation-packs.mjs";
import {
  LatestEvidenceRequestGate,
  createProductionEvidenceRegistry,
  type EvidenceProviderRegistry,
  type EvidenceQueryResult,
  type ResolvedEvidenceEdge,
} from "./evidence-layer";
import type { EducationCatalogResult, EducationQuranCitation } from "./education-content";
import {
  DEFAULT_EDUCATION_PROGRESS,
  completeEducationLesson,
  dueEducationReviews,
  normalizeEducationProgress,
  recordEducationKnowledgeReview,
  startEducationLesson,
  type EducationProgress,
} from "./education-state.mjs";
import {
  DEFAULT_HIFZ_PROGRESS,
  buildPageMasteryMap,
  calculateStreak,
  dueReviewCount,
  normalizeHifzProgress,
  recordHifzActivity,
  recordVerseReview,
  todaysMemorizedCount,
  toLocalDateKey,
  toggleMemorizedVerse,
  type DailyPlanItem,
  type HifzProgress,
  type ReviewGrade,
} from "./hifz-state.mjs";
import {
  createPortableBackup,
  loadPreferences,
  restorePortableBackup,
  savePreferences,
  type MushafPreferences,
} from "./preferences.mjs";
import {
  WORD_STUDY_PROVIDER_REGISTRY,
  LatestWordStudyRequestGate,
  buildPageWordCoordinateIndex,
  coordinateKey,
  coordinateForPageWord,
  coordinatesMatch,
  pageWordForCoordinate,
  pageWordIdentity,
  type QuranWordStudyRecord,
  type WordCoordinate,
  type WordOccurrence,
  type WordStudySourceMetadata,
} from "./word-study";
import { FOUNDATION_125_ID, VOCABULARY_CURRICULUM_REGISTRY } from "./vocabulary-curriculum";
import { DEFAULT_VOCABULARY_PROGRESS, dueVocabularyEntries, normalizeVocabularyProgress, type VocabularyProgress } from "./vocabulary-state.mjs";
import {
  DEFAULT_TODAY_STUDY_PROGRESS,
  buildTodayStudyPlan,
  completeTodayStudyStep,
  currentTodayStudyStep,
  educationReviewStepComplete,
  normalizeTodayStudyProgress,
  remainingEducationReviewTargets,
  skipTodayStudyStep,
  startOrResumeTodayStudy,
  startTodayStudyStep,
  todayStudyCompletion,
  type TodayStudyProgress,
  type TodayStudyTarget,
} from "./today-study.mjs";
import {
  DEFAULT_STUDY_NOTES,
  buildStudyNoteIndex,
  createStudyNote,
  deleteStudyNote as deletePrivateStudyNote,
  normalizeStudyNotes,
  revalidateStudyAnchor,
  removeStudyTag,
  renameStudyTag,
  studyAnchorKey,
  updateStudyNote,
  type StudyAnchor,
  type LessonStudyAnchor,
  type StudyNote,
  type StudyNotesState,
} from "./study-notes.mjs";

type NavItem = "Home" | "Contents" | "Read" | "Learn" | "Listen" | "Bookmarks" | "Search" | "Settings";
type MobileNavItem = "Home" | "Read" | "Learn" | "Listen" | "More";
type Overlay = Exclude<NavItem, "Read"> | "More" | "Hifz" | "Downloads" | "Tafsir" | "Context" | "Jump" | null;
type RepeatMode = "off" | "ayah" | "range";
type PageEdge = "first" | "last" | null;
type PageScale = "compact" | "comfortable" | "large";
type ReadingFont = "amiri" | "lateef" | "scheherazade" | "uthman-taha";
type HifzRepeatCount = 3 | 5 | 7 | 10;
type HifzPauseMs = 0 | 1500 | 3000 | 5000;
type HifzPace = 0.75 | 1 | 1.25;

interface HifzLoop {
  active: boolean;
  verseKeys: string[];
  pass: number;
  totalPasses: HifzRepeatCount;
  pauseMs: HifzPauseMs;
}

const ACTIVE_READING_ID: ReadingId = DEFAULT_READING_ID;
const ACTIVE_PAGE_EDITION = resolveQuranPageEdition(ACTIVE_READING_ID);
const TOTAL_PAGES = ACTIVE_PAGE_EDITION.pages;
const JUZ_START_PAGES = [1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582] as const;
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
  { label: "Learn", glyph: "◎" },
  { label: "Listen", glyph: "◖" },
  { label: "Bookmarks", glyph: "◇" },
  { label: "Search", glyph: "⌕" },
  { label: "Settings", glyph: "⚙" },
];
const MOBILE_NAV_ITEMS: Array<{ label: MobileNavItem; glyph: string }> = [
  { label: "Home", glyph: "⌂" },
  { label: "Read", glyph: "▤" },
  { label: "Learn", glyph: "◎" },
  { label: "Listen", glyph: "◖" },
  { label: "More", glyph: "•••" },
];
const FONT_LOADS = new Map<string, Promise<string>>();

interface TajweedFocus {
  word: string;
  verseKey: string;
  rules: TajweedRule[];
}

interface SelectedWordContext {
  coordinate: WordCoordinate;
  surfaceText: string;
  tajweedRules: TajweedRule[];
}

function clampPage(value: number) {
  return Math.min(TOTAL_PAGES, Math.max(1, Math.round(value)));
}

function quranPageCacheKey(readingId: ReadingId, page: number) {
  return `${readingId}:${page}`;
}

function isVerifiedPage(
  value: unknown,
  expectedPage: number,
  readingId: ReadingId = ACTIVE_READING_ID,
): value is QuranPage {
  if (!value || typeof value !== "object") return false;
  const edition = resolveQuranPageEdition(readingId);
  const page = value as Partial<QuranPage>;
  return page.page === expectedPage
    && Array.isArray(page.lines)
    && page.lines.length === edition.lineCount
    && page.lines.every((line, index) => line.number === index + 1 && Array.isArray(line.words))
    && Array.isArray(page.verses)
    && page.verses.length > 0
    && page.verses.every((verse) => /^\d{1,3}:\d{1,3}$/.test(verse.key))
    && page.provenance?.verified === true
    && page.provenance.manifestRevision === edition.manifestRevision
    && page.provenance.mushafId === edition.mushafId
    && /^[a-f0-9]{64}$/.test(page.provenance.pageChecksum ?? "");
}

function isVerifiedTafsir(value: unknown, verseKey: string): value is TafsirDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Partial<TafsirDocument>;
  return document.schemaVersion === 1
    && document.requestedVerseKey === verseKey
    && document.resource?.id === 169
    && Array.isArray(document.mappedVerseKeys)
    && document.mappedVerseKeys.includes(verseKey)
    && Array.isArray(document.blocks)
    && document.blocks.length > 0
    && document.blocks.every((block) => typeof block.text === "string" && block.text.length > 0)
    && document.provenance?.verified === true
    && /^[a-f0-9]{64}$/.test(document.provenance.contentChecksum ?? "");
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
  const contentTransport = getReaderTransport();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState<QuranPage>(FALLBACK_PAGE);
  const [jumpValue, setJumpValue] = useState("1");
  const [jumpChapterId, setJumpChapterId] = useState(1);
  const [jumpJuz, setJumpJuz] = useState(1);
  const [jumpError, setJumpError] = useState("");
  const [recentPages, setRecentPages] = useState<number[]>([1]);
  const [loadingPage, setLoadingPage] = useState(false);
  const [turnDirection, setTurnDirection] = useState<"next" | "previous" | "">("");
  const [tajweed, setTajweed] = useState(true);
  const [transliteration, setTransliteration] = useState(false);
  const [translation, setTranslation] = useState(false);
  const [dark, setDark] = useState(false);
  const [pageScale, setPageScale] = useState<PageScale>("comfortable");
  const [readingFont, setReadingFont] = useState<ReadingFont>("uthman-taha");
  const [selectedVerseKey, setSelectedVerseKey] = useState("1:1");
  const [studyInitialTab, setStudyInitialTab] = useState<ContextLensTab>("overview");
  const [studyActiveTab, setStudyActiveTab] = useState<ContextLensTab>("overview");
  const [selectedWord, setSelectedWord] = useState<SelectedWordContext | null>(null);
  const [wordRecordResult, setWordRecordResult] = useState<{ key: string; record: QuranWordStudyRecord | null } | null>(null);
  const [wordStudySource, setWordStudySource] = useState<WordStudySourceMetadata | null>(null);
  const [occurrenceExplorer, setOccurrenceExplorer] = useState<{ kind: "lemma" | "root"; identifier: string; label: string; items: WordOccurrence[]; total: number; status: "loading" | "ok" | "unavailable" | "error"; reason: string } | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [reciter, setReciter] = useState<ReciterId>("alafasy");
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [rangeStart, setRangeStart] = useState("1:1");
  const [rangeEnd, setRangeEnd] = useState("1:7");
  const [hifzProgress, setHifzProgress] = useState<HifzProgress>(() => normalizeHifzProgress(DEFAULT_HIFZ_PROGRESS));
  const [vocabularyProgress, setVocabularyProgress] = useState<VocabularyProgress>(() => normalizeVocabularyProgress(DEFAULT_VOCABULARY_PROGRESS));
  const [todayStudyProgress, setTodayStudyProgress] = useState<TodayStudyProgress>(() => normalizeTodayStudyProgress(DEFAULT_TODAY_STUDY_PROGRESS));
  const [educationProgress, setEducationProgress] = useState<EducationProgress>(() => normalizeEducationProgress(DEFAULT_EDUCATION_PROGRESS));
  const [educationCatalogResult, setEducationCatalogResult] = useState<EducationCatalogResult | { status: "loading" }>({ status: "disabled", reason: "Guided courses awaiting approved curriculum." });
  const [studyNotes, setStudyNotes] = useState<StudyNotesState>(() => normalizeStudyNotes(DEFAULT_STUDY_NOTES));
  const [evidenceResult, setEvidenceResult] = useState<EvidenceQueryResult | { status: "loading" }>({ status: "disabled", reason: "No rights-cleared evidence dataset is active." });
  const [savedSection, setSavedSection] = useState<"bookmarks" | "notes">("bookmarks");
  const [todayKey, setTodayKey] = useState(() => toLocalDateKey());
  const [studySessionVisible, setStudySessionVisible] = useState(false);
  const [hifzFrom, setHifzFrom] = useState("1:1");
  const [hifzTo, setHifzTo] = useState("1:7");
  const [hifzRepeatCount, setHifzRepeatCount] = useState<HifzRepeatCount>(5);
  const [hifzPauseMs, setHifzPauseMs] = useState<HifzPauseMs>(1500);
  const [hifzPace, setHifzPace] = useState<HifzPace>(1);
  const [hifzHidden, setHifzHidden] = useState(false);
  const [revealedVerses, setRevealedVerses] = useState<string[]>([]);
  const [verseActionsOpen, setVerseActionsOpen] = useState(false);
  const [hifzLoop, setHifzLoop] = useState<HifzLoop | null>(null);
  const [activePlan, setActivePlan] = useState<DailyPlanItem[]>([]);
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [wifiOnlyDownloads, setWifiOnlyDownloads] = useState(true);
  const [offlineAudioRevision, setOfflineAudioRevision] = useState(0);
  const [offlineAudioStats, setOfflineAudioStats] = useState({ usedBytes: 0, packCount: 0, completePacks: 0 });
  const [audioSource, setAudioSource] = useState<{ key: string; url: string; offline: boolean } | null>(null);
  const [offlinePackQueue, setOfflinePackQueue] = useState<string[]>([]);
  const [offlinePackIndex, setOfflinePackIndex] = useState(0);
  const [tafsirDocument, setTafsirDocument] = useState<TafsirDocument | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState("");
  const [tafsirRevision, setTafsirRevision] = useState(0);
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
  const pageCacheRef = useRef(new Map<string, QuranPage>());
  const lastGoodPageRef = useRef(FALLBACK_PAGE);
  const pendingVerseRef = useRef<string | null>(null);
  const pendingWordRef = useRef<WordCoordinate | null>(null);
  const pendingEdgeRef = useRef<PageEdge>(null);
  const pendingAutoplayRef = useRef(false);
  const surahPlaybackRef = useRef<number | null>(null);
  const hifzPauseTimerRef = useRef<number | null>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const tafsirCacheRef = useRef(new Map<string, TafsirDocument>());
  const translationPackServiceRef = useRef<TranslationPackService | null>(null);
  const contextTriggerRef = useRef<HTMLButtonElement | null>(null);
  const occurrenceRequestGateRef = useRef(new LatestWordStudyRequestGate());
  const evidenceRequestGateRef = useRef(new LatestEvidenceRequestGate());
  const evidenceRegistryRef = useRef<EvidenceProviderRegistry | null>(null);
  const educationCatalogRequestedRef = useRef(false);
  const pendingReadingStartRef = useRef<{ stepId: string; page: number; verseKey: string } | null>(null);
  const pendingStudyNoteRef = useRef<StudyNote | null>(null);
  const wordButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const verseButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const studyControlRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const readerArticleRef = useRef<HTMLElement | null>(null);
  const learnTriggerRef = useRef<HTMLButtonElement | null>(null);
  const desktopLearnNavRef = useRef<HTMLButtonElement | null>(null);
  const mobileLearnNavRef = useRef<HTMLButtonElement | null>(null);

  const activeNav: NavItem = overlay === "Hifz" || overlay === "Downloads" || overlay === "Tafsir" || overlay === "Context" || overlay === "Jump" || overlay === "More" ? "Read" : overlay ?? "Read";
  const activeMobileNav: MobileNavItem = overlay === "Home" ? "Home" : overlay === "Learn" ? "Learn" : overlay === "Listen" || overlay === "Downloads" ? "Listen" : overlay === "More" || overlay === "Contents" || overlay === "Bookmarks" || overlay === "Search" || overlay === "Settings" ? "More" : "Read";
  const selectedVerse = pageData.verses.find((verse) => verse.key === selectedVerseKey) ?? pageData.verses[0];
  const currentChapter = chapterForVerse(pageData, selectedVerse?.key ?? "1:1");
  const currentVerseIndex = pageData.verses.findIndex((verse) => verse.key === selectedVerseKey);
  const displayedTafsir = tafsirDocument?.requestedVerseKey === selectedVerseKey ? tafsirDocument : null;
  const canStudyPrevious = currentVerseIndex > 0 || pageData.page > 1;
  const canStudyNext = currentVerseIndex >= 0 && (currentVerseIndex < pageData.verses.length - 1 || pageData.page < TOTAL_PAGES);
  const currentBookmark = `${pageData.page}|${selectedVerseKey}`;
  const wordCoordinateIndex = useMemo(() => buildPageWordCoordinateIndex(pageData), [pageData]);
  const foundation125 = useMemo(() => VOCABULARY_CURRICULUM_REGISTRY.list().find((curriculum) => curriculum.id === FOUNDATION_125_ID) ?? null, []);
  const foundationEntryIds = useMemo<string[]>(() => [], []);
  const educationCatalog = educationCatalogResult.status === "ready" ? educationCatalogResult.catalog : null;
  const educationIdentity = educationCatalog ? { sourceId: educationCatalog.sourceId, sourceRevision: educationCatalog.sourceRevision } : null;
  const educationSourceCurrent = Boolean(educationCatalog && (!educationProgress.sourceId || (educationProgress.sourceId === educationCatalog.sourceId && educationProgress.sourceRevision === educationCatalog.sourceRevision)));
  const currentEducationLesson = educationCatalog && educationSourceCurrent && educationProgress.currentLesson ? educationCatalog.lessons.find((lesson) => lesson.id === educationProgress.currentLesson?.lessonId && lesson.courseId === educationProgress.currentLesson?.courseId && lesson.moduleId === educationProgress.currentLesson?.moduleId) ?? null : null;
  const educationDueReviews = educationCatalog && educationProgress.sourceId === educationCatalog.sourceId && educationProgress.sourceRevision === educationCatalog.sourceRevision ? dueEducationReviews(educationProgress, todayKey) : [];
  const selectedWordKey = selectedWord ? coordinateKey(selectedWord.coordinate) : null;
  const studyNoteIndex = useMemo(() => buildStudyNoteIndex(studyNotes), [studyNotes]);
  const selectedAyahNoteKey = studyAnchorKey({ type: "ayah", verseKey: selectedVerseKey, page: pageData.page });
  const selectedWordNoteKey = selectedWord ? studyAnchorKey({ type: "word", ...selectedWord.coordinate }) : null;
  const selectedAyahNotes = selectedAyahNoteKey ? studyNoteIndex.byAnchor.get(selectedAyahNoteKey) ?? [] : [];
  const selectedWordNotes = selectedWordNoteKey ? studyNoteIndex.byAnchor.get(selectedWordNoteKey) ?? [] : [];
  const wordRecord = selectedWordKey && wordRecordResult?.key === selectedWordKey ? wordRecordResult.record : null;
  const wordStudyLoading = Boolean(selectedWordKey && wordRecordResult?.key !== selectedWordKey);
  const pageProgress = (pageData.page / TOTAL_PAGES) * 100;
  const currentReciter = RECITERS.find((item) => item.id === reciter) ?? RECITERS[0];
  const isSurahPlayback = currentReciter.scope === "surah" || surahPlaybackChapter !== null;
  const isOfflinePackPlayback = offlinePackQueue.length > 0;
  const unifiedActivityDates = useMemo(() => [...new Set([...hifzProgress.activityDates, ...vocabularyProgress.activityDates, ...educationProgress.activityDates, ...todayStudyProgress.activityDates])].sort(), [hifzProgress.activityDates, vocabularyProgress.activityDates, educationProgress.activityDates, todayStudyProgress.activityDates]);
  const studyStreak = calculateStreak(unifiedActivityDates, todayKey);
  const todayMemorized = todaysMemorizedCount(hifzProgress, todayKey);
  const dueReviews = dueReviewCount(hifzProgress, todayKey);
  const todayGoalPercent = Math.min(100, (todayMemorized / hifzProgress.dailyGoal) * 100);
  const memorizedVerseKeys = new Set(hifzProgress.memorized.map((item) => item.verseKey));
  const pageMasteryMap = useMemo(() => buildPageMasteryMap(hifzProgress, todayKey), [hifzProgress, todayKey]);
  const masteryCounts = useMemo(() => pageMasteryMap.reduce((counts, item) => ({ ...counts, [item.status]: counts[item.status] + 1 }), { "not-started": 0, learning: 0, due: 0, strong: 0 }), [pageMasteryMap]);
  const todayPlan = useMemo(() => buildTodayStudyPlan({ hifzProgress, vocabularyProgress, educationProgress, educationCatalog, curriculumEntryIds: foundationEntryIds, reading: { page: pageData.page, verseKey: selectedVerseKey }, sessionMinutes: hifzProgress.sessionMinutes, date: todayKey }), [hifzProgress, vocabularyProgress, educationProgress, educationCatalog, foundationEntryIds, pageData.page, selectedVerseKey, todayKey]);
  const activeStudySession = todayStudyProgress.activeSession?.dateKey === todayKey ? todayStudyProgress.activeSession : null;
  const activeStudyStep = currentTodayStudyStep(todayStudyProgress, todayKey);
  const activeStudyStepStarted = Boolean(activeStudyStep && activeStudySession?.startedStepIds.includes(activeStudyStep.id));
  const activeEducationReviewTargets = activeStudyStep?.kind === "education-review" ? activeStudyStep.targets as Array<Extract<TodayStudyTarget, { checkId: string }>> : [];
  const remainingActiveEducationReviews = activeStudyStep?.kind === "education-review" ? remainingEducationReviewTargets(activeStudyStep, educationProgress, activeStudySession?.dateKey ?? todayKey) : [];
  const activeEducationReview = activeStudyStep?.kind === "education-review" ? { completed: activeEducationReviewTargets.length - remainingActiveEducationReviews.length, total: activeEducationReviewTargets.length, current: remainingActiveEducationReviews[0] ?? null } : null;
  const displayedTodayPlan = activeStudySession ? { dateKey: activeStudySession.dateKey, sessionMinutes: activeStudySession.sessionMinutes, steps: activeStudySession.steps, totalEstimatedMinutes: activeStudySession.steps.reduce((sum, step) => sum + step.estimatedMinutes, 0) } : todayPlan;
  const todayCompletion = todayStudyCompletion(todayStudyProgress, displayedTodayPlan, todayKey);
  const todaySessionFinished = Boolean(activeStudySession && !activeStudyStep);
  const studyDurationLocked = Boolean(activeStudySession && activeStudyStep);
  const vocabularyDue = foundationEntryIds.length ? dueVocabularyEntries(vocabularyProgress, todayKey).length : 0;
  const currentPlanItem = activePlan[activePlanIndex];
  const [reciterSearch, setReciterSearch] = useState("");
  const displayedOtherReciters = useMemo(() => {
    if (!reciterSearch.trim()) return OTHER_RECITERS;
    const filtered = searchReciters(reciterSearch, OTHER_RECITERS);
    const isCurrentOther = OTHER_RECITERS.some((item) => item.id === reciter);
    if (isCurrentOther && !filtered.some((item) => item.id === reciter)) {
      const current = OTHER_RECITERS.find((item) => item.id === reciter);
      return current ? [current, ...filtered] : filtered;
    }
    return filtered;
  }, [reciterSearch, reciter]);
  const selectedChapterId = selectedVerseKey ? selectedVerseKey.split(":")[0] : "1";
  const targetAudioKey = currentReciter.scope === "surah" ? `${reciter}|chapter:${selectedChapterId}` : `${reciter}|${selectedVerseKey}`;
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
  const savedPageShortcuts = [...new Map(bookmarks.map((bookmark) => {
    const [savedPage, verseKey] = bookmark.split("|");
    return [Number(savedPage), { page: Number(savedPage), verseKey }];
  })).values()].slice(0, 6);

  useEffect(() => {
    const preferences = loadPreferences(localStorage);
    const urlPage = Number(new URL(window.location.href).searchParams.get("page"));
    const savedPage = preferences.reader.lastPage;
    const initialPage = clampPage(Number.isInteger(urlPage) && urlPage >= 1 && urlPage <= TOTAL_PAGES ? urlPage : savedPage);
    const savedVerse = preferences.reader.lastVerse;
    const savedVersePage = preferences.reader.lastVersePage;
    pendingVerseRef.current = savedVersePage === initialPage ? savedVerse : null;
    // Browser-only persistence is intentionally hydrated after the server shell.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(initialPage);
    setJumpValue(String(initialPage));
    setRecentPages(preferences.reader.recentPages);
    setBookmarks(preferences.bookmarks);
    setHifzProgress(preferences.hifz);
    setVocabularyProgress(preferences.vocabulary);
    setTodayStudyProgress(preferences.study);
    setEducationProgress(preferences.education);
    setStudyNotes(preferences.notes);
    setDark(preferences.reader.theme === "dark");
    setTajweed(preferences.reader.tajweed);
    setTransliteration(preferences.reader.transliteration);
    setTranslation(preferences.reader.translation);
    setReciter(preferences.reader.reciter);
    setPageScale(preferences.reader.pageScale);
    setReadingFont(preferences.reader.readingFont);
    setSpeed(preferences.reader.speed);
    setWifiOnlyDownloads(preferences.downloads.wifiOnly);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if ((overlay !== "Learn" && overlay !== "Hifz") || educationCatalogRequestedRef.current) return;
    educationCatalogRequestedRef.current = true;
    setEducationCatalogResult({ status: "loading" });
    contentTransport.loadEducationCatalog()
      .then((result) => setEducationCatalogResult(result))
      .catch(() => {
        educationCatalogRequestedRef.current = false;
        setEducationCatalogResult({ status: "error", reason: "Guided education sources could not be checked safely." });
      });
  }, [overlay, contentTransport]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const cacheKey = quranPageCacheKey(ACTIVE_READING_ID, page);
    const cached = pageCacheRef.current.get(cacheKey);
    const applyPage = (data: QuranPage) => {
      if (cancelled) return;
      lastGoodPageRef.current = data;
      setPageData(data);
      setRecentPages((pages) => [data.page, ...pages.filter((item) => item !== data.page)].slice(0, 6));
      setTajweedFocus(null);
      setSelectedWord(null);
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
        selectAyah(nextVerse);
      }
      const requestedWord = pendingWordRef.current;
      if (requestedWord) {
        const mappedWord = wordContextForCoordinate(data, requestedWord);
        if (mappedWord) setSelectedWord(mappedWord);
        else setNotice("The audited occurrence could not be matched to this verified Mushaf page.");
      }
      setRangeStart(data.verses[0]?.key ?? "");
      setRangeEnd(data.verses.at(-1)?.key ?? "");
      setHifzFrom(data.verses[0]?.key ?? "");
      setHifzTo(data.verses.at(-1)?.key ?? "");
      setRevealedVerses([]);
      setVerseActionsOpen(false);
      pendingVerseRef.current = null;
      pendingWordRef.current = null;
      pendingEdgeRef.current = null;
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
    contentTransport.loadPageForReading(ACTIVE_READING_ID, page)
      .then((data) => {
        if (!isVerifiedPage(data, page, ACTIVE_READING_ID)) throw new Error("Page integrity check failed");
        pageCacheRef.current.set(cacheKey, data);
        applyPage(data);
        [page - 1, page + 1].filter((item) => {
          if (item < 1 || item > TOTAL_PAGES) return false;
          return !pageCacheRef.current.has(quranPageCacheKey(ACTIVE_READING_ID, item));
        }).forEach((item) => {
          contentTransport.loadPageForReading(ACTIVE_READING_ID, item).then((next) => {
            if (isVerifiedPage(next, item, ACTIVE_READING_ID)) {
              pageCacheRef.current.set(quranPageCacheKey(ACTIVE_READING_ID, item), next);
            }
          }).catch(() => undefined);
        });
      })
      .catch(() => {
        if (cancelled) return;
        pendingAutoplayRef.current = false;
        pendingEdgeRef.current = null;
        updatePlaying(false);
        const previous = lastGoodPageRef.current;
        setPage(previous.page);
        setJumpValue(String(previous.page));
        setLoadingPage(false);
        setTurnDirection("");
        setNotice("Verified page data is temporarily unavailable. Your last confirmed page is still open.");
      });
    return () => { cancelled = true; };
  }, [page, hydrated, contentTransport]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedWord || overlay !== "Context" || studyActiveTab !== "words") return () => { cancelled = true; };
    const requestKey = coordinateKey(selectedWord.coordinate);
    const loadWord = async () => {
      for (const sourceId of WORD_STUDY_PROVIDER_REGISTRY.listSourceIds()) {
        const activation = await WORD_STUDY_PROVIDER_REGISTRY.activate(sourceId);
        if (cancelled) return;
        if (activation.status !== "active") continue;
        const record = await WORD_STUDY_PROVIDER_REGISTRY.getWord(sourceId, selectedWord.coordinate);
        if (cancelled) return;
        setWordStudySource(activation.activation.metadata);
        setWordRecordResult({ key: requestKey, record });
        return;
      }
      setWordStudySource(null);
      setWordRecordResult({ key: requestKey, record: null });
    };
    void loadWord();
    return () => { cancelled = true; };
  }, [selectedWord, selectedWordKey, overlay, studyActiveTab]);

  useEffect(() => {
    const gate = evidenceRequestGateRef.current;
    if (overlay !== "Context" || studyActiveTab !== "evidence") {
      gate.cancel();
      return;
    }
    evidenceRegistryRef.current ??= createProductionEvidenceRegistry(async (verseKey) => {
      try {
        const target = await contentTransport.lookupVerse(verseKey);
        return { verseKey: target.verseKey, page: target.page };
      } catch {
        return null;
      }
    });
    const token = gate.begin(`${selectedVerseKey}|${pageData.page}`);
    const registry = evidenceRegistryRef.current;
    void registry.queryAll(selectedVerseKey, pageData.page)
      .then((result) => {
        if (gate.isCurrent(token)) setEvidenceResult(result);
      })
      .catch(() => {
        if (gate.isCurrent(token)) setEvidenceResult({ status: "error", reason: "Evidence sources could not be queried." });
      });
    return () => gate.cancel();
  }, [overlay, studyActiveTab, selectedVerseKey, pageData.page, contentTransport]);

  useEffect(() => {
    let timer = 0;
    const scheduleNextMidnight = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      timer = window.setTimeout(() => {
        setTodayKey(toLocalDateKey());
        scheduleNextMidnight();
      }, Math.max(1_000, next.getTime() - now.getTime() + 250));
    };
    scheduleNextMidnight();
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const pending = pendingReadingStartRef.current;
    if (!pending || pageData.page !== pending.page || selectedVerseKey !== pending.verseKey) return;
    const freshDay = toLocalDateKey();
    setTodayKey(freshDay);
    setTodayStudyProgress((current) => startTodayStudyStep(current, pending.stepId, freshDay));
    pendingReadingStartRef.current = null;
    setNotice("Reading step started. Complete it after your reading session.");
  }, [pageData.page, selectedVerseKey]);

  useEffect(() => {
    const note = pendingStudyNoteRef.current;
    if (!note || note.anchor.type === "lesson" || pageData.page !== note.anchor.page || selectedVerseKey !== note.anchor.verseKey) return;
    if (note.anchor.type === "word") {
      const mappedWord = wordContextForCoordinate(pageData, note.anchor);
      if (!mappedWord) {
        pendingStudyNoteRef.current = null;
        setNotice("That private word note no longer matches the trusted Mushaf coordinate and was not opened.");
        return;
      }
      setSelectedWord(mappedWord);
    } else {
      setSelectedWord(null);
    }
    pendingStudyNoteRef.current = null;
    translationPackServiceRef.current ??= createTranslationPackService({ fetchImpl: contentTransport.fetchTranslationPackSource });
    setStudyInitialTab("notes");
    setStudyActiveTab("notes");
    setOverlay("Context");
  }, [pageData, selectedVerseKey, contentTransport]);

  useEffect(() => {
    if (!hydrated) return;
    savePreferences(localStorage, {
      version: 8,
      reader: {
        lastPage: pageData.page,
        lastVerse: selectedVerseKey,
        lastVersePage: pageData.page,
        recentPages,
        theme: dark ? "dark" : "light",
        tajweed,
        transliteration,
        translation,
        reciter,
        speed,
        pageScale,
        readingFont,
      },
      bookmarks,
      hifz: hifzProgress,
      vocabulary: vocabularyProgress,
      study: todayStudyProgress,
      education: educationProgress,
      notes: studyNotes,
      downloads: { wifiOnly: wifiOnlyDownloads },
    } satisfies MushafPreferences);
  }, [selectedVerseKey, pageData.page, recentPages, bookmarks, dark, tajweed, transliteration, translation, reciter, speed, pageScale, readingFont, hifzProgress, vocabularyProgress, todayStudyProgress, educationProgress, studyNotes, wifiOnlyDownloads, hydrated]);

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
    if (!hydrated) return;
    getOfflineAudioStats().then((stats) => setOfflineAudioStats({ usedBytes: stats.usedBytes, packCount: stats.packCount, completePacks: stats.completePacks })).catch(() => undefined);
  }, [hydrated, offlineAudioRevision]);

  const audioSourceKey = audioSource?.key;
  useEffect(() => {
    if (!hydrated || !selectedVerseKey) return;
    if (currentReciter.scope === "surah" && audioSourceKey === targetAudioKey) return;
    let cancelled = false;
    let objectUrl = "";
    if (playingRef.current) pendingAutoplayRef.current = true;
    const resolveSource = async () => {
      const blob = reciter === "alafasy" ? await getVerifiedAudioBlob(reciter, selectedVerseKey).catch(() => null) : null;
      if (cancelled) return;
      if (blob) {
        objectUrl = URL.createObjectURL(blob);
        setAudioSource({ key: targetAudioKey, url: objectUrl, offline: true });
      } else {
        setAudioSource({ key: targetAudioKey, url: audioStreamUrl(reciter, selectedVerseKey), offline: false });
      }
    };
    void resolveSource();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [hydrated, offlineAudioRevision, reciter, targetAudioKey, audioSourceKey, selectedVerseKey, currentReciter.scope]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSource || audioSource.key !== targetAudioKey) return;
    const shouldAutoplay = playingRef.current || pendingAutoplayRef.current;
    pendingAutoplayRef.current = false;
    audio.load();
    setProgress(0);
    setDuration(0);
    if (shouldAutoplay) audio.play().then(() => updatePlaying(true)).catch(() => {
      updatePlaying(false);
      setNotice("The recitation is ready. Tap play to begin.");
    });
  }, [audioSource, targetAudioKey]);

  useEffect(() => {
    if (overlay !== "Search") return;
    if (!search.trim()) return;
    const timer = window.setTimeout(() => {
      setSearching(true);
      contentTransport.search(search)
        .then((payload) => setSearchResults(payload.results))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 320);
    return () => window.clearTimeout(timer);
  }, [search, overlay, contentTransport]);

  useEffect(() => {
    if ((overlay !== "Tafsir" && !(overlay === "Context" && studyActiveTab === "tafsir")) || !selectedVerseKey) return;
    let cancelled = false;
    const controller = new AbortController();
    const cached = tafsirCacheRef.current.get(selectedVerseKey);
    queueMicrotask(() => {
      if (cancelled) return;
      setTafsirError("");
      if (cached) {
        setTafsirDocument(cached);
        setTafsirLoading(false);
      } else {
        setTafsirLoading(true);
      }
    });
    if (!cached) {
      contentTransport.loadTafsir(selectedVerseKey, controller.signal)
        .then((payload) => {
          if (!isVerifiedTafsir(payload, selectedVerseKey)) throw new Error("Tafsir integrity verification failed.");
          return payload;
        })
        .then((document) => {
          if (cancelled) return;
          tafsirCacheRef.current.set(selectedVerseKey, document);
          setTafsirDocument(document);
        })
        .catch((error: unknown) => {
          if (cancelled || controller.signal.aborted) return;
          setTafsirError(error instanceof Error ? error.message : "Tafsir is unavailable.");
        })
        .finally(() => { if (!cancelled) setTafsirLoading(false); });
    }
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [overlay, studyActiveTab, selectedVerseKey, tafsirRevision, contentTransport]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && (overlay || tajweedGuideOpen)) {
        event.preventDefault();
        if (overlay === "Learn") {
          closeLearn();
          setTajweedGuideOpen(false);
          return;
        }
        const restoreContextFocus = overlay === "Context";
        setOverlay(null);
        setTajweedGuideOpen(false);
        if (restoreContextFocus) closeContextLens();
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

  useEffect(() => () => {
    if (hifzPauseTimerRef.current !== null) window.clearTimeout(hifzPauseTimerRef.current);
  }, []);

  function updatePlaying(value: boolean) {
    playingRef.current = value;
    setPlaying(value);
  }

  function updateSurahPlayback(chapterId: number | null) {
    surahPlaybackRef.current = chapterId;
    setSurahPlaybackChapter(chapterId);
  }

  function stopPlayback(showNotice = true) {
    pendingAutoplayRef.current = false;

    if (hifzPauseTimerRef.current !== null) {
      window.clearTimeout(hifzPauseTimerRef.current);
      hifzPauseTimerRef.current = null;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setHifzLoop(null);
    setOfflinePackQueue([]);
    setOfflinePackIndex(0);
    updateSurahPlayback(null);
    updatePlaying(false);
    setProgress(0);

    if (showNotice) {
      setNotice(`Recitation stopped at ayah ${selectedVerseKey}.`);
    }
  }
  function selectAyah(verseKey: string) {
    occurrenceRequestGateRef.current.cancel();
    evidenceRequestGateRef.current.cancel();
    setSelectedWord(null);
    setOccurrenceExplorer(null);
    setSelectedVerseKey(verseKey);
  }

  function wordContextForCoordinate(data: QuranPage, coordinate: WordCoordinate): SelectedWordContext | null {
    const word = pageWordForCoordinate(data, coordinate);
    if (!word) return null;
    const trustedCoordinate = coordinateForPageWord(data, word);
    if (!trustedCoordinate) return null;
    return { coordinate: trustedCoordinate, surfaceText: word.text, tajweedRules: rulesForTajweedHtml(word.tajweedHtml) };
  }

  function selectReciter(nextReciter: ReciterId) {
    setOfflinePackQueue([]);
    setOfflinePackIndex(0);
    setReciter(nextReciter);
    if (RECITERS.find((item) => item.id === nextReciter)?.scope === "surah") setRepeatMode("off");
  }

  function goToPage(target: number, direction?: "next" | "previous", verseKey?: string, keepPlaying = false) {
    const next = clampPage(target);
    if (next === pageData.page && !verseKey) return;
    if (hifzLoop && next !== pageData.page) stopHifzLoop(false);
    if (offlinePackQueue.length) {
      setOfflinePackQueue([]);
      setOfflinePackIndex(0);
    }
    audioRef.current?.pause();
    if (!keepPlaying) updatePlaying(false);
    if (next === pageData.page && verseKey) {
      pendingVerseRef.current = null;
      selectAyah(verseKey);
      const requestedWord = pendingWordRef.current;
      if (requestedWord) {
        const mappedWord = wordContextForCoordinate(pageData, requestedWord);
        if (mappedWord) setSelectedWord(mappedWord);
        else setNotice("The audited occurrence could not be matched to this verified Mushaf page.");
        pendingWordRef.current = null;
      }
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
      setJumpError("Enter a page number from 1 to 604.");
      return;
    }
    setJumpError("");
    goToPage(target);
    if (overlay === "Jump") setOverlay(null);
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
    if (!audio || !audioSource || audioSource.key !== targetAudioKey) {
      pendingAutoplayRef.current = true;
      setNotice("Preparing this recitation…");
      return;
    }
    if (playing) {
      audio.pause();
      updatePlaying(false);
    } else {
      audio.play().then(() => updatePlaying(true)).catch(() => setNotice("Audio could not start. Check your connection and try again."));
    }
  }

  function moveAyah(direction: -1 | 1) {
    if (offlinePackQueue.length) {
      const nextPackIndex = offlinePackIndex + direction;
      const nextVerseKey = offlinePackQueue[nextPackIndex];
      if (nextVerseKey) {
        setOfflinePackIndex(nextPackIndex);
        selectAyah(nextVerseKey);
      } else if (direction === 1) {
        setOfflinePackQueue([]);
        setOfflinePackIndex(0);
        updatePlaying(false);
        setNotice("Offline pack complete.");
      }
      return;
    }
    const nextIndex = currentVerseIndex + direction;
    if (pageData.verses[nextIndex]) {
      selectAyah(pageData.verses[nextIndex].key);
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
    if (hifzLoop?.active) {
      const loopIndex = hifzLoop.verseKeys.indexOf(selectedVerseKey);
      const nextVerseKey = hifzLoop.verseKeys[loopIndex + 1];
      if (nextVerseKey) {
        pendingAutoplayRef.current = true;
        selectAyah(nextVerseKey);
        return;
      }
      if (hifzLoop.pass >= hifzLoop.totalPasses) {
        setHifzLoop(null);
        updatePlaying(false);
        setNotice(`Hifz loop complete · ${hifzLoop.totalPasses} passes finished.`);
        return;
      }
      const nextPass = hifzLoop.pass + 1;
      setHifzLoop({ ...hifzLoop, pass: nextPass });
      const beginNextPass = () => {
        hifzPauseTimerRef.current = null;
        const firstVerseKey = hifzLoop.verseKeys[0];
        pendingAutoplayRef.current = true;
        if (firstVerseKey === selectedVerseKey) {
          pendingAutoplayRef.current = false;
          audio.currentTime = 0;
          audio.play().then(() => updatePlaying(true)).catch(() => updatePlaying(false));
        } else {
          selectAyah(firstVerseKey);
        }
        setNotice(`Hifz loop · pass ${nextPass} of ${hifzLoop.totalPasses}`);
      };
      if (hifzLoop.pauseMs) {
        updatePlaying(false);
        setNotice(`Recite from memory · pass ${nextPass} begins shortly`);
        hifzPauseTimerRef.current = window.setTimeout(beginNextPass, hifzLoop.pauseMs);
      } else {
        beginNextPass();
      }
      return;
    }
    if (offlinePackQueue.length) {
      const nextPackIndex = offlinePackIndex + 1;
      const nextVerseKey = offlinePackQueue[nextPackIndex];
      if (nextVerseKey) {
        setOfflinePackIndex(nextPackIndex);
        pendingAutoplayRef.current = true;
        selectAyah(nextVerseKey);
      } else {
        setOfflinePackQueue([]);
        setOfflinePackIndex(0);
        updatePlaying(false);
        setNotice("Offline pack complete · every verified file played.");
      }
      return;
    }
    if (surahPlaybackRef.current !== null) {
      if (currentReciter.scope === "surah") {
        updateSurahPlayback(null);
        updatePlaying(false);
        return;
      }
      const nextVerse = pageData.verses[currentVerseIndex + 1];
      if (nextVerse) {
        if (nextVerse.chapterId === surahPlaybackRef.current) {
          pendingAutoplayRef.current = true;
          selectAyah(nextVerse.key);
        }
        else {
          updateSurahPlayback(null);
          updatePlaying(false);
        }
      } else if (pageData.page < TOTAL_PAGES) {
        pendingAutoplayRef.current = true;
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
      if (currentVerseIndex >= 0 && currentVerseIndex < endIndex) {
        pendingAutoplayRef.current = true;
        selectAyah(pageData.verses[currentVerseIndex + 1].key);
      }
      else if (startIndex >= 0) {
        pendingAutoplayRef.current = true;
        selectAyah(pageData.verses[startIndex].key);
      }
      return;
    }
    if (currentReciter.scope === "ayah") {
      if (selectedVerseKey === "114:6") {
        pendingAutoplayRef.current = false;
        updatePlaying(false);
        setNotice("Quran playback complete.");
        return;
      }

      pendingAutoplayRef.current = true;
    }

    moveAyah(1);
  }

  function toggleBookmark() {
    const exists = bookmarks.includes(currentBookmark);
    setBookmarks((current) => exists ? current.filter((item) => item !== currentBookmark) : [...current, currentBookmark]);
    setNotice(exists ? "Bookmark removed" : `Bookmarked page ${pageData.page}, ayah ${selectedVerseKey}`);
  }

  function toggleMemorized() {
    if (!selectedVerseKey) return;
    const wasMemorized = memorizedVerseKeys.has(selectedVerseKey);
    setHifzProgress((current) => toggleMemorizedVerse(current, { verseKey: selectedVerseKey, page: pageData.page }));
    setNotice(wasMemorized ? `Ayah ${selectedVerseKey} removed from memorized.` : `Ayah ${selectedVerseKey} marked memorized.`);
  }

  function refreshTodayKey() {
    const freshDay = toLocalDateKey();
    if (freshDay !== todayKey) setTodayKey(freshDay);
    return freshDay;
  }

  function startTodayStudy() {
    const freshDay = refreshTodayKey();
    const freshPlan = freshDay === todayPlan.dateKey ? todayPlan : buildTodayStudyPlan({ hifzProgress, vocabularyProgress, educationProgress, educationCatalog, curriculumEntryIds: foundationEntryIds, reading: { page: pageData.page, verseKey: selectedVerseKey }, sessionMinutes: hifzProgress.sessionMinutes, date: freshDay });
    if (!freshPlan.steps.length) {
      setNotice("Today’s study plan is clear.");
      return;
    }
    const next = startOrResumeTodayStudy(todayStudyProgress, freshPlan);
    setTodayStudyProgress(next);
    setStudySessionVisible(true);
    setOverlay(null);
    const step = currentTodayStudyStep(next, freshDay);
    setNotice(step ? `Today’s Study · ${step.title}` : "Today’s study plan is complete.");
  }

  function beginActiveStudyStep() {
    if (!activeStudyStep) return;
    const freshDay = refreshTodayKey();
    if (!activeStudySession || activeStudySession.dateKey !== freshDay) {
      setNotice("A new local day has begun. Open My Mushaf to start today’s plan.");
      return;
    }
    if (activeStudyStep.kind === "hifz-review") {
      const items = (activeStudyStep.targets as Array<{ verseKey: string; page: number }>).map((target) => ({ ...target, kind: "review" as const, reason: "Due Hifz review" }));
      const first = items[0];
      if (!first) return;
      setActivePlan(items);
      setActivePlanIndex(0);
      setHifzHidden(true);
      setRevealedVerses([]);
      setTodayStudyProgress((current) => startTodayStudyStep(current, activeStudyStep.id, freshDay));
      goToPage(first.page, first.page > pageData.page ? "next" : first.page < pageData.page ? "previous" : undefined, first.verseKey);
      setNotice(`Today’s Study · Hifz review 1 of ${items.length}`);
      return;
    }
    if (activeStudyStep.kind === "reading") {
      const target = activeStudyStep.targets[0] as { page: number; verseKey: string } | undefined;
      if (target) {
        if (target.page === pageData.page && target.verseKey === selectedVerseKey) {
          setTodayStudyProgress((current) => startTodayStudyStep(current, activeStudyStep.id, freshDay));
          setNotice("Reading step started. Complete it after your reading session.");
        } else {
          pendingReadingStartRef.current = { stepId: activeStudyStep.id, page: target.page, verseKey: target.verseKey };
          goToPage(target.page, target.page > pageData.page ? "next" : target.page < pageData.page ? "previous" : undefined, target.verseKey);
        }
      }
      if (target && (target.page !== pageData.page || target.verseKey !== selectedVerseKey)) setNotice("Opening the target reading position…");
      return;
    }
    if (activeStudyStep.kind === "education-review" || activeStudyStep.kind === "education-lesson") {
      const target = (activeStudyStep.kind === "education-review"
        ? remainingEducationReviewTargets(activeStudyStep, educationProgress, freshDay)[0]
        : activeStudyStep.targets[0]) as { sourceId: string; sourceRevision: string; courseId: string; moduleId: string; lessonId: string } | undefined;
      if (activeStudyStep.kind === "education-review" && !target) {
        const finalStep = isFinalPendingStudyStep(activeStudyStep.id);
        setTodayStudyProgress((current) => completeTodayStudyStep(current, activeStudyStep.id, freshDay));
        if (finalStep) setStudySessionVisible(false);
        setNotice(finalStep ? "Today’s Study complete." : "Every guided-learning review in this step is complete.");
        return;
      }
      if (!target || !educationCatalog || target.sourceId !== educationCatalog.sourceId || target.sourceRevision !== educationCatalog.sourceRevision) {
        setNotice("That guided-learning source revision is unavailable. Your pinned progress was not remapped.");
        return;
      }
      setTodayStudyProgress((current) => startTodayStudyStep(current, activeStudyStep.id, freshDay));
      setEducationProgress((current) => startEducationLesson(current, { sourceId: target.sourceId, sourceRevision: target.sourceRevision }, target, freshDay));
      setOverlay("Learn");
      setNotice(activeStudyStep.kind === "education-review" ? "Guided-learning review opened in Learn." : "Guided lesson opened in Learn.");
      return;
    }
    setOverlay("Hifz");
    setNotice("Vocabulary study remains unavailable until the approved curriculum source is active.");
  }

  function isFinalPendingStudyStep(stepId: string) {
    if (!activeStudySession) return true;
    return activeStudySession.steps.filter((step) => !activeStudySession.completedStepIds.includes(step.id) && !activeStudySession.skippedStepIds.includes(step.id)).every((step) => step.id === stepId);
  }

  function completeActiveStudyStep() {
    if (!activeStudyStep) return;
    const freshDay = refreshTodayKey();
    if (activeStudyStep.kind === "reading" && !activeStudyStepStarted) {
      setNotice("Open and reach the reading target before completing this step.");
      return;
    }
    const finalStep = isFinalPendingStudyStep(activeStudyStep.id);
    setTodayStudyProgress((current) => completeTodayStudyStep(current, activeStudyStep.id, freshDay));
    if (finalStep) setStudySessionVisible(false);
    setNotice(finalStep ? "Today’s Study complete." : "Study step complete. The next step is ready.");
  }

  function skipActiveStudyStep() {
    if (!activeStudyStep) return;
    const freshDay = refreshTodayKey();
    const finalStep = isFinalPendingStudyStep(activeStudyStep.id);
    setTodayStudyProgress((current) => skipTodayStudyStep(current, activeStudyStep.id, freshDay));
    if (finalStep) setStudySessionVisible(false);
    setNotice(finalStep ? "Today’s Study ended. Completed work was saved." : "Step skipped. The next step is ready.");
  }

  function rateDailyPlan(grade: ReviewGrade) {
    const item = activePlan[activePlanIndex];
    if (!item || !revealedVerses.includes(item.verseKey)) return;
    const freshDay = refreshTodayKey();
    setHifzProgress((current) => recordVerseReview(current, item, grade, freshDay));
    const nextIndex = activePlanIndex + 1;
    const next = activePlan[nextIndex];
    if (!next) {
      setActivePlan([]);
      setActivePlanIndex(0);
      setHifzHidden(false);
      setRevealedVerses([]);
      if (activeStudyStep?.kind === "hifz-review") {
        setTodayStudyProgress((current) => completeTodayStudyStep(current, activeStudyStep.id, freshDay));
        if (isFinalPendingStudyStep(activeStudyStep.id)) setStudySessionVisible(false);
      }
      setNotice(`Hifz review complete · ${activePlan.length} ayat strengthened.`);
      return;
    }
    setActivePlanIndex(nextIndex);
    setRevealedVerses([]);
    goToPage(next.page, next.page > pageData.page ? "next" : next.page < pageData.page ? "previous" : undefined, next.verseKey);
    setNotice(`Daily mastery · ${nextIndex + 1} of ${activePlan.length}`);
  }

  function stopDailyPlan() {
    setActivePlan([]);
    setActivePlanIndex(0);
    setHifzHidden(false);
    setRevealedVerses([]);
    setStudySessionVisible(false);
    setNotice("Today’s Study is saved. Resume it from My Mushaf.");
  }

  function preferenceSnapshot(): MushafPreferences {
    return {
      version: 8,
      reader: {
        lastPage: pageData.page,
        lastVerse: selectedVerseKey,
        lastVersePage: pageData.page,
        recentPages,
        theme: dark ? "dark" : "light",
        tajweed,
        transliteration,
        translation,
        reciter,
        speed,
        pageScale,
        readingFont,
      },
      bookmarks,
      hifz: hifzProgress,
      vocabulary: vocabularyProgress,
      study: todayStudyProgress,
      education: educationProgress,
      notes: studyNotes,
      downloads: { wifiOnly: wifiOnlyDownloads },
    };
  }

  function downloadBackup() {
    const content = createPortableBackup(preferenceSnapshot());
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mushaf-companion-backup-${todayKey}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Private progress backup downloaded.");
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const restored = restorePortableBackup(await file.text());
      savePreferences(localStorage, restored);
      setBookmarks(restored.bookmarks);
      setHifzProgress(restored.hifz);
      setVocabularyProgress(restored.vocabulary);
      setTodayStudyProgress(restored.study);
      setEducationProgress(restored.education);
      setStudyNotes(restored.notes);
      setDark(restored.reader.theme === "dark");
      setTajweed(restored.reader.tajweed);
      setTransliteration(restored.reader.transliteration);
      setTranslation(restored.reader.translation);
      setReciter(restored.reader.reciter);
      setSpeed(restored.reader.speed);
      setPageScale(restored.reader.pageScale);
      setReadingFont(restored.reader.readingFont);
      setRecentPages(restored.reader.recentPages);
      setWifiOnlyDownloads(restored.downloads.wifiOnly);
      goToPage(restored.reader.lastPage, undefined, restored.reader.lastVerse);
      setNotice("Backup restored. Your private notes, mastery map, and reading preferences are ready.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "This backup could not be restored.");
    }
  }

  function stopHifzLoop(showNotice = true) {
    if (hifzPauseTimerRef.current !== null) {
      window.clearTimeout(hifzPauseTimerRef.current);
      hifzPauseTimerRef.current = null;
    }
    audioRef.current?.pause();
    pendingAutoplayRef.current = false;
    setHifzLoop(null);
    updatePlaying(false);
    if (showNotice) setNotice("Hifz loop stopped.");
  }

  function startHifzLoop() {
    const fromIndex = pageData.verses.findIndex((verse) => verse.key === hifzFrom);
    const toIndex = pageData.verses.findIndex((verse) => verse.key === hifzTo);
    if (fromIndex < 0 || toIndex < 0) {
      setNotice("Choose a valid ayah range from this page.");
      return;
    }
    const firstIndex = Math.min(fromIndex, toIndex);
    const lastIndex = Math.max(fromIndex, toIndex);
    const verseKeys = pageData.verses.slice(firstIndex, lastIndex + 1).map((verse) => verse.key);
    const firstVerseKey = verseKeys[0];
    if (!firstVerseKey) return;

    if (hifzPauseTimerRef.current !== null) window.clearTimeout(hifzPauseTimerRef.current);
    audioRef.current?.pause();
    updatePlaying(false);
    updateSurahPlayback(null);
    setOfflinePackQueue([]);
    setOfflinePackIndex(0);
    setRepeatMode("off");
    setSpeed(hifzPace);
    setHifzLoop({ active: true, verseKeys, pass: 1, totalPasses: hifzRepeatCount, pauseMs: hifzPauseMs });
    setHifzProgress((current) => recordHifzActivity(current));
    setOverlay(null);
    setNotice(`Hifz loop · pass 1 of ${hifzRepeatCount}`);

    const reciterChanges = currentReciter.scope === "surah";
    if (reciterChanges) setReciter("alafasy");
    pendingAutoplayRef.current = true;
    if (firstVerseKey !== selectedVerseKey || reciterChanges) {
      selectAyah(firstVerseKey);
    } else {
      pendingAutoplayRef.current = false;
      window.setTimeout(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        audio.play().then(() => updatePlaying(true)).catch(() => setNotice("The Hifz loop is ready. Tap play to begin."));
      }, 0);
    }
  }

  function closeLearn() {
    setOverlay(null);
    scheduleLearnFocusRestore([
      () => learnTriggerRef.current,
      () => desktopLearnNavRef.current,
      () => mobileLearnNavRef.current,
      () => readerArticleRef.current,
    ]);
  }

  function chooseNav(item: NavItem, trigger?: HTMLButtonElement) {
    if (item === "Contents") {
      openContents();
      return;
    }
    if (item === "Learn") learnTriggerRef.current = trigger ?? null;
    if (item === "Bookmarks") setSavedSection("bookmarks");
    setOverlay(item === "Read" ? null : item);
  }

  function chooseMobileNav(item: MobileNavItem, trigger?: HTMLButtonElement) {
    if (item === "Learn") learnTriggerRef.current = trigger ?? null;
    setOverlay(item === "Read" ? null : item);
  }

  async function createPrivateNote(capturedAnchor: StudyAnchor, body: string, tags: string[]) {
    if (capturedAnchor.type === "lesson") return createPrivateLessonNote(capturedAnchor, body, tags);
    try {
      const anchor = await revalidateStudyAnchor(capturedAnchor, {
        resolveVerse: async (verseKey) => {
          const cachedPage = pageCacheRef.current.get(quranPageCacheKey(ACTIVE_READING_ID, capturedAnchor.page)) ?? (pageData.page === capturedAnchor.page ? pageData : null);
          if (cachedPage && isVerifiedPage(cachedPage, capturedAnchor.page, ACTIVE_READING_ID) && cachedPage.verses.some((verse) => verse.key === verseKey)) {
            return { verseKey, page: capturedAnchor.page };
          }
          return contentTransport.lookupVerse(verseKey);
        },
        resolveWord: async (wordAnchor) => {
          const wordCacheKey = quranPageCacheKey(ACTIVE_READING_ID, wordAnchor.page);
          const cachedPage = pageCacheRef.current.get(wordCacheKey);
          const trustedPage = cachedPage ?? await contentTransport.loadPageForReading(ACTIVE_READING_ID, wordAnchor.page);
          if (!isVerifiedPage(trustedPage, wordAnchor.page, ACTIVE_READING_ID)) return null;
          if (!cachedPage) pageCacheRef.current.set(wordCacheKey, trustedPage);
          const word = pageWordForCoordinate(trustedPage, wordAnchor);
          const coordinate = word ? coordinateForPageWord(trustedPage, word) : null;
          return coordinate?.sourceWordId === undefined ? null : { type: "word" as const, ...coordinate, sourceWordId: coordinate.sourceWordId };
        },
      });
      if (!anchor) return capturedAnchor.type === "word"
        ? "The captured word no longer matches its complete trusted Quran coordinate, so the note was not saved."
        : "The captured ayah no longer matches the trusted Quran page map, so the note was not saved.";
      const created = createStudyNote(studyNotes, { anchor, body, tags });
      setStudyNotes(created.state);
      setNotice(`Private ${anchor.type} note saved on this device.`);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "The private note could not be saved.";
    }
  }

  function updatePrivateNote(id: string, body: string, tags: string[]) {
    try {
      setStudyNotes(updateStudyNote(studyNotes, id, { body, tags }));
      setNotice("Private note updated on this device.");
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "The private note could not be updated.";
    }
  }

  function deletePrivateNote(id: string) {
    setStudyNotes((current) => deletePrivateStudyNote(current, id));
    setNotice("Private note deleted. Quran content and other saved study data were unchanged.");
  }

  function renamePrivateTag(fromTag: string, toTag: string) {
    setStudyNotes((current) => renameStudyTag(current, fromTag, toTag));
    setNotice("Private tag renamed across your notes.");
  }

  function removePrivateTag(tag: string) {
    setStudyNotes((current) => removeStudyTag(current, tag));
    setNotice("Private tag removed. The notes themselves were kept.");
  }

  async function createPrivateLessonNote(anchor: LessonStudyAnchor, body: string, tags: string[]) {
    try {
      const trusted = await revalidateStudyAnchor(anchor, {
        resolveLesson: async (candidate) => {
          if (!educationCatalog || candidate.sourceId !== educationCatalog.sourceId || candidate.sourceRevision !== educationCatalog.sourceRevision) return null;
          const lesson = educationCatalog.lessons.find((item) => item.id === candidate.lessonId && item.courseId === candidate.courseId && item.moduleId === candidate.moduleId);
          if (!lesson || (candidate.sectionId !== null && !lesson.blocks.some((block) => block.id === candidate.sectionId))) return null;
          return candidate;
        },
      });
      if (!trusted || trusted.type !== "lesson") return "The captured lesson no longer matches its approved source revision, so the note was not saved.";
      const created = createStudyNote(studyNotes, { anchor: trusted, body, tags });
      setStudyNotes(created.state);
      setNotice("Private lesson note saved on this device.");
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "The private lesson note could not be saved.";
    }
  }

  function openEducationLesson(courseId: string, moduleId: string, lessonId: string) {
    if (!educationCatalog || !educationIdentity || !educationCatalog.lessons.some((lesson) => lesson.id === lessonId && lesson.courseId === courseId && lesson.moduleId === moduleId)) {
      setNotice("That guided lesson is unavailable from an approved source.");
      return;
    }
    if (educationProgress.sourceId && !educationSourceCurrent) {
      setNotice("Your guided-learning progress is pinned to an unavailable source revision and was not remapped.");
      return;
    }
    setEducationProgress((current) => startEducationLesson(current, educationIdentity, { courseId, moduleId, lessonId }, refreshTodayKey()));
  }

  function finishEducationLesson(courseId: string, moduleId: string, lessonId: string) {
    if (!educationIdentity) return;
    setEducationProgress((current) => completeEducationLesson(current, educationIdentity, { courseId, moduleId, lessonId }, refreshTodayKey()));
    const activeLessonTarget = activeStudyStep?.kind === "education-lesson" ? activeStudyStep.targets[0] as { sourceId?: string; sourceRevision?: string; courseId?: string; moduleId?: string; lessonId?: string } | undefined : undefined;
    const completesActiveLesson = Boolean(activeLessonTarget && activeLessonTarget.sourceId === educationIdentity.sourceId && activeLessonTarget.sourceRevision === educationIdentity.sourceRevision && activeLessonTarget.courseId === courseId && activeLessonTarget.moduleId === moduleId && activeLessonTarget.lessonId === lessonId);
    if (activeStudyStep?.kind === "education-lesson" && completesActiveLesson) {
      const finalStep = isFinalPendingStudyStep(activeStudyStep.id);
      setTodayStudyProgress((current) => completeTodayStudyStep(current, activeStudyStep.id, refreshTodayKey()));
      if (finalStep) setStudySessionVisible(false);
    }
    setNotice(activeStudyStep?.kind === "education-lesson" && !completesActiveLesson ? "Guided lesson completed. The separately pinned Today’s Study lesson remains open." : "Guided lesson completed on this device.");
  }

  function rateEducationCheck(courseId: string, moduleId: string, lessonId: string, checkId: string, grade: ReviewGrade) {
    if (!educationIdentity || !educationCatalog?.lessons.some((lesson) => lesson.id === lessonId && lesson.courseId === courseId && lesson.moduleId === moduleId && lesson.knowledgeChecks.some((check) => check.id === checkId))) return;
    const reviewDate = refreshTodayKey();
    const previousReviewCount = educationProgress.knowledgeChecks.find((item) => item.checkId === checkId)?.reviewCount ?? 0;
    let nextEducationProgress = recordEducationKnowledgeReview(educationProgress, educationIdentity, { courseId, moduleId, lessonId, checkId }, grade, reviewDate);
    const nextReviewCount = nextEducationProgress.knowledgeChecks.find((item) => item.checkId === checkId)?.reviewCount ?? 0;
    if (nextReviewCount <= previousReviewCount) {
      setNotice("That guided-learning review was not recorded because it would violate the saved study chronology.");
      return;
    }
    if (activeStudyStep?.kind === "education-review") {
      const targets = activeStudyStep.targets as Array<{ sourceId?: string; sourceRevision?: string; courseId?: string; moduleId?: string; lessonId?: string; checkId: string }>;
      const ratedTarget = targets.some((target) => target.sourceId === educationIdentity.sourceId && target.sourceRevision === educationIdentity.sourceRevision && target.courseId === courseId && target.moduleId === moduleId && target.lessonId === lessonId && target.checkId === checkId);
      const sessionDate = activeStudySession?.dateKey ?? reviewDate;
      const remaining = ratedTarget ? remainingEducationReviewTargets(activeStudyStep, nextEducationProgress, sessionDate) : remainingActiveEducationReviews;
      if (ratedTarget && educationReviewStepComplete(activeStudyStep, nextEducationProgress, sessionDate)) {
        const finalStep = isFinalPendingStudyStep(activeStudyStep.id);
        setTodayStudyProgress((current) => completeTodayStudyStep(current, activeStudyStep.id, sessionDate));
        if (finalStep) setStudySessionVisible(false);
      } else if (ratedTarget) {
        const nextTarget = remaining[0];
        nextEducationProgress = startEducationLesson(nextEducationProgress, { sourceId: nextTarget.sourceId, sourceRevision: nextTarget.sourceRevision }, nextTarget, sessionDate);
      }
    }
    setEducationProgress(nextEducationProgress);
    setNotice(`Guided-learning review rated ${grade}.`);
  }

  async function openEducationQuranCitation(citation: EducationQuranCitation) {
    try {
      const target = await contentTransport.lookupVerse(citation.verseKey);
      if (target.verseKey !== citation.verseKey) throw new Error("Citation mapping mismatch");
      goToPage(target.page, target.page > pageData.page ? "next" : target.page < pageData.page ? "previous" : undefined, target.verseKey);
      setOverlay(null);
      setNotice(`Opened trusted Quran citation ${citation.verseKey}.`);
    } catch {
      setNotice("That Quran citation did not match the trusted verse lookup boundary and was not opened.");
    }
  }

  async function openPrivateNote(note: StudyNote, trigger: HTMLButtonElement) {
    if (note.anchor.type === "lesson") {
      const lessonAnchor = note.anchor;
      if (!educationCatalog || lessonAnchor.sourceId !== educationCatalog.sourceId || lessonAnchor.sourceRevision !== educationCatalog.sourceRevision || !educationCatalog.lessons.some((lesson) => lesson.id === lessonAnchor.lessonId && lesson.courseId === lessonAnchor.courseId && lesson.moduleId === lessonAnchor.moduleId)) {
        setNotice("That private lesson note is preserved, but its pinned guided-course revision is unavailable.");
        return;
      }
      setEducationProgress((current) => startEducationLesson(current, { sourceId: lessonAnchor.sourceId, sourceRevision: lessonAnchor.sourceRevision }, lessonAnchor, refreshTodayKey()));
      setOverlay("Learn");
      window.requestAnimationFrame(() => lessonAnchor.sectionId ? document.getElementById(`lesson-section-${lessonAnchor.sectionId}`)?.focus() : undefined);
      return;
    }
    try {
      const target = await contentTransport.lookupVerse(note.anchor.verseKey);
      if (target.verseKey !== note.anchor.verseKey || target.page !== note.anchor.page) throw new Error("Private note anchor mismatch");
      contextTriggerRef.current = trigger;
      setStudyInitialTab("notes");
      setStudyActiveTab("notes");
      if (target.page === pageData.page) {
        selectAyah(target.verseKey);
        if (note.anchor.type === "word") {
          const mappedWord = wordContextForCoordinate(pageData, note.anchor);
          if (!mappedWord) throw new Error("Private word note coordinate mismatch");
          setSelectedWord(mappedWord);
        }
        translationPackServiceRef.current ??= createTranslationPackService({ fetchImpl: contentTransport.fetchTranslationPackSource });
        setOverlay("Context");
        return;
      }
      pendingStudyNoteRef.current = note;
      goToPage(target.page, target.page > pageData.page ? "next" : "previous", target.verseKey);
    } catch {
      pendingStudyNoteRef.current = null;
      setNotice("That private note no longer matches the trusted Quran page mapping and was not opened.");
    }
  }

  async function openEvidenceAyah(edge: ResolvedEvidenceEdge) {
    try {
      const target = await contentTransport.lookupVerse(edge.to.verseKey);
      if (target.verseKey !== edge.to.verseKey || target.page !== edge.targetPage) throw new Error("Evidence target mismatch");
      evidenceRequestGateRef.current.cancel();
      setEvidenceResult({ status: "loading" });
      setStudyInitialTab("evidence");
      setStudyActiveTab("evidence");
      setSelectedWord(null);
      goToPage(target.page, target.page > pageData.page ? "next" : target.page < pageData.page ? "previous" : undefined, target.verseKey);
    } catch {
      setNotice("That evidence target did not match the trusted Quran page mapping and was not opened.");
    }
  }

  function openTafsir() {
    if (!pageData.verses.some((verse) => verse.key === selectedVerseKey)) {
      setNotice("Open the ayah on its Quran page before studying its tafsir.");
      return;
    }
    setVerseActionsOpen(false);
    setTajweedFocus(null);
    setOverlay("Tafsir");
  }

  function openContextLens(trigger: HTMLButtonElement, initialTab: ContextLensTab = "overview") {
    if (!pageData.verses.some((verse) => verse.key === selectedVerseKey)) {
      setNotice("Select an ayah on its Quran page before opening context.");
      return;
    }
    contextTriggerRef.current = trigger;
    translationPackServiceRef.current ??= createTranslationPackService({ fetchImpl: contentTransport.fetchTranslationPackSource });
    setStudyInitialTab(initialTab);
    setStudyActiveTab(initialTab);
    setVerseActionsOpen(false);
    setTajweedFocus(null);
    setOverlay("Context");
  }

  function closeContextLens() {
    occurrenceRequestGateRef.current.cancel();
    evidenceRequestGateRef.current.cancel();
    setOccurrenceExplorer(null);
    setOverlay(null);
    window.requestAnimationFrame(() => {
      const isUsable = (node: HTMLElement | null | undefined) => Boolean(node?.isConnected && node.getClientRects().length);
      const original = contextTriggerRef.current;
      const selectedWordButton = selectedWord?.coordinate.sourceWordId
        ? wordButtonRefs.current.get(`${selectedWord.coordinate.verseKey}|${selectedWord.coordinate.sourceWordId}`)
        : null;
      const selectedAyahButton = verseButtonRefs.current.get(selectedVerseKey);
      const studyControl = studyControlRefs.current.find(isUsable);
      const target = [original, selectedWordButton, selectedAyahButton, studyControl, readerArticleRef.current].find(isUsable);
      target?.focus();
    });
  }

  function moveStudyAyah(direction: -1 | 1) {
    if (studyActiveTab === "evidence") {
      evidenceRequestGateRef.current.cancel();
      setEvidenceResult({ status: "loading" });
    }
    setSelectedWord(null);
    const nextIndex = currentVerseIndex + direction;
    const nextVerse = pageData.verses[nextIndex];
    if (nextVerse) {
      selectAyah(nextVerse.key);
      return;
    }
    if (direction === 1 && pageData.page < TOTAL_PAGES) {
      pendingEdgeRef.current = "first";
      goToPage(pageData.page + 1, "next");
    } else if (direction === -1 && pageData.page > 1) {
      pendingEdgeRef.current = "last";
      goToPage(pageData.page - 1, "previous");
    }
  }

  function openContents() {
    setOverlay("Contents");
    loadChapters();
  }

  function openJump() {
    setJumpValue(String(pageData.page));
    setJumpChapterId(currentChapter?.id ?? 1);
    setJumpJuz(pageData.juz);
    setJumpError("");
    setOverlay("Jump");
    loadChapters();
  }

  function openSelectedChapter() {
    const chapter = chapters.find((item) => item.id === jumpChapterId);
    if (!chapter) {
      setJumpError("The sūrah index is still loading. Try again in a moment.");
      return;
    }
    setJumpError("");
    openChapter(chapter);
  }

  function openSelectedJuz() {
    const startPage = JUZ_START_PAGES[jumpJuz - 1];
    if (!startPage) {
      setJumpError("Choose a juz from 1 to 30.");
      return;
    }
    setJumpError("");
    goToPage(startPage);
    setOverlay(null);
  }

  function openDownloads() {
    setOverlay("Downloads");
    loadChapters();
  }

  function playOfflinePack(pack: OfflineAudioPack) {
    const verseKeys = pack.files.filter((file) => file.status === "complete" && file.checksum).map((file) => file.verseKey);
    if (!verseKeys.length || verseKeys.length !== pack.totalFiles) {
      setNotice("This pack is not fully verified yet. Resume or repair it first.");
      return;
    }
    audioRef.current?.pause();
    updatePlaying(false);
    updateSurahPlayback(null);
    setHifzLoop(null);
    setRepeatMode("off");
    setReciter("alafasy");
    setOfflinePackQueue(verseKeys);
    setOfflinePackIndex(0);
    pendingAutoplayRef.current = true;
    selectAyah(verseKeys[0]);
    setOfflineAudioRevision((value) => value + 1);
    setOverlay("Listen");
    setNotice(`${pack.label} · playing ${verseKeys.length} verified files offline.`);
  }

  function loadChapters() {
    if (chapters.length || contentsLoading) return;
    setContentsLoading(true);
    contentTransport.loadChapters()
      .then((items) => setChapters(items))
      .catch(() => setNotice("The verified sūrah index could not be opened. Please try again."))
      .finally(() => setContentsLoading(false));
  }

  function selectMushafWord(word: PageWord, trigger: HTMLButtonElement) {
    if (offlinePackQueue.length) {
      setOfflinePackQueue([]);
      setOfflinePackIndex(0);
    }
    selectAyah(word.verseKey);
    if (hifzHidden) {
      setVerseActionsOpen(true);
      setRevealedVerses((current) => current.includes(word.verseKey) ? current.filter((key) => key !== word.verseKey) : [...current, word.verseKey]);
      setTajweedFocus(null);
      return;
    }
    const rules = tajweed && !word.isEnd ? rulesForTajweedHtml(word.tajweedHtml) : [];
    const coordinate = wordCoordinateIndex.get(pageWordIdentity(word)) ?? null;
    setSelectedWord(coordinate ? { coordinate, surfaceText: word.text, tajweedRules: rules } : null);
    setOccurrenceExplorer(null);
    setVerseActionsOpen(false);
    setTajweedFocus(null);
    openContextLens(trigger, coordinate ? "words" : "overview");
  }

  const changeStudyActiveTab = useCallback((tab: ContextLensTab) => {
    if (tab === "evidence") setEvidenceResult({ status: "loading" });
    setStudyActiveTab(tab);
  }, []);

  async function exploreWordOccurrences(kind: "lemma" | "root", identifier: string, label: string) {
    if (!wordStudySource) return;
    const token = occurrenceRequestGateRef.current.begin(`${kind}:${identifier}`);
    setOccurrenceExplorer({ kind, identifier, label, items: [], total: 0, status: "loading", reason: "" });
    const result = kind === "lemma"
      ? await WORD_STUDY_PROVIDER_REGISTRY.getOccurrencesByLemma(wordStudySource.sourceId, identifier)
      : await WORD_STUDY_PROVIDER_REGISTRY.getOccurrencesByRoot(wordStudySource.sourceId, identifier);
    if (!occurrenceRequestGateRef.current.isCurrent(token)) return;
    setOccurrenceExplorer(result.status === "ok"
      ? { kind, identifier, label, items: result.items, total: result.total, status: "ok", reason: "" }
      : { kind, identifier, label, items: [], total: 0, status: result.status, reason: result.reason });
  }

  async function openWordOccurrence(occurrence: WordOccurrence) {
    try {
      const target = await contentTransport.lookupVerse(occurrence.coordinate.verseKey);
      if (target.page !== occurrence.coordinate.page || target.verseKey !== occurrence.coordinate.verseKey) throw new Error("Occurrence coordinate mismatch");
      pendingWordRef.current = occurrence.coordinate;
      setStudyInitialTab("words");
      goToPage(target.page, target.page > pageData.page ? "next" : target.page < pageData.page ? "previous" : undefined, target.verseKey);
    } catch {
      pendingWordRef.current = null;
      setNotice("This occurrence did not match the trusted Quran page mapping and was not opened.");
    }
  }

  async function startSurahPlayback(chapterId: number) {
    const verseKey = `${chapterId}:1`;
    audioRef.current?.pause();
    updatePlaying(false);
    setOfflinePackQueue([]);
    setOfflinePackIndex(0);
    updateSurahPlayback(chapterId);
    setRepeatMode("off");
    pendingAutoplayRef.current = true;
    setOverlay("Listen");
    setNotice(`Starting complete sūrah playback for Sūrah ${chapterId}.`);
    if (pageData.verses.some((verse) => verse.key === verseKey)) {
      selectAyah(verseKey);
    } else {
      try {
        const target = await contentTransport.lookupVerse(verseKey);
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
      const target = await contentTransport.lookupVerse(verseKey);
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
      const target = await contentTransport.lookupVerse(result.verseKey);
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
          const coordinate = wordCoordinateIndex.get(pageWordIdentity(word));
          const rules = tajweed && !word.isEnd ? rulesForTajweedHtml(word.tajweedHtml) : [];
          return (
            <button
              type="button"
              key={word.id}
              ref={(node) => {
                const identity = `${word.verseKey}|${word.id}`;
                if (node) {
                  wordButtonRefs.current.set(identity, node);
                  if (word.isEnd) verseButtonRefs.current.set(word.verseKey, node);
                } else {
                  wordButtonRefs.current.delete(identity);
                  if (word.isEnd) verseButtonRefs.current.delete(word.verseKey);
                }
              }}
              className={`mushaf-word${word.isEnd ? " ayah-end" : ""}${selectedVerseKey === word.verseKey ? " selected" : ""}${coordinate && selectedWord && coordinatesMatch(selectedWord.coordinate, coordinate, true) ? " word-selected" : ""}${memorizedVerseKeys.has(word.verseKey) ? " memorized" : ""}${revealedVerses.includes(word.verseKey) ? " hifz-revealed" : ""}${hifzLoop?.active && selectedVerseKey === word.verseKey ? " hifz-playing" : ""}`}
              onClick={(event) => selectMushafWord(word, event.currentTarget)}
              aria-label={hifzHidden ? `${word.text} — ${revealedVerses.includes(word.verseKey) ? "hide" : "reveal"} ayah ${word.verseKey}` : word.isEnd ? `Study ayah ${word.verseKey}` : `${word.text} — open word study, word ${coordinate?.wordPosition ?? ""} in ayah ${word.verseKey}${rules.length ? `; ${rules.length} Tajweed ${rules.length === 1 ? "rule" : "rules"}` : ""}`}
              tabIndex={word.isEnd || selectedVerseKey === word.verseKey ? 0 : -1}
            >
              {useQcfGlyph
                ? <span className="qcf-glyph" style={{ fontFamily: `"${fontName}"` }} dangerouslySetInnerHTML={{ __html: glyph }} />
                : word.isEnd
                  ? <span className="ayah-rosette"><span>{word.text}</span></span>
                  : tajweed
                    ? <span dangerouslySetInnerHTML={{ __html: word.tajweedHtml }} />
                    : <span>{word.text}</span>}
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
        <div className="brand-mark" aria-label="Mushaf Companion"><span className="brand-logo" style={{ backgroundImage: `url("${appPath("logo.png")}")` }} aria-hidden="true" /></div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <button ref={item.label === "Learn" ? desktopLearnNavRef : undefined} key={item.label} type="button" className={activeNav === item.label ? "active" : ""} onClick={(event) => chooseNav(item.label, event.currentTarget)} aria-label={item.label} aria-current={activeNav === item.label ? "page" : undefined}>
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
          <form className="header-page-jump desktop-page-jump" onSubmit={submitJump} aria-label="Jump to Quran page" noValidate>
            <label htmlFor="page-jump">PAGE</label>
            <input id="page-jump" type="number" min="1" max={TOTAL_PAGES} inputMode="numeric" value={jumpValue} onChange={(event) => { setJumpValue(event.target.value); setJumpError(""); }} aria-label="Page number" />
            <span>/ {TOTAL_PAGES}</span><button type="submit">Go</button>
          </form>
          <button type="button" className="mobile-jump-trigger" onClick={openJump} aria-label={`Open page jump. Current page ${pageData.page} of ${TOTAL_PAGES}`}><small>PAGE</small><strong>{pageData.page}</strong><span>⌄</span></button>
          <div className="header-tools">
            <button type="button" className={`toggle-control desktop-learning-toggle ${tajweed ? "active" : ""}`} onClick={() => setTajweed((value) => !value)} aria-label="Toggle Tajweed"><span className="tajweed-dot" /> <span>Tajweed</span></button>
            <button type="button" className={`toggle-control desktop-learning-toggle ${transliteration ? "active" : ""}`} onClick={() => setTransliteration((value) => !value)} aria-label="Toggle Transliteration"><span>Transliteration</span></button>
            <button type="button" className={`toggle-control desktop-learning-toggle ${translation ? "active" : ""}`} onClick={() => setTranslation((value) => !value)} aria-label="Toggle Saheeh International translation"><span>Translation</span></button>
            <button ref={(node) => { studyControlRefs.current[0] = node; }} type="button" className={`toggle-control desktop-learning-toggle ${overlay === "Context" ? "active" : ""}`} onClick={(event) => openContextLens(event.currentTarget)} aria-label="Open Ayah Study Lens for selected ayah"><span>Study</span></button>
            <button type="button" className={`toggle-control desktop-learning-toggle ${overlay === "Tafsir" ? "active" : ""}`} onClick={openTafsir} aria-label="Open tafsir for selected ayah"><span>Tafsir</span></button>
            <button type="button" className={`toggle-control hifz-shortcut ${hifzHidden || hifzLoop ? "active" : ""}`} onClick={() => setOverlay("Hifz")} aria-label="Open Hifz memorization mode"><span>Hifz</span></button>
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
          <button type="button" className={translation ? "active" : ""} onClick={() => setTranslation((value) => !value)} aria-pressed={translation}>Translation</button>
          <button ref={(node) => { studyControlRefs.current[1] = node; }} type="button" className={overlay === "Context" ? "active" : ""} onClick={(event) => openContextLens(event.currentTarget)} aria-label="Open Ayah Study Lens for selected ayah">Study</button>
          <button type="button" className={overlay === "Tafsir" ? "active" : ""} onClick={openTafsir}>Tafsir</button>
          <button type="button" className={hifzHidden || hifzLoop ? "active" : ""} onClick={() => setOverlay("Hifz")}>Hifz</button>
          <button type="button" onClick={() => setTajweedGuideOpen(true)} aria-label="Open Tajweed guide">Guide</button>
        </div>

        {currentPlanItem ? <div className="hifz-reader-banner mastery-session-banner" aria-label="Today’s Study Hifz review"><div><span>TODAY&apos;S STUDY · HIFZ {activePlanIndex + 1} OF {activePlan.length}</span><p>{currentPlanItem.reason} · Ayah {currentPlanItem.verseKey}</p></div>{revealedVerses.includes(currentPlanItem.verseKey) ? <div className="mastery-rating" aria-label="Rate this review">{(["again", "hard", "good", "easy"] as ReviewGrade[]).map((grade) => <button type="button" onClick={() => rateDailyPlan(grade)} key={grade}>{grade}</button>)}</div> : <button type="button" onClick={() => setRevealedVerses([currentPlanItem.verseKey])}>Reveal ayah</button>}<button type="button" className="mastery-stop" onClick={stopDailyPlan}>Exit</button></div> : studySessionVisible && activeStudyStep && activeStudySession ? <div className="hifz-reader-banner today-study-banner" aria-label="Today’s Study session"><div><span>TODAY&apos;S STUDY · STEP {activeStudySession.currentStepIndex + 1} OF {activeStudySession.steps.length}</span><p>{activeStudyStep.title} · about {activeStudyStep.estimatedMinutes} min</p></div><div className="today-study-actions"><button type="button" onClick={beginActiveStudyStep}>{activeStudyStep.kind === "reading" ? activeStudyStepStarted ? "Reading opened" : "Open page" : "Begin"}</button>{activeStudyStep.kind === "reading" && <button type="button" onClick={completeActiveStudyStep} disabled={!activeStudyStepStarted}>Complete</button>}<button type="button" onClick={skipActiveStudyStep}>Skip</button></div><button type="button" className="mastery-stop" onClick={() => { setStudySessionVisible(false); setNotice("Today’s Study is saved. Resume it from My Mushaf."); }}>Exit</button></div> : hifzHidden && <div className="hifz-reader-banner" role="status"><span>Hidden-text self-test</span><p>Tap any ayah to reveal it. Tap it again to hide it.</p><button type="button" onClick={() => { setHifzHidden(false); setRevealedVerses([]); }}>Show all text</button></div>}
        {hifzLoop && <div className="hifz-reader-banner loop-banner" role="status"><span>Hifz loop</span><p>Pass {hifzLoop.pass} of {hifzLoop.totalPasses} · Ayah {selectedVerseKey}</p><button type="button" onClick={() => stopHifzLoop()}>Stop</button></div>}

        <section className="reading-area" aria-label="Mushaf reader">
          <button type="button" className="page-turn-control previous" onClick={previousPage} disabled={loadingPage} aria-label={pageData.page === 1 ? "Open Tajweed guide before page one" : "Previous page"}><span>‹</span><small>{pageData.page === 1 ? "GUIDE" : "PREVIOUS"}</small></button>
          <div className="book-stage">
            <div className="book-meta"><span>JUZ {pageData.juz}</span>{currentChapter ? <button type="button" onClick={() => setNotice(`Double-click Sūrah ${currentChapter.id} to play it from the beginning.`)} onDoubleClick={() => startSurahPlayback(currentChapter.id)} aria-label={`Sūrah ${currentChapter.id}, ${currentChapter.name}. Double-click to play from the beginning`}>{currentChapter.id} · {currentChapter.name}</button> : <span>Quran</span>}<span>HIZB {pageData.hizb}</span></div>
            <article
              ref={readerArticleRef}
              tabIndex={-1}
              className={`mushaf-page reading-font-${readingFont}${hifzHidden ? " hifz-hidden" : ""} ${turnDirection ? `turn-${turnDirection}` : ""}`}
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
            {translation && selectedVerse && <aside className="learning-strip translation-strip" aria-live="polite"><span>SAHEEH INTERNATIONAL · AYAH {selectedVerse.key}</span><p>{selectedVerse.translation || "Translation is temporarily unavailable for this ayah."}</p></aside>}
            {verseActionsOpen && selectedVerse && <aside className="verse-actions" aria-label={`Actions for ayah ${selectedVerse.key}`}><span>AYAH {selectedVerse.key}</span><div><button type="button" onClick={togglePlay}>{playing ? "Pause" : "Listen"}</button><button type="button" className="context-action" onClick={(event) => openContextLens(event.currentTarget)}>Study lens</button><button type="button" className="tafsir-action" onClick={openTafsir}>Study tafsir</button><button type="button" className={bookmarks.includes(currentBookmark) ? "active" : ""} onClick={toggleBookmark}>{bookmarks.includes(currentBookmark) ? "Bookmarked" : "Bookmark"}</button><button type="button" className={memorizedVerseKeys.has(selectedVerse.key) ? "memorized-action" : ""} onClick={toggleMemorized}>{memorizedVerseKeys.has(selectedVerse.key) ? "✓ Memorized" : "Mark memorized"}</button><button type="button" className="verse-actions-close" onClick={() => setVerseActionsOpen(false)} aria-label="Close ayah actions">×</button></div></aside>}
            <div className="mobile-page-controls">
              <button type="button" onClick={previousPage}>{pageData.page === 1 ? "‹ Guide" : "‹ Previous"}</button>
              <button type="button" className="mobile-jump-button" onClick={openJump} aria-label={`Open page jump. Current page ${pageData.page} of ${TOTAL_PAGES}`}><strong>{pageData.page}</strong><span>/ {TOTAL_PAGES}</span></button>
              <button type="button" onClick={() => goToPage(page + 1, "next")} disabled={pageData.page >= TOTAL_PAGES}>Next ›</button>
            </div>
          </div>
          <button type="button" className="page-turn-control next" onClick={() => goToPage(page + 1, "next")} disabled={pageData.page >= TOTAL_PAGES || loadingPage} aria-label="Next page"><span>›</span><small>NEXT</small></button>
        </section>
      </section>

      <section className="audio-mini" aria-label="Audio mini player">
        <button type="button" className="mini-now-playing" onClick={() => setOverlay("Listen")} aria-label="Open full audio player">
          <span className="reciter-avatar">{currentReciter.initials}</span>
          <span><small>NOW PLAYING · {isOfflinePackPlayback ? `OFFLINE PACK ${offlinePackIndex + 1}/${offlinePackQueue.length}` : isSurahPlayback ? `SURAH ${surahPlaybackChapter ?? selectedVerseKey.split(":")[0]}` : `AYAH ${selectedVerseKey}`}{audioSource?.offline ? " · VERIFIED" : ""}</small><strong>{currentReciter.name}</strong></span>
        </button>
        <div className="mini-transport">
          <button type="button" onClick={() => moveAyah(-1)} disabled={currentReciter.scope === "surah"} aria-label="Previous ayah">‹</button>
          <button type="button" className="mini-play" onClick={togglePlay} aria-label={playing ? "Pause recitation" : "Play recitation"}>{playing ? "Ⅱ" : "▶"}</button>
          <button type="button" onClick={() => stopPlayback()} aria-label="Stop recitation">■</button>
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

      <audio ref={audioRef} src={audioSource?.url} onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onEnded={handleEnded} onPlay={() => updatePlaying(true)} onPause={() => updatePlaying(false)} onError={() => {
        if (audioSource?.offline && navigator.onLine) {
          setAudioSource({ key: targetAudioKey, url: audioStreamUrl(reciter, selectedVerseKey), offline: false });
          setNotice("The stored file needs repair. Streaming this ayah instead.");
        } else if (audioSource) setNotice(audioSource.offline ? "This stored file could not play. Open Downloads to repair it." : "Audio could not start. Check your connection and try again.");
      }} preload="metadata" />

      <nav className="mobile-nav" aria-label="Primary navigation">
        {MOBILE_NAV_ITEMS.map((item) => <button ref={item.label === "Learn" ? mobileLearnNavRef : undefined} key={item.label} type="button" className={activeMobileNav === item.label ? "active" : ""} onClick={(event) => chooseMobileNav(item.label, event.currentTarget)} aria-label={item.label} aria-current={activeMobileNav === item.label ? "page" : undefined}><span>{item.glyph}</span><small>{item.label}</small></button>)}
      </nav>

      {overlay && (
        <div className={`layer-backdrop ${overlay === "Listen" ? "audio-layer" : ""} ${overlay === "Context" ? "context-lens-layer" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) { if (overlay === "Context") closeContextLens(); else if (overlay === "Learn") closeLearn(); else setOverlay(null); } }}>
          {overlay === "Home" && (
            <section className="panel-shell home-panel" role="dialog" aria-modal="true" aria-labelledby="home-title">
              <header><div><span className="panel-kicker">MUSHAF COMPANION</span><h2 id="home-title">Peaceful return</h2></div>{closeButton}</header>
              <div className="continue-card"><span>LAST READ</span><strong>{currentChapter?.name ?? "Quran"}</strong><p>Page {pageData.page} · Ayah {selectedVerseKey}</p><button type="button" onClick={() => setOverlay(null)}>Continue reading</button></div>
              <div className="home-shortcuts"><button type="button" onClick={openContents}><span>☷</span><strong>Table of contents</strong><small>114 sūrahs with juz and revelation details</small></button><button type="button" onClick={() => { setOverlay(null); setTajweedGuideOpen(true); }}><span>?</span><strong>Learn Tajweed</strong><small>17 color rules with five examples each</small></button><button type="button" onClick={() => setOverlay("Search")}><span>⌕</span><strong>Find a passage</strong><small>Sūrah, āyah, page, or juz</small></button><button type="button" onClick={() => { setSavedSection("bookmarks"); setOverlay("Bookmarks"); }}><span>◇</span><strong>Saved study</strong><small>{bookmarks.length} bookmarks · {studyNotes.notes.length} private notes</small></button><button type="button" className="memorize-home-card" onClick={() => setOverlay("Hifz")}><span>◉</span><strong>My Mushaf</strong><small>{dueReviews} due · {hifzProgress.memorized.length} ayāt mapped</small></button></div>
            </section>
          )}

          {overlay === "More" && (
            <section className="panel-shell more-panel" role="dialog" aria-modal="true" aria-labelledby="more-title">
              <header><div><span className="panel-kicker">MORE DESTINATIONS</span><h2 id="more-title">More</h2></div>{closeButton}</header>
              <div className="more-nav-grid">{(["Contents", "Bookmarks", "Search", "Settings"] as NavItem[]).map((item) => <button type="button" onClick={() => chooseNav(item)} key={item}><strong>{item}</strong><small>{item === "Contents" ? "Browse 114 surahs" : item === "Bookmarks" ? "Bookmarks and private notes" : item === "Search" ? "Find a verified passage" : "Reader and private-data preferences"}</small></button>)}</div>
            </section>
          )}

          {overlay === "Learn" && (
            <LearnPanel
              catalogResult={educationCatalogResult}
              educationProgress={educationProgress}
              currentLesson={currentEducationLesson}
              dueCheckIds={new Set(educationDueReviews.map((item) => item.checkId))}
              todayPlan={displayedTodayPlan}
              todayCompletion={todayCompletion}
              todayStudyAction={todaySessionFinished ? todayCompletion.percent === 100 ? "Today’s Study complete" : "Today’s Study ended" : activeStudySession ? "Resume Today’s Study" : "Start Today’s Study"}
              todayStudyDisabled={!todayPlan.steps.length || todaySessionFinished}
              activeEducationReview={activeEducationReview}
              hifzDue={dueReviews}
              hifzMemorized={hifzProgress.memorized.length}
              vocabularyDue={vocabularyDue}
              vocabularyAvailable={foundationEntryIds.length > 0}
              notes={studyNotes.notes}
              studyStreak={studyStreak}
              onTodayStudy={startTodayStudy}
              onOpenLesson={openEducationLesson}
              onCompleteLesson={finishEducationLesson}
              onRateKnowledgeCheck={rateEducationCheck}
              onOpenQuranCitation={openEducationQuranCitation}
              onOpenHifz={() => setOverlay("Hifz")}
              onOpenVocabulary={() => setOverlay("Hifz")}
              onOpenTajweed={() => { setOverlay(null); setTajweedGuideOpen(true); }}
              onOpenNotes={() => { setSavedSection("notes"); setOverlay("Bookmarks"); }}
              onOpenReaderStudy={(trigger) => openContextLens(trigger)}
              onCreateLessonNote={createPrivateLessonNote}
              onClose={closeLearn}
            />
          )}

          {overlay === "Hifz" && (
            <section className="panel-shell hifz-panel" role="dialog" aria-modal="true" aria-labelledby="hifz-title">
              <header><div><span className="panel-kicker">PERSONAL MASTERY MAP</span><h2 id="hifz-title">My Mushaf</h2></div>{closeButton}</header>
              <div className="hifz-content">
                <section className="hifz-summary" aria-label="Hifz progress">
                  <div className="hifz-stat streak-stat"><span>◆</span><strong>{studyStreak}</strong><small>study rhythm</small></div>
                  <div className="hifz-stat"><span>✓</span><strong>{hifzProgress.memorized.length}</strong><small>ayāt mapped</small></div>
                  <div className="hifz-stat due-stat"><span>↺</span><strong>{dueReviews}</strong><small>reviews due</small></div>
                  <div className="hifz-goal">
                    <div><span>TODAY&apos;S GOAL</span><strong>{todayMemorized} / {hifzProgress.dailyGoal} ayāt</strong></div>
                    <div className="hifz-goal-track" role="progressbar" aria-label="Today's memorization goal" aria-valuemin={0} aria-valuemax={hifzProgress.dailyGoal} aria-valuenow={todayMemorized}><span style={{ width: `${todayGoalPercent}%` }} /></div>
                    <label>Daily goal<select value={hifzProgress.dailyGoal} onChange={(event) => setHifzProgress((current) => ({ ...current, dailyGoal: Number(event.target.value) }))} aria-label="Daily ayah goal">{[1, 3, 5, 7, 10].map((goal) => <option value={goal} key={goal}>{goal} ayāt</option>)}</select></label>
                  </div>
                </section>

                <section className="mastery-plan-card today-plan-card" aria-labelledby="daily-plan-title">
                  <div className="mastery-plan-copy"><span className="mastery-eyebrow">TODAY&apos;S STUDY</span><h3 id="daily-plan-title">A focused {hifzProgress.sessionMinutes}-minute path</h3><p>Due Hifz, approved education checks, and due vocabulary come before new approved lessons, vocabulary, and reading. You can skip or exit at any time.</p><div className="today-plan-metrics"><span><strong>Page {pageData.page}</strong>continue reading</span><span><strong>{dueReviews}</strong>Hifz due</span><span><strong>{vocabularyDue}</strong>vocabulary due</span><span><strong>{studyStreak}</strong>day rhythm</span></div></div>
                  <div className="mastery-duration" aria-label="Session length">{([5, 10, 20] as const).map((minutes) => <button type="button" disabled={studyDurationLocked} className={hifzProgress.sessionMinutes === minutes ? "active" : ""} aria-pressed={hifzProgress.sessionMinutes === minutes} onClick={() => setHifzProgress((current) => ({ ...current, sessionMinutes: minutes }))} key={minutes}>{minutes} min</button>)}</div>
                  <div className="today-goal" role="progressbar" aria-label="Today’s Study progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={todayCompletion.percent}><span style={{ width: `${todayCompletion.percent}%` }} /><small>{todayCompletion.completedSteps} of {todayCompletion.totalSteps} steps complete</small></div>
                  <div className="mastery-plan-preview">{displayedTodayPlan.steps.map((step, index) => <span className={`plan-chip ${step.kind}`} key={step.id}><i>{index + 1}</i><strong>{step.title}</strong><small>{step.estimatedMinutes} min</small></span>)}{!displayedTodayPlan.steps.length && <p>Your plan is clear. Continue reading whenever you are ready.</p>}</div>
                  <button type="button" className="mastery-start" onClick={startTodayStudy} disabled={!todayPlan.steps.length || todaySessionFinished}>{todaySessionFinished ? todayCompletion.percent === 100 ? "Today’s Study complete" : "Today’s Study ended" : activeStudySession ? "Resume Today’s Study" : "Start Today’s Study"} <span>→</span></button>
                </section>

                <section className="vocabulary-dashboard-card" aria-labelledby="vocabulary-dashboard-title">
                  <div><span className="mastery-eyebrow">QURAN VOCABULARY</span><h3 id="vocabulary-dashboard-title">Foundation 125</h3><p>The learning engine and local review state are ready. Production lessons remain unavailable until a 125-entry source passes rights, provenance, integrity, and coordinate audit.</p></div>
                  <dl><div><dt>Curriculum</dt><dd>0 / {foundation125?.expectedEntryCount ?? 125}</dd></div><div><dt>Due today</dt><dd>0</dd></div><div><dt>Status</dt><dd>Source approval required</dd></div></dl>
                  <button type="button" disabled aria-describedby="foundation-source-status">Continue learning</button>
                  <small id="foundation-source-status">No Quran vocabulary, morphology, root, lemma, or occurrence data is bundled.</small>
                </section>

                <section className="notes-dashboard-card" aria-labelledby="notes-dashboard-title"><div><span className="mastery-eyebrow">PRIVATE STUDY NOTES</span><h3 id="notes-dashboard-title">Your annotations</h3><p>Plain-text notes and personal tags stay on this device and remain separate from verified source evidence.</p></div><strong>{studyNotes.notes.length}</strong><button type="button" onClick={() => { setSavedSection("notes"); setOverlay("Bookmarks"); }}>Open My Notes</button></section>

                <section className="mastery-map-card" aria-labelledby="mastery-map-title">
                  <header><div><span className="mastery-eyebrow">604-PAGE VIEW</span><h3 id="mastery-map-title">Your Mushaf at a glance</h3></div><div className="mastery-map-totals"><span><i className="strong" />{masteryCounts.strong} strong</span><span><i className="learning" />{masteryCounts.learning} learning</span><span><i className="due" />{masteryCounts.due} due</span></div></header>
                  <div className="mastery-page-grid">{pageMasteryMap.map((item) => <button type="button" className={item.status} onClick={() => { goToPage(item.page); setOverlay(null); }} aria-label={`Page ${item.page}: ${item.status.replace("-", " ")}${item.memorized ? `, ${item.memorized} ayat memorized` : ""}${item.due ? `, ${item.due} due` : ""}`} title={`Page ${item.page} · ${item.status.replace("-", " ")}`} key={item.page}>{item.page}</button>)}</div>
                </section>

                <div className="hifz-grid">
                  <section className="hifz-card hifz-looper">
                    <div className="hifz-card-heading"><span>02</span><div><h3>Verse looper</h3><p>Build a repetition set from the ayāt on page {pageData.page}.</p></div></div>
                    <div className="hifz-range">
                      <label>FROM<select value={hifzFrom} onChange={(event) => setHifzFrom(event.target.value)}>{pageData.verses.map((verse) => <option value={verse.key} key={verse.key}>Ayah {verse.key}</option>)}</select></label>
                      <span aria-hidden="true">→</span>
                      <label>TO<select value={hifzTo} onChange={(event) => setHifzTo(event.target.value)}>{pageData.verses.map((verse) => <option value={verse.key} key={verse.key}>Ayah {verse.key}</option>)}</select></label>
                    </div>
                    <fieldset><legend>REPEAT COUNT</legend><div className="hifz-options">{([3, 5, 7, 10] as HifzRepeatCount[]).map((count) => <button type="button" className={hifzRepeatCount === count ? "active" : ""} aria-pressed={hifzRepeatCount === count} onClick={() => setHifzRepeatCount(count)} key={count}>×{count}</button>)}</div></fieldset>
                    <fieldset><legend>PAUSE BETWEEN PASSES</legend><div className="hifz-options pause-options">{([{ value: 0, label: "None" }, { value: 1500, label: "1.5s" }, { value: 3000, label: "3s" }, { value: 5000, label: "5s" }] as Array<{ value: HifzPauseMs; label: string }>).map((item) => <button type="button" className={hifzPauseMs === item.value ? "active" : ""} aria-pressed={hifzPauseMs === item.value} onClick={() => setHifzPauseMs(item.value)} key={item.value}>{item.label}</button>)}</div></fieldset>
                    <fieldset><legend>PACE</legend><div className="hifz-options">{([0.75, 1, 1.25] as HifzPace[]).map((pace) => <button type="button" className={hifzPace === pace ? "active" : ""} aria-pressed={hifzPace === pace} onClick={() => setHifzPace(pace)} key={pace}>{pace}×</button>)}</div></fieldset>
                    {hifzLoop ? <div className="active-loop"><span>Pass {hifzLoop.pass} of {hifzLoop.totalPasses}</span><button type="button" onClick={() => { stopHifzLoop(); setOverlay(null); }}>Stop loop</button></div> : <button type="button" className="hifz-primary" onClick={startHifzLoop}>Start looping <span>→</span></button>}
                  </section>

                  <div className="hifz-side-column">
                    <section className="hifz-card self-test-card">
                      <div className="hifz-card-heading"><span>03</span><div><h3>Hidden-text self-test</h3><p>Blur every ayah, then reveal only what you need.</p></div></div>
                      <button type="button" className={`self-test-toggle ${hifzHidden ? "active" : ""}`} onClick={() => { setHifzHidden((value) => !value); setRevealedVerses([]); setOverlay(null); }}><span><strong>{hifzHidden ? "Self-test is on" : "Hide this page"}</strong><small>{hifzHidden ? "Return to clear text" : "Tap an ayah to reveal it"}</small></span><i aria-hidden="true" /></button>
                    </section>

                    <section className="hifz-card memorized-card">
                      <div className="hifz-card-heading"><span>04</span><div><h3>Memorized</h3><p>Your marked ayāt, newest first.</p></div></div>
                      <div className="memorized-list">
                        {hifzProgress.memorized.map((item) => <button type="button" key={item.verseKey} onClick={() => { goToPage(item.page, undefined, item.verseKey); setVerseActionsOpen(true); setOverlay(null); }}><span className="memorized-rosette">✓</span><span><strong>Ayah {item.verseKey}</strong><small>Page {item.page} · marked {item.markedAt}</small></span><span aria-hidden="true">›</span></button>)}
                        {!hifzProgress.memorized.length && <p className="empty-state">Tap an ayah in the reader, then choose “Mark memorized.”</p>}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </section>
          )}

          {overlay === "Jump" && (
            <section className="panel-shell jump-panel" role="dialog" aria-modal="true" aria-labelledby="jump-title">
              <header><div><span className="panel-kicker">GO TO A PLACE</span><h2 id="jump-title">Jump in the mushaf</h2></div>{closeButton}</header>
              <div className="jump-content">
                <form className="jump-page-form" onSubmit={submitJump} noValidate>
                  <label htmlFor="jump-sheet-page"><span>PAGE NUMBER</span><strong>1–604</strong></label>
                  <div><input id="jump-sheet-page" autoFocus type="number" min="1" max={TOTAL_PAGES} inputMode="numeric" value={jumpValue} onChange={(event) => { setJumpValue(event.target.value); setJumpError(""); }} aria-describedby={jumpError ? "jump-error" : undefined} /><span>/ {TOTAL_PAGES}</span><button type="submit">Go</button></div>
                </form>

                <div className="jump-selectors">
                  <label><span>SŪRAH</span><select value={jumpChapterId} onChange={(event) => { setJumpChapterId(Number(event.target.value)); setJumpError(""); }} disabled={contentsLoading || !chapters.length} aria-label="Choose sūrah">{chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.id}. {chapter.name} · page {chapter.startPage}</option>)}</select><button type="button" onClick={openSelectedChapter} disabled={contentsLoading || !chapters.length}>Open</button></label>
                  <label><span>JUZ</span><select value={jumpJuz} onChange={(event) => { setJumpJuz(Number(event.target.value)); setJumpError(""); }} aria-label="Choose juz">{JUZ_START_PAGES.map((startPage, index) => <option key={startPage} value={index + 1}>Juz {index + 1} · page {startPage}</option>)}</select><button type="button" onClick={openSelectedJuz}>Open</button></label>
                </div>

                {jumpError && <p className="jump-error" id="jump-error" role="alert">{jumpError}</p>}

                <section className="jump-shortcuts" aria-labelledby="recent-pages-title">
                  <div><h3 id="recent-pages-title">Recent pages</h3><small>Stored only on this device</small></div>
                  <div className="jump-chip-list">{recentPages.map((recentPage) => <button type="button" key={recentPage} className={recentPage === pageData.page ? "current" : ""} onClick={() => { goToPage(recentPage); setOverlay(null); }}><span>PAGE</span><strong>{recentPage}</strong></button>)}</div>
                </section>

                <section className="jump-shortcuts" aria-labelledby="saved-places-title">
                  <div><h3 id="saved-places-title">Saved places</h3><button type="button" onClick={() => { setSavedSection("bookmarks"); setOverlay("Bookmarks"); }}>View all</button></div>
                  {savedPageShortcuts.length ? <div className="jump-saved-list">{savedPageShortcuts.map((saved) => <button type="button" key={`${saved.page}|${saved.verseKey}`} onClick={() => { goToPage(saved.page, undefined, saved.verseKey); setOverlay(null); }}><span>PAGE {saved.page}</span><strong>Ayah {saved.verseKey}</strong><span aria-hidden="true">›</span></button>)}</div> : <p className="jump-empty">Bookmark an ayah to keep a shortcut here.</p>}
                </section>
              </div>
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
              <header><div><span className="panel-kicker">SAVED ON THIS DEVICE</span><h2 id="bookmarks-title">Saved study</h2></div>{closeButton}</header>
              <div className="saved-study-tabs" role="tablist" aria-label="Saved study sections"><button type="button" role="tab" aria-selected={savedSection === "bookmarks"} onClick={() => setSavedSection("bookmarks")}>Bookmarks</button><button type="button" role="tab" aria-selected={savedSection === "notes"} onClick={() => setSavedSection("notes")}>My Notes · {studyNotes.notes.length}</button></div>
              {savedSection === "bookmarks" ? <div className="bookmark-list" role="tabpanel">
                {bookmarks.map((bookmark) => {
                  const [savedPage, verseKey] = bookmark.split("|");
                  return <div key={bookmark}><button type="button" onClick={() => { goToPage(Number(savedPage), undefined, verseKey); setOverlay(null); }}><span>PAGE {savedPage}</span><strong>Ayah {verseKey}</strong></button><button type="button" onClick={() => setBookmarks((items) => items.filter((item) => item !== bookmark))} aria-label={`Remove bookmark ${verseKey}`}>×</button></div>;
                })}
                {!bookmarks.length && <p className="empty-state">Bookmark an ayah to keep your place here.</p>}
              </div> : <div role="tabpanel"><StudyNotesIndex notes={studyNotes.notes} onOpen={openPrivateNote} onDelete={deletePrivateNote} onRenameTag={renamePrivateTag} onRemoveTag={removePrivateTag} /></div>}
            </section>
          )}

          {overlay === "Settings" && (
            <section className="panel-shell settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
              <header><div><span className="panel-kicker">READER PREFERENCES</span><h2 id="settings-title">Settings</h2></div>{closeButton}</header>
              <div className="settings-content">
                <section className="settings-group"><h3>Appearance</h3><div className="setting-row"><span><strong>Theme</strong><small>Choose the reading surface.</small></span><div className="segmented"><button type="button" className={!dark ? "active" : ""} onClick={() => setDark(false)}>Light</button><button type="button" className={dark ? "active" : ""} onClick={() => setDark(true)}>Night</button></div></div><div className="setting-row"><span><strong>Page size</strong><small>Preserves all 15 line slots.</small></span><select value={pageScale} onChange={(event) => setPageScale(event.target.value as PageScale)} aria-label="Page size"><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="large">Large</option></select></div><div className="setting-row"><span><strong>Reading font</strong><small>Uthman Taha is the page-faithful default.</small></span><select value={readingFont} onChange={(event) => setReadingFont(event.target.value as ReadingFont)} aria-label="Reading font">{READING_FONTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div></section>
                <section className="settings-group">
                  <h3>Audio</h3>
                  <div className="setting-row">
                    <span><strong>Default reciter</strong><small>{currentReciter.scope === "surah" ? "Continuous sūrah playback." : "Used for verse playback."}</small></span>
                    <select value={reciter} onChange={(event) => selectReciter(event.target.value as ReciterId)} aria-label="Default reciter">
                      <optgroup label="Default Reciters">
                        {DEFAULT_RECITERS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </optgroup>
                      <optgroup label="Other Reciters">
                        {displayedOtherReciters.map((item) => <option key={item.id} value={item.id}>{item.name} {item.style !== "murattal" ? `(${item.style})` : ""}</option>)}
                      </optgroup>
                    </select>
                  </div>
                  <div className="setting-row">
                    <span><strong>Filter other reciters</strong><small>Search name or recitation style.</small></span>
                    <div className="reciter-filter-wrap">
                      <input type="search" className="reciter-search-input" placeholder="Search other reciters…" value={reciterSearch} onChange={(event) => setReciterSearch(event.target.value)} aria-label="Filter other reciters" />
                    </div>
                  </div>
                  <div className="setting-row"><span><strong>Playback speed</strong><small>Applies immediately.</small></span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} aria-label="Playback speed">{PLAYBACK_SPEEDS.map((rate) => <option key={rate} value={rate}>{rate}×</option>)}</select></div>
                </section>
                <section className="settings-group offline-settings"><h3>Offline audio</h3><p>{offlineAudioStats.completePacks} verified packs · {formatAudioBytes(offlineAudioStats.usedBytes)} on this device.</p><button type="button" onClick={openDownloads}>Manage downloads <span>→</span></button><small>Surah and juz packs are stored privately in this browser.</small></section>
                <section className="settings-group data-portability"><h3>Private backup</h3><p>Your private notes, reading history, and mastery map stay on this device unless you explicitly download a backup.</p><div><button type="button" onClick={downloadBackup}>Download backup</button><button type="button" onClick={() => backupInputRef.current?.click()}>Restore backup</button><input ref={backupInputRef} type="file" accept="application/json,.json" onChange={importBackup} hidden /></div></section>
                <footer className="edition-note"><span>VERIFIED CONTENT</span><strong>Madani Mushaf · Hafs · 15-line page map</strong><small>Manifest {pageData.provenance.manifestRevision} · SHA-256 {pageData.provenance.pageChecksum.slice(0, 12)}… · <a href={contentTransport.contentManifestUrl} target="_blank" rel="noreferrer">view sources</a></small></footer>
              </div>
            </section>
          )}

          {overlay === "Downloads" && (
            <OfflineAudioPanel
              chapters={chapters}
              initialChapter={currentChapter?.id ?? 1}
              wifiOnly={wifiOnlyDownloads}
              onWifiOnlyChange={setWifiOnlyDownloads}
              onClose={() => setOverlay(null)}
              onNotice={setNotice}
              onLibraryChanged={() => setOfflineAudioRevision((value) => value + 1)}
              onPlayPack={playOfflinePack}
            />
          )}

          {overlay === "Tafsir" && selectedVerse && (
            <TafsirPanel
              document={displayedTafsir}
              loading={tafsirLoading || (!displayedTafsir && !tafsirError)}
              error={tafsirError}
              verseKey={selectedVerseKey}
              arabic={selectedVerse.uthmani}
              translation={selectedVerse.translation}
              canMovePrevious={canStudyPrevious}
              canMoveNext={canStudyNext}
              onMove={moveStudyAyah}
              onRetry={() => setTafsirRevision((value) => value + 1)}
              onClose={() => setOverlay(null)}
            />
          )}

          {overlay === "Context" && selectedVerse && translationPackServiceRef.current && (
            <AyahContextLens
              service={translationPackServiceRef.current}
              initialTab={studyInitialTab}
              verseKey={selectedVerseKey}
              surahNumber={currentChapter?.id ?? Number(selectedVerseKey.split(":")[0])}
              surahName={currentChapter?.name ?? "Quran"}
              surahMeaning={currentChapter?.translatedName ?? ""}
              page={pageData.page}
              juz={pageData.juz}
              hizb={pageData.hizb}
              arabic={selectedVerse.uthmani}
              englishTranslation={selectedVerse.translation}
              tafsirDocument={displayedTafsir}
              tafsirLoading={tafsirLoading || (!displayedTafsir && !tafsirError)}
              tafsirError={tafsirError}
              selectedWord={selectedWord}
              wordRecord={wordRecord}
              wordStudySource={wordStudySource}
              wordStudyLoading={wordStudyLoading}
              occurrenceExplorer={occurrenceExplorer}
              ayahNotes={selectedAyahNotes}
              wordNotes={selectedWordNotes}
              evidenceResult={evidenceResult}
              playing={playing}
              memorized={memorizedVerseKeys.has(selectedVerseKey)}
              tajweedEnabled={tajweed}
              canMovePrevious={canStudyPrevious}
              canMoveNext={canStudyNext}
              onActiveTabChange={changeStudyActiveTab}
              onMoveAyah={moveStudyAyah}
              onRetryTafsir={() => setTafsirRevision((value) => value + 1)}
              onTogglePlay={togglePlay}
              onToggleMemorized={toggleMemorized}
              onToggleTajweed={() => setTajweed((value) => !value)}
              onOpenHifz={() => setOverlay("Hifz")}
              onOpenTajweedGuide={() => { setOverlay(null); setTajweedGuideOpen(true); }}
              onHearWordInAyah={togglePlay}
              onExploreLemma={(lemmaId, label) => exploreWordOccurrences("lemma", lemmaId, label)}
              onExploreRoot={(rootId, label) => exploreWordOccurrences("root", rootId, label)}
              onOpenOccurrence={openWordOccurrence}
              onCloseOccurrences={() => { occurrenceRequestGateRef.current.cancel(); setOccurrenceExplorer(null); }}
              onCreateNote={createPrivateNote}
              onUpdateNote={updatePrivateNote}
              onDeleteNote={deletePrivateNote}
              onOpenEvidenceAyah={openEvidenceAyah}
              onClose={closeContextLens}
            />
          )}

          {overlay === "Listen" && (
            <section className="panel-shell audio-sheet" role="dialog" aria-modal="true" aria-labelledby="audio-title">
              <div className="sheet-handle" aria-hidden="true" />
              <header><div><span className="panel-kicker">{isOfflinePackPlayback ? `OFFLINE PACK · ${offlinePackIndex + 1} OF ${offlinePackQueue.length}` : isSurahPlayback ? "SURAH RECITATION" : "VERSE RECITATION"}</span><h2 id="audio-title">{isSurahPlayback && !isOfflinePackPlayback ? (currentChapter?.name ?? "Quran") : `Ayah ${selectedVerseKey}`}</h2></div>{closeButton}</header>
              <div className="sheet-now-playing"><span className="reciter-avatar large">{currentReciter.initials}</span><div><strong>{currentReciter.name}</strong><small>{currentChapter?.name} · Page {pageData.page}{audioSource?.offline ? " · Playing offline" : " · Streaming"}</small></div></div>
              <div className="sheet-transport"><button type="button" onClick={() => moveAyah(-1)} disabled={currentReciter.scope === "surah"} aria-label="Previous ayah">‹</button><button type="button" className="sheet-play" onClick={togglePlay} aria-label={playing ? "Pause recitation" : "Play recitation"}>{playing ? "Ⅱ" : "▶"}</button><button type="button" onClick={() => stopPlayback()} aria-label="Stop recitation">■</button><button type="button" onClick={() => moveAyah(1)} disabled={currentReciter.scope === "surah"} aria-label="Next ayah">›</button></div>
              <div className="sheet-progress"><input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(progress, duration || 0)} style={{ "--progress": `${duration ? (progress / duration) * 100 : 0}%` } as React.CSSProperties} onChange={(event) => { if (audioRef.current) audioRef.current.currentTime = Number(event.target.value); }} aria-label="Audio progress" /><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div>
              <div className="audio-settings-grid">
                <label>
                  RECITER
                  <select value={reciter} onChange={(event) => selectReciter(event.target.value as ReciterId)} aria-label="Reciter">
                    <optgroup label="Default Reciters">
                      {DEFAULT_RECITERS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </optgroup>
                    <optgroup label="Other Reciters">
                      {displayedOtherReciters.map((item) => <option key={item.id} value={item.id}>{item.name} {item.style !== "murattal" ? `(${item.style})` : ""}</option>)}
                    </optgroup>
                  </select>
                </label>
                <label>SPEED<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>{PLAYBACK_SPEEDS.map((rate) => <option key={rate} value={rate}>{rate}×</option>)}</select></label>
                <label>REPEAT<select value={repeatMode} onChange={(event) => setRepeatMode(event.target.value as RepeatMode)} disabled={isSurahPlayback}><option value="off">{isSurahPlayback ? "Sūrah playback" : "Off"}</option><option value="ayah">Current ayah</option><option value="range">Ayah range</option></select></label>
              </div>
              <div className="reciter-filter-row">
                <input type="search" className="reciter-search-input" placeholder="Filter other reciters by name, style…" value={reciterSearch} onChange={(event) => setReciterSearch(event.target.value)} aria-label="Filter other reciters" />
              </div>
              <button type="button" className="open-downloads" onClick={openDownloads}><span>↓</span><span><strong>Offline audio library</strong><small>{offlineAudioStats.packCount ? `${offlineAudioStats.completePacks} packs ready · ${formatAudioBytes(offlineAudioStats.usedBytes)}` : "Download a sūrah or juz"}</small></span><span>›</span></button>
              {currentReciter.scope === "surah" && <p className="audio-scope-note">This recitation is provided as continuous sūrah audio. Ayah repeat remains available with verse-by-verse reciters.</p>}
              {surahPlaybackChapter !== null && currentReciter.scope === "ayah" && <p className="audio-scope-note">Complete sūrah mode is active. Each verified āyah file will continue in order until the end of this sūrah.</p>}
              {isOfflinePackPlayback && <p className="audio-scope-note">Verified offline sequence is active. It will continue through every downloaded āyah even without Quran page-data access.</p>}
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
