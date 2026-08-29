import {
  createAccount,
  getAccount,
  getAccountOptions,
  getAccounts,
  updateAccount
} from "./admin-api.js";

let directory = [];
let options = { roles: [], departments: [], supervisors: [] };

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

function renderRows(rows) {
  if (!rows.length) return '<tr><td colspan="8" class="serenity-empty">No staff accounts found.</td></tr>';
  return rows.map((row, index) => `
    <tr data-index="${index}">
      <td><strong>${escapeHtml([row.preferred_name || row.first_name, row.last_name].filter(Boolean).join(" "))}</strong></td>
      <td>${escapeHtml(row.employee_number || "—")}</td>
      <td>${escapeHtml(labelize(row.identity_type))}</td>
      <td>${escapeHtml(row.job_title || "—")}</td>
      <td>${escapeHtml(row.department_name || "—")}</td>
      <td>${escapeHtml((row.role_names || []).join(", ") || "—")}</td>
      <td><span class="serenity-status ${row.profile_status === "active" ? "is-success" : row.profile_status === "invited" ? "is-info" : "is-warning"}">${escapeHtml(labelize(row.profile_status))}</span></td>
      <td><button class="btn btn-sm btn-outline-primary" data-edit-account>Edit</button></td>
    </tr>
  `).join("");
}

function renderPage() {
  const target = document.querySelector(".right_col");
  if (!target) return;
  target.innerHTML = `
    <div class="serenity-page">
      <div class="serenity-page-header">
        <div><h2>Staff & Access</h2><p>Accounts, roles, departments, supervisors and employment access.</p></div>
        <div class="serenity-actions"><button class="btn btn-success" id="new-staff-account"><i class="bi bi-person-plus me-1"></i> New Account</button><button class="btn btn-outline-secondary" id="refresh-staff"><i class="bi bi-arrow-clockwise me-1"></i> Refresh</button></div>
      </div>
      <div class="serenity-card mb-3"><div class="serenity-filterbar"><div class="input-group" style="max-width:420px"><span class="input-group-text"><i class="bi bi-search"></i></span><input class="form-control" id="staff-search" placeholder="Search staff"></div><div class="form-check ms-auto"><input class="form-check-input" type="checkbox" id="include-inactive"><label class="form-check-label" for="include-inactive">Include inactive</label></div></div></div>
      <div class="serenity-card serenity-panel"><div class="serenity-table-wrap"><table class="serenity-table" id="staff-table"><thead><tr><th>Name</th><th>Employee No.</th><th>Account Type</th><th>Job Title</th><th>Department</th><th>Roles</th><th>Status</th><th>Actions</th></tr></thead><tbody>${renderRows(directory)}</tbody></table></div></div>
    </div>
    <div class="modal fade" id="staffAccountModal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-xl modal-dialog-centered"><div class="modal-content"><form id="staff-account-form"><div class="modal-header"><h5 class="modal-title" id="staff-modal-title">Staff Account</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body" id="staff-form-body"></div><div class="modal-footer"><button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button type="submit" class="btn btn-success" id="staff-save">Save</button></div></form></div></div></div>
  `;
  bindEvents();
}

