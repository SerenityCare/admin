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
  renderEmptyRow,
  setHtml,
  showAdminError,
  statusBadge
} from "./admin-utils.js";

function getPageType() {
  return document.body?.dataset?.serenityAdminPage || "";
}

function statusSelect(current, options = []) {
  return `
    <select class="form-select form-select-sm serenity-status-select">
      ${options
        .map(
          (option) =>
            `<option value="${escapeHtml(option)}" ${
              option === current ? "selected" : ""
            }>${escapeHtml(option)}</option>`
        )
        .join("")}
    </select>
  `;
}

function renderLeads(rows = []) {
  if (!rows.length) return renderEmptyRow(8);

  return rows
    .map(
      (row) => `
        <tr data-id="${escapeHtml(row.id)}">
          <td>${escapeHtml(row.full_name || "")}</td>
          <td>${escapeHtml(row.phone || "")}</td>
          <td>${escapeHtml(row.email || "")}</td>
          <td>${escapeHtml(row.service_interest || "")}</td>
          <td>${escapeHtml(row.preferred_contact_time || "")}</td>
          <td>${statusBadge(row.status)}</td>
          <td>${statusSelect(row.status, ["new", "pending", "contacted", "scheduled", "closed", "spam"])}</td>
          <td>${escapeHtml(formatDate(row.created_at))}</td>
        </tr>
      `
    )
    .join("");
}

function renderAppointments(rows = []) {
  if (!rows.length) return renderEmptyRow(8);

  return rows
    .map(
      (row) => `
        <tr data-id="${escapeHtml(row.id)}">
          <td>${escapeHtml(row.full_name || "")}</td>
          <td>${escapeHtml(row.phone || "")}</td>
          <td>${escapeHtml(row.email || "")}</td>
          <td>${escapeHtml(row.desired_service || "")}</td>
          <td>${escapeHtml(row.desired_datetime_text || "")}</td>
          <td>${statusBadge(row.status)}</td>
          <td>${statusSelect(row.status, ["pending", "confirmed", "rescheduled", "completed", "cancelled", "no_show"])}</td>
          <td>${escapeHtml(formatDate(row.created_at))}</td>
        </tr>
      `
    )
    .join("");
}

function renderContacts(rows = []) {
  if (!rows.length) return renderEmptyRow(7);

  return rows
    .map(
      (row) => `
        <tr data-id="${escapeHtml(row.id)}">
          <td>${escapeHtml(row.full_name || "")}</td>
          <td>${escapeHtml(row.email || "")}</td>
          <td>${escapeHtml(row.subject || "")}</td>
          <td>${escapeHtml(row.message || "")}</td>
          <td>${statusBadge(row.status)}</td>
          <td>${statusSelect(row.status, ["new", "read", "replied", "closed", "spam"])}</td>
          <td>${escapeHtml(formatDate(row.created_at))}</td>
        </tr>
      `
    )
    .join("");
}

function renderServices(rows = []) {
  if (!rows.length) return renderEmptyRow(7);

  return rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.name || "")}</td>
          <td>${escapeHtml(row.slug || "")}</td>
          <td>${escapeHtml(row.short_description || "")}</td>
          <td>${escapeHtml(row.href || "")}</td>
          <td>${row.is_featured ? "Yes" : "No"}</td>
          <td>${row.is_active ? "Active" : "Inactive"}</td>
          <td>${escapeHtml(row.sort_order || 0)}</td>
        </tr>
      `
    )
    .join("");
}

function renderPricing(rows = []) {
  if (!rows.length) return renderEmptyRow(7);

  return rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.service_name || "")}</td>
          <td>${escapeHtml(row.pricing_label || "")}</td>
          <td>${escapeHtml(row.pricing_display || "")}</td>
          <td>${escapeHtml(row.price_min || "")}</td>
          <td>${escapeHtml(row.price_max || "")}</td>
          <td>${escapeHtml(row.billing_unit || "")}</td>
          <td>${row.is_active ? "Active" : "Inactive"}</td>
        </tr>
      `
    )
    .join("");
}

function renderBlog(rows = []) {
  if (!rows.length) return renderEmptyRow(7);

  return rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.title || "")}</td>
          <td>${escapeHtml(row.slug || "")}</td>
          <td>${escapeHtml(row.author_name || "")}</td>
          <td>${escapeHtml(row.post_date_label || "")}</td>
          <td>${row.is_featured ? "Yes" : "No"}</td>
          <td>${row.is_active ? "Active" : "Inactive"}</td>
          <td>${escapeHtml(formatDate(row.created_at))}</td>
        </tr>
      `
    )
    .join("");
}

function renderFaqs(rows = []) {
  if (!rows.length) return renderEmptyRow(6);

  return rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.question || "")}</td>
          <td>${escapeHtml(row.topic || "")}</td>
          <td>${escapeHtml(row.priority || 0)}</td>
          <td>${row.is_active ? "Active" : "Inactive"}</td>
          <td>${escapeHtml(row.sort_order || 0)}</td>
          <td>${escapeHtml(formatDate(row.updated_at))}</td>
        </tr>
      `
    )
    .join("");
}

async function updateStatusForPage(pageType, id, status) {
  if (pageType === "leads") return updateLeadStatus(id, status);
  if (pageType === "appointments") return updateAppointmentStatus(id, status);
  if (pageType === "contacts") return updateContactStatus(id, status);
  return null;
}

function wireStatusUpdates(pageType) {
  document.addEventListener("change", async (event) => {
    const select = event.target.closest(".serenity-status-select");
    if (!select) return;

    const row = select.closest("tr");
    const id = row?.dataset?.id;
    if (!id) return;

    select.disabled = true;

    try {
      await updateStatusForPage(pageType, id, select.value);
      window.location.reload();
    } catch (error) {
      console.error(error);
      showAdminError(error.message);
      select.disabled = false;
    }
  });
}

async function initSerenityTablePage() {
  const pageType = getPageType();

  try {
    if (pageType === "leads") {
      const data = await getLeads();
      setHtml("serenity-admin-table-body", renderLeads(data.leads || []));
      wireStatusUpdates(pageType);
      return;
    }

    if (pageType === "appointments") {
      const data = await getAppointments();
      setHtml("serenity-admin-table-body", renderAppointments(data.appointments || []));
      wireStatusUpdates(pageType);
      return;
    }

    if (pageType === "contacts") {
      const data = await getContacts();
      setHtml("serenity-admin-table-body", renderContacts(data.contactMessages || []));
      wireStatusUpdates(pageType);
      return;
    }

    if (pageType === "services") {
      const data = await getServices();
      setHtml("serenity-admin-table-body", renderServices(data.services || []));
      return;
    }

    if (pageType === "pricing") {
      const data = await getPricing();
      setHtml("serenity-admin-table-body", renderPricing(data.pricing || []));
      return;
    }

    if (pageType === "blog") {
      const data = await getBlogPosts();
      setHtml("serenity-admin-table-body", renderBlog(data.blogPosts || []));
      return;
    }

    if (pageType === "faqs") {
      const data = await getFaqs();
      setHtml("serenity-admin-table-body", renderFaqs(data.faqs || []));
    }
  } catch (error) {
    console.error(error);
    showAdminError(error.message);
  }
}

document.addEventListener("DOMContentLoaded", initSerenityTablePage);