import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import CommercialDashboard from "./CommercialDashboard.jsx";
import { Analytics } from "@vercel/analytics/react";
import { initDonatelloFavorites } from "./favorites.js";
import { initDonatelloFavoriteSharing } from "./shareFavorites.js";
import { initDonatelloFavoriteDetail } from "./favoritesDetail.js";
import { initDonatelloConversionTracking } from "./conversionTracking.js";

const isCommercialPanel = window.location.pathname.replace(/\/+$/, "") === "/panel";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isCommercialPanel
      ? <CommercialDashboard />
      : <><App /><Analytics /></>}
  </React.StrictMode>
);

if (!isCommercialPanel) {
  initDonatelloFavorites();
  initDonatelloFavoriteSharing();
  initDonatelloFavoriteDetail();
  initDonatelloConversionTracking();
}