function selectOptions(items, selected, emptyLabel = "None") {
  return `<option value="">${escapeHtml(emptyLabel)}</option>${items.map((item) => `<option value="${escapeHtml(item.value)}" ${String(item.value) === String(selected || "") ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}`;
}

function roleChecks(selectedIds = []) {
  const selected = new Set(selectedIds || []);
  return options.roles.map((role, index) => `<div class="form-check"><input class="form-check-input" type="checkbox" name="role_ids" value="${escapeHtml(role.value)}" id="role-${index}" ${selected.has(role.value) ? "checked" : ""}><label class="form-check-label" for="role-${index}">${escapeHtml(role.label)}</label></div>`).join("");
}

function accountForm(account = null) {
  const roleIds = (account?.care_user_roles || []).map((row) => row.role_id).filter(Boolean);
  const caregiver = Array.isArray(account?.care_caregivers) ? account.care_caregivers[0] : account?.care_caregivers;
  return `
    <div class="serenity-modal-grid">
      <div class="serenity-form-field"><label>Email</label><input class="form-control" type="email" name="email" value="${escapeHtml(account?.email || "")}" required ${account ? "readonly" : ""}></div>
      <input type="hidden" name="identity_type" value="staff"><div class="serenity-form-field"><label>Account Type</label><input class="form-control" value="Staff" readonly></div>
      <div class="serenity-form-field"><label>First Name</label><input class="form-control" name="first_name" value="${escapeHtml(account?.first_name || "")}" required></div>
      <div class="serenity-form-field"><label>Last Name</label><input class="form-control" name="last_name" value="${escapeHtml(account?.last_name || "")}" required></div>
      <div class="serenity-form-field"><label>Preferred Name</label><input class="form-control" name="preferred_name" value="${escapeHtml(account?.preferred_name || "")}"></div>
      <div class="serenity-form-field"><label>Phone</label><input class="form-control" name="phone" value="${escapeHtml(account?.phone || "")}"></div>
      <div class="serenity-form-field"><label>Employee Number</label><input class="form-control" name="employee_number" value="${escapeHtml(account?.employee_number || "")}"></div>
      <div class="serenity-form-field"><label>Job Title</label><input class="form-control" name="job_title" value="${escapeHtml(account?.job_title || "")}"></div>
      <div class="serenity-form-field"><label>Department</label><select class="form-select" name="department_id">${selectOptions(options.departments, account?.department_id, "No department")}</select></div>
      <div class="serenity-form-field"><label>Supervisor</label><select class="form-select" name="supervisor_id">${selectOptions(options.supervisors, account?.supervisor_id, "No supervisor")}</select></div>
      <div class="serenity-form-field"><label>Status</label><select class="form-select" name="status"><option value="invited" ${account?.status === "invited" || !account ? "selected" : ""}>Invited</option><option value="active" ${account?.status === "active" ? "selected" : ""}>Active</option><option value="inactive" ${account?.status === "inactive" ? "selected" : ""}>Inactive</option><option value="suspended" ${account?.status === "suspended" ? "selected" : ""}>Suspended</option><option value="terminated" ${account?.status === "terminated" ? "selected" : ""}>Terminated</option></select></div>
      <div class="serenity-form-field"><label>Employment Type</label><select class="form-select" name="employment_type"><option value="">Not set</option><option value="employee" ${caregiver?.employment_type === "employee" ? "selected" : ""}>Employee</option><option value="contractor" ${caregiver?.employment_type === "contractor" ? "selected" : ""}>Contractor</option><option value="volunteer" ${caregiver?.employment_type === "volunteer" ? "selected" : ""}>Volunteer</option></select></div>
      <div class="serenity-form-field"><label>Employment Start</label><input class="form-control" type="date" name="employment_start_date" value="${escapeHtml(account?.employment_start_date || "")}"></div>
      <div class="serenity-form-field"><label>Employment End</label><input class="form-control" type="date" name="employment_end_date" value="${escapeHtml(account?.employment_end_date || "")}"></div>
      <div class="serenity-form-field span-2"><label>Roles</label><div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-2 mt-1">${roleChecks(roleIds)}</div></div>
    </div>
  `;
}

function openModal(account = null) {
  const form = document.getElementById("staff-account-form");
  const body = document.getElementById("staff-form-body");
  const title = document.getElementById("staff-modal-title");
  if (!form || !body || !window.bootstrap) return;
  form.dataset.key = account?.id || "";
  title.textContent = account ? "Edit Staff Account" : "Create Staff Account";
  body.innerHTML = accountForm(account);
  window.bootstrap.Modal.getOrCreateInstance(document.getElementById("staffAccountModal")).show();
}

function formPayload(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  data.role_ids = [...form.querySelectorAll('input[name="role_ids"]:checked')].map((input) => input.value);
  for (const field of ["preferred_name", "phone", "employee_number", "job_title", "department_id", "supervisor_id", "employment_start_date", "employment_end_date", "employment_type"]) {
    data[field] = data[field] || null;
  }
  return data;
}

async function editAccount(index) {
  const row = directory[index];
  if (!row) return;
  try {
    const data = await getAccount(row.profile_id || row.id);
    openModal(data.account);
  } catch (error) {
    window.alert(error.message);
  }
}

function filterDirectory() {
  const needle = String(document.getElementById("staff-search")?.value || "").toLowerCase();
  const filtered = !needle ? directory : directory.filter((row) => [row.first_name, row.last_name, row.preferred_name, row.employee_number, row.job_title, row.department_name, ...(row.role_names || [])].some((value) => String(value || "").toLowerCase().includes(needle)));
  const tbody = document.querySelector("#staff-table tbody");
  if (!tbody) return;
  if (!needle) {
    tbody.innerHTML = renderRows(directory);
    return;
  }
  tbody.innerHTML = filtered.map((row) => {
    const original = directory.indexOf(row);
    return renderRows([row]).replace('data-index="0"', `data-index="${original}"`);
  }).join("");
}

function bindEvents() {
  document.getElementById("new-staff-account")?.addEventListener("click", () => openModal(null));
  document.getElementById("refresh-staff")?.addEventListener("click", loadDirectory);
  document.getElementById("staff-search")?.addEventListener("input", filterDirectory);
  document.getElementById("include-inactive")?.addEventListener("change", loadDirectory);
  document.getElementById("staff-table")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-edit-account]");
    if (!button) return;
    editAccount(Number(button.closest("tr")?.dataset.index));
  });
  document.getElementById("staff-account-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const save = document.getElementById("staff-save");
    save.disabled = true;
    try {
      const payload = formPayload(form);
      if (form.dataset.key) await updateAccount(form.dataset.key, payload);
      else await createAccount(payload);
      window.bootstrap.Modal.getInstance(document.getElementById("staffAccountModal"))?.hide();
      await loadDirectory();
    } catch (error) {
      document.getElementById("staff-form-body")?.insertAdjacentHTML("afterbegin", `<div class="alert alert-danger span-2">${escapeHtml(error.message)}</div>`);
    } finally {
      save.disabled = false;
    }
  });
}

async function loadDirectory() {
  const target = document.querySelector(".right_col");
  if (!target) return;
  try {
    const includeInactive = document.getElementById("include-inactive")?.checked === true;
    const [accountsData, optionsData] = await Promise.all([
      getAccounts(`include_inactive=${includeInactive ? "true" : "false"}`),
      getAccountOptions()
    ]);
    directory = accountsData.accounts || [];
    options = optionsData.options || options;
    renderPage();
    const include = document.getElementById("include-inactive");
    if (include) include.checked = includeInactive;
  } catch (error) {
    target.innerHTML = `<div class="serenity-page"><div class="alert alert-danger serenity-error"><strong>Staff directory could not load.</strong><br>${escapeHtml(error.message)}</div></div>`;
  }
}

export async function initPage() {
  await loadDirectory();
}
