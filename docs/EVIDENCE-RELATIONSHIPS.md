# Source-Integrated Evidence Relationships (M8)

## Status

M8 is architecture/source-integration ready pending an approved source. **No production evidence provider is active, and zero evidence edges ship.** The production registry contains only a disabled reference descriptor with no independent approval record.

The approved Ibn Kathir prose integration does not expose a reviewed structured cross-reference field. M8 does not derive links from tafsir prose, keywords, roots, lemmas, translations, nearby occurrences, embeddings, private notes, or AI output. No Quran relationship dataset was invented or copied.

## Independent approval boundary

`app/evidence-layer.ts` separates provider declarations from the application-owned approval policy. An activation policy independently pins the provider ID, source ID, revision, HTTPS provider origin, approval reference, integrity algorithm, expected checksum, normalization version, rights policy, and delivery capabilities.

Provider metadata cannot change those values. Before audit activation, the registry also calls a policy-owned integrity verifier and requires its calculated identity to match the independently approved checksum and normalization. If that verifier is absent, throws, or cannot return an exact verified result, the provider remains unavailable.

The provider audit is a second check, not the trust root. `audit.valid` must be the boolean `true`; truthy strings, numbers, and objects fail. The audit provider/source/revision/origin/approval identity, checksum, normalization, mapping counts, and verified statuses must all match the pinned approval and provider metadata.

## Rights and delivery modes

Rights are explicit for application use, redistribution, modification, offline use, and bundling. The independent approval also pins the provider capabilities that determine which rights are applicable:

- application use is always required;
- a bundled provider requires redistribution and bundling permission;
- offline storage requires offline-use permission;
- transformed content requires modification permission;
- a remote-query provider that is not bundled does not need bundling permission.

Every applicable right must be `permitted`. Unknown or prohibited required rights fail closed. Irrelevant rights are not required merely to populate a checklist.

## Query and adapter integrity

Metadata, independent integrity verification/normalization, audit, query, source resolver, target resolver, and citation validation are controlled boundaries. Throws, malformed result objects, unsafe URLs, non-string reasons, invalid Quran anchors, mismatched totals, oversized responses, inferred/synthetic relationships, and provider provenance mismatches become normalized `disabled`, `unavailable`, or `error` results. Raw provider objects and thrown messages do not flow into React.

Every accepted edge receives a canonical semantic identity derived from provider ID, provider revision, source and target anchors, relationship type, and citation identity. An arbitrary provider edge ID remains inspectable metadata but cannot make the same claim appear twice. Different approved providers remain separate evidence records, and a newly reviewed provider revision has a distinct identity.

## Partial coverage

Multi-provider execution uses settled results. Successful relationships remain visible when another provider is unavailable or fails. That result is `partial`, includes normalized per-provider failures, and sets `coverageComplete: false`. A successful zero plus any failed source is not an authoritative zero. Only an all-successful audited query may return complete zero coverage.

## UI and authority wording

Loading and disabled states use neutral **Evidence** wording. Disabled production state says that evidence sources are unavailable and no approved source is enabled. Failure states make no verification claim. **Source-verified relationship** and **Provider audited** appear only for cards/results whose provider passed independent approval, integrity verification, runtime audit, and trusted Quran mapping. Partial results explicitly state that some source-backed evidence is available while coverage is incomplete.

Evidence remains lazy: opening the reader does not activate or query a provider. The registry is queried only when the Evidence tab is selected, and a latest-request gate prevents stale ayah results from replacing a newer request.

## Remaining source work

A future production source still needs an independently reviewed approval record, rights decision, pinned normalized checksum, policy-owned runtime integrity verifier, provider adapter, citation/coordinate audit, and final source review. The trust gate must not be relaxed merely to populate the UI.
