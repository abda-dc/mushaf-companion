# Current reader UX review

> Implementation update — 2026-08-07: version 1.1.0 resolves the mobile page-jump finding with one responsive sheet for page, sūrah, juz, recent pages, and saved places. The remaining P2 findings are retained below as the next polish backlog.

Reviewed against the deployed 604-page reader on August 5, 2026 at desktop (`1440 × 1000`) and mobile (`390 × 844`) sizes. Page 2, the collapsed and expanded audio player, page navigation, and the Settings entry point were inspected.

## Summary

The product already has a distinctive, calm visual identity and makes page navigation more prominent than most utility-style Quran apps. The framed reading surface, restrained palette, direct page field, fixed audio transport, and clear desktop page-turn controls support the intended “real book” direction.

The original review identified page fidelity, placeholder Settings, hidden mobile learning controls, and unstable expanded audio as the highest-risk gaps. Version 0.3.0 now uses the authoritative QCF page mapping and per-page fonts, provides responsive Settings and explicit mobile learning controls, and separates the audio mini-player from its bottom sheet.

## Implemented in 0.3.0

- All pages render inside 15 fixed line slots with QCF V2 or QCF V4 Tajweed page-font metrics.
- Settings is a real responsive destination and persists display, learning, reciter, and speed preferences.
- Tajweed and Transliteration remain explicitly named and one tap away on mobile.
- Mobile audio keeps stable primary transport in a mini-player and moves configuration to a bottom sheet.
- Home, Read, Listen, Bookmarks, Search, and Settings have consistent selected states and responsive destinations.
- Backdrop click, explicit Close, and Escape dismiss the active layer consistently.

## Implemented in 1.1.0

- The mobile page indicator and lower page control open one clearly labeled jump sheet.
- The sheet supports direct page entry with an inline validation message and visible Go action.
- Sūrah, juz, six recent pages, and saved-place shortcuts provide fast navigation without keyboard submission.

## Priority findings

| Priority | Area | Current evidence | Recommended change | Acceptance check |
| --- | --- | --- | --- | --- |
| P0 | Mushaf fidelity | Page 2 leaves most of the framed page empty instead of distributing content across a print-faithful 15-line composition. | Treat line geometry as content data, not responsive text flow. Validate the selected edition’s exact word-to-line mapping and use edition-specific font metrics. | Approved fixtures for representative pages match the reference line count, line occupancy, surah headings, ayah markers, and footer placement. |
| P1 | Settings | Desktop Settings only displays “Reader settings are available in the header controls.” Mobile navigation has no Settings destination. | Add a real settings panel: Display, Reading assistance, Audio, Navigation, Downloads, and Accessibility. Use a side panel on desktop and bottom sheet on mobile. | Settings is reachable on every breakpoint, preferences persist, and every current toggle has one canonical settings location. |
| P1 | Mobile learning controls | Transliteration is hidden. Tajweed becomes a colored dot whose accessible name is lost, producing an unnamed pressed button. | Keep explicit accessible labels and add a compact “Display” button or overflow sheet containing Tajweed, Transliteration, translation, text scale, and theme. | Every visible control has an accessible name; Tajweed and Transliteration are reachable within one tap from the reader. |
| P1 | Mobile audio expansion | The expanded player grows upward over the reading surface, moves the primary Play control below configuration fields, and leaves only a small amount of Quran visible. | Use a three-state audio sheet: mini player, transport player, and settings sheet. Keep reciter/ayah and play controls in the top row at every state. | Expanding settings never reorders the primary transport; collapse is obvious; the sheet respects bottom safe areas and keyboard focus. |
| P1 | Navigation semantics | Side navigation mixes destinations and actions: Read/Listen change mode, Search/Bookmarks open modals, and Home/Settings show notices. | Separate destinations from reader actions. Use actual views or sheets with consistent selected state and browser-history behavior. | Each navigation item has a predictable destination, Back closes or returns correctly, and active state always matches visible content. |
| P1 | Page-turn model | Desktop arrows are visually clear but sit far from the page. Swipe uses a conventional left-to-next gesture even though a physical Arabic mushaf has right-to-left book logic. | Expand invisible page-edge hit targets, label destination page numbers, and establish an explicit swipe-direction preference with a sensible mushaf default. | First-use guidance explains gestures; page turns work with touch, keyboard, and controls; direction is consistent with the configured reading model. |
| P2 | Ayah selection | Individual words are interactive, but the selected ayah and available actions are not visually obvious. Bookmarking depends on the implicit selected ayah. | Highlight the full selected ayah, use a stable ayah action popover, and reserve word-level interaction for future word tools. | Tap anywhere in an ayah to select it; Bookmark/Play/Repeat/Study actions identify the exact ayah before executing. |
| P2 | Audio repeat | The repeat button cycles Off → Ayah → Range, and range selectors are hidden in the expanded player. The current range is limited to verses loaded on the page. | Replace cycling with an explicit menu. Show the active range in the mini player and state whether it is current-page only. Later support cross-page ranges. | Users can predict the next repeat state, see the active range, and stop repeating in one action. |
| P2 | Reciter discovery | The current reciter is visible, but changing reciter is hidden behind an unlabeled ellipsis/audio-settings action. | Make the reciter name itself a button with a chevron and use a focused reciter sheet with voice, style, download state, and preview. | Reciter change is discoverable without opening generic settings and preserves the selected ayah. |
| P2 | Desktop density | The fixed audio dock and generous side whitespace make the experience elegant, but the page can feel disconnected from navigation on large screens. | Allow a focused-reading mode that hides the side rail/header and moves page controls to subtle page-edge zones. | One action enters/exits focus mode; Arabic page size increases without changing line geometry. |

