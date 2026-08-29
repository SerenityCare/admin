function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function statusBadge(status) {
  const clean = escapeHtml(status || "unknown");
  const normalized = String(status || "").toLowerCase();

  let color = "secondary";

  if (["new", "pending", "active", "confirmed"].includes(normalized)) color = "primary";
  if (["contacted", "scheduled", "completed", "replied", "closed"].includes(normalized)) color = "success";
  if (["read", "rescheduled"].includes(normalized)) color = "warning";
  if (["cancelled", "no_show", "spam", "archived"].includes(normalized)) color = "danger";

  return `<span class="badge bg-${color}">${clean}</span>`;
}

export function renderTopCards(counts = {}) {
  const cards = document.querySelectorAll(".right_col .row.gy-4.mb-4 .card");

  const items = [
    ["Total Leads", counts.total_leads || 0],
    ["Open Leads", counts.open_leads || 0],
    ["Appointments", counts.total_appointments || 0],
    ["Open Appointments", counts.open_appointments || 0],
    ["Contact Messages", counts.total_contact_messages || 0],
    ["Active Chats", counts.active_conversations || 0]
  ];

  items.forEach(([label, value], index) => {
    const card = cards[index];
    if (!card) return;

    const labelEl = card.querySelector("h6");
    const valueEl = card.querySelector("h4.mb-0");
    const noteEl = card.querySelector(".mt-2 .text-muted");

    if (labelEl) labelEl.textContent = label;
    if (valueEl) valueEl.textContent = value;
    if (noteEl) noteEl.textContent = "Live Serenity data";
  });
}

export function renderHeadings() {
  const replacements = [
    ["Network Activities", "Serenity Activity", "Live operational overview"],
    ["Top Campaign Performance", "Request Mix", ""],
    ["App Versions", "Status Overview", ""],
    ["Recent Activities", "Recent Serenity Activities", "Live sessions"],
    ["Recent Orders", "Recent Serenity Requests", "Latest leads, contacts, appointments, and chats"],
    ["To Do List", "Serenity To Do List", "Today"],
    ["Visitors location", "Service Area Snapshot", "Serenity coverage"]
  ];

  document.querySelectorAll(".x_panel .x_title h4, .dashboard_graph .x_title h3").forEach((title) => {
    const match = replacements.find(([oldText]) =>
      title.textContent.trim().toLowerCase().includes(oldText.toLowerCase())
    );

    if (!match) return;

    title.innerHTML = `${escapeHtml(match[1])}${match[2] ? ` <small>${escapeHtml(match[2])}</small>` : ""}`;
  });
}

export function renderRequestMix(counts = {}) {
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

export function renderStatusOverview(rows = []) {
  const target = document.querySelector(".widget_summary")?.parentElement;
  if (!target) return;

  const total = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);

  target.innerHTML = `
    <h6>Requests by status</h6>
    ${rows.slice(0, 5).map((row) => {
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
    }).join("")}
  `;
}

export function renderTimeline(rows = []) {
  const timeline = document.querySelector(".timeline.widget");
  if (!timeline) return;

  timeline.innerHTML = rows.length
    ? rows.slice(0, 7).map((row) => `
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
    `).join("")
    : `
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

export function renderRecentRequests(rows = []) {
  const table = document.querySelector(".recent-orders-scroll table tbody");
  if (!table) return;

  table.innerHTML = rows.length
    ? rows.slice(0, 8).map((row, index) => `
      <tr class="${index % 2 === 0 ? "even" : "odd"} pointer">
        <td><strong>${escapeHtml(row.activity_type || "Request")}</strong></td>
        <td>${escapeHtml(row.title || "Website visitor")}</td>
        <td>${escapeHtml(row.description || "")}</td>
        <td><strong>${escapeHtml(row.status || "")}</strong></td>
        <td>${statusBadge(row.status)}</td>
        <td>${escapeHtml(formatDate(row.created_at))}</td>
        <td class="last"><a href="inbox.html" class="btn btn-sm btn-primary">View</a></td>
      </tr>
    `).join("")
    : `<tr><td colspan="7" class="text-center text-muted">No recent Serenity requests yet.</td></tr>`;
}

export function renderTodo(counts = {}) {
  const list = document.querySelector(".to_do");
  if (!list) return;

  list.innerHTML = `
    <li><div class="form-check"><input type="checkbox" id="todo-serenity-1" class="form-check-input flat"><label for="todo-serenity-1" class="form-check-label">Review ${escapeHtml(counts.open_leads || 0)} open lead request(s)</label></div></li>
    <li><div class="form-check"><input type="checkbox" id="todo-serenity-2" class="form-check-input flat"><label for="todo-serenity-2" class="form-check-label">Follow up on ${escapeHtml(counts.open_appointments || 0)} open appointment request(s)</label></div></li>
    <li><div class="form-check"><input type="checkbox" id="todo-serenity-3" class="form-check-input flat"><label for="todo-serenity-3" class="form-check-label">Read ${escapeHtml(counts.unread_contact_messages || 0)} unread contact message(s)</label></div></li>
    <li><div class="form-check"><input type="checkbox" id="todo-serenity-4" class="form-check-input flat"><label for="todo-serenity-4" class="form-check-label">Check ${escapeHtml(counts.active_conversations || 0)} active assistant chat(s)</label></div></li>
  `;
}

export function showIndexError(error) {
  console.error("[index]", error);
}