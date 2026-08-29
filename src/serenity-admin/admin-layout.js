import { clearAdminSession, getAdminSession } from "./admin-api.js";
import { pageKeyFromPath, routeForPage, operationsRoute } from "./admin-routes.js";

const DASHBOARDS = [
  ["Executive Control Center", "index.html", ["dashboard.read", "reports.read", "users.manage", "clients.manage", "schedules.manage", "clinical.manage", "billing.manage", "payroll.manage", "tasks.complete", "visits.perform", "medications.administer"]],
  ["Scheduling & Workforce", "index2.html", ["dashboard.read", "schedules.read_all", "schedules.manage", "users.manage", "tasks.manage", "tasks.manage_assigned", "tasks.complete", "visits.perform"]],
  ["Clinical Quality & Safety", "index3.html", ["dashboard.read", "clinical.manage", "visits.review", "incidents.manage", "incidents.read", "medications.manage", "medications.manage_assigned", "medications.administer", "reports.read"]],
  ["Finance & Growth", "index4.html", ["dashboard.read", "billing.manage", "payroll.manage", "clients.manage", "settings.manage", "reports.read"]]
];

const MENU_GROUPS = [
  {
    label: "Work Management", icon: "bi-check2-square", items: [
      ["Tasks", "tasks", ["tasks.manage", "tasks.manage_assigned", "tasks.complete"]],
      ["Task History", "task-events", ["tasks.manage", "tasks.manage_assigned", "reports.read"]],
      ["Appointments", "appointments", ["schedules.read_all", "schedules.manage"]],
      ["Visits", "visits", ["schedules.read_all", "schedules.manage", "visits.review", "visits.perform"]],
      ["Calendar", null, ["schedules.read_all", "schedules.manage"], "calendar.html"],
      ["Callbacks", "callbacks", ["schedules.read_all", "schedules.manage", "clients.manage"]],
      ["Shift Requests", "shift-requests", ["schedules.read_all", "schedules.manage"]],
      ["Schedule Changes", "schedule-changes", ["schedules.read_all", "schedules.manage"]],
      ["Availability", "availability", ["schedules.read_all", "schedules.manage", "users.manage"]],
      ["Visit Reminders", "visit-reminders", ["schedules.read_all", "schedules.manage"]]
    ]
  },
  {
    label: "People & Care", icon: "bi-people", items: [
      ["Patients", "clients", ["clients.read_all", "clients.manage"]],
      ["Patient Contacts", "client-contacts", ["clients.read_all", "clients.manage"]],
      ["Patient Relationships", "client-relationships", ["clients.read_all", "clients.manage"]],
      ["Registration Reviews", "registration-reviews", ["clients.manage", "users.manage"]],
      ["Staff & Access", null, ["users.manage"], "staff.html"],
      ["Caregivers", "caregivers", ["users.manage", "schedules.read_all"]],
      ["Departments", "departments", ["users.manage", "settings.manage"]]
    ]
  },
  {
    label: "Clinical Care", icon: "bi-heart-pulse", items: [
      ["Assessments", "assessments", ["clinical.manage", "visits.review"]],
      ["Care Plans", "care-plans", ["clinical.manage", "visits.review"]],
      ["Care Plan Tasks", "plan-tasks", ["clinical.manage", "visits.review"]],
      ["Medications", "medications", ["medications.manage", "medications.manage_assigned", "clinical.manage"]],
      ["Medication Components", "medication-components", ["medications.manage", "medications.manage_assigned", "clinical.manage"]],
      ["Medication Schedules", "medication-schedules", ["medications.manage", "medications.manage_assigned", "medications.administer"]],
      ["Medication Administration", "medication-administrations", ["medications.manage", "medications.manage_assigned", "medications.administer"]],
      ["Medication Dispensing", "medication-dispense", ["medications.manage", "medications.manage_assigned"]],
      ["Medication Events", "medication-events", ["medications.manage", "medications.manage_assigned", "clinical.manage"]],
      ["Visit Tasks", "visit-tasks", ["visits.review", "clinical.manage"]],
      ["Visit Notes", "visit-notes", ["visits.review", "clinical.manage"]],
      ["Vital Signs", "vitals", ["visits.review", "clinical.manage"]],
      ["Wound Records", "wounds", ["visits.review", "clinical.manage"]],
      ["Visit Signatures", "signatures", ["visits.review", "clinical.manage"]]
    ]
  },
  {
    label: "Safety & Compliance", icon: "bi-shield-check", items: [
      ["Incidents", "incidents", ["incidents.manage", "incidents.read", "visits.review"]],
      ["Incident Types", "incident-types", ["incidents.manage", "settings.manage"]],
      ["Incident Actions", "incident-actions", ["incidents.manage", "incidents.read"]],
      ["Incident Assignments", "incident-assignments", ["incidents.manage"]],
      ["Incident History", "incident-history", ["incidents.manage", "incidents.read", "reports.read"]],
      ["Credentials", "credentials", ["users.manage", "reports.read"]],
      ["Documents", "documents", ["documents.manage", "clients.manage"]],
      ["Form Templates", "form-templates", ["documents.manage", "clinical.manage"]],
      ["Form Submissions", "form-submissions", ["documents.manage", "clinical.manage"]],
      ["EVV", "evv", ["visits.review", "schedules.manage", "reports.read"]],
      ["Audit History", "audit", ["reports.read", "users.manage"]]
    ]
  },
  {
    label: "Communication", icon: "bi-chat-left-text", items: [
      ["Secure Messages", "messages", ["messages.oversee", "messages.customer_care"]],
      ["Message Threads", "secure-threads", ["messages.oversee", "messages.customer_care"]],
      ["Thread Members", "thread-members", ["messages.oversee"]],
      ["Message History", "message-history", ["messages.oversee", "reports.read"]],
      ["Mobile Devices", "mobile-devices", ["users.manage", "reports.read"]],
      ["Website Inbox", null, ["dashboard.read", "clients.manage"], "inbox.html"],
      ["Notifications", "notifications", ["dashboard.read", "users.manage"]],
      ["Reminder Preferences", "reminder-preferences", ["users.manage", "settings.manage"]]
    ]
  },
  {
    label: "Finance", icon: "bi-cash-stack", items: [
      ["Payers", "payers", ["billing.manage"]],
      ["Patient Coverage", "client-payers", ["billing.manage", "clients.manage"]],
      ["Authorizations", "authorizations", ["billing.manage", "clinical.manage"]],
      ["Service Agreements", "service-agreements", ["billing.manage", "clients.manage"]],
      ["Invoices", "invoices", ["billing.manage"]],
      ["Invoice Lines", "invoice-lines", ["billing.manage"]],
      ["Invoice Change Requests", "invoice-change-requests", ["billing.manage"]],
      ["Payment Methods", "payment-methods", ["billing.manage", "settings.manage"]],
      ["Payments", "payments", ["billing.manage"]],
      ["Payroll", "payroll", ["payroll.manage"]],
      ["Expenses", "expenses", ["billing.manage", "payroll.manage"]]
    ]
  },
  {
    label: "Website & Growth", icon: "bi-globe2", items: [
      ["Leads", "website-leads", ["dashboard.read", "clients.manage", "schedules.manage"]],
      ["Lead History", "lead-history", ["clients.manage", "reports.read"]],
      ["Website Messages", "website-contacts", ["dashboard.read", "clients.manage"]],
      ["Web Conversations", "web-conversations", ["dashboard.read", "clients.manage"]],
      ["Conversation Messages", "web-messages", ["dashboard.read", "clients.manage"]],
      ["Conversation Summaries", "web-summaries", ["dashboard.read", "clients.manage"]],
      ["Conversation Risk Events", "risk-events", ["reports.read", "clients.manage"]],
      ["Escalation Rules", "escalation-rules", ["settings.manage", "clients.manage"]],
      ["Web Automation Rules", "web-rules", ["settings.manage"]],
      ["Web Conversation Templates", "web-prompts", ["settings.manage"]],
      ["Web Actions", "web-actions", ["settings.manage"]],
      ["Services", "services", ["dashboard.read", "settings.manage"]],
      ["Service Details", "service-details", ["settings.manage"]],
      ["Service Media", "service-media", ["settings.manage"]],
      ["Pricing", "pricing", ["dashboard.read", "settings.manage", "billing.manage"]],
      ["Business Profile", "business-profile", ["settings.manage"]],
      ["Locations", "locations", ["settings.manage"]],
      ["Service Areas", "service-areas", ["settings.manage"]],
      ["Site Pages", "site-pages", ["settings.manage"]],
      ["Page Heroes", "page-heroes", ["settings.manage"]],
      ["Page Counters", "page-counters", ["settings.manage"]],
      ["Feature Cards", "page-feature-cards", ["settings.manage"]],
      ["Service Cards", "page-service-cards", ["settings.manage"]],
      ["Page Content", "page-content", ["settings.manage"]],
      ["Page List Items", "page-list-items", ["settings.manage"]],
      ["Contact Channels", "contact-channels", ["settings.manage"]],
      ["Blog Posts", "blog-posts", ["dashboard.read", "settings.manage"]],
      ["Blog Gallery", "blog-gallery", ["settings.manage"]],
      ["Blog Comments", "blog-comments", ["settings.manage"]],
      ["Blog Sections", "blog-sections", ["settings.manage"]],
      ["Blog Highlights", "blog-highlights", ["settings.manage"]],
      ["Blog Takeaways", "blog-takeaways", ["settings.manage"]],
      ["Related Blog Posts", "blog-related", ["settings.manage"]],
      ["Blog Media", "blog-media", ["settings.manage"]],
      ["FAQs", "faqs", ["dashboard.read", "settings.manage"]],
      ["Navigation Groups", "navigation-groups", ["settings.manage"]],
      ["Navigation Items", "navigation-items", ["settings.manage"]],
      ["Site Settings", "site-settings", ["settings.manage"]]
    ]
  },
  {
    label: "System", icon: "bi-gear", items: [
      ["Roles & Access", "roles", ["users.manage", "settings.manage"]],
      ["Role Permission Matrix", "access-matrix", ["users.manage", "settings.manage"]],
      ["Staff Role Assignments", "staff-role-assignments", ["users.manage"]],
      ["Permissions", "permissions", ["users.manage", "settings.manage"]],
      ["Organization", "organizations", ["users.manage", "settings.manage"]],
      ["Organization Settings", "organization-settings", ["settings.manage"]],
      ["Branches", "branches", ["users.manage", "settings.manage"]],
      ["Admin Modules", "module-config", ["settings.manage"]],
      ["Operational Insights", "insights", ["reports.read", "clinical.manage"]]
    ]
  }
];

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function roleCodes(user) {
  return new Set((user?.roles || []).map((role) => String(role.code || "").toLowerCase()));
}

