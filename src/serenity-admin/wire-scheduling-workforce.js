import { drawBreakdown, emptyRow, escapeHtml, groupBy, loadMany, metric, sectionTable, status, value } from "./dashboard-view.js";

function scheduleRows(visits) {
  if (!visits.length) return emptyRow(6, "No visit records are available for your access level.");
  return visits.slice(0, 14).map((row) => `<tr><td>${escapeHtml(value(row,"Starts"))}</td><td>${escapeHtml(value(row,"Patient"))}</td><td>${escapeHtml(value(row,"Service"))}</td><td>${escapeHtml(value(row,"Caregiver"))}</td><td>${status(value(row,"Status"))}</td><td><a class="btn btn-sm btn-outline-primary" href="/operations?resource=visits">Open</a></td></tr>`).join("");
}

function taskRows(tasks) {
  if (!tasks.length) return emptyRow(6, "No task records are available for your access level.");
  return tasks.slice(0, 14).map((row) => `<tr><td><strong>${escapeHtml(value(row,"Task"))}</strong></td><td>${escapeHtml(value(row,"Patient"))}</td><td>${escapeHtml(value(row,"Assigned To"))}</td><td>${status(value(row,"Priority"))}</td><td>${escapeHtml(value(row,"Due"))}</td><td>${status(value(row,"Status"))}</td></tr>`).join("");
}

async function render() {
  const data = await loadMany(["tasks","appointments","visits","callbacks","caregivers","shift-requests","schedule-changes","availability"]);
  const tasks=data.tasks, appointments=data.appointments, visits=data.visits, callbacks=data.callbacks, caregivers=data.caregivers, shifts=data["shift-requests"], changes=data["schedule-changes"];
  const openTasks = tasks.filter((row) => !["completed","declined","cancelled"].includes(String(value(row,"Status")).toLowerCase()));
  const unassignedVisits = visits.filter((row) => String(value(row,"Caregiver")).toLowerCase().includes("not assigned"));
  const openAppointments = appointments.filter((row) => !["completed","cancelled","declined","converted to visit","converted_to_visit"].includes(String(value(row,"Status")).toLowerCase()));
  const openCallbacks = callbacks.filter((row) => !["completed","closed","cancelled","resolved"].includes(String(value(row,"Status")).toLowerCase()));
  const target=document.getElementById("serenity-page-root");
  target.innerHTML=`<div class="serenity-page"><div class="serenity-page-header"><div><h2>Scheduling & Workforce</h2><p>Assignments, appointments, visits, tasks and staffing workload from the shared Serenity schedule.</p></div><div class="serenity-actions"><a class="btn btn-success" href="/operations?resource=tasks"><i class="bi bi-plus-lg me-1"></i>Manage Tasks</a><a class="btn btn-outline-primary" href="/calendar">Calendar</a></div></div>
  <div class="serenity-kpis">${metric("Open Tasks",openTasks.length,"Assigned work still in progress","bi-check2-square","/operations?resource=tasks")}${metric("Open Appointments",openAppointments.length,"Scheduling and confirmation queue","bi-calendar-plus","/operations?resource=appointments")}${metric("Unassigned Visits",unassignedVisits.length,"Visits without a caregiver","bi-person-exclamation","/operations?resource=visits")}${metric("Open Callbacks",openCallbacks.length,"Patient and prospect follow-up","bi-telephone","/operations?resource=callbacks")}${metric("Caregivers",caregivers.length,"Caregiver records visible to you","bi-person-heart","/operations?resource=caregivers")}${metric("Shift Requests",shifts.length,"Open-shift request records","bi-arrow-left-right","/operations?resource=shift-requests")}${metric("Schedule Changes",changes.length,"Schedule-change requests","bi-calendar2-week","/operations?resource=schedule-changes")}${metric("Visits",visits.length,"Visit records in current access scope","bi-calendar2-check","/operations?resource=visits")}</div>
  <div class="serenity-grid-3"><div class="serenity-card serenity-panel"><h4>Visit Status</h4><div class="serenity-chart-wrap"><canvas id="sw-visits"></canvas></div></div><div class="serenity-card serenity-panel"><h4>Task Status</h4><div class="serenity-chart-wrap"><canvas id="sw-tasks"></canvas></div></div><div class="serenity-card serenity-panel"><h4>Appointment Flow</h4><div class="serenity-chart-wrap"><canvas id="sw-appts"></canvas></div></div></div>
  <div class="serenity-grid-2"><div class="serenity-card serenity-panel"><h4>Visit Schedule</h4>${sectionTable(["Starts","Patient","Service","Caregiver","Status",""],scheduleRows(visits))}</div><div class="serenity-card serenity-panel"><h4>Task Work Queue</h4>${sectionTable(["Task","Patient","Assigned To","Priority","Due","Status"],taskRows(openTasks))}</div></div></div>`;
  drawBreakdown("sw-visits","bar",groupBy(visits,"Status"),"Visits"); drawBreakdown("sw-tasks","doughnut",groupBy(tasks,"Status"),"Tasks"); drawBreakdown("sw-appts","doughnut",groupBy(appointments,"Status"),"Appointments");
}

export async function initPage(){try{await render();}catch(error){document.getElementById("serenity-page-root").innerHTML=`<div class="alert alert-danger serenity-error">${escapeHtml(error.message)}</div>`;}}
