import { useState, useEffect } from "react";
import { C } from "./constants.js";
import { supabase } from "./lib/supabase.js";
import { AlfredBowtie } from "./components/ui.jsx";
import Login from "./components/Login.jsx";
import Workspace from "./views/Workspace.jsx";
import Results from "./views/results/Results.jsx";

// ═══════════════════════════════════════════════════════════════
// SHELL — gestion de la session Supabase + routing entre les vues
//
// session === undefined : on charge la session initiale
// session === null      : pas connecté → écran de login
// session truthy        : connecté → app normale
// ═══════════════════════════════════════════════════════════════
export default function AlfredWorkspace() {
  const [view, setView] = useState("workspace");
  const [pendingTicketId, setPendingTicketId] = useState(null);
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

  // signOut ne touche PAS au localStorage : tickets/KPIs/décisions/reviews
  // restent intacts. Migration future, pas une suppression.
  const onSignOut = () => supabase.auth.signOut();

  const openTicket = (id) => {
    setPendingTicketId(id);
    setView("workspace");
  };

  if (session === undefined) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg,
      }}>
        <AlfredBowtie size={60} withText />
      </div>
    );
  }

  if (session === null) {
    return <Login />;
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
    />
  ) : (
    <Results
      view={view}
      setView={setView}
      openTicket={openTicket}
      userEmail={userEmail}
      onSignOut={onSignOut}
    />
  );
}