function isOwner(user) {
  const roles = roleCodes(user);
  return roles.has("owner") || roles.has("system_admin");
}

function hasAny(user, permissions = []) {
  if (isOwner(user)) return true;
  const granted = new Set(user?.permissions || []);
  return permissions.some((permission) => granted.has(permission));
}

function currentFile() {
  return pageKeyFromPath() || "index.html";
}

function currentResource() {
  return new URLSearchParams(window.location.search).get("resource") || "";
}

function directLink(label, href, permissions, user) {
  if (!hasAny(user, permissions)) return "";
  const active = currentFile() === href;
  return `<li class="${active ? "current-page" : ""}"><a href="${routeForPage(href)}">${escapeHtml(label)}</a></li>`;
}

function resourceLink(label, resource, permissions, user) {
  if (!hasAny(user, permissions)) return "";
  const active = currentFile() === "operations.html" && currentResource() === resource;
  return `<li class="${active ? "current-page" : ""}"><a href="${operationsRoute(resource)}">${escapeHtml(label)}</a></li>`;
}

function renderMenuGroup(group, user) {
  const items = group.items.map(([label, resource, permissions, directHref]) => directHref
    ? directLink(label, directHref, permissions, user)
    : resourceLink(label, resource, permissions, user)).filter(Boolean).join("");
  if (!items) return "";
  const open = items.includes("current-page");
  return `<li class="serenity-menu-group ${open ? "active" : ""}">
    <button class="serenity-menu-toggle" type="button" aria-expanded="${open ? "true" : "false"}"><i class="bi ${group.icon}"></i><span>${escapeHtml(group.label)}</span><i class="bi bi-chevron-down ms-auto"></i></button>
    <ul class="nav child_menu" ${open ? "" : "hidden"}>${items}</ul>
  </li>`;
}

