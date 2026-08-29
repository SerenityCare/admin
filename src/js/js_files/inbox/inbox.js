import {
  getInboxDashboardData,
  getInboxFallbackData
} from "./inbox.api.js";

import {
  bindInboxControls,
  normalizeInboxRows,
  renderInbox,
  showInboxError
} from "./inbox.render.js";

async function loadData() {
  try {
    const data = await getInboxDashboardData();
    return data.dashboard || {};
  } catch (error) {
    showInboxError(error);

    const fallback = await getInboxFallbackData();
    return fallback.dashboard || {};
  }
}

export async function init() {
  const dashboard = await loadData();
  const rows = normalizeInboxRows(dashboard);

  renderInbox(rows);
  bindInboxControls(rows);

  window.SERENITY_ADMIN_INBOX = {
    dashboard,
    rows
  };
}
