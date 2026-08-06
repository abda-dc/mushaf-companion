export interface TafsirResource {
  id: 169;
  name: string;
  author: string;
  language: "en";
  edition: string;
  revision: string;
  source: string;
  sourceUrl: string;
  attribution: string;
  license: string;
}

export interface TafsirBlock {
  type: "heading" | "paragraph" | "quote" | "list-item";
  text: string;
}

export interface TafsirDocument {
  schemaVersion: 1;
  requestedVerseKey: string;
  mappedVerseKeys: string[];
  sectionLabel: string;
  resource: TafsirResource;
  blocks: TafsirBlock[];
  provenance: {
    verified: true;
    checksumAlgorithm: "SHA-256";
    contentChecksum: string;
    sourceRevision: string;
  };
}

export const TAFSIR_RESOURCE: Readonly<TafsirResource>;
export function normalizeTafsirBlocks(html: unknown): TafsirBlock[];
export function normalizeTafsirPayload(payload: unknown, requestedVerseKey: string): Omit<TafsirDocument, "provenance">;
