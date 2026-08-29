import Chart from "chart.js/auto";
import {
  createOperationRow,
  getControlCenter,
  getOperationRows
} from "./admin-api.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatMoney(value) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function labelize(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value) {
  const text = String(value || "").toLowerCase();
  if (["urgent", "critical", "overdue", "missed", "cancelled"].some((item) => text.includes(item))) return "is-danger";
  if (["high", "pending", "awaiting", "warning", "open"].some((item) => text.includes(item))) return "is-warning";
  if (["active", "completed", "complete", "paid", "confirmed"].some((item) => text.includes(item))) return "is-success";
  return "is-info";
}

function metricCard(label, value, note, icon, href = "") {
  const body = `
    <div class="serenity-card serenity-kpi">
      <div class="icon"><i class="bi ${icon}"></i></div>
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
      <div class="note">${escapeHtml(note)}</div>
    </div>
  `;
  return href ? `<a href="${href}" class="text-decoration-none">${body}</a>` : body;
}

function tableEmpty(columns, message) {
  return `<tr><td colspan="${columns}" class="serenity-empty">${escapeHtml(message)}</td></tr>`;
}

function renderWorkQueue(rows = []) {
  if (!rows.length) return tableEmpty(7, "No open tasks.");
  return rows.map((row) => `
    <tr>
      <td><strong>${escapeHtml(row.task)}</strong></td>
      <td>${escapeHtml(row.patient)}</td>
      <td>${escapeHtml(row.assignedTo)}</td>
      <td><span class="serenity-status ${statusClass(row.priority)}">${escapeHtml(labelize(row.priority))}</span></td>
      <td>${escapeHtml(formatDateTime(row.due))}${row.overdue ? ' <span class="serenity-status is-danger">Overdue</span>' : ""}</td>
      <td><span class="serenity-status ${statusClass(row.status)}">${escapeHtml(labelize(row.status))}</span></td>
      <td><a class="btn btn-sm btn-outline-primary" href="/operations?resource=tasks">Open</a></td>
    </tr>
  `).join("");
}

function renderSchedule(rows = []) {
  if (!rows.length) return tableEmpty(6, "No visits scheduled for today.");
  return rows.map((row) => `
    <tr>
      <td>${escapeHtml(formatDateTime(row.startsAt))}</td>
      <td><strong>${escapeHtml(row.patient)}</strong></td>
      <td>${escapeHtml(row.service)}</td>
      <td>${escapeHtml(row.caregiver)}</td>
      <td><span class="serenity-status ${statusClass(row.status)}">${escapeHtml(labelize(row.status))}</span></td>
      <td><a class="btn btn-sm btn-outline-primary" href="/operations?resource=visits">Open</a></td>
    </tr>
  `).join("");
}

function renderAttention(items = []) {
  if (!items.length) return '<div class="serenity-empty">No urgent operational items.</div>';
  return items.map((item) => `
    <a href="/operations?resource=${encodeURIComponent(item.resource)}">
      <div class="serenity-attention-item">
        <span>${escapeHtml(item.label)}</span>
        <span class="serenity-status is-${escapeHtml(item.level)}">${escapeHtml(item.count)}</span>
      </div>
    </a>
  `).join("");
}

function chartData(object = {}) {
  return {
    labels: Object.keys(object).map(labelize),
    values: Object.values(object).map((value) => Number(value || 0))
  };
}

function makeChart(id, type, object, options = {}) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const data = chartData(object);
  if (!data.labels.length) return;
  new Chart(canvas, {
    type,
    data: {
      labels: data.labels,
      datasets: [{
        label: options.label || "Records",
        data: data.values,
        borderWidth: 1,
        borderRadius: type === "bar" ? 7 : 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: type !== "bar", position: "bottom" }
      },
      scales: type === "bar" ? {
        y: { beginAtZero: true, ticks: { precision: 0 } },
        x: { grid: { display: false } }
      } : undefined
    }
  });
}

