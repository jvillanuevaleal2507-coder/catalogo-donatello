import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./commercialDashboard.css";

const db = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
const money = (amount) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(amount || 0));
const dateKey = (value) => new Date(value).toLocaleDateString("en-CA", { timeZone: "America/Matamoros" });
const formatNumber = (n) => new Intl.NumberFormat("es-MX").format(n);
const slug = (value) => String(value || "").trim().toLowerCase();

async function loadInsights(days, environment) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const all = [];
  const size = 1000;
  for (let offset = 0; offset < 5000; offset += size) {
    const { data, error } = await db
      .from("catalog_analytics_events")
      .select("created_at,environment,event_name,product_code,product_name,category,search_term,placement")
      .gte("created_at", since)
      .eq("environment", environment)
      .order("created_at", { ascending: false })
      .range(offset, offset + size - 1);
    if (error) throw error;
    all.push(...(data || []));
    if (!data || data.length < size) break;
  }
  const { data: products, error: productsError } = await db
    .from("products")
    .select("id,code,name,price,stock,image_url,category");
  if (productsError) throw productsError;
  return { events: all, products: products || [], truncated: all.length >= 5000 };
}

function analyze(events, products, days) {
  const productByCode = new Map(products.map((p) => [slug(p.code), p]));
  const productByName = new Map(products.map((p) => [slug(p.name), p]));
  const buckets = new Map();
  const searchCounts = new Map();
  const categoryCounts = new Map();
  const trend = new Map();
  let views = 0, whatsapp = 0, favorites = 0, shares = 0, sessions = 0, searches = 0;

  for (const entry of events) {
    const evt = entry.event_name;
    if (evt === "product_view") views += 1;
    if (evt === "whatsapp_click") whatsapp += 1;
    if (evt === "favorite_add") favorites += 1;
    if (evt === "product_share") shares += 1;
    if (evt === "catalog_session") sessions += 1;
    if (evt === "catalog_search") {
      searches += 1;
      const query = slug(entry.search_term);
      if (query) searchCounts.set(query, (searchCounts.get(query) || 0) + 1);
    }
    if (evt === "category_filter") {
      const cat = entry.category?.trim();
      if (cat) categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    }

    if (evt === "product_view" || evt === "whatsapp_click") {
      const date = dateKey(entry.created_at);
      const values = trend.get(date) || { date, views: 0, whatsapp: 0 };
      values[evt === "product_view" ? "views" : "whatsapp"] += 1;
      trend.set(date, values);
    }

    if (!["product_view", "whatsapp_click", "favorite_add", "product_share"].includes(evt)) continue;
    const product = productByCode.get(slug(entry.product_code)) || productByName.get(slug(entry.product_name));
    if (!product && !entry.product_code && !entry.product_name) continue;
    const key = product ? "id:" + product.id : "name:" + slug(entry.product_code || entry.product_name);
    const bucket = buckets.get(key) || {
      code: product?.code || entry.product_code,
      name: product?.name || entry.product_name,
      price: product?.price,
      stock: product?.stock,
      image: product?.image_url,
      category: product?.category || entry.category,
      views: 0, whatsapp: 0, favorites: 0, shares: 0,
    };
    if (evt === "product_view") bucket.views += 1;
    if (evt === "whatsapp_click") bucket.whatsapp += 1;
    if (evt === "favorite_add") bucket.favorites += 1;
    if (evt === "product_share") bucket.shares += 1;
    buckets.set(key, bucket);
  }
  const productsRanked = Array.from(buckets.values()).sort((a, b) =>
    (b.views - a.views) || (b.whatsapp - a.whatsapp) || (b.favorites - a.favorites)
  );
  const searchesRanked = Array.from(searchCounts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count).slice(0, 7);
  const categoriesRanked = Array.from(categoryCounts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count).slice(0, 5);

  const points = [];
  const length = Math.min(days, 14);
  for (let i = length - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    points.push(trend.get(key) || { date: key, views: 0, whatsapp: 0 });
  }
  const opportunities = productsRanked.filter((p) => p.views >= 8).map((p) => ({
    ...p,
    verdict: p.whatsapp === 0 ? "Revisar presentación"
      : p.whatsapp >= 3 ? "Candidato para impulsar"
      : "Seguir observando",
    reason: p.whatsapp === 0
      ? "Tiene visitas, pero todavía no registra clics de consulta."
      : p.whatsapp >= 3
        ? "Acumula vistas y varias intenciones de consulta."
        : "Ha recibido interés inicial; conviene reunir más datos.",
  })).slice(0, 5);

  return { views, whatsapp, favorites, shares, sessions, searches,
    productsRanked, searchesRanked, categoriesRanked, points, opportunities };
}

