// Traspaso explícito: el cliente decide si abre WhatsApp y envía el mensaje.
// No guardamos conversaciones ni compartimos el historial completo del chat.
const WHATSAPP_NUMBER = "528999122313";
const CATALOG_ORIGIN = "https://catalogo.ventasdonatello.com";

function oneLine(value, length) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, length);
}

function productSummary(product) {
  const id = Number(product?.id);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return {
    id,
    name: oneLine(product?.name, 100),
    code: oneLine(product?.code, 40),
    url: CATALOG_ORIGIN + "/p/" + id,
  };
}

export function isProductFollowup(question) {
  return /\b(env[ií]o|env[ií]os|env[ií]an|env[ií]ar|entrega|entregan|entregar|flete|domicilio|apartar|apartado|reservar|descuento|oferta|garant[ií]a|cambio|devoluci[oó]n|medidas|medida|dimensiones|ancho|largo|altura|alto|material|armado|armar|instalaci[oó]n|pagar|pago|tarjeta|precio|este|esta|esto|ese|esa|cu[aá]nto|cu[aá]ntos|c[oó]mo)\b/i.test(String(question ?? ""));
}

export function buildHandoffMessage({ question = "", product = null } = {}) {
  const lines = ["Hola, vengo del catálogo de Donatello y quisiera atención personal."];
  const context = productSummary(product);
  if (context) {
    if (context.name) lines.push("Producto: " + context.name);
    if (context.code) lines.push("Código: " + context.code);
    lines.push("Enlace: " + context.url);
  }
  const text = oneLine(question, 300);
  if (text) lines.push("Mi pregunta: " + text);
  else lines.push("¿Me pueden ayudar, por favor?");
  return lines.join("\n");
}

export function buildHandoffLink(details) {
  return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(buildHandoffMessage(details));
}
