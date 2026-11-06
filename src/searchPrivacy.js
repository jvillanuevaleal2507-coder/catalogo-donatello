// Etiquetas cerradas: nunca reenviar texto libre ni identificadores del visitante a analytics.
const SEARCH_CATEGORIES = [
  ["sillas", /\bsillas?\b/],
  ["sillones", /\bsillones?\b/],
  ["sofas", /\bsofas?\b/],
  ["mesas", /\bmesas?\b/],
  ["lamparas", /\blamparas?\b/],
  ["espejos", /\bespejos?\b/],
  ["buros", /\bburos?\b/],
  ["comedores", /\bcomedores?\b/],
  ["escritorios", /\bescritorios?\b/],
  ["camas", /\bcamas?\b/],
  ["decoracion", /\bdecoracion\b/],
];

export function categorizeSearch(value) {
  const normalized = String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return SEARCH_CATEGORIES.find(([, pattern]) => pattern.test(normalized))?.[0] || "otros";
}

export function categorizeReferrer(value) {
  if (!value) return "directo";
  let hostname;
  try { hostname = new URL(value).hostname.toLowerCase(); }
  catch { return "otros"; }
  const matches = (domain) => hostname === domain || hostname.endsWith("." + domain);
  if (matches("google.com") || matches("google.com.mx")) return "google";
  if (matches("facebook.com") || matches("fb.com")) return "facebook";
  if (matches("instagram.com")) return "instagram";
  if (matches("wa.me") || matches("whatsapp.com")) return "whatsapp";
  if (matches("catalogo.ventasdonatello.com")) return "interno";
  return "otros";
}

export function categorizePage(value) {
  const path = String(value || "");
  if (path === "/") return "inicio";
  if (/^\/(?:p|producto)\/\d+\/?$/.test(path)) return "producto";
  if (path === "/muebles") return "listado";
  return "otros";
}