function renderDashboardMenu(user) {
  const items = DASHBOARDS.map(([label, href, permissions]) => directLink(label, href, permissions, user)).filter(Boolean).join("");
  if (!items) return "";
  const open = items.includes("current-page");
  return `<li class="serenity-menu-group ${open ? "active" : ""}">
    <button class="serenity-menu-toggle" type="button" aria-expanded="${open ? "true" : "false"}"><i class="bi bi-speedometer2"></i><span>Dashboards</span><i class="bi bi-chevron-down ms-auto"></i></button>
    <ul class="nav child_menu" ${open ? "" : "hidden"}>${items}</ul>
  </li>`;
}

function shell(user) {
  const displayName = user.displayName || "Serenity Staff";
  const roleName = (user.roles || []).map((role) => role.name).filter(Boolean).join(" · ") || user.jobTitle || "Staff";
  const employee = user.employeeNumber ? ` · ${user.employeeNumber}` : "";
  const menu = `${renderDashboardMenu(user)}${MENU_GROUPS.map((group) => renderMenuGroup(group, user)).join("")}`;
  const reports = hasAny(user, ["reports.read", "dashboard.read"])
    ? `<li class="${currentFile() === "chartjs.html" ? "current-page" : ""}"><a href="${routeForPage("chartjs.html")}"><i class="bi bi-bar-chart-line"></i><span>Reports</span></a></li>` : "";

  return `<div class="container body"><div class="main_container">
    <aside class="col-md-3 left_col serenity-sidebar" aria-label="Serenity Admin navigation">
      <div class="left_col scroll-view">
        <div class="navbar nav_title"><a href="${routeForPage("index.html")}" class="site_title"><i class="bi bi-heart-pulse-fill"></i><span>Serenity Admin</span></a></div>
        <div class="clearfix"></div>
        <div class="profile clearfix">
          <div class="profile_pic"><div class="serenity-avatar"><i class="bi bi-person-fill"></i></div></div>
          <div class="profile_info"><span>Signed in as</span><h4>${escapeHtml(displayName)}</h4><small>${escapeHtml(roleName)}${escapeHtml(employee)}</small></div>
        </div>
        <nav id="sidebar-menu" class="main_menu_side hidden-print main_menu"><div class="menu_section"><h3>Serenity Care Service</h3><ul class="nav side-menu">${menu}${reports}</ul></div></nav>
        <div class="sidebar-footer hidden-small"><a href="${routeForPage("index.html")}" title="Control Center"><i class="bi bi-house"></i></a><a href="${routeForPage("chartjs.html")}" title="Reports"><i class="bi bi-bar-chart"></i></a><a href="${routeForPage("staff.html")}" title="Staff & Access"><i class="bi bi-people"></i></a><button type="button" class="serenity-logout" title="Log out"><i class="bi bi-power"></i></button></div>
      </div>
    </aside>
    <div class="top_nav"><div class="nav_menu d-flex align-items-center"><button id="menu_toggle" type="button" class="serenity-top-toggle" aria-label="Toggle navigation"><i class="bi bi-list"></i></button><nav class="navbar-nav ms-auto"><div class="nav-item dropdown"><button class="user-profile dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false"><span class="serenity-user-dot"></span>${escapeHtml(displayName)}</button><ul class="dropdown-menu dropdown-menu-end"><li><span class="dropdown-item-text"><strong>${escapeHtml(roleName)}</strong><br><small>${escapeHtml(user.email || "")}</small></span></li><li><hr class="dropdown-divider"></li>${hasAny(user,["users.manage"]) ? `<li><a class="dropdown-item" href="${routeForPage("staff.html")}"><i class="bi bi-people me-2"></i>Staff & Access</a></li>` : ""}<li><button class="dropdown-item serenity-logout" type="button"><i class="bi bi-box-arrow-right me-2"></i>Log out</button></li></ul></div></nav></div></div>
    <main class="right_col" role="main" id="serenity-page-root"><div class="serenity-page-loading"><div class="spinner-border spinner-border-sm" role="status"></div><span>Loading Serenity data…</span></div></main>
    <footer><div>Serenity Care Service</div><div class="clearfix"></div></footer>
  </div></div>`;
}

