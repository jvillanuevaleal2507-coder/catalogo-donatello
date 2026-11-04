import { createClient } from "npm:@supabase/supabase-js@2.108.2";

// Asistente público de Donatello: respuestas sustentadas en inventario.
// No tiene acceso a expedientes, WhatsApp, costos de subasta ni claves Meta.
const WHATSAPP = "https://wa.me/528999122313";
const ORIGINS = new Set([
  "https://catalogo.ventasdonatello.com",
  "https://catalogo-donatello.vercel.app",
  "http://localhost:5173",
]);
const MAX_MESSAGE_LENGTH = 300;
const NOISE = new Set([
  "quiero", "busco", "buscando", "tienes", "tienen", "tenga", "tendras",
  "hay", "para", "donde", "como", "cual", "cuanto", "cuesta", "cuestan",
  "precio", "precios", "disponible", "disponibilidad", "tienen", "tendra",
  "alguna", "algun", "unas", "unos", "una", "uno", "los", "las", "del",
  "con", "por", "que", "algo", "favor", "hola", "buenas", "bien",
  "dias", "tardes", "noches", "necesito", "ver", "comprar", "me",
  "de", "el", "la", "en", "un", "y", "a", "es", "se", "da", "lo",
  "productos", "producto", "muebles", "mueble", "catalogo",
]);
const clean = (value: unknown) =>
  String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();

function safeOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  if (ORIGINS.has(origin)) return origin;
  if (/^https:\/\/catalogo-donatello-[a-z0-9-]+\.vercel\.app$/.test(origin)) return origin;
  return "";
}

const json = (body: Record<string, unknown>, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Vary": "Origin",
      ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    },
  });

type Product = {
  id: number;
  code: string;
  name: string;
  category: string | null;
  price: number;
  stock: number;
};

