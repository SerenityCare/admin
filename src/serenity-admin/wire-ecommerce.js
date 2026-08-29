import "./admin-layout.js";

import {
  getPricing,
  getServices
} from "./admin-api.js";

import {
  escapeHtml,
  showAdminError,
  statusBadge
} from "./admin-utils.js";

function renderServiceCards(services = [], pricing = []) {
  if (!services.length) {
    return `
      <div class="col-12">
        <div class="alert alert-info">No services found yet.</div>
      </div>
    `;
  }

  return services
    .map((service) => {
      const servicePricing = pricing.filter(
        (row) =>
          row.service_id === service.id ||
          row.service_slug === service.slug ||
          row.service_name === service.name
      );

      return `
        <div class="col-md-4 col-sm-6 col-12">
          <div class="x_panel">
            <div class="x_title">
              <h4>${escapeHtml(service.name || "Service")}</h4>
              <div class="clearfix"></div>
            </div>
            <div class="x_content">
              <div class="thumbnail">
                ${
                  service.image_path
                    ? `<img src="${escapeHtml(service.image_path)}" alt="${escapeHtml(service.name)}" class="img-fluid">`
                    : `<div class="text-center p-4"><i class="${escapeHtml(service.icon_class || "fa fa-heart")} fa-3x"></i></div>`
                }
                <div class="caption">
                  <p>${escapeHtml(service.short_description || service.long_description || "")}</p>
                  <p>
                    ${service.is_featured ? `<span class="badge bg-success">Featured</span>` : ""}
                    ${service.is_active ? `<span class="badge bg-primary">Active</span>` : `<span class="badge bg-secondary">Inactive</span>`}
                  </p>
                  <hr>
                  <h5>Pricing</h5>
                  ${
                    servicePricing.length
                      ? servicePricing
                          .map(
                            (price) => `
                              <p class="mb-1">
                                <strong>${escapeHtml(price.pricing_label || price.billing_unit || "Rate")}:</strong>
                                ${escapeHtml(price.pricing_display || "")}
                              </p>
                            `
                          )
                          .join("")
                      : `<p class="text-muted">No pricing rows attached.</p>`
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderPricingTable(pricing = []) {
  if (!pricing.length) {
    return `
      <tr>
        <td colspan="7" class="text-center text-muted">No pricing rows found.</td>
      </tr>
    `;
  }

  return pricing
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.service_name || "")}</td>
          <td>${escapeHtml(row.pricing_label || "")}</td>
          <td>${escapeHtml(row.pricing_display || "")}</td>
          <td>${escapeHtml(row.price_min || "")}</td>
          <td>${escapeHtml(row.price_max || "")}</td>
          <td>${escapeHtml(row.billing_unit || "")}</td>
          <td>${statusBadge(row.is_active ? "active" : "inactive")}</td>
        </tr>
      `
    )
    .join("");
}

function replaceEcommerceContent(services, pricing) {
  const content =
    document.querySelector(".right_col .row") ||
    document.querySelector(".x_content .row") ||
    document.querySelector(".right_col");

  if (!content) return;

  content.innerHTML = `
    <div class="col-12">
      <div class="x_panel">
        <div class="x_title">
          <h4>Serenity Services & Pricing</h4>
          <div class="clearfix"></div>
        </div>
        <div class="x_content">
          <div class="row">
            ${renderServiceCards(services, pricing)}
          </div>
        </div>
      </div>
    </div>

    <div class="col-12">
      <div class="x_panel">
        <div class="x_title">
          <h4>Pricing Rows</h4>
          <div class="clearfix"></div>
        </div>
        <div class="x_content table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Service</th>
                <th>Label</th>
                <th>Display</th>
                <th>Min</th>
                <th>Max</th>
                <th>Unit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${renderPricingTable(pricing)}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

async function initServicesPricingCatalog() {
  try {
    const [servicesData, pricingData] = await Promise.all([
      getServices(),
      getPricing()
    ]);

    replaceEcommerceContent(
      servicesData.services || [],
      pricingData.pricing || []
    );
  } catch (error) {
    showAdminError(error.message);
  }
}

document.addEventListener("DOMContentLoaded", initServicesPricingCatalog);