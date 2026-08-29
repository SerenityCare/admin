import { isLoginPath, routeForPage } from "./admin-routes.js";

const API_BASE =
  window.SERENITY_ADMIN_API_BASE ||
  import.meta.env.VITE_SERENITY_ADMIN_API_BASE ||
  "https://serenity-backend-mseu.onrender.com/api/admin";

const TOKEN_KEY = "serenity_admin_token";
const USER_KEY = "serenity_admin_user";

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function saveAdminSession(data = {}) {
  const token = data.token || data.accessToken || "";
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function clearAdminSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function cachedAdminUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getAdminToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token && options.auth !== false) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && options.auth !== false) {
    clearAdminSession();
    if (!isLoginPath()) {
      window.location.href = routeForPage("login.html");
    }
  }

  if (!response.ok || data.success === false) {
    const error = new Error(data.error || `Admin API request failed: ${path}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export function loginAdmin(credentials = {}) {
  return request("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify(credentials)
  });
}

export function getAdminSession() {
  return request("/session");
}

export function getControlCenter() {
  return request("/control-center");
}

export function getOperationsCatalog() {
  return request("/operations/catalog");
}

export function getOperationRows(resource, limit = 200) {
  return request(`/operations/${encodeURIComponent(resource)}?limit=${encodeURIComponent(limit)}`);
}

export function createOperationRow(resource, payload) {
  return request(`/operations/${encodeURIComponent(resource)}`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateOperationRow(resource, key, payload) {
  return request(`/operations/${encodeURIComponent(resource)}/${encodeURIComponent(key)}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function runOperationAction(resource, key, action, payload = {}) {
  return request(`/operations/${encodeURIComponent(resource)}/${encodeURIComponent(key)}/actions/${encodeURIComponent(action)}`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}


export function getAccounts(query = "") {
  return request(`/accounts${query ? `?${query}` : ""}`);
}

export function getAccountOptions() {
  return request("/accounts/options");
}

export function getAccount(key) {
  return request(`/accounts/${encodeURIComponent(key)}`);
}

export function createAccount(payload) {
  return request("/accounts", { method: "POST", body: JSON.stringify(payload) });
}

export function updateAccount(key, payload) {
  return request(`/accounts/${encodeURIComponent(key)}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function getDashboard() {
  return request("/dashboard");
}

export function getLeads() {
  return request("/leads?limit=100");
}

export function getCallbacks() {
  return request("/callbacks?limit=100");
}

export function getAppointments() {
  return request("/appointments?limit=100");
}

export function getContacts() {
  return request("/contacts?limit=100");
}

export function getConversations() {
  return request("/conversations?limit=100");
}

export function getConversationMessages(sessionId) {
  return request(`/conversations/${encodeURIComponent(sessionId)}/messages`);
}

export function getServices() {
  return request("/services?limit=100");
}

export function getPricing() {
  return request("/pricing?limit=100");
}

export function getBlogPosts() {
  return request("/blog-posts?limit=100");
}

export function getFaqs() {
  return request("/faqs?limit=100");
}

export function updateLeadStatus(id, status) {
  return request(`/leads/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function updateCallbackStatus(id, status) {
  return request(`/callbacks/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function updateAppointmentStatus(id, status) {
  return request(`/appointments/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function updateContactStatus(id, status) {
  return request(`/contacts/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function updateConversationStatus(id, status) {
  return request(`/conversations/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export const SerenityAdminApi = {
  loginAdmin,
  getAdminSession,
  getControlCenter,
  getOperationsCatalog,
  getOperationRows,
  createOperationRow,
  updateOperationRow,
  runOperationAction,
  getAccounts,
  getAccountOptions,
  getAccount,
  createAccount,
  updateAccount,
  getDashboard,
  getLeads,
  getCallbacks,
  getAppointments,
  getContacts,
  getConversations,
  getConversationMessages,
  getServices,
  getPricing,
  getBlogPosts,
  getFaqs,
  updateLeadStatus,
  updateCallbackStatus,
  updateAppointmentStatus,
  updateContactStatus,
  updateConversationStatus,
  getAdminToken,
  saveAdminSession,
  clearAdminSession,
  cachedAdminUser
};