function bindLayoutEvents() {
  document.querySelectorAll(".serenity-menu-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".serenity-menu-group");
      const menu = item?.querySelector(".child_menu");
      if (!item || !menu) return;
      const open = menu.hasAttribute("hidden");
      if (open) menu.removeAttribute("hidden"); else menu.setAttribute("hidden", "");
      item.classList.toggle("active", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  document.getElementById("menu_toggle")?.addEventListener("click", () => {
    document.body.classList.toggle("nav-sm");
    document.body.classList.toggle("nav-md", !document.body.classList.contains("nav-sm"));
  });

  document.querySelectorAll(".serenity-logout").forEach((button) => button.addEventListener("click", () => {
    clearAdminSession();
    window.location.replace(routeForPage("login.html"));
  }));
}

function redirectLogin() {
  if (pageKeyFromPath() !== "login.html") window.location.replace(routeForPage("login.html"));
}

export async function initAdminLayout() {
  const root = document.getElementById("serenity-app");
  if (!root) return null;
  try {
    const result = await getAdminSession();
    const user = result.user;
    if (!user) { redirectLogin(); return null; }
    window.SERENITY_ADMIN_USER = user;
    root.innerHTML = shell(user);
    document.title = `${document.body.dataset.pageTitle || "Serenity Admin"} | Serenity Admin`;
    bindLayoutEvents();
    return user;
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) { redirectLogin(); return null; }
    root.innerHTML = `<div class="serenity-boot-failure"><strong>Serenity Admin could not verify your session.</strong><span>${escapeHtml(error?.message || "Please try again.")}</span><a href="${routeForPage("login.html")}" class="btn btn-success">Return to sign in</a></div>`;
    return null;
  }
}
