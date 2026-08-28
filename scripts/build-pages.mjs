import { buildStaticRuntime } from "./build-static-runtime.mjs";

const result = await buildStaticRuntime("pages");
console.log(`Standalone GitHub Pages reader built at ${result.outputDirectory}`);
console.log(`Verified Amharic package: ${result.amharicRecords} ayat, ${result.amharicChecksum}`);
