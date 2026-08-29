import "./admin-layout.js";

import {
  getAppointments,
  getBlogPosts,
  getContacts,
  getFaqs,
  getLeads,
  getPricing,
  getServices,
  updateAppointmentStatus,
  updateContactStatus,
  updateLeadStatus
} from "./admin-api.js";

import {
  escapeHtml,
  formatDate,
  replaceFirstTableBody,
  showAdminError,
  statusBadge,
  statusSelect,
  tryInitDataTable
} from "./admin-utils.js";

function pageMode() {
  return document.body.dataset.serenityAdminPage || "leads";
}

function cells(values = []) {
  return values.map((value) => `<td>${value}</td>`).join("");
}

function renderLeads(rows = []) {
  if (!rows.length) {
    return `<tr><td colspan="8" class="text-center text-muted">No leads found.</td></tr>`;
  }

  return rows
    .map(
      (row) => `
        <tr data-id="${escapeHtml(row.id)}">
          ${cells([
            escapeHtml(row.full_name || "Website visitor"),
            escapeHtml(row.phone || ""),
            escapeHtml(row.email || ""),
            escapeHtml(row.service_interest || ""),
            escapeHtml(row.preferred_contact_time || ""),
            statusBadge(row.status),
            statusSelect(row.status, ["new", "pending", "contacted", "scheduled", "closed", "spam"]),
            escapeHtml(formatDate(row.created_at))
          ])}
        </tr>
      `
    )
    .join("");
}

function renderAppointments(rows = []) {
  if (!rows.length) {
    return `<tr><td colspan="8" class="text-center text-muted">No appointments found.</td></tr>`;
  }

  return rows
    .map(
      (row) => `
        <tr data-id="${escapeHtml(row.id)}">
          ${cells([
            escapeHtml(row.full_name || "Website visitor"),
            escapeHtml(row.phone || ""),
            escapeHtml(row.email || ""),
            escapeHtml(row.desired_service || ""),
            escapeHtml(row.desired_datetime_text || ""),
            statusBadge(row.status),
            statusSelect(row.status, ["pending", "confirmed", "rescheduled", "completed", "cancelled", "no_show"]),
            escapeHtml(formatDate(row.created_at))
          ])}
        </tr>
      `
    )
    .join("");
}

function renderContacts(rows = []) {
  if (!rows.length) {
    return `<tr><td colspan="7" class="text-center text-muted">No contact messages found.</td></tr>`;
  }

  return rows
    .map(
      (row) => `
        <tr data-id="${escapeHtml(row.id)}">
          ${cells([
            escapeHtml(row.full_name || [row.first_name, row.last_name].filter(Boolean).join(" ") || "Website visitor"),
            escapeHtml(row.email || ""),
            escapeHtml(row.subject || ""),
            escapeHtml(row.message || ""),
            statusBadge(row.status),
            statusSelect(row.status, ["new", "read", "replied", "closed", "spam"]),
            escapeHtml(formatDate(row.created_at))
          ])}
        </tr>
      `
    )
    .join("");
}

function renderServices(rows = []) {
  if (!rows.length) {
    return `<tr><td colspan="7" class="text-center text-muted">No services found.</td></tr>`;
  }

  return rows
    .map(
      (row) => `
        <tr>
          ${cells([
            escapeHtml(row.name || ""),
            escapeHtml(row.slug || ""),
            escapeHtml(row.short_description || ""),
            escapeHtml(row.href || ""),
            row.is_featured ? "Yes" : "No",
            row.is_active ? "Active" : "Inactive",
            escapeHtml(row.sort_order || 0)
          ])}
        </tr>
      `
    )
    .join("");
}

function renderPricing(rows = []) {
  if (!rows.length) {
    return `<tr><td colspan="7" class="text-center text-muted">No pricing found.</td></tr>`;
  }

  return rows
    .map(
      (row) => `
        <tr>
          ${cells([
            escapeHtml(row.service_name || ""),
            escapeHtml(row.pricing_label || ""),
            escapeHtml(row.pricing_display || ""),
            escapeHtml(row.price_min || ""),
            escapeHtml(row.price_max || ""),
            escapeHtml(row.billing_unit || ""),
            row.is_active ? "Active" : "Inactive"
          ])}
        </tr>
      `
    )
    .join("");
}

function renderBlog(rows = []) {
  if (!rows.length) {
    return `<tr><td colspan="7" class="text-center text-muted">No blog posts found.</td></tr>`;
  }

  return rows
    .map(
      (row) => `
        <tr>
          ${cells([
            escapeHtml(row.title || ""),
            escapeHtml(row.slug || ""),
            escapeHtml(row.author_name || ""),
            escapeHtml(row.post_date_label || ""),
            row.is_featured ? "Yes" : "No",
            row.is_active ? "Active" : "Inactive",
            escapeHtml(formatDate(row.created_at))
          ])}
        </tr>
      `
    )
    .join("");
}

function renderFaqs(rows = []) {
  if (!rows.length) {
    return `<tr><td colspan="6" class="text-center text-muted">No FAQs found.</td></tr>`;
  }

  return rows
    .map(
      (row) => `
        <tr>
          ${cells([
            escapeHtml(row.question || ""),
            escapeHtml(row.topic || ""),
            escapeHtml(row.priority || 0),
            row.is_active ? "Active" : "Inactive",
            escapeHtml(row.sort_order || 0),
            escapeHtml(formatDate(row.updated_at || row.created_at))
          ])}
        </tr>
      `
    )
    .join("");
}

async function loadMode(mode) {
  if (mode === "appointments") {
    const data = await getAppointments();
    return { rows: data.appointments || [], html: renderAppointments(data.appointments || []) };
  }

  if (mode === "contacts") {
    const data = await getContacts();
    return { rows: data.contactMessages || [], html: renderContacts(data.contactMessages || []) };
  }

  if (mode === "services") {
    const data = await getServices();
    return { rows: data.services || [], html: renderServices(data.services || []) };
  }

  if (mode === "pricing") {
    const data = await getPricing();
    return { rows: data.pricing || [], html: renderPricing(data.pricing || []) };
  }

  if (mode === "blog") {
    const data = await getBlogPosts();
    return { rows: data.blogPosts || [], html: renderBlog(data.blogPosts || []) };
  }

  if (mode === "faqs") {
    const data = await getFaqs();
    return { rows: data.faqs || [], html: renderFaqs(data.faqs || []) };
  }

  const data = await getLeads();
  return { rows: data.leads || [], html: renderLeads(data.leads || []) };
}

async function updateStatus(mode, id, status) {
  if (mode === "appointments") return updateAppointmentStatus(id, status);
  if (mode === "contacts") return updateContactStatus(id, status);
  return updateLeadStatus(id, status);
}

function wireStatusChanges(mode) {
  document.addEventListener("change", async (event) => {
    const select = event.target.closest(".serenity-status-select");
    if (!select) return;

    const row = select.closest("tr");
    const id = row?.dataset?.id;
    if (!id) return;

    select.disabled = true;

    try {
      await updateStatus(mode, id, select.value);
      window.location.reload();
    } catch (error) {
      select.disabled = false;
      showAdminError(error.message);
    }
  });
}

async function initDynamicTable() {
  try {
    const mode = pageMode();
    const result = await loadMode(mode);

    replaceFirstTableBody(result.html);
    wireStatusChanges(mode);
    tryInitDataTable();
  } catch (error) {
    showAdminError(error.message);
  }
}

document.addEventListener("DOMContentLoaded", initDynamicTable);