import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { getOperationRows } from "./admin-api.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function eventDate(row) {
  return row.values?.["Confirmed Start"] || row.values?.["Requested Start"] || null;
}

async function initCalendar() {
  const target = document.querySelector(".right_col");
  if (!target) return;
  try {
    const data = await getOperationRows("appointments", 500);
    const rows = data.rows || [];
    target.innerHTML = `
      <div class="serenity-page">
        <div class="serenity-page-header">
          <div><h2>Calendar</h2><p>Appointments from the shared Serenity schedule.</p></div>
          <div class="serenity-actions"><a href="/operations?resource=appointments" class="btn btn-success"><i class="bi bi-plus-lg me-1"></i> New Appointment</a><a href="/operations?resource=visits" class="btn btn-outline-primary">Visits</a></div>
        </div>
        <div class="serenity-card serenity-panel"><div id="serenity-calendar"></div></div>
      </div>`;

    const calendarElement = document.getElementById("serenity-calendar");
    const events = rows.map((row) => {
      const start = eventDate(row);
      if (!start || start === "—") return null;
      return {
        title: `${row.values?.Patient || row.values?.["Patient / Requestor"] || "Appointment"} — ${row.values?.Service || row.values?.["Requested Service"] || "Care"}`,
        start,
        extendedProps: { status: row.values?.Status || "" }
      };
    }).filter(Boolean);

    const calendar = new Calendar(calendarElement, {
      plugins: [dayGridPlugin, timeGridPlugin],
      initialView: "dayGridMonth",
      height: "auto",
      headerToolbar: { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" },
      events,
      eventClick() { window.location.href = "/operations?resource=appointments"; }
    });
    calendar.render();
  } catch (error) {
    target.innerHTML = `<div class="serenity-page"><div class="alert alert-danger serenity-error"><strong>Calendar could not load.</strong><br>${escapeHtml(error.message)}</div></div>`;
  }
}

export async function initPage() {
  await initCalendar();
}
