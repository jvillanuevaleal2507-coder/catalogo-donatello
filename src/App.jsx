import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;


// Cambia este número por el WhatsApp oficial de Ventas Donatello.
// Formato recomendado: país + lada + número, sin espacios. Ejemplo México: 528991234567
const WHATSAPP_NUMBER = "528999122313";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function money(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));
}

function normalizeCategory(value) {
  const text = String(value || "General").trim();
  if (!text) return "General";

  return text
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildWhatsAppLink(product) {
  const message = `Hola, me interesa este producto de Ventas Donatello:

Producto: ${product.name}
Código: ${product.code}
Precio: ${money(product.price)}

¿Me puedes dar más información?`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function ProductImage({ src, alt }) {
  if (!src) {
    return (
      <div className="product-image placeholder">
        <span>VD</span>
      </div>
    );
  }

  return (
    <img
      className="product-image"
      src={src}
      alt={alt}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setLoadError("");

    const { data, error } = await supabase
      .from("products")
      .select("id, code, name, category, price, stock, image_url")
      .gt("stock", 0)
      .order("id", { ascending: false });

    if (error) {
      setLoadError(error.message);
      setProducts([]);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  const categories = useMemo(() => {
    const unique = new Set(
      products.map((product) => normalizeCategory(product.category))
    );

    return ["Todas", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const normalizedCategory = normalizeCategory(product.category);

      const matchesCategory =
        categoryFilter === "Todas" || normalizedCategory === categoryFilter;

      const matchesSearch = `${product.name || ""} ${product.code || ""} ${normalizedCategory}`
        .toLowerCase()
        .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, categoryFilter]);

  return (
    <div className="app">
      <style>{styles}</style>

      <header className="hero">
        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="brand-mark">
            <img src="/logo-donatello.png" alt="Ventas Donatello" />
          </div>

          <div>
            <p className="eyebrow">Showroom digital</p>
            <h1>Ventas Donatello</h1>
            <p className="tagline">
              Hogar • Muebles • Iluminación • Decoración
            </p>
          </div>
        </div>
      </header>

      <main className="shell">
        <section className="intro-card">
          <div>
            <h2>Colección disponible</h2>
            <p>
              Descubre piezas disponibles para transformar tu espacio. Consulta por WhatsApp y recibe atención personalizada.
            </p>
          </div>

          <button className="refresh-btn" onClick={loadProducts}>
            Actualizar catálogo
          </button>
        </section>

        <section className="filters-card">
          <div className="search-box">
            <span>🔎</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar producto, código o categoría..."
            />
          </div>

          <div className="category-row">
            {categories.map((category) => (
              <button
                key={category}
                className={categoryFilter === category ? "category active" : "category"}
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {loading && (
          <section className="state-card">
            <h3>Cargando catálogo...</h3>
            <p>Estamos consultando los productos disponibles.</p>
          </section>
        )}

        {!loading && loadError && (
          <section className="state-card error">
            <h3>No pudimos cargar el catálogo</h3>
            <p>{loadError}</p>
          </section>
        )}

        {!loading && !loadError && filteredProducts.length === 0 && (
          <section className="state-card">
            <h3>No encontramos productos disponibles</h3>
            <p>Prueba con otra búsqueda o vuelve más tarde.</p>
          </section>
        )}

        {!loading && !loadError && filteredProducts.length > 0 && (
          <>
            <div className="results-count">
              {filteredProducts.length} producto
              {filteredProducts.length === 1 ? "" : "s"} disponible
              {filteredProducts.length === 1 ? "" : "s"}
            </div>

            <section className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="image-wrap">
                    <ProductImage src={product.image_url} alt={product.name} />
                    <span className="stock-pill">Disponible</span>
                  </div>

                  <div className="product-body">
                    <span className="product-category">
                      {normalizeCategory(product.category)}
                    </span>

                    <h3>{product.name}</h3>

                    <p className="code">{product.code}</p>

                    <div className="price-row">
                      <span>Precio</span>
                      <strong>{money(product.price)}</strong>
                    </div>

                    <a
                      className="whatsapp-btn"
                      href={buildWhatsAppLink(product)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      💬 Cotizar por WhatsApp
                    </a>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <strong>Ventas Donatello</strong>
        <span>Catálogo sujeto a disponibilidad.</span>
      </footer>
    </div>
  );
}

const styles = `
  :root {
    --green-black: #07140f;
    --green-deep: #0f2c21;
    --green: #173d2f;
    --gold: #b98731;
    --gold-soft: #e6c37a;
    --cream: #fff4dc;
    --cream-soft: #fffaf0;
    --paper: #f7ead0;
    --brown: #3b2410;
    --muted: #76664f;
    --card: rgba(255, 250, 240, 0.96);
    --border: rgba(185, 135, 49, 0.34);
    --shadow-soft: 0 18px 45px rgba(16, 41, 31, 0.13);
    --shadow-premium: 0 28px 75px rgba(7, 20, 15, 0.24);
  }

  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: var(--green-black);
    background:
      radial-gradient(circle at top left, rgba(230, 195, 122, .34), transparent 30%),
      radial-gradient(circle at 95% 20%, rgba(15, 44, 33, .16), transparent 28%),
      linear-gradient(180deg, #fff8e9 0%, #f7ead0 100%);
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: .28;
    background-image:
      linear-gradient(rgba(185,135,49,.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(185,135,49,.08) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: linear-gradient(to bottom, black, transparent 82%);
  }

  .app {
    min-height: 100vh;
  }

  .hero {
    position: relative;
    min-height: 390px;
    background:
      radial-gradient(circle at 78% 24%, rgba(230,195,122,.28), transparent 28%),
      radial-gradient(circle at 18% 0%, rgba(255,244,220,.11), transparent 26%),
      linear-gradient(135deg, #07140f 0%, #0f2c21 48%, #173d2f 100%);
    overflow: hidden;
    border-bottom: 1px solid rgba(230,195,122,.45);
  }

  .hero::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: .36;
    background:
      linear-gradient(45deg, rgba(255,255,255,.035) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(255,255,255,.028) 25%, transparent 25%);
    background-size: 30px 30px;
  }

  .hero::after {
    content: "";
    position: absolute;
    right: -140px;
    bottom: -210px;
    width: 560px;
    height: 560px;
    border-radius: 50%;
    background:
      radial-gradient(circle, rgba(230,195,122,.26), transparent 62%);
    filter: blur(1px);
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(7,20,15,.86), rgba(7,20,15,.28)),
      linear-gradient(180deg, transparent 0%, rgba(7,20,15,.38) 100%);
  }

  .hero-content {
    position: relative;
    z-index: 2;
    width: min(1180px, calc(100% - 32px));
    margin: 0 auto;
    min-height: 390px;
    display: grid;
    grid-template-columns: 160px 1fr;
    align-items: center;
    gap: 30px;
    color: var(--cream);
  }

  .brand-mark {
    width: 158px;
    height: 158px;
    min-width: 158px;
    border-radius: 36px;
    background:
      linear-gradient(135deg, rgba(255,250,240,.16), rgba(255,250,240,.045));
    border: 1px solid rgba(230,195,122,.68);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow:
      0 28px 70px rgba(0,0,0,.28),
      inset 0 0 0 1px rgba(255,255,255,.08);
  }

  .brand-mark img {
    width: 150%;
    height: 150%;
    object-fit: contain;
    transform: scale(1.02);
  }

  .eyebrow {
    margin: 0 0 10px;
    text-transform: uppercase;
    letter-spacing: .22em;
    color: var(--gold-soft);
    font-weight: 950;
    font-size: .82rem;
  }

  h1 {
    margin: 0;
    font-size: clamp(3rem, 7.4vw, 6.6rem);
    line-height: .88;
    letter-spacing: -.075em;
    font-weight: 950;
    text-shadow: 0 18px 40px rgba(0,0,0,.28);
  }

  .tagline {
    margin: 18px 0 0;
    max-width: 740px;
    color: rgba(255,244,220,.92);
    font-size: clamp(1.1rem, 2.3vw, 1.65rem);
    font-weight: 850;
  }

  .tagline::after {
    content: "Transformamos espacios con estilo, calidad y personalidad.";
    display: block;
    margin-top: 12px;
    max-width: 680px;
    color: rgba(255,250,240,.78);
    font-size: clamp(.96rem, 1.7vw, 1.22rem);
    font-weight: 600;
    letter-spacing: 0;
  }

  .shell {
    width: min(1180px, calc(100% - 32px));
    margin: -72px auto 0;
    position: relative;
    z-index: 3;
    display: grid;
    gap: 18px;
  }

  .intro-card,
  .filters-card,
  .state-card {
    background:
      linear-gradient(180deg, rgba(255,250,240,.98), rgba(255,244,220,.93));
    border: 1px solid var(--border);
    border-radius: 34px;
    padding: 22px;
    box-shadow: var(--shadow-premium);
    backdrop-filter: blur(14px);
  }

  .intro-card {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 18px;
    align-items: center;
  }

  .intro-card h2 {
    margin: 0;
    color: var(--green-deep);
    font-size: clamp(1.7rem, 3.2vw, 2.55rem);
    letter-spacing: -.045em;
    line-height: 1;
  }

  .intro-card p {
    margin: 9px 0 0;
    color: var(--muted);
    font-weight: 760;
    max-width: 760px;
    line-height: 1.45;
  }

  .intro-card::after {
    content: "✓ Inventario actualizado   ✓ Atención personalizada   ✓ Productos disponibles";
    grid-column: 1 / -1;
    color: var(--green);
    background: rgba(15, 44, 33, .065);
    border: 1px solid rgba(15, 44, 33, .11);
    border-radius: 999px;
    padding: 10px 14px;
    font-size: .92rem;
    font-weight: 900;
    width: fit-content;
  }

  .refresh-btn,
  .category,
  .whatsapp-btn {
    border: 0;
    cursor: pointer;
    text-decoration: none;
    font-weight: 950;
    border-radius: 999px;
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  }

  .refresh-btn {
    white-space: nowrap;
    min-height: 52px;
    padding: 0 22px;
    color: white;
    background: linear-gradient(135deg, var(--gold), #8f5f22);
    box-shadow: 0 16px 30px rgba(185,135,49,.28);
  }

  .refresh-btn:hover,
  .category:hover,
  .whatsapp-btn:hover {
    transform: translateY(-2px);
  }

  .filters-card {
    display: grid;
    gap: 15px;
    box-shadow: var(--shadow-soft);
  }

  .search-box {
    position: relative;
  }

  .search-box span {
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
  }

  .search-box input {
    width: 100%;
    min-height: 62px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,.86);
    border-radius: 24px;
    padding: 0 20px 0 52px;
    font: inherit;
    font-weight: 850;
    color: var(--green-black);
    outline: none;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.8);
  }

  .search-box input:focus {
    border-color: var(--gold);
    box-shadow:
      0 0 0 4px rgba(185,135,49,.16),
      inset 0 1px 0 rgba(255,255,255,.8);
  }

  .category-row {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 5px;
  }

  .category {
    background: rgba(255,255,255,.82);
    color: var(--green-deep);
    padding: 12px 17px;
    border: 1px solid var(--border);
    white-space: nowrap;
    box-shadow: 0 7px 18px rgba(16,41,31,.055);
  }

  .category.active {
    background: linear-gradient(135deg, var(--green), var(--green-black));
    color: var(--cream);
    border-color: rgba(230,195,122,.42);
    box-shadow: 0 13px 26px rgba(7,20,15,.22);
  }

  .state-card {
    text-align: center;
    padding: 30px;
  }

  .state-card h3 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--green-deep);
  }

  .state-card p {
    margin: 8px 0 0;
    color: var(--muted);
    font-weight: 700;
  }

  .state-card.error {
    border-color: rgba(192, 57, 43, .32);
    background: #fff2ef;
  }

  .results-count {
    color: var(--brown);
    font-weight: 950;
    padding: 0 8px;
    letter-spacing: -.01em;
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }

  .product-card {
    position: relative;
    background:
      linear-gradient(180deg, rgba(255,250,240,.98), rgba(255,244,220,.96));
    border: 1px solid rgba(185,135,49,.28);
    border-radius: 34px;
    overflow: hidden;
    box-shadow: var(--shadow-soft);
    display: flex;
    flex-direction: column;
    min-height: 100%;
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  }

  .product-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 34px 78px rgba(7,20,15,.24);
    border-color: rgba(185,135,49,.74);
  }

  .product-card::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity .2s ease;
    background:
      linear-gradient(135deg, rgba(230,195,122,.2), transparent 28%),
      linear-gradient(315deg, rgba(15,44,33,.09), transparent 28%);
  }

  .product-card:hover::after {
    opacity: 1;
  }

  .image-wrap {
    position: relative;
    background:
      linear-gradient(135deg, rgba(16,41,31,.08), rgba(185,135,49,.13));
    aspect-ratio: 1 / .78;
    overflow: hidden;
  }

  .product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .45s ease, filter .45s ease;
  }

  .product-card:hover .product-image {
    transform: scale(1.055);
    filter: saturate(1.05) contrast(1.02);
  }

  .product-image.placeholder {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(circle at center, rgba(230,195,122,.28), transparent 56%),
      var(--green-deep);
    color: var(--gold-soft);
    font-size: 2.5rem;
    font-weight: 950;
  }

  .stock-pill {
    position: absolute;
    top: 13px;
    left: 13px;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(7,20,15,.9);
    color: var(--cream);
    font-size: .74rem;
    font-weight: 950;
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 22px rgba(0,0,0,.22);
  }

  .product-body {
    position: relative;
    z-index: 1;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 9px;
    flex: 1;
  }

  .product-category {
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: .16em;
    font-weight: 950;
    font-size: .72rem;
  }

  .product-card h3 {
    margin: 0;
    font-size: 1.28rem;
    line-height: 1.16;
    letter-spacing: -.025em;
    color: var(--green-black);
  }

  .code {
    margin: 0;
    color: var(--muted);
    font-weight: 800;
    font-size: .88rem;
  }

  .price-row {
    margin-top: auto;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: end;
    gap: 14px;
    background:
      linear-gradient(135deg, rgba(255,255,255,.82), rgba(255,244,220,.75));
    border: 1px solid rgba(185,135,49,.28);
    border-radius: 22px;
    padding: 13px 14px;
  }

  .price-row span {
    color: var(--muted);
    font-weight: 850;
  }

  .price-row strong {
    font-size: 1.55rem;
    color: var(--brown);
    line-height: 1;
  }

  .whatsapp-btn {
    min-height: 52px;
    background: linear-gradient(135deg, #1f8a56, #0f5132);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 14px;
    box-shadow: 0 14px 28px rgba(31,122,75,.25);
    position: relative;
    z-index: 1;
  }

  .whatsapp-btn:hover {
    box-shadow: 0 18px 36px rgba(31,122,75,.34);
  }

  .footer {
    width: min(1180px, calc(100% - 32px));
    margin: 30px auto;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-weight: 800;
  }

  @media (max-width: 980px) {
    .product-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .hero-content {
      min-height: 340px;
      grid-template-columns: 125px 1fr;
    }

    .brand-mark {
      width: 125px;
      height: 125px;
      min-width: 125px;
      border-radius: 30px;
    }
  }

  @media (max-width: 680px) {
    .hero {
      min-height: 390px;
    }

    .hero-content {
      width: min(100% - 24px, 1180px);
      min-height: 390px;
      grid-template-columns: 1fr;
      align-content: center;
      gap: 16px;
      text-align: left;
      padding: 26px 0 74px;
    }

    .brand-mark {
      width: 100px;
      height: 100px;
      min-width: 100px;
      border-radius: 25px;
    }

    h1 {
      font-size: clamp(2.65rem, 15vw, 4.2rem);
    }

    .tagline {
      font-size: 1.08rem;
    }

    .tagline::after {
      font-size: .95rem;
    }

    .shell {
      width: min(100% - 22px, 1180px);
      margin-top: -58px;
    }

    .intro-card {
      grid-template-columns: 1fr;
      padding: 18px;
      border-radius: 28px;
    }

    .intro-card::after {
      width: 100%;
      border-radius: 20px;
      line-height: 1.4;
    }

    .refresh-btn {
      width: 100%;
    }

    .filters-card {
      border-radius: 28px;
      padding: 16px;
    }

    .product-grid {
      grid-template-columns: 1fr;
      gap: 18px;
    }

    .product-card {
      border-radius: 30px;
    }

    .footer {
      width: min(100% - 22px, 1180px);
      flex-direction: column;
      text-align: center;
    }
  }
`;
