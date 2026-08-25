# Private Study Notes (M7)

## Privacy boundary

Private Study Notes are user-authored annotations. They are not Quran text, translation, tafsir, source evidence, or an authoritative topic classification. The UI labels them as private and user-authored wherever they appear.

Notes are stored only in the browser's existing `localStorage` preference document. Normal creation, editing, deletion, filtering, navigation, and Study Lens opening make no note-related network request and emit no analytics event. Note bodies and private tag values leave the device only when the user explicitly downloads the portable JSON backup. No login, cloud database, sync, telemetry, or public sharing was added.

Local/private does not mean encrypted: notes are **not encrypted** in browser storage or in a downloaded JSON backup.

## Model, IDs, and frozen anchors

`app/study-notes.mjs` owns schema-v2 `StudyNote` records with plain-text bodies, tags, creation/update instants, and one trusted anchor. Schema v1 ayah/word records migrate without loss:

- Ayah: exact verse key and authoritative page.
- Word: verse key, one-based word position, authoritative page, line, and Quran Foundation source word ID.
- Lesson: exact source ID/revision, course, module, lesson and optional section. Lesson anchors are available only for an activated, matching Guided Education source revision.

Stable cryptographic UUIDs use `crypto.randomUUID()` when available. A browser-safe RFC 4122 v4 fallback uses `crypto.getRandomValues()`; if neither secure API exists, note creation fails safely. No timestamp, counter, or `Math.random()` fallback exists.

Starting a draft freezes its complete ayah or word anchor. Ayah/page navigation and word-selection changes cannot retarget that draft. Saving re-resolves the captured verse/page and, for a word note, remaps the complete word position, line, page, verse, and source word ID. A mismatch refuses the save. Editing an existing note updates only body/tags and preserves its original anchor.

Arabic text alone is never a word identity. Opening a saved note also resolves its verse through the trusted Quran transport and requires the stored page/full word coordinate to match.

## Bounds and normalization

- 250 notes per device.
- 4,000 Unicode code points per note body.
- 12 tags per note.
- 40 Unicode code points per tag.
- Imported collections are sliced before validation/deduplication.
- Note IDs are deduplicated deterministically.
- Instants must be exact UTC ISO timestamps and round-trip through `Date`; impossible dates are rejected.
- Imported anchors, bodies, timestamps, arrays, and object shapes are validated sectionally. A corrupt notes section becomes empty without discarding valid bookmarks, reader state, Hifz, vocabulary, or Today's Study data.

Bodies are rendered as React text, never arbitrary HTML or Markdown, and never through `dangerouslySetInnerHTML`.

## Tags and UX

Whitespace is trimmed and collapsed, Unicode is normalized, and duplicate comparison uses a case-insensitive NFKC key. Arabic and other Unicode tags are supported. Tags can be renamed or removed without deleting notes. Renaming the currently selected filter follows the new normalized tag; removing it clears the filter.

The Study Lens Notes tab supports ayah and exact-word notes. Saved Study provides local search, ayah/word filters, tag management, explicit deletion confirmation, and trusted navigation. Editor and delete flows move focus to a connected editor, trigger, neighboring note, or stable fallback. New note, tag, edit/delete, confirmation, and evidence actions use the project's approximate 44px touch-target floor.

## Persistence and backup

Preference schema v8 preserves schema-v2 notes and lesson anchors while probing and deterministically migrating earlier supported preference schemas and fragmented legacy keys. Portable restore validates its plain-object envelope, supported schema version, and optional export timestamp before sectional migration. Known v2–v7 backups migrate to v8; future schemas are rejected rather than silently interpreted as current.

## Limitations

- Notes do not sync between devices automatically.
- Notes cannot be shared or published.
- Private user-created Quran-to-Quran links are deferred.
- Removing browser storage removes notes unless the user previously downloaded a backup.
