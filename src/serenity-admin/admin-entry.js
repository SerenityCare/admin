import "./admin-ui.css";
import { pageKeyFromPath } from "./admin-routes.js";

const PAGE_MODULES = {
  "index.html": "./wire-control-center.js",
  "index2.html": "./wire-scheduling-workforce.js",
  "index3.html": "./wire-clinical-quality.js",
  "index4.html": "./wire-business-performance.js",
  "operations.html": "./wire-operations.js",
  "chartjs.html": "./wire-chartjs.js",
  "calendar.html": "./wire-calendar.js",
  "inbox.html": "./wire-inbox.js",
  "staff.html": "./wire-staff-access.js"
};

function domReady() {
  if (document.readyState !== "loading") return Promise.resolve();
  return new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
}

async function boot() {
  await domReady();
  const page = pageKeyFromPath();

  if (page === "login.html") {
    const module = await import("./wire-login.js");
    await module.initLogin?.();
    return;
  }

  const { initAdminLayout } = await import("./admin-layout.js");
  const user = await initAdminLayout();
  if (!user) return;

  const modulePath = PAGE_MODULES[page] || "./wire-operations.js";
  const module = await import(modulePath);
  await module.initPage?.();
  document.documentElement.dataset.serenityReady = "true";
}

boot().catch((error) => {
  const root = document.getElementById("serenity-app") || document.body;
  root.innerHTML = `<div class="serenity-boot-failure"><strong>Serenity Admin could not start.</strong><span>${String(error?.message || "Please refresh and try again.")}</span></div>`;
});
