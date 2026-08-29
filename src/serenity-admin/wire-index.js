import "./admin-layout.js";

import { getDashboard } from "./admin-api.js";

import {
  dispatchSerenityEvent,
  escapeHtml,
  formatDate,
  showAdminError,
  statusBadge
} from "./admin-utils.js";

function setCard(index, label, value, note = "Live Serenity data") {
  const cards = document.querySelectorAll(".right_col .row.gy-4.mb-4 .card");
  const card = cards[index];
  if (!card) return;

  const labelEl = card.querySelector("h6");
  const valueEl = card.querySelector("h4.mb-0");
  const noteEl = card.querySelector(".mt-2 .text-muted");

  if (labelEl) labelEl.textContent = label;
  if (valueEl) valueEl.textContent = value ?? 0;
  if (noteEl) noteEl.textContent = note;
}

function setPanelTitle(oldText, newTitle, smallText = "") {
  const titles = document.querySelectorAll(".x_panel .x_title h4, .dashboard_graph .x_title h3");

  titles.forEach((title) => {
    if (title.textContent.trim().toLowerCase().includes(oldText.toLowerCase())) {
      title.innerHTML = `${escapeHtml(newTitle)}${smallText ? ` <small>${escapeHtml(smallText)}</small>` : ""}`;
    }
  });
}

function renderActivityTimeline(rows = []) {
  if (!rows.length) {
    return `
      <li>
        <div class="block">
          <div class="block_content">
            <h5 class="title"><a>No Serenity activity yet</a></h5>
            <div class="byline"><span>Now</span> by <a>System</a></div>
            <p class="excerpt">New leads, appointments, contacts, and assistant chats will appear here.</p>
          </div>
        </div>
      </li>
    `;
  }

  return rows.slice(0, 7).map((row) => `
    <li>
      <div class="block">
        <div class="block_content">
          <h5 class="title">
            <a><i class="fas fa-circle" style="color:#26B99A; margin-right:8px;"></i>${escapeHtml(row.activity_type || "activity")}</a>
          </h5>
          <div class="byline">
            <span>${escapeHtml(formatDate(row.created_at))}</span> by <a>${escapeHtml(row.title || "Serenity visitor")}</a>
          </div>
          <p class="excerpt">
            ${escapeHtml(row.description || "New Serenity activity")}
            ${statusBadge(row.status)}
          </p>
        </div>
      </div>
    </li>
  `).join("");
}

function renderRecentRequests(rows = []) {
  if (!rows.length) {
    return `<tr><td colspan="7" class="text-center text-muted">No recent Serenity requests yet.</td></tr>`;
  }

  return rows.slice(0, 8).map((row, index) => `
    <tr class="${index % 2 === 0 ? "even" : "odd"} pointer">
      <td><strong>${escapeHtml(row.activity_type || "Request")}</strong></td>
      <td>${escapeHtml(row.title || "Website visitor")}</td>
      <td>${escapeHtml(row.description || "")}</td>
      <td><strong>${escapeHtml(row.status || "")}</strong></td>
      <td>${statusBadge(row.status)}</td>
      <td>${escapeHtml(formatDate(row.created_at))}</td>
      <td class="last"><a href="/inbox" class="btn btn-sm btn-primary">View</a></td>
    </tr>
  `).join("");
}

function renderStatusList(rows = []) {
  const target = document.querySelector(".widget_summary")?.parentElement;
  if (!target) return;

  const total = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);

  target.innerHTML = `
    <h6>Requests by status</h6>
    ${
      rows.slice(0, 5).map((row) => {
        const count = Number(row.total || 0);
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;

        return `
          <div class="widget_summary">
            <div class="w_left w_25">
              <span>${escapeHtml(row.status || "unknown")}</span>
            </div>
            <div class="w_center w_55">
              <div class="progress">
                <div class="progress-bar bg-green" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100" style="width:${percent}%;">
                  <span class="visually-hidden">${percent}% Complete</span>
                </div>
              </div>
            </div>
            <div class="w_right w_20">
              <span>${escapeHtml(count)}</span>
            </div>
            <div class="clearfix"></div>
          </div>
        `;
      }).join("")
    }
  `;
}

function renderQuickTasks(counts = {}) {
  const list = document.querySelector(".to_do");
  if (!list) return;

  list.innerHTML = `
    <li><div class="form-check"><input type="checkbox" id="todo-serenity-1" class="form-check-input flat"><label for="todo-serenity-1" class="form-check-label">Review ${escapeHtml(counts.open_leads || 0)} open lead request(s)</label></div></li>
    <li><div class="form-check"><input type="checkbox" id="todo-serenity-2" class="form-check-input flat"><label for="todo-serenity-2" class="form-check-label">Follow up on ${escapeHtml(counts.open_appointments || 0)} open appointment request(s)</label></div></li>
    <li><div class="form-check"><input type="checkbox" id="todo-serenity-3" class="form-check-input flat"><label for="todo-serenity-3" class="form-check-label">Read ${escapeHtml(counts.unread_contact_messages || 0)} unread contact message(s)</label></div></li>
    <li><div class="form-check"><input type="checkbox" id="todo-serenity-4" class="form-check-input flat"><label for="todo-serenity-4" class="form-check-label">Check ${escapeHtml(counts.active_conversations || 0)} active assistant chat(s)</label></div></li>
  `;
}

function updateCampaignBars(counts = {}) {
  const labels = document.querySelectorAll(".dashboard_graph .bg-white p");
  const bars = document.querySelectorAll(".dashboard_graph .bg-white .progress-bar");

  const total =
    Number(counts.total_leads || 0) +
    Number(counts.total_appointments || 0) +
    Number(counts.total_contact_messages || 0) +
    Number(counts.total_conversations || 0);

  const items = [
    ["Leads", Number(counts.total_leads || 0)],
    ["Appointments", Number(counts.total_appointments || 0)],
    ["Contact Messages", Number(counts.total_contact_messages || 0)],
    ["Assistant Chats", Number(counts.total_conversations || 0)]
  ];

  items.forEach(([label, value], index) => {
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    if (labels[index]) labels[index].textContent = label;
    if (bars[index]) {
      bars[index].style.width = `${percent}%`;
      bars[index].dataset.transitiongoal = String(percent);
      bars[index].setAttribute("aria-valuenow", String(percent));
    }
  });
}

function updateRecentOrdersTable(activityFeed = []) {
  const table = document.querySelector(".recent-orders-scroll table tbody");
  if (!table) return;
  table.innerHTML = renderRecentRequests(activityFeed);
}

function updateTimeline(activityFeed = []) {
  const timeline = document.querySelector(".timeline.widget");
  if (!timeline) return;
  timeline.innerHTML = renderActivityTimeline(activityFeed);
}

function updateMainHeadings() {
  setPanelTitle("Network Activities", "Serenity Activity", "Live operational overview");
  setPanelTitle("Top Campaign Performance", "Request Mix", "");
  setPanelTitle("App Versions", "Status Overview", "");
  setPanelTitle("Recent Activities", "Recent Serenity Activities", "Live sessions");
  setPanelTitle("Recent Orders", "Recent Serenity Requests", "Latest leads, contacts, appointments, and chats");
  setPanelTitle("To Do List", "Serenity To Do List", "Today");
  setPanelTitle("Visitors location", "Service Area Snapshot", "Serenity coverage");
}

async function initExecutiveOverview() {
  try {
    const data = await getDashboard();
    const dashboard = data.dashboard || {};
    const counts = dashboard.counts || {};

    setCard(0, "Total Leads", counts.total_leads || 0);
    setCard(1, "Open Leads", counts.open_leads || 0);
    setCard(2, "Appointments", counts.total_appointments || 0);
    setCard(3, "Open Appointments", counts.open_appointments || 0);
    setCard(4, "Contact Messages", counts.total_contact_messages || 0);
    setCard(5, "Active Chats", counts.active_conversations || 0);

    updateMainHeadings();
    updateCampaignBars(counts);
    renderStatusList(dashboard.statusBreakdown || []);
    updateTimeline(dashboard.activityFeed || []);
    updateRecentOrdersTable(dashboard.activityFeed || []);
    renderQuickTasks(counts);

    window.SERENITY_ADMIN_DASHBOARD = dashboard;
    dispatchSerenityEvent("serenity-admin-dashboard-loaded", dashboard);
  } catch (error) {
    showAdminError(error.message);
  }
}

document.addEventListener("DOMContentLoaded", initExecutiveOverview);