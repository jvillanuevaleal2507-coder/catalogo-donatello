// Sitemap dinámico: incluye sólo productos con stock, precio y fotografía.
const STORE = "https://catalogo.ventasdonatello.com";

function xml(value) {
  return String(value).replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[ch]);
}
function validImage(value) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }
  const api = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!api || !key) return res.status(503).end();
  try {
    const endpoint = new URL("/rest/v1/products", api);
    endpoint.searchParams.set("select", "id,image_url,price,stock");
    endpoint.searchParams.set("stock", "gt.0");
    endpoint.searchParams.set("price", "gt.0");
    endpoint.searchParams.set("order", "id.desc");
    endpoint.searchParams.set("limit", "500");
    const result = await fetch(endpoint, {
      headers: { apikey: key, Authorization: "Bearer " + key },
      signal: AbortSignal.timeout(6000),
    });
    if (!result.ok) throw new Error("Inventory unavailable: " + result.status);
    const items = await result.json();
    const locs = [
      STORE + "/",
      STORE + "/muebles",
      ...items.filter((p) => Number(p.stock) > 0 && Number(p.price) > 0 &&
        validImage(p.image_url) && /^[0-9]+$/.test(String(p.id)))
        .map((p) => STORE + "/producto/" + encodeURIComponent(p.id)),
    ];
    const xmlText = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      locs.map((url) => "  <url><loc>" + xml(url) + "</loc></url>").join("\n") +
      "\n</urlset>";
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    if (process.env.VERCEL_ENV !== "production") {
      res.setHeader("X-Robots-Tag", "noindex");
    }
    return res.status(200).send(xmlText);
  } catch (err) {
    console.error("Sitemap Donatello:", err.message);
    return res.status(503).send("Sitemap no disponible temporalmente");
  }
}
