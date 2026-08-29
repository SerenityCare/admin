export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export function formatShortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
}

export function setText(selectorOrId, value) {
  const el =
    document.getElementById(selectorOrId) ||
    document.querySelector(selectorOrId);

  if (el) el.textContent = value ?? "";
}

export function setHtml(selectorOrId, value) {
  const el =
    document.getElementById(selectorOrId) ||
    document.querySelector(selectorOrId);

  if (el) el.innerHTML = value ?? "";
}

export function safeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

export function statusBadge(status) {
  const safe = escapeHtml(status || "unknown");
  const normalized = String(status || "").toLowerCase();

  let color = "secondary";

  if (["new", "pending", "active", "confirmed"].includes(normalized)) {
    color = "primary";
  }

  if (["contacted", "scheduled", "completed", "replied", "closed"].includes(normalized)) {
    color = "success";
  }

  if (["cancelled", "no_show", "spam", "archived"].includes(normalized)) {
    color = "danger";
  }

  if (["read", "rescheduled"].includes(normalized)) {
    color = "warning";
  }

  return `<span class="badge bg-${color}">${safe}</span>`;
}

export function renderEmptyRow(colspan, message = "No records found.") {
  return `<tr><td colspan="${colspan}" class="text-center text-muted">${escapeHtml(message)}</td></tr>`;
}

export function getFirstExistingSelector(selectors = []) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) return el;
  }

  return null;
}

export function getAllExistingSelector(selectors = []) {
  for (const selector of selectors) {
    const els = document.querySelectorAll(selector);
    if (els.length) return Array.from(els);
  }

  return [];
}

export function showAdminError(message) {
  console.error("[Serenity Admin]", message);

  let box = document.getElementById("serenity-admin-error");

  if (!box) {
    const target =
      document.querySelector(".page-title") ||
      document.querySelector(".right_col") ||
      document.body;

    box = document.createElement("div");
    box.id = "serenity-admin-error";
    box.className = "alert alert-danger";

    if (target === document.body) {
      document.body.prepend(box);
    } else {
      target.insertAdjacentElement("afterend", box);
    }
  }

  box.classList.remove("d-none");
  box.textContent = message || "Unable to load Serenity admin data.";
}

export function clearAdminError() {
  const box = document.getElementById("serenity-admin-error");
  if (!box) return;
  box.classList.add("d-none");
  box.textContent = "";
}

export function statusSelect(current, options = []) {
  return `
    <select class="form-select form-select-sm serenity-status-select">
      ${options
        .map(
          (option) =>
            `<option value="${escapeHtml(option)}" ${
              option === current ? "selected" : ""
            }>${escapeHtml(option)}</option>`
        )
        .join("")}
    </select>
  `;
}

export function updateTileByIndex(index, value, label = "") {
  const tile = document.querySelectorAll(".tile_count .tile_stats_count")[index];
  if (!tile) return;

  const count = tile.querySelector(".count");
  const labelEl = tile.querySelector(".count_top");

  if (count) count.textContent = value ?? "0";
  if (label && labelEl) labelEl.innerHTML = label;
}

export function updateAnyCountByIndex(index, value) {
  const candidates = [
    ".tile_count .tile_stats_count .count",
    ".count",
    ".dashboard-widget-content .count",
    ".animated .count"
  ];

  const counts = getAllExistingSelector(candidates);
  if (counts[index]) counts[index].textContent = value ?? "0";
}

export function replaceFirstTableBody(html) {
  const body =
    document.querySelector("#datatable tbody") ||
    document.querySelector("#datatable-responsive tbody") ||
    document.querySelector(".dataTable tbody") ||
    document.querySelector("table tbody");

  if (body) body.innerHTML = html;
}

export function replacePanelTableByIndex(index, html) {
  const bodies = Array.from(document.querySelectorAll(".x_panel table tbody, table tbody"));
  if (bodies[index]) bodies[index].innerHTML = html;
}

export function updatePanelTitleByIndex(index, title) {
  const titles = Array.from(document.querySelectorAll(".x_panel .x_title h2, .x_panel .x_title h4"));
  if (titles[index]) titles[index].innerHTML = title;
}

export function renderMessageDropdown(rows = []) {
  const list = document.querySelector(".msg_list");
  const badge = document.querySelector(".info-number .badge");

  if (badge) badge.textContent = rows.length;

  if (!list) return;

  if (!rows.length) {
    list.innerHTML = `
      <li class="nav-item">
        <a class="dropdown-item">
          <span class="message">No new Serenity messages.</span>
        </a>
      </li>
    `;
    return;
  }

  list.innerHTML = rows
    .slice(0, 5)
    .map(
      (row) => `
        <li class="nav-item">
          <a class="dropdown-item" href="/inbox">
            <span class="image"><img src="images/img.jpg" alt="Profile Image" /></span>
            <span>
              <span>${escapeHtml(row.full_name || row.user_name || row.email || "Serenity visitor")}</span>
              <span class="time">${escapeHtml(formatShortDate(row.created_at || row.last_message_at))}</span>
            </span>
            <span class="message">
              ${escapeHtml(row.message || row.latest_message_text || row.subject || row.last_intent || "New Serenity activity")}
            </span>
          </a>
        </li>
      `
    )
    .join("");
}

export function tryInitDataTable() {
  const table =
    document.querySelector("#datatable") ||
    document.querySelector("#datatable-responsive") ||
    document.querySelector("table");

  if (!table || !window.DataTable) return;

  try {
    if (window.DataTable.isDataTable?.(table)) return;
    new window.DataTable(table);
  } catch (error) {
    console.warn("[Serenity Admin] DataTable init skipped:", error);
  }
}

export function dispatchSerenityEvent(name, detail = {}) {
  window.dispatchEvent(
    new CustomEvent(name, {
      detail
    })
  );
}