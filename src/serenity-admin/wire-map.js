import "./admin-layout.js";

import {
  getBusinessProfile,
  getDashboard,
  getLocations
} from "./admin-api.js";

import {
  escapeHtml,
  showAdminError
} from "./admin-utils.js";

function renderLocationFallback({ profile = {}, locations = [], counts = {} }) {
  const target =
    document.querySelector(".right_col .x_content") ||
    document.querySelector(".right_col");

  if (!target) return;

  target.innerHTML = `
    <div class="x_panel">
      <div class="x_title">
        <h4>Serenity Service Area</h4>
        <div class="clearfix"></div>
      </div>
      <div class="x_content">
        <div class="row">
          <div class="col-md-4">
            <h5>Business Profile</h5>
            <p><strong>${escapeHtml(profile.business_name || "Serenity Care Service")}</strong></p>
            <p>${escapeHtml(profile.description_short || profile.tagline || "")}</p>
            <p><i class="fa fa-phone"></i> ${escapeHtml(profile.primary_phone || "")}</p>
            <p><i class="fa fa-envelope"></i> ${escapeHtml(profile.primary_email || "")}</p>
            <p><i class="fa fa-map-marker"></i> ${escapeHtml([profile.base_city, profile.base_county, profile.state].filter(Boolean).join(", "))}</p>
          </div>

          <div class="col-md-4">
            <h5>Service Coverage</h5>
            ${
              locations.length
                ? locations
                    .map(
                      (location) => `
                        <div class="mb-3">
                          <strong>${escapeHtml(location.location_name || "")}</strong><br>
                          ${escapeHtml(location.address_line_1 || "")}<br>
                          ${escapeHtml([location.city, location.county, location.state, location.postal_code].filter(Boolean).join(", "))}
                          ${
                            location.google_maps_url
                              ? `<br><a href="${escapeHtml(location.google_maps_url)}" target="_blank" rel="noopener">Open map</a>`
                              : ""
                          }
                        </div>
                      `
                    )
                    .join("")
                : `<p class="text-muted">No location records found yet.</p>`
            }
          </div>

          <div class="col-md-4">
            <h5>Request Activity</h5>
            <p><strong>Total Leads:</strong> ${escapeHtml(counts.total_leads || 0)}</p>
            <p><strong>Total Appointments:</strong> ${escapeHtml(counts.total_appointments || 0)}</p>
            <p><strong>Contact Messages:</strong> ${escapeHtml(counts.total_contact_messages || 0)}</p>
            <p><strong>Assistant Chats:</strong> ${escapeHtml(counts.total_conversations || 0)}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function initServiceAreaMap() {
  try {
    const [profileResult, locationsResult, dashboardResult] = await Promise.allSettled([
      getBusinessProfile(),
      getLocations(),
      getDashboard()
    ]);

    const profile =
      profileResult.status === "fulfilled"
        ? profileResult.value.businessProfile || profileResult.value.profile || {}
        : {};

    const locations =
      locationsResult.status === "fulfilled"
        ? locationsResult.value.locations || []
        : [];

    const counts =
      dashboardResult.status === "fulfilled"
        ? dashboardResult.value.dashboard?.counts || {}
        : {};

    renderLocationFallback({
      profile,
      locations,
      counts
    });
  } catch (error) {
    showAdminError(error.message);
  }
}

document.addEventListener("DOMContentLoaded", initServiceAreaMap);