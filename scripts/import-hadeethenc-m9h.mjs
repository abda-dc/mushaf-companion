/**
 * M9H HadeethEnc English Translation Ingestion Script
 *
 * Extracts and verifies the exact English hadith translations for approved
 * records from the official HadeethEnc Excel workbook (v1.25.0).
 *
 * NOTE: The source workbook is strictly read-only and is NOT modified.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

export const APPROVED_HADEETHENC_IDS = Object.freeze([
  "4563",
  "3272",
  "65046",
  "5460",
  "65038",
  "5493",
  "65000",
  "4968",
  "3689",
  "65003",
  "2758",
  "65007",
  "64673",
  "5913",
  "6078",
  "3686",
  "6383",
  "5504",
  "5497",
  "4182",
  "4965",
  "4935",
  "4308",
  "65004",
  "3313",
  "3316",
  "3534",
  "4314",
  "64643",
  "3785",
  "5918",
  "5888",
  "5502",
  "8402",
  "5485",
  "3232",
  "66232",
  "4206",
  "8345",
  "3165",
  "10404",
  "3370",
  "66511",
  "4302",
]);

const EXPECTED_MANIFEST = {
  language: "English",
  source: "https://hadeethenc.com/en",
  lastUpdate: "2026-05-10 17:43:35",
  version: "v1.25.0",
  checkUrl: "https://hadeethenc.com/en/check/en/v1.25.0",
};

const EXPECTED_HEADERS = [
  "id",
  "title_ar",
  "title",
  "hadith_text_ar",
  "hadith_text",
  "explanation_ar",
  "explanation",
  "benefits_ar",
  "benefits",
  "grade_ar",
  "takhrij_ar",
  "grade",
  "takhrij",
  "lang",
  "link",
];

/**
 * Pure Node XLSX Zip Extractor (Zero External Dependencies)
 */
function readXlsxZip(buffer) {
  const files = {};
  let offset = 0;
  while (offset < buffer.length - 4) {
    const sig = buffer.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const compression = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const uncompSize = buffer.readUInt32LE(offset + 22);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const name = buffer.toString("utf8", offset + 30, offset + 30 + nameLen);
    const dataStart = offset + 30 + nameLen + extraLen;
    const dataEnd = dataStart + compSize;
    const rawData = buffer.subarray(dataStart, dataEnd);
    if (compression === 0) {
      files[name] = rawData;
    } else if (compression === 8) {
      files[name] = zlib.inflateRawSync(rawData);
    }
    offset = dataEnd;
  }
  return files;
}

/**
 * Parses shared strings table from sharedStrings.xml
 */
