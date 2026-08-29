import "./admin-ui.css";
import { pageKeyFromPath } from "./admin-routes.js";

const PAGE_MODULES = {
  "index.html": () => import("./wire-control-center.js"),
  "index2.html": () => import("./wire-scheduling-workforce.js"),
  "index3.html": () => import("./wire-clinical-quality.js"),
  "index4.html": () => import("./wire-business-performance.js"),
  "operations.html": () => import("./wire-operations.js"),
  "chartjs.html": () => import("./wire-chartjs.js"),
  "calendar.html": () => import("./wire-calendar.js"),
  "inbox.html": () => import("./wire-inbox.js"),
  "staff.html": () => import("./wire-staff-access.js")
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

  const loadPageModule = PAGE_MODULES[page] || PAGE_MODULES["operations.html"];
  const module = await loadPageModule();
  await module.initPage?.();
  document.documentElement.dataset.serenityReady = "true";
}

boot().catch((error) => {
  const root = document.getElementById("serenity-app") || document.body;
  root.innerHTML = `<div class="serenity-boot-failure"><strong>Serenity Admin could not start.</strong><span>${String(error?.message || "Please refresh and try again.")}</span></div>`;
});
