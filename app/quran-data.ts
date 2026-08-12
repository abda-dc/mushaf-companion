export type ReciterId = "alafasy" | "abdulbasit" | "saad" | "aymen" | "minshawi-kids" | "muhammad-ayyub" | "abdul-rashid-sufi";

export type ReciterScope = "ayah" | "surah";

export interface PageWord {
  id: number;
  text: string;
  tajweedHtml: string;
  verseKey: string;
  isEnd: boolean;
  qcfCode?: string;
  qcfTajweedCode?: string;
  pageNumber?: number;
}

export interface PageLine {
  number: number;
  words: PageWord[];
}

export interface PageVerse {
  key: string;
  number: number;
  chapterId: number;
  uthmani: string;
  transliteration: string;
  translation: string;
  sajdahNumber?: number;
}

export interface PageProvenance {
  verified: boolean;
  manifestRevision: string;
  mushafId: number;
  arabicResource: string;
  tajweedResource: string;
  translationResource: number;
  transliterationResource: number;
  pageChecksum: string;
}

export interface PageChapter {
  id: number;
  name: string;
  translatedName: string;
  arabicName: string;
  revelationPlace: string;
}

export interface ChapterStart {
  chapterId: number;
  headerLine: number;
  bismillahLine: number | null;
}

export interface QuranPage {
  page: number;
  juz: number;
  hizb: number;
  lines: PageLine[];
  verses: PageVerse[];
  chapters: PageChapter[];
  chapterStarts: ChapterStart[];
  provenance: PageProvenance;
}

export interface SearchResult {
  id: string;
  type: "page" | "chapter" | "verse";
  label: string;
  detail: string;
  arabic?: string;
  page?: number;
  verseKey?: string;
}

export interface QuranChapterInfo {
  id: number;
  name: string;
  simpleName: string;
  arabicName: string;
  translatedName: string;
  revelationPlace: "makkah" | "madinah";
  revelationOrder: number;
  versesCount: number;
  startPage: number;
  endPage: number;
  juzs: number[];
  bismillahPre: boolean;
}

export const RECITERS: Array<{ id: ReciterId; name: string; initials: string; scope: ReciterScope }> = [
  { id: "alafasy", name: "Mishary Rashid Alafasy", initials: "MA", scope: "ayah" },
  { id: "abdulbasit", name: "Abdul Basit Abdus Samad", initials: "AB", scope: "ayah" },
  { id: "saad", name: "Saad Al-Ghamdi", initials: "SG", scope: "ayah" },
  { id: "aymen", name: "Dr. Aymen Suwayed", initials: "AS", scope: "ayah" },
  { id: "minshawi-kids", name: "Minshawi Kids Repeat", initials: "MK", scope: "ayah" },
  { id: "muhammad-ayyub", name: "Sheikh Muhammad Ayyub", initials: "MY", scope: "ayah" },
  { id: "abdul-rashid-sufi", name: "Sheikh Abdul Rashid Ali Sufi", initials: "RS", scope: "surah" },
];

const FATIHAH_VERSES: PageVerse[] = [
  { key: "1:1", number: 1, chapterId: 1, uthmani: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ", transliteration: "Bismi Allahi arrahmani arraheem", translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful." },
  { key: "1:2", number: 2, chapterId: 1, uthmani: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ", transliteration: "Alhamdu lillahi rabbi alAAalameen", translation: "All praise is due to Allah, Lord of the worlds." },
  { key: "1:3", number: 3, chapterId: 1, uthmani: "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ", transliteration: "Arrahmani arraheem", translation: "The Entirely Merciful, the Especially Merciful." },
  { key: "1:4", number: 4, chapterId: 1, uthmani: "مَـٰلِكِ يَوْمِ ٱلدِّينِ", transliteration: "Maliki yawmi addeen", translation: "Sovereign of the Day of Recompense." },
  { key: "1:5", number: 5, chapterId: 1, uthmani: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", transliteration: "Iyyaka naAAbudu wa-iyyaka nastaAAeen", translation: "It is You we worship and You we ask for help." },
  { key: "1:6", number: 6, chapterId: 1, uthmani: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ", transliteration: "Ihdina assirata almustaqeem", translation: "Guide us to the straight path." },
  { key: "1:7", number: 7, chapterId: 1, uthmani: "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ", transliteration: "Sirata allatheena anAAamta AAalayhim ghayri almaghdoobi AAalayhim wala addalleen", translation: "The path of those upon whom You have bestowed favor, not of those who have evoked anger or gone astray." },
];

function fallbackLine(number: number, verse?: PageVerse): PageLine {
  if (!verse) return { number, words: [] };
  return {
    number,
    words: [
      { id: verse.number * 2, text: verse.uthmani, tajweedHtml: verse.uthmani, verseKey: verse.key, isEnd: false },
      { id: verse.number * 2 + 1, text: "٠١٢٣٤٥٦٧٨٩"[verse.number], tajweedHtml: "", verseKey: verse.key, isEnd: true },
    ],
  };
}

// Fail-safe content rendered before the selected Madani page is loaded. Dynamic page
// data comes from the Quran Foundation page, word-line, tajweed and transliteration APIs.
export const FALLBACK_PAGE: QuranPage = {
  page: 1,
  juz: 1,
  hizb: 1,
  verses: FATIHAH_VERSES,
  chapters: [{ id: 1, name: "Al-Fātiḥah", translatedName: "The Opener", arabicName: "الفاتحة", revelationPlace: "makkah" }],
  chapterStarts: [{ chapterId: 1, headerLine: 1, bismillahLine: null }],
  lines: Array.from({ length: 15 }, (_, index) => fallbackLine(index + 1, index > 0 && index < 8 ? FATIHAH_VERSES[index - 1] : undefined)),
  provenance: {
    verified: false,
    manifestRevision: "fallback-shell",
    mushafId: 1,
    arabicResource: "bundled-fail-safe",
    tajweedResource: "bundled-fail-safe",
    translationResource: 20,
    transliterationResource: 57,
    pageChecksum: "fallback-shell",
  },
};
