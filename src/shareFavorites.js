const STORAGE_KEY = "donatello_favorites_v1";

function readFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildFriendlyShareText(items) {
  const lines = items.map((item, index) => {
    const price = item.price ? ` — ${item.price}` : "";
    return `${index + 1}. ${item.name}${price}`;
  });

  return `Mira los muebles que estuve guardando en Donatello 👀\n\nEstos son los que más me gustaron:\n\n${lines.join("\n")}\n\n¿Cuál te gusta más?\n\nCatálogo de Ventas Donatello: ${window.location.origin}`;
}

export function initDonatelloFavoriteSharing() {
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

      const text = buildFriendlyShareText(favorites);

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
