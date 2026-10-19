// Paginas de productos SSR: indexables y visibles para personas y buscadores.
const STORE = "https://catalogo.ventasdonatello.com";
const PHONE = "528999122313";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}
function imageUrl(value) {
  try {
    const u = new URL(String(value ?? ""));
    return u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}
function money(amount) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency", currency: "MXN", maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}
function ldJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
function doc(title, description, canonical, image, html, schema, indexable, pageType) {
  const robots = indexable && process.env.VERCEL_ENV === "production"
    ? "index,follow,max-image-preview:large"
    : "noindex,follow";
  const safeImage = imageUrl(image) || STORE + "/banner-donatello-premium.png";
  const jsonLd = schema ? '<script type="application/ld+json">' + ldJson(schema) + "</script>" : "";
  return '<!doctype html><html lang="es-MX"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    "<title>" + esc(title) + "</title>" +
    '<meta name="description" content="' + esc(description) + '">' +
    '<meta name="robots" content="' + robots + '">' +
    '<link rel="canonical" href="' + esc(canonical) + '">' +
    '<meta property="og:type" content="' + (pageType === "product" ? "product" : "website") + '">' +
    '<meta property="og:site_name" content="Ventas Donatello">' +
    '<meta property="og:locale" content="es_MX">' +
    '<meta property="og:title" content="' + esc(title) + '">' +
    '<meta property="og:description" content="' + esc(description) + '">' +
    '<meta property="og:url" content="' + esc(canonical) + '">' +
    '<meta property="og:image" content="' + esc(safeImage) + '">' +
    '<meta name="twitter:card" content="summary_large_image">' +
    '<meta name="twitter:image" content="' + esc(safeImage) + '">' +
    '<link rel="icon" href="/logo-donatello.png" type="image/png">' +
    jsonLd +
    '<style>' +
    ':root{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#18271f;background:#faf6ed}' +
    '*{box-sizing:border-box}body{margin:0}a{color:inherit}' +
    'header{background:#102b21;color:#fff8e4;border-bottom:3px solid #c29d59}' +
    'header .inner{max-width:1100px;margin:auto;padding:20px;display:flex;justify-content:space-between;align-items:center;gap:15px}' +
    '.brand{font-family:Georgia,serif;font-size:22px;letter-spacing:.03em;font-weight:bold;text-decoration:none}' +
    '.brand span{color:#e1bc74}header nav a{font-size:13px;text-decoration:none;border:1px solid #c6a566;border-radius:30px;padding:9px 15px}' +
    'main{max-width:1100px;margin:28px auto;padding:0 20px}h1{font-family:Georgia,serif;font-size:clamp(28px,4vw,43px);line-height:1.2;margin:12px 0 15px}' +
    '.intro{color:#5d655f;line-height:1.7;max-width:720px}.crumb{font-size:12px;color:#77736a;text-decoration:none}' +
    '.detail{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:30px;align-items:start;margin-top:25px}' +
    '.photo{border:1px solid #e8dece;border-radius:17px;background:#fff;padding:14px}' +
    '.photo img{width:100%;height:390px;object-fit:contain;display:block}' +
    '.thumbnails{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.thumbnails img{width:92px;height:72px;object-fit:contain;background:#fff;border:1px solid #e3d9c9;border-radius:8px}' +
    '.info{background:white;border:1px solid #e7dcc9;border-radius:17px;padding:26px}' +
    '.eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;color:#9c753f;text-transform:uppercase}' +
    '.price{font-weight:800;color:#174734;font-size:32px;margin:23px 0 7px}.stock{font-size:13px;color:#5c7664;margin-bottom:22px}' +
    '.sku{color:#777;font-size:13px}.copy{font-size:14px;color:#4f5850;line-height:1.8}' +
    '.btn{display:block;background:#173d2f;color:#fff;text-align:center;text-decoration:none;padding:15px 18px;border-radius:11px;font-weight:700;margin-top:11px}' +
    '.btn.alt{background:#fbf5e7;color:#28503b;border:1px solid #ccb88c}' +
    '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:17px;margin:25px 0 40px}' +
    '.card{display:block;text-decoration:none;background:#fff;border:1px solid #e5dac8;border-radius:15px;overflow:hidden}' +
    '.card img{display:block;width:100%;height:200px;object-fit:contain;background:#fff;padding:10px}' +
    '.card div{padding:14px}.card h2{font-family:Georgia,serif;font-size:17px;margin:0 0 10px;line-height:1.35}.card b{color:#1c513c}.tag{font-size:11px;color:#8f754e;margin-top:4px}' +
    'footer{margin-top:42px;background:#f0e7d6;padding:25px;text-align:center;font-size:12px;color:#675f55;line-height:1.8}' +
    '@media(max-width:720px){header .inner{padding:15px}.brand{font-size:19px}.detail{grid-template-columns:1fr;gap:14px}.photo img{height:280px}.info{padding:21px}main{margin:19px auto}}' +
    '</style></head><body>' +
    '<header><div class="inner"><a class="brand" href="/">Ventas <span>Donatello</span></a>' +
    '<nav><a href="/">Catálogo completo ↗</a></nav></div></header>' +
    '<main>' + html + '</main>' +
    '<footer>Ventas Donatello · Calle Donatello 201, Jarachina Sur, Reynosa, Tamaulipas · ' +
    '<a href="/muebles">Ver muebles disponibles</a><br>Precios y existencias sujetos a confirmación.</footer>' +
    '</body></html>';
}
async function getProducts(singleId = null) {
  const api = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!api || !key) throw new Error("Faltan variables públicas para consultar productos");
  const u = new URL("/rest/v1/products", api);
  u.searchParams.set("select", "id,code,name,category,price,stock,image_url,image_url_2,image_url_3,image_url_4");
  if (singleId !== null) {
    u.searchParams.set("id", "eq." + singleId);
  } else {
    u.searchParams.set("stock", "gt.0");
    u.searchParams.set("price", "gt.0");
    u.searchParams.set("order", "id.desc");
  }
  u.searchParams.set("limit", singleId !== null ? "1" : "500");
  const response = await fetch(u, {
    headers: { apikey: key, Authorization: "Bearer " + key },
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error("Consulta de catálogo: " + response.status);
  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }
  const listing = req.query.mode === "list";
  const id = String(req.query.id || "");
  if (!listing && !/^[0-9]{1,15}$/.test(id)) return res.status(400).send("Producto no válido");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  try {
    if (listing) {
      const products = (await getProducts()).filter(
        (p) => Number(p.stock) > 0 && Number(p.price) > 0 && imageUrl(p.image_url)
      );
      const title = "Muebles disponibles en Reynosa | Ventas Donatello";
      const description = "Explora muebles y decoración disponibles en Ventas Donatello, Jarachina Sur, Reynosa. Consulta fotografías, precios publicados y existencias.";
      const grid = products.length ? products.map((p) => {
        const url = "/producto/" + encodeURIComponent(p.id);
        return '<a class="card" href="' + esc(url) + '">' +
          '<img loading="lazy" src="' + esc(imageUrl(p.image_url)) + '" alt="' + esc(p.name) + '">' +
          '<div><span class="eyebrow">' + esc(p.category || "Muebles") + '</span>' +
          '<h2>' + esc(p.name) + '</h2><b>' + esc(money(p.price)) +
          '</b><div class="tag">Ver detalles y consultar disponibilidad →</div></div></a>';
      }).join("") : '<p>Por ahora no hay muebles disponibles para mostrar.</p>';
      const listHtml = '<a class="crumb" href="/">Inicio</a><h1>Muebles y decoración en Reynosa</h1>' +
        '<p class="intro">Conoce los muebles disponibles en Ventas Donatello. Cada pieza incluye su fotografía y precio publicado; pregunta por WhatsApp para confirmar existencias antes de visitarnos.</p>' +
        '<div class="grid">' + grid + '</div>';
      const pageSchema = {
        "@context": "https://schema.org", "@type": "CollectionPage", name: title,
        description, url: STORE + "/muebles",
      };
      return res.status(200).send(doc(title, description, STORE + "/muebles",
        "", listHtml, pageSchema, products.length > 0, "website"));
    }

    const products = await getProducts(id);
    const p = Array.isArray(products) ? products[0] : null;
    if (!p) {
      return res.status(404).send(doc("Producto no encontrado | Donatello",
        "Explora otros muebles disponibles en Ventas Donatello.",
        STORE + "/muebles", "", '<h1>Este mueble ya no está en el catálogo</h1><p><a href="/muebles">Ver otros muebles disponibles →</a></p>',
        null, false, "website"));
    }
    const available = Number(p.stock) > 0;
    const price = Number(p.price);
    const primary = imageUrl(p.image_url);
    const valid = available && Number.isFinite(price) && price > 0 && !!primary;
    const url = STORE + "/producto/" + encodeURIComponent(id);
    const title = p.name + " en Reynosa | Ventas Donatello";
    const description = (available ? "Disponible" : "Actualmente agotado") +
      " en Ventas Donatello, Reynosa. " + p.name + ". Precio publicado: " +
      money(price) + ". Referencia: " + (p.code || id) + ". Consulta por WhatsApp.";
    const images = [p.image_url,p.image_url_2,p.image_url_3,p.image_url_4]
      .map(imageUrl).filter(Boolean).filter((v,i,all)=>all.indexOf(v)===i);
    const whatsapp = "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(
      "Hola, vi este mueble en el catálogo Donatello y me interesa.\n\n" +
      p.name + "\nCódigo: " + (p.code || id) + "\nPrecio publicado: " + money(price) +
      "\n\n¿Me confirmas si está disponible?\n\nVer producto: " + url
    );
    const detail = '<a class="crumb" href="/muebles">Muebles en Reynosa</a> › <span class="crumb">' + esc(p.category || "Decoración") + '</span>' +
      '<div class="detail"><div><div class="photo">' +
      (primary ? '<img src="' + esc(primary) + '" alt="' + esc(p.name) + '">' : '<p>Fotografía no disponible</p>') +
      '</div>' + (images.length > 1 ? '<div class="thumbnails">' + images.slice(1).map((img) =>
        '<img loading="lazy" src="' + esc(img) + '" alt="Otra vista de ' + esc(p.name) + '">'
      ).join("") + "</div>" : "") + '</div>' +
      '<section class="info"><div class="eyebrow">' + esc(p.category || "Muebles") + ' · Reynosa, Tamaulipas</div>' +
      '<h1>' + esc(p.name) + '</h1>' +
      '<p class="sku">Código de producto: ' + esc(p.code || id) + '</p>' +
      '<div class="price">' + esc(money(price)) + '</div>' +
      '<p class="stock">' + (available ? "Disponible para consultar" : "Agotado por el momento") + '</p>' +
      '<p class="copy">Este producto forma parte del catálogo de Ventas Donatello en Reynosa. ' +
      'Revisa sus fotografías reales, solicita información por WhatsApp y confirma precio y disponibilidad antes de tu visita.</p>' +
      '<a class="btn" href="' + esc(whatsapp) + '" rel="noopener noreferrer" target="_blank">Consultar este mueble por WhatsApp ↗</a>' +
      '<a class="btn alt" href="/?producto=' + encodeURIComponent(id) + '">Ver ficha y galería en el catálogo</a>' +
      '<a class="btn alt" href="/muebles">Explorar otros muebles</a>' +
      '</section></div>';
    const schema = valid ? {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description,
      image: images,
      sku: p.code || String(p.id),
      category: p.category || "Muebles",
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "MXN",
        price,
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "Store",
          name: "Ventas Donatello",
          url: STORE,
        },
      },
    } : null;
    return res.status(200).send(doc(title, description, url,
      primary, detail, schema, valid, "product"));
  } catch (err) {
    console.error("SEO Donatello:", err.message);
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("No pudimos consultar el catálogo en este momento.");
  }
}
