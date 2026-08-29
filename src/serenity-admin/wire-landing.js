import {
  getDashboard
} from "./admin-api.js";

import {
  escapeHtml
} from "./admin-utils.js";

function renderAdminHub(counts = {}) {
  const target =
    document.querySelector("#pages") ||
    document.querySelector(".landing-section") ||
    document.querySelector("main") ||
    document.body;

  const hub = document.createElement("section");
  hub.className = "landing-section";
  hub.id = "serenity-admin-hub";

  hub.innerHTML = `
    <div class="container">
      <div class="section-header">
        <h2>Serenity Admin Hub</h2>
        <p>Quick access to Serenity Care Service operations.</p>
      </div>

      <div class="row g-4">
        <div class="col-md-3">
          <a class="card h-100 text-decoration-none" href="/dashboard">
            <div class="card-body">
              <h4>Executive Overview</h4>
              <p>${escapeHtml(counts.total_leads || 0)} leads</p>
            </div>
          </a>
        </div>

        <div class="col-md-3">
          <a class="card h-100 text-decoration-none" href="/scheduling">
            <div class="card-body">
              <h4>Leads & Intake</h4>
              <p>${escapeHtml(counts.open_leads || 0)} open leads</p>
            </div>
          </a>
        </div>

        <div class="col-md-3">
          <a class="card h-100 text-decoration-none" href="/inbox">
            <div class="card-body">
              <h4>Inbox</h4>
              <p>${escapeHtml(counts.unread_contact_messages || 0)} unread messages</p>
            </div>
          </a>
        </div>

        <div class="col-md-3">
          <a class="card h-100 text-decoration-none" href="/calendar">
            <div class="card-body">
              <h4>Appointments</h4>
              <p>${escapeHtml(counts.open_appointments || 0)} open appointments</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  `;

  target.insertAdjacentElement("afterend", hub);
}

async function initLandingHub() {
  try {
    const data = await getDashboard();
    renderAdminHub(data.dashboard?.counts || {});
  } catch {
    renderAdminHub({});
  }
}

document.addEventListener("DOMContentLoaded", initLandingHub);