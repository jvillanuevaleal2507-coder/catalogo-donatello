import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildHandoffLink, buildHandoffMessage, isProductFollowup } from "../src/chatHandoff.js";

test("la pregunta y el producto correcto aparecen prellenados en WhatsApp", () => {
  const link = buildHandoffLink({
    question: "¿Cuánto cuesta el envío?",
    product: { id: 123, code: "DON-123", name: "Mecedora gris" },
  });
  const url = new URL(link);
  assert.equal(url.host, "wa.me");
  assert.equal(url.pathname, "/528999122313");
  const msg = url.searchParams.get("text");
  assert.match(msg, /Mecedora gris/);
  assert.match(msg, /DON-123/);
  assert.match(msg, /https:\/\/catalogo\.ventasdonatello\.com\/p\/123/);
  assert.match(msg, /Mi pregunta: ¿Cuánto cuesta el envío\?/);
  assert.ok(!msg.includes("precio de compra"));
});

test("cuando no hay producto no se inventa uno", () => {
  const msg = buildHandoffMessage({ question: "¿Aceptan tarjeta?" });
  assert.match(msg, /Mi pregunta: ¿Aceptan tarjeta\?/);
  assert.ok(!msg.includes("Producto:"));
  assert.ok(!msg.includes("Código:"));
});

test("no se conserva el historial completo ni caracteres de control", () => {
  const long = "¿Cuánto cuesta?\nMi número es... " + "a".repeat(400);
  const msg = buildHandoffMessage({
    question: long,
    product: { id: "no-id", name: "No debe incluirse" },
  });
  const questionLine = msg.split("\n").find((line) => line.startsWith("Mi pregunta: "));
  assert.ok(questionLine.length <= "Mi pregunta: ".length + 300);
  assert.ok(!msg.includes("No debe incluirse"));
  assert.equal(msg.split("\n").length, 2);
});

test("solo consultas sobre un producto arrastran su contexto", () => {
  assert.equal(isProductFollowup("¿Hacen envíos?"), true);
  assert.equal(isProductFollowup("¿Lo pueden entregar?"), true);
  assert.equal(isProductFollowup("¿Qué garantía tiene?"), true);
  assert.equal(isProductFollowup("¿Dónde están?"), false);
  assert.equal(isProductFollowup("¿Cuánto cuesta?"), true);
});

test("el traspaso es explícito y no usa un envío automático", () => {
  const component = readFileSync("src/CatalogAssistant.jsx", "utf8");
  assert.match(component, /className="dchat-human-btn"/);
  assert.match(component, /Hablar con Donatello/);
  assert.match(component, /href=\{item\.handoffUrl\}/);
  assert.match(component, /Tú decides si la envías/);
  assert.match(component, /buildHandoffLink\(\{ question: value, product: productContext \}\)/);
  assert.doesNotMatch(component, /sendWhatsApp|sendMessageToWhatsApp|graph\.facebook\.com/);
});
