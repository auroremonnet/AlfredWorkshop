import { useState, useEffect } from "react";
import { C } from "./constants.js";
import { supabase } from "./lib/supabase.js";
import { useTickets } from "./hooks/useTickets.js";
import { AlfredBowtie, Btn } from "./components/ui.jsx";
import Login from "./components/Login.jsx";
import Workspace from "./views/Workspace.jsx";
import Results from "./views/results/Results.jsx";

// ═══════════════════════════════════════════════════════════════
// SHELL — gestion de la session Supabase + routing entre les vues
//
// session === undefined : on charge la session initiale
// session === null      : pas connecté → écran de login
// session truthy        : connecté → <AuthedApp /> qui charge les tickets
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

  // signOut ne touche PAS au localStorage : KPIs/décisions/reviews
  // restent intacts (migration future, pas une suppression).
  return <AuthedApp session={session} onSignOut={() => supabase.auth.signOut()} />;
}

// ═══════════════════════════════════════════════════════════════
// AUTHED APP — toujours monté quand l'utilisateur est connecté.
// Charge les tickets via useTickets et les distribue aux vues.
// ═══════════════════════════════════════════════════════════════
function AuthedApp({ session, onSignOut }) {
  const [view, setView] = useState("workspace");
  const [pendingTicketId, setPendingTicketId] = useState(null);
  const {
    tickets, loading, error,
    addTicket, updateTicket, deleteTicket, resetToDefaults,
    refetch, clearError,
  } = useTickets();

  const openTicket = (id) => {
    setPendingTicketId(id);
    setView("workspace");
  };

  // Fetch initial en cours OU reset en cours
  if (tickets === null && loading) {
    return <FullScreenBowtie />;
  }

  // Fetch initial échoué (tickets toujours null après loading=false)
  if (tickets === null && error) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: C.bg, padding: 24, textAlign: "center", gap: 18,
      }}>
        <AlfredBowtie size={48} withText />
        <div style={{ color: C.text, fontSize: 16, fontWeight: 700, fontFamily: "'Georgia', serif", marginTop: 12 }}>
          Impossible de charger les tickets
        </div>
        <div style={{ color: C.textMuted, fontSize: 13, maxWidth: 400 }}>{error}</div>
        <Btn variant="champagne" onClick={refetch}>↻ Réessayer</Btn>
      </div>
    );
  }

  const userEmail = session.user?.email;

  return view === "workspace" ? (
    <Workspace
      view={view}
      setView={setView}
      pendingTicketId={pendingTicketId}
      clearPendingTicket={() => setPendingTicketId(null)}
      userEmail={userEmail}
      onSignOut={onSignOut}
      tickets={tickets}
      addTicket={addTicket}
      updateTicket={updateTicket}
      deleteTicket={deleteTicket}
      resetToDefaults={resetToDefaults}
      error={error}
      clearError={clearError}
    />
  ) : (
    <Results
      view={view}
      setView={setView}
      openTicket={openTicket}
      userEmail={userEmail}
      onSignOut={onSignOut}
      tickets={tickets}
      error={error}
      clearError={clearError}
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
