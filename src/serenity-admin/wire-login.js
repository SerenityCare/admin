import { clearAdminSession, getAdminToken, loginAdmin, saveAdminSession } from "./admin-api.js";
import { routeForPage } from "./admin-routes.js";

function showLoginMessage(message, type = "danger") {
  const box = document.getElementById("serenity-login-message");
  if (!box) return;
  box.hidden = false;
  box.className = `alert alert-${type}`;
  box.textContent = message;
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const email = form.querySelector("#username")?.value.trim() || "";
  const password = form.querySelector("#password")?.value || "";
  const button = form.querySelector("button[type='submit']");
  if (button) button.disabled = true;
  try {
    clearAdminSession();
    const data = await loginAdmin({ email, password });
    saveAdminSession(data);
    window.location.replace(routeForPage("index.html"));
  } catch (error) {
    showLoginMessage(error.message || "Sign in failed.");
  } finally {
    if (button) button.disabled = false;
  }
}

export async function initLogin() {
  if (getAdminToken()) clearAdminSession();
  document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
}
