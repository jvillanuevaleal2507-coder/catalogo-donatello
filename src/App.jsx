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

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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

const AMBIENT_BLUEPRINTS = [
  {
    key: "vanity-claro",
    title: "Vanity claro",
    subtitle: "Un rincón ligero y práctico",
    description: "Blanco, dorado y luz cálida para un espacio de arreglo sencillo pero bien armado.",
    visualScene: true,
    sceneImage: "https://lotgmhfqzthhhadavwlu.supabase.co/storage/v1/object/public/product-images/ambientes/vanity-claro-final-v2.png",
    productCodes: ["DON-000155", "DON-000010", "DON-000057"],
    visualQuantities: {
      "DON-000155": 1,
      "DON-000010": 1,
      "DON-000057": 1,
    },
    complementCodes: ["DON-000154", "DON-000114"],
  },
  {
    key: "comedor-calido",
    title: "Comedor cálido",
    subtitle: "Camel, madera y fibras naturales",
    description: "Una combinación cálida para que las sillas sean protagonistas sin cargar demasiado el espacio.",
    visualScene: true,
    sceneImage: "https://lotgmhfqzthhhadavwlu.supabase.co/storage/v1/object/public/product-images/ambientes/comedor-calido-stock-v2.png",
    productCodes: ["DON-000150", "DON-000145", "DON-000111", "DON-000051"],
    visualQuantities: {
      "DON-000150": 2,
      "DON-000145": 1,
      "DON-000111": 1,
      "DON-000051": 1,
    },
    complementCodes: ["DON-000070", "DON-000113"],
  },
  {
    key: "rincon-lectura",
    title: "Rincón de lectura",
    subtitle: "Cómodo, verde y relajado",
    description: "Un espacio para leer, descansar o ver una serie con piezas que se sienten más de casa que de catálogo.",
    visualScene: true,
    sceneImage: "https://lotgmhfqzthhhadavwlu.supabase.co/storage/v1/object/public/product-images/ambientes/rincon-lectura-final-v2.png",
    productCodes: ["DON-000153", "DON-000148", "DON-000042", "DON-000135"],
    visualQuantities: {
      "DON-000153": 1,
      "DON-000148": 1,
      "DON-000042": 1,
      "DON-000135": 1,
    },
    complementCodes: ["DON-000049", "DON-000112"],
  },
  {
    key: "oficina-calida",
    title: "Oficina cálida",
    subtitle: "Madera, gris y un espacio de trabajo con estilo",
    description: "Una oficina de casa sobria y acogedora, con la silla como protagonista y accesorios que aportan orden y calidez.",
    visualScene: true,
    sceneImage: "https://lotgmhfqzthhhadavwlu.supabase.co/storage/v1/object/public/product-images/ambientes/oficina-calida-final.png",
    productCodes: ["DON-000157", "DON-000142", "DON-000045", "DON-000122"],
    visualQuantities: {
      "DON-000157": 1,
      "DON-000142": 1,
      "DON-000045": 1,
      "DON-000122": 1,
    },
    complementCodes: ["DON-000049", "DON-000067"],
  },
  {
    key: "recamara-boho",
    title: "Recámara boho",
    subtitle: "Texturas naturales y luz suave",
    description: "Una base sencilla para visualizar burós, iluminación y accesorios dentro de una recámara completa.",
    visualScene: true,
    sceneImage: "https://lotgmhfqzthhhadavwlu.supabase.co/storage/v1/object/public/product-images/ambientes/recamara-boho-final.png",
    productCodes: ["DON-000107", "DON-000120", "DON-000060", "DON-000025"],
    visualQuantities: {
      "DON-000107": 1,
      "DON-000120": 2,
      "DON-000060": 2,
      "DON-000025": 1,
    },
    complementCodes: ["DON-000006", "DON-000067"],
  },
  {
    key: "entrada-recibidor",
    title: "Entrada con personalidad",
    subtitle: "La primera impresión también cuenta",
    description: "Recibidor, espejo, luz y un corredor para armar una entrada útil sin llenarla de muebles.",
    visualScene: true,
    sceneImage: "https://lotgmhfqzthhhadavwlu.supabase.co/storage/v1/object/public/product-images/ambientes/entrada-personalidad-final.png",
    productCodes: ["DON-000054", "DON-000049", "DON-000067", "DON-000137"],
    visualQuantities: {
      "DON-000054": 1,
      "DON-000049": 1,
      "DON-000067": 1,
      "DON-000137": 1,
    },
    complementCodes: ["DON-000052", "DON-000033"],
  },
];

function pickProductsByCodes(products, codes) {
  const byCode = new Map(products.map((product) => [product.code, product]));
  return codes.map((code) => byCode.get(code)).filter(Boolean);
}

function inferPiecesPerStockUnit(product) {
  const name = String(product?.name || "").trim();

  const setMatch = name.match(/\bset\s+de\s+(\d+)/i);
  if (setMatch) return Number(setMatch[1]);

  const pairMatch = name.match(/^par\s+de\b/i);
  if (pairMatch) return 2;

  const leadingNumberMatch = name.match(/^(\d+)\s+/);
  if (leadingNumberMatch) return Number(leadingNumberMatch[1]);

  return 1;
}

