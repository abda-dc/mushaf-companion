import type { EducationCitation } from "./education-content.ts";

export type EducationCitationAction = "trusted-quran-navigation" | "external-source" | "plain-source";
export type EducationCitationRole = "assessment-provenance-only" | "source-reference";

export interface EducationCitationPresentation {
  readonly category: string;
  readonly display: string;
  readonly accessibleLabel: string;
  readonly action: EducationCitationAction;
  readonly role: EducationCitationRole;
  readonly href: string | null;
  readonly externalRel: "noopener noreferrer" | null;
}

export const EDUCATION_CITATION_LABELS: Readonly<Record<EducationCitation["type"], string>>;
export function describeEducationCitation(citation: EducationCitation): Readonly<EducationCitationPresentation>;
