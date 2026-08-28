import { buildStaticRuntime } from "./build-static-runtime.mjs";

const result = await buildStaticRuntime("native");
console.log(`Deterministic native reader built at ${result.outputDirectory}`);
console.log(`Native build identity: ${result.buildIdentity}`);
console.log(`Verified Amharic package: ${result.amharicRecords} ayat, ${result.amharicChecksum}`);
