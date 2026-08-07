import {
  TRANSLATION_SOURCE_REGISTRY,
  TRANSLATION_SOURCE_REGISTRY_MANIFEST,
} from "../app/content/source-registry.ts";
import {
  assertSourceCanBeEnabled,
  assertSourceRegistryEntryShape,
  validateSourceForActivation,
} from "../app/content/source-registry.schema.ts";
import { QuranEncTranslationAdapter } from "../app/content/providers/quranenc-translation.ts";
import { QuranFoundationTranslationAdapter } from "../app/content/providers/quran-foundation-translation.ts";

function selectedSourceId(argv) {
  const index = argv.indexOf("--source");
  if (index === -1) return null;
  const value = argv[index + 1];
  if (!value) throw new Error("--source requires an exact source ID.");
  return value;
}

function adapterFor(source) {
  if (source.provider.name === "QuranEnc") return new QuranEncTranslationAdapter(source);
  if (source.provider.name === "Quran Foundation Content API") return new QuranFoundationTranslationAdapter(source);
  throw new Error(`No provider adapter is registered for ${source.provider.name}.`);
}

async function main() {
  const registryOnly = process.argv.includes("--registry-only");
  const requestedSourceId = selectedSourceId(process.argv);
  const sources = requestedSourceId
    ? TRANSLATION_SOURCE_REGISTRY.filter((source) => source.sourceId === requestedSourceId)
    : TRANSLATION_SOURCE_REGISTRY;
  if (!sources.length) throw new Error(`Unknown translation source ID: ${requestedSourceId}.`);

  const sourceIds = new Set();
  for (const source of sources) {
    assertSourceRegistryEntryShape(source);
    if (sourceIds.has(source.sourceId)) throw new Error(`Duplicate registry source ID: ${source.sourceId}.`);
    sourceIds.add(source.sourceId);
    if (source.enabled) assertSourceCanBeEnabled(source);
    const activation = validateSourceForActivation(source);
    if (source.candidateStatus === "approved_candidate" && !activation.valid) throw new Error(`Approved candidate ${source.sourceId} is not activation-eligible: ${activation.errors.join(" ")}`);
    if (source.candidateStatus === "blocked" && activation.valid) throw new Error(`Blocked source ${source.sourceId} has no validated blocker.`);
    if (source.candidateStatus === "blocked" && !source.blockers.length) throw new Error(`Blocked source ${source.sourceId} must document its blockers.`);
    if (source.enabled) throw new Error(`Milestone 1 source ${source.sourceId} must remain disabled.`);

    if (registryOnly) {
      console.log(`${source.sourceId}: registry valid; status=${source.candidateStatus}; enabled=false`);
      continue;
    }

    const adapter = adapterFor(source);
    const acquired = await adapter.acquire({ providerName: source.provider.name, providerId: source.provider.id });
    const records = await adapter.normalize(acquired);
    const report = await adapter.validate(acquired, records);
    if (!report.valid) throw new Error(`${source.sourceId} audit failed: ${report.errors.join(" ")}`);
    console.log(`${source.sourceId}: ${report.coverage.actualSurahs} surahs, ${report.coverage.actualAyahs} ayat, raw=${report.rawChecksum}, normalized=${report.normalizedChecksum}, status=${source.candidateStatus}, enabled=false`);
  }
  console.log(`Translation registry ${TRANSLATION_SOURCE_REGISTRY_MANIFEST.revision}: audit passed for ${sources.length} source(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
