import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cambia este número por el WhatsApp oficial de Ventas Donatello.
// Formato recomendado: país + lada + número, sin espacios. Ejemplo México: 528991234567
const WHATSAPP_NUMBER = "528999999999";

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
            <p className="eyebrow">Catálogo oficial</p>
            <h1>Ventas Donatello</h1>
            <p className="tagline">
              Diseño, orden y estilo para cada espacio.
            </p>
          </div>
        </div>
      </header>

      <main className="shell">
        <section className="intro-card">
          <div>
            <h2>Productos disponibles</h2>
            <p>
              Explora nuestro catálogo. Si algo te interesa, contáctanos por WhatsApp
              y con gusto te damos más información.
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
                      💬 Me interesa por WhatsApp
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
    --green-dark: #10291f;
    --green: #183d2e;
    --gold: #c99a45;
    --gold-light: #e7c676;
    --cream: #fbf3df;
    --cream-2: #fffaf0;
    --brown: #422b14;
    --muted: #74644c;
    --card: rgba(255, 250, 240, 0.96);
    --border: rgba(201, 154, 69, 0.35);
    --shadow: 0 18px 45px rgba(16, 41, 31, 0.12);
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background:
      radial-gradient(circle at top left, rgba(231,198,118,.35), transparent 32%),
      linear-gradient(180deg, #fff8e9 0%, #fbf3df 100%);
    color: var(--green-dark);
  }

  .app {
    min-height: 100vh;
  }

  .hero {
    position: relative;
    min-height: 240px;
    background:
      linear-gradient(135deg, rgba(16,41,31,.98), rgba(24,61,46,.92)),
      radial-gradient(circle at 80% 10%, rgba(231,198,118,.45), transparent 32%);
    overflow: hidden;
    border-bottom: 1px solid rgba(201,154,69,.55);
  }

  .hero::after {
    content: "";
    position: absolute;
    inset: auto -10% -45% auto;
    width: 420px;
    height: 420px;
    background: radial-gradient(circle, rgba(231,198,118,.22), transparent 68%);
    border-radius: 50%;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(45deg, rgba(255,255,255,.03) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(255,255,255,.03) 25%, transparent 25%);
    background-size: 28px 28px;
    opacity: .45;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    width: min(1120px, calc(100% - 28px));
    margin: 0 auto;
    min-height: 240px;
    display: flex;
    align-items: center;
    gap: 22px;
    color: var(--cream);
  }

  .brand-mark {
    width: 122px;
    height: 122px;
    min-width: 122px;
    border-radius: 28px;
    background:
      linear-gradient(135deg, rgba(255,255,255,.16), rgba(255,255,255,.04));
    border: 1px solid rgba(231,198,118,.55);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 22px 45px rgba(0,0,0,.18);
  }

  .brand-mark img {
    width: 145%;
    height: 145%;
    object-fit: contain;
  }

  .eyebrow {
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: .18em;
    color: var(--gold-light);
    font-weight: 900;
    font-size: .78rem;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.4rem, 7vw, 5rem);
    line-height: .92;
    letter-spacing: -.06em;
    font-weight: 950;
  }

  .tagline {
    margin: 14px 0 0;
    max-width: 620px;
    color: rgba(251,243,223,.88);
    font-size: clamp(1rem, 2.2vw, 1.35rem);
    font-weight: 650;
  }

  .shell {
    width: min(1120px, calc(100% - 28px));
    margin: -42px auto 0;
    position: relative;
    z-index: 2;
    display: grid;
    gap: 16px;
  }

  .intro-card,
  .filters-card,
  .state-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 28px;
    padding: 18px;
    box-shadow: var(--shadow);
    backdrop-filter: blur(12px);
  }

  .intro-card {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
  }

  .intro-card h2 {
    margin: 0;
    font-size: clamp(1.4rem, 3vw, 2rem);
    letter-spacing: -.03em;
  }

  .intro-card p {
    margin: 5px 0 0;
    color: var(--muted);
    font-weight: 650;
    max-width: 720px;
  }

  .refresh-btn,
  .category,
  .whatsapp-btn {
    border: 0;
    cursor: pointer;
    text-decoration: none;
    font-weight: 900;
    border-radius: 999px;
    transition: transform .18s ease, box-shadow .18s ease;
  }

  .refresh-btn {
    white-space: nowrap;
    min-height: 46px;
    padding: 0 18px;
    color: white;
    background: linear-gradient(135deg, var(--gold), #a86f24);
    box-shadow: 0 12px 24px rgba(201,154,69,.28);
  }

  .refresh-btn:hover,
  .category:hover,
  .whatsapp-btn:hover {
    transform: translateY(-1px);
  }

  .filters-card {
    display: grid;
    gap: 12px;
  }

  .search-box {
    position: relative;
  }

  .search-box span {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
  }

  .search-box input {
    width: 100%;
    min-height: 58px;
    border: 1px solid var(--border);
    background: white;
    border-radius: 20px;
    padding: 0 18px 0 48px;
    font: inherit;
    font-weight: 750;
    color: var(--green-dark);
    outline: none;
  }

  .search-box input:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 4px rgba(201,154,69,.16);
  }

  .category-row {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 3px;
  }

  .category {
    background: white;
    color: var(--green-dark);
    padding: 11px 15px;
    border: 1px solid var(--border);
    white-space: nowrap;
  }

  .category.active {
    background: linear-gradient(135deg, var(--green), var(--green-dark));
    color: var(--cream);
    border-color: transparent;
  }

  .state-card {
    text-align: center;
    padding: 26px;
  }

  .state-card h3 {
    margin: 0;
    font-size: 1.4rem;
  }

  .state-card p {
    margin: 6px 0 0;
    color: var(--muted);
    font-weight: 650;
  }

  .state-card.error {
    border-color: rgba(192, 57, 43, .32);
    background: #fff2ef;
  }

  .results-count {
    color: var(--muted);
    font-weight: 850;
    padding: 0 6px;
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .product-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 28px;
    overflow: hidden;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .image-wrap {
    position: relative;
    background:
      linear-gradient(135deg, rgba(16,41,31,.08), rgba(201,154,69,.12));
    aspect-ratio: 1 / .78;
    overflow: hidden;
  }

  .product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .product-image.placeholder {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(circle at center, rgba(231,198,118,.28), transparent 56%),
      var(--green-dark);
    color: var(--gold-light);
    font-size: 2.5rem;
    font-weight: 950;
  }

  .stock-pill {
    position: absolute;
    top: 12px;
    left: 12px;
    padding: 7px 11px;
    border-radius: 999px;
    background: rgba(16,41,31,.88);
    color: var(--cream);
    font-size: .75rem;
    font-weight: 900;
    backdrop-filter: blur(10px);
  }

  .product-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 9px;
    flex: 1;
  }

  .product-category {
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: .13em;
    font-weight: 950;
    font-size: .72rem;
  }

  .product-card h3 {
    margin: 0;
    font-size: 1.2rem;
    line-height: 1.15;
    letter-spacing: -.02em;
    color: var(--green-dark);
  }

  .code {
    margin: 0;
    color: var(--muted);
    font-weight: 750;
    font-size: .9rem;
  }

  .price-row {
    margin-top: auto;
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 14px;
    background: rgba(255,255,255,.66);
    border: 1px solid rgba(201,154,69,.2);
    border-radius: 18px;
    padding: 10px 12px;
  }

  .price-row span {
    color: var(--muted);
    font-weight: 800;
  }

  .price-row strong {
    font-size: 1.3rem;
    color: var(--brown);
  }

  .whatsapp-btn {
    min-height: 48px;
    background: linear-gradient(135deg, #1f7a4b, #0f5132);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 13px;
    box-shadow: 0 12px 24px rgba(31,122,75,.22);
  }

  .footer {
    width: min(1120px, calc(100% - 28px));
    margin: 26px auto;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-weight: 750;
  }

  @media (max-width: 940px) {
    .product-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .hero-content {
      min-height: 220px;
    }
  }

  @media (max-width: 640px) {
    .hero {
      min-height: 245px;
    }

    .hero-content {
      align-items: flex-start;
      padding-top: 28px;
      min-height: 245px;
      gap: 14px;
    }

    .brand-mark {
      width: 82px;
      height: 82px;
      min-width: 82px;
      border-radius: 22px;
    }

    .shell {
      margin-top: -34px;
    }

    .intro-card {
      flex-direction: column;
      align-items: stretch;
    }

    .refresh-btn {
      width: 100%;
    }

    .product-grid {
      grid-template-columns: 1fr;
    }

    .footer {
      flex-direction: column;
      text-align: center;
    }
  }
`;

