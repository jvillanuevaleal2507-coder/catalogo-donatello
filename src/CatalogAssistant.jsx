import { useEffect, useRef, useState } from "react";
import "./CatalogAssistant.css";

const ENDPOINT = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "") +
  "/functions/v1/donatello-catalog-assistant";
const WHATSAPP = "https://wa.me/528999122313?text=" +
  encodeURIComponent("Hola, vi el catálogo de Donatello y quisiera información.");
const QUICK = ["Sillones", "Lámparas", "Mesas", "Ubicación", "Horario"];

function formatPrice(value) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 2 })
    .format(Number(value) || 0);
}

export default function CatalogAssistant() {
  const [opened, setOpened] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    { id: "welcome", role: "bot", text: "¡Hola! 👋 Soy el asistente de Donatello. Te ayudo a encontrar muebles, consultar precios del catálogo y conocer nuestra ubicación y horario. ¿Qué estás buscando?", products: [] },
  ]);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const callRef = useRef(null);

  useEffect(() => {
    if (!opened) return undefined;
    inputRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpened(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [opened]);

  useEffect(() => {
    if (!opened || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, opened, busy]);

  useEffect(() => () => callRef.current?.abort(), []);

  async function send(text) {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    setOpened(true);
    setBusy(true);
    setMessages((existing) => [...existing, { id: "q-" + Date.now(), role: "user", text: value, products: [] }]);
    const controller = new AbortController();
    callRef.current = controller;
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok && response.status !== 429) throw new Error("Respuesta no disponible");
      setMessages((existing) => [...existing, {
        id: "a-" + Date.now(),
        role: "bot",
        text: String(data.reply || "Por ahora no pude consultar los productos. Escríbenos por WhatsApp."),
        products: Array.isArray(data.products) ? data.products.slice(0, 4) : [],
      }]);
    } catch (error) {
      if (error?.name !== "AbortError") {
        setMessages((existing) => [...existing, {
          id: "e-" + Date.now(), role: "bot",
          text: "No pude consultar el catálogo en este momento. Podemos ayudarte por WhatsApp.",
          products: [],
        }]);
      }
    } finally {
      callRef.current = null;
      setBusy(false);
    }
  }

  return (
    <div className={"dchat-root" + (opened ? " dchat-opened" : "")}>
      {!opened && (
        <button className="dchat-launch" type="button" onClick={() => setOpened(true)}
          aria-label="Abrir asistente de Donatello">
          <span className="dchat-launch-symbol" aria-hidden="true">✦</span>
          <span>¿Buscas algo?</span>
        </button>
      )}
      {opened && (
        <section className="dchat-panel" role="dialog" aria-label="Asistente del catálogo Donatello">
          <header className="dchat-header">
            <div className="dchat-avatar" aria-hidden="true">D</div>
            <div className="dchat-heading">
              <strong>Asistente Donatello</strong>
              <span>Productos y precios del catálogo</span>
            </div>
            <button className="dchat-close" type="button" onClick={() => setOpened(false)}
              aria-label="Cerrar asistente">×</button>
          </header>
          <div className="dchat-messages" ref={listRef} aria-live="polite" aria-relevant="additions">
            {messages.map((item) => (
              <div key={item.id} className={"dchat-message dchat-" + item.role}>
                <p>{item.text}</p>
                {item.products?.length > 0 && (
                  <div className="dchat-products">
                    {item.products.map((product) => (
                      <a className="dchat-product" href={product.url}
                        key={product.id} aria-label={"Ver " + product.name + " en el catálogo"}>
                        <span className="dchat-product-name">{product.name}</span>
                        <span className="dchat-product-meta">{formatPrice(product.price)} <span aria-hidden="true">↗</span></span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="dchat-message dchat-bot dchat-thinking">Buscando en el catálogo…</div>}
          </div>
          <div className="dchat-quick" aria-label="Consultas rápidas">
            {QUICK.map((text) => (
              <button key={text} type="button" disabled={busy} onClick={() => send(text)}>{text}</button>
            ))}
          </div>
          <form className="dchat-compose" onSubmit={(event) => { event.preventDefault(); send(input); }}>
            <label className="dchat-sr" htmlFor="dchat-input">Escribe tu pregunta</label>
            <input id="dchat-input" ref={inputRef} maxLength={300} value={input}
              disabled={busy} onChange={(event) => setInput(event.target.value)}
              placeholder="Ej. ¿Tienen mecedoras?" autoComplete="off" />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Enviar pregunta">➤</button>
          </form>
          <a className="dchat-whatsapp" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
            ¿Prefieres atención personal? Escríbenos por WhatsApp
          </a>
          <p className="dchat-footnote">Precios y existencia sujetos a confirmación. No compartas datos personales en este chat.</p>
        </section>
      )}
    </div>
  );
}
