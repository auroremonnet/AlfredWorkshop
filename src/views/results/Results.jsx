import { useState } from "react";
import { C } from "../../constants.js";
import { Header } from "../../components/Header.jsx";
import KpiBoard from "./KpiBoard.jsx";
import DecisionLog from "./DecisionLog.jsx";
import WeeklyReviews from "./WeeklyReviews.jsx";

// Lecture seule des tickets pour le select des décisions.
// On ne souscrit pas aux changements de l'autre vue : si l'utilisateur
// modifie un ticket dans Workspace puis revient sur Résultats, la liste
// est rafraîchie au remount.
const readTickets = () => {
  try {
    const raw = localStorage.getItem("alfred-tickets-v2");
    return raw ? JSON.parse(raw) || [] : [];
  } catch {
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════
// RESULTS — onglet "Résultats" (KPIs · Décisions · Weekly reviews)
// ═══════════════════════════════════════════════════════════════
export default function Results({ view, setView, openTicket }) {
  const [tickets] = useState(readTickets);

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <Header view={view} setView={setView} title="Mesure des résultats" subtitle="KPIs · Décisions · Weekly reviews" />

      <div style={{ padding: "20px 28px", maxWidth: 1400, margin: "0 auto" }}>
        <KpiBoard />
        <DecisionLog tickets={tickets} openTicket={openTicket} />
        <WeeklyReviews />
      </div>
    </div>
  );
}
