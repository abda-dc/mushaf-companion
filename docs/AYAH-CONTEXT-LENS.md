# Ayah Study Lens

The Ayah Study Lens is the single contextual study surface for the currently selected ayah. It is a fixed right-side drawer on desktop and a 94-dvh bottom sheet on mobile, so opening, navigating, or closing it never resizes the reader or changes the fixed 15-line Madani Mushaf geometry.

## Shared state and user flow

`app/page.tsx` remains the owner of `selectedVerseKey`. The Mushaf page, Lens, translation, tafsir, recitation, Hifz, and word selection all consume that same identity.

1. Select an ayah action to open Overview, or select a content word to open Words.
2. Use Overview, Words, Tafsir, Practice, Private Notes, and Source Evidence without leaving the verified page context.
3. Move to the previous or next ayah from any tab. Page-edge movement uses the existing trusted page loader.
4. Close with the close button, Escape, or backdrop. Focus returns to the control that opened the Lens.

Overview reuses Saheeh International and the verified optional Amharic pack. Tafsir reuses the normalized Ibn Kathir resource. Practice delegates to the existing ayah playback, Hifz, and Tajweed-guide actions. No second content, audio, or memorization implementation exists.

## Words and Tajweed

A content word receives a deterministic coordinate made from canonical `verseKey`, one-based content-word position, page, and line, with the existing upstream word ID as a secondary anchor. Ayah-end markers are excluded. The Arabic `PageWord` remains authoritative.

One word click selects the ayah and opens a coherent word context. Existing Tajweed rules are shown in the same context instead of opening a competing popup. **Hear in Ayah** accurately uses ayah recitation; no isolated word audio is claimed.

Meaning, transliteration, lemma, root, morphology, vocabulary, source attribution, and occurrence actions render only when an approved word-study provider returns a runtime-validated record. With the current disabled provider, the Lens shows a clear unavailable state and preserves Tajweed and ayah audio.

## Occurrence explorer

Lemma and root are distinct query types. Results are runtime-audited for query identity, provenance, coordinate bounds, and duplicates. The Lens reports the exact returned audited count, supports all-Quran/current-surah filtering, and renders results in bounded groups of 50.

Opening a result first verifies its verse and page through the existing Quran content transport. The destination page then remaps the one-based position to a real `PageWord`; a mismatch is rejected rather than highlighted approximately.

## Sources and gating

- Arabic and page geometry: Madani Mushaf, Hafs, existing Quran Foundation content pipeline.
- English translation: Saheeh International, Quran Foundation/Quran.com resource 20.
- Optional Amharic translation: Muhammad Zain Zahruddin, Africa Academy, QuranEnc `amharic_zain`, pinned and verified by the existing pack service.
- Tafsir: Ibn Kathir (Abridged), Hafiz Ibn Kathir, Quran.com resource 169.
- Word study and vocabulary: no approved production provider. The Quranic Arabic Corpus 0.4 descriptor is reference-only, blocked, and returns no records.
- Private Notes: local plain-text user content, not encrypted, with a frozen and save-time-revalidated Quran anchor.
- Evidence: no approved production provider and zero shipped edges; loading/disabled/failure states use neutral wording, while audited/verified wording is reserved for successful approved runtime results.

No AI-generated or placeholder Quran interpretation is used.

## Accessibility and responsive behavior

- Modal dialog labeling, description, focus trap, Escape handling, and focus return.
- A semantic tablist with Arrow Left/Right, Home, and End navigation.
- Semantic word and occurrence buttons with accessible coordinate labels.
- Status, alert, progressbar, language, and Arabic direction attributes where appropriate.
- Touch-friendly controls, mobile safe-area padding, and no new persistent navigation item.
- Note editor and deletion focus moves to a connected editor, trigger, neighboring note, or stable fallback when controls are replaced.

## Extension boundary

A future approved provider can activate word fields and Foundation 125 without changing the Mushaf renderer. Future M7+ work may add approved curricula or study features through the same provider and user-state boundaries; it must not bypass coordinate, rights, integrity, or provenance audits.
