import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("src/CatalogAssistant.css", "utf8");
const assistant = readFileSync("src/CatalogAssistant.jsx", "utf8");
const favorites = readFileSync("src/favorites.js", "utf8");

test("El chat se muestra abajo a la izquierda, lejos de favoritos", () => {
  assert.match(css, /\.dchat-root\s*\{[^}]*left:\s*20px;[^}]*right:\s*auto;/);
  assert.match(css, /@media\s*\(max-width:\s*600px\)[\s\S]*\.dchat-root\s*\{[^}]*left:\s*12px;[^}]*right:\s*auto;/);
  assert.match(favorites, /\.donatello-favorites-fab\s*\{position:fixed;right:20px;bottom:20px;/);
  assert.match(favorites, /@media\(max-width:760px\)\{\.donatello-favorites-fab\{right:12px;bottom:12px;/);
});

test("En móviles el chat tiene etiqueta compacta Ayuda", () => {
  assert.match(assistant, /dchat-launch-label-mobile">Ayuda<\/span>/);
  assert.match(css, /\.dchat-launch-label-mobile\s*\{\s*display:\s*none;/);
  assert.match(css, /\.dchat-launch-label-mobile\s*\{\s*display:\s*inline;/);
});

test("Abrir el chat no bloquea permanente favoritos", () => {
  assert.match(assistant, /document\.body\.classList\.toggle\("donatello-chat-open", opened\)/);
  assert.match(assistant, /document\.body\.classList\.remove\("donatello-chat-open"\)/);
  assert.match(css, /body\.donatello-chat-open\s+#donatello-favorites-root\s+\.donatello-favorites-fab/);
  assert.match(css, /\.dchat-root\.dchat-opened\s*\{\s*z-index:\s*160/);
});
