export type ReciterId = "alafasy" | "abdulbasit" | "saad" | "aymen" | "minshawi-kids" | "abdul-rashid-sufi";

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
  { id: "abdul-rashid-sufi", name: "Sheikh Abdul Rashid Ali Sufi", initials: "RS", scope: "surah" },
];

const FATIHAH_VERSES: PageVerse[] = [
  { key: "1:1", number: 1, chapterId: 1, uthmani: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ", transliteration: "Bismi Allahi arrahmani arraheem" },
  { key: "1:2", number: 2, chapterId: 1, uthmani: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ", transliteration: "Alhamdu lillahi rabbi alAAalameen" },
  { key: "1:3", number: 3, chapterId: 1, uthmani: "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ", transliteration: "Arrahmani arraheem" },
  { key: "1:4", number: 4, chapterId: 1, uthmani: "مَـٰلِكِ يَوْمِ ٱلدِّينِ", transliteration: "Maliki yawmi addeen" },
  { key: "1:5", number: 5, chapterId: 1, uthmani: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", transliteration: "Iyyaka naAAbudu wa-iyyaka nastaAAeen" },
  { key: "1:6", number: 6, chapterId: 1, uthmani: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ", transliteration: "Ihdina assirata almustaqeem" },
  { key: "1:7", number: 7, chapterId: 1, uthmani: "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ", transliteration: "Sirata allatheena anAAamta AAalayhim ghayri almaghdoobi AAalayhim wala addalleen" },
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
};
