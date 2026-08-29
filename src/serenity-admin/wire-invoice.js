import "./admin-layout.js";

import {
  getAppointments,
  getLeads,
  getPricing
} from "./admin-api.js";

import {
  escapeHtml,
  formatDate,
  showAdminError,
  statusBadge
} from "./admin-utils.js";

function getSelectedId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("appointment") || params.get("lead") || "";
}

function findSelectedRecord(leads = [], appointments = []) {
  const selectedId = getSelectedId();

  if (selectedId) {
    return (
      appointments.find((row) => row.id === selectedId || row.slug === selectedId) ||
      leads.find((row) => row.id === selectedId || row.slug === selectedId) ||
      appointments[0] ||
      leads[0] ||
      null
    );
  }

  return appointments[0] || leads[0] || null;
}

function findPricingForRecord(record, pricing = []) {
  if (!record) return [];

  const serviceName =
    record.desired_service ||
    record.service_interest ||
    "";

  return pricing.filter((row) =>
    String(row.service_name || "")
      .toLowerCase()
      .includes(String(serviceName).toLowerCase())
  );
}

function renderInvoice(record, pricingRows = []) {
  if (!record) {
    return `
      <div class="alert alert-info">
        No lead or appointment record found to summarize.
      </div>
    `;
  }

  const name = record.full_name || "Website visitor";
  const service = record.desired_service || record.service_interest || "Service request";
  const phone = record.phone || "";
  const email = record.email || "";
  const notes = record.notes || record.message || "";
  const date = record.desired_datetime_text || record.created_at;

  return `
    <section class="content invoice">
      <div class="row">
        <div class="col-12 invoice-header">
          <h1>
            <i class="fa fa-heart"></i> Serenity Care Service
            <small class="float-end">${escapeHtml(formatDate(new Date()))}</small>
          </h1>
        </div>
      </div>

      <div class="row invoice-info">
        <div class="col-sm-4 invoice-col">
          From
          <address>
            <strong>Serenity Care Service</strong><br>
            Non-medical home care support<br>
            Email: info@serenitycareservice.org<br>
            Phone: +1 (832) 860-8264
          </address>
        </div>

        <div class="col-sm-4 invoice-col">
          To
          <address>
            <strong>${escapeHtml(name)}</strong><br>
            Phone: ${escapeHtml(phone || "Not provided")}<br>
            Email: ${escapeHtml(email || "Not provided")}
          </address>
        </div>

        <div class="col-sm-4 invoice-col">
          <b>Request Summary</b><br>
          <br>
          <b>Status:</b> ${statusBadge(record.status)}<br>
          <b>Service:</b> ${escapeHtml(service)}<br>
          <b>Date:</b> ${escapeHtml(formatDate(date))}
        </div>
      </div>

      <div class="row">
        <div class="col-12 table">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Service</th>
                <th>Pricing Label</th>
                <th>Price Display</th>
                <th>Billing Unit</th>
              </tr>
            </thead>
            <tbody>
              ${
                pricingRows.length
                  ? pricingRows
                      .map(
                        (row) => `
                          <tr>
                            <td>${escapeHtml(row.service_name || service)}</td>
                            <td>${escapeHtml(row.pricing_label || "")}</td>
                            <td>${escapeHtml(row.pricing_display || "")}</td>
                            <td>${escapeHtml(row.billing_unit || "")}</td>
                          </tr>
                        `
                      )
                      .join("")
                  : `
                    <tr>
                      <td>${escapeHtml(service)}</td>
                      <td>Estimate needed</td>
                      <td>Confirm with Serenity team</td>
                      <td></td>
                    </tr>
                  `
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="row">
        <div class="col-12">
          <p class="lead">Notes</p>
          <p class="text-muted well well-sm shadow-none">
            ${escapeHtml(notes || "No additional notes were provided.")}
          </p>
        </div>
      </div>

      <div class="row no-print">
        <div class="col-12">
          <button class="btn btn-default" onclick="window.print();">
            <i class="fa fa-print"></i> Print
          </button>
          ${
            email
              ? `<a class="btn btn-success float-end" href="mailto:${escapeHtml(email)}">
                  <i class="fa fa-envelope"></i> Email Client
                </a>`
              : ""
          }
        </div>
      </div>
    </section>
  `;
}

async function initInvoice() {
  try {
    const [leadsData, appointmentsData, pricingData] = await Promise.all([
      getLeads(),
      getAppointments(),
      getPricing()
    ]);

    const record = findSelectedRecord(
      leadsData.leads || [],
      appointmentsData.appointments || []
    );

    const pricingRows = findPricingForRecord(record, pricingData.pricing || []);

    const target =
      document.querySelector(".right_col .x_content") ||
      document.querySelector(".right_col");

    if (target) {
      target.innerHTML = renderInvoice(record, pricingRows);
    }
  } catch (error) {
    showAdminError(error.message);
  }
}

document.addEventListener("DOMContentLoaded", initInvoice);