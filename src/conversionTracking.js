import { track as vercelTrack } from "@vercel/analytics";
import { recordCatalogEvent } from "./commercialTelemetry.js";

function track(name, data = {}) {
  try { vercelTrack(name, data); } catch { /* Analytics may not be enabled */ }
  recordCatalogEvent(name, data);
}

const SEARCH_DEBOUNCE_MS = 700;
let searchTimer = null;
let lastSearch = "";
let lastModalProduct = "";

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function productDataFromCard(card) {
  return {
    product_name: clean(card?.querySelector(".product-body h3")?.textContent),
    category: clean(card?.querySelector(".product-category")?.textContent),
    price: clean(card?.querySelector(".price-row strong")?.textContent),
    product_code: clean(card?.dataset.productCode),
  };
}

function productDataFromModal(modal) {
  return {
    product_name: clean(modal?.querySelector(".modal-info h2")?.textContent),
    product_code: clean(modal?.querySelector(".modal-ref")?.textContent).replace(/^Referencia:\s*/i, ""),
    category: clean(modal?.querySelector(".modal-category")?.textContent),
    price: clean(modal?.querySelector(".modal-price strong")?.textContent),
  };
}

function trackProductView(modal) {
  const data = productDataFromModal(modal);
  const key = `${data.product_code}|${data.product_name}`;
  if (!data.product_name || key === lastModalProduct) return;

  lastModalProduct = key;
  track("product_view", {
    ...data,
    source: "catalog_modal",
  });
}

function observeProductModal() {
  const observer = new MutationObserver(() => {
    const modal = document.querySelector(".product-modal");
    if (modal) {
      trackProductView(modal);
    } else {
      lastModalProduct = "";
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function attachSearchTracking() {
  document.addEventListener("input", (event) => {
    const input = event.target.closest?.(".search-box input");
    if (!input) return;

    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      const query = clean(input.value).toLowerCase();
      if (query.length < 2 || query === lastSearch) return;

      lastSearch = query;
      track("catalog_search", {
        query,
        results_visible: document.querySelectorAll(".product-card").length,
      });
    }, SEARCH_DEBOUNCE_MS);
  });
}

function attachCategoryTracking() {
  document.addEventListener("click", (event) => {
    const category = event.target.closest?.("button.category");
    if (category) {
      track("category_filter", {
        category: clean(category.textContent),
      });
      return;
    }

    const cardImage = event.target.closest?.(".product-card .image-action");
    if (cardImage) {
      const card = cardImage.closest(".product-card");
      track("product_open", {
        ...productDataFromCard(card),
        source: "catalog_card",
      });
      return;
    }

    const favorite = event.target.closest?.("[data-donatello-favorite]");
    if (favorite) {
      const card = favorite.closest(".product-card");
      const modal = favorite.closest(".product-modal");
      const data = card ? productDataFromCard(card) : productDataFromModal(modal);
      const willAdd = !favorite.classList.contains("is-favorite");

      track(willAdd ? "favorite_add" : "favorite_remove", data);
      return;
    }

    const share = event.target.closest?.(".donatello-fav-share");
    if (share) {
      track("favorites_share", {
        favorites_count: document.querySelectorAll(".donatello-favorite-item").length,
      });
      return;
    }

    const favoritesWhatsApp = event.target.closest?.(".donatello-fav-whatsapp");
    if (favoritesWhatsApp) {
      track("whatsapp_click", {
        location: "favorites",
        favorites_count: document.querySelectorAll(".donatello-favorite-item").length,
      });
    }
  }, true);
}


function attachProductConversionTracking() {
  document.addEventListener("click", (event) => {
    const whatsapp = event.target.closest?.(".whatsapp-btn, .modal-whatsapp");
    if (whatsapp) {
      const card = whatsapp.closest(".product-card");
      const modal = whatsapp.closest(".product-modal");
      const data = card ? productDataFromCard(card) : productDataFromModal(modal);
      recordCatalogEvent("whatsapp_click", {
        ...data,
        location: card ? "product_card" : "product_modal",
      });
      return;
    }

    const share = event.target.closest?.(".donatello-product-share");
    if (share) {
      const data = productDataFromModal(share.closest(".product-modal"));
      recordCatalogEvent("product_share", {
        ...data, location: "product_modal",
      });
    }
  }, true);
}

export function initDonatelloConversionTracking() {
  observeProductModal();
  attachSearchTracking();
  attachCategoryTracking();
  attachProductConversionTracking();

  track("catalog_session", {
    path: window.location.pathname,
    referrer: document.referrer || "direct",
  });
}
