const API_BASE =
  window.SERENITY_ADMIN_API_BASE ||
  import.meta.env.VITE_SERENITY_ADMIN_API_BASE ||
  "http://localhost:3000/api/admin";

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json"
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Admin API request failed: ${path}`);
  }

  return data;
}

export async function getInboxDashboardData() {
  return request("/dashboard");
}

export async function getInboxFallbackData() {
  const response = await fetch("/src/js/jsons/inbox/inbox.json");
  return response.json();
}
