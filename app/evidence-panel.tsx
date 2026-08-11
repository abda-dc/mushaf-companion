"use client";

import { evidencePresentation, type EvidenceQueryResult, type ResolvedEvidenceEdge } from "./evidence-layer";

interface EvidencePanelProps {
  result: EvidenceQueryResult | { status: "loading" };
  onOpenAyah: (edge: ResolvedEvidenceEdge) => void;
}

function relationshipLabel(value: ResolvedEvidenceEdge["relationshipType"]) {
  if (value === "cross_reference") return "Source-defined Quran cross-reference";
  if (value === "tafsir_reference") return "Explicit Quran reference in tafsir";
  return "Source-defined related passage";
}

function EvidenceCard({ edge, onOpenAyah }: { edge: ResolvedEvidenceEdge; onOpenAyah: EvidencePanelProps["onOpenAyah"] }) {
  return <article className="evidence-card">
    <header><div><span>SOURCE-VERIFIED RELATIONSHIP</span><strong>{edge.from.verseKey} → {edge.to.verseKey}</strong></div><small>{relationshipLabel(edge.relationshipType)}</small></header>
    <p>{edge.label}</p>
    <dl><div><dt>Source</dt><dd>{edge.source.provider.sourceTitle}</dd></div><div><dt>Author/compiler</dt><dd>{edge.source.provider.authorOrCompiler}</dd></div><div><dt>Edition</dt><dd>{edge.source.provider.edition}</dd></div><div><dt>Provider</dt><dd>{edge.source.provider.name}</dd></div><div><dt>Reference</dt><dd>{edge.citation.locator}</dd></div><div><dt>Revision</dt><dd>{edge.revision}</dd></div><div><dt>Runtime audit</dt><dd>Provider audited · {edge.sourceAudit.auditedAt.slice(0, 10)}</dd></div></dl>
    <div className="evidence-actions"><button type="button" className="context-primary" onClick={() => onOpenAyah(edge)}>Open ayah {edge.to.verseKey}</button><a href={edge.citation.sourceUrl} target="_blank" rel="noreferrer">View source</a></div>
    <details><summary>Source, rights, and approval identity</summary><p>{edge.source.rights.attribution}</p><small>{edge.source.rights.license} · approval {edge.sourceApproval.approvalReference} · pinned {edge.sourceApproval.integrityAlgorithm} {edge.sourceApproval.expectedChecksum.slice(0, 12)}… · Quran mapping {edge.sourceAudit.contentMapping.status} · {edge.source.methodology.description}</small></details>
  </article>;
}

export function EvidencePanel({ result, onOpenAyah }: EvidencePanelProps) {
  const presentation = evidencePresentation(result);
  const items = result.status === "ok" || result.status === "partial" ? result.items : [];
  return <div className="evidence-tab-content">
    <section className="source-content-banner" aria-label="Evidence source runtime status"><span>{presentation.eyebrow}</span><strong>{presentation.title}</strong><p>{presentation.description}</p></section>
    {result.status === "loading" && <div className="evidence-state" role="status"><strong>{presentation.stateTitle}</strong><p>{presentation.stateDescription}</p></div>}
    {result.status === "disabled" && <div className="evidence-state evidence-disabled" role="status"><strong>{presentation.stateTitle}</strong><p>{presentation.stateDescription}</p><small>The source-integration architecture is ready, but zero production evidence edges ship.</small></div>}
    {(result.status === "unavailable" || result.status === "error") && <div className="evidence-state evidence-error" role="alert"><strong>{presentation.stateTitle}</strong><p>{presentation.stateDescription}</p><small>This failure is not presented as zero evidence.</small></div>}
    {result.status === "partial" && <div className="evidence-state evidence-partial" role="status"><strong>{presentation.stateTitle}</strong><p>{presentation.stateDescription}</p><ul>{result.failures.map((failure, index) => <li key={`${failure.providerId}|${failure.status}|${index}`}>{failure.providerId}: {failure.status}</li>)}</ul></div>}
    {result.status === "ok" && result.total === 0 && <div className="evidence-state" role="status"><strong>{presentation.stateTitle}</strong><p>{presentation.stateDescription}</p></div>}
    {items.length > 0 && <section className="evidence-results" aria-label={`${items.length} source evidence relationships`}>
      <header><span>{result.status === "partial" ? "AVAILABLE RELATIONSHIPS" : "RELATED QURAN PASSAGES"}</span><strong>{items.length} sourced {items.length === 1 ? "relationship" : "relationships"}</strong></header>
      {items.map((edge) => <EvidenceCard edge={edge} onOpenAyah={onOpenAyah} key={edge.canonicalId} />)}
    </section>}
  </div>;
}
