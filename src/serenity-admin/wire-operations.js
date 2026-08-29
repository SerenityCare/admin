import {
  createOperationRow,
  getOperationRows,
  runOperationAction,
  updateOperationRow
} from "./admin-api.js";

let state = {
  resource: new URLSearchParams(window.location.search).get("resource") || "tasks",
  payload: null,
  rows: [],
  formFields: []
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function labelize(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value) {
  const text = String(value || "").toLowerCase();
  if (["urgent", "critical", "overdue", "missed", "cancelled", "declined", "terminated"].some((item) => text.includes(item))) return "is-danger";
  if (["high", "pending", "awaiting", "warning", "open", "reviewing"].some((item) => text.includes(item))) return "is-warning";
  if (["active", "completed", "complete", "paid", "confirmed", "verified", "resolved"].some((item) => text.includes(item))) return "is-success";
  return "is-info";
}

function displayCell(label, value) {
  if (["Status", "Priority", "Risk", "Severity"].includes(label)) {
    return `<span class="serenity-status ${statusClass(value)}">${escapeHtml(labelize(value))}</span>`;
  }
  const text = value === null || value === undefined || value === "" ? "—" : String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      return escapeHtml(new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date));
    }
  }
  return escapeHtml(text);
}

function actionButtons(row, resource) {
  const actions = resource.actions || [];
  if (!actions.length) return "";
  const buttons = [];
  if (actions.includes("edit")) buttons.push('<button class="btn btn-sm btn-outline-primary" data-operation="edit">Edit</button>');
  if (actions.includes("assign")) buttons.push('<button class="btn btn-sm btn-outline-primary" data-operation="assign">Assign</button>');
  if (actions.includes("callback-status")) buttons.push('<button class="btn btn-sm btn-outline-primary" data-operation="callback-status">Update</button>');
  if (actions.includes("start")) buttons.push('<button class="btn btn-sm btn-outline-secondary" data-operation="start">Start</button>');
  if (actions.includes("complete")) buttons.push('<button class="btn btn-sm btn-success" data-operation="complete">Complete</button>');
  if (actions.includes("decline")) buttons.push('<button class="btn btn-sm btn-outline-danger" data-operation="decline">Decline</button>');
  return `<div class="d-flex flex-wrap gap-1">${buttons.join("")}</div>`;
}

function renderRows(rows, resource, columns) {
  if (!rows.length) {
    return `<tr><td colspan="${columns.length + (resource.actions?.length ? 1 : 0)}" class="serenity-empty">No records found.</td></tr>`;
  }
  return rows.map((row, index) => {
    const rowIndex = state.rows.indexOf(row);
    return `
    <tr data-row-index="${rowIndex >= 0 ? rowIndex : index}">
      ${columns.map((column) => `<td>${displayCell(column, row.values?.[column])}</td>`).join("")}
      ${resource.actions?.length ? `<td>${actionButtons(row, resource)}</td>` : ""}
    </tr>
  `;
  }).join("");
}

function renderPage(payload) {
  const target = document.querySelector(".right_col");
  if (!target) return;
  const resource = payload.resource;
  const columns = payload.columns || [];
  const rows = payload.rows || [];
  state.payload = payload;
  state.rows = rows;

  target.innerHTML = `
    <div class="serenity-page">
      <div class="serenity-page-header">
        <div>
          <div class="serenity-resource-title"><h2>${escapeHtml(resource.label)}</h2><span class="badge text-bg-light">${escapeHtml(resource.group)}</span></div>
          <p>Live Serenity records. Changes here use the same operational data used by the mobile app and website.</p>
        </div>
        <div class="serenity-actions">
          ${resource.canCreate ? `<button class="btn btn-success" id="serenity-create-record"><i class="bi bi-plus-lg me-1"></i> New ${escapeHtml(resource.label.replace(/s$/, ""))}</button>` : ""}
          <button class="btn btn-outline-secondary" id="serenity-refresh"><i class="bi bi-arrow-clockwise me-1"></i> Refresh</button>
        </div>
      </div>

      <div class="serenity-card mb-3">
        <div class="serenity-filterbar">
          <div class="input-group" style="max-width:420px">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input class="form-control" id="serenity-resource-search" placeholder="Search ${escapeHtml(resource.label.toLowerCase())}">
          </div>
          <span class="text-muted ms-auto" id="serenity-record-count">${rows.length} record${rows.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      <div class="serenity-card serenity-panel">
        <div class="serenity-table-wrap">
          <table class="serenity-table" id="serenity-resource-table">
            <thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}${resource.actions?.length ? "<th>Actions</th>" : ""}</tr></thead>
            <tbody>${renderRows(rows, resource, columns)}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal fade" id="serenityRecordModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <form id="serenity-record-form">
            <div class="modal-header"><h5 class="modal-title" id="serenity-record-modal-title">${escapeHtml(resource.label)}</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
            <div class="modal-body" id="serenity-record-form-body"></div>
            <div class="modal-footer"><button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button type="submit" class="btn btn-success" id="serenity-record-save">Save</button></div>
          </form>
        </div>
      </div>
    </div>
  `;

  bindPageEvents();
}

