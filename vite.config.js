import { defineConfig } from "vite";
import { resolve } from "path";

const adminPages = ["index", "index2", "index3", "index4", "operations", "chartjs", "calendar", "inbox", "staff", "login"];
const pageInputs = Object.fromEntries(adminPages.map((page) => [page, resolve(__dirname, `production/${page}.html`)]));

const prettyRouteTargets = new Map([
  ["/", "/production/login.html"],
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

function normalizePath(pathname = "/") {
  if (!pathname) return "/";
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return path || "/";
}

function rewritePrettyRoute(req) {
  if (!req.url) return;
  const parsed = new URL(req.url, "http://localhost");
  const target = prettyRouteTargets.get(normalizePath(parsed.pathname));
  if (!target) return;
  req.url = `${target}${parsed.search}`;
}

function serenityPrettyRoutes() {
  return {
    name: "serenity-pretty-routes",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewritePrettyRoute(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewritePrettyRoute(req);
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => ({
  root: ".",
  base: "/",
  publicDir: "public",
  clearScreen: false,
  plugins: [serenityPrettyRoutes()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
    rollupOptions: {
      input: pageInputs,
      output: {
        chunkFileNames: "js/[name]-[hash].js",
        entryFileNames: "js/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  },
  server: { open: "/login", port: 3000, host: true, hmr: { overlay: false } },
  preview: { open: "/login", port: 3000, host: true },
  css: { preprocessorOptions: { scss: { includePaths: ["node_modules"], silenceDeprecations: ["legacy-js-api", "import", "global-builtin", "color-functions"] } } },
  define: { global: "globalThis", "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development") }
}));
