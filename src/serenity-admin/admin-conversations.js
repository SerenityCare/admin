import {
  getConversationMessages,
  getConversations,
  updateConversationStatus
} from "./admin-api.js";
import {
  escapeHtml,
  formatDate,
  renderEmptyRow,
  setHtml,
  showAdminError,
  statusBadge
} from "./admin-utils.js";

function renderConversations(rows = []) {
  if (!rows.length) return renderEmptyRow(8);

  return rows
    .map(
      (row) => `
        <tr data-id="${escapeHtml(row.id)}">
          <td>${escapeHtml(row.user_name || "Visitor")}</td>
          <td>${escapeHtml(row.user_phone || "")}</td>
          <td>${escapeHtml(row.user_email || "")}</td>
          <td>${escapeHtml(row.last_intent || "")}</td>
          <td>${escapeHtml(row.message_count || 0)}</td>
          <td>${statusBadge(row.status)}</td>
          <td>
            <button class="btn btn-sm btn-primary serenity-view-conversation" data-session-id="${escapeHtml(row.id)}">
              View
            </button>
            <button class="btn btn-sm btn-success serenity-close-conversation" data-session-id="${escapeHtml(row.id)}">
              Close
            </button>
          </td>
          <td>${escapeHtml(formatDate(row.last_message_at || row.created_at))}</td>
        </tr>
      `
    )
    .join("");
}

function renderMessages(rows = []) {
  if (!rows.length) {
    return `<p class="text-muted">No messages found for this conversation.</p>`;
  }

  return rows
    .map(
      (row) => `
        <div class="mb-3 p-3 border rounded">
          <div class="d-flex justify-content-between">
            <strong>${escapeHtml(row.role)}</strong>
            <small class="text-muted">${escapeHtml(formatDate(row.created_at))}</small>
          </div>
          <div class="mt-2">${escapeHtml(row.message_text)}</div>
        </div>
      `
    )
    .join("");
}

async function openConversation(sessionId) {
  const data = await getConversationMessages(sessionId);
  setHtml("serenity-conversation-messages", renderMessages(data.messages || []));

  const modalEl = document.getElementById("serenityConversationModal");
  if (modalEl && window.bootstrap?.Modal) {
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}

function wireConversationEvents() {
  document.addEventListener("click", async (event) => {
    const viewButton = event.target.closest(".serenity-view-conversation");
    if (viewButton) {
      try {
        await openConversation(viewButton.dataset.sessionId);
      } catch (error) {
        console.error(error);
        showAdminError(error.message);
      }
      return;
    }

    const closeButton = event.target.closest(".serenity-close-conversation");
    if (closeButton) {
      closeButton.disabled = true;

      try {
        await updateConversationStatus(closeButton.dataset.sessionId, "closed");
        window.location.reload();
      } catch (error) {
        console.error(error);
        showAdminError(error.message);
        closeButton.disabled = false;
      }
    }
  });
}

async function initSerenityConversations() {
  try {
    const data = await getConversations();
    setHtml("serenity-admin-table-body", renderConversations(data.conversations || []));
    wireConversationEvents();
  } catch (error) {
    console.error(error);
    showAdminError(error.message);
  }
}

document.addEventListener("DOMContentLoaded", initSerenityConversations);