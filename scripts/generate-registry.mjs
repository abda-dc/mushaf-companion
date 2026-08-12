import fs from "node:fs";

async function buildAuditedRegistry() {
  const defaultReciters = [
    {
      id: "alafasy",
      name: "Mishary Rashid Alafasy",
      initials: "MA",
      group: "default",
      scope: "ayah",
      riwayah: "hafs",
      style: "murattal",
      provider: "quran-foundation",
      audioPath: "Alafasy",
      bitrate: "128kbps",
      source: "Quran Foundation recitation files",
      sourceUrl: "https://verses.quran.foundation/Alafasy/mp3/",
      license: "Upstream audio terms apply; recordings are not relicensed by this application.",
      aliases: ["Mishary Rashid Alafasy", "Mishary Alafasy", "Alafasy", "Mishary", "Alafasi", "El-Afasy"],
    },
    {
      id: "abdulbasit",
      name: "Abdul Basit Abdus Samad",
      initials: "AB",
      group: "default",
      scope: "ayah",
      riwayah: "hafs",
      style: "murattal",
      provider: "quran-foundation",
      audioPath: "AbdulBaset/Murattal",
      bitrate: "192kbps",
      source: "Quran Foundation recitation files",
      sourceUrl: "https://verses.quran.foundation/AbdulBaset/Murattal/mp3/",
      license: "Upstream audio terms apply; recordings are not relicensed by this application.",
      aliases: ["Abdul Basit Abdus Samad", "Abdul Baset", "Abdus Samad", "Abdelbasset", "Abdelsamad"],
    },
    {
      id: "aymen",
      name: "Dr. Aymen Suwayed",
      initials: "AS",
      group: "default",
      scope: "ayah",
      riwayah: "hafs",
      style: "murattal",
      provider: "everyayah",
      audioPath: "Ayman_Sowaid_64kbps",
      bitrate: "64kbps",
      source: "EveryAyah recitation library",
      sourceUrl: "https://everyayah.com/data/Ayman_Sowaid_64kbps/",
      license: "Upstream audio terms apply; recordings are not relicensed by this application.",
      aliases: ["Dr. Aymen Suwayed", "Ayman Sowaid", "Ayman Suwaid", "Suwayed", "Dr. Ayman"],
    },
    {
      id: "minshawi-kids",
      name: "Minshawi Kids Repeat",
      initials: "MK",
      group: "default",
      scope: "ayah",
      riwayah: "hafs",
      style: "muallim",
      provider: "everyayah",
      audioPath: "Minshawy_Teacher_128kbps",
      bitrate: "128kbps",
      source: "EveryAyah recitation library",
      sourceUrl: "https://everyayah.com/data/Minshawy_Teacher_128kbps/",
      license: "Upstream audio terms apply; recordings are not relicensed by this application.",
      aliases: ["Minshawi Kids Repeat", "Menshawi Teacher", "Minshawi Repeat", "Minshawi Muallim"],
    },
    {
      id: "muhammad-ayyub",
      name: "Sheikh Muhammad Ayyub",
      initials: "MY",
      group: "default",
      scope: "ayah",
      riwayah: "hafs",
      style: "murattal",
      provider: "everyayah",
      audioPath: "Muhammad_Ayyoub_128kbps",
      bitrate: "128kbps",
      source: "EveryAyah recitation library",
      sourceUrl: "https://everyayah.com/data/Muhammad_Ayyoub_128kbps/",
      license: "Upstream audio terms apply; recordings are not relicensed by this application.",
      aliases: ["Sheikh Muhammad Ayyub", "Mohammad Ayyoub", "Muhammad Ayyub", "Ayyoub", "Muhammad Ayoub"],
    },
    {
      id: "abdul-rashid-sufi",
      name: "Sheikh Abdul Rashid Ali Sufi",
      initials: "RS",
      group: "default",
      scope: "surah",
      riwayah: "hafs",
      style: "murattal",
      provider: "kalamalah",
      audioPath: "abdul-rashid-sofi/murattal",
      bitrate: "128kbps",
      source: "Kalamalah audio library",
      sourceUrl: "https://api.kalamalah.com/api/abdul-rashid-sofi/murattal/",
      license: "Upstream audio terms apply; recordings are not relicensed by this application.",
      aliases: ["Sheikh Abdul Rashid Ali Sufi", "Abdulrasheed Soufi", "Rashid Sofi", "Abdul Rashid Sufi", "Sufi", "Sofi"],
    },
  ];

  const everyAyahOther = [
    { id: "saad", name: "Saad Al-Ghamdi", initials: "SG", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Ghamadi_40kbps", bitrate: "40kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Ghamadi_40kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Saad Al-Ghamdi", "Saad Al Ghamadi", "Ghamdi", "El Ghamidi", "Ghamidi"] },
    { id: "abdulbasit-mujawwad", name: "Abdul Basit Abdus Samad (Mujawwad)", initials: "AB", group: "other", scope: "ayah", riwayah: "hafs", style: "mujawwad", provider: "everyayah", audioPath: "Abdul_Basit_Mujawwad_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Abdul_Basit_Mujawwad_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Abdul Basit Abdus Samad (Mujawwad)", "Abdul Baset Mujawwad", "Abdus Samad Mujawwad", "Abdelbasset"] },
    { id: "abdullah-basfar", name: "Abdullah Basfar", initials: "AB", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Abdullah_Basfar_192kbps", bitrate: "192kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Abdullah_Basfar_192kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Abdullah Basfar", "Basfar", "Abdallah Basfar"] },
    { id: "sudais", name: "Abdur-Rahman As-Sudais", initials: "AS", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Abdurrahmaan_As-Sudais_192kbps", bitrate: "192kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Abdur-Rahman As-Sudais", "Abdurrahman Al-Sudais", "Soudais", "Alsudaes", "Al-Sudais", "As-Sudays", "Sudais"] },
    { id: "shatri", name: "Abu Bakr Ash-Shatri", initials: "AS", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Abu_Bakr_Ash-Shaatree_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Abu Bakr Ash-Shatri", "Abu Bakr Al Shatri", "Shaatree", "Shatry", "El Shatri", "Shatri"] },
    { id: "ajmi", name: "Ahmed Ibn Ali Al-Ajmi", initials: "AA", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "ahmed_ibn_ali_al_ajamy_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/ahmed_ibn_ali_al_ajamy_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Ahmed Ibn Ali Al-Ajmi", "Ahmed Al-Ajamy", "Al-Agamy", "Ahmed El-Agmy", "Ajmi", "Ajamy"] },
    { id: "ahmed-neana", name: "Ahmed Neana", initials: "AN", group: "other", scope: "ayah", riwayah: "hafs", style: "mujawwad", provider: "everyayah", audioPath: "Ahmed_Neana_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Ahmed_Neana_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Ahmed Neana", "Ahmad Naina", "Ahmed Neinaa", "Dr. Ahmed Naina", "Neana"] },
    { id: "akram-alaqmi", name: "Akram Al-Alaqmi", initials: "AA", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Akram_AlAlaqimy_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Akram_AlAlaqimy_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Akram Al-Alaqmi", "Akram Al-Alaqimy", "Alaqmy", "Alaqmi"] },
    { id: "ali-jaber", name: "Ali Jaber", initials: "AJ", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Ali_Jaber_64kbps", bitrate: "64kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Ali_Jaber_64kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Ali Jaber", "Ali Abdullah Jaber", "Sheikh Ali Jaber", "Jaber"] },
    { id: "ali-hajjaj-suesy", name: "Ali Hajjaj Al-Suesy", initials: "AS", group: "other", scope: "ayah", riwayah: "hafs", style: "mujawwad", provider: "everyayah", audioPath: "Ali_Hajjaj_AlSuesy_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Ali_Hajjaj_AlSuesy_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Ali Hajjaj Al-Suesy", "Ali Hajjaj Suwaisi", "Al-Suesy", "Souesy", "Suwaisi"] },
    { id: "aziz-alili", name: "Aziz Alili", initials: "AA", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "aziz_alili_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/aziz_alili_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Aziz Alili", "Alili"] },
    { id: "fares-abbad", name: "Fares Abbad", initials: "FA", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Fares_Abbad_64kbps", bitrate: "64kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Fares_Abbad_64kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Fares Abbad", "Faris Abbad", "Fares Abad", "Abbad"] },
    { id: "hani-rifai", name: "Hani Ar-Rifai", initials: "HR", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Hani_Rifai_192kbps", bitrate: "192kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Hani_Rifai_192kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Hani Ar-Rifai", "Hany Ar-Rifai", "Hani Al-Rifai", "Rifa'i", "Rifai"] },
    { id: "hudhaify", name: "Ali Al-Hudhaifi", initials: "AH", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Hudhaify_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Hudhaify_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Ali Al-Hudhaifi", "Ali Al-Huthaifi", "Hudhaifi", "Hothaify", "Huthaify"] },
    { id: "husary", name: "Mahmoud Khalil Al-Husary", initials: "MH", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Husary_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Husary_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Mahmoud Khalil Al-Husary", "Mahmoud Khalil Al-Hussary", "Al-Hosary", "Hussary", "Hussari", "Hosary", "Husary"] },
    { id: "husary-muallim", name: "Mahmoud Khalil Al-Husary (Muallim)", initials: "MH", group: "other", scope: "ayah", riwayah: "hafs", style: "muallim", provider: "everyayah", audioPath: "Husary_Muallim_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Husary_Muallim_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Mahmoud Khalil Al-Husary (Muallim)", "Hussary Muallim", "Husary Teacher", "Muallim", "Hosary Muallim"] },
    { id: "husary-mujawwad", name: "Mahmoud Khalil Al-Husary (Mujawwad)", initials: "MH", group: "other", scope: "ayah", riwayah: "hafs", style: "mujawwad", provider: "everyayah", audioPath: "Husary_128kbps_Mujawwad", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Husary_128kbps_Mujawwad/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Mahmoud Khalil Al-Husary (Mujawwad)", "Hussary Mujawwad", "Al-Hosary Mujawwad", "Hosary Mujawwad"] },
    { id: "ibrahim-akhdar", name: "Ibrahim Al-Akhdar", initials: "IA", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Ibrahim_Akhdar_32kbps", bitrate: "32kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Ibrahim_Akhdar_32kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Ibrahim Al-Akhdar", "Ibrahim Al-Akdar", "Al-Akhdhar", "Akhdar", "Akdar"] },
    { id: "juhany", name: "Abdullah Awwad Al-Juhany", initials: "AJ", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Abdullaah_3awwaad_Al-Juhaynee_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Abdullaah_3awwaad_Al-Juhaynee_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Abdullah Awwad Al-Juhany", "Abdullah Al-Juhani", "Johany", "Al-Juhaynee", "Juhany"] },
    { id: "karim-mansoori", name: "Karim Mansoori", initials: "KM", group: "other", scope: "ayah", riwayah: "hafs", style: "mujawwad", provider: "everyayah", audioPath: "Karim_Mansoori_40kbps", bitrate: "40kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Karim_Mansoori_40kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Karim Mansoori", "Karim Mansouri", "Mansoory", "Mansoori"] },
    { id: "khalifa-tunaiji", name: "Khalifa Al-Tunaiji", initials: "KT", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "khalefa_al_tunaiji_64kbps", bitrate: "64kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/khalefa_al_tunaiji_64kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Khalifa Al-Tunaiji", "Khalifah Al-Tonaeji", "Al-Tunaijee", "Tunaiji"] },
    { id: "khalid-qahtani", name: "Khalid Abdullah Al-Qahtani", initials: "KQ", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Khaalid_Abdullaah_al-Qahtaanee_192kbps", bitrate: "192kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Khaalid_Abdullaah_al-Qahtaanee_192kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Khalid Abdullah Al-Qahtani", "Khaled Al-Qahtani", "Khaalid Qahtani", "Qahtani"] },
    { id: "maher-muaiqly", name: "Maher Al-Muaiqly", initials: "MM", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "MaherAlMuaiqly128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/MaherAlMuaiqly128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Maher Al-Muaiqly", "Maher Al-Meaqli", "Al-Muaiqly", "Al-Moaiqly", "Muaiqly"] },
    { id: "mahmoud-ali-banna", name: "Mahmoud Ali Al-Banna", initials: "MB", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "mahmoud_ali_al_banna_32kbps", bitrate: "32kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/mahmoud_ali_al_banna_32kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Mahmoud Ali Al-Banna", "Mahmoud Ali El-Banna", "Al Banna", "Banna"] },
    { id: "matroud", name: "Abdullah Matroud", initials: "AM", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Abdullah_Matroud_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Abdullah_Matroud_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Abdullah Matroud", "Abdullah Matrood", "Al-Matrood", "Matrood"] },
    { id: "minshawi", name: "Muhammad Siddiq Al-Minshawi", initials: "MM", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Minshawy_Murattal_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Minshawy_Murattal_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Muhammad Siddiq Al-Minshawi", "Mohamed Siddiq El-Minshawi", "Menshawy", "Minshawy", "Minshawi"] },
    { id: "minshawi-mujawwad", name: "Muhammad Siddiq Al-Minshawi (Mujawwad)", initials: "MM", group: "other", scope: "ayah", riwayah: "hafs", style: "mujawwad", provider: "everyayah", audioPath: "Minshawy_Mujawwad_192kbps", bitrate: "192kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Minshawy_Mujawwad_192kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Muhammad Siddiq Al-Minshawi (Mujawwad)", "Menshawy Mujawwad", "Minshawy Mujawwad", "Minshawi Mujawwad"] },
    { id: "tablawi", name: "Mohammad Al-Tablawi", initials: "MT", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Mohammad_al_Tablaway_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Mohammad_al_Tablaway_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Mohammad Al-Tablawi", "Mohammad Al-Tablaway", "Tablaway", "Al-Tablawi", "Tablawi"] },
    { id: "muhammad-abdulkareem", name: "Muhammad AbdulKareem", initials: "MA", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Muhammad_AbdulKareem_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Muhammad_AbdulKareem_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Muhammad AbdulKareem", "Mohammad Abdul Karim", "Abdulkareem", "Abdul Karim"] },
    { id: "muhammad-jibreel", name: "Muhammad Jibreel", initials: "MJ", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Muhammad_Jibreel_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Muhammad_Jibreel_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Muhammad Jibreel", "Mohammed Jibril", "Jebril", "Jibreel"] },
    { id: "muhsin-qasim", name: "Muhsin Al-Qasim", initials: "MQ", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Muhsin_Al_Qasim_192kbps", bitrate: "192kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Muhsin_Al_Qasim_192kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Muhsin Al-Qasim", "Mohsen Al-Qasim", "Al-Qaseem", "Qasim"] },
    { id: "nabil-rifai", name: "Nabil Ar-Rifai", initials: "NR", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Nabil_Rifa3i_48kbps", bitrate: "48kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Nabil_Rifa3i_48kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Nabil Ar-Rifai", "Nabeel Ar-Rifai", "Nabil Al-Rifai", "Rifa3i", "Nabil Rifai"] },
    { id: "nasser-qatami", name: "Nasser Al-Qatami", initials: "NQ", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Nasser_Alqatami_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Nasser_Alqatami_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Nasser Al-Qatami", "Naser Al-Qatami", "Alqatami", "Qatami"] },
    { id: "parhizgar", name: "Shahriar Parhizgar", initials: "SP", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Parhizgar_48kbps", bitrate: "48kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Parhizgar_48kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Shahriar Parhizgar", "Shahryar Parhizgar", "Parhizkar", "Shahriyar", "Parhizgar"] },
    { id: "sahl-yassin", name: "Sahl Yassin", initials: "SY", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Sahl_Yassin_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Sahl_Yassin_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Sahl Yassin", "Sahl Yaseen", "Sahel Yassin", "Yassin"] },
    { id: "salah-bukhatir", name: "Salah Bukhatir", initials: "SB", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Salaah_AbdulRahman_Bukhatir_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Salaah_AbdulRahman_Bukhatir_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Salah Bukhatir", "Salah Bu Khater", "Salaah Bukhatir", "Bukhatir"] },
    { id: "salah-budair", name: "Salah Al-Budair", initials: "SB", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Salah_Al_Budair_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Salah_Al_Budair_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Salah Al-Budair", "Salah Al-Bedair", "Al-Budayr", "Budair"] },
    { id: "saud-shuraym", name: "Saud Ash-Shuraym", initials: "SS", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Saood_ash-Shuraym_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Saood_ash-Shuraym_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Saud Ash-Shuraym", "Saoud Ash-Shuraim", "Al-Shuraim", "Shuraim", "Shuraym"] },
    { id: "yaser-salamah", name: "Yaser Salamah", initials: "YS", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Yaser_Salamah_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Yaser_Salamah_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Yaser Salamah", "Yasser Salama", "Yasser Salamah", "Salamah"] },
    { id: "yasser-dussary", name: "Yasser Ad-Dussary", initials: "YD", group: "other", scope: "ayah", riwayah: "hafs", style: "murattal", provider: "everyayah", audioPath: "Yasser_Ad-Dussary_128kbps", bitrate: "128kbps", source: "EveryAyah recitation library", sourceUrl: "https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/", license: "Upstream audio terms apply; recordings are not relicensed by this application.", aliases: ["Yasser Ad-Dussary", "Yasser Al-Dosari", "Al-Dawsari", "Al-Dossari", "Dussary", "Dosari"] },
  ];

  // Exact API ID deduplication map (reciters already represented in EveryAyah/QF/Kalamalah)
  const deduplicatedApiIds = new Set([
    1,   // Ibrahim Al-Akdar (EveryAyah ibrahim-akhdar)
    4,   // Abu Bakr Al Shatri (EveryAyah shatri)
    5,   // Ahmad Al-Ajmy (EveryAyah ajmi)
    9,   // Ahmad Nauina (EveryAyah ahmed-neana)
    21,  // Khaled Al-Qahtani (EveryAyah khalid-qahtani)
    24,  // Khalifa Altunaiji (EveryAyah khalifa-tunaiji)
    30,  // Saad Al-Ghamdi (EveryAyah saad)
    31,  // Saud Al-Shuraim (EveryAyah saud-shuraym)
    32,  // Sahl Yassin (EveryAyah sahl-yassin)
    43,  // Salah Albudair (EveryAyah salah-budair)
    46,  // Slaah Bukhatir (EveryAyah salah-bukhatir)
    51,  // Abdulbasit Abdulsamad (Quran Foundation abdulbasit)
    54,  // Abdulrahman Alsudaes (EveryAyah sudais)
    59,  // Abdullah Al-Mattrod (EveryAyah matroud)
    60,  // Abdullah Basfer (EveryAyah abdullah-basfar)
    62,  // Abdullah Al-Johany (EveryAyah juhany)
    64,  // Abdulrasheed Soufi (Kalamalah abdul-rashid-sufi)
    67,  // Abdulmohsen Al-Qasim (EveryAyah muhsin-qasim)
    74,  // Ali Alhuthaifi (EveryAyah hudhaify)
    76,  // Ali Jaber (EveryAyah ali-jaber)
    77,  // Ali Hajjaj Alsouasi (EveryAyah ali-hajjaj-suesy)
    81,  // Fares Abbad (EveryAyah fares-abbad)
    86,  // Nasser Alqatami (EveryAyah nasser-qatami)
    87,  // Nabil Al Rifay (EveryAyah nabil-rifai)
    89,  // Hani Arrifai (EveryAyah hani-rifai)
    92,  // Yasser Al-Dosari (EveryAyah yasser-dussary)
    101, // Akram Al-Alaqmi
    102, // Alafasy
    103, // Aziz Alili
    104, // Muhammad Ayyub
    105, // Mahmoud Khalil Al-Husary
    106, // Maher Al-Muaiqly
    107, // Mahmoud Ali Al-Banna
    109, // Muhammad Siddiq Al-Minshawi
    110, // Mohammad Al-Tablawi
    111, // Muhammad AbdulKareem
    112, // Muhammad Jibreel
    115, // Shahriar Parhizgar
    152, // Yaser Salamah
    21236, // Rashed Al-Afasy
    21249, // Abdulrahman Al-Sudais 1441
  ]);

  // Excluded MP3Quran entries that returned HTTP 404
  const unreachableApiIds = new Set([66, 202, 203, 206]);

  const res = await fetch("https://mp3quran.net/api/v3/reciters?language=eng");
  const data = await res.json();

  const mp3Other = [];
  const generatedSlugs = new Set(defaultReciters.map((r) => r.id).concat(everyAyahOther.map((r) => r.id)));

  for (const r of data.reciters) {
    if (deduplicatedApiIds.has(r.id)) continue;
    if (unreachableApiIds.has(r.id)) continue;

    for (const m of r.moshaf) {
      const isHafs = m.name.toLowerCase().includes("hafs") || m.moshaf_type === 1 || m.rewaya_id === 1;
      const is114 = m.surah_total === 114;
      const surasArr = m.surah_list.split(",").map(Number);
      const isAll114 = surasArr.length === 114 && surasArr[0] === 1 && surasArr[113] === 114;

      if (isHafs && is114 && isAll114) {
        let baseSlug = r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        let slug = baseSlug;
        let counter = 1;
        while (generatedSlugs.has(slug)) {
          counter++;
          slug = `${baseSlug}-${counter}`;
        }
        generatedSlugs.add(slug);

        const nameParts = r.name.trim().split(/\s+/).filter(Boolean);
        const initials = (nameParts.length >= 2 ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]) : (nameParts[0] ? nameParts[0].slice(0, 2) : "MP")).toUpperCase();

        const aliases = [r.name.trim()];
        if (nameParts.length >= 2) {
          aliases.push(nameParts[nameParts.length - 1]);
          aliases.push(nameParts[0]);
        }

        const serverUrl = m.server.endsWith("/") ? m.server : m.server + "/";

        mp3Other.push({
          id: slug,
          name: r.name.trim(),
          initials: initials,
          group: "other",
          scope: "surah",
          riwayah: "hafs",
          style: m.name.toLowerCase().includes("mujawwad") ? "mujawwad" : "murattal",
          provider: "mp3quran",
          audioPath: serverUrl,
          bitrate: "128kbps",
          source: "MP3Quran audio collection",
          sourceUrl: "https://mp3quran.net/eng/" + (serverUrl.split("/")[3] || ""),
          license: "Upstream audio terms apply; recordings are not relicensed by this application.",
          aliases: aliases,
        });
        break; // One distinct complete Hafs collection per person
      }
    }
  }

  // Reachability verify all mp3Other
  console.log(`Testing reachability of ${mp3Other.length} MP3Quran reciters...`);
  const verifiedMp3Other = [];
  for (const item of mp3Other) {
    try {
      const r1 = await fetch(item.audioPath + "001.mp3", { method: "HEAD" });
      const r114 = await fetch(item.audioPath + "114.mp3", { method: "HEAD" });
      if (r1.status === 200 && r114.status === 200) {
        verifiedMp3Other.push(item);
      } else {
        console.error(`REACHABILITY FAIL [${item.id}]: ${r1.status} / ${r114.status}`);
      }
    } catch (e) {
      console.error(`NETWORK ERR [${item.id}]: ${e.message}`);
    }
  }

  const totalOther = [...everyAyahOther, ...verifiedMp3Other];
  const allReciters = [...defaultReciters, ...totalOther];

  console.log(`\nInventory Summary:`);
  console.log(`Default Reciters: ${defaultReciters.length}`);
  console.log(`EveryAyah Other: ${everyAyahOther.length}`);
  console.log(`MP3Quran Verified Other: ${verifiedMp3Other.length}`);
  console.log(`Total Other: ${totalOther.length}`);
  console.log(`Grand Total Reciters: ${allReciters.length}`);

  const mjsCode = `/**
 * Canonical Reciter Registry for Mushaf Companion (M10).
 *
 * Single source of truth for all verified Hafs reciters, groupings,
 * scopes, providers, and aliases.
 */

export const DEFAULT_RECITER_ID = "alafasy";

export const DEFAULT_RECITERS = Object.freeze(${JSON.stringify(defaultReciters, null, 2)});

export const OTHER_RECITERS = Object.freeze(${JSON.stringify(totalOther, null, 2)});

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
`;

  const dtsCode = `export type ReciterScope = "ayah" | "surah";
export type ReciterGroup = "default" | "other";
export type ReciterRiwayah = "hafs";
export type ReciterStyle = "murattal" | "mujawwad" | "muallim";
export type ReciterProvider = "quran-foundation" | "everyayah" | "kalamalah" | "mp3quran";

export type ReciterId =
${allReciters.map((r) => '  | "' + r.id + '"').join("\n")};

export interface ReciterDefinition {
  id: ReciterId;
  name: string;
  initials: string;
  group: ReciterGroup;
  scope: ReciterScope;
  riwayah: ReciterRiwayah;
  style: ReciterStyle;
  provider: ReciterProvider;
  audioPath: string;
  bitrate?: string;
  source: string;
  sourceUrl: string;
  license: string;
  aliases?: string[];
}

export const DEFAULT_RECITER_ID: ReciterId;
export const DEFAULT_RECITERS: readonly ReciterDefinition[];
export const OTHER_RECITERS: readonly ReciterDefinition[];
export const RECITERS: readonly ReciterDefinition[];
export const RECITER_IDS: ReadonlySet<string>;

export function getReciterById(id: string): ReciterDefinition;
export function searchReciters(query: string, list?: readonly ReciterDefinition[]): ReciterDefinition[];
`;

  fs.writeFileSync("./app/reciter-registry.mjs", mjsCode, "utf8");
  fs.writeFileSync("./app/reciter-registry.d.mts", dtsCode, "utf8");
  console.log("Successfully generated canonical reciter-registry files!");
}

buildAuditedRegistry();
