# Analytics and event-tracking requirements

This document defines a vendor-neutral, privacy-conscious analytics contract for future Mushaf Companion releases. It is a requirement specification, not a commitment to a particular analytics provider.

## Objectives

Analytics should answer four product questions:

1. Can readers reliably open, navigate, and resume the mushaf?
2. Which optional learning and audio layers improve continued reading?
3. Where do page, search, audio, and download workflows fail?
4. Do new features preserve a calm reading experience instead of adding friction?

Analytics must not be used to score religious behavior, infer religiosity, advertise to readers, or build cross-product profiles.

## Privacy rules

### Never collect

- Quran text, translation text, tafsir text, or audio files.
- Raw search queries.
- Bookmark labels, notes, reflections, or copied text.
- Email address, full name, IP address stored as an event property, or exact location.
- Browser storage contents.
- Audio provider URLs or authentication credentials.
- A permanent identifier shared with unrelated products.

### Allowed with minimization

- Page number and verse key as content identifiers.
- Translation, tafsir, and reciter edition identifiers.
- Coarse device class, viewport bucket, locale, theme, and connectivity state.
- Anonymous installation and session identifiers scoped only to Mushaf Companion.
- Signed-in account identifier only if account sync is later introduced, using an application-scoped pseudonymous value.

### Consent and controls

- Document analytics in the product privacy notice before collection begins.
- Provide an analytics opt-out in Settings where legally or organizationally required.
- Honor browser privacy signals if required by the selected policy.
- Separate essential reliability telemetry from optional product analytics.
- Do not initialize optional analytics before consent in jurisdictions that require opt-in.
- Remove or hash network identifiers at ingestion; do not depend on IP address for user identity.

## Event implementation contract

Create one typed client/server facade rather than calling a vendor SDK from components:

```ts
track("page_navigation_completed", {
  from_page: 2,
  to_page: 3,
  method: "next_button",
  duration_ms: 184,
});
```

Every event must:

- Use `snake_case` names and properties.
- Include `event_id`, `occurred_at`, `schema_version`, `app_version`, `environment`, `session_id`, and `anonymous_id` in the envelope.
- Pass runtime validation against a versioned schema.
- Be idempotent by `event_id` so offline retries cannot duplicate counts.
- Exclude `localhost`, automated tests, staff/debug sessions, and preview deployments from production metrics.
- Keep payloads under 16 KB.
- Batch non-critical events and never delay a page turn or audio action.
- Queue offline events for at most seven days, then discard them.
- Avoid duplicate emission under React development/strict rendering.

## Shared properties

Use only properties relevant to the event. Do not attach the complete set automatically.

| Property | Type | Notes |
| --- | --- | --- |
| `page_number` | integer 1–604 | Current verified mushaf page. |
| `verse_key` | string | Quran reference such as `2:255`; never verse text. |
| `surah_id` | integer 1–114 | Derive from content metadata. |
| `juz_number` | integer 1–30 | Derive from content metadata. |
| `entry_source` | enum | `resume`, `url`, `home`, `search`, `bookmark`, `audio_follow`, or `default`. |
| `navigation_method` | enum | `previous_button`, `next_button`, `swipe`, `keyboard`, `jump`, `search`, `bookmark`, `audio_follow`, `home_resume`. |
| `device_class` | enum | `mobile`, `tablet`, or `desktop`; do not send exact user-agent strings. |
| `viewport_bucket` | enum | Coarse buckets such as `<480`, `480–767`, `768–1199`, `1200+`. |
| `connectivity` | enum | `online`, `offline`, or `unknown`. |
| `content_revision` | string | Version of the page/translation/tafsir manifest. |
| `reciter_id` | string | Stable internal identifier, not an audio URL. |
| `translation_id` | string | Stable licensed-edition identifier. |
| `tafsir_id` | string | Stable licensed-edition identifier. |

## Required event catalog

### Reader and navigation