## Mushaf reader polish

### Preserve actual page geometry

The current renderer correctly models 15 line slots, but the visual result shows that having 15 containers is not enough. Each page needs edition-specific line occupancy, consistent baselines, and a Quran typeface whose metrics are known. Font fallback must not determine line breaks.

Recommended implementation sequence:

1. Select and document the exact Madani edition and font assets.
2. Store authoritative word-to-line positions for that edition.
3. Prevent browser wrapping inside an authoritative line.
4. Scale the complete page as a unit when space is constrained.
5. Add screenshot diffs at desktop and mobile widths.

### Reduce competing page metadata

The page number appears in the jump field, the book metadata row, the center medallion, and the page footer fraction. Keep the physical page number inside the mushaf and one interactive location outside it. The “Page 2 / The Cow / Swipe or use arrows” row can become a lighter status strip or disappear in focus mode.

### Make loading feel like a page turn

Keep the outgoing page visible until the next verified page is ready. Animate the frame or page edge rather than replacing Quran text with a large loading layer. If retrieval fails, retain the last verified page and place retry outside the Arabic frame.

### Clarify first and last pages

At pages 1 and 604, keep the disabled control location stable and show “Beginning” or “End” instead of only lowering opacity. This confirms the boundary rather than making the control look broken.

## Navigation polish

- Show destination context on hover/focus: `Previous · Page 1` and `Next · Page 3`.
- Add `Esc` to close Search, Bookmarks, Settings, Translation, Tafsir, and expanded audio sheets.
- Restore focus to the control that opened a modal or sheet.
- Give direct jumps a short validation message beside the input instead of a distant toast.
- Add recent pages and saved places to the page-jump sheet.
- Consider a compact location scrubber by juz for long-distance navigation, but keep it secondary to page turns.
- Persist the chosen page-turn direction and provide an accessible setting for reduced motion.

## Audio-control polish

### Mini player

Keep these visible at all sizes:

- Selected ayah.
- Reciter name.
- Previous, Play/Pause, and Next.
- Audio state: loading, ready, playing, paused, unavailable, or offline.
- Repeat state when active.

The current mobile mini player truncates the reciter name aggressively. Prefer a two-line metadata block or allow the reciter name to yield space before hiding transport context.

### Expanded player

- Use a modal bottom sheet on mobile rather than expanding the fixed dock in document flow.
- Keep primary transport above reciter/repeat settings.
- Add a clearly labeled close/collapse affordance; the current thin drag handle is easy to miss.
- Replace the ellipsis with a named `Audio settings` control.
- Use explicit speed options rather than cycling `1× → 0.75× → 1.25×`.
- Disable unavailable controls while metadata or audio is loading and announce the state.
- Display repeat range as `2:1–2:5` and validate that From does not exceed To.
- When audio advances across a page boundary, preload the next page but do not turn it until the next verse actually begins.

## Settings-flow recommendation

Use one settings information architecture across desktop and mobile:

1. **Display** — theme, brightness, focus mode, font/page scale, reduced motion.
2. **Reading assistance** — tajweed, transliteration, translation edition, tafsir source.
3. **Audio** — reciter, speed, repeat default, auto-follow, continuous play.
4. **Navigation** — swipe direction, keyboard help, resume behavior.
5. **Downloads** — offline packs, Wi-Fi-only, storage used, repair/delete.
6. **Accessibility** — larger controls, contrast, screen-reader verbosity.
7. **About content** — Quran edition, translation/tafsir attribution, content revision.

Header shortcuts may mirror common settings, but they should read and write the same preference model. Do not maintain separate state for a header toggle and its settings equivalent.

## Accessibility details

- Preserve `aria-label` when visible text is hidden by responsive CSS.
- Keep all touch targets at least 44 × 44 CSS pixels.
- Use a roving focus or one ayah-level focus target instead of exposing every word as a button.
- Announce completed page changes once, after verified content is ready.
- Do not announce prefetch activity.
- Provide a reduced-motion path for page-turn animation and audio-sheet transitions.
- Test Arabic and Latin text at 200% browser zoom without overlap.
- Use actual icons with stable accessible names instead of font glyphs where possible.

## Recommended implementation order

1. Correct page-line geometry and add visual regression fixtures.
2. Build the shared settings panel and fix mobile control names.
3. Refactor mobile audio into stable mini-player and bottom-sheet states.
4. Normalize navigation destinations, Back behavior, and focus restoration.
5. Improve page jump and ayah action discovery.
6. Add focus mode and lower-priority visual refinements.
