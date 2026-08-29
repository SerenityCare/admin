import {
  getIndexDashboardData,
  getIndexFallbackData
} from "./index.api.js";

import {
  renderHeadings,
  renderRecentRequests,
  renderRequestMix,
  renderStatusOverview,
  renderTimeline,
  renderTodo,
  renderTopCards,
  showIndexError
} from "./index.render.js";

async function loadData() {
  try {
    const data = await getIndexDashboardData();
    return data.dashboard || {};
  } catch (error) {
    showIndexError(error);

    const fallback = await getIndexFallbackData();
    return fallback.dashboard || {};
  }
}

export async function init() {
  const dashboard = await loadData();
  const counts = dashboard.counts || {};

  renderTopCards(counts);
  renderHeadings();
  renderRequestMix(counts);
  renderStatusOverview(dashboard.statusBreakdown || []);
  renderTimeline(dashboard.activityFeed || []);
  renderRecentRequests(dashboard.activityFeed || []);
  renderTodo(counts);

  window.SERENITY_ADMIN_DASHBOARD = dashboard;
}