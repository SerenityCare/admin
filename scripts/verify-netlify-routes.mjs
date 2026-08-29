import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const expected = new Map([
  ["/login", "/production/login.html"],
  ["/dashboard", "/production/index.html"],
  ["/scheduling", "/production/index2.html"],
  ["/clinical", "/production/index3.html"],
  ["/finance", "/production/index4.html"],
  ["/operations", "/production/operations.html"],
  ["/reports", "/production/chartjs.html"],
  ["/calendar", "/production/calendar.html"],
  ["/inbox", "/production/inbox.html"],
  ["/staff", "/production/staff.html"]
]);

const failures = [];
const netlifyPath = join(root, "netlify.toml");
const routesPath = join(root, "src", "serenity-admin", "admin-routes.js");
const vitePath = join(root, "vite.config.js");
const apiPath = join(root, "src", "serenity-admin", "admin-api.js");

for (const path of [netlifyPath, routesPath, vitePath, apiPath, join(root, "public", "404.html")]) {
  if (!existsSync(path)) failures.push(`Missing required deployment file: ${path}`);
}

const netlify = existsSync(netlifyPath) ? readFileSync(netlifyPath, "utf8") : "";
const routes = existsSync(routesPath) ? readFileSync(routesPath, "utf8") : "";
const vite = existsSync(vitePath) ? readFileSync(vitePath, "utf8") : "";
const api = existsSync(apiPath) ? readFileSync(apiPath, "utf8") : "";

if (!netlify.includes('pretty_urls = true')) failures.push("Netlify Pretty URLs is not enabled.");
if (!netlify.includes('VITE_SERENITY_ADMIN_API_BASE = "https://serenity-backend-mseu.onrender.com/api/admin"')) {
  failures.push("Netlify production API base is missing or incorrect.");
}
if (!api.includes('https://serenity-backend-mseu.onrender.com/api/admin')) {
  failures.push("Admin API production fallback is missing or incorrect.");
}

for (const [publicRoute, target] of expected) {
  const targetFile = join(root, target.replace(/^\//, ""));
  if (!existsSync(targetFile)) failures.push(`${publicRoute} targets missing file ${target}`);
  if (!netlify.includes(`from = "${publicRoute}"`) || !netlify.includes(`to = "${target}"`)) {
    failures.push(`Netlify route not fully configured: ${publicRoute} -> ${target}`);
  }
  if (!routes.includes(`"${publicRoute}"`) || !routes.includes(`"${target.split("/").pop()}"`)) {
    failures.push(`Application route map is missing ${publicRoute}.`);
  }
  if (!vite.includes(`["${publicRoute}", "${target}"]`)) {
    failures.push(`Vite local/preview route map is missing ${publicRoute} -> ${target}`);
  }
}

const sourceFiles = [
  "admin-utils.js",
  "wire-business-performance.js",
  "wire-calendar.js",
  "wire-clinical-quality.js",
  "wire-control-center.js",
  "wire-inbox.js",
  "wire-index.js",
  "wire-landing.js",
  "wire-operations.js",
  "wire-scheduling-workforce.js"
].map((name) => join(root, "src", "serenity-admin", name));

const legacyNavigation = /(?:href=["']|window\.location(?:\.href)?\s*=\s*["']|location\.replace\(["'])(?:index2?|index3|index4|operations|chartjs|calendar|inbox|staff|login)\.html/i;
for (const file of sourceFiles) {
  if (!existsSync(file)) continue;
  if (legacyNavigation.test(readFileSync(file, "utf8"))) failures.push(`Legacy .html navigation remains in ${file}`);
}

if (failures.length) {
  console.error("Serenity Admin route verification FAILED:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Serenity Admin route verification passed (${expected.size} pretty routes).`);
console.log("Production API: https://serenity-backend-mseu.onrender.com/api/admin");
