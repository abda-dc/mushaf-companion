# Ayah Context Lens

The Ayah Context Lens opens from the currently selected ayah without changing the reader page, selected verse, or fixed 15-line Mushaf geometry. It is a right-side drawer on desktop and a 94-dvh bottom sheet on mobile. The overlay is fixed above the reader, so opening or closing it cannot reflow the page.

## User flow

1. Select an ayah in the Mushaf and choose **Context lens**, or use the **Context** control in the desktop or mobile reading-assistance bar.
2. Review the sūrah and ayah identity, current page, juz, hizb, and verified Arabic ayah.
3. Use the Translation tab. Saheeh International remains the default online translation from Quran.com resource 20.
4. Download the Amharic pack if desired. The UI reports the provider download, normalization, exact 114-surah/6,236-ayah validation, staging, readback verification, and atomic activation phases.
5. Amharic becomes selectable only after the active pack and the selected verse record are present. Failed or interrupted installs keep English selected and provide an explicit retry.
6. Verify, repair, or delete the local pack from the same panel. Deletion requires confirmation. A surviving sentinel warns when browser storage has reclaimed the pack and offers explicit repair.
7. Open the Ibn Kathir tab to read the existing normalized English resource 169. Its source, normalization, checksums, and standalone tafsir panel are unchanged; no tafsir translation is performed.

## Sources and gating

- Arabic: Madani Mushaf, Hafs, Quran Foundation content services.
- English translation: Saheeh International, Quran Foundation/Quran.com resource 20, online as before.
- Amharic translation: Muhammad Zain Zahruddin, Africa Academy, QuranEnc `amharic_zain`, edition `1.0.1`, revision `1.0.1-xml.1`.
- Tafsir: Ibn Kathir (Abridged), Hafiz Ibn Kathir, resource 169.

Somali `somali_yacob` and Afaan Oromoo `oromo_ababor` are not shown in the selector. Their unresolved publisher metadata continues to block activation. The lens contains no placeholder or machine-generated translation.

## Accessibility and responsive behavior

- Modal dialog labeling and description, a focus trap, Escape-to-close, and focus return to the opening control.
- Translation and tafsir tabs use `tablist`, `tab`, and `tabpanel` semantics, with Arrow, Home, and End keyboard navigation.
- Status, progress, failure, and storage-reclamation messages use progressbar, status, and alert semantics.
- The desktop drawer fills the viewport height. Below 790 px, it becomes a bottom sheet with a visible handle and safe-area padding.

## Deferred work

This milestone does not add morphology, roots, lemmas, an Evidence Graph, related-ayah generation, notes, tags, additional tafsir, or tafsir translation.
