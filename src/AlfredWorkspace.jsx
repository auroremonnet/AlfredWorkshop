import { useState, useEffect } from "react";
import { C } from "./constants.js";
import { supabase } from "./lib/supabase.js";
import { useTickets } from "./hooks/useTickets.js";
import { useKpis } from "./hooks/useKpis.js";
import { AlfredBowtie, Btn } from "./components/ui.jsx";
import Login from "./components/Login.jsx";
import Workspace from "./views/Workspace.jsx";
import Results from "./views/results/Results.jsx";

// ═══════════════════════════════════════════════════════════════
// SHELL — gestion de la session Supabase + routing entre les vues
//
// session === undefined : on charge la session initiale
// session === null      : pas connecté → écran de login
// session truthy        : connecté → <AuthedApp /> qui charge les données
// ═══════════════════════════════════════════════════════════════
export default function AlfredWorkspace() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) setSession(s ?? null);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (session === undefined) {
    return <FullScreenBowtie />;
  }

  if (session === null) {
    return <Login />;
  }

  return <AuthedApp session={session} onSignOut={() => supabase.auth.signOut()} />;
}

// ═══════════════════════════════════════════════════════════════
// AUTHED APP — toujours monté quand l'utilisateur est connecté.
// Charge tickets + KPIs via leurs hooks Supabase et les distribue.
// ═══════════════════════════════════════════════════════════════
function AuthedApp({ session, onSignOut }) {
  const [view, setView] = useState("workspace");
  const [pendingTicketId, setPendingTicketId] = useState(null);

  // Tickets : source unique de vérité, partagée entre Workspace et Results.
  const ticketsHook = useTickets();

  // KPIs : ne bloquent pas l'affichage initial. KpiBoard montre un mini-
  // loader pendant kpis === null et l'app reste utilisable autour.
  const kpisHook = useKpis();

  const openTicket = (id) => {
    setPendingTicketId(id);
    setView("workspace");
  };

  // Bloquant : on attend les tickets pour afficher quoi que ce soit
  // (la majorité de l'app dépend d'eux).
  if (ticketsHook.tickets === null && ticketsHook.loading) {
    return <FullScreenBowtie />;
  }
  if (ticketsHook.tickets === null && ticketsHook.error) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: C.bg, padding: 24, textAlign: "center", gap: 18,
      }}>
        <AlfredBowtie size={48} withText />
        <div style={{ color: C.text, fontSize: 16, fontWeight: 700, fontFamily: "'Georgia', serif", marginTop: 12 }}>
          Impossible de charger les tickets
        </div>
        <div style={{ color: C.textMuted, fontSize: 13, maxWidth: 400 }}>{ticketsHook.error}</div>
        <Btn variant="champagne" onClick={ticketsHook.refetch}>↻ Réessayer</Btn>
      </div>
    );
  }

  const userEmail = session.user?.email;

  // Erreur Results = première erreur non-null parmi les hooks Results
  // (pour l'instant juste KPIs ; décisions et reviews seront ajoutées
  // au commit suivant). clearResultsError clear toutes les sources.
  const resultsError = kpisHook.error;
  const clearResultsError = () => {
    kpisHook.clearError();
  };

  return view === "workspace" ? (
    <Workspace
      view={view}
      setView={setView}
      pendingTicketId={pendingTicketId}
      clearPendingTicket={() => setPendingTicketId(null)}
      userEmail={userEmail}
      onSignOut={onSignOut}
      tickets={ticketsHook.tickets}
      addTicket={ticketsHook.addTicket}
      updateTicket={ticketsHook.updateTicket}
      deleteTicket={ticketsHook.deleteTicket}
      resetToDefaults={ticketsHook.resetToDefaults}
      error={ticketsHook.error}
      clearError={ticketsHook.clearError}
    />
  ) : (
    <Results
      view={view}
      setView={setView}
      openTicket={openTicket}
      userEmail={userEmail}
      onSignOut={onSignOut}
      tickets={ticketsHook.tickets}
      kpis={kpisHook.kpis}
      addKpi={kpisHook.addKpi}
      updateKpi={kpisHook.updateKpi}
      deleteKpi={kpisHook.deleteKpi}
      error={resultsError}
      clearError={clearResultsError}
    />
  );
}

const FullScreenBowtie = () => (
  <div style={{
    height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg,
  }}>
    <AlfredBowtie size={60} withText />
  </div>
);
