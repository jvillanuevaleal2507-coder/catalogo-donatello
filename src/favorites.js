const STORAGE_KEY = "donatello_favorites_v1";
const WHATSAPP_NUMBER = "528999122313";

function readFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFavorites(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("donatello:favorites-changed"));
}

function keyFor(item) {
  return String(item.code || item.name || "").trim().toLowerCase();
}

function isFavorite(item) {
  const key = keyFor(item);
  return readFavorites().some((fav) => keyFor(fav) === key);
}

function toggleFavorite(item) {
  const favorites = readFavorites();
  const key = keyFor(item);
  const index = favorites.findIndex((fav) => keyFor(fav) === key);

  if (index >= 0) favorites.splice(index, 1);
  else favorites.push(item);

  writeFavorites(favorites);
}

function moneyText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function productFromCard(card) {
  const name = card.querySelector(".product-body h3")?.textContent?.trim() || "Producto Donatello";
  const price = moneyText(card.querySelector(".price-row strong")?.textContent);
  const image = card.querySelector(".product-image")?.src || "";
  return { name, price, image, code: "" };
}

function productFromModal(modal) {
  const name = modal.querySelector(".modal-info h2")?.textContent?.trim() || "Producto Donatello";
  const price = moneyText(modal.querySelector(".modal-price strong")?.textContent);
  const ref = modal.querySelector(".modal-ref")?.textContent || "";
  const code = ref.replace(/^Referencia:\s*/i, "").trim();
  const image = modal.querySelector(".modal-image-wrap .product-image")?.src || "";
  return { name, price, image, code };
}

function heartMarkup(active) {
  return active ? "♥" : "♡";
}

function refreshHearts() {
  document.querySelectorAll("[data-donatello-favorite]").forEach((button) => {
    let item;
    const card = button.closest(".product-card");
    const modal = button.closest(".product-modal");
    if (card) item = productFromCard(card);
    if (modal) item = productFromModal(modal);
    if (!item) return;

    const active = isFavorite(item);
    button.textContent = heartMarkup(active);
    button.classList.toggle("is-favorite", active);
    button.setAttribute("aria-label", active ? "Quitar de favoritos" : "Agregar a favoritos");
    button.title = active ? "Quitar de favoritos" : "Agregar a favoritos";
  });
}

function attachCardHearts() {
  document.querySelectorAll(".product-card").forEach((card) => {
    if (card.querySelector("[data-donatello-favorite]")) return;
    const imageWrap = card.querySelector(".image-wrap");
    if (!imageWrap) return;

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.donatelloFavorite = "card";
    button.className = "donatello-heart donatello-heart-card";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFavorite(productFromCard(card));
    });
    imageWrap.appendChild(button);
  });
}

function attachModalHeart() {
  const modal = document.querySelector(".product-modal");
  if (!modal || modal.querySelector("[data-donatello-favorite]")) return;

  const info = modal.querySelector(".modal-info");
  if (!info) return;

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.donatelloFavorite = "modal";
  button.className = "donatello-modal-favorite";
  button.addEventListener("click", () => {
    const item = productFromModal(modal);
    const favorites = readFavorites();
    const sameNameIndex = favorites.findIndex(
      (fav) => String(fav.name).trim().toLowerCase() === String(item.name).trim().toLowerCase()
    );

    if (sameNameIndex >= 0 && !favorites[sameNameIndex].code && item.code) {
      favorites[sameNameIndex] = { ...favorites[sameNameIndex], ...item };
      writeFavorites(favorites);
      refreshHearts();
      return;
    }

    toggleFavorite(item);
  });

  const price = info.querySelector(".modal-price");
  if (price) price.insertAdjacentElement("afterend", button);
  else info.appendChild(button);
}

function buildSelectionText(items) {
  const lines = items.map((item, index) => {
    const code = item.code ? ` | Ref: ${item.code}` : "";
    const price = item.price ? ` | ${item.price}` : "";
    return `${index + 1}. ${item.name}${code}${price}`;
  });

  return `Hola, estuve viendo el catálogo de Ventas Donatello y me interesan estos productos:\n\n${lines.join("\n")}\n\n¿Me puedes confirmar disponibilidad?`;
}