| Event | Trigger | Required properties |
| --- | --- | --- |
| `reader_opened` | Reader hydrates and resolves its initial location. | `page_number`, `verse_key`, `entry_source`, `device_class`, `theme` |
| `page_navigation_started` | A valid page change is requested. | `from_page`, `to_page`, `navigation_method` |
| `page_navigation_completed` | Verified target page is rendered and visible. | `from_page`, `to_page`, `navigation_method`, `duration_ms`, `cache_state` |
| `page_navigation_failed` | Target page cannot be verified or rendered. | `from_page`, `to_page`, `navigation_method`, `error_code`, `retry_available` |
| `page_viewed` | A verified page remains visible for at least one second. | `page_number`, `verse_key`, `view_sequence`, `content_revision` |
| `page_jump_submitted` | Direct page jump is submitted. | `from_page`, `to_page`, `valid` |
| `ayah_selected` | Reader explicitly selects an ayah. | `page_number`, `verse_key`, `method` |
| `resume_position_used` | Startup resumes a stored location. | `page_number`, `verse_key`, `age_bucket` |

Do not emit `page_viewed` for adjacent-page prefetching. A page is viewed only after it is visible and the document has focus.

### Reader preferences and settings

| Event | Trigger | Required properties |
| --- | --- | --- |
| `settings_opened` | Settings panel becomes visible. | `entry_point`, `device_class` |
| `setting_changed` | A persisted setting changes. | `setting_name`, `previous_value`, `new_value` |
| `tajweed_toggled` | Tajweed display changes. | `enabled`, `entry_point` |
| `transliteration_toggled` | Transliteration changes. | `enabled`, `entry_point` |
| `theme_changed` | Theme changes. | `previous_theme`, `new_theme` |
| `focus_mode_changed` | Focus mode changes. | `enabled` |

Allowlist `setting_name` and values. Never serialize the full preferences object.

### Search and bookmarks

| Event | Trigger | Required properties |
| --- | --- | --- |
| `search_opened` | Search dialog or sheet becomes visible. | `entry_point`, `page_number` |
| `search_submitted` | Debounced search request is sent. | `query_type`, `query_length_bucket`, `result_count`, `duration_ms`, `success` |
| `search_result_opened` | Search result is activated. | `result_type`, `result_rank`, `destination_page`, `verse_key` when present |
| `bookmark_added` | Ayah bookmark is saved. | `page_number`, `verse_key`, `entry_point` |
| `bookmark_removed` | Bookmark is deleted. | `page_number`, `verse_key`, `entry_point` |
| `bookmark_opened` | Reader navigates from a saved bookmark. | `from_page`, `to_page`, `verse_key` |

`query_type` may be `page`, `ayah_key`, `surah`, or `text`. `query_length_bucket` may be `1–3`, `4–10`, `11–30`, or `31+`. Never send the query itself.

### Audio

| Event | Trigger | Required properties |
| --- | --- | --- |
| `audio_play_requested` | User requests playback. | `page_number`, `verse_key`, `reciter_id`, `source` |
| `audio_play_started` | Audible playback begins. | `page_number`, `verse_key`, `reciter_id`, `source`, `startup_ms` |
| `audio_paused` | User pauses. | `verse_key`, `position_bucket`, `reason` |
| `audio_verse_completed` | Verse playback reaches its end. | `verse_key`, `reciter_id`, `repeat_mode`, `source` |
| `audio_play_failed` | Playback cannot begin or continue. | `verse_key`, `reciter_id`, `source`, `error_code`, `connectivity` |
| `reciter_changed` | Reciter selection changes. | `previous_reciter_id`, `new_reciter_id`, `entry_point` |
| `playback_speed_changed` | Speed changes. | `previous_speed`, `new_speed` |
| `repeat_mode_changed` | Repeat setting changes. | `previous_mode`, `new_mode` |
| `repeat_range_started` | A range begins. | `start_verse_key`, `end_verse_key`, `reciter_id` |
| `audio_follow_page_changed` | Audio causes a page turn. | `from_page`, `to_page`, `verse_key` |

`source` is `stream` or `offline`. Do not infer successful playback from a Play button click; wait for the media `playing` event.

### Translation and tafsir

| Event | Trigger | Required properties |
| --- | --- | --- |
| `translation_opened` | Translation panel becomes visible. | `translation_id`, `page_number`, `verse_key`, `entry_point` |
| `translation_changed` | Translation edition changes. | `previous_translation_id`, `new_translation_id` |
| `translation_load_failed` | Requested translation cannot render. | `translation_id`, `verse_key`, `error_code` |
| `tafsir_opened` | Tafsir panel becomes visible. | `tafsir_id`, `page_number`, `verse_key`, `entry_point` |
| `tafsir_changed` | Tafsir source changes. | `previous_tafsir_id`, `new_tafsir_id` |
| `tafsir_load_failed` | Requested tafsir cannot render. | `tafsir_id`, `verse_key`, `error_code` |
| `study_panel_closed` | Translation or tafsir closes. | `content_type`, `open_duration_bucket`, `return_page`, `return_verse_key` |

Do not track copied passages or exact scroll position. Coarse open-duration buckets are sufficient.

### Offline audio

| Event | Trigger | Required properties |
| --- | --- | --- |
| `download_requested` | User confirms a pack download. | `pack_type`, `pack_id`, `reciter_id`, `estimated_bytes`, `connectivity` |
| `download_started` | First file begins. | `pack_type`, `pack_id`, `reciter_id`, `file_count` |
| `download_progress` | Progress crosses 25%, 50%, or 75%. | `pack_id`, `progress_bucket`, `downloaded_bytes` |
| `download_completed` | All files verify successfully. | `pack_id`, `reciter_id`, `actual_bytes`, `duration_bucket` |
| `download_failed` | Pack enters a failed state. | `pack_id`, `failure_stage`, `error_code`, `retryable` |
| `download_resumed` | Interrupted pack resumes. | `pack_id`, `completed_file_count` |
| `download_deleted` | User removes a pack. | `pack_id`, `reciter_id`, `reclaimed_bytes` |
| `offline_play_started` | Verified local audio starts. | `pack_id`, `verse_key`, `reciter_id` |
| `offline_play_failed` | Local playback fails. | `pack_id`, `verse_key`, `error_code`, `repair_available` |

Progress events must be milestone-based, not emitted per byte or file.

## Product metrics

### Core reader health

- Page-load success rate.
- Median and 95th-percentile page-turn duration.
- Percentage of sessions that resume successfully.
- Sessions with at least two verified pages viewed.
- Audio-start success rate and median startup time.

### Feature adoption

- Tajweed and transliteration usage by session, not by identifiable person.
- Translation open rate and continued reading after translation closes.
- Tafsir open rate and return-to-ayah rate.
- Audio adoption, verses completed, and repeat-mode adoption.
- Bookmark creation-to-return rate.
- Offline pack request, completion, and successful offline playback rates.

### Guardrail metrics

- Page navigation failures.
- Content-layer load failures.
- Audio failures by source and reciter.
- Download corruption/repair rate.
- Sessions with rapid settings reversal, which may indicate confusing controls.
- Performance regression by device and viewport bucket.

## Data quality requirements

- Maintain event schemas in source control and test required/forbidden properties.
- Add automated tests proving raw search queries and text content cannot enter event payloads.
- Use one `page_navigation_started` → terminal completed/failed pair per request.
- Suppress superseded page requests when a user navigates rapidly.
- Generate session summaries from observed events; do not depend on unreliable `session_ended` browser events.
- Monitor unknown event names, schema failures, delivery delay, and duplicate `event_id` rate.
- Version dashboards alongside schema-breaking changes.

## Retention and access baseline

- Suggested raw event retention: 90 days.
- Suggested aggregated metric retention: 13 months.
- Restrict raw-event access to the smallest product/engineering group that needs it.
- Audit exports and administrative access.
- Document deletion behavior for anonymous and future signed-in identifiers.
- Review the event catalog before every release and remove unused properties.

Final retention and consent rules must be approved against the jurisdictions and organizational policies in which the product operates.

## Definition of done for analytics

A feature is instrumented only when:

- Its event schema is reviewed and committed.
- Required and prohibited properties have automated tests.
- Events are verified in development/staging without entering production metrics.
- Dashboard calculations are documented.
- Failure paths are instrumented, not only success paths.
- Consent and opt-out behavior are tested.
- Product behavior remains correct when analytics is blocked or unavailable.