function makeTrendChart(trend = []) {
  const canvas = document.getElementById("serenity-trend-chart");
  if (!canvas || !window.Chart || !trend.length) return;
  new Chart(canvas, {
    type: "line",
    data: {
      labels: trend.map((row) => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${row.date}T00:00:00`))),
      datasets: [
        { label: "Tasks created", data: trend.map((row) => row.tasks), tension: .32, fill: false },
        { label: "Visits", data: trend.map((row) => row.visits), tension: .32, fill: false }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }
    }
  });
}

function renderDashboard(dashboard) {
  const target = document.querySelector(".right_col");
  if (!target) return;
  const metrics = dashboard.metrics || {};

  target.innerHTML = `
    <div class="serenity-page">
      <div class="serenity-page-header">
        <div>
          <h2>Control Center</h2>
          <p>Live operations across patients, staff, visits, tasks, care delivery and finance.</p>
        </div>
        <div class="serenity-actions">
          <button class="btn btn-success" id="serenity-new-task"><i class="bi bi-plus-lg me-1"></i> New Task</button>
          <a class="btn btn-outline-primary" href="/operations?resource=appointments">Appointments</a>
          <a class="btn btn-outline-primary" href="/operations?resource=visits">Visits</a>
          <a class="btn btn-outline-secondary" href="/reports">Reports</a>
        </div>
      </div>

      <div class="serenity-kpis">
        ${metricCard("Open Tasks", metrics.openTasks, `${metrics.overdueTasks || 0} overdue`, "bi-check2-square", "/operations?resource=tasks")}
        ${metricCard("Today's Visits", metrics.todayVisits, `${metrics.unassignedVisits || 0} unassigned in next 48 hours`, "bi-calendar2-check", "/operations?resource=visits")}
        ${metricCard("Pending Appointments", metrics.pendingAppointments, "Awaiting scheduling or confirmation", "bi-calendar-plus", "/operations?resource=appointments")}
        ${metricCard("Active Patients", metrics.activePatients, `${metrics.activeCaregivers || 0} active caregivers`, "bi-people", "/operations?resource=clients")}
        ${metricCard("Open Callbacks", metrics.openCallbacks, "Follow-up requests", "bi-telephone", "/operations?resource=callbacks")}
        ${metricCard("Open Incidents", metrics.openIncidents, "Clinical and operational review", "bi-exclamation-triangle", "/operations?resource=incidents")}
        ${metricCard("Active Medications", metrics.activeMedications, "Current medication orders", "bi-capsule", "/operations?resource=medications")}
        ${metricCard("Outstanding Billing", formatMoney(metrics.outstandingBalance), `${metrics.openInvoices || 0} open invoice(s)`, "bi-receipt", "/operations?resource=invoices")}
      </div>

      <div class="serenity-grid-2">
        <div class="serenity-card serenity-panel">
          <h4>Workload — Last 14 Days</h4>
          <div class="serenity-chart-wrap"><canvas id="serenity-trend-chart"></canvas></div>
        </div>
        <div class="serenity-card serenity-panel">
          <h4>Tasks by Status</h4>
          <div class="serenity-chart-wrap"><canvas id="serenity-task-chart"></canvas></div>
        </div>
      </div>

      <div class="serenity-grid-3">
        <div class="serenity-card serenity-panel">
          <h4>Visit Status</h4>
          <div class="serenity-chart-wrap"><canvas id="serenity-visit-chart"></canvas></div>
        </div>
        <div class="serenity-card serenity-panel">
          <h4>Appointment Flow</h4>
          <div class="serenity-chart-wrap"><canvas id="serenity-appointment-chart"></canvas></div>
        </div>
        <div class="serenity-card serenity-panel">
          <h4>Incident Severity</h4>
          <div class="serenity-chart-wrap"><canvas id="serenity-incident-chart"></canvas></div>
        </div>
      </div>

      <div class="serenity-grid-2">
        <div class="serenity-card serenity-panel">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="mb-0">Work Queue</h4>
            <a href="/operations?resource=tasks" class="btn btn-sm btn-outline-secondary">View all</a>
          </div>
          <div class="serenity-table-wrap">
            <table class="serenity-table">
              <thead><tr><th>Task</th><th>Patient</th><th>Assigned To</th><th>Priority</th><th>Due</th><th>Status</th><th></th></tr></thead>
              <tbody>${renderWorkQueue(dashboard.workQueue || [])}</tbody>
            </table>
          </div>
        </div>
        <div class="serenity-card serenity-panel">
          <h4>Needs Attention</h4>
          <div class="serenity-attention">${renderAttention(dashboard.attention || [])}</div>
        </div>
      </div>

      <div class="serenity-card serenity-panel">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="mb-0">Today's Schedule</h4>
          <a href="/operations?resource=visits" class="btn btn-sm btn-outline-secondary">View visits</a>
        </div>
        <div class="serenity-table-wrap">
          <table class="serenity-table">
            <thead><tr><th>Time</th><th>Patient</th><th>Service</th><th>Caregiver</th><th>Status</th><th></th></tr></thead>
            <tbody>${renderSchedule(dashboard.schedule || [])}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal fade" id="serenityTaskModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <form id="serenity-task-form">
            <div class="modal-header"><h5 class="modal-title">Create Task</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
            <div class="modal-body" id="serenity-task-form-body"><div class="serenity-empty">Loading task form…</div></div>
            <div class="modal-footer"><button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button type="submit" class="btn btn-success">Create Task</button></div>
          </form>
        </div>
      </div>
    </div>
  `;

  makeTrendChart(dashboard.charts?.trend || []);
  makeChart("serenity-task-chart", "doughnut", dashboard.charts?.taskStatus || {});
  makeChart("serenity-visit-chart", "bar", dashboard.charts?.visitStatus || {}, { label: "Visits" });
  makeChart("serenity-appointment-chart", "doughnut", dashboard.charts?.appointmentStatus || {});
  makeChart("serenity-incident-chart", "polarArea", dashboard.charts?.incidentSeverity || {});
}

function optionRows(items = [], placeholder) {
  return `<option value="">${escapeHtml(placeholder)}</option>${items.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join("")}`;
}

async function prepareTaskForm() {
  const body = document.getElementById("serenity-task-form-body");
  if (!body) return;
  try {
    const data = await getOperationRows("tasks", 1);
    const clients = data.choices?.clients || [];
    const profiles = data.choices?.profiles || [];
    body.innerHTML = `
      <div class="serenity-modal-grid">
        <div class="serenity-form-field"><label>Task</label><input class="form-control" name="title" required></div>
        <div class="serenity-form-field"><label>Assigned To</label><select class="form-select" name="assigned_profile_id" required>${optionRows(profiles, "Select staff member")}</select></div>
        <div class="serenity-form-field"><label>Patient</label><select class="form-select" name="client_id">${optionRows(clients, "General task — no patient")}</select></div>
        <div class="serenity-form-field"><label>Type</label><input class="form-control" name="task_type" value="general"></div>
        <div class="serenity-form-field"><label>Priority</label><select class="form-select" name="priority"><option>low</option><option selected>normal</option><option>high</option><option>urgent</option></select></div>
        <div class="serenity-form-field"><label>Due</label><input class="form-control" name="due_at" type="datetime-local"></div>
        <div class="serenity-form-field span-2"><label>Details</label><textarea class="form-control" name="details" rows="3"></textarea></div>
        <div class="serenity-form-field"><div class="form-check"><input class="form-check-input" id="patient-visible" name="patient_visible" type="checkbox"><label class="form-check-label" for="patient-visible">Visible to patient</label></div></div>
        <div class="serenity-form-field"><div class="form-check"><input class="form-check-input" id="task-reminder" name="reminder_enabled" type="checkbox" checked><label class="form-check-label" for="task-reminder">Reminder enabled</label></div></div>
      </div>
    `;
  } catch (error) {
    body.innerHTML = `<div class="alert alert-danger">${escapeHtml(error.message)}</div>`;
  }
}

function serializeTaskForm(form) {
  const data = new FormData(form);
  const value = Object.fromEntries(data.entries());
  value.patient_visible = form.elements.patient_visible?.checked === true;
  value.reminder_enabled = form.elements.reminder_enabled?.checked === true;
  value.client_id = value.client_id || null;
  value.starts_at = value.starts_at || null;
  value.due_at = value.due_at ? new Date(value.due_at).toISOString() : null;
  value.reminder_minutes_before = 30;
  return value;
}

function bindTaskModal() {
  const button = document.getElementById("serenity-new-task");
  const modalElement = document.getElementById("serenityTaskModal");
  const form = document.getElementById("serenity-task-form");
  if (!button || !modalElement || !form || !window.bootstrap) return;
  const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);

  button.addEventListener("click", async () => {
    await prepareTaskForm();
    modal.show();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    try {
      await createOperationRow("tasks", serializeTaskForm(form));
      modal.hide();
      await initControlCenter();
    } catch (error) {
      const body = document.getElementById("serenity-task-form-body");
      body?.insertAdjacentHTML("afterbegin", `<div class="alert alert-danger">${escapeHtml(error.message)}</div>`);
    } finally {
      submit.disabled = false;
    }
  });
}

async function initControlCenter() {
  const target = document.querySelector(".right_col");
  if (!target) return;
  try {
    const data = await getControlCenter();
    renderDashboard(data.dashboard || {});
    bindTaskModal();
  } catch (error) {
    target.innerHTML = `<div class="serenity-page"><div class="alert alert-danger serenity-error"><strong>Control Center could not load.</strong><br>${escapeHtml(error.message)}</div></div>`;
  }
}

export async function initPage() {
  await initControlCenter();
}
