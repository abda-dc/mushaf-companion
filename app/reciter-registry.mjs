/**
 * Canonical Reciter Registry for Mushaf Companion (M10).
 *
 * Single source of truth for all verified Hafs reciters, groupings,
 * scopes, providers, and aliases.
 */

export const DEFAULT_RECITER_ID = "alafasy";

export const DEFAULT_RECITERS = Object.freeze([
  {
    "id": "alafasy",
    "name": "Mishary Rashid Alafasy",
    "initials": "MA",
    "group": "default",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "quran-foundation",
    "audioPath": "Alafasy",
    "bitrate": "128kbps",
    "source": "Quran Foundation recitation files",
    "sourceUrl": "https://verses.quran.foundation/Alafasy/mp3/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mishary Rashid Alafasy",
      "Mishary Alafasy",
      "Alafasy",
      "Mishary",
      "Alafasi",
      "El-Afasy"
    ]
  },
  {
    "id": "abdulbasit",
    "name": "Abdul Basit Abdus Samad",
    "initials": "AB",
    "group": "default",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "quran-foundation",
    "audioPath": "AbdulBaset/Murattal",
    "bitrate": "192kbps",
    "source": "Quran Foundation recitation files",
    "sourceUrl": "https://verses.quran.foundation/AbdulBaset/Murattal/mp3/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdul Basit Abdus Samad",
      "Abdul Baset",
      "Abdus Samad",
      "Abdelbasset",
      "Abdelsamad"
    ]
  },
  {
    "id": "aymen",
    "name": "Dr. Aymen Suwayed",
    "initials": "AS",
    "group": "default",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Ayman_Sowaid_64kbps",
    "bitrate": "64kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Ayman_Sowaid_64kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Dr. Aymen Suwayed",
      "Ayman Sowaid",
      "Ayman Suwaid",
      "Suwayed",
      "Dr. Ayman"
    ]
  },
  {
    "id": "minshawi-kids",
    "name": "Minshawi Kids Repeat",
    "initials": "MK",
    "group": "default",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "muallim",
    "provider": "everyayah",
    "audioPath": "Minshawy_Teacher_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Minshawy_Teacher_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Minshawi Kids Repeat",
      "Menshawi Teacher",
      "Minshawi Repeat",
      "Minshawi Muallim"
    ]
  },
  {
    "id": "muhammad-ayyub",
    "name": "Sheikh Muhammad Ayyub",
    "initials": "MY",
    "group": "default",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Muhammad_Ayyoub_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Muhammad_Ayyoub_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Sheikh Muhammad Ayyub",
      "Mohammad Ayyoub",
      "Muhammad Ayyub",
      "Ayyoub",
      "Muhammad Ayoub"
    ]
  },
  {
    "id": "abdul-rashid-sufi",
    "name": "Sheikh Abdul Rashid Ali Sufi",
    "initials": "RS",
    "group": "default",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "kalamalah",
    "audioPath": "abdul-rashid-sofi/murattal",
    "bitrate": "128kbps",
    "source": "Kalamalah audio library",
    "sourceUrl": "https://api.kalamalah.com/api/abdul-rashid-sofi/murattal/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Sheikh Abdul Rashid Ali Sufi",
      "Abdulrasheed Soufi",
      "Rashid Sofi",
      "Abdul Rashid Sufi",
      "Sufi",
      "Sofi"
    ]
  }
]);

