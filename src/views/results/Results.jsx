import { C } from "../../constants.js";
import { Header } from "../../components/Header.jsx";

// ═══════════════════════════════════════════════════════════════
// RESULTS — onglet "Résultats" (KPIs · Décisions · Weekly reviews)
// ═══════════════════════════════════════════════════════════════
export default function Results({ view, setView }) {
  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <Header view={view} setView={setView} title="Mesure des résultats" subtitle="KPIs · Décisions · Weekly reviews" />

      <div style={{ padding: "20px 28px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ textAlign: "center", padding: 80, color: C.textDim, fontSize: 14 }}>
          Section en cours de construction.
        </div>
      </div>
    </div>
  );
}