function buildAmbientWhatsAppLink(scene) {
  const available = scene.products.filter((product) => Number(product.stock || 0) > 0);
  const unavailable = scene.products.filter((product) => Number(product.stock || 0) <= 0);
  const lines = available.map(
    (product) => `• ${product.name} — ${money(product.price)}`
  );
  const unavailableLines = unavailable.map(
    (product) => `• ${product.name} — agotado`
  );
  const total = available.reduce(
    (sum, product) => sum + Number(product.price || 0),
    0
  );

  const message = [
    `Hola, me gustó la idea \"${scene.title}\" de Ambientes Donatello.`,
    "",
    "Me interesan estas piezas disponibles:",
    ...lines,
    ...(unavailableLines.length
      ? ["", "En la idea también aparece:", ...unavailableLines]
      : []),
    "",
    `Total disponible de referencia: ${money(total)}`,
    "",
    "¿Me ayudas a confirmar disponibilidad y, si algo se agotó, una alternativa que combine?",
  ].join("\n");

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedAmbient, setSelectedAmbient] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
      .order("id", { ascending: false });

    if (error) {
      setLoadError(error.message);
      setProducts([]);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  const availableProducts = useMemo(
    () => products.filter((product) => Number(product.stock || 0) > 0),
    [products]
  );

  const categories = useMemo(() => {
    const unique = new Set(
      availableProducts.map((product) => normalizeCategory(product.category))
    );

    return ["Todas", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [availableProducts]);

  const filteredProducts = useMemo(() => {
    const query = normalizeSearchText(searchTerm);

    return availableProducts.filter((product) => {
      const normalizedCategory = normalizeCategory(product.category);

      const matchesCategory =
        categoryFilter === "Todas" || normalizedCategory === categoryFilter;

      const searchText = normalizeSearchText(
        `${product.name || ""} ${product.code || ""} ${normalizedCategory}`
      );
      const matchesSearch = searchText.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [availableProducts, searchTerm, categoryFilter]);

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

  const ambientScenes = useMemo(() => {
    return AMBIENT_BLUEPRINTS.map((blueprint) => {
      const sceneProducts = pickProductsByCodes(products, blueprint.productCodes);
      const quantityWarnings = sceneProducts.flatMap((product) => {
        const visualQuantity = Number(blueprint.visualQuantities?.[product.code] || 1);
        const piecesPerStockUnit = inferPiecesPerStockUnit(product);
        const availableVisualPieces =
          Math.max(0, Number(product.stock || 0)) * piecesPerStockUnit;

        if (visualQuantity <= availableVisualPieces) return [];

        return [{
          code: product.code,
          name: product.name,
          visualQuantity,
          availableVisualPieces,
        }];
      });

      return {
        ...blueprint,
        products: sceneProducts,
        complements: pickProductsByCodes(products, blueprint.complementCodes).filter(
          (product) => Number(product.stock || 0) > 0
        ),
        quantityWarnings,
        quantityValid: quantityWarnings.length === 0,
      };
    }).filter((scene) => scene.products.length >= 2);
  }, [products]);
  const selectedImages = selectedProduct ? getProductImages(selectedProduct) : [];
  const selectedImage =
    selectedImages[selectedImageIndex] || selectedProduct?.image_url || "";

  return (
    <div className="app">
      <style>{styles}</style>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="topbar-brand" href="#inicio" onClick={() => setMenuOpen(false)}>
            <img src="/logo-donatello.png" alt="Ventas Donatello" />
            <div>
              <strong>Ventas Donatello</strong>
              <span>Muebles • Iluminación • Decoración</span>
            </div>
          </a>

          <nav className="desktop-nav" aria-label="Navegación principal">
            <a href="#inicio">Inicio</a>
            <a href="#productos">Productos</a>
            <a href="#ambientes">Ambientes <span>✨</span></a>
          </nav>

          <div className="topbar-actions">
            <button
              type="button"
              className="menu-toggle"
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span></span><span></span><span></span>
            </button>

            <a
              className="topbar-whatsapp"
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                track("whatsapp_click", { location: "header" });
              }}
            >
              WhatsApp
            </a>
          </div>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            <a href="#inicio" onClick={() => setMenuOpen(false)}>⌂ <span>Inicio</span></a>
            <a href="#productos" onClick={() => setMenuOpen(false)}>▦ <span>Productos</span></a>
            <a href="#ambientes" onClick={() => setMenuOpen(false)}>✦ <span>Ambientes</span></a>
            <div className="mobile-menu-coming">
              <small>ESPACIO PARA CRECER</small>
              <span>Próximamente podremos sumar nuevas secciones aquí.</span>
            </div>
          </div>
        )}
      </header>

      <main className="shell" id="inicio">
        <section className="catalog-hero">
          <div className="catalog-hero-bg">
            <img
              src="https://lotgmhfqzthhhadavwlu.supabase.co/storage/v1/object/public/product-images/ambientes/rincon-lectura-final-v2.png"
              alt=""
            />
          </div>
          <div className="catalog-hero-overlay"></div>
          <div className="catalog-hero-content">
            <span className="hero-eyebrow">CATÁLOGO DONATELLO</span>
            <h1>Encuentra una pieza.<br />Imagina todo el espacio.</h1>
            <p>
              Explora lo disponible o entra a Ambientes para ver cómo pueden combinarse nuestros productos en espacios reales.
            </p>
            <div className="hero-actions">
              <a className="hero-btn primary" href="#productos">Ver productos</a>
              <a className="hero-btn secondary" href="#ambientes">Explorar ambientes ✨</a>
            </div>
          </div>
          <div className="hero-caption">
            <span>Inspiración Donatello</span>
            <strong>Rincón de lectura</strong>
          </div>
        </section>

        <section className="catalog-shortcuts" aria-label="Accesos rápidos">
          <a href="#productos">
            <span className="shortcut-icon">▦</span>
            <div><strong>Productos</strong><small>Todo lo disponible</small></div>
            <span className="shortcut-arrow">→</span>
          </a>
          <a href="#ambientes">
            <span className="shortcut-icon">✦</span>
            <div><strong>Ambientes</strong><small>Ideas para combinar</small></div>
            <span className="shortcut-arrow">→</span>
          </a>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
            <span className="shortcut-icon">◉</span>
            <div><strong>WhatsApp</strong><small>Pregunta o aparta</small></div>
            <span className="shortcut-arrow">→</span>
          </a>
        </section>

        {!loading && !loadError && ambientScenes.length > 0 && (
          <section className="ambient-section" id="ambientes">
            <div className="ambient-heading">
              <div>
                <span className="ambient-kicker">Ideas Donatello</span>
                <h2>Así podrían verse juntas</h2>
                <p>
                  Combinamos productos que están disponibles en el catálogo para ayudarte a imaginar el espacio completo.
                </p>
              </div>
              <span className="ambient-note">Toca cualquier pieza para verla a detalle</span>
            </div>

            <div className="ambient-grid">
              {ambientScenes.map((scene) => {
                const hero = scene.products[0];
                const availableSceneProducts = scene.products.filter(
                  (product) => Number(product.stock || 0) > 0
                );
                const total = availableSceneProducts.reduce(
                  (sum, product) => sum + Number(product.price || 0),
                  0
                );

                return (
                  <article className="ambient-card" key={scene.key}>
                    <div className="ambient-copy">
                      <span>{scene.subtitle}</span>
                      <h3>{scene.title}</h3>
                      <p>{scene.description}</p>
                    </div>

                    <div className="ambient-collage">
                      <button
                        type="button"
                        className="ambient-hero"
                        onClick={() => openProduct(hero)}
                        aria-label={`Ver ${hero.name}`}
                      >
                        <ProductImage
                          src={getProductImages(hero)[0] || hero.image_url}
                          alt={hero.name}
                        />
                      </button>

                      <div className="ambient-thumbs">
                        {scene.products.slice(1, 4).map((product) => (
                          <button
                            type="button"
                            className="ambient-thumb"
                            key={product.id}
                            onClick={() => openProduct(product)}
                            aria-label={`Ver ${product.name}`}
                          >
                            <ProductImage
                              src={getProductImages(product)[0] || product.image_url}
                              alt={product.name}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {scene.visualScene && scene.quantityValid && (
                      <button
                        type="button"
                        className="ambient-preview-btn"
                        onClick={() => {
                          setSelectedAmbient(scene);
                          track("ambient_preview_open", { ambient: scene.key });
                        }}
                      >
                        ✨ Ver cómo se vería el ambiente completo
                      </button>
                    )}

                    {scene.visualScene && !scene.quantityValid && (
                      <div className="ambient-stock-warning">
                        Ambiente actualizándose por disponibilidad
                      </div>
                    )}

                    <div className="ambient-products">
                      {scene.products.map((product) => {
                        const unavailable = Number(product.stock || 0) <= 0;
                        return (
                          <button
                            type="button"
                            className={`ambient-product-row${unavailable ? " unavailable" : ""}`}
                            key={product.id}
                            onClick={() => openProduct(product)}
                          >
                            <span>{product.name}</span>
                            <strong>{unavailable ? "Agotado" : money(product.price)}</strong>
                          </button>
                        );
                      })}
                    </div>

                    {scene.complements.length > 0 && (
                      <div className="ambient-complements">
                        <span className="ambient-complements-title">
                          También combina con
                        </span>
                        <div className="ambient-complements-list">
                          {scene.complements.map((product) => (
                            <button
                              type="button"
                              className="ambient-complement-chip"
                              key={product.id}
                              onClick={() => openProduct(product)}
                            >
                              <span>{product.name}</span>
                              <strong>{money(product.price)}</strong>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="ambient-total">
                      <span>
                        {availableSceneProducts.length === scene.products.length
                          ? "Total de referencia"
                          : "Total disponible"}
                      </span>
                      <strong>{money(total)}</strong>
                    </div>

                    <a
                      className="ambient-whatsapp"
                      href={buildAmbientWhatsAppLink(scene)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        track("ambient_whatsapp_click", {
                          ambient: scene.key,
                          products: availableSceneProducts.length,
                          total,
                        });
                      }}
                    >
                      💬 Quiero este ambiente
                    </a>
                  </article>
                );
              })}
            </div>
          </section>
        )}
        <section className="filters-card" id="productos">
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

      {selectedAmbient && (
        <div
          className="ambient-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Vista del ambiente ${selectedAmbient.title}`}
          onClick={() => setSelectedAmbient(null)}
        >
          <div className="ambient-modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="modal-close"
              type="button"
              onClick={() => setSelectedAmbient(null)}
              aria-label="Cerrar vista del ambiente"
            >
              ×
            </button>

            <div className="ambient-modal-copy">
              <span className="ambient-kicker">Idea Donatello</span>
              <h2>{selectedAmbient.title}</h2>
              <p>{selectedAmbient.description}</p>
            </div>

            {selectedAmbient.sceneComposite ? (
              <div className="ambient-composite-photo" aria-label={`Ambientación ${selectedAmbient.title}`}>
                <img
                  className="ambient-composite-bg"
                  src={selectedAmbient.sceneComposite.background}
                  alt=""
                />
                {selectedAmbient.sceneComposite.layers.map((layer) => (
                  <img
                    key={layer.key}
                    className={`ambient-composite-layer ambient-composite-${layer.key}`}
                    src={layer.src}
                    alt={
                      selectedAmbient.products.find((product) => product.code === layer.productCode)?.name ||
                      layer.key
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="ambient-modal-photo-wrap">
                <img
                  className="ambient-modal-photo"
                  src={selectedAmbient.sceneImage}
                  alt={`Visualización de inspiración: ${selectedAmbient.title}`}
                />
              </div>
            )}

            <div className="ambient-modal-disclaimer">
              {selectedAmbient.sceneComposite ? (
                <>
                  <strong>Prueba Photoroom.</strong> Los cuatro productos mostrados salen de las fotos reales del inventario y fueron recortados sin redibujarlos. El fondo es una ambientación de referencia; escala y perspectiva pueden ajustarse.
                </>
              ) : (
                <>
                  <strong>Visualización de inspiración.</strong> Esta ambientación ayuda a imaginar la combinación completa; algunos detalles, escala y proporciones pueden variar respecto a las piezas reales. Consulta abajo las fotos y fichas de los productos disponibles.
                </>
              )}
            </div>

            <div className="ambient-modal-products">
              {selectedAmbient.products.map((product) => (
                <button
                  type="button"
                  key={product.id}
                  onClick={() => openProduct(product)}
                >
                  <span>{product.name}</span>
                  <strong>{money(product.price)}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

  .ambient-room-preview {
    margin: 16px 0;
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid rgba(185,135,49,.34);
    background: #ead9bf;
    box-shadow: 0 18px 38px rgba(45,28,13,.14);
  }
  .ambient-room-label { padding: 16px 18px 10px; background:rgba(255,250,240,.92); }
  .ambient-room-label span { display:block; color:var(--gold); font-size:.72rem; font-weight:900; text-transform:uppercase; letter-spacing:.1em; }
  .ambient-room-label strong { display:block; margin-top:4px; color:var(--green-deep); font-family:Georgia,"Times New Roman",serif; font-size:1.08rem; }
  .ambient-room-canvas {
    min-height:430px;
    position:relative;
    overflow:hidden;
    background:
      linear-gradient(90deg, transparent 0 12%, rgba(255,255,255,.44) 12% 13%, transparent 13% 87%, rgba(255,255,255,.35) 87% 88%, transparent 88%),
      linear-gradient(180deg, #eee0c9 0 67%, #b9895e 67% 69%, #c99f78 69% 100%);
    box-shadow: inset 0 30px 80px rgba(255,255,255,.22);
  }
  .ambient-room-canvas::before {
    content:"";
    position:absolute;
    width:24%;
    height:46%;
    left:7%;
    top:9%;
    border:10px solid rgba(255,250,238,.92);
    background:linear-gradient(135deg,rgba(255,255,255,.9),rgba(210,225,217,.72));
    box-shadow:0 10px 25px rgba(45,28,13,.12);
  }
  .ambient-room-canvas::after {
    content:"";
    position:absolute;
    width:32%;
    height:18%;
    right:7%;
    top:25%;
    border-radius:3px;
    background:linear-gradient(145deg,#9b765b,#d7b487 48%,#755642);
    box-shadow:0 7px 18px rgba(45,28,13,.18);
    opacity:.62;
  }
  .ambient-room-piece { position:absolute; border:0; padding:0; background:transparent; cursor:pointer; transition:transform .18s ease; }
  .ambient-room-piece:hover { transform:translateY(-3px) scale(1.015); }
  .ambient-room-piece .product-image { width:100%; height:100%; object-fit:contain; filter:drop-shadow(0 18px 14px rgba(30,20,10,.25)); }
  .ambient-room-piece > span {
    position:absolute; left:50%; bottom:4px; transform:translateX(-50%);
    width:max-content; max-width:180px; padding:6px 9px; border-radius:999px;
    background:rgba(7,20,15,.84); color:white; font-size:.62rem; font-weight:800;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; opacity:0;
    transition:opacity .18s ease;
  }
  .ambient-room-piece:hover > span { opacity:1; }
  .ambient-room-piece.piece-4 { width:82%; height:37%; left:9%; bottom:-2%; z-index:1; opacity:.9; }
  .ambient-room-piece.piece-2 { width:54%; height:52%; left:25%; bottom:8%; z-index:3; }
  .ambient-room-piece.piece-1 { width:38%; height:48%; left:5%; bottom:5%; z-index:4; }
  .ambient-room-piece.piece-3 { width:31%; height:39%; left:34%; top:-2%; z-index:5; }
  .ambient-room-caption { margin:0; padding:11px 16px 14px; color:var(--muted); font-size:.76rem; line-height:1.45; background:rgba(255,250,240,.94); }
  @media (max-width: 640px) {
    .ambient-room-canvas { min-height:315px; }
    .ambient-room-canvas::before { width:28%; height:42%; left:5%; border-width:6px; }
    .ambient-room-piece.piece-4 { width:92%; left:4%; }
    .ambient-room-piece.piece-2 { width:59%; left:23%; }
    .ambient-room-piece.piece-1 { width:43%; left:1%; }
    .ambient-room-piece.piece-3 { width:34%; left:33%; }
  }

  .ambient-preview-btn {
    width: calc(100% - 32px);
    margin: 2px 16px 14px;
    border: 1px solid rgba(185,135,49,.48);
    border-radius: 14px;
    padding: 11px 14px;
    background: linear-gradient(135deg, #fff8e8, #f2dfb5);
    color: var(--green-deep);
    font-weight: 900;
    cursor: pointer;
    transition: transform .18s ease, box-shadow .18s ease;
  }
  .ambient-preview-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(45,28,13,.1);
  }

  .ambient-stock-warning {
    width: calc(100% - 32px);
    margin: 2px 16px 14px;
    border: 1px solid rgba(185,135,49,.38);
    border-radius: 14px;
    padding: 11px 14px;
    background: rgba(185,135,49,.10);
    color: #7a5324;
    font-size: .9rem;
    font-weight: 800;
    text-align: center;
  }

  .ambient-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: grid;
    place-items: center;
    padding: 22px;
    background: rgba(4,15,11,.78);
    backdrop-filter: blur(8px);
  }
  .ambient-modal {
    width: min(980px, 96vw);
    max-height: 92vh;
    overflow: auto;
    position: relative;
    border-radius: 24px;
    background: #fffaf0;
    border: 1px solid rgba(185,135,49,.4);
    box-shadow: 0 30px 90px rgba(0,0,0,.38);
  }
  .ambient-modal-copy {
    padding: 24px 26px 14px;
  }
  .ambient-modal-copy h2 {
    margin: 5px 0 7px;
    color: var(--green-deep);
    font-family: Georgia,"Times New Roman",serif;
    font-size: clamp(1.55rem, 4vw, 2.15rem);
  }
  .ambient-modal-copy p {
    margin: 0;
    color: var(--muted);
    line-height: 1.55;
  }
  .ambient-modal-photo-wrap {
    margin: 0 24px;
    border-radius: 20px;
    overflow: hidden;
    background: #ead9bf;
    box-shadow: 0 18px 42px rgba(45,28,13,.18);
  }

  .ambient-composite-photo {
    position: relative;
    margin: 0 24px;
    aspect-ratio: 4 / 3;
    border-radius: 20px;
    overflow: hidden;
    background: #ead9bf;
    box-shadow: 0 18px 42px rgba(45,28,13,.18);
    isolation: isolate;
  }

  .ambient-composite-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }

  .ambient-composite-layer {
    position: absolute;
    display: block;
    object-fit: contain;
    pointer-events: none;
    filter: drop-shadow(0 12px 10px rgba(35,22,12,.18));
  }

  .ambient-composite-rug {
    width: 78%;
    height: 35%;
    left: 11%;
    bottom: -1%;
    z-index: 1;
    transform: perspective(850px) rotateX(58deg) scaleY(1.35);
    transform-origin: center bottom;
    filter: drop-shadow(0 9px 7px rgba(35,22,12,.12));
  }

  .ambient-composite-mirror {
    width: 20%;
    height: 31%;
    left: 40%;
    top: 27%;
    z-index: 3;
  }

  .ambient-composite-lamp {
    width: 29%;
    height: 24%;
    left: 35.5%;
    top: 7%;
    z-index: 4;
  }

  .ambient-composite-ottoman {
    width: 29%;
    height: 38%;
    left: 35.5%;
    bottom: 7%;
    z-index: 5;
  }
  .ambient-modal-photo {
    width: 100%;
    height: auto;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    display: block;
  }
  .ambient-modal-disclaimer strong {
    color: var(--green-deep);
  }

  .ambient-modal-scene {
    min-height: 560px;
    position: relative;
    overflow: hidden;
    margin: 0 24px;
    border-radius: 20px;
    background:
      linear-gradient(90deg, transparent 0 13%, rgba(255,255,255,.48) 13% 14%, transparent 14% 86%, rgba(255,255,255,.34) 86% 87%, transparent 87%),
      linear-gradient(180deg, #eee1cd 0 67%, #ba8b61 67% 69%, #cda57d 69% 100%);
    box-shadow: inset 0 20px 70px rgba(255,255,255,.2);
  }
  .ambient-modal-scene::before {
    content:"";
    position:absolute;
    width:26%;
    height:48%;
    left:7%;
    top:8%;
    border:10px solid rgba(255,250,238,.94);
    background:linear-gradient(135deg,rgba(255,255,255,.95),rgba(205,224,215,.72));
    box-shadow:0 12px 28px rgba(45,28,13,.14);
  }
  .ambient-modal-scene::after {
    content:"";
    position:absolute;
    width:28%;
    height:18%;
    right:8%;
    top:22%;
    border-radius:4px;
    background:linear-gradient(145deg,#9b765b,#d7b487 48%,#755642);
    box-shadow:0 8px 20px rgba(45,28,13,.18);
    opacity:.52;
  }
  .ambient-modal-scene .ambient-room-piece.piece-4 { width:82%; height:36%; left:9%; bottom:-1%; z-index:1; opacity:.9; }
  .ambient-modal-scene .ambient-room-piece.piece-2 { width:52%; height:53%; left:25%; bottom:9%; z-index:3; }
  .ambient-modal-scene .ambient-room-piece.piece-1 { width:36%; height:47%; left:6%; bottom:6%; z-index:4; }
  .ambient-modal-scene .ambient-room-piece.piece-3 { width:28%; height:37%; left:36%; top:1%; z-index:5; }
  .ambient-modal-disclaimer {
    margin: 14px 24px 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(230,195,122,.18);
    color: var(--muted);
    font-size: .78rem;
    line-height: 1.45;
  }
  .ambient-modal-products {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 10px;
    padding: 14px 24px 26px;
  }
  .ambient-modal-products button {
    display:flex;
    justify-content:space-between;
    gap:14px;
    border:1px solid rgba(185,135,49,.3);
    border-radius:12px;
    background:white;
    padding:11px 12px;
    text-align:left;
    cursor:pointer;
  }
  .ambient-modal-products span { color:var(--green-black); font-weight:700; }
  .ambient-modal-products strong { color:var(--green-deep); white-space:nowrap; }
  @media (max-width: 640px) {
    .ambient-modal-backdrop { padding: 10px; }
    .ambient-modal-photo-wrap,
    .ambient-composite-photo { margin: 0 12px; border-radius: 14px; }
    .ambient-composite-mirror { width: 22%; left: 39%; }
    .ambient-composite-lamp { width: 31%; left: 34.5%; }
    .ambient-composite-ottoman { width: 31%; left: 34.5%; }
    .ambient-composite-rug { width: 82%; left: 9%; }
    .ambient-modal-scene { min-height: 360px; margin:0 12px; }
    .ambient-modal-products { grid-template-columns:1fr; padding:12px; }
    .ambient-modal-disclaimer { margin:12px 12px 0; }
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
  .ambient-section {
    margin-top: 18px;
    padding: 24px;
    border-radius: 24px;
    background: linear-gradient(145deg, rgba(15,44,33,.98), rgba(7,20,15,.98));
    border: 1px solid rgba(230,195,122,.34);
    box-shadow: var(--shadow-premium);
  }

  .ambient-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 18px;
  }

  .ambient-kicker {
    display: inline-block;
    color: var(--gold-soft);
    font-size: .78rem;
    font-weight: 900;
    letter-spacing: .12em;
    text-transform: uppercase;
    margin-bottom: 7px;
  }

  .ambient-heading h2 {
    margin: 0;
    color: #fff7e6;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(1.6rem, 3vw, 2.25rem);
  }

  .ambient-heading p {
    margin: 8px 0 0;
    max-width: 720px;
    color: rgba(255,247,230,.76);
    line-height: 1.55;
  }

  .ambient-note {
    color: var(--gold-soft);
    font-size: .8rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .ambient-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .ambient-card {
    min-width: 0;
    overflow: hidden;
    border-radius: 20px;
    background: #fffaf0;
    border: 1px solid rgba(230,195,122,.26);
    box-shadow: 0 18px 38px rgba(0,0,0,.18);
  }

  .ambient-copy {
    padding: 18px 16px 12px;
  }

  .ambient-copy > span {
    color: var(--gold);
    font-size: .76rem;
    font-weight: 900;
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  .ambient-copy h3 {
    margin: 5px 0 6px;
    color: var(--green-deep);
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1.35rem;
  }

  .ambient-copy p {
    margin: 0;
    color: var(--muted);
    font-size: .87rem;
    line-height: 1.5;
  }

  .ambient-collage {
    display: grid;
    grid-template-columns: 1.55fr .75fr;
    gap: 5px;
    height: 235px;
    padding: 0 16px;
  }

  .ambient-hero,
  .ambient-thumb {
    border: 0;
    padding: 0;
    overflow: hidden;
    cursor: pointer;
    background: #efe5d1;
  }

  .ambient-hero {
    border-radius: 15px 5px 5px 15px;
  }

  .ambient-thumbs {
    display: grid;
    gap: 5px;
    grid-template-rows: repeat(3, 1fr);
    min-height: 0;
  }

  .ambient-thumb {
    border-radius: 5px 15px 15px 5px;
    min-height: 0;
  }

  .ambient-collage .product-image {
    transition: transform .25s ease;
  }

  .ambient-hero:hover .product-image,
  .ambient-thumb:hover .product-image {
    transform: scale(1.035);
  }

  .ambient-products {
    min-width: 0;
    padding: 10px 16px 0;
    display: grid;
    gap: 3px;
  }

  .ambient-product-row {
    width: 100%;
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) max-content;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border: 0;
    border-bottom: 1px solid rgba(185,135,49,.16);
    background: transparent;
    color: var(--green-black);
    cursor: pointer;
    text-align: left;
  }

  .ambient-product-row span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: .82rem;
  }

  .ambient-product-row strong {
    justify-self: end;
    color: var(--green-deep);
    font-size: .82rem;
    white-space: nowrap;
  }

  .ambient-product-row.unavailable {
    opacity: .62;
  }

  .ambient-product-row.unavailable strong {
    color: #8a5a3a;
    font-size: .74rem;
    text-transform: uppercase;
    letter-spacing: .03em;
  }

  .ambient-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px 8px;
    color: var(--green-deep);
  }

  .ambient-total span {
    font-size: .78rem;
    color: var(--muted);
  }

  .ambient-total strong {
    font-size: 1.08rem;
  }

  .ambient-whatsapp {
    display: block;
    margin: 8px 16px 16px;
    padding: 11px 14px;
    border-radius: 12px;
    text-align: center;
    text-decoration: none;
    font-weight: 900;
    background: var(--green-deep);
    color: white;
  }

  @media (max-width: 900px) {
    .ambient-grid {
      grid-template-columns: 1fr;
    }

    .ambient-card {
      max-width: 680px;
      width: 100%;
      margin: 0 auto;
    }

    .ambient-heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 8px;
    }

    .ambient-note {
      white-space: normal;
    }
  }

  @media (max-width: 560px) {
    .ambient-section {
      padding: 18px 12px;
      border-radius: 20px;
    }

    .ambient-collage {
      height: 210px;
    }
  }

  .ambient-complements {
    padding: 12px 16px 2px;
  }

  .ambient-complements-title {
    display: block;
    margin-bottom: 8px;
    color: var(--muted);
    font-size: .72rem;
    font-weight: 900;
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  .ambient-complements-list {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .ambient-complement-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    max-width: 100%;
    padding: 7px 9px;
    border-radius: 999px;
    border: 1px solid rgba(185,135,49,.28);
    background: rgba(239,225,189,.34);
    color: var(--green-deep);
    cursor: pointer;
    font-size: .72rem;
  }

  .ambient-complement-chip span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ambient-complement-chip strong {
    white-space: nowrap;
  }

  /* --- Prueba navegación + portada v2 --- */
  .topbar-brand { text-decoration: none; }
  .topbar-inner { min-height: 78px; }
  .desktop-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }
  .desktop-nav a {
    color: rgba(255,247,230,.82);
    text-decoration: none;
    font-size: .9rem;
    font-weight: 800;
    padding: 10px 12px;
    border-radius: 999px;
    transition: background .18s ease, color .18s ease;
  }
  .desktop-nav a:hover {
    color: white;
    background: rgba(255,255,255,.08);
  }
  .desktop-nav a span { color: var(--gold-soft); }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: 10px;
  }

  .menu-toggle {
    display: none;
    width: 42px;
    height: 42px;
    padding: 10px;
    border-radius: 12px;
    border: 1px solid rgba(230,195,122,.34);
    background: rgba(255,255,255,.05);
    cursor: pointer;
  }
  .menu-toggle span {
    display: block;
    height: 2px;
    margin: 4px 0;
    border-radius: 9px;
    background: #fff7e6;
  }

  .mobile-menu { display: none; }

  .catalog-hero {
    position: relative;
    min-height: 480px;
    overflow: hidden;
    border-radius: 28px;
    border: 1px solid rgba(230,195,122,.4);
    box-shadow: var(--shadow-premium);
    isolation: isolate;
  }
  .catalog-hero-bg,
  .catalog-hero-overlay {
    position: absolute;
    inset: 0;
  }
  .catalog-hero-bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .catalog-hero-overlay {
    z-index: 1;
    background:
      linear-gradient(90deg, rgba(5,15,11,.90) 0%, rgba(5,15,11,.72) 43%, rgba(5,15,11,.16) 78%),
      linear-gradient(0deg, rgba(5,15,11,.28), transparent 50%);
  }
  .catalog-hero-content {
    position: relative;
    z-index: 2;
    width: min(620px, 70%);
    padding: 70px 54px;
    color: white;
  }
  .hero-eyebrow {
    display: inline-block;
    margin-bottom: 14px;
    color: var(--gold-soft);
    font-size: .76rem;
    font-weight: 900;
    letter-spacing: .16em;
  }
  .catalog-hero h1 {
    margin: 0;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(2.4rem, 5vw, 4.6rem);
    line-height: .98;
    font-weight: 500;
    letter-spacing: -.035em;
  }
  .catalog-hero-content p {
    max-width: 560px;
    margin: 20px 0 0;
    color: rgba(255,247,230,.82);
    font-size: 1.02rem;
    line-height: 1.65;
  }
  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 28px;
  }
  .hero-btn {
    text-decoration: none;
    border-radius: 14px;
    padding: 13px 18px;
    font-weight: 900;
  }
  .hero-btn.primary {
    color: var(--green-black);
    background: linear-gradient(180deg,#f3e3bc,#d9b76b);
    border: 1px solid #f7e8bd;
  }
  .hero-btn.secondary {
    color: white;
    background: rgba(255,255,255,.09);
    border: 1px solid rgba(255,255,255,.26);
    backdrop-filter: blur(8px);
  }
  .hero-caption {
    position: absolute;
    z-index: 2;
    right: 22px;
    bottom: 20px;
    padding: 10px 13px;
    border-radius: 13px;
    color: white;
    background: rgba(7,20,15,.72);
    border: 1px solid rgba(230,195,122,.28);
    backdrop-filter: blur(10px);
  }
  .hero-caption span,
  .hero-caption strong { display: block; }
  .hero-caption span { color: var(--gold-soft); font-size: .68rem; text-transform: uppercase; letter-spacing: .08em; }
  .hero-caption strong { margin-top: 2px; font-family: Georgia,"Times New Roman",serif; font-size: .95rem; }

  .catalog-shortcuts {
    display: grid;
    grid-template-columns: repeat(3,minmax(0,1fr));
    gap: 12px;
    margin: 16px 0 4px;
  }
  .catalog-shortcuts > a {
    display: grid;
    grid-template-columns: 42px minmax(0,1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    text-decoration: none;
    color: var(--green-black);
    background: rgba(255,250,240,.94);
    border: 1px solid var(--border);
    border-radius: 17px;
    box-shadow: 0 10px 26px rgba(16,41,31,.08);
    transition: transform .18s ease, box-shadow .18s ease;
  }
  .catalog-shortcuts > a:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 34px rgba(16,41,31,.13);
  }
  .shortcut-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    color: #fff7e6;
    background: var(--green-deep);
    font-size: 1.12rem;
  }
  .catalog-shortcuts strong,
  .catalog-shortcuts small { display: block; }
  .catalog-shortcuts strong { color: var(--green-deep); }
  .catalog-shortcuts small { margin-top: 2px; color: var(--muted); font-size: .74rem; }
  .shortcut-arrow { color: var(--gold); font-size: 1.2rem; }

  .filters-card { scroll-margin-top: 96px; }
  .ambient-section { scroll-margin-top: 96px; }

  @media (max-width: 760px) {
    .topbar-inner {
      min-height: 66px;
      align-items: center;
    }
    .desktop-nav { display: none; }
    .menu-toggle { display: block; }
    .topbar-actions { margin-left: auto; }
    .topbar-brand strong { font-size: .93rem; }
    .topbar-whatsapp {
      padding: 9px 11px;
      font-size: .78rem;
    }

    .mobile-menu {
      display: grid;
      gap: 6px;
      position: absolute;
      top: calc(100% + 8px);
      left: 12px;
      right: 12px;
      padding: 10px;
      border-radius: 18px;
      background: rgba(255,250,240,.98);
      border: 1px solid rgba(185,135,49,.36);
      box-shadow: 0 24px 60px rgba(0,0,0,.26);
    }
    .mobile-menu > a {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 13px 14px;
      text-decoration: none;
      color: var(--green-deep);
      border-radius: 12px;
      font-weight: 900;
    }
    .mobile-menu > a:hover { background: rgba(230,195,122,.18); }
    .mobile-menu-coming {
      margin-top: 4px;
      padding: 12px 14px;
      border-top: 1px solid rgba(185,135,49,.22);
    }
    .mobile-menu-coming small {
      display: block;
      color: var(--gold);
      font-size: .64rem;
      font-weight: 900;
      letter-spacing: .1em;
    }
    .mobile-menu-coming span {
      display: block;
      margin-top: 4px;
      color: var(--muted);
      font-size: .78rem;
      line-height: 1.35;
    }

    .catalog-hero {
      min-height: 520px;
      border-radius: 20px;
    }
    .catalog-hero-bg img {
      object-position: 58% center;
    }
    .catalog-hero-overlay {
      background:
        linear-gradient(0deg, rgba(5,15,11,.94) 0%, rgba(5,15,11,.72) 47%, rgba(5,15,11,.18) 82%);
    }
    .catalog-hero-content {
      width: 100%;
      padding: 238px 20px 78px;
    }
    .catalog-hero h1 {
      font-size: clamp(2.2rem,12vw,3.35rem);
      line-height: 1;
    }
    .catalog-hero-content p {
      font-size: .9rem;
      line-height: 1.5;
    }
    .hero-actions {
      display: grid;
      grid-template-columns: 1fr;
    }
    .hero-btn { text-align: center; }
    .hero-caption {
      left: 16px;
      right: auto;
      top: 16px;
      bottom: auto;
    }

    .catalog-shortcuts {
      display: flex;
      overflow-x: auto;
      gap: 9px;
      padding-bottom: 4px;
      scrollbar-width: none;
    }
    .catalog-shortcuts::-webkit-scrollbar { display:none; }
    .catalog-shortcuts > a {
      flex: 0 0 78%;
      padding: 12px;
    }
  }

  @media (max-width: 420px) {
    .topbar-brand div span { display:none; }
    .catalog-hero-content { padding-left: 18px; padding-right: 18px; }
  }

`;
