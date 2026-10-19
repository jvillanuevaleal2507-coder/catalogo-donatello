// Metadatos Open Graph generados del producto para WhatsApp y Facebook.
// El enlace /p/:id sirve HTML a los rastreadores y lleva al cliente a la ficha React.
const STORE_URL = "https://catalogo.ventasdonatello.com";
const FALLBACK_IMAGE = STORE_URL + "/banner-donatello-premium.png";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));
}

function safeImage(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

function money(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency", currency: "MXN", maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }

  const id = String(req.query.id || "");
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
    return res.status(400).send("Producto no valido");
  }

  // Conserva el dominio preview al probar, sin enlazar prematuramente a produccion.
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");
  const origin = /^[a-zA-Z0-9.-]+(?::[0-9]+)?$/.test(host)
    ? "https://" + host
    : STORE_URL;
  const shareUrl = origin + "/p/" + encodeURIComponent(id);
  const destination = origin + "/?producto=" + encodeURIComponent(id);

  let product = null;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && anonKey) {
    try {
      const endpoint = new URL("/rest/v1/products", supabaseUrl);
      endpoint.searchParams.set("id", "eq." + id);
      endpoint.searchParams.set("select", "id,code,name,price,stock,image_url");
      endpoint.searchParams.set("limit", "1");
      const response = await fetch(endpoint, {
        headers: { apikey: anonKey, Authorization: "Bearer " + anonKey },
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const rows = await response.json();
        product = Array.isArray(rows) ? rows[0] : null;
      } else {
        console.error("Vista previa: Supabase respondio", response.status);
      }
    } catch (error) {
      console.error("Vista previa: error consultando producto", error.message);
    }
  } else {
    console.error("Vista previa: faltan variables publicas de Supabase");
  }

  const title = product?.name
    ? product.name + " | Ventas Donatello"
    : "Muebles y decoracion | Ventas Donatello";
  const detail = product
    ? money(product.price) + " · Codigo: " + (product.code || "Sin codigo") + " · Consultanos por WhatsApp en Reynosa."
    : "Descubre muebles y decoracion en Reynosa. Consulta precio y disponibilidad.";
  const image = safeImage(product?.image_url);
  const name = product?.name || "Ventas Donatello";
  const code = product?.code ? "SKU: " + product.code : "Catalogo de muebles en Reynosa";
  const price = product ? money(product.price) : "";
  const e = escapeHtml;
  // mostrar=1 permite inspeccionar visualmente la tarjeta de prueba sin redirigir.
  const showPreview = req.query.mostrar === "1";
  const html = `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(detail)}">
<meta name="robots" content="noindex,follow">
<link rel="canonical" href="${e(shareUrl)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Ventas Donatello">
<meta property="og:locale" content="es_MX">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(detail)}">
<meta property="og:url" content="${e(shareUrl)}">
<meta property="og:image" content="${e(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${e(title)}">
<meta name="twitter:description" content="${e(detail)}">
<meta name="twitter:image" content="${e(image)}">
<style>
body{margin:0;background:#f5f0e9;color:#2b241f;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:420px;margin:55px auto;padding:0 20px}
h1{font-size:20px;margin:0 0 12px}
.caption{font-size:14px;color:#74685d;line-height:1.55}
.card{overflow:hidden;border:1px solid #ded7cf;border-radius:14px;background:white;box-shadow:0 8px 32px #3e2b1918}
.card img{display:block;width:100%;height:245px;object-fit:contain;background:#f8f8f8}
.card-content{padding:16px}.card-content b{display:block;font-size:17px}.card-content p{margin:6px 0;color:#625a52;font-size:14px}
a.btn{display:block;text-align:center;margin:18px 0;padding:13px;background:#33291f;color:white;border-radius:10px;text-decoration:none}
</style>
</head>
<body>
<main>
<h1>Así se verá el enlace de este mueble</h1>
<p class="caption">Demostración aproximada: WhatsApp y Facebook pueden cambiar el diseño de la tarjeta.</p>
<div class="card">
<img src="${e(image)}" alt="${e(name)}">
<div class="card-content"><b>${e(name)}</b><p>${e(code)}</p><p>${e(price)}</p><p>catalogo.ventasdonatello.com</p></div>
</div>
<a class="btn" href="${e(destination)}">Abrir ficha del producto</a>
<p class="caption">Al compartir este enlace, se envían los metadatos del producto para que la plataforma genere su propia vista previa.</p>
</main>
${showPreview ? "" : `<script>window.location.replace(${JSON.stringify(destination)});</script>`}
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).send(html);
}
