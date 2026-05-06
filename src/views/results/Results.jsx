import { C } from "../../constants.js";
import { Header } from "../../components/Header.jsx";
import KpiBoard from "./KpiBoard.jsx";
import DecisionLog from "./DecisionLog.jsx";
import WeeklyReviews from "./WeeklyReviews.jsx";

// ═══════════════════════════════════════════════════════════════
// RESULTS — onglet "Résultats" (KPIs · Décisions · Weekly reviews)
//
// Les tickets viennent en prop depuis le shell (source unique de
// vérité, fetched via useTickets) → données toujours fraîches.
// ═══════════════════════════════════════════════════════════════
export default function Results({
  view, setView, openTicket, userEmail, onSignOut,
  tickets, error, clearError,
}) {
  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <Header
        view={view}
        setView={setView}
        title="Mesure des résultats"
        subtitle="KPIs · Décisions · Weekly reviews"
        userEmail={userEmail}
        onSignOut={onSignOut}
      />

      <ErrorBanner error={error} onDismiss={clearError} />

      <div style={{ padding: "20px 28px", maxWidth: 1400, margin: "0 auto" }}>
        <KpiBoard />
        <DecisionLog tickets={tickets} openTicket={openTicket} />
        <WeeklyReviews />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ERROR BANNER — sticky, dismissible (cohérent avec Workspace)
// ═══════════════════════════════════════════════════════════════
function ErrorBanner({ error, onDismiss }) {
  if (!error) return null;
  return (
    <div style={{
      position: "sticky", top: 64, zIndex: 49,
      padding: "10px 28px", background: "rgba(199,62,71,0.08)",
      borderBottom: "1px solid rgba(199,62,71,0.3)", color: "#C73E47",
      display: "flex", alignItems: "center", gap: 12, fontSize: 13, fontWeight: 600,
    }}>
      <span>⚠</span>
      <span style={{ flex: 1 }}>{error}</span>
      <button onClick={onDismiss} style={{
        background: "transparent", border: "none", color: "#C73E47",
        cursor: "pointer", fontSize: 16, padding: "0 6px", fontFamily: "inherit",
      }}>✕</button>
    </div>
  );
}