export const OTHER_RECITERS = Object.freeze([
  {
    "id": "saad",
    "name": "Saad Al-Ghamdi",
    "initials": "SG",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Ghamadi_40kbps",
    "bitrate": "40kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Ghamadi_40kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Saad Al-Ghamdi",
      "Saad Al Ghamadi",
      "Ghamdi",
      "El Ghamidi",
      "Ghamidi"
    ]
  },
  {
    "id": "abdulbasit-mujawwad",
    "name": "Abdul Basit Abdus Samad (Mujawwad)",
    "initials": "AB",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "mujawwad",
    "provider": "everyayah",
    "audioPath": "Abdul_Basit_Mujawwad_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Abdul_Basit_Mujawwad_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdul Basit Abdus Samad (Mujawwad)",
      "Abdul Baset Mujawwad",
      "Abdus Samad Mujawwad",
      "Abdelbasset"
    ]
  },
  {
    "id": "abdullah-basfar",
    "name": "Abdullah Basfar",
    "initials": "AB",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Abdullah_Basfar_192kbps",
    "bitrate": "192kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Abdullah_Basfar_192kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdullah Basfar",
      "Basfar",
      "Abdallah Basfar"
    ]
  },
  {
    "id": "sudais",
    "name": "Abdur-Rahman As-Sudais",
    "initials": "AS",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Abdurrahmaan_As-Sudais_192kbps",
    "bitrate": "192kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdur-Rahman As-Sudais",
      "Abdurrahman Al-Sudais",
      "Soudais",
      "Alsudaes",
      "Al-Sudais",
      "As-Sudays",
      "Sudais"
    ]
  },
  {
    "id": "shatri",
    "name": "Abu Bakr Ash-Shatri",
    "initials": "AS",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Abu_Bakr_Ash-Shaatree_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abu Bakr Ash-Shatri",
      "Abu Bakr Al Shatri",
      "Shaatree",
      "Shatry",
      "El Shatri",
      "Shatri"
    ]
  },
  {
    "id": "ajmi",
    "name": "Ahmed Ibn Ali Al-Ajmi",
    "initials": "AA",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "ahmed_ibn_ali_al_ajamy_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/ahmed_ibn_ali_al_ajamy_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ahmed Ibn Ali Al-Ajmi",
      "Ahmed Al-Ajamy",
      "Al-Agamy",
      "Ahmed El-Agmy",
      "Ajmi",
      "Ajamy"
    ]
  },
  {
    "id": "ahmed-neana",
    "name": "Ahmed Neana",
    "initials": "AN",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "mujawwad",
    "provider": "everyayah",
    "audioPath": "Ahmed_Neana_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Ahmed_Neana_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ahmed Neana",
      "Ahmad Naina",
      "Ahmed Neinaa",
      "Dr. Ahmed Naina",
      "Neana"
    ]
  },
  {
    "id": "akram-alaqmi",
    "name": "Akram Al-Alaqmi",
    "initials": "AA",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Akram_AlAlaqimy_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Akram_AlAlaqimy_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Akram Al-Alaqmi",
      "Akram Al-Alaqimy",
      "Alaqmy",
      "Alaqmi"
    ]
  },
  {
    "id": "ali-jaber",
    "name": "Ali Jaber",
    "initials": "AJ",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Ali_Jaber_64kbps",
    "bitrate": "64kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Ali_Jaber_64kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ali Jaber",
      "Ali Abdullah Jaber",
      "Sheikh Ali Jaber",
      "Jaber"
    ]
  },
  {
    "id": "ali-hajjaj-suesy",
    "name": "Ali Hajjaj Al-Suesy",
    "initials": "AS",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "mujawwad",
    "provider": "everyayah",
    "audioPath": "Ali_Hajjaj_AlSuesy_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Ali_Hajjaj_AlSuesy_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ali Hajjaj Al-Suesy",
      "Ali Hajjaj Suwaisi",
      "Al-Suesy",
      "Souesy",
      "Suwaisi"
    ]
  },
  {
    "id": "aziz-alili",
    "name": "Aziz Alili",
    "initials": "AA",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "aziz_alili_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/aziz_alili_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Aziz Alili",
      "Alili"
    ]
  },
  {
    "id": "fares-abbad",
    "name": "Fares Abbad",
    "initials": "FA",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Fares_Abbad_64kbps",
    "bitrate": "64kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Fares_Abbad_64kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Fares Abbad",
      "Faris Abbad",
      "Fares Abad",
      "Abbad"
    ]
  },
  {
    "id": "hani-rifai",
    "name": "Hani Ar-Rifai",
    "initials": "HR",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Hani_Rifai_192kbps",
    "bitrate": "192kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Hani_Rifai_192kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Hani Ar-Rifai",
      "Hany Ar-Rifai",
      "Hani Al-Rifai",
      "Rifa'i",
      "Rifai"
    ]
  },
  {
    "id": "hudhaify",
    "name": "Ali Al-Hudhaifi",
    "initials": "AH",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Hudhaify_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Hudhaify_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ali Al-Hudhaifi",
      "Ali Al-Huthaifi",
      "Hudhaifi",
      "Hothaify",
      "Huthaify"
    ]
  },
  {
    "id": "husary",
    "name": "Mahmoud Khalil Al-Husary",
    "initials": "MH",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Husary_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Husary_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mahmoud Khalil Al-Husary",
      "Mahmoud Khalil Al-Hussary",
      "Al-Hosary",
      "Hussary",
      "Hussari",
      "Hosary",
      "Husary"
    ]
  },
  {
    "id": "husary-muallim",
    "name": "Mahmoud Khalil Al-Husary (Muallim)",
    "initials": "MH",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "muallim",
    "provider": "everyayah",
    "audioPath": "Husary_Muallim_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Husary_Muallim_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mahmoud Khalil Al-Husary (Muallim)",
      "Hussary Muallim",
      "Husary Teacher",
      "Muallim",
      "Hosary Muallim"
    ]
  },
  {
    "id": "husary-mujawwad",
    "name": "Mahmoud Khalil Al-Husary (Mujawwad)",
    "initials": "MH",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "mujawwad",
    "provider": "everyayah",
    "audioPath": "Husary_128kbps_Mujawwad",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Husary_128kbps_Mujawwad/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mahmoud Khalil Al-Husary (Mujawwad)",
      "Hussary Mujawwad",
      "Al-Hosary Mujawwad",
      "Hosary Mujawwad"
    ]
  },
  {
    "id": "ibrahim-akhdar",
    "name": "Ibrahim Al-Akhdar",
    "initials": "IA",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Ibrahim_Akhdar_32kbps",
    "bitrate": "32kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Ibrahim_Akhdar_32kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ibrahim Al-Akhdar",
      "Ibrahim Al-Akdar",
      "Al-Akhdhar",
      "Akhdar",
      "Akdar"
    ]
  },
  {
    "id": "juhany",
    "name": "Abdullah Awwad Al-Juhany",
    "initials": "AJ",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Abdullaah_3awwaad_Al-Juhaynee_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Abdullaah_3awwaad_Al-Juhaynee_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdullah Awwad Al-Juhany",
      "Abdullah Al-Juhani",
      "Johany",
      "Al-Juhaynee",
      "Juhany"
    ]
  },
  {
    "id": "karim-mansoori",
    "name": "Karim Mansoori",
    "initials": "KM",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "mujawwad",
    "provider": "everyayah",
    "audioPath": "Karim_Mansoori_40kbps",
    "bitrate": "40kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Karim_Mansoori_40kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Karim Mansoori",
      "Karim Mansouri",
      "Mansoory",
      "Mansoori"
    ]
  },
  {
    "id": "khalifa-tunaiji",
    "name": "Khalifa Al-Tunaiji",
    "initials": "KT",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "khalefa_al_tunaiji_64kbps",
    "bitrate": "64kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/khalefa_al_tunaiji_64kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Khalifa Al-Tunaiji",
      "Khalifah Al-Tonaeji",
      "Al-Tunaijee",
      "Tunaiji"
    ]
  },
  {
    "id": "khalid-qahtani",
    "name": "Khalid Abdullah Al-Qahtani",
    "initials": "KQ",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Khaalid_Abdullaah_al-Qahtaanee_192kbps",
    "bitrate": "192kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Khaalid_Abdullaah_al-Qahtaanee_192kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Khalid Abdullah Al-Qahtani",
      "Khaled Al-Qahtani",
      "Khaalid Qahtani",
      "Qahtani"
    ]
  },
  {
    "id": "maher-muaiqly",
    "name": "Maher Al-Muaiqly",
    "initials": "MM",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "MaherAlMuaiqly128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/MaherAlMuaiqly128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Maher Al-Muaiqly",
      "Maher Al-Meaqli",
      "Al-Muaiqly",
      "Al-Moaiqly",
      "Muaiqly"
    ]
  },
  {
    "id": "mahmoud-ali-banna",
    "name": "Mahmoud Ali Al-Banna",
    "initials": "MB",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "mahmoud_ali_al_banna_32kbps",
    "bitrate": "32kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/mahmoud_ali_al_banna_32kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mahmoud Ali Al-Banna",
      "Mahmoud Ali El-Banna",
      "Al Banna",
      "Banna"
    ]
  },
  {
    "id": "matroud",
    "name": "Abdullah Matroud",
    "initials": "AM",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Abdullah_Matroud_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Abdullah_Matroud_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdullah Matroud",
      "Abdullah Matrood",
      "Al-Matrood",
      "Matrood"
    ]
  },
  {
    "id": "minshawi",
    "name": "Muhammad Siddiq Al-Minshawi",
    "initials": "MM",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Minshawy_Murattal_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Minshawy_Murattal_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Muhammad Siddiq Al-Minshawi",
      "Mohamed Siddiq El-Minshawi",
      "Menshawy",
      "Minshawy",
      "Minshawi"
    ]
  },
  {
    "id": "minshawi-mujawwad",
    "name": "Muhammad Siddiq Al-Minshawi (Mujawwad)",
    "initials": "MM",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "mujawwad",
    "provider": "everyayah",
    "audioPath": "Minshawy_Mujawwad_192kbps",
    "bitrate": "192kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Minshawy_Mujawwad_192kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Muhammad Siddiq Al-Minshawi (Mujawwad)",
      "Menshawy Mujawwad",
      "Minshawy Mujawwad",
      "Minshawi Mujawwad"
    ]
  },
  {
    "id": "tablawi",
    "name": "Mohammad Al-Tablawi",
    "initials": "MT",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Mohammad_al_Tablaway_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Mohammad_al_Tablaway_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mohammad Al-Tablawi",
      "Mohammad Al-Tablaway",
      "Tablaway",
      "Al-Tablawi",
      "Tablawi"
    ]
  },
  {
    "id": "muhammad-abdulkareem",
    "name": "Muhammad AbdulKareem",
    "initials": "MA",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Muhammad_AbdulKareem_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Muhammad_AbdulKareem_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Muhammad AbdulKareem",
      "Mohammad Abdul Karim",
      "Abdulkareem",
      "Abdul Karim"
    ]
  },
  {
    "id": "muhammad-jibreel",
    "name": "Muhammad Jibreel",
    "initials": "MJ",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Muhammad_Jibreel_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Muhammad_Jibreel_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Muhammad Jibreel",
      "Mohammed Jibril",
      "Jebril",
      "Jibreel"
    ]
  },
  {
    "id": "muhsin-qasim",
    "name": "Muhsin Al-Qasim",
    "initials": "MQ",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Muhsin_Al_Qasim_192kbps",
    "bitrate": "192kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Muhsin_Al_Qasim_192kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Muhsin Al-Qasim",
      "Mohsen Al-Qasim",
      "Al-Qaseem",
      "Qasim"
    ]
  },
  {
    "id": "nabil-rifai",
    "name": "Nabil Ar-Rifai",
    "initials": "NR",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Nabil_Rifa3i_48kbps",
    "bitrate": "48kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Nabil_Rifa3i_48kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Nabil Ar-Rifai",
      "Nabeel Ar-Rifai",
      "Nabil Al-Rifai",
      "Rifa3i",
      "Nabil Rifai"
    ]
  },
  {
    "id": "nasser-qatami",
    "name": "Nasser Al-Qatami",
    "initials": "NQ",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Nasser_Alqatami_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Nasser_Alqatami_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Nasser Al-Qatami",
      "Naser Al-Qatami",
      "Alqatami",
      "Qatami"
    ]
  },
  {
    "id": "parhizgar",
    "name": "Shahriar Parhizgar",
    "initials": "SP",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Parhizgar_48kbps",
    "bitrate": "48kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Parhizgar_48kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Shahriar Parhizgar",
      "Shahryar Parhizgar",
      "Parhizkar",
      "Shahriyar",
      "Parhizgar"
    ]
  },
  {
    "id": "sahl-yassin",
    "name": "Sahl Yassin",
    "initials": "SY",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Sahl_Yassin_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Sahl_Yassin_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Sahl Yassin",
      "Sahl Yaseen",
      "Sahel Yassin",
      "Yassin"
    ]
  },
  {
    "id": "salah-bukhatir",
    "name": "Salah Bukhatir",
    "initials": "SB",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Salaah_AbdulRahman_Bukhatir_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Salaah_AbdulRahman_Bukhatir_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Salah Bukhatir",
      "Salah Bu Khater",
      "Salaah Bukhatir",
      "Bukhatir"
    ]
  },
  {
    "id": "salah-budair",
    "name": "Salah Al-Budair",
    "initials": "SB",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Salah_Al_Budair_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Salah_Al_Budair_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Salah Al-Budair",
      "Salah Al-Bedair",
      "Al-Budayr",
      "Budair"
    ]
  },
  {
    "id": "saud-shuraym",
    "name": "Saud Ash-Shuraym",
    "initials": "SS",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Saood_ash-Shuraym_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Saood_ash-Shuraym_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Saud Ash-Shuraym",
      "Saoud Ash-Shuraim",
      "Al-Shuraim",
      "Shuraim",
      "Shuraym"
    ]
  },
  {
    "id": "yaser-salamah",
    "name": "Yaser Salamah",
    "initials": "YS",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Yaser_Salamah_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Yaser_Salamah_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Yaser Salamah",
      "Yasser Salama",
      "Yasser Salamah",
      "Salamah"
    ]
  },
  {
    "id": "yasser-dussary",
    "name": "Yasser Ad-Dussary",
    "initials": "YD",
    "group": "other",
    "scope": "ayah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "everyayah",
    "audioPath": "Yasser_Ad-Dussary_128kbps",
    "bitrate": "128kbps",
    "source": "EveryAyah recitation library",
    "sourceUrl": "https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Yasser Ad-Dussary",
      "Yasser Al-Dosari",
      "Al-Dawsari",
      "Al-Dossari",
      "Dussary",
      "Dosari"
    ]
  },
  {
    "id": "akram-alalaqmi",
    "name": "Akram Alalaqmi",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server9.mp3quran.net/akrm/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/akrm",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Akram Alalaqmi",
      "Alalaqmi",
      "Akram"
    ]
  },
  {
    "id": "mohammed-al-muhasny",
    "name": "Mohammed Al-Muhasny",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server11.mp3quran.net/mhsny/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/mhsny",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mohammed Al-Muhasny",
      "Al-Muhasny",
      "Mohammed"
    ]
  },
  {
    "id": "mahmoud-khalil-al-hussary",
    "name": "Mahmoud Khalil Al-Hussary",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server13.mp3quran.net/husr/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/husr",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mahmoud Khalil Al-Hussary",
      "Al-Hussary",
      "Mahmoud"
    ]
  },
  {
    "id": "idrees-abkr",
    "name": "Idrees Abkr",
    "initials": "IA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/abkr/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/abkr",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Idrees Abkr",
      "Abkr",
      "Idrees"
    ]
  },
  {
    "id": "mahmoud-ali-albanna",
    "name": "Mahmoud Ali  Albanna",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/bna/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/bna",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mahmoud Ali  Albanna",
      "Albanna",
      "Mahmoud"
    ]
  },
  {
    "id": "mishary-alafasi",
    "name": "Mishary Alafasi",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/afs/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/afs",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mishary Alafasi",
      "Alafasi",
      "Mishary"
    ]
  },
  {
    "id": "mustafa-ismail",
    "name": "Mustafa Ismail",
    "initials": "MI",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/mustafa/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/mustafa",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mustafa Ismail",
      "Ismail",
      "Mustafa"
    ]
  },
  {
    "id": "mustafa-al-lahoni",
    "name": "Mustafa Al-Lahoni",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/lahoni/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/lahoni",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mustafa Al-Lahoni",
      "Al-Lahoni",
      "Mustafa"
    ]
  },
  {
    "id": "mustafa-raad-alazawy",
    "name": "Mustafa raad Alazawy",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/ra3ad/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/ra3ad",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mustafa raad Alazawy",
      "Alazawy",
      "Mustafa"
    ]
  },
  {
    "id": "muftah-alsaltany",
    "name": "Muftah Alsaltany",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server14.mp3quran.net/muftah_sultany/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/muftah_sultany",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Muftah Alsaltany",
      "Alsaltany",
      "Muftah"
    ]
  },
  {
    "id": "alzain-mohammad-ahmad",
    "name": "Alzain Mohammad Ahmad",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server9.mp3quran.net/alzain/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/alzain",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Alzain Mohammad Ahmad",
      "Ahmad",
      "Alzain"
    ]
  },
  {
    "id": "abdulelah-bin-aoun",
    "name": "Abdulelah bin Aoun",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/a_binaoun/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/a_binaoun",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdulelah bin Aoun",
      "Aoun",
      "Abdulelah"
    ]
  },
  {
    "id": "majed-al-zamil",
    "name": "Majed Al-Zamil",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server9.mp3quran.net/zaml/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/zaml",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Majed Al-Zamil",
      "Al-Zamil",
      "Majed"
    ]
  },
  {
    "id": "maher-shakhashero",
    "name": "Maher Shakhashero",
    "initials": "MS",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server10.mp3quran.net/shaksh/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/shaksh",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Maher Shakhashero",
      "Shakhashero",
      "Maher"
    ]
  },
  {
    "id": "khalid-almohana",
    "name": "Khalid Almohana",
    "initials": "KA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server11.mp3quran.net/mohna/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/mohna",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Khalid Almohana",
      "Almohana",
      "Khalid"
    ]
  },
  {
    "id": "adel-al-khalbany",
    "name": "Adel Al-Khalbany",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/a_klb/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/a_klb",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Adel Al-Khalbany",
      "Al-Khalbany",
      "Adel"
    ]
  },
  {
    "id": "mousa-bilal",
    "name": "Mousa Bilal",
    "initials": "MB",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server11.mp3quran.net/bilal/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/bilal",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mousa Bilal",
      "Bilal",
      "Mousa"
    ]
  },
  {
    "id": "hatem-fareed-alwaer",
    "name": "Hatem Fareed Alwaer",
    "initials": "HA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server11.mp3quran.net/hatem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/hatem",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Hatem Fareed Alwaer",
      "Alwaer",
      "Hatem"
    ]
  },
  {
    "id": "ibrahim-aljormy",
    "name": "Ibrahim Aljormy",
    "initials": "IA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server11.mp3quran.net/jormy/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/jormy",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ibrahim Aljormy",
      "Aljormy",
      "Ibrahim"
    ]
  },
  {
    "id": "mahmood-al-rifai",
    "name": "Mahmood Al rifai",
    "initials": "MR",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server11.mp3quran.net/mrifai/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/mrifai",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mahmood Al rifai",
      "rifai",
      "Mahmood"
    ]
  },
  {
    "id": "tawfeeq-as-sayegh",
    "name": "Tawfeeq As-Sayegh",
    "initials": "TA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/twfeeq/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/twfeeq",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Tawfeeq As-Sayegh",
      "As-Sayegh",
      "Tawfeeq"
    ]
  },
  {
    "id": "ibrahim-aldosari",
    "name": "Ibrahim Aldosari",
    "initials": "IA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server10.mp3quran.net/ibrahim_dosri/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/ibrahim_dosri",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ibrahim Aldosari",
      "Aldosari",
      "Ibrahim"
    ]
  },
  {
    "id": "jamal-shaker-abdullah",
    "name": "Jamal Shaker Abdullah",
    "initials": "JA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/jamal/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/jamal",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Jamal Shaker Abdullah",
      "Abdullah",
      "Jamal"
    ]
  },
  {
    "id": "jamaan-alosaimi",
    "name": "Jamaan Alosaimi",
    "initials": "JA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/jaman/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/jaman",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Jamaan Alosaimi",
      "Alosaimi",
      "Jamaan"
    ]
  },
  {
    "id": "yousef-bin-noah-ahmad",
    "name": "Yousef Bin Noah Ahmad",
    "initials": "YA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/noah/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/noah",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Yousef Bin Noah Ahmad",
      "Ahmad",
      "Yousef"
    ]
  },
  {
    "id": "moeedh-alharthi",
    "name": "Moeedh Alharthi",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/harthi/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/harthi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Moeedh Alharthi",
      "Alharthi",
      "Moeedh"
    ]
  },
  {
    "id": "mohammad-rashad-alshareef",
    "name": "Mohammad Rashad Alshareef",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server10.mp3quran.net/rashad/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/rashad",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mohammad Rashad Alshareef",
      "Alshareef",
      "Mohammad"
    ]
  },
  {
    "id": "khalid-al-jileel",
    "name": "Khalid Al-Jileel",
    "initials": "KA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server10.mp3quran.net/jleel/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/jleel",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Khalid Al-Jileel",
      "Al-Jileel",
      "Khalid"
    ]
  },
  {
    "id": "ahmed-al-trabulsi",
    "name": "Ahmed Al-trabulsi",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server10.mp3quran.net/trabulsi/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/trabulsi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ahmed Al-trabulsi",
      "Al-trabulsi",
      "Ahmed"
    ]
  },
  {
    "id": "abdullah-alqarafi",
    "name": "Abdullah Alqarafi",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/a_alqrafi/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/a_alqrafi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdullah Alqarafi",
      "Alqarafi",
      "Abdullah"
    ]
  },
  {
    "id": "abdulbadi-ghailan",
    "name": "Abdulbadi Ghailan",
    "initials": "AG",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/A-Ghailan/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/A-Ghailan",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdulbadi Ghailan",
      "Ghailan",
      "Abdulbadi"
    ]
  },
  {
    "id": "muhammad-burhaji",
    "name": "Muhammad Burhaji",
    "initials": "MB",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/M_Burhaji/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/M_Burhaji",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Muhammad Burhaji",
      "Burhaji",
      "Muhammad"
    ]
  },
  {
    "id": "yusuf-alaidroos",
    "name": "Yusuf ALaidroos",
    "initials": "YA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/Y_ALaidroos/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/Y_ALaidroos",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Yusuf ALaidroos",
      "ALaidroos",
      "Yusuf"
    ]
  },
  {
    "id": "hassan-aldaghriri",
    "name": "Hassan Aldaghriri",
    "initials": "HA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/H-Aldaghriri/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/H-Aldaghriri",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Hassan Aldaghriri",
      "Aldaghriri",
      "Hassan"
    ]
  },
  {
    "id": "muhammad-al-faqih",
    "name": "Muhammad Al Faqih",
    "initials": "MF",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/M_Alfaqih/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/M_Alfaqih",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Muhammad Al Faqih",
      "Faqih",
      "Muhammad"
    ]
  },
  {
    "id": "junaid-adam-abdullah",
    "name": "Junaid Adam Abdullah",
    "initials": "JA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/J-Abdullah/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/J-Abdullah",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Junaid Adam Abdullah",
      "Abdullah",
      "Junaid"
    ]
  },
  {
    "id": "khalid-alziyadi",
    "name": "Khalid Alziyadi",
    "initials": "KA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/K-Alzadi/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/K-Alzadi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Khalid Alziyadi",
      "Alziyadi",
      "Khalid"
    ]
  },
  {
    "id": "abdul-rahman-bin-abdul-razzaq-al-badr",
    "name": "Abdul Rahman bin Abdul Razzaq Al Badr",
    "initials": "AB",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/A-AlBadr/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/A-AlBadr",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdul Rahman bin Abdul Razzaq Al Badr",
      "Badr",
      "Abdul"
    ]
  },
  {
    "id": "alijon-qori",
    "name": "Alijon Qori",
    "initials": "AQ",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/Alijon/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/Alijon",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Alijon Qori",
      "Qori",
      "Alijon"
    ]
  },
  {
    "id": "mohammed-al-zubaidi",
    "name": "Mohammed Al-Zubaidi",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/M-AlZubaidi/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/M-AlZubaidi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mohammed Al-Zubaidi",
      "Al-Zubaidi",
      "Mohammed"
    ]
  },
  {
    "id": "asim-al-luhaidan",
    "name": "Asim Al-Luhaidan",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server7.mp3quran.net/asim/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/asim",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Asim Al-Luhaidan",
      "Al-Luhaidan",
      "Asim"
    ]
  },
  {
    "id": "mahmoud-harfoush",
    "name": "Mahmoud Harfoush",
    "initials": "MH",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/M-Harfoush/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/M-Harfoush",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mahmoud Harfoush",
      "Harfoush",
      "Mahmoud"
    ]
  },
  {
    "id": "bandar-balilah",
    "name": "Bandar Balilah",
    "initials": "BB",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/balilah/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/balilah",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Bandar Balilah",
      "Balilah",
      "Bandar"
    ]
  },
  {
    "id": "wadeea-al-yamani",
    "name": "Wadeea Al-Yamani",
    "initials": "WA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/wdee3/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/wdee3",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Wadeea Al-Yamani",
      "Al-Yamani",
      "Wadeea"
    ]
  },
  {
    "id": "khalid-abdulkafi",
    "name": "Khalid Abdulkafi",
    "initials": "KA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server11.mp3quran.net/kafi/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/kafi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Khalid Abdulkafi",
      "Abdulkafi",
      "Khalid"
    ]
  },
  {
    "id": "raad-al-kurdi",
    "name": "Raad Al Kurdi",
    "initials": "RK",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/kurdi/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/kurdi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Raad Al Kurdi",
      "Kurdi",
      "Raad"
    ]
  },
  {
    "id": "abdulrahman-aloosi",
    "name": "Abdulrahman Aloosi",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/aloosi/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/aloosi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdulrahman Aloosi",
      "Aloosi",
      "Abdulrahman"
    ]
  },
  {
    "id": "mohammad-khalil-al-qari",
    "name": "Mohammad Khalil Al-Qari",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/m_qari/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/m_qari",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mohammad Khalil Al-Qari",
      "Al-Qari",
      "Mohammad"
    ]
  },
  {
    "id": "rami-aldeais",
    "name": "Rami Aldeais",
    "initials": "RA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/rami/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/rami",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Rami Aldeais",
      "Aldeais",
      "Rami"
    ]
  },
  {
    "id": "abdulrahman-al-majed",
    "name": "Abdulrahman Al-Majed",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server10.mp3quran.net/a_majed/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/a_majed",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdulrahman Al-Majed",
      "Al-Majed",
      "Abdulrahman"
    ]
  },
  {
    "id": "abdullah-al-mousa",
    "name": "Abdullah Al-Mousa",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server14.mp3quran.net/mousa/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/mousa",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdullah Al-Mousa",
      "Al-Mousa",
      "Abdullah"
    ]
  },
  {
    "id": "abdullah-al-khalaf",
    "name": "Abdullah Al-Khalaf",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server14.mp3quran.net/khalf/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/khalf",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdullah Al-Khalaf",
      "Al-Khalaf",
      "Abdullah"
    ]
  },
  {
    "id": "mansour-al-salemi",
    "name": "Mansour Al-Salemi",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server14.mp3quran.net/mansor/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/mansor",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mansour Al-Salemi",
      "Al-Salemi",
      "Mansour"
    ]
  },
  {
    "id": "nasser-alosfor",
    "name": "Nasser Alosfor",
    "initials": "NA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server14.mp3quran.net/alosfor/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/alosfor",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Nasser Alosfor",
      "Alosfor",
      "Nasser"
    ]
  },
  {
    "id": "dawood-hamza",
    "name": "Dawood Hamza",
    "initials": "DH",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server9.mp3quran.net/hamza/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/hamza",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Dawood Hamza",
      "Hamza",
      "Dawood"
    ]
  },
  {
    "id": "mohammad-albukheet",
    "name": "Mohammad Albukheet",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server14.mp3quran.net/bukheet/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/bukheet",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mohammad Albukheet",
      "Albukheet",
      "Mohammad"
    ]
  },
  {
    "id": "nasser-almajed",
    "name": "Nasser Almajed",
    "initials": "NA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server14.mp3quran.net/nasser_almajed/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/nasser_almajed",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Nasser Almajed",
      "Almajed",
      "Nasser"
    ]
  },
  {
    "id": "ahmed-al-swailem",
    "name": "Ahmed Al-Swailem",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server14.mp3quran.net/swlim/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/swlim",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ahmed Al-Swailem",
      "Al-Swailem",
      "Ahmed"
    ]
  },
  {
    "id": "bader-alturki",
    "name": "Bader Alturki",
    "initials": "BA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server10.mp3quran.net/bader/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/bader",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Bader Alturki",
      "Alturki",
      "Bader"
    ]
  },
  {
    "id": "ahmad-shaheen",
    "name": "Ahmad Shaheen",
    "initials": "AS",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/shaheen/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/shaheen",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ahmad Shaheen",
      "Shaheen",
      "Ahmad"
    ]
  },
  {
    "id": "saad-almqren",
    "name": "Saad Almqren",
    "initials": "SA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/saad/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/saad",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Saad Almqren",
      "Almqren",
      "Saad"
    ]
  },
  {
    "id": "ahmad-al-nufais",
    "name": "Ahmad Al Nufais",
    "initials": "AN",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/nufais/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/nufais",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ahmad Al Nufais",
      "Nufais",
      "Ahmad"
    ]
  },
  {
    "id": "omar-al-darweez",
    "name": "Omar Al Darweez",
    "initials": "OD",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/darweez/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/darweez",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Omar Al Darweez",
      "Darweez",
      "Omar"
    ]
  },
  {
    "id": "ahmad-deban",
    "name": "Ahmad Deban",
    "initials": "AD",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/deban/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/deban",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ahmad Deban",
      "Deban",
      "Ahmad"
    ]
  },
  {
    "id": "abdullah-kamel",
    "name": "Abdullah Kamel",
    "initials": "AK",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/kamel/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/kamel",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdullah Kamel",
      "Kamel",
      "Abdullah"
    ]
  },
  {
    "id": "peshawa-qadr-al-kurdi",
    "name": "Peshawa Qadr Al-Kurdi",
    "initials": "PA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/peshawa/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/peshawa",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Peshawa Qadr Al-Kurdi",
      "Al-Kurdi",
      "Peshawa"
    ]
  },
  {
    "id": "nathier-almalki",
    "name": "Nathier Almalki",
    "initials": "NA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net//nathier/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Nathier Almalki",
      "Almalki",
      "Nathier"
    ]
  },
  {
    "id": "haitham-aldukhain",
    "name": "Haitham Aldukhain",
    "initials": "HA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/h_dukhain",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Haitham Aldukhain",
      "Aldukhain",
      "Haitham"
    ]
  },
  {
    "id": "mahmoud-abdul-hakam",
    "name": "Mahmoud Abdul Hakam",
    "initials": "MH",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/m_abdelhakam/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/m_abdelhakam",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mahmoud Abdul Hakam",
      "Hakam",
      "Mahmoud"
    ]
  },
  {
    "id": "ahmad-issa-al-maasaraawi",
    "name": "Ahmad Issa Al Maasaraawi",
    "initials": "AM",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/a_maasaraawi/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/a_maasaraawi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ahmad Issa Al Maasaraawi",
      "Maasaraawi",
      "Ahmad"
    ]
  },
  {
    "id": "hashim-abu-dalal",
    "name": "Hashim Abu Dalal",
    "initials": "HD",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/h_abudalal/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/h_abudalal",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Hashim Abu Dalal",
      "Dalal",
      "Hashim"
    ]
  },
  {
    "id": "fouad-alkhamery",
    "name": "Fouad Alkhamery",
    "initials": "FA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/f_khamery/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/f_khamery",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Fouad Alkhamery",
      "Alkhamery",
      "Fouad"
    ]
  },
  {
    "id": "sayed-ahmad-hashemi",
    "name": "Sayed Ahmad Hashemi",
    "initials": "SH",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/s_hashemi/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/s_hashemi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Sayed Ahmad Hashemi",
      "Hashemi",
      "Sayed"
    ]
  },
  {
    "id": "khalid-mohammadi",
    "name": "Khalid Mohammadi",
    "initials": "KM",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/kh_mohammadi/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/kh_mohammadi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Khalid Mohammadi",
      "Mohammadi",
      "Khalid"
    ]
  },
  {
    "id": "mal-allah-abdulrhman-aljaber",
    "name": "Mal-Allah Abdulrhman Aljaber",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/mal-allah_jaber/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/mal-allah_jaber",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mal-Allah Abdulrhman Aljaber",
      "Aljaber",
      "Mal-Allah"
    ]
  },
  {
    "id": "salman-alsadeiq",
    "name": "Salman Alsadeiq",
    "initials": "SA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/s_sadeiq/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/s_sadeiq",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Salman Alsadeiq",
      "Alsadeiq",
      "Salman"
    ]
  },
  {
    "id": "hasan-saleh",
    "name": "Hasan Saleh",
    "initials": "HS",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/h_saleh/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/h_saleh",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Hasan Saleh",
      "Saleh",
      "Hasan"
    ]
  },
  {
    "id": "abdulrahman-alshahhat",
    "name": "Abdulrahman Alshahhat",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/a_alshahhat/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/a_alshahhat",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdulrahman Alshahhat",
      "Alshahhat",
      "Abdulrahman"
    ]
  },
  {
    "id": "issa-omar-sanankoua",
    "name": "Issa Omar Sanankoua",
    "initials": "IS",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/i_sanankoua/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/i_sanankoua",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Issa Omar Sanankoua",
      "Sanankoua",
      "Issa"
    ]
  },
  {
    "id": "saleh-alquraishi",
    "name": "Saleh Alquraishi",
    "initials": "SA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/s_alquraishi/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/s_alquraishi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Saleh Alquraishi",
      "Alquraishi",
      "Saleh"
    ]
  },
  {
    "id": "ibrahim-al-asiri",
    "name": "Ibrahim Al-Asiri",
    "initials": "IA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/3siri/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/3siri",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ibrahim Al-Asiri",
      "Al-Asiri",
      "Ibrahim"
    ]
  },
  {
    "id": "saleh-alshamrani",
    "name": "Saleh Alshamrani",
    "initials": "SA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/shamrani/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/shamrani",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Saleh Alshamrani",
      "Alshamrani",
      "Saleh"
    ]
  },
  {
    "id": "faisal-al-hajry",
    "name": "Faisal Al-Hajry",
    "initials": "FA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/f_hajry/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/f_hajry",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Faisal Al-Hajry",
      "Al-Hajry",
      "Faisal"
    ]
  },
  {
    "id": "anas-alemadi",
    "name": "Anas Alemadi",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/a_alemadi/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/a_alemadi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Anas Alemadi",
      "Alemadi",
      "Anas"
    ]
  },
  {
    "id": "abdulkareem-alhazmi",
    "name": "Abdulkareem Alhazmi",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/a_alhazmi/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/a_alhazmi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdulkareem Alhazmi",
      "Alhazmi",
      "Abdulkareem"
    ]
  },
  {
    "id": "zaki-daghistani",
    "name": "Zaki Daghistani",
    "initials": "ZD",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server9.mp3quran.net/zaki/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/zaki",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Zaki Daghistani",
      "Daghistani",
      "Zaki"
    ]
  },
  {
    "id": "sayeed-ramadan",
    "name": "Sayeed Ramadan",
    "initials": "SR",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server12.mp3quran.net/sayed/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/sayed",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Sayeed Ramadan",
      "Ramadan",
      "Sayeed"
    ]
  },
  {
    "id": "shirazad-taher",
    "name": "Shirazad Taher",
    "initials": "ST",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server12.mp3quran.net/taher/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/taher",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Shirazad Taher",
      "Taher",
      "Shirazad"
    ]
  },
  {
    "id": "saber-abdulhakm",
    "name": "Saber Abdulhakm",
    "initials": "SA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server12.mp3quran.net/hkm/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/hkm",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Saber Abdulhakm",
      "Abdulhakm",
      "Saber"
    ]
  },
  {
    "id": "saleh-alsahood",
    "name": "Saleh Alsahood",
    "initials": "SA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/sahood/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/sahood",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Saleh Alsahood",
      "Alsahood",
      "Saleh"
    ]
  },
  {
    "id": "saleh-al-habdan",
    "name": "Saleh Al-Habdan",
    "initials": "SA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/habdan/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/habdan",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Saleh Al-Habdan",
      "Al-Habdan",
      "Saleh"
    ]
  },
  {
    "id": "salah-alhashim",
    "name": "Salah Alhashim",
    "initials": "SA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server12.mp3quran.net/salah_hashim_m/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/salah_hashim_m",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Salah Alhashim",
      "Alhashim",
      "Salah"
    ]
  },
  {
    "id": "mukhtar-al-haj",
    "name": "Mukhtar Al-Haj",
    "initials": "MA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/mukhtar_haj/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/mukhtar_haj",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Mukhtar Al-Haj",
      "Al-Haj",
      "Mukhtar"
    ]
  },
  {
    "id": "adel-ryyan",
    "name": "Adel Ryyan",
    "initials": "AR",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/ryan/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/ryan",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Adel Ryyan",
      "Ryyan",
      "Adel"
    ]
  },
  {
    "id": "abdelbari-al-toubayti",
    "name": "Abdelbari Al-Toubayti",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/thubti/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/thubti",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdelbari Al-Toubayti",
      "Al-Toubayti",
      "Abdelbari"
    ]
  },
  {
    "id": "abdulbari-mohammad",
    "name": "Abdulbari Mohammad",
    "initials": "AM",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server12.mp3quran.net/bari/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/bari",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdulbari Mohammad",
      "Mohammad",
      "Abdulbari"
    ]
  },
  {
    "id": "abdul-aziz-al-ahmad",
    "name": "Abdul Aziz Al-Ahmad",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server11.mp3quran.net/a_ahmed/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/a_ahmed",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdul Aziz Al-Ahmad",
      "Al-Ahmad",
      "Abdul"
    ]
  },
  {
    "id": "abdulaziz-az-zahrani",
    "name": "Abdulaziz Az-Zahrani",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server9.mp3quran.net/zahrani/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/zahrani",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdulaziz Az-Zahrani",
      "Az-Zahrani",
      "Abdulaziz"
    ]
  },
  {
    "id": "abdullah-albuajan",
    "name": "Abdullah Albuajan",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/buajan/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/buajan",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdullah Albuajan",
      "Albuajan",
      "Abdullah"
    ]
  },
  {
    "id": "ahmad-al-hawashi",
    "name": "Ahmad Al-Hawashi",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server11.mp3quran.net/hawashi/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/hawashi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ahmad Al-Hawashi",
      "Al-Hawashi",
      "Ahmad"
    ]
  },
  {
    "id": "abdullah-khayyat",
    "name": "Abdullah Khayyat",
    "initials": "AK",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server12.mp3quran.net/kyat/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/kyat",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdullah Khayyat",
      "Khayyat",
      "Abdullah"
    ]
  },
  {
    "id": "abdullah-qaulan",
    "name": "Abdullah Qaulan",
    "initials": "AQ",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/gulan/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/gulan",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdullah Qaulan",
      "Qaulan",
      "Abdullah"
    ]
  },
  {
    "id": "abdulmohsin-al-obaikan",
    "name": "Abdulmohsin Al-Obaikan",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server12.mp3quran.net/obk/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/obk",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdulmohsin Al-Obaikan",
      "Al-Obaikan",
      "Abdulmohsin"
    ]
  },
  {
    "id": "abdulhadi-kanakeri",
    "name": "Abdulhadi Kanakeri",
    "initials": "AK",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/kanakeri/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/kanakeri",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdulhadi Kanakeri",
      "Kanakeri",
      "Abdulhadi"
    ]
  },
  {
    "id": "abdulwadood-haneef",
    "name": "Abdulwadood Haneef",
    "initials": "AH",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/wdod/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/wdod",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdulwadood Haneef",
      "Haneef",
      "Abdulwadood"
    ]
  },
  {
    "id": "abdulwali-al-arkani",
    "name": "Abdulwali Al-Arkani",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/arkani/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/arkani",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdulwali Al-Arkani",
      "Al-Arkani",
      "Abdulwali"
    ]
  },
  {
    "id": "emad-hafez",
    "name": "Emad Hafez",
    "initials": "EH",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server6.mp3quran.net/hafz/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/hafz",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Emad Hafez",
      "Hafez",
      "Emad"
    ]
  },
  {
    "id": "abdulaziz-alturki",
    "name": "Abdulaziz Alturki",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/a_turki/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/a_turki",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdulaziz Alturki",
      "Alturki",
      "Abdulaziz"
    ]
  },
  {
    "id": "ahmad-saber",
    "name": "Ahmad Saber",
    "initials": "AS",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/saber/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/saber",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Ahmad Saber",
      "Saber",
      "Ahmad"
    ]
  },
  {
    "id": "neamah-al-hassan",
    "name": "Neamah Al-Hassan",
    "initials": "NA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server8.mp3quran.net/namh/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/namh",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Neamah Al-Hassan",
      "Al-Hassan",
      "Neamah"
    ]
  },
  {
    "id": "yasser-al-qurashi",
    "name": "Yasser Al-Qurashi",
    "initials": "YA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server9.mp3quran.net/qurashi/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/qurashi",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Yasser Al-Qurashi",
      "Al-Qurashi",
      "Yasser"
    ]
  },
  {
    "id": "yahya-hawwa",
    "name": "Yahya Hawwa",
    "initials": "YH",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server12.mp3quran.net/yahya/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/yahya",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Yahya Hawwa",
      "Hawwa",
      "Yahya"
    ]
  },
  {
    "id": "yousef-alshoaey",
    "name": "Yousef Alshoaey",
    "initials": "YA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server9.mp3quran.net/yousef/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/yousef",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Yousef Alshoaey",
      "Alshoaey",
      "Yousef"
    ]
  },
  {
    "id": "abdullah-abdal",
    "name": "Abdullah Abdal",
    "initials": "AA",
    "group": "other",
    "scope": "surah",
    "riwayah": "hafs",
    "style": "murattal",
    "provider": "mp3quran",
    "audioPath": "https://server16.mp3quran.net/a_abdl/Rewayat-Hafs-A-n-Assem/",
    "bitrate": "128kbps",
    "source": "MP3Quran audio collection",
    "sourceUrl": "https://mp3quran.net/eng/a_abdl",
    "license": "Upstream audio terms apply; recordings are not relicensed by this application.",
    "aliases": [
      "Abdullah Abdal",
      "Abdal",
      "Abdullah"
    ]
  }
]);

export const RECITERS = Object.freeze([...DEFAULT_RECITERS, ...OTHER_RECITERS]);

export const RECITER_IDS = new Set(RECITERS.map((reciter) => reciter.id));

const RECITER_BY_ID = new Map(RECITERS.map((reciter) => [reciter.id, reciter]));

export function getReciterById(id) {
  const found = RECITER_BY_ID.get(id);
  if (found) return found;
  const defaultReciter = RECITER_BY_ID.get(DEFAULT_RECITER_ID);
  if (defaultReciter) return defaultReciter;
  return RECITERS[0];
}

export function searchReciters(query, list = OTHER_RECITERS) {
  const normalized = (query || "").trim().toLowerCase();
  if (!normalized) return [...list];
  return list.filter((reciter) => {
    if (reciter.name.toLowerCase().includes(normalized)) return true;
    if (reciter.style.toLowerCase().includes(normalized)) return true;
    if (reciter.id.toLowerCase().includes(normalized)) return true;
    if (Array.isArray(reciter.aliases)) {
      if (reciter.aliases.some((alias) => alias.toLowerCase().includes(normalized))) return true;
    }
    return false;
  });
}
