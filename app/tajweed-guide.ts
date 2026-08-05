export type TajweedRuleId =
  | "ham_wasl"
  | "slnt"
  | "laam_shamsiyah"
  | "madda_normal"
  | "madda_permissible"
  | "madda_necessary"
  | "madda_obligatory"
  | "qalaqah"
  | "ikhafa"
  | "ikhafa_shafawi"
  | "idgham_shafawi"
  | "iqlab"
  | "idgham_ghunnah"
  | "idgham_wo_ghunnah"
  | "idgham_mutajanisayn"
  | "idgham_mutaqaribayn"
  | "ghunnah";

export interface TajweedRule {
  id: TajweedRuleId;
  name: string;
  arabicName: string;
  family: string;
  instruction: string;
  count?: string;
  examples: Array<{ text: string; verseKey: string }>;
}

export const TAJWEED_RULES: TajweedRule[] = [
  {
    id: "ham_wasl",
    name: "Hamzat al-Waṣl",
    arabicName: "هَمْزَةُ الْوَصْلِ",
    family: "Pronunciation",
    instruction: "Pronounce this joining hamzah when beginning here; omit its sound when joining from the word before it.",
    examples: [["ٱ", "1:1"], ["ٱ", "1:2"], ["ٱ", "1:3"], ["ٱ", "1:4"], ["ٱ", "1:6"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "slnt",
    name: "Silent letter",
    arabicName: "حَرْفٌ صَامِتٌ",
    family: "Pronunciation",
    instruction: "The marked letter is written in the muṣḥaf but is not sounded when the recitation continues through it.",
    examples: [["و", "2:3"], ["وْ", "2:5"], ["اْ", "2:6"], ["اْ‌ۚ", "2:20"], ["اْ‌ۖ", "2:93"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "laam_shamsiyah",
    name: "Lām Shamsiyyah",
    arabicName: "اللَّامُ الشَّمْسِيَّةُ",
    family: "Pronunciation",
    instruction: "Do not pronounce the lām of al-. Merge it into the following sun letter, which is read with emphasis.",
    examples: [["ل", "1:1"], ["ل", "1:3"], ["ل", "1:4"], ["ل", "1:6"], ["ل", "1:7"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "madda_normal",
    name: "Natural Madd",
    arabicName: "الْمَدُّ الطَّبِيعِيُّ",
    family: "Elongation",
    instruction: "Lengthen the marked vowel naturally without a following hamzah or sukūn.",
    count: "2 counts",
    examples: [["ـٰ", "1:1"], ["َٲ", "1:6"], ["ٲ", "2:3"], ["ۥ", "2:17"], ["ِۦ", "2:22"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "madda_permissible",
    name: "Permissible Madd",
    arabicName: "الْمَدُّ الْجَائِزُ",
    family: "Elongation",
    instruction: "Lengthen according to the chosen teaching pace and keep that count consistent throughout the recitation.",
    count: "2, 4, or 6 counts",
    examples: [["ِي", "1:1"], ["ُو", "2:3"], ["َا", "2:165"], ["ـٰ", "2:197"], ["ا", "3:14"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "madda_necessary",
    name: "Necessary Madd",
    arabicName: "الْمَدُّ اللَّازِمُ",
    family: "Elongation",
    instruction: "A permanent sukūn follows the long vowel, so the elongation is held fully.",
    count: "6 counts",
    examples: [["َا", "1:7"], ["لٓ", "2:1"], ["مٓ", "2:1"], ["ـٰٓ", "6:80"], ["ُو", "6:80"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "madda_obligatory",
    name: "Obligatory Madd",
    arabicName: "الْمَدُّ الْوَاجِبُ",
    family: "Elongation",
    instruction: "A hamzah follows the long vowel in the same word; sustain the vowel beyond its natural length.",
    count: "4–5 counts",
    examples: [["َآ", "2:4"], ["ـٰٓ", "2:5"], ["َا", "2:6"], ["ىٰٓ", "2:7"], ["ُوٓ", "2:11"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "qalaqah",
    name: "Qalqalah",
    arabicName: "الْقَلْقَلَةُ",
    family: "Articulation",
    instruction: "Give a light echo to a sākin letter from ق ط ب ج د without adding a full vowel.",
    examples: [["قْ", "2:3"], ["بْ", "2:4"], ["جْ", "2:19"], ["دْ", "2:23"], ["طْ", "2:75"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "ikhafa",
    name: "Ikhfāʾ",
    arabicName: "الْإِخْفَاءُ",
    family: "Nūn and tanwīn",
    instruction: "Partially conceal a sākin nūn or tanwīn before an ikhfāʾ letter while maintaining nasal resonance.",
    count: "2 counts",
    examples: [["نف", "2:3"], ["نز", "2:4"], ["ن ق", "2:4"], ["نذ", "2:6"], ["ضٌ ف", "2:10"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "ikhafa_shafawi",
    name: "Ikhfāʾ Shafawī",
    arabicName: "الْإِخْفَاءُ الشَّفَوِيُّ",
    family: "Mīm sākinah",
    instruction: "When a sākin mīm comes before ب, lightly conceal it at the lips with ghunnah.",
    count: "2 counts",
    examples: [["ُم ب", "2:8"], ["ِم ب", "2:33"], ["ِم ب", "2:85"], ["ُم‌ۚ ب", "2:100"], ["ُم‌ۖ ب", "3:180"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "idgham_shafawi",
    name: "Idghām Shafawī",
    arabicName: "الْإِدْغَامُ الشَّفَوِيُّ",
    family: "Mīm sākinah",
    instruction: "Merge a sākin mīm into the following mīm and hold the nasal sound.",
    count: "2 counts",
    examples: [["ِم م", "2:10"], ["ُم م", "2:20"], ["ُم م", "2:23"], ["َم م", "2:249"], ["ُم‌ۚ م", "3:110"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "iqlab",
    name: "Iqlāb",
    arabicName: "الْإِقْلَابُ",
    family: "Nūn and tanwīn",
    instruction: "Before ب, change a sākin nūn or tanwīn into a concealed mīm sound with ghunnah.",
    count: "2 counts",
    examples: [["مُۢ ب", "2:10"], ["ُّۢ ب", "2:18"], ["طُۢ ب", "2:19"], ["ِنۢ ب", "2:27"], ["نۢب", "2:31"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "idgham_ghunnah",
    name: "Idghām with Ghunnah",
    arabicName: "إِدْغَامٌ بِغُنَّةٍ",
    family: "Nūn and tanwīn",
    instruction: "Merge a sākin nūn or tanwīn into ي ن م و and retain a measured nasal sound.",
    count: "2 counts",
    examples: [["دًى م", "2:5"], ["ةٌ‌ۖ و", "2:7"], ["َن ي", "2:8"], ["ضًا‌ۖ و", "2:10"], ["بٍ م", "2:19"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "idgham_wo_ghunnah",
    name: "Idghām without Ghunnah",
    arabicName: "إِدْغَامٌ بِغَيْرِ غُنَّةٍ",
    family: "Nūn and tanwīn",
    instruction: "Merge a sākin nūn or tanwīn completely into ل or ر without nasal prolongation.",
    examples: [["دًى ل", "2:2"], ["ِن ر", "2:5"], ["ِن ل", "2:12"], ["تٍ ل", "2:17"], ["قًا ل", "2:22"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "idgham_mutajanisayn",
    name: "Idghām Mutajānisayn",
    arabicName: "إِدْغَامُ الْمُتَجَانِسَيْنِ",
    family: "Assimilation",
    instruction: "Merge the first of two adjacent letters that share an articulation point but differ in qualities.",
    examples: [["د", "2:233"], ["د", "2:256"], ["ت", "3:69"], ["ت", "3:72"], ["ت", "3:122"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "idgham_mutaqaribayn",
    name: "Idghām Mutaqāribayn",
    arabicName: "إِدْغَامُ الْمُتَقَارِبَيْنِ",
    family: "Assimilation",
    instruction: "Merge the first of two adjacent letters whose articulation points or qualities are close.",
    examples: [["ل", "4:158"], ["ل", "6:147"], ["ل", "17:24"], ["ل", "17:80"], ["ل", "18:22"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
  {
    id: "ghunnah",
    name: "Ghunnah",
    arabicName: "الْغُنَّةُ",
    family: "Nasalization",
    instruction: "Hold the nasal sound on a doubled nūn or mīm without exaggerating the vowel around it.",
    count: "2 counts",
    examples: [["مّ", "2:3"], ["نّ", "2:6"], ["نّ", "2:8"], ["نّ", "2:11"], ["نّ", "2:12"]].map(([text, verseKey]) => ({ text, verseKey })),
  },
];

export const TAJWEED_RULE_MAP = new Map<TajweedRuleId, TajweedRule>(TAJWEED_RULES.map((rule) => [rule.id, rule]));

export function rulesForTajweedHtml(value: string) {
  const ids = Array.from(value.matchAll(/<tajweed class=["']?([a-z_]+)["']?>/g), (match) => match[1] as TajweedRuleId);
  return Array.from(new Set(ids)).map((id) => TAJWEED_RULE_MAP.get(id)).filter((rule): rule is TajweedRule => Boolean(rule));
}