function searchProducts(text: string, inventory: Product[]) {
  const query = clean(text);
  const terms = query.split(" ").filter((part) => part.length >= 3 && !NOISE.has(part)).slice(0, 8);
  if (!terms.length) return [];
  const ranked = inventory.map((product) => {
    const name = clean(product.name);
    const cat = clean(product.category);
    const code = clean(product.code);
    let score = 0;
    if (code && query.includes(code)) score += 80;
    for (const part of terms) {
      // "lámparas" busca "lámpara" y "sillones" encuentra "sillón".
      const variants = [part];
      if (part.endsWith("es") && part.length > 5) variants.push(part.slice(0, -2));
      if (part.endsWith("s") && part.length > 4) variants.push(part.slice(0, -1));
      if (variants.some((v) => name.includes(v))) score += 5;
      if (variants.some((v) => cat.includes(v))) score += 3;
      if (variants.some((v) => code.includes(v))) score += 9;
      if (name.split(" ").some((token) => variants.some((v) => token.startsWith(v)))) score += 1;
    }
    return { product, score };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score || b.product.id - a.product.id);
  return ranked.slice(0, 4).map(({ product }) => product);
}

function availableProduct(product: Product) {
  return {
    id: product.id,
    code: product.code,
    name: String(product.name).slice(0, 140),
    category: product.category,
    price: Number(product.price),
    url: `https://catalogo.ventasdonatello.com/p/${encodeURIComponent(product.id)}`,
  };
}

function respond(message: string, inventory: Product[]) {
  const q = clean(message);
  const terms = q.split(" ");
  const has = (...words: string[]) => words.some((w) => terms.includes(w) || q.includes(w));
  const none = { products: [] as ReturnType<typeof availableProduct>[], whatsapp: WHATSAPP, handoff: false };
  const human = (reply: string) => ({ ...none, reply, handoff: true });

  if (has("ubicacion", "direccion", "donde estan", "como llego", "visitar", "colonia")) {
    return { ...none, reply: "Estamos en Calle Donatello 201, Jarachina Sur, Reynosa. Si necesitas indicaciones, te ayudamos por WhatsApp." };
  }
  if (has("horario", "hora", "abren", "cierran", "abierto", "cerrado")) {
    return { ...none, reply: "Atendemos hasta las 9:30 p. m. Si quieres confirmar la hora de apertura de hoy, escríbenos por WhatsApp." };
  }
  if (has("envio", "envios", "entrega", "domicilio", "flete", "reparto")) {
    return human("El costo y la disponibilidad de envío requieren confirmación. Te paso con Donatello por WhatsApp y llevas tu pregunta escrita.");
  }
  if (has("pagar", "pago", "tarjeta", "transferencia", "meses", "credito", "apartado", "apartarlo")) {
    return human("Para confirmar métodos de pago, apartados o facilidades vigentes, te atiende una persona de Donatello por WhatsApp.");
  }
  if (has("asesor", "humano", "persona", "whatsapp", "contacto", "telefono", "hablar", "atencion")) {
    return human("Claro, te comunicamos con Donatello. Puedes abrir WhatsApp con tu pregunta ya preparada.");
  }

  // Datos no disponibles en el inventario público: nunca inferir medidas, garantías,
  // colores alternativos, condiciones comerciales ni servicios de instalación.
  if (has("garantia", "garantias", "devolucion", "devoluciones", "cambios",
    "medidas", "dimensiones", "altura", "ancho", "largo", "tamaño", "peso",
    "material", "colores", "instalacion", "armado", "armar", "ensamble",
    "descuento", "descuentos", "promocion", "promociones", "mayoreo", "factura")) {
    return human("Ese detalle necesita confirmación. Con gusto te atendemos por WhatsApp para darte la información correcta.");
  }

  const matches = searchProducts(message, inventory);
  if (matches.length) {
    return {
      ...none,
      reply: matches.length === 1
        ? "Encontré esta opción en el catálogo. El precio y la disponibilidad corresponden a lo registrado en este momento; te confirmamos antes de cerrar la compra."
        : "Encontré estas opciones disponibles en nuestro catálogo. Puedes abrir cada producto para ver sus fotos y precio; te confirmamos existencia antes de cerrar la compra.",
      products: matches.map(availableProduct),
    };
  }

  if (has("hola", "buenas", "inicio", "ayuda", "menu", "informacion", "info", "que hacen", "que venden")) {
    return { ...none, reply: "¡Hola! Soy el asistente del catálogo Donatello. Puedo ayudarte a buscar muebles o lámparas, consultar precios publicados y darte nuestra ubicación y horario. ¿Qué estás buscando?" };
  }
  if (has("catalogo", "productos", "muebles", "novedades", "que tienen")) {
    return {
      ...none,
      reply: "Estos son algunos productos disponibles. También puedes escribirme algo más específico, como ‘sillón’, ‘lámpara’ o ‘mesa’.",
      products: inventory.slice(0, 4).map(availableProduct),
    };
  }
  return human("No tengo una respuesta confirmada para esa consulta. Puedes hablar directamente con Donatello por WhatsApp; llevarás tu pregunta ya escrita.");
}

Deno.serve(async (req: Request) => {
  const origin = safeOrigin(req);
  if (origin === "") return json({ error: "origen_no_autorizado" }, 403);
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Max-Age": "3600",
        "Vary": "Origin",
      },
    });
  }
  if (req.method !== "POST") return json({ error: "metodo_no_permitido" }, 405, origin);
  if (Number(req.headers.get("content-length") || 0) > 4096) return json({ error: "mensaje_demasiado_largo" }, 413, origin);
  const raw = await req.text();
  if (raw.length > 4096) return json({ error: "mensaje_demasiado_largo" }, 413, origin);

  let payload: { message?: unknown };
  try { payload = JSON.parse(raw); } catch { return json({ error: "json_invalido" }, 400, origin); }
  const message = payload?.message;
  if (typeof message !== "string" || message.trim().length < 1 || message.length > MAX_MESSAGE_LENGTH) {
    return json({ error: "mensaje_invalido" }, 400, origin);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "servicio_no_disponible" }, 503, origin);

  try {
    const ip = req.headers.get("cf-connecting-ip")
      || req.headers.get("x-real-ip")
      || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || "unknown";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key + "|donatello-bot|" + ip));
    const visitorHash = Array.from(new Uint8Array(digest), (v) => v.toString(16).padStart(2, "0")).join("");
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: allowed, error: rateError } = await admin.rpc("donatello_catalog_chat_allow", { p_visitor_hash: visitorHash });
    if (rateError) return json({ error: "servicio_no_disponible" }, 503, origin);
    if (!allowed) return json({ error: "limite_de_consultas", reply: "Por ahora alcanzaste el límite de consultas. Puedes escribirnos por WhatsApp.", whatsapp: WHATSAPP, handoff: true, products: [] }, 429, origin);

    const { data, error } = await admin.from("products")
      .select("id,code,name,category,price,stock")
      .gt("stock", 0)
      .order("id", { ascending: false })
      .limit(250);
    if (error) return json({ error: "catalogo_no_disponible" }, 503, origin);
    // Sin información privada de productos, precios de compra o datos personales.
    return json(respond(message, (data || []) as Product[]), 200, origin);
  } catch {
    return json({ error: "servicio_no_disponible" }, 503, origin);
  }
});
