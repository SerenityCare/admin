import "./admin-layout.js";

import {
  getBlogPosts,
  getFaqs,
  getPricing,
  getServices
} from "./admin-api.js";

import {
  dispatchSerenityEvent,
  escapeHtml,
  formatDate,
  replacePanelTableByIndex,
  showAdminError,
  updatePanelTitleByIndex,
  updateTileByIndex
} from "./admin-utils.js";

function countActive(rows = []) {
  return rows.filter((row) => row.is_active === true).length;
}

function countFeatured(rows = []) {
  return rows.filter((row) => row.is_featured === true).length;
}

function renderServiceRows(rows = []) {
  if (!rows.length) {
    return `<tr><td colspan="6" class="text-center text-muted">No services found.</td></tr>`;
  }

  return rows
    .slice(0, 12)
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.name || "")}</td>
          <td>${escapeHtml(row.slug || "")}</td>
          <td>${escapeHtml(row.short_description || "")}</td>
          <td>${row.is_featured ? "Yes" : "No"}</td>
          <td>${row.is_active ? "Active" : "Inactive"}</td>
          <td>${escapeHtml(row.sort_order || 0)}</td>
        </tr>
      `
    )
    .join("");
}

function renderPricingRows(rows = []) {
  if (!rows.length) {
    return `<tr><td colspan="6" class="text-center text-muted">No pricing rows found.</td></tr>`;
  }

  return rows
    .slice(0, 12)
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.service_name || "")}</td>
          <td>${escapeHtml(row.pricing_label || "")}</td>
          <td>${escapeHtml(row.pricing_display || "")}</td>
          <td>${escapeHtml(row.billing_unit || "")}</td>
          <td>${row.is_active ? "Active" : "Inactive"}</td>
          <td>${escapeHtml(row.sort_order || 0)}</td>
        </tr>
      `
    )
    .join("");
}

function renderBlogRows(rows = []) {
  if (!rows.length) {
    return `<tr><td colspan="6" class="text-center text-muted">No blog posts found.</td></tr>`;
  }

  return rows
    .slice(0, 12)
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.title || "")}</td>
          <td>${escapeHtml(row.author_name || "")}</td>
          <td>${escapeHtml(row.post_date_label || "")}</td>
          <td>${row.is_featured ? "Yes" : "No"}</td>
          <td>${row.is_active ? "Active" : "Inactive"}</td>
          <td>${escapeHtml(formatDate(row.updated_at || row.created_at))}</td>
        </tr>
      `
    )
    .join("");
}

function renderFaqRows(rows = []) {
  if (!rows.length) {
    return `<tr><td colspan="5" class="text-center text-muted">No FAQs found.</td></tr>`;
  }

  return rows
    .slice(0, 12)
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.question || "")}</td>
          <td>${escapeHtml(row.topic || "")}</td>
          <td>${escapeHtml(row.priority || 0)}</td>
          <td>${row.is_active ? "Active" : "Inactive"}</td>
          <td>${escapeHtml(formatDate(row.updated_at || row.created_at))}</td>
        </tr>
      `
    )
    .join("");
}

async function initContentHealthDashboard() {
  try {
    const [servicesData, pricingData, blogData, faqsData] = await Promise.all([
      getServices(),
      getPricing(),
      getBlogPosts(),
      getFaqs()
    ]);

    const services = servicesData.services || [];
    const pricing = pricingData.pricing || [];
    const blogPosts = blogData.blogPosts || [];
    const faqs = faqsData.faqs || [];

    updateTileByIndex(0, countActive(services), `<i class="fa fa-heart"></i> Active Services`);
    updateTileByIndex(1, countFeatured(services), `<i class="fa fa-star"></i> Featured Services`);
    updateTileByIndex(2, countActive(pricing), `<i class="fa fa-dollar"></i> Pricing Rows`);
    updateTileByIndex(3, countActive(blogPosts), `<i class="fa fa-newspaper"></i> Blog Posts`);
    updateTileByIndex(4, countFeatured(blogPosts), `<i class="fa fa-bullhorn"></i> Featured Posts`);
    updateTileByIndex(5, countActive(faqs), `<i class="fa fa-question"></i> Active FAQs`);

    updatePanelTitleByIndex(0, "Services");
    replacePanelTableByIndex(0, renderServiceRows(services));

    updatePanelTitleByIndex(1, "Pricing");
    replacePanelTableByIndex(1, renderPricingRows(pricing));

    updatePanelTitleByIndex(2, "Blog Posts");
    replacePanelTableByIndex(2, renderBlogRows(blogPosts));

    updatePanelTitleByIndex(3, "FAQs");
    replacePanelTableByIndex(3, renderFaqRows(faqs));

    dispatchSerenityEvent("serenity-admin-content-loaded", {
      services,
      pricing,
      blogPosts,
      faqs
    });
  } catch (error) {
    showAdminError(error.message);
  }
}

document.addEventListener("DOMContentLoaded", initContentHealthDashboard);