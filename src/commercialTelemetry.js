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

const SAFE_SEARCH_CATEGORIES = new Set([
  "sillas", "sillones", "sofas", "mesas", "lamparas", "espejos",
  "buros", "comedores", "escritorios", "camas", "decoracion", "otros",
]);

const environment = window.location.hostname === "catalogo.ventasdonatello.com"
  ? "production"
  : "preview";

function clean(value, max = 120) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function recordCatalogEvent(eventName, details = {}) {
  if (!ALLOWED.has(eventName)) return;

  // Recibimos solo etiquetas cerradas; ignoramos consultas libres aun si alguien las pasa.
  const searchCategory = clean(details.search_category, 32);
  const safeSearchCategory = SAFE_SEARCH_CATEGORIES.has(searchCategory)
    ? searchCategory : "otros";

  const event = {
    environment,
    event_name: eventName,
    product_code: clean(details.product_code, 64),
    product_name: clean(details.product_name, 140),
    category: eventName === "catalog_search" ? safeSearchCategory : clean(details.category, 100),
    search_term: "",
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