function optionsMarkup(field, value) {
  if (field.type === "choice") {
    const options = state.payload?.choices?.[field.source] || [];
    return `<option value="">${field.required ? "Select" : "None"}</option>${options.map((item) => `<option value="${escapeHtml(item.value)}" ${String(item.value) === String(value || "") ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}`;
  }
  return (field.options || []).map((option) => `<option value="${escapeHtml(option)}" ${String(option) === String(value ?? field.default ?? "") ? "selected" : ""}>${escapeHtml(labelize(option))}</option>`).join("");
}

function fieldMarkup(field, value) {
  const full = field.type === "textarea" ? " span-2" : "";
  if (field.type === "boolean") {
    const checked = value === true || value === "true" || (value === null || value === undefined) && field.default === true;
    return `<div class="serenity-form-field${full}"><div class="form-check"><input class="form-check-input" type="checkbox" name="${escapeHtml(field.key)}" id="field-${escapeHtml(field.key)}" ${checked ? "checked" : ""}><label class="form-check-label" for="field-${escapeHtml(field.key)}">${escapeHtml(field.label)}</label></div></div>`;
  }
  if (field.type === "textarea") {
    return `<div class="serenity-form-field${full}"><label>${escapeHtml(field.label)}</label><textarea class="form-control" rows="4" name="${escapeHtml(field.key)}" ${field.required ? "required" : ""}>${escapeHtml(value ?? field.default ?? "")}</textarea></div>`;
  }
  if (field.type === "select" || field.type === "choice") {
    return `<div class="serenity-form-field${full}"><label>${escapeHtml(field.label)}</label><select class="form-select" name="${escapeHtml(field.key)}" ${field.required ? "required" : ""}>${optionsMarkup(field, value)}</select></div>`;
  }
  const inputValue = field.type === "datetime-local" && value ? String(value).slice(0, 16) : value ?? field.default ?? "";
  return `<div class="serenity-form-field${full}"><label>${escapeHtml(field.label)}</label><input class="form-control" type="${escapeHtml(field.type || "text")}" name="${escapeHtml(field.key)}" value="${escapeHtml(inputValue)}" ${field.required ? "required" : ""}></div>`;
}

function openEditModal(row = null) {
  const resource = state.payload.resource;
  const fields = row ? (resource.fields || []) : (resource.createFields || resource.fields || []);
  state.formFields = fields;
  const body = document.getElementById("serenity-record-form-body");
  const form = document.getElementById("serenity-record-form");
  const title = document.getElementById("serenity-record-modal-title");
  if (!body || !form || !window.bootstrap) return;
  form.dataset.key = row?.key || "";
  title.textContent = row ? `Edit ${resource.label.replace(/s$/, "")}` : `Create ${resource.label.replace(/s$/, "")}`;
  body.innerHTML = `<div class="serenity-modal-grid">${fields.map((field) => fieldMarkup(field, row?.edit?.[field.key])).join("")}</div>`;
  window.bootstrap.Modal.getOrCreateInstance(document.getElementById("serenityRecordModal")).show();
}

function serializeForm(form) {
  const output = Object.fromEntries(new FormData(form).entries());
  for (const field of state.formFields || []) {
    if (field.type === "boolean") output[field.key] = form.elements[field.key]?.checked === true;
    if (field.type === "datetime-local" && output[field.key]) output[field.key] = new Date(output[field.key]).toISOString();
    if (field.type === "number" && output[field.key] !== "") output[field.key] = Number(output[field.key]);
    if (field.type === "choice" && output[field.key] === "") output[field.key] = null;
  }
  return output;
}

async function saveRecord(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const save = document.getElementById("serenity-record-save");
  save.disabled = true;
  try {
    const payload = serializeForm(form);
    if (form.dataset.key) await updateOperationRow(state.resource, form.dataset.key, payload);
    else await createOperationRow(state.resource, payload);
    window.bootstrap.Modal.getInstance(document.getElementById("serenityRecordModal"))?.hide();
    await loadResource();
  } catch (error) {
    const body = document.getElementById("serenity-record-form-body");
    body?.insertAdjacentHTML("afterbegin", `<div class="alert alert-danger span-2">${escapeHtml(error.message)}</div>`);
  } finally {
    save.disabled = false;
  }
}

async function assignCaregiver(row) {
  const choices = state.payload.choices?.caregivers || [];
  const body = document.getElementById("serenity-record-form-body");
  const form = document.getElementById("serenity-record-form");
  const title = document.getElementById("serenity-record-modal-title");
  if (!body || !form || !window.bootstrap) return;
  form.dataset.specialAction = "assign";
  form.dataset.key = row.key;
  title.textContent = "Assign Caregiver";
  body.innerHTML = `<div class="serenity-form-field"><label>Caregiver</label><select class="form-select" name="caregiver_id" required><option value="">Select caregiver</option>${choices.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join("")}</select></div>`;
  window.bootstrap.Modal.getOrCreateInstance(document.getElementById("serenityRecordModal")).show();
}

async function updateCallback(row) {
  const body = document.getElementById("serenity-record-form-body");
  const form = document.getElementById("serenity-record-form");
  const title = document.getElementById("serenity-record-modal-title");
  if (!body || !form || !window.bootstrap) return;
  form.dataset.specialAction = "callback-status";
  form.dataset.key = row.key;
  title.textContent = "Update Callback";
  body.innerHTML = `
    <div class="serenity-modal-grid">
      <div class="serenity-form-field"><label>Status</label><select class="form-select" name="status"><option>pending</option><option>contacted</option><option>scheduled</option><option>completed</option><option>closed</option></select></div>
      <div class="serenity-form-field"><label>Follow-up</label><input class="form-control" type="datetime-local" name="follow_up_at"></div>
      <div class="serenity-form-field span-2"><label>Outcome</label><input class="form-control" name="outcome"></div>
      <div class="serenity-form-field span-2"><label>Resolution Notes</label><textarea class="form-control" name="resolution_notes" rows="3"></textarea></div>
    </div>`;
  window.bootstrap.Modal.getOrCreateInstance(document.getElementById("serenityRecordModal")).show();
}

async function submitSpecialAction(form) {
  const action = form.dataset.specialAction;
  if (!action) return false;
  const key = form.dataset.key;
  const data = Object.fromEntries(new FormData(form).entries());
  if (data.follow_up_at) data.follow_up_at = new Date(data.follow_up_at).toISOString();
  await runOperationAction(state.resource, key, action, data);
  form.dataset.specialAction = "";
  window.bootstrap.Modal.getInstance(document.getElementById("serenityRecordModal"))?.hide();
  await loadResource();
  return true;
}

async function modalSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const save = document.getElementById("serenity-record-save");
  save.disabled = true;
  try {
    if (form.dataset.specialAction) await submitSpecialAction(form);
    else await saveRecord(event);
  } catch (error) {
    const body = document.getElementById("serenity-record-form-body");
    body?.insertAdjacentHTML("afterbegin", `<div class="alert alert-danger">${escapeHtml(error.message)}</div>`);
  } finally {
    save.disabled = false;
  }
}

async function rowAction(event) {
  const button = event.target.closest("[data-operation]");
  if (!button) return;
  const tr = button.closest("tr[data-row-index]");
  const row = state.rows[Number(tr?.dataset.rowIndex)];
  if (!row) return;
  const action = button.dataset.operation;

  if (action === "edit") return openEditModal(row);
  if (action === "assign") return assignCaregiver(row);
  if (action === "callback-status") return updateCallback(row);
  if (["start", "complete", "decline"].includes(action)) {
    if (!window.confirm(`${labelize(action)} this task?`)) return;
    button.disabled = true;
    try {
      await runOperationAction(state.resource, row.key, action, {});
      await loadResource();
    } catch (error) {
      window.alert(error.message);
      button.disabled = false;
    }
  }
}

function filterRows(query) {
  const needle = String(query || "").trim().toLowerCase();
  const filtered = !needle ? state.rows : state.rows.filter((row) => Object.values(row.values || {}).some((value) => String(value ?? "").toLowerCase().includes(needle)));
  const tbody = document.querySelector("#serenity-resource-table tbody");
  if (tbody) tbody.innerHTML = renderRows(filtered, state.payload.resource, state.payload.columns || []);
  const count = document.getElementById("serenity-record-count");
  if (count) count.textContent = `${filtered.length} record${filtered.length === 1 ? "" : "s"}`;
}

function bindPageEvents() {
  document.getElementById("serenity-refresh")?.addEventListener("click", loadResource);
  document.getElementById("serenity-create-record")?.addEventListener("click", () => openEditModal(null));
  document.getElementById("serenity-resource-search")?.addEventListener("input", (event) => filterRows(event.target.value));
  document.getElementById("serenity-resource-table")?.addEventListener("click", rowAction);
  document.getElementById("serenity-record-form")?.addEventListener("submit", modalSubmit);
  document.getElementById("serenityRecordModal")?.addEventListener("hidden.bs.modal", () => {
    const form = document.getElementById("serenity-record-form");
    if (form) {
      form.dataset.key = "";
      form.dataset.specialAction = "";
    }
  });
}

async function loadResource() {
  const target = document.querySelector(".right_col");
  if (!target) return;
  try {
    const data = await getOperationRows(state.resource, 300);
    renderPage(data);
  } catch (error) {
    target.innerHTML = `<div class="serenity-page"><div class="alert alert-danger serenity-error"><strong>Records could not load.</strong><br>${escapeHtml(error.message)}</div><a href="/dashboard" class="btn btn-outline-secondary">Return to Control Center</a></div>`;
  }
}

export async function initPage() {
  await loadResource();
}
