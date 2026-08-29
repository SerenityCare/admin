const PAGE_PATHS = Object.freeze({
  "login.html": "/login",
  "index.html": "/dashboard",
  "index2.html": "/scheduling",
  "index3.html": "/clinical",
  "index4.html": "/finance",
  "operations.html": "/operations",
  "chartjs.html": "/reports",
  "calendar.html": "/calendar",
  "inbox.html": "/inbox",
  "staff.html": "/staff"
});

const PATH_TO_PAGE = new Map();
for (const [page, path] of Object.entries(PAGE_PATHS)) {
  PATH_TO_PAGE.set(path, page);
  PATH_TO_PAGE.set(`/production/${page}`, page);
  PATH_TO_PAGE.set(`/${page}`, page);
}

function normalizePath(pathname = "/") {
  let path = String(pathname || "/").split("?")[0].split("#")[0] || "/";
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path || "/";
}

export function pageKeyFromPath(pathname = window.location.pathname) {
  const path = normalizePath(pathname);
  if (path === "/") return "login.html";
  return PATH_TO_PAGE.get(path) || "";
}

export function routeForPage(page) {
  return PAGE_PATHS[page] || "/dashboard";
}

export function operationsRoute(resource = "") {
  if (!resource) return routeForPage("operations.html");
  return `${routeForPage("operations.html")}?resource=${encodeURIComponent(resource)}`;
}

export function isLoginPath(pathname = window.location.pathname) {
  return pageKeyFromPath(pathname) === "login.html";
}