function KPI({ icon, label, count, detail }) {
  return <div className="ci-kpi"><span className="ci-kpi-icon">{icon}</span>
    <div className="ci-kpi-label">{label}</div>
    <strong>{formatNumber(count)}</strong>
    <div className="ci-kpi-detail">{detail}</div>
  </div>;
}

function Empty({ children }) {
  return <div className="ci-empty"><span>◌</span><p>{children}</p></div>;
}

export default function CommercialDashboard() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [days, setDays] = useState(30);
  const [environment, setEnvironment] = useState("preview");
  const [loadSerial, setLoadSerial] = useState(0);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function checkAccess() {
      try {
        const { data: { user: currentUser }, error } = await db.auth.getUser();
        if (error || !currentUser) {
          if (mounted) { setUser(null); setIsAdmin(false); }
          return;
        }
        const { data, error: authError } = await db.from("pos_authorized_users")
          .select("role,active").eq("user_id", currentUser.id).maybeSingle();
        if (mounted) {
          setUser(currentUser);
          setIsAdmin(!authError && data?.active === true && data?.role === "admin");
        }
      } finally {
        if (mounted) setChecking(false);
      }
    }
    checkAccess();
    const { data: { subscription } } = db.auth.onAuthStateChange(() => {
      // Never await a Supabase request inside the Auth event callback.
      setTimeout(checkAccess, 0);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoading(true);
    setReportError("");
    loadInsights(days, environment).then((result) => {
      if (!cancelled) setInsights(result);
    }).catch((error) => {
      if (!cancelled) { setReportError(error.message); setInsights(null); }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days, environment, isAdmin, loadSerial]);

  const report = useMemo(() => insights ? analyze(insights.events, insights.products, days) : null,
    [insights, days]);

  async function login(event) {
    event.preventDefault();
    setSigningIn(true);
    setLoginError("");
    const { error } = await db.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setLoginError("No se pudo iniciar sesión. Revisa los datos de tu acceso al POS.");
    setPassword("");
    setSigningIn(false);
  }

  async function logout() {
    await db.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setInsights(null);
  }

  if (checking) return <div className="ci-root ci-auth"><div className="ci-loading">Verificando acceso seguro…</div></div>;

  if (!user) return <main className="ci-root ci-auth">
    <div className="ci-login-card">
      <div className="ci-brand">D<span>●</span>NATELLO <small>INTELIGENCIA COMERCIAL</small></div>
      <div className="ci-login-mark">◈</div>
      <h1>Una mirada a lo que tus clientes quieren.</h1>
      <p>Un panel privado para entender qué muebles despiertan interés y cuáles generan consultas.</p>
      <form onSubmit={login}>
        <label>Correo del administrador del POS<input type="email" required autoComplete="username"
          value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Correo autorizado" /></label>
        <label>Contraseña<input type="password" required autoComplete="current-password"
          value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" /></label>
        {loginError && <div className="ci-error" role="alert">{loginError}</div>}
        <button className="ci-primary" disabled={signingIn}>{signingIn ? "Ingresando…" : "Entrar al panel privado →"}</button>
      </form>
      <a className="ci-return" href="/">← Volver al catálogo</a>
      <p className="ci-small-note">Las cifras sólo están disponibles para administradores autorizados. No se muestran a los visitantes.</p>
    </div>
  </main>;

  if (!isAdmin) return <main className="ci-root ci-auth"><div className="ci-login-card">
    <div className="ci-brand">DONATELLO <small>PANEL PRIVADO</small></div>
    <h1>Acceso restringido</h1>
    <p>Esta cuenta no tiene permisos administrativos del POS Donatello.</p>
    <button className="ci-primary" onClick={logout}>Cerrar sesión</button>
  </div></main>;

  const items = report?.productsRanked || [];
  const points = report?.points || [];
  const maxBars = Math.max(1, ...points.map((p) => Math.max(p.views, p.whatsapp)));
  const maxSearch = Math.max(1, ...(report?.searchesRanked || []).map((s) => s.count));

  return <main className="ci-root ci-dashboard">
    <header className="ci-header">
      <div className="ci-header-inner">
        <div className="ci-brand">D<span>●</span>NATELLO <small>INTELIGENCIA COMERCIAL</small></div>
        <nav><a href="/">Ver catálogo ↗</a><button onClick={logout}>Salir</button></nav>
      </div>
    </header>
    <div className="ci-container">
      <div className="ci-heading">
        <div><div className="ci-eyebrow">PANEL PRIVADO · DONATELLO</div>
          <h1>Lo que está llamando la atención.</h1>
          <p>Interacciones reales del catálogo. Una consulta es un clic a WhatsApp, <strong>no una venta confirmada.</strong></p>
        </div>
        <button className="ci-refresh" onClick={() => setLoadSerial((n) => n + 1)} disabled={loading}>↻ Actualizar</button>
      </div>

      <section className="ci-filters" aria-label="Filtros de estadísticas">
        <div className="ci-filter-group"><span>Periodo</span>
          {[7, 30, 90].map((n) => <button key={n} className={days === n ? "active" : ""} onClick={() => setDays(n)}>{n} días</button>)}
        </div>
        <div className="ci-filter-group"><span>Origen</span>
          <button className={environment === "preview" ? "active" : ""} onClick={() => setEnvironment("preview")}>Rama de prueba</button>
          <button className={environment === "production" ? "active" : ""} onClick={() => setEnvironment("production")}>Catálogo oficial</button>
        </div>
      </section>

      {environment === "preview" && <div className="ci-notice">🧪 <strong>Modo de prueba:</strong> estas cifras proceden de las interacciones en enlaces de Vercel, separadas del catálogo oficial.</div>}
      {reportError && <div role="alert" className="ci-error">No fue posible consultar las estadísticas: {reportError}</div>}
      {loading && <div className="ci-loading">Consultando interacciones…</div>}

      {report && !loading && <>
        <section className="ci-kpis" aria-label="Resumen comercial">
          <KPI icon="◉" label="Fichas consultadas" count={report.views} detail="Aperturas del detalle de muebles" />
          <KPI icon="↗" label="Clics a WhatsApp" count={report.whatsapp} detail="Intenciones de consulta, no chats recibidos" />
          <KPI icon="♡" label="Favoritos añadidos" count={report.favorites} detail="Veces que guardaron un mueble" />
          <KPI icon="⌕" label="Búsquedas" count={report.searches} detail="Búsquedas realizadas en el catálogo" />
        </section>
        <section className="ci-panels">
          <div className="ci-panel ci-wide">
            <div className="ci-panel-head"><div><div className="ci-overline">COMPORTAMIENTO</div><h2>Interés a lo largo del tiempo</h2></div>
              <div className="ci-legend"><span><i className="ci-dot ci-dot-gold" /> Vistas</span><span><i className="ci-dot ci-dot-dark" /> WhatsApp</span></div>
            </div>
            {report.views + report.whatsapp === 0
              ? <Empty>Aún no hay aperturas o consultas registradas en este periodo.</Empty>
              : <div className="ci-chart">{points.map((point) =>
                  <div className="ci-chart-day" key={point.date} title={point.date + ": " + point.views + " vistas, " + point.whatsapp + " clics"}>
                    <div className="ci-bars">
                      <div className="ci-bar ci-bar-gold" style={{ height: Math.max(0, point.views / maxBars * 100) + "%" }} />
                      <div className="ci-bar ci-bar-dark" style={{ height: Math.max(0, point.whatsapp / maxBars * 100) + "%" }} />
                    </div><span>{point.date.slice(8)}</span>
                  </div>
                )}</div>}
            <p className="ci-footnote">Últimos {Math.min(days, 14)} días del periodo; cada barra representa interacciones, no usuarios únicos.</p>
          </div>
          <div className="ci-panel">
            <div className="ci-panel-head"><div><div className="ci-overline">LO QUE BUSCAN</div><h2>Búsquedas frecuentes</h2></div></div>
            {!report.searchesRanked.length
              ? <Empty>Cuando un cliente use el buscador, aparecerán aquí sus términos más frecuentes.</Empty>
              : <div className="ci-terms">{report.searchesRanked.map((item, index) =>
                  <div key={item.name} className="ci-term">
                    <span className="ci-term-index">{String(index + 1).padStart(2, "0")}</span>
                    <div><div className="ci-term-label">{item.name} <strong>{item.count}</strong></div>
                      <div className="ci-term-track"><div style={{ width: (item.count / maxSearch * 100) + "%" }} /></div>
                    </div>
                  </div>)}</div>}
          </div>
        </section>

        <section className="ci-panel ci-products">
          <div className="ci-panel-head"><div><div className="ci-overline">RANKING COMERCIAL</div><h2>Muebles que despiertan más interés</h2></div>
            <span className="ci-muted">Ordenados por fichas abiertas</span></div>
          {!items.length
            ? <Empty>Aún no hay actividad por mueble. Abre algunos productos en la rama de prueba, consulta uno por WhatsApp y actualiza este panel.</Empty>
            : <div className="ci-table-scroll"><table>
                <thead><tr><th>Producto</th><th>SKU</th><th>Vistas</th><th>WhatsApp</th><th>Favoritos</th><th>Stock actual</th></tr></thead>
                <tbody>{items.slice(0, 15).map((p, i) => <tr key={p.code || p.name}>
                  <td><div className="ci-product-cell"><span className="ci-rank">{String(i + 1).padStart(2, "0")}</span>
                    {p.image ? <img src={p.image} alt="" loading="lazy" /> : <div className="ci-image-empty">D</div>}
                    <div><strong>{p.name}</strong><small>{p.price != null ? money(p.price) : "Precio no disponible"}</small></div>
                  </div></td>
                  <td className="ci-sku">{p.code || "—"}</td>
                  <td className="ci-numeric">{p.views}</td>
                  <td className="ci-numeric">{p.whatsapp}</td>
                  <td className="ci-numeric">{p.favorites}</td>
                  <td>{p.stock == null ? "—" : Number(p.stock) > 0
                    ? <span className="ci-stock-yes">{p.stock} disponible(s)</span>
                    : <span className="ci-stock-no">Agotado</span>}</td>
                </tr>)}</tbody>
              </table></div>}
        </section>

        <section className="ci-panel ci-actions">
          <div className="ci-panel-head"><div><div className="ci-overline">OPORTUNIDADES</div><h2>¿Qué conviene hacer?</h2></div></div>
          {!report.opportunities.length
            ? <Empty>Necesitamos al menos 8 aperturas de una misma ficha antes de sugerir acciones comerciales. Así evitamos recomendaciones apresuradas.</Empty>
            : <div className="ci-opportunity-grid">{report.opportunities.map((p) =>
                <article key={p.code || p.name} className="ci-opportunity">
                  <span className="ci-opportunity-tag">{p.verdict}</span>
                  <strong>{p.name}</strong>
                  <div>{p.views} aperturas · {p.whatsapp} clics a WhatsApp</div>
                  <p>{p.reason}</p>
                </article>)}</div>}
          <p className="ci-footnote">Las sugerencias son heurísticas basadas en interacción, no predicciones de ventas. El stock y las ventas deben confirmarse en el POS.</p>
        </section>

        {insights?.truncated && <div className="ci-notice">Se alcanzó el límite de 5,000 eventos. Este panel puede mostrar cifras parciales para el periodo seleccionado.</div>}
        <footer className="ci-footer"><span>{formatNumber(report.sessions)} cargas del catálogo · {formatNumber(report.shares)} acciones de compartir producto</span>
          <span>Datos nuevos desde el inicio de la medición propia · Sin información personal del visitante</span></footer>
      </>}
    </div>
  </main>;
}
