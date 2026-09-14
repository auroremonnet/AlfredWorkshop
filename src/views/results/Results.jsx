import { C } from "../../constants.js";
import { Header } from "../../components/Header.jsx";
import { ErrorBanner } from "../../components/ui.jsx";
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
  nav, openTicket,
  tickets, error, clearError,
  kpis, addKpi, updateKpi, deleteKpi,
  decisions, addDecision, updateDecision, deleteDecision,
  reviews, addReview, updateReview, deleteReview,
}) {
  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <Header {...nav} title="Mesure des résultats" subtitle="KPIs · Décisions · Weekly reviews" />

      <ErrorBanner error={error} onDismiss={clearError} />

      <div style={{ padding: "20px 28px", maxWidth: 1400, margin: "0 auto" }}>
        <KpiBoard kpis={kpis} addKpi={addKpi} updateKpi={updateKpi} deleteKpi={deleteKpi} />
        <DecisionLog
          tickets={tickets}
          openTicket={openTicket}
          decisions={decisions}
          addDecision={addDecision}
          updateDecision={updateDecision}
          deleteDecision={deleteDecision}
        />
        <WeeklyReviews
          reviews={reviews}
          addReview={addReview}
          updateReview={updateReview}
          deleteReview={deleteReview}
        />
      </div>
    </div>
  );
}
