import { existsSync, readdirSync, readFileSync } from "node:fs";
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
    if (!jsFiles.some((name) => name === `${chunk}.js` || name.startsWith(`${chunk}-`))) {
      failures.push(`Missing production chunk for ${chunk}.`);
    }
  }

  const bundledSource = jsFiles
    .map((name) => readFileSync(join(distJs, name), "utf8"))
    .join("\n");

  const unresolvedWireImport = /["']\.\/wire-[a-z0-9-]+\.js["']/i;
  if (unresolvedWireImport.test(bundledSource)) {
    failures.push("Production bundle still contains an unhashed wire-*.js dynamic import.");
  }
}

if (failures.length) {
  console.error("Serenity Admin production-module verification FAILED:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Serenity Admin production-module verification passed (${expectedChunks.length} lazy/admin chunks).`);
