import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const ALLOWED = new Set([
  "catalog_session", "product_view", "product_open", "whatsapp_click",
  "favorite_add", "favorite_remove", "favorites_share",
  "catalog_search", "category_filter", "product_share",
]);

const environment = window.location.hostname === "catalogo.ventasdonatello.com"
  ? "production"
  : "preview";

function clean(value, max = 120) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function recordCatalogEvent(eventName, details = {}) {
  if (!ALLOWED.has(eventName)) return;

  const searchTerm = clean(details.query || details.search_term, 90);
  // Never collect customer contact information accidentally typed into search.
  if (eventName === "catalog_search" &&
      (!searchTerm || /@|https?:\/\/|\d{8,}/i.test(searchTerm))) return;

  const event = {
    environment,
    event_name: eventName,
    product_code: clean(details.product_code, 64),
    product_name: clean(details.product_name, 140),
    category: clean(details.category, 100),
    search_term: eventName === "catalog_search" ? searchTerm : "",
    placement: clean(details.location || details.source || "", 45),
  };

  // Fire-and-forget; reporting must never interrupt catalog interactions.
  supabase.from("catalog_analytics_events").insert(event).then(
    ({ error }) => {
      if (error && import.meta.env.DEV) console.warn("Analytics:", error.message);
    },
    () => {},
  );
}
