# Tafsir source, safety, and mapping

Version 1.0.0 delivers the Phase 3 tafsir MVP as an optional selected-ayah study layer. It never changes the Arabic mushaf page, line slots, glyphs, or dimensions.

## Selected source

- Name: Ibn Kathir (Abridged)
- Author: Hafiz Ibn Kathir
- Language: English
- Provider: Quran Foundation/Quran.com Content API
- Resource: 169
- Revision: `2026-08-06-resource-169-v1`
- Source catalog: `https://api.quran.com/api/v4/resources/tafsirs`
- Licensing: upstream content terms apply; Mushaf Companion does not relicense the commentary

No AI-generated explanation, synthetic source mixing, or unattributed excerpt is presented as tafsir.

## Delivery and integrity

1. Server mode uses `GET /api/tafsir?verse=2:255`; Pages mode calls the same CORS-enabled Quran Foundation resource directly. Both validate the requested stable verse key through the shared source module.
2. The server requests Quran Foundation resource 169 and rejects any mismatched resource or verse mapping.
3. Provider HTML is reduced to headings, paragraphs, quotations, and list items. Scripts, embedded objects, attributes, links, and all remaining tags are removed.
4. The browser receives structured text rather than HTML, and React escapes every displayed block.
5. The normalized verse mapping, edition revision, and blocks receive a SHA-256 checksum before delivery.
6. Responses include resource and revision headers plus explicit author, edition, attribution, and licensing text.

## Mapping review

The real source was sampled across both one-to-one and grouped commentary sections:

| Requested ayah | Provider section | Result |
| --- | --- | --- |
| 1:1 | 1:1 | Single-ayah mapping accepted. |
| 2:8 | 2:8–2:9 | Multi-ayah boundary retained. |
| 3:1 | 3:1–3:4 | Multi-ayah boundary retained. |
| 93:1 | 93:1–93:10 | Long grouped section retained. |
| 2:255 | 2:255 | Long single-ayah commentary accepted. |

The study panel always labels the complete provider section. A missing or mismatched section shows an unavailable state and never suppresses verified Arabic content.

## Reader behavior

- Tafsir opens only after an explicit action from the toolbar, mobile assistance controls, Settings, or selected-ayah actions.
- The selected ayah remains visible in the fixed dialog header while commentary scrolls.
- Previous and next controls synchronize the selected ayah and cross page boundaries without closing the study panel.
- Closing the panel returns directly to the selected ayah on the unchanged mushaf page.
- Recently opened sections use in-session memory caching plus ordinary HTTP cache headers. Full offline tafsir is not claimed.

The Ayah Context Lens also exposes this exact document and normalized block model in its Ibn Kathir tab. The standalone tafsir panel, resource 169 identity, source revision, normalization, attribution, and checksum verification remain unchanged. The lens does not translate tafsir.
