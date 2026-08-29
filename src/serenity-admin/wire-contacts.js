import "./admin-layout.js";

import {
  getAppointments,
  getContacts,
  getLeads
} from "./admin-api.js";

import {
  escapeHtml,
  formatDate,
  showAdminError,
  statusBadge
} from "./admin-utils.js";

function normalizePeople({ leads = [], contacts = [], appointments = [] }) {
  const people = [];

  leads.forEach((row) => {
    people.push({
      type: "Lead",
      name: row.full_name || "Website visitor",
      phone: row.phone || "",
      email: row.email || "",
      service: row.service_interest || "",
      message: row.message || "",
      status: row.status || "",
      date: row.created_at
    });
  });

  contacts.forEach((row) => {
    people.push({
      type: "Contact",
      name: row.full_name || [row.first_name, row.last_name].filter(Boolean).join(" ") || "Website visitor",
      phone: "",
      email: row.email || "",
      service: row.subject || "",
      message: row.message || "",
      status: row.status || "",
      date: row.created_at
    });
  });

  appointments.forEach((row) => {
    people.push({
      type: "Appointment",
      name: row.full_name || "Website visitor",
      phone: row.phone || "",
      email: row.email || "",
      service: row.desired_service || "",
      message: row.notes || row.desired_datetime_text || "",
      status: row.status || "",
      date: row.created_at
    });
  });

  return people.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function renderContactCards(people = []) {
  if (!people.length) {
    return `
      <div class="col-12">
        <div class="alert alert-info">No Serenity people records found yet.</div>
      </div>
    `;
  }

  return people
    .slice(0, 60)
    .map(
      (person) => `
        <div class="col-md-4 col-sm-6 col-12 profile_details">
          <div class="well profile_view">
            <div class="col-sm-12">
              <h4 class="brief"><i>${escapeHtml(person.type)}</i></h4>
              <div class="left col-md-7 col-sm-7">
                <h2>${escapeHtml(person.name)}</h2>
                <p><strong>Service: </strong>${escapeHtml(person.service || "Not specified")}</p>
                <ul class="list-unstyled">
                  <li><i class="fa fa-phone"></i> ${escapeHtml(person.phone || "No phone")}</li>
                  <li><i class="fa fa-envelope"></i> ${escapeHtml(person.email || "No email")}</li>
                  <li><i class="fa fa-clock"></i> ${escapeHtml(formatDate(person.date))}</li>
                </ul>
              </div>
              <div class="right col-md-5 col-sm-5 text-center">
                <img src="images/img.jpg" alt="" class="img-circle img-fluid">
              </div>
            </div>
            <div class="profile-bottom text-center">
              <div class="col-sm-6 emphasis">
                ${statusBadge(person.status)}
              </div>
              <div class="col-sm-6 emphasis">
                ${
                  person.phone
                    ? `<a class="btn btn-success btn-sm" href="tel:${escapeHtml(person.phone)}"><i class="fa fa-phone"></i> Call</a>`
                    : ""
                }
                ${
                  person.email
                    ? `<a class="btn btn-primary btn-sm" href="mailto:${escapeHtml(person.email)}"><i class="fa fa-envelope"></i> Email</a>`
                    : ""
                }
              </div>
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

function replaceContactsGrid(html) {
  const existing =
    document.querySelector(".right_col .row") ||
    document.querySelector(".x_content .row") ||
    document.querySelector(".right_col");

  if (!existing) return;

  existing.innerHTML = html;
}

async function initContactsDirectory() {
  try {
    const [leadsData, contactsData, appointmentsData] = await Promise.all([
      getLeads(),
      getContacts(),
      getAppointments()
    ]);

    const people = normalizePeople({
      leads: leadsData.leads || [],
      contacts: contactsData.contactMessages || [],
      appointments: appointmentsData.appointments || []
    });

    replaceContactsGrid(renderContactCards(people));
  } catch (error) {
    showAdminError(error.message);
  }
}

document.addEventListener("DOMContentLoaded", initContactsDirectory);