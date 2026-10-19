// Pruebas locales sin red y sin credenciales reales: node scripts/verify-seo.mjs
import assert from "node:assert/strict";
import productHandler from "../api/seo-products.js";
import sitemapHandler from "../api/sitemap.js";

process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
process.env.VITE_SUPABASE_ANON_KEY = "public-test-only";
const products = [
  { id: 166, name: "Escritorio Minimalista Roble 160 cm", code: "DON-000166",
    category: "Escritorios", price: 2500, stock: 1,
    image_url: "https://example.com/img/166.jpg" },
  { id: 167, name: "Mesa agotada", code: "DON-000167",
    category: "Mesas", price: 1990, stock: 0,
    image_url: "https://example.com/img/167.jpg" },
];

const originalFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  const value = new URL(String(url));
  const id = value.searchParams.get("id")?.replace(/^eq\./, "");
  const rows = id ? products.filter((p) => String(p.id) === id)
    : products.filter((p) => p.stock > 0 && p.price > 0);
  return { ok: true, json: async () => rows };
};

function response() {
  const headers = {};
  let status = 200, body = "";
  const result = {
    setHeader: (key, value) => { headers[key] = value; },
    status: (code) => { status = code; return result; },
    send: (content) => { body = String(content); return result; },
    end: () => result,
    get body() { return body; },
    get statusCode() { return status; },
    headers,
  };
  return result;
}

try {
  process.env.VERCEL_ENV = "production";
  const publicPage = response();
  await productHandler({ method: "GET", query: { mode: "product", id: "166" } }, publicPage);
  assert.equal(publicPage.statusCode, 200);
  assert.match(publicPage.body, /robots" content="index,follow/);
  assert.match(publicPage.body, /"@type":"Product"/);
  assert.match(publicPage.body, /"sku":"DON-000166"/);
  assert.match(publicPage.body, /"price":2500/);
  assert.match(publicPage.body, /"availability":"https:\/\/schema.org\/InStock"/);
  assert.match(publicPage.body, /Ver ficha y galería en el catálogo/);

  const soldOut = response();
  await productHandler({ method: "GET", query: { mode: "product", id: "167" } }, soldOut);
  assert.match(soldOut.body, /noindex,follow/);
  assert.doesNotMatch(soldOut.body, /"@type":"Product"/);

  const listing = response();
  await productHandler({ method: "GET", query: { mode: "list" } }, listing);
  assert.match(listing.body, /href="\/producto\/166"/);
  assert.doesNotMatch(listing.body, /href="\/producto\/167"/);

  const sitemap = response();
  await sitemapHandler({ method: "GET", query: {} }, sitemap);
  assert.match(sitemap.body, /https:\/\/catalogo\.ventasdonatello\.com\/producto\/166/);
  assert.doesNotMatch(sitemap.body, /\/producto\/167/);

  process.env.VERCEL_ENV = "preview";
  const preview = response();
  await productHandler({ method: "GET", query: { mode: "product", id: "166" } }, preview);
  assert.match(preview.body, /noindex,follow/);
  assert.match(preview.body, /"@type":"Product"/);

  console.log("SEO Donatello: páginas, stock, ficha, schema y sitemap correctos.");
} finally {
  globalThis.fetch = originalFetch;
}