function renderDrawer() {
  let root = document.getElementById("donatello-favorites-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "donatello-favorites-root";
    document.body.appendChild(root);
  }

  const favorites = readFavorites();
  const wasOpen = root.classList.contains("drawer-open");

  root.innerHTML = `
    <button class="donatello-favorites-fab" type="button" aria-label="Ver mis favoritos">
      <span>♡</span><strong>Mis favoritos</strong><b>${favorites.length}</b>
    </button>
    <div class="donatello-favorites-overlay"></div>
    <aside class="donatello-favorites-drawer" aria-label="Mis favoritos">
      <div class="donatello-favorites-head">
        <div><span>Tu selección</span><h3>Mis favoritos (${favorites.length})</h3></div>
        <button class="donatello-drawer-close" type="button" aria-label="Cerrar">×</button>
      </div>
      <div class="donatello-favorites-list">
        ${favorites.length ? favorites.map((item, index) => `
          <article class="donatello-favorite-item">
            ${item.image ? `<img src="${item.image}" alt="">` : `<div class="donatello-fav-placeholder">VD</div>`}
            <div><strong>${item.name}</strong>${item.code ? `<small>Ref: ${item.code}</small>` : ""}<span>${item.price || ""}</span></div>
            <button type="button" data-remove-favorite="${index}" aria-label="Quitar">×</button>
          </article>
        `).join("") : `<div class="donatello-favorites-empty"><span>♡</span><strong>Aún no tienes favoritos</strong><p>Toca el corazón de los productos que te gusten y aparecerán aquí.</p></div>`}
      </div>
      ${favorites.length ? `
        <div class="donatello-favorites-actions">
          <a class="donatello-fav-whatsapp" target="_blank" rel="noreferrer">💬 Consultar por WhatsApp</a>
          <button class="donatello-fav-share" type="button">↗ Compartir mi selección</button>
          <button class="donatello-fav-clear" type="button">Limpiar favoritos</button>
        </div>
      ` : ""}
    </aside>
  `;

  if (wasOpen) root.classList.add("drawer-open");

  const open = () => root.classList.add("drawer-open");
  const close = () => root.classList.remove("drawer-open");
  root.querySelector(".donatello-favorites-fab")?.addEventListener("click", open);
  root.querySelector(".donatello-drawer-close")?.addEventListener("click", close);
  root.querySelector(".donatello-favorites-overlay")?.addEventListener("click", close);

  root.querySelectorAll("[data-remove-favorite]").forEach((button) => {
    button.addEventListener("click", () => {
      const items = readFavorites();
      items.splice(Number(button.dataset.removeFavorite), 1);
      writeFavorites(items);
    });
  });

  const whatsapp = root.querySelector(".donatello-fav-whatsapp");
  if (whatsapp) {
    whatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildSelectionText(favorites))}`;
  }

  root.querySelector(".donatello-fav-share")?.addEventListener("click", async () => {
    const text = `${buildSelectionText(favorites)}\n\n${window.location.origin}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mis favoritos de Ventas Donatello", text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Tu selección quedó copiada. Ya puedes compartirla.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(text);
          alert("Tu selección quedó copiada. Ya puedes compartirla.");
        } catch {}
      }
    }
  });

  root.querySelector(".donatello-fav-clear")?.addEventListener("click", () => writeFavorites([]));
}

