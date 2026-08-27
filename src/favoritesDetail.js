function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getFavoriteName(item) {
  return item.querySelector("strong")?.textContent?.trim() || "";
}

function findProductCardByName(name) {
  const target = normalize(name);
  return Array.from(document.querySelectorAll(".product-card")).find((card) => {
    const cardName = card.querySelector(".product-body h3")?.textContent?.trim() || "";
    return normalize(cardName) === target;
  });
}

function closeFavoritesDrawer() {
  document.getElementById("donatello-favorites-root")?.classList.remove("drawer-open");
}

function openCard(card) {
  const button = card?.querySelector(".image-wrap.image-action");
  if (!button) return false;
  closeFavoritesDrawer();
  setTimeout(() => button.click(), 60);
  return true;
}

function injectStyles() {
  if (document.getElementById("donatello-favorites-detail-styles")) return;

  const style = document.createElement("style");
  style.id = "donatello-favorites-detail-styles";
  style.textContent = `
    .donatello-favorite-item{
      cursor:pointer;
      position:relative;
      transition:background .18s ease, transform .18s ease;
    }
    .donatello-favorite-item:hover{
      background:rgba(230,195,122,.12);
    }
    .donatello-favorite-item::after{
      content:'Ver detalle ›';
      grid-column:2;
      color:#b98731;
      font-size:.76rem;
      font-weight:900;
      margin-top:-4px;
    }
    .donatello-favorite-item > button{
      position:relative;
      z-index:2;
    }
  `;
  document.head.appendChild(style);
}

export function initDonatelloFavoriteDetail() {
  injectStyles();

  document.addEventListener("click", (event) => {
    const removeButton = event.target.closest?.("[data-remove-favorite]");
    if (removeButton) return;

    const item = event.target.closest?.(".donatello-favorite-item");
    if (!item) return;

    const name = getFavoriteName(item);
    if (!name) return;

    const card = findProductCardByName(name);
    if (openCard(card)) return;

    alert("No pudimos abrir el detalle de este producto. Intenta buscarlo en el catálogo.");
  });
}
