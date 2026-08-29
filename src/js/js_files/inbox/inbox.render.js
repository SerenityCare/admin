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

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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

function initials(name = "Serenity") {
  const parts = String(name || "Serenity").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "SC";
}

function avatarDataUri(name) {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="40" fill="#2A3F54"/>
      <text x="40" y="49" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700" fill="#ffffff">${escapeHtml(initials(name))}</text>
    </svg>
  `);
}

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") || "";
}

function normalizeLead(row = {}) {
  const name = pick(row.full_name, row.name, "Website visitor");

  return {
    id: row.id || row.slug || `lead-${Math.random()}`,
    category: "callbacks",
    categoryLabel: "Callback",
    sender: name,
    email: row.email || "",
    phone: row.phone || "",
    subject: pick(row.service_interest, "Requested callback"),
    message: pick(row.message, row.preferred_contact_time, "Requested a callback from Serenity Care Service."),
    status: pick(row.status, "new"),
    created_at: row.created_at || row.updated_at || "",
    meta: [
      ["Preferred contact", row.preferred_contact_method],
      ["Preferred time", row.preferred_contact_time],
      ["Service interest", row.service_interest],
      ["County", row.county],
      ["Assigned to", row.assigned_to]
    ]
  };
}

function normalizeAppointment(row = {}) {
  const name = pick(row.full_name, row.name, "Website visitor");

  return {
    id: row.id || row.slug || `appointment-${Math.random()}`,
    category: "appointments",
    categoryLabel: "Appointment",
    sender: name,
    email: row.email || "",
    phone: row.phone || "",
    subject: pick(row.desired_service, "Appointment request"),
    message: pick(row.notes, row.desired_datetime_text, "Requested an appointment with Serenity Care Service."),
    status: pick(row.status, "pending"),
    created_at: row.created_at || row.updated_at || "",
    meta: [
      ["Desired service", row.desired_service],
      ["Desired date/time", row.desired_datetime_text],
      ["Location preference", row.location_preference]
    ]
  };
}

function normalizeContact(row = {}) {
  const name = pick(row.full_name, `${row.first_name || ""} ${row.last_name || ""}`.trim(), "Website visitor");

  return {
    id: row.id || row.slug || `contact-${Math.random()}`,
    category: "contacts",
    categoryLabel: "Contact Message",
    sender: name,
    email: row.email || "",
    phone: row.phone || "",
    subject: pick(row.subject, "Contact form message"),
    message: pick(row.message, "New contact form message."),
    status: pick(row.status, "new"),
    created_at: row.created_at || row.updated_at || "",
    meta: [
      ["First name", row.first_name],
      ["Last name", row.last_name]
    ]
  };
}

function normalizeConversation(row = {}) {
  const name = pick(row.user_name, row.session_token, "Assistant chat");

  return {
    id: row.id || row.session_id || row.session_token || `chat-${Math.random()}`,
    category: "chats",
    categoryLabel: "Assistant Chat",
    sender: name,
    email: row.user_email || "",
    phone: row.user_phone || "",
    subject: pick(row.last_intent, "Assistant conversation"),
    message: pick(row.running_summary, row.last_message_text, row.message_text, row.location_guess, "Recent assistant chat from the website."),
    status: pick(row.status, "active"),
    created_at: row.last_message_at || row.started_at || row.created_at || row.updated_at || "",
    meta: [
      ["Session token", row.session_token],
      ["Channel", row.channel],
      ["Risk level", row.risk_level],
      ["Last intent", row.last_intent]
    ]
  };
}

function normalizeActivity(row = {}) {
  return {
    id: row.id || row.created_at || `activity-${Math.random()}`,
    category: "all",
    categoryLabel: pick(row.activity_type, "Activity"),
    sender: pick(row.title, "Serenity activity"),
    email: "",
    phone: "",
    subject: pick(row.activity_type, "Recent activity"),
    message: pick(row.description, "Recent Serenity activity."),
    status: pick(row.status, ""),
    created_at: row.created_at || "",
    meta: [["Activity type", row.activity_type]]
  };
}

function uniqueRows(rows = []) {
  const seen = new Set();

  return rows.filter((row) => {
    const key = `${row.category}-${row.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeInboxRows(dashboard = {}) {
  const rows = [
    ...(dashboard.recentLeads || []).map(normalizeLead),
    ...(dashboard.recentAppointments || []).map(normalizeAppointment),
    ...(dashboard.recentContacts || []).map(normalizeContact),
    ...(dashboard.recentConversations || []).map(normalizeConversation),
    ...(dashboard.activityFeed || []).map(normalizeActivity)
  ];

  return uniqueRows(rows).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

function getFilteredRows(rows = []) {
  const activeFilter = document.querySelector("[data-inbox-filter].active")?.dataset.inboxFilter || "all";
  const search = document.querySelector("[data-inbox-search]")?.value.trim().toLowerCase() || "";

  return rows.filter((row) => {
    const matchesFilter = activeFilter === "all" || row.category === activeFilter;
    const searchable = `${row.sender} ${row.email} ${row.phone} ${row.subject} ${row.message} ${row.status} ${row.categoryLabel}`.toLowerCase();
    return matchesFilter && (!search || searchable.includes(search));
  });
}

function renderList(rows = []) {
  const list = document.querySelector("[data-inbox-list]");
  if (!list) return;

  if (!rows.length) {
    list.innerHTML = `<div class="text-center text-muted p-4">No matching Serenity messages found.</div>`;
    return;
  }

  list.innerHTML = rows.map((row, index) => `
    <a href="#" class="mail-item${index === 0 ? " active" : ""}" data-inbox-id="${escapeHtml(row.id)}" data-inbox-category="${escapeHtml(row.category)}">
      <div class="mail_list">
        <div class="left">
          ${index === 0 ? '<i class="fas fa-star text-warning"></i>' : '<i class="far fa-circle text-muted"></i>'}
        </div>
        <div class="right">
          <h3>${escapeHtml(row.sender)} <small class="text-muted">${escapeHtml(formatTime(row.created_at))}</small></h3>
          <p><span class="badge bg-primary">${escapeHtml(row.categoryLabel)}</span> ${escapeHtml(row.subject)} — ${escapeHtml(row.message)}</p>
        </div>
      </div>
    </a>
  `).join("");
}

function renderDetail(row) {
  if (!row) return;

  const dateEl = document.querySelector("[data-inbox-date]");
  const subjectEl = document.querySelector("[data-inbox-subject]");
  const senderEl = document.querySelector("[data-inbox-sender]");
  const emailEl = document.querySelector("[data-inbox-email]");
  const messageEl = document.querySelector("[data-inbox-message]");
  const metaEl = document.querySelector("[data-inbox-meta]");
  const avatarEl = document.querySelector("[data-inbox-avatar]");

  if (dateEl) dateEl.textContent = formatDate(row.created_at);
  if (subjectEl) subjectEl.textContent = row.subject || row.categoryLabel;
  if (senderEl) senderEl.textContent = row.sender || "Website visitor";
  if (emailEl) emailEl.textContent = row.email ? `(${row.email})` : row.phone ? `(${row.phone})` : "";
  if (avatarEl) {
    avatarEl.src = avatarDataUri(row.sender);
    avatarEl.alt = row.sender || "Sender";
  }

  if (messageEl) {
    messageEl.innerHTML = `
      <p>${escapeHtml(row.message || "No message body was provided.")}</p>
      <p>${statusBadge(row.status)}</p>
    `;
  }

  if (metaEl) {
    const metaRows = [
      ["Type", row.categoryLabel],
      ["Status", row.status],
      ["Email", row.email],
      ["Phone", row.phone],
      ...(row.meta || [])
    ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "");

    metaEl.innerHTML = `
      <div class="attachment-header">
        <p><span><i class="fas fa-info-circle"></i> Message details</span></p>
      </div>
      <div class="table-responsive">
        <table class="table table-sm table-striped mb-0">
          <tbody>
            ${metaRows.map(([label, value]) => `
              <tr>
                <th style="width: 180px;">${escapeHtml(label)}</th>
                <td>${escapeHtml(value)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }
}

function refresh(rows = []) {
  const filtered = getFilteredRows(rows);
  renderList(filtered);
  renderDetail(filtered[0]);

  document.querySelectorAll("[data-inbox-id]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      document.querySelectorAll("[data-inbox-id]").forEach((el) => el.classList.remove("active"));
      item.classList.add("active");

      const row = rows.find((entry) => String(entry.id) === item.dataset.inboxId && String(entry.category) === item.dataset.inboxCategory);
      renderDetail(row);
    });
  });
}

export function renderInbox(rows = []) {
  refresh(rows);
}

export function bindInboxControls(rows = []) {
  document.querySelectorAll("[data-inbox-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-inbox-filter]").forEach((el) => {
        el.classList.remove("active", "btn-primary");
        el.classList.add("btn-outline-primary");
      });

      button.classList.add("active", "btn-primary");
      button.classList.remove("btn-outline-primary");
      refresh(rows);
    });
  });

  const search = document.querySelector("[data-inbox-search]");
  if (search) {
    search.addEventListener("input", () => refresh(rows));
  }
}

export function showInboxError(error) {
  console.error("[serenity-admin-inbox] Failed to load DB inbox data:", error);

  const list = document.querySelector("[data-inbox-list]");
  if (list) {
    list.innerHTML = `<div class="alert alert-warning">Live DB inbox could not be loaded. Showing fallback data.</div>`;
  }
}
