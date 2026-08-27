import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { track } from "@vercel/analytics";

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
  const message = `Hola, me interesa este producto de Ventas Donatello:\n\nProducto: ${product.name}\nCódigo: ${product.code}\nPrecio: ${money(product.price)}\n\n¿Me puedes dar más información?`;

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


function getProductImages(product) {
  return [
    product?.image_url,
    product?.image_url_2,
    product?.image_url_3,
    product?.image_url_4,
  ].filter((image) => Boolean(String(image || "").trim()));
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    function handlePopState(event) {
      if (selectedProduct) {
        setSelectedProduct(null);
        setSelectedImageIndex(0);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedProduct]);

  async function loadProducts() {
    setLoading(true);
    setLoadError("");

    const { data, error } = await supabase
      .from("products")
      .select("id, code, name, category, price, stock, image_url, image_url_2, image_url_3, image_url_4")
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

  function openProduct(product, imageIndex = 0) {
    window.history.pushState(
      { donatelloProductModal: true },
      "",
      window.location.href
    );
    setSelectedProduct(product);
    setSelectedImageIndex(imageIndex);
  }

  function closeProduct() {
    if (window.history.state?.donatelloProductModal) {
      window.history.back();
      return;
    }

    setSelectedProduct(null);
    setSelectedImageIndex(0);
  }

  function moveSelectedImage(direction) {
    if (!selectedProduct) return;

    const images = getProductImages(selectedProduct);
    if (images.length <= 1) return;

    setSelectedImageIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;

      if (nextIndex < 0) return images.length - 1;
      if (nextIndex >= images.length) return 0;

      return nextIndex;
    });
  }

  const selectedImages = selectedProduct ? getProductImages(selectedProduct) : [];
  const selectedImage =
    selectedImages[selectedImageIndex] || selectedProduct?.image_url || "";

  return (
    <div className="app">
      <style>{styles}</style>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand">
            <img src="/logo-donatello.png" alt="Ventas Donatello" />
            <div>
              <strong>Ventas Donatello</strong>
              <span>Hogar • Muebles • Iluminación • Decoración</span>
            </div>
          </div>


          <a
  className="topbar-whatsapp"
  href={`https://wa.me/${WHATSAPP_NUMBER}`}
  target="_blank"
  rel="noreferrer"
  onClick={() => {
    track("whatsapp_click", {
      location: "header",
    });
  }}
>
  WhatsApp
</a>
        </div>
      </header>

      <section className="premium-banner">
        <img
          className="desktop-banner"
          src="/banner-donatello-premium.png"
          alt="Ventas Donatello Premium - catálogo de muebles, decoración, iluminación, bazar y juguetes"
        />
        <img
          className="mobile-banner"
          src="/banner-mobile.png"
          alt="Ventas Donatello Premium móvil"
        />
      </section>

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
              {filteredProducts.map((product) => {
                const productImages = getProductImages(product);
                const extraImagesCount = Math.max(productImages.length - 1, 0);

                return (
                <article className="product-card" key={product.id}>
                  <button
                    className="image-wrap image-action"
                    type="button"
                    onClick={() => openProduct(product, 0)}
                    aria-label={`Ver galería de ${product.name}`}
                  >
                    <ProductImage src={productImages[0] || product.image_url} alt={product.name} />
                    <span className="stock-pill">Disponible</span>
                    <span className="view-pill">
                      {productImages.length > 1 ? `${productImages.length} fotos` : "Ver detalle"}
                    </span>
                    {extraImagesCount > 0 && (
                      <span className="gallery-pill">+{extraImagesCount} fotos</span>
                    )}
                  </button>

                  <div className="product-body">
                    <div className="card-meta">
                      <span className="product-category">
                        {normalizeCategory(product.category)}
                      </span>
                      <span className="premium-badge">Selección Donatello</span>
                    </div>

                    <h3>{product.name}</h3>

                    <div className="price-row">
                      <span>Precio final</span>
                      <strong>{money(product.price)}</strong>
                    </div>


                    <a
  className="whatsapp-btn"
  href={buildWhatsAppLink(product)}
  target="_blank"
  rel="noreferrer"
  onClick={() => {
    track("whatsapp_click", {
      location: "product",
      product_name: product.name,
      product_code: product.code,
      category: product.category,
    });
  }}
>
  💬 Cotizar por WhatsApp
</a>
                  </div>
                </article>
                );
              })}
            </section>
          </>
        )}
      </main>

      {selectedProduct && (
        <div
          className="product-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle de ${selectedProduct.name}`}
          onClick={closeProduct}
        >
          <div className="product-modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="modal-close"
              type="button"
              onClick={closeProduct}
              aria-label="Cerrar detalle"
            >
              ×
            </button>

            <div className="modal-gallery">
              <div className="modal-image-wrap">
                <ProductImage src={selectedImage} alt={selectedProduct.name} />

                {selectedImages.length > 1 && (
                  <>
                    <button
                      className="gallery-nav gallery-nav-left"
                      type="button"
                      onClick={() => moveSelectedImage(-1)}
                      aria-label="Imagen anterior"
                    >
                      ‹
                    </button>

                    <button
                      className="gallery-nav gallery-nav-right"
                      type="button"
                      onClick={() => moveSelectedImage(1)}
                      aria-label="Imagen siguiente"
                    >
                      ›
                    </button>

                    <span className="gallery-counter">
                      {selectedImageIndex + 1} / {selectedImages.length}
                    </span>
                  </>
                )}
              </div>

              {selectedImages.length > 1 && (
                <div className="modal-thumbnails">
                  {selectedImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      className={
                        selectedImageIndex === index
                          ? "modal-thumb active"
                          : "modal-thumb"
                      }
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      aria-label={`Ver imagen ${index + 1}`}
                    >
                      <img src={image} alt={`${selectedProduct.name} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-info">
              <span className="modal-category">
                {normalizeCategory(selectedProduct.category)}
              </span>
              <h2>{selectedProduct.name}</h2>
              <p className="modal-ref">Referencia: {selectedProduct.code}</p>

              <div className="modal-price">
                <span>Precio final</span>
                <strong>{money(selectedProduct.price)}</strong>
              </div>

              <a
                className="modal-whatsapp"
                href={buildWhatsAppLink(selectedProduct)}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  track("whatsapp_click", {
                    location: "product_modal",
                    product_name: selectedProduct.name,
                    product_code: selectedProduct.code,
                    category: selectedProduct.category,
                  });
                }}
              >
                💬 Cotizar este producto
              </a>

              <p className="modal-note">
                Catálogo sujeto a disponibilidad. Te atendemos por WhatsApp para confirmar detalles.
              </p>
            </div>
          </div>
        </div>
      )}

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

  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    background: linear-gradient(90deg, rgba(7,20,15,.97), rgba(15,44,33,.95));
    border-bottom: 1px solid rgba(230,195,122,.28);
    backdrop-filter: blur(14px);
  }

  .topbar-inner {
    max-width: 1240px;
    margin: 0 auto;
    padding: 14px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }

  .topbar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .topbar-brand img {
    width: 52px;
    height: 52px;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,.22);
  }

  .topbar-brand strong {
    display: block;
    color: #fff7e6;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1.08rem;
    letter-spacing: .04em;
  }

  .topbar-brand span {
    display: block;
    margin-top: 3px;
    color: var(--gold-soft);
    font-size: .77rem;
    letter-spacing: .045em;
  }

  .topbar-whatsapp {
    text-decoration: none;
    background: linear-gradient(180deg, #efe1bd, #d4ae5c);
    color: var(--green-black);
    font-weight: 900;
    padding: 11px 16px;
    border-radius: 999px;
    border: 1px solid #f9e5ad;
    box-shadow: 0 8px 24px rgba(0,0,0,.18);
  }

  .premium-banner {
    max-width: 1240px;
    margin: 12px auto 0;
    padding: 0 22px;
  }

  .premium-banner img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 22px;
    border: 1px solid rgba(230,195,122,.34);
    box-shadow: var(--shadow-premium);
  }

  .mobile-banner {
    display: none !important;
  }

  .shell {
    max-width: 1240px;
    margin: 0 auto;
    padding: 26px 22px 48px;
  }

  .intro-card,
  .filters-card,
  .state-card {
    background: var(--card);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-soft);
  }

  .intro-card {
    margin-top: 24px;
    border-radius: 22px;
    padding: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    position: relative;
    overflow: hidden;
  }

  .intro-card::after {
    content: "";
    position: absolute;
    width: 200px;
    height: 200px;
    right: -80px;
    top: -100px;
    border-radius: 50%;
    background: rgba(185,135,49,.12);
  }

  .intro-card h2 {
    margin: 0 0 8px;
    font-family: Georgia, "Times New Roman", serif;
    color: var(--green-deep);
    font-size: clamp(1.5rem, 3vw, 2.15rem);
  }

  .intro-card p {
    margin: 0;
    color: var(--muted);
    max-width: 740px;
    line-height: 1.65;
  }

  .refresh-btn {
    position: relative;
    z-index: 1;
    border: 1px solid var(--green-deep);
    background: var(--green-deep);
    color: white;
    padding: 12px 18px;
    border-radius: 12px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 8px 22px rgba(15,44,33,.18);
  }

  .filters-card {
    margin-top: 18px;
    border-radius: 20px;
    padding: 18px;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fffdf7;
    border: 1px solid rgba(185,135,49,.3);
    border-radius: 14px;
    padding: 0 14px;
  }

  .search-box input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    padding: 14px 0;
    color: var(--green-black);
    font-size: .96rem;
  }

  .category-row {
    margin-top: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
  }

  .category {
    border: 1px solid rgba(185,135,49,.42);
    background: rgba(255,255,255,.65);
    color: var(--green-deep);
    border-radius: 999px;
    padding: 8px 12px;
    font-weight: 800;
    cursor: pointer;
  }

  .category.active {
    background: var(--green-deep);
    color: white;
    border-color: var(--green-deep);
  }

  .results-count {
    margin: 22px 2px 12px;
    color: var(--green-deep);
    font-weight: 900;
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }

  .product-card {
    background: rgba(255,250,240,.94);
    border: 1px solid rgba(185,135,49,.34);
    border-radius: 22px;
    overflow: hidden;
    box-shadow: var(--shadow-soft);
    transition: transform .22s ease, box-shadow .22s ease;
    position: relative;
  }

  .product-card::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
    z-index: 2;
  }

  .product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 24px 54px rgba(7,20,15,.18);
  }

  .image-wrap {
    width: 100%;
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background: linear-gradient(180deg, #f9efd8, #eee0c1);
  }

  .image-action {
    display: block;
    border: 0;
    padding: 0;
    cursor: pointer;
    text-align: left;
    appearance: none;
  }

  .product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .product-image.placeholder {
    display: grid;
    place-items: center;
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 900;
    font-size: 2.2rem;
    color: var(--green-deep);
    background:
      radial-gradient(circle at center, rgba(230,195,122,.36), transparent 36%),
      linear-gradient(135deg, #fff7e6, #efe0bd);
  }

  .stock-pill,
  .view-pill,
  .gallery-pill {
    position: absolute;
    z-index: 2;
    border-radius: 999px;
    font-size: .74rem;
    font-weight: 900;
    backdrop-filter: blur(10px);
  }

  .stock-pill {
    top: 12px;
    left: 12px;
    padding: 7px 10px;
    color: #f7f0dd;
    background: rgba(15,44,33,.9);
    border: 1px solid rgba(230,195,122,.34);
  }

  .view-pill {
    right: 12px;
    bottom: 12px;
    padding: 7px 10px;
    color: var(--green-black);
    background: rgba(255,248,230,.92);
    border: 1px solid rgba(185,135,49,.46);
  }

  .gallery-pill {
    right: 12px;
    top: 12px;
    padding: 7px 10px;
    color: #fff7e6;
    background: rgba(7,20,15,.82);
    border: 1px solid rgba(230,195,122,.35);
  }

  .product-body {
    padding: 18px;
  }

  .card-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .product-category {
    color: var(--gold);
    font-weight: 900;
    font-size: .78rem;
    letter-spacing: .07em;
    text-transform: uppercase;
  }

  .premium-badge {
    font-size: .69rem;
    color: var(--green-deep);
    background: rgba(230,195,122,.24);
    border: 1px solid rgba(185,135,49,.28);
    border-radius: 999px;
    padding: 5px 8px;
    font-weight: 900;
  }

  .product-body h3 {
    margin: 0;
    min-height: 56px;
    color: var(--green-black);
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1.16rem;
    line-height: 1.35;
  }

  .price-row {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px dashed rgba(185,135,49,.42);
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 14px;
  }

  .price-row span {
    color: var(--muted);
    font-size: .82rem;
  }

  .price-row strong {
    color: var(--green-deep);
    font-size: 1.3rem;
    font-family: Georgia, "Times New Roman", serif;
  }

  .whatsapp-btn {
    margin-top: 14px;
    display: block;
    text-align: center;
    text-decoration: none;
    background: linear-gradient(180deg, #1b8d56, #0f6e42);
    color: white;
    border-radius: 12px;
    padding: 12px;
    font-weight: 900;
    box-shadow: 0 10px 24px rgba(15,110,66,.18);
  }

  .state-card {
    margin-top: 20px;
    border-radius: 18px;
    padding: 28px;
    text-align: center;
  }

  .state-card h3 {
    margin-top: 0;
    color: var(--green-deep);
    font-family: Georgia, "Times New Roman", serif;
  }

  .state-card p {
    color: var(--muted);
  }

  .state-card.error {
    border-color: rgba(145, 52, 52, .3);
  }

  .footer {
    border-top: 1px solid rgba(185,135,49,.25);
    background: linear-gradient(180deg, rgba(7,20,15,.94), rgba(7,20,15,1));
    color: #fff6e3;
    padding: 24px;
    text-align: center;
  }

  .footer strong,
  .footer span {
    display: block;
  }

  .footer strong {
    font-family: Georgia, "Times New Roman", serif;
    letter-spacing: .05em;
  }

  .footer span {
    margin-top: 5px;
    color: var(--gold-soft);
    font-size: .82rem;
  }

  .product-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(4, 13, 10, .78);
    backdrop-filter: blur(10px);
    padding: 22px;
    display: grid;
    place-items: center;
  }

  .product-modal {
    width: min(1180px, 100%);
    max-height: calc(100vh - 44px);
    overflow: auto;
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(300px, .8fr);
    background: linear-gradient(180deg, #fffaf0, #f7ead0);
    border: 1px solid rgba(230,195,122,.55);
    border-radius: 26px;
    box-shadow: 0 35px 90px rgba(0,0,0,.38);
    position: relative;
  }

  .modal-close {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 10;
    width: 42px;
    height: 42px;
    border-radius: 999px;
    border: 1px solid rgba(230,195,122,.55);
    background: rgba(7,20,15,.9);
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    box-shadow: 0 8px 22px rgba(0,0,0,.2);
  }

  .modal-gallery {
    min-width: 0;
    padding: 18px;
    background: rgba(7,20,15,.06);
  }

  .modal-image-wrap {
    position: relative;
    min-height: 520px;
    border-radius: 20px;
    overflow: hidden;
    background: #efe5cc;
    display: grid;
    place-items: center;
  }

  .modal-image-wrap .product-image {
    width: 100%;
    height: 100%;
    max-height: 690px;
    object-fit: contain;
    background: #f4ead4;
  }

  .gallery-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 3;
    width: 46px;
    height: 46px;
    border-radius: 999px;
    border: 1px solid rgba(230,195,122,.55);
    background: rgba(7,20,15,.86);
    color: white;
    font-size: 2rem;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(0,0,0,.22);
  }

  .gallery-nav-left {
    left: 14px;
  }

  .gallery-nav-right {
    right: 14px;
  }

  .gallery-counter {
    position: absolute;
    right: 14px;
    bottom: 14px;
    z-index: 3;
    background: rgba(7,20,15,.88);
    color: white;
    border: 1px solid rgba(230,195,122,.45);
    padding: 7px 10px;
    border-radius: 999px;
    font-size: .78rem;
    font-weight: 900;
  }

  .modal-thumbnails {
    margin-top: 12px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .modal-thumb {
    padding: 0;
    border: 2px solid transparent;
    background: transparent;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    aspect-ratio: 1 / 1;
  }

  .modal-thumb.active {
    border-color: var(--gold);
    box-shadow: 0 0 0 2px rgba(185,135,49,.18);
  }

  .modal-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    background: #f3e8cf;
  }

  .modal-info {
    padding: 48px 34px 34px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .modal-category {
    color: var(--gold);
    font-size: .78rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: .09em;
  }

  .modal-info h2 {
    margin: 10px 0 6px;
    color: var(--green-black);
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(1.8rem, 4vw, 3rem);
    line-height: 1.08;
  }

  .modal-ref {
    color: var(--muted);
    margin: 0 0 22px;
  }

  .modal-price {
    border: 1px solid rgba(185,135,49,.32);
    background: rgba(255,255,255,.62);
    border-radius: 18px;
    padding: 18px;
  }

  .modal-price span,
  .modal-price strong {
    display: block;
  }

  .modal-price span {
    color: var(--muted);
    font-size: .84rem;
  }

  .modal-price strong {
    margin-top: 5px;
    color: var(--green-deep);
    font-family: Georgia, "Times New Roman", serif;
    font-size: 2rem;
  }

  .modal-whatsapp {
    margin-top: 18px;
    display: block;
    text-align: center;
    text-decoration: none;
    background: linear-gradient(180deg, #1b8d56, #0f6e42);
    color: white;
    border-radius: 14px;
    padding: 14px;
    font-weight: 900;
    box-shadow: 0 12px 26px rgba(15,110,66,.2);
  }

  .modal-note {
    margin: 14px 0 0;
    color: var(--muted);
    font-size: .86rem;
    line-height: 1.55;
  }

  @media (max-width: 980px) {
    .product-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .topbar-inner {
      align-items: flex-start;
      padding: 12px 14px;
    }

    .topbar-brand img {
      width: 42px;
      height: 42px;
    }

    .topbar-brand span {
      display: none;
    }

    .topbar-whatsapp {
      padding: 9px 12px;
      font-size: .84rem;
    }

    .premium-banner {
      margin-top: 10px;
      padding: 0 14px;
    }

    .desktop-banner {
      display: none !important;
    }

    .mobile-banner {
      display: block !important;
    }

    .premium-banner img {
      border-radius: 16px;
    }

    .shell {
      padding: 18px 14px 34px;
    }

    .intro-card {
      margin-top: 16px;
      padding: 18px;
      display: block;
      border-radius: 18px;
    }

    .intro-card h2 {
      font-size: 1.55rem;
    }

    .intro-card p {
      font-size: .9rem;
      line-height: 1.55;
    }

    .refresh-btn {
      width: 100%;
      margin-top: 15px;
    }

    .filters-card {
      padding: 14px;
      border-radius: 18px;
    }

    .search-box input {
      font-size: .9rem;
    }

    .category-row {
      flex-wrap: nowrap;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: none;
    }

    .category-row::-webkit-scrollbar {
      display: none;
    }

    .category {
      flex: 0 0 auto;
      white-space: nowrap;
      padding: 8px 11px;
      font-size: .82rem;
    }

    .product-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .product-card {
      border-radius: 18px;
    }

    .image-wrap {
      aspect-ratio: 1 / 1;
    }

    .product-body {
      padding: 16px;
    }

    .product-body h3 {
      min-height: 0;
      font-size: 1.08rem;
    }

    .premium-badge {
      display: none;
    }

    .price-row strong {
      font-size: 1.18rem;
    }

    .product-modal-backdrop {
      padding: 0;
      align-items: stretch;
    }

    .product-modal {
      width: 100%;
      max-height: 100vh;
      min-height: 100vh;
      border-radius: 0;
      border: 0;
      grid-template-columns: 1fr;
    }

    .modal-gallery {
      padding: 0;
    }

    .modal-image-wrap {
      min-height: 58vh;
      border-radius: 0;
    }

    .modal-image-wrap .product-image {
      max-height: 65vh;
    }

    .modal-thumbnails {
      padding: 10px 12px 0;
      margin-top: 0;
      gap: 8px;
    }

    .modal-info {
      padding: 28px 18px 24px;
      justify-content: flex-start;
    }

    .modal-info h2 {
      font-size: 2rem;
    }

    .modal-close {
      position: fixed;
      top: 10px;
      right: 10px;
    }

    .gallery-nav {
      width: 42px;
      height: 42px;
    }

    .gallery-nav-left {
      left: 10px;
    }

    .gallery-nav-right {
      right: 10px;
    }
  }

  @media (max-width: 420px) {
    .topbar-brand strong {
      font-size: .96rem;
    }

    .product-category {
      font-size: .72rem;
    }

    .stock-pill,
    .view-pill,
    .gallery-pill {
      font-size: .68rem;
    }

    .modal-thumbnails {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
`;
