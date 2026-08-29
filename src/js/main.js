const PAGE_INITIALIZERS = {
  "page-index": () => import("./js_files/index/index.js"),
  "page-inbox": () => import("./js_files/inbox/inbox.js")
};

const DUMMY_USER_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="80" fill="#2A3F54"/>
      <circle cx="80" cy="58" r="30" fill="#ffffff"/>
      <path d="M32 138c8-34 32-50 48-50s40 16 48 50" fill="#ffffff"/>
      <text x="80" y="150" text-anchor="middle" font-family="Arial" font-size="14" fill="#26B99A">AW</text>
    </svg>
  `);

function getPageKey() {
  return Array.from(document.body.classList).find((className) =>
    Object.prototype.hasOwnProperty.call(PAGE_INITIALIZERS, className)
  );
}

function initSharedLayout() {
  document.title = document.title.replace("Gentelella", "Serenity Care Service");

  document.querySelectorAll(".site_title").forEach((siteTitle) => {
    siteTitle.innerHTML = `
      <span style="font-size: 20px; font-weight: 600; line-height: 1.2;">
        Serenity Care Service
      </span>
    `;
  });

  document.querySelectorAll(".profile_info h4").forEach((el) => {
    el.textContent = "Aaron Wambugu";
  });

  document.querySelectorAll(".user-profile").forEach((el) => {
    el.innerHTML = `
      <img src="${DUMMY_USER_IMAGE}" alt="Aaron Wambugu"> Aaron Wambugu
    `;
  });

  document.querySelectorAll(".profile_pic img, .user-profile img, .msg_list img").forEach((img) => {
    img.src = DUMMY_USER_IMAGE;
    img.alt = "Aaron Wambugu";
  });

  document.querySelectorAll(".nav.side-menu > li").forEach((li) => {
    const text = li.textContent.trim().toLowerCase();

    if (text.includes("go pro")) {
      li.remove();
    }
  });
}

async function initPage() {
  initSharedLayout();

  const pageKey = getPageKey();

  if (!pageKey) return;

  try {
    const pageModule = await PAGE_INITIALIZERS[pageKey]();

    if (typeof pageModule.init === "function") {
      await pageModule.init();
    }
  } catch (error) {
    console.error("[serenity-admin-main] Page initialization failed:", error);
  }
}

document.addEventListener("DOMContentLoaded", initPage);