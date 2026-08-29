import "./admin-layout.js";

import {
  getAppointments,
  getDashboard,
  getLeads
} from "./admin-api.js";

import {
  dispatchSerenityEvent,
  escapeHtml,
  formatDate,
  replacePanelTableByIndex,
  showAdminError,
  statusBadge,
  updatePanelTitleByIndex,
  updateTileByIndex
} from "./admin-utils.js";

function countByStatus(rows = [], statusList = []) {
  return rows.filter((row) => statusList.includes(String(row.status || "").toLowerCase())).length;
}

function renderLeadRows(rows = []) {
  if (!rows.length) {
    return `
      <tr>
        <td colspan="6" class="text-center text-muted">No leads yet.</td>
      </tr>
    `;
  }

  return rows
    .slice(0, 12)
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.full_name || "Website visitor")}</td>
          <td>${escapeHtml(row.phone || "")}</td>
          <td>${escapeHtml(row.email || "")}</td>
          <td>${escapeHtml(row.service_interest || "")}</td>
          <td>${statusBadge(row.status)}</td>
          <td>${escapeHtml(formatDate(row.created_at))}</td>
        </tr>
      `
    )
    .join("");
}

function renderAppointmentRows(rows = []) {
  if (!rows.length) {
    return `
      <tr>
        <td colspan="6" class="text-center text-muted">No appointments yet.</td>
      </tr>
    `;
  }

  return rows
    .slice(0, 12)
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.full_name || "Website visitor")}</td>
          <td>${escapeHtml(row.phone || "")}</td>
          <td>${escapeHtml(row.desired_service || "")}</td>
          <td>${escapeHtml(row.desired_datetime_text || "")}</td>
          <td>${statusBadge(row.status)}</td>
          <td>${escapeHtml(formatDate(row.created_at))}</td>
        </tr>
      `
    )
    .join("");
}

function renderPipelineRows(leads = []) {
  const statuses = ["new", "pending", "contacted", "scheduled", "closed", "spam"];

  return statuses
    .map((status) => {
      const total = countByStatus(leads, [status]);
      return `
        <tr>
          <td>${statusBadge(status)}</td>
          <td>${total}</td>
          <td>
            <div class="progress">
              <div class="progress-bar" role="progressbar" style="width: ${leads.length ? Math.round((total / leads.length) * 100) : 0}%"></div>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function initLeadDashboard() {
  try {
    const [dashboardData, leadsData, appointmentsData] = await Promise.all([
      getDashboard(),
      getLeads(),
      getAppointments()
    ]);

    const counts = dashboardData.dashboard?.counts || {};
    const leads = leadsData.leads || [];
    const appointments = appointmentsData.appointments || [];

    updateTileByIndex(0, counts.total_leads || leads.length, `<i class="fa fa-user"></i> Total Leads`);
    updateTileByIndex(1, countByStatus(leads, ["new", "pending"]), `<i class="fa fa-clock-o"></i> New / Pending`);
    updateTileByIndex(2, countByStatus(leads, ["contacted"]), `<i class="fa fa-phone"></i> Contacted`);
    updateTileByIndex(3, countByStatus(leads, ["scheduled"]), `<i class="fa fa-calendar"></i> Scheduled`);
    updateTileByIndex(4, counts.total_appointments || appointments.length, `<i class="fa fa-calendar-check-o"></i> Appointments`);
    updateTileByIndex(5, counts.open_appointments || 0, `<i class="fa fa-folder-open"></i> Open Appointments`);

    updatePanelTitleByIndex(0, "Recent Leads");
    replacePanelTableByIndex(0, renderLeadRows(leads));

    updatePanelTitleByIndex(1, "Upcoming / Recent Appointments");
    replacePanelTableByIndex(1, renderAppointmentRows(appointments));

    updatePanelTitleByIndex(2, "Lead Pipeline");
    replacePanelTableByIndex(2, renderPipelineRows(leads));

    dispatchSerenityEvent("serenity-admin-leads-loaded", {
      leads,
      appointments,
      counts
    });
  } catch (error) {
    showAdminError(error.message);
  }
}

document.addEventListener("DOMContentLoaded", initLeadDashboard);