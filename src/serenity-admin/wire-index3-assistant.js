import "./admin-layout.js";

import {
  getConversations,
  getDashboard
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

function countRisk(rows = [], level) {
  return rows.filter((row) => String(row.risk_level || "").toLowerCase() === level).length;
}

function renderConversationRows(rows = []) {
  if (!rows.length) {
    return `
      <tr>
        <td colspan="7" class="text-center text-muted">No assistant conversations yet.</td>
      </tr>
    `;
  }

  return rows
    .slice(0, 12)
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.user_name || "Visitor")}</td>
          <td>${escapeHtml(row.user_phone || "")}</td>
          <td>${escapeHtml(row.user_email || "")}</td>
          <td>${escapeHtml(row.last_intent || "")}</td>
          <td>${escapeHtml(row.message_count || 0)}</td>
          <td>${statusBadge(row.status)}</td>
          <td>${escapeHtml(formatDate(row.last_message_at || row.created_at))}</td>
        </tr>
      `
    )
    .join("");
}

function renderIntentRows(rows = []) {
  const grouped = rows.reduce((acc, row) => {
    const key = row.last_intent || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(grouped);

  if (!entries.length) {
    return `
      <tr>
        <td colspan="2" class="text-center text-muted">No intent data yet.</td>
      </tr>
    `;
  }

  return entries
    .slice(0, 10)
    .map(
      ([intent, total]) => `
        <tr>
          <td>${escapeHtml(intent)}</td>
          <td>${escapeHtml(total)}</td>
        </tr>
      `
    )
    .join("");
}

function renderRiskRows(rows = []) {
  const levels = ["low", "medium", "high"];

  return levels
    .map(
      (level) => `
        <tr>
          <td>${escapeHtml(level)}</td>
          <td>${countRisk(rows, level)}</td>
        </tr>
      `
    )
    .join("");
}

async function initAssistantDashboard() {
  try {
    const [dashboardData, conversationsData] = await Promise.all([
      getDashboard(),
      getConversations()
    ]);

    const counts = dashboardData.dashboard?.counts || {};
    const conversations = conversationsData.conversations || [];

    updateTileByIndex(0, counts.total_conversations || conversations.length, `<i class="fa fa-comments"></i> Total Chats`);
    updateTileByIndex(1, countByStatus(conversations, ["active"]), `<i class="fa fa-circle"></i> Active`);
    updateTileByIndex(2, countByStatus(conversations, ["closed"]), `<i class="fa fa-check"></i> Closed`);
    updateTileByIndex(3, countByStatus(conversations, ["archived"]), `<i class="fa fa-archive"></i> Archived`);
    updateTileByIndex(4, countRisk(conversations, "medium"), `<i class="fa fa-exclamation"></i> Medium Risk`);
    updateTileByIndex(5, countRisk(conversations, "high"), `<i class="fa fa-warning"></i> High Risk`);

    updatePanelTitleByIndex(0, "Recent Assistant Conversations");
    replacePanelTableByIndex(0, renderConversationRows(conversations));

    updatePanelTitleByIndex(1, "Intent Breakdown");
    replacePanelTableByIndex(1, renderIntentRows(conversations));

    updatePanelTitleByIndex(2, "Risk Breakdown");
    replacePanelTableByIndex(2, renderRiskRows(conversations));

    dispatchSerenityEvent("serenity-admin-conversations-loaded", {
      conversations,
      counts
    });
  } catch (error) {
    showAdminError(error.message);
  }
}

document.addEventListener("DOMContentLoaded", initAssistantDashboard);