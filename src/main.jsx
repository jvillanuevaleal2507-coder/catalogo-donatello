import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { Analytics } from "@vercel/analytics/react";
import { initDonatelloFavorites } from "./favorites.js";
import { initDonatelloFavoriteSharing } from "./shareFavorites.js";
import { initDonatelloFavoriteDetail } from "./favoritesDetail.js";
import { initDonatelloConversionTracking } from "./conversionTracking.js";

const root = createRoot(document.getElementById("root"));
const isCommercialPanel = window.location.pathname.replace(/\/+$/, "") === "/panel";

if (isCommercialPanel) {
  // Keep the private reporting interface and its styles out of the public catalog bundle.
  import("./CommercialDashboard.jsx").then(({ default: CommercialDashboard }) => {
    root.render(<React.StrictMode><CommercialDashboard /></React.StrictMode>);
  }).catch(() => {
    root.render(<p role="alert" style={{padding:30,fontFamily:"system-ui"}}>No se pudo cargar el panel. Actualiza la página.</p>);
  });
} else {
  root.render(<React.StrictMode><><App /><Analytics /></></React.StrictMode>);
  initDonatelloFavorites();
  initDonatelloFavoriteSharing();
  initDonatelloFavoriteDetail();
  initDonatelloConversionTracking();
}
