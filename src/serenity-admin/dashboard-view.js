import Chart from "chart.js/auto";
import { getOperationRows } from "./admin-api.js";

export function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function labelize(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function numberValue(value) {
  const parsed = Number(String(value ?? "0").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function money(value) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(numberValue(value));
}

export function value(row, label) {
  return row?.values?.[label] ?? "—";
}

export function isYes(valueToCheck) {
  return [true, "yes", "true", "active"].includes(typeof valueToCheck === "string" ? valueToCheck.toLowerCase() : valueToCheck);
}

export function countWhere(rows, label, accepted) {
  const wanted = new Set((Array.isArray(accepted) ? accepted : [accepted]).map((item) => String(item).toLowerCase()));
  return rows.filter((row) => wanted.has(String(value(row, label)).toLowerCase())).length;
}

export function groupBy(rows, label) {
  return rows.reduce((out, row) => {
    const key = String(value(row, label) || "Unknown");
    const display = key === "—" ? "Not set" : labelize(key);
    out[display] = (out[display] || 0) + 1;
    return out;
  }, {});
}

export async function loadResourceSafe(resource, limit = 500) {
  try {
    const result = await getOperationRows(resource, limit);
    return result.rows || [];
  } catch (error) {
    if ([401, 403, 404].includes(error?.status)) return [];
    throw error;
  }
}

export async function loadMany(resourceKeys) {
  const entries = await Promise.all(resourceKeys.map(async (key) => [key, await loadResourceSafe(key)]));
  return Object.fromEntries(entries);
}

export function metric(label, valueText, note, icon, href = "") {
  const card = `<div class="serenity-card serenity-kpi"><div class="icon"><i class="bi ${icon}"></i></div><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(valueText)}</div><div class="note">${escapeHtml(note)}</div></div>`;
  return href ? `<a class="text-decoration-none" href="${href}">${card}</a>` : card;
}

export function emptyRow(columns, text) {
  return `<tr><td class="serenity-empty" colspan="${columns}">${escapeHtml(text)}</td></tr>`;
}

export function status(valueToShow) {
  const text = String(valueToShow || "").toLowerCase();
  let cls = "is-info";
  if (["critical", "urgent", "overdue", "missed", "declined", "rejected", "expired", "suspended"].some((item) => text.includes(item))) cls = "is-danger";
  else if (["pending", "open", "warning", "high", "review", "awaiting", "submitted"].some((item) => text.includes(item))) cls = "is-warning";
  else if (["active", "complete", "completed", "confirmed", "paid", "verified", "resolved", "approved"].some((item) => text.includes(item))) cls = "is-success";
  return `<span class="serenity-status ${cls}">${escapeHtml(labelize(valueToShow || "Not set"))}</span>`;
}

const chartPalette = ["#1ABB9C", "#3498DB", "#9B59B6", "#F39C12", "#E74C3C", "#607D8B", "#2ECC71", "#34495E", "#16A085", "#D35400"];

export function drawBreakdown(id, type, object, datasetLabel = "Records") {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  const labels = Object.keys(object || {});
  if (!labels.length) return null;
  return new Chart(canvas, {
    type,
    data: { labels, datasets: [{ label: datasetLabel, data: Object.values(object), backgroundColor: chartPalette.slice(0, labels.length), borderColor: "#fff", borderWidth: type === "bar" ? 0 : 2, borderRadius: type === "bar" ? 7 : 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: type !== "bar", position: "bottom", labels: { usePointStyle: true } } }, scales: type === "bar" ? { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } : undefined }
  });
}

export function sectionTable(headers, body) {
  return `<div class="serenity-table-wrap"><table class="serenity-table"><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>`;
}