function injectStyles() {
  if (document.getElementById("donatello-favorites-styles")) return;
  const style = document.createElement("style");
  style.id = "donatello-favorites-styles";
  style.textContent = `
    .donatello-heart{position:absolute;z-index:8;border:1px solid rgba(185,135,49,.5);background:rgba(255,250,240,.94);color:#173d2f;display:grid;place-items:center;cursor:pointer;box-shadow:0 8px 22px rgba(7,20,15,.16);font-family:Arial,sans-serif;transition:.18s ease}
    .donatello-heart:hover{transform:scale(1.06)}.donatello-heart.is-favorite{background:#173d2f;color:#e6c37a;border-color:#e6c37a}
    .donatello-heart-card{top:12px;right:12px;width:40px;height:40px;border-radius:999px;font-size:25px}.product-card .gallery-pill{top:60px}
    .donatello-modal-favorite{margin-top:12px;width:100%;border:1px solid rgba(185,135,49,.45);background:rgba(255,255,255,.7);color:#173d2f;border-radius:14px;padding:12px;font-weight:900;cursor:pointer}.donatello-modal-favorite:before{content:'♡  '}.donatello-modal-favorite.is-favorite:before{content:'♥  '}.donatello-modal-favorite.is-favorite{background:#173d2f;color:#fff4dc}
    #donatello-favorites-root{position:relative;z-index:150}.donatello-favorites-fab{position:fixed;right:20px;bottom:20px;z-index:151;border:1px solid #e6c37a;background:linear-gradient(135deg,#07140f,#173d2f);color:#fff4dc;border-radius:999px;padding:12px 16px;display:flex;align-items:center;gap:8px;box-shadow:0 16px 38px rgba(7,20,15,.32);cursor:pointer}.donatello-favorites-fab span{color:#e6c37a;font-size:22px}.donatello-favorites-fab b{min-width:24px;height:24px;border-radius:999px;background:#e6c37a;color:#07140f;display:grid;place-items:center;font-size:12px}
    .donatello-favorites-overlay{position:fixed;inset:0;background:rgba(4,13,10,.58);backdrop-filter:blur(5px);opacity:0;pointer-events:none;transition:.2s;z-index:152}.donatello-favorites-drawer{position:fixed;top:0;right:0;width:min(440px,100%);height:100vh;background:linear-gradient(180deg,#fffaf0,#f7ead0);z-index:153;transform:translateX(105%);transition:.24s ease;box-shadow:-24px 0 60px rgba(7,20,15,.28);display:flex;flex-direction:column}.drawer-open .donatello-favorites-overlay{opacity:1;pointer-events:auto}.drawer-open .donatello-favorites-drawer{transform:translateX(0)}
    .donatello-favorites-head{padding:22px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(185,135,49,.3);background:#0f2c21;color:#fff4dc}.donatello-favorites-head span{font-size:12px;color:#e6c37a;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.donatello-favorites-head h3{margin:4px 0 0;font-family:Georgia,serif;font-size:24px}.donatello-drawer-close{border:1px solid rgba(230,195,122,.5);background:transparent;color:white;width:40px;height:40px;border-radius:999px;font-size:24px;cursor:pointer}
    .donatello-favorites-list{padding:16px;overflow:auto;flex:1}.donatello-favorite-item{display:grid;grid-template-columns:76px 1fr 34px;gap:12px;align-items:center;padding:10px 0;border-bottom:1px dashed rgba(185,135,49,.35)}.donatello-favorite-item img,.donatello-fav-placeholder{width:76px;height:76px;object-fit:cover;border-radius:12px;background:#efe0c1}.donatello-fav-placeholder{display:grid;place-items:center;font-family:Georgia,serif;font-weight:900;color:#173d2f}.donatello-favorite-item strong{display:block;color:#07140f;line-height:1.25}.donatello-favorite-item small,.donatello-favorite-item span{display:block;margin-top:4px;color:#76664f}.donatello-favorite-item span{color:#173d2f;font-weight:900}.donatello-favorite-item>button{border:0;background:transparent;font-size:24px;color:#76664f;cursor:pointer}
    .donatello-favorites-empty{text-align:center;padding:60px 22px;color:#76664f}.donatello-favorites-empty span{display:block;font-size:54px;color:#b98731}.donatello-favorites-empty strong{display:block;color:#173d2f;font-family:Georgia,serif;font-size:20px}.donatello-favorites-empty p{line-height:1.5}.donatello-favorites-actions{padding:16px;border-top:1px solid rgba(185,135,49,.3);display:grid;gap:10px;background:#fffaf0}.donatello-fav-whatsapp,.donatello-fav-share,.donatello-fav-clear{text-align:center;text-decoration:none;border-radius:13px;padding:13px;font-weight:900;cursor:pointer}.donatello-fav-whatsapp{background:linear-gradient(180deg,#1b8d56,#0f6e42);color:white}.donatello-fav-share{border:1px solid #173d2f;background:#173d2f;color:white}.donatello-fav-clear{border:0;background:transparent;color:#76664f;padding:7px}
    @media(max-width:760px){.donatello-favorites-fab{right:12px;bottom:12px;padding:10px 13px}.donatello-favorites-fab strong{font-size:13px}.donatello-heart-card{width:38px;height:38px}.product-card .gallery-pill{top:58px}}
  `;
  document.head.appendChild(style);
}

function sync() {
  attachCardHearts();
  attachModalHeart();
  refreshHearts();
}

export function initDonatelloFavorites() {
  injectStyles();
  renderDrawer();
  sync();

  window.addEventListener("donatello:favorites-changed", () => {
    renderDrawer();
    sync();
  });

  const observer = new MutationObserver(() => sync());
  observer.observe(document.body, { childList: true, subtree: true });
}
