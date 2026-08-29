import { getDashboard } from "./admin-api.js";
import {
  escapeHtml,
  formatDate,
  renderEmptyRow,
  setHtml,
  setText,
  showAdminError,
  statusBadge
} from "./admin-utils.js";

function renderActivity(rows = []) {
  if (!rows.length) return renderEmptyRow(5, "No recent activity yet.");

  return rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.activity_type)}</td>
          <td>${escapeHtml(row.title)}</td>
          <td>${escapeHtml(row.description)}</td>
          <td>${statusBadge(row.status)}</td>
          <td>${escapeHtml(formatDate(row.created_at))}</td>
        </tr>
      `
    )
    .join("");
}

function renderLeads(rows = []) {
  if (!rows.length) return renderEmptyRow(5, "No recent leads.");

  return rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.full_name || "")}</td>
          <td>${escapeHtml(row.phone || "")}</td>
          <td>${escapeHtml(row.email || "")}</td>
          <td>${statusBadge(row.status)}</td>
          <td>${escapeHtml(formatDate(row.created_at))}</td>
        </tr>
      `
    )
    .join("");
}

function renderAppointments(rows = []) {
  if (!rows.length) return renderEmptyRow(5, "No recent appointments.");

  return rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.full_name || "")}</td>
          <td>${escapeHtml(row.desired_service || "")}</td>
          <td>${escapeHtml(row.desired_datetime_text || "")}</td>
          <td>${statusBadge(row.status)}</td>
          <td>${escapeHtml(formatDate(row.created_at))}</td>
        </tr>
      `
    )
    .join("");
}

async function initSerenityDashboard() {
  try {
    const data = await getDashboard();
    const dashboard = data.dashboard || {};
    const counts = dashboard.counts || {};

    setText("admin-total-leads", counts.total_leads || 0);
    setText("admin-open-leads", counts.open_leads || 0);
    setText("admin-total-appointments", counts.total_appointments || 0);
    setText("admin-open-appointments", counts.open_appointments || 0);
    setText("admin-total-contacts", counts.total_contact_messages || 0);
    setText("admin-unread-contacts", counts.unread_contact_messages || 0);
    setText("admin-total-conversations", counts.total_conversations || 0);
    setText("admin-active-conversations", counts.active_conversations || 0);

    setHtml("admin-activity-table", renderActivity(dashboard.activityFeed || []));
    setHtml("admin-leads-table", renderLeads(dashboard.recentLeads || []));
    setHtml("admin-appointments-table", renderAppointments(dashboard.recentAppointments || []));
  } catch (error) {
    console.error(error);
    showAdminError(error.message);
  }
}

document.addEventListener("DOMContentLoaded", initSerenityDashboard);