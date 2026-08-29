import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const distJs = join(root, "dist", "js");
const expectedChunks = [
  "wire-control-center",
  "wire-scheduling-workforce",
  "wire-clinical-quality",
  "wire-business-performance",
  "wire-operations",
  "wire-chartjs",
  "wire-calendar",
  "wire-inbox",
  "wire-staff-access",
  "wire-login",
  "admin-layout"
];

const failures = [];

if (!existsSync(distJs)) {
  failures.push(`Missing Vite output directory: ${distJs}`);
} else {
  const jsFiles = readdirSync(distJs).filter((name) => name.endsWith(".js"));

  for (const chunk of expectedChunks) {
    const hashedChunkPattern = new RegExp(`^${chunk.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}-[^/]+\\.js$`);
    if (!jsFiles.some((name) => hashedChunkPattern.test(name))) {
      failures.push(`Missing hashed production chunk for ${chunk}.`);
    }
  }

  // A literal un-hashed output file would indicate that Vite did not process the
  // corresponding module. We intentionally do not scan arbitrary string literals
  // inside generated bundles because Vite/Rollup may retain source module names as
  // metadata even when the actual runtime import points to a hashed chunk.
  for (const chunk of expectedChunks) {
    if (jsFiles.includes(`${chunk}.js`)) {
      failures.push(`Unexpected unhashed production file: ${chunk}.js`);
    }
  }
}

if (failures.length) {
  console.error("Serenity Admin production-module verification FAILED:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Serenity Admin production-module verification passed (${expectedChunks.length} hashed lazy/admin chunks).`);
