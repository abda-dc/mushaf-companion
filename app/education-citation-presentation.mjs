export const EDUCATION_CITATION_LABELS = Object.freeze({
  quran: "QUR'AN",
  hadith: "HADITH",
  scholarly: "SCHOLARLY SOURCE",
  curriculum: "CURRICULUM SOURCE",
  assessment: "ASSESSMENT SOURCE",
  source: "LEGACY SOURCE",
});

export function describeEducationCitation(citation) {
  const category = EDUCATION_CITATION_LABELS[citation.type];
  let display;
  switch (citation.type) {
    case "quran": display = `${citation.label} · ${citation.verseKey}`; break;
    case "source": display = `${citation.title} · ${citation.locator}`; break;
    case "hadith": display = `${citation.workTitle} · ${citation.locator}`; break;
    case "scholarly": display = `${citation.author} · ${citation.workTitle} · ${citation.locator}`; break;
    case "curriculum": display = `${citation.title} · revision ${citation.revision} · ${citation.locator}`; break;
    case "assessment": display = `${citation.title} · revision ${citation.revision} · ${citation.locator}`; break;
    default: throw new TypeError("Unsupported education citation type.");
  }
  const action = citation.type === "quran" ? "trusted-quran-navigation" : citation.sourceUrl ? "external-source" : "plain-source";
  const role = citation.type === "assessment" ? "assessment-provenance-only" : "source-reference";
  return Object.freeze({
    category,
    display,
    accessibleLabel: `${category}: ${display}`,
    action,
    role,
    href: citation.type === "quran" ? null : citation.sourceUrl,
    externalRel: action === "external-source" ? "noopener noreferrer" : null,
  });
}