function parseSharedStrings(xmlString) {
  const strings = [];
  const sstMatches = xmlString.match(/<si>[\s\S]*?<\/si>/g) || [];
  for (const si of sstMatches) {
    const tMatches = [...si.matchAll(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => m[1]);
    let str = tMatches.join("");
    str = str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    strings.push(str);
  }
  return strings;
}

/**
 * Ingests the approved HadeethEnc records from the given workbook path.
 *
 * @param {string} workbookPath
 * @returns {object}
 */
export function ingestHadeethEncWorkbook(workbookPath) {
  if (!fs.existsSync(workbookPath)) {
    throw new Error(`Workbook not found at '${workbookPath}'`);
  }

  const fileBuffer = fs.readFileSync(workbookPath);
  const workbookChecksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  const zip = readXlsxZip(fileBuffer);
  if (!zip["xl/sharedStrings.xml"] || !zip["xl/worksheets/sheet1.xml"]) {
    throw new Error("Invalid XLSX workbook structure: missing sharedStrings.xml or sheet1.xml");
  }

  const strings = parseSharedStrings(zip["xl/sharedStrings.xml"].toString("utf8"));
  const sheetXml = zip["xl/worksheets/sheet1.xml"].toString("utf8");

  const rowMatches = sheetXml.match(/<row\s+r="(\d+)"[\s\S]*?<\/row>/g) || [];
  if (rowMatches.length < 3) {
    throw new Error("Workbook contains insufficient rows");
  }

  // Row 1: Source Manifest Transcript
  const row1Xml = rowMatches[0];
  const row1CellMatch = row1Xml.match(/<c\s+r="A1"(?:\s+t="([^"]+)")?[^>]*>(?:<v>([\s\S]*?)<\/v>)?<\/c>/);
  if (!row1CellMatch) {
    throw new Error("Row 1 manifest cell A1 is missing");
  }
  const row1Type = row1CellMatch[1];
  const row1Val = row1CellMatch[2] ?? "";
  const row1Text = row1Type === "s" ? strings[parseInt(row1Val, 10)] : row1Val;

  if (!row1Text.includes("Translated Prophetic Hadiths") ||
      !row1Text.includes("Language: English") ||
      !row1Text.includes("Source: https://hadeethenc.com/en") ||
      !row1Text.includes("Last update: 2026-05-10 17:43:35 (v1.25.0)") ||
      !row1Text.includes("Check for updates: https://hadeethenc.com/en/check/en/v1.25.0")) {
    throw new Error("Row 1 manifest does not match expected HadeethEnc English v1.25.0 transcript");
  }

  // Row 2: Headers
  const row2Xml = rowMatches[1];
  const headerCells = [...row2Xml.matchAll(/<c\s+r="([A-Z]+)2"(?:\s+t="([^"]+)")?[^>]*>(?:<v>([\s\S]*?)<\/v>)?<\/c>/g)];
  const headers = headerCells.map((c) => {
    const type = c[2];
    const val = c[3] ?? "";
    return type === "s" ? strings[parseInt(val, 10)] : val;
  });

  for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
    if (headers[i] !== EXPECTED_HEADERS[i]) {
      throw new Error(`Header mismatch at column ${i + 1}: expected '${EXPECTED_HEADERS[i]}', got '${headers[i]}'`);
    }
  }

  // Rows 3+: Data extraction
  const approvedSet = new Set(APPROVED_HADEETHENC_IDS);
  const extractedRecords = new Map();
  const seenIds = new Set();

  for (let i = 2; i < rowMatches.length; i++) {
    const rowXml = rowMatches[i];
    const rMatch = rowXml.match(/^<row\s+r="(\d+)"/);
    if (!rMatch) continue;

    const cells = {};
    const cMatches = [...rowXml.matchAll(/<c\s+r="([A-Z]+)\d+"(?:\s+t="([^"]+)")?[^>]*>(?:<v>([\s\S]*?)<\/v>)?<\/c>/g)];
    for (const c of cMatches) {
      const colName = c[1];
      const type = c[2];
      const val = c[3] ?? "";
      cells[colName] = type === "s" ? strings[parseInt(val, 10)] : val;
    }

    const id = cells["A"] ? String(cells["A"]).trim() : "";
    if (!id) continue;

    if (seenIds.has(id)) {
      throw new Error(`Duplicate workbook ID '${id}' detected in workbook`);
    }
    seenIds.add(id);

    if (approvedSet.has(id)) {
      const title = cells["C"] ? String(cells["C"]).trim() : "";
      const hadith_text = cells["E"] ? String(cells["E"]) : ""; // exact text, preserve whitespace
      const grade = cells["L"] ? String(cells["L"]).trim() : "";
      const takhrij = cells["M"] ? String(cells["M"]).trim() : "";
      const lang = cells["N"] ? String(cells["N"]).trim() : "";
      const link = cells["O"] ? String(cells["O"]).trim() : "";

      if (lang !== "en") {
        throw new Error(`Record ${id} has invalid language '${lang}', expected 'en'`);
      }
      if (!hadith_text || hadith_text.length === 0) {
        throw new Error(`Record ${id} has empty hadith_text`);
      }
      if (!link.startsWith("https://hadeethenc.com/en/browse/hadith/")) {
        throw new Error(`Record ${id} link '${link}' is not a valid HTTPS HadeethEnc URL`);
      }
      if (link !== `https://hadeethenc.com/en/browse/hadith/${id}`) {
        throw new Error(`Record ${id} link '${link}' does not match record ID`);
      }

      const sha256 = crypto.createHash("sha256").update(hadith_text, "utf8").digest("hex");

      extractedRecords.set(id, {
        id,
        title,
        hadith_text,
        grade,
        takhrij,
        lang,
        link,
        sha256,
        charCount: hadith_text.length,
      });
    }
  }

  // Ensure all approved IDs were found
  for (const requiredId of APPROVED_HADEETHENC_IDS) {
    if (!extractedRecords.has(requiredId)) {
      throw new Error(`Required approved HadeethEnc ID '${requiredId}' was not found in workbook`);
    }
  }

  const manifest = {
    provider: "hadeethenc",
    language: "en",
    datasetVersion: "v1.25.0",
    lastUpdated: "2026-05-10 17:43:35",
    sourceUrl: "https://hadeethenc.com/en",
    updateCheckUrl: "https://hadeethenc.com/en/check/en/v1.25.0",
    sourceFileName: "HadeethEnc.com_en-v1.25.0.xlsx",
    rightsPolicy: "approved-redistribution",
    attribution: "HadeethEnc.com",
    contentScope: "translated-hadith-text",
    workbookChecksum,
    recordCount: extractedRecords.size,
  };

  const recordsArray = APPROVED_HADEETHENC_IDS.map((id) => extractedRecords.get(id));

  return {
    manifest,
    records: recordsArray,
    recordsById: Object.fromEntries(extractedRecords.entries()),
  };
}

/**
 * Generates the JavaScript module content for content/hadith/hadeethenc-en-v1.25.0.mjs
 */
export function generateDatasetModuleContent(ingested) {
  const { manifest, recordsById } = ingested;

  return `/**
 * HadeethEnc English Translation Dataset (v1.25.0)
 *
 * Sourced directly from official HadeethEnc.com_en-v1.25.0.xlsx workbook.
 * Auto-generated by scripts/import-hadeethenc-m9h.mjs.
 *
 * DO NOT EDIT DIRECTLY.
 */

export const HADEETHENC_DATASET_MANIFEST = Object.freeze(${JSON.stringify(manifest, null, 2)});

export const HADEETHENC_ENGLISH_TRANSLATIONS = Object.freeze(${JSON.stringify(recordsById, null, 2)});
`;
}

// -----------------------------------------------------------------------------
// CLI Execution
// -----------------------------------------------------------------------------

const isMainModule = process.argv[1] && (
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")) ||
  import.meta.url.endsWith(path.basename(process.argv[1]))
);

if (isMainModule) {
  const defaultPath = path.resolve("C:/Users/Kiya/Downloads/HadeethEnc.com_en-v1.25.0.xlsx");
  const workbookPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultPath;

  console.log(`Ingesting HadeethEnc workbook from: ${workbookPath}`);
  const ingested = ingestHadeethEncWorkbook(workbookPath);

  const outputDir = path.resolve("content/hadith");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "hadeethenc-en-v1.25.0.mjs");
  fs.writeFileSync(outputPath, generateDatasetModuleContent(ingested), "utf8");

  console.log(`Successfully generated: ${outputPath}`);
  console.log(`Ingested ${ingested.records.length} records. Workbook SHA-256: ${ingested.manifest.workbookChecksum}`);
}
