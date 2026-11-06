import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { categorizeSearch, categorizeReferrer, categorizePage } from "../src/searchPrivacy.js";

test("las búsquedas envían únicamente una categoría cerrada", () => {
  assert.equal(categorizeSearch("¿Tienen lámparas?"), "lamparas");
  assert.equal(categorizeSearch("silla, teléfono 8999122313"), "sillas");
  assert.equal(categorizeSearch("maria@correo.com 8999122313"), "otros");
  assert.equal(categorizeSearch("https://sitio.mx/pedido?id=12443"), "otros");
  assert.equal(categorizeSearch("mesa para mi casa"), "mesas");
});

test("las referencias y rutas no comparten tokens ni parámetros", () => {
  assert.equal(categorizeReferrer("https://www.google.com/search?q=mi+correo%40ejemplo.com"), "google");
  assert.equal(categorizeReferrer("https://site.example/path?auth=TOKEN123"), "otros");
  assert.equal(categorizeReferrer(""), "directo");
  assert.equal(categorizePage("/p/133"), "producto");
  assert.equal(categorizePage("/pedido?token=TOKEN123"), "otros");
});

test("la telemetría no envía ni almacena texto libre de la búsqueda", () => {
  const tracking = readFileSync(new URL("../src/conversionTracking.js", import.meta.url), "utf8");
  const storage = readFileSync(new URL("../src/commercialTelemetry.js", import.meta.url), "utf8");
  assert.match(tracking, /search_category:\s*categorizeSearch\(query\)/);
  assert.doesNotMatch(tracking, /track\("catalog_search",\s*\{\s*query\s*[,}:]/);
  assert.doesNotMatch(tracking, /referrer:\s*document\.referrer/);
  assert.match(storage, /search_term:\s*""/);
  assert.doesNotMatch(storage, /clean\(details\.query/);
});
