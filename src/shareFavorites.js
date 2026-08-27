const STORAGE_KEY = "donatello_favorites_v1";
const SHARE_PARAM = "favsel";

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

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function encodeSelection(items) {
  const compact = items.map((item) => ({
    name: String(item.name || "").trim(),
    price: String(item.price || "").trim(),
  }));

  const json = JSON.stringify(compact);
  const utf8 = encodeURIComponent(json).replace(
    /%([0-9A-F]{2})/g,
    (_, hex) => String.fromCharCode(parseInt(hex, 16))
  );

  return btoa(utf8)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeSelection(value) {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
    const binary = atob(padded);
    const encoded = Array.from(binary)
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("");
    const parsed = JSON.parse(decodeURIComponent(encoded));

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && String(item.name || "").trim())
      .map((item) => ({
        name: String(item.name || "").trim(),
        price: String(item.price || "").trim(),
        code: "",
        image: "",
      }));
  } catch {
    return [];
  }
}

function buildShareUrl(items) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set(SHARE_PARAM, encodeSelection(items));
  return url.toString();
}

function importSharedSelection() {
  const url = new URL(window.location.href);
  const encoded = url.searchParams.get(SHARE_PARAM);
  if (!encoded) return;

  const sharedItems = decodeSelection(encoded);
  if (sharedItems.length) {
    const current = readFavorites();
    const merged = [...current];

    sharedItems.forEach((item) => {
      const key = normalizeName(item.name);
      const existingIndex = merged.findIndex(
        (favorite) => normalizeName(favorite.name) === key
      );

      if (existingIndex >= 0) {
        merged[existingIndex] = {
          ...item,
          ...merged[existingIndex],
          name: merged[existingIndex].name || item.name,
          price: merged[existingIndex].price || item.price,
        };
      } else {
        merged.push(item);
      }
    });

    writeFavorites(merged);
  }

  url.searchParams.delete(SHARE_PARAM);
  const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", cleanUrl || "/");
}

function buildFriendlyShareText(items, shareUrl) {
  const lines = items.map((item, index) => {
    const price = item.price ? ` — ${item.price}` : "";
    return `${index + 1}. ${item.name}${price}`;
  });

  return `Mira los muebles que estuve guardando en Donatello 👀\n\nEstos son los que más me gustaron:\n\n${lines.join("\n")}\n\n¿Cuál te gusta más?\n\nAbre mi selección aquí: ${shareUrl}`;
}

export function initDonatelloFavoriteSharing() {
  importSharedSelection();

  document.addEventListener(
    "click",
    async (event) => {
      const button = event.target.closest?.(".donatello-fav-share");
      if (!button) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const favorites = readFavorites();
      if (!favorites.length) return;

      const shareUrl = buildShareUrl(favorites);
      const text = buildFriendlyShareText(favorites, shareUrl);

      try {
        if (navigator.share) {
          await navigator.share({
            title: "Mis favoritos de Ventas Donatello",
            text,
          });
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
    },
    true
  );
}
