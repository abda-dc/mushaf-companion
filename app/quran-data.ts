export type ReciterId = "alafasy" | "abdulbasit" | "saad";

// Prototype content snapshot, verified 2026-08-04.
// Uthmani text + transliteration: api.quran.com/api/v4/verses/by_chapter/1
// Tajweed markup: api.quran.com/api/v4/quran/verses/uthmani_tajweed?chapter_number=1
// Keep this file separate from rendering; production should hydrate the full 604-page
// mapping through a server-side Quran Foundation integration and fail closed on errors.

export const RECITERS: Array<{ id: ReciterId; name: string; initials: string }> = [
  { id: "alafasy", name: "Mishary Rashid Alafasy", initials: "MA" },
  { id: "abdulbasit", name: "Abdul Basit Abdus Samad", initials: "AB" },
  { id: "saad", name: "Saad Al-Ghamdi", initials: "SG" },
];

export const SURAH_FATIHAH = [
  {
    number: 1,
    key: "1:1",
    arabicNumber: "١",
    uthmani: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    tajweed: 'بِسْمِ <tajweed class="ham-wasl">ٱ</tajweed>للَّهِ <tajweed class="ham-wasl">ٱ</tajweed><tajweed class="laam-shamsiyah">ل</tajweed>رَّحْمَ<tajweed class="madda-normal">ـٰ</tajweed>نِ <tajweed class="ham-wasl">ٱ</tajweed><tajweed class="laam-shamsiyah">ل</tajweed>رَّح<tajweed class="madda-permissible">ِي</tajweed>مِ <span class="ayah-marker">١</span>',
    transliteration: "Bismi Allahi arrahmani arraheem",
  },
  {
    number: 2,
    key: "1:2",
    arabicNumber: "٢",
    uthmani: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
    tajweed: 'ٱلْحَمْدُ لِلَّهِ رَبِّ <tajweed class="ham-wasl">ٱ</tajweed>لْعَ<tajweed class="madda-normal">ـٰ</tajweed>لَم<tajweed class="madda-permissible">ِي</tajweed>نَ <span class="ayah-marker">٢</span>',
    transliteration: "Alhamdu lillahi rabbi alAAalameen",
  },
  {
    number: 3,
    key: "1:3",
    arabicNumber: "٣",
    uthmani: "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    tajweed: 'ٱ<tajweed class="laam-shamsiyah">ل</tajweed>رَّحْمَ<tajweed class="madda-normal">ـٰ</tajweed>نِ <tajweed class="ham-wasl">ٱ</tajweed><tajweed class="laam-shamsiyah">ل</tajweed>رَّح<tajweed class="madda-permissible">ِي</tajweed>مِ <span class="ayah-marker">٣</span>',
    transliteration: "Arrahmani arraheem",
  },
  {
    number: 4,
    key: "1:4",
    arabicNumber: "٤",
    uthmani: "مَـٰلِكِ يَوْمِ ٱلدِّينِ",
    tajweed: 'مَ<tajweed class="madda-normal">ـٰ</tajweed>لِكِ يَوْمِ <tajweed class="ham-wasl">ٱ</tajweed><tajweed class="laam-shamsiyah">ل</tajweed>دّ<tajweed class="madda-permissible">ِي</tajweed>نِ <span class="ayah-marker">٤</span>',
    transliteration: "Maliki yawmi addeen",
  },
  {
    number: 5,
    key: "1:5",
    arabicNumber: "٥",
    uthmani: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    tajweed: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَع<tajweed class="madda-permissible">ِي</tajweed>نُ <span class="ayah-marker">٥</span>',
    transliteration: "Iyyaka naAAbudu wa-iyyaka nastaAAeen",
  },
  {
    number: 6,
    key: "1:6",
    arabicNumber: "٦",
    uthmani: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
    tajweed: 'ٱهْدِنَا <tajweed class="ham-wasl">ٱ</tajweed><tajweed class="laam-shamsiyah">ل</tajweed>صِّر<tajweed class="madda-normal">َٲ</tajweed>طَ <tajweed class="ham-wasl">ٱ</tajweed>لْمُسْتَق<tajweed class="madda-permissible">ِي</tajweed>مَ <span class="ayah-marker">٦</span>',
    transliteration: "Ihdina assirata almustaqeem",
  },
  {
    number: 7,
    key: "1:7",
    arabicNumber: "٧",
    uthmani: "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ",
    tajweed: 'صِر<tajweed class="madda-normal">َٲ</tajweed>طَ <tajweed class="ham-wasl">ٱ</tajweed>لَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ <tajweed class="ham-wasl">ٱ</tajweed>لْمَغْضُوبِ عَلَيْهِمْ وَلَا <tajweed class="ham-wasl">ٱ</tajweed><tajweed class="laam-shamsiyah">ل</tajweed>ضّ<tajweed class="madda-necessary">َا</tajweed>ٓلّ<tajweed class="madda-permissible">ِي</tajweed>نَ <span class="ayah-marker">٧</span>',
    transliteration: "Sirata allatheena anAAamta AAalayhim ghayri almaghdoobi AAalayhim wala addalleen",
  },
] as const;
