import { useState, useEffect, useCallback } from "react";
import { C, STATUSES } from "./constants.js";
import { supabase } from "./lib/supabase.js";
import { weeklySprintDraft, mondayOfISO, addDays, today } from "./lib/dates.js";
import { useTickets } from "./hooks/useTickets.js";
import { useSprints } from "./hooks/useSprints.js";
import { useKpis } from "./hooks/useKpis.js";
import { useDecisions } from "./hooks/useDecisions.js";
import { useReviews } from "./hooks/useReviews.js";
import { useRealtime } from "./hooks/useRealtime.js";
import { usePersistedState } from "./hooks/usePersistedState.js";
import { AlfredBowtie, Btn } from "./components/ui.jsx";
import { TicketModal } from "./components/TicketModal.jsx";
import { SprintModal, CloseSprintModal } from "./components/SprintModals.jsx";
import Login from "./components/Login.jsx";
import SprintBoard from "./views/SprintBoard.jsx";
import Backlog from "./views/Backlog.jsx";
import Workspace from "./views/Workspace.jsx";
import Results from "./views/results/Results.jsx";

// ═══════════════════════════════════════════════════════════════
// SHELL — gestion de la session Supabase + routing entre les vues
//
// session === undefined : on charge la session initiale
// session === null      : pas connecté → écran de login
// session truthy        : connecté → <AuthedApp />
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

  if (session === undefined) return <FullScreenBowtie />;
  if (session === null) return <Login />;
  return <MemberGate session={session} onSignOut={() => supabase.auth.signOut()} />;
}

// ═══════════════════════════════════════════════════════════════
// MEMBER GATE — l'accès aux données est réservé aux emails listés
// dans public.team_members (vérifié côté base par RLS). Ici on affiche
// juste un message clair au lieu d'un workspace vide.
// ═══════════════════════════════════════════════════════════════
function MemberGate({ session, onSignOut }) {
  const [isMember, setIsMember] = useState(undefined);

  useEffect(() => {
    supabase.rpc("is_team_member").then(({ data, error }) => {
      // Fonction absente (ancienne base) → on ne bloque pas
      setIsMember(error ? true : data === true);
    });
  }, [session.user?.id]);

  if (isMember === undefined) return <FullScreenBowtie />;
  if (!isMember) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: C.bg, padding: 24, textAlign: "center", gap: 14,
      }}>
        <AlfredBowtie size={48} withText />
        <div style={{ color: C.text, fontSize: 18, fontWeight: 700, fontFamily: "'Georgia', serif", marginTop: 12 }}>
          Accès réservé à l'équipe Alfred
        </div>
        <div style={{ color: C.textMuted, fontSize: 14, maxWidth: 440, lineHeight: 1.6 }}>
          Tu es connecté avec <strong>{session.user?.email}</strong>, qui n'est pas dans la liste de l'équipe.
          Demande à un membre de l'ajouter dans Supabase (table <code>team_members</code>), puis recharge la page.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => window.location.reload()}>↻ Recharger</Btn>
          <Btn variant="primary" onClick={onSignOut}>Changer de compte</Btn>
        </div>
      </div>
    );
  }
  return <AuthedApp session={session} onSignOut={onSignOut} />;
}

// ═══════════════════════════════════════════════════════════════
// AUTHED APP
//
// Vues : sprint (défaut) · backlog · workspace (roadmap) · results
// La fiche ticket et les modales de sprint sont GLOBALES : n'importe
// quelle vue les ouvre via onOpenTicket / onEditSprint / onRequestClose.
// ═══════════════════════════════════════════════════════════════
function AuthedApp({ session, onSignOut }) {
  const [view, setView] = usePersistedState("alfred-view", "sprint");
  const [me, setMe] = usePersistedState("alfred-me", null);
  const [openTicketId, setOpenTicketId] = useState(null);
  const [editingSprint, setEditingSprint] = useState(null);
  const [closingSprint, setClosingSprint] = useState(null);

  const ticketsHook = useTickets();
  const sprintsHook = useSprints();
  const kpisHook = useKpis();
  const decisionsHook = useDecisions(ticketsHook.tickets);
  const reviewsHook = useReviews();

  const liveStatus = useRealtime({
    tickets: ticketsHook.silentRefetch,
    sprints: sprintsHook.silentRefetch,
  });

  const tickets = ticketsHook.tickets || [];
  const sprints = sprintsHook.sprints || [];
  const ticketsApi = {
    tickets,
    moveTickets: ticketsHook.moveTickets,
    silentRefetch: ticketsHook.silentRefetch,
  };

  // ─── Tickets ─────────────────────────────────────────────────
  const onOpenTicket = useCallback((id) => { if (id) setOpenTicketId(id); }, []);

  const nextTicketCode = () => {
    const nums = tickets.map((t) => parseInt(t.id.replace(/\D/g, ""), 10)).filter((n) => !isNaN(n));
    return `T${String(nums.length ? Math.max(...nums) + 1 : 1).padStart(3, "0")}`;
  };

  // Création rapide (Sprint / Backlog). Workspace passe ses filtres en defaults.
  const quickAdd = (sprintId = null, defaults = {}) => {
    const t = {
      id: nextTicketCode(),
      phase: "p0", title: "Nouveau ticket", desc: "", notes: "",
      fib: 3, status: "todo", deps: "", quadrant: "schedule",
      assignee: me || "unassigned",
      sprintId,
      ...defaults,
    };
    ticketsHook.addTicket(t);
    setOpenTicketId(t.id);
  };

  // ─── Sprints ─────────────────────────────────────────────────
  // Prochaine semaine libre : après le dernier sprint ouvert, sinon
  // la semaine en cours (ou la suivante si elle est déjà close).
  const nextFreeMonday = () => {
    const open = sprints.filter((s) => s.status !== "closed");
    if (open.length) {
      const lastEnd = open.map((s) => s.endDate).sort().pop();
      return mondayOfISO(addDays(lastEnd, 1));
    }
    const closedNow = sprints.some((s) => s.status === "closed" && s.startDate <= today() && s.endDate >= today());
    return closedNow ? addDays(mondayOfISO(), 7) : mondayOfISO();
  };

  const onNewSprint = () => setEditingSprint(weeklySprintDraft(nextFreeMonday()));

  const onCreateWeeklySprint = async (monday) => {
    const created = await sprintsHook.addSprint(weeklySprintDraft(monday));
    if (created) setView("backlog");
  };

  const onSaveSprint = (s) => (s.id ? sprintsHook.updateSprint(s) : sprintsHook.addSprint(s));
  const onDeleteSprint = (id) => sprintsHook.deleteSprint(id, ticketsApi);

  const onStartSprint = async (s) => {
    const ok = await sprintsHook.startSprint(s, ticketsApi);
    if (ok) setView("sprint");
  };

  const reviewWeek = (sprint) => mondayOfISO(sprint.startDate);
  const reviewExists = (sprint) => (reviewsHook.reviews || []).some((r) => r.weekOf === reviewWeek(sprint));

  const onConfirmClose = async ({ moveTo, createReview }) => {
    const sprint = closingSprint;
    const inSprint = tickets.filter((t) => t.sprintId === sprint.id);
    const done = inSprint.filter((t) => t.status === "done");
    const blocked = inSprint.filter((t) => t.status === "blocked");
    const leftover = inSprint.filter((t) => t.status !== "done");

    // Destination des tickets non terminés
    let target = null;
    let targetSprint = null;
    if (moveTo === "new") {
      targetSprint = await sprintsHook.addSprint(weeklySprintDraft(mondayOfISO(addDays(sprint.endDate, 1))));
      if (!targetSprint) return;
      target = targetSprint.id;
    } else if (moveTo && moveTo !== "backlog") {
      target = moveTo;
      targetSprint = sprints.find((s) => s.id === moveTo) || null;
    }

    const ok = await sprintsHook.closeSprint(sprint, { moveTo: target }, ticketsApi);
    if (!ok) return;

    if (createReview) {
      const line = (t) => `• ${t.id} — ${t.title}`;
      const statusLabel = (id) => STATUSES.find((s) => s.id === id)?.label.toLowerCase();
      const nextList = tickets.filter((t) => target && (t.sprintId === target || leftover.some((l) => l.id === t.id)));
      await reviewsHook.addReview({
        weekOf: reviewWeek(sprint),
        progress: [
          `${sprint.name} : ${done.reduce((s, t) => s + (t.fib || 0), 0)} pts livrés sur ${inSprint.reduce((s, t) => s + (t.fib || 0), 0)}.`,
          sprint.goal ? `Objectif : ${sprint.goal}` : "",
          ...done.map(line),
        ].filter(Boolean).join("\n"),
        blockers: [
          ...blocked.map(line),
          ...leftover.filter((t) => t.status !== "blocked").map((t) => `${line(t)} (${statusLabel(t.status)}, reporté)`),
        ].join("\n") || "Aucun blocage.",
        nextPriorities: targetSprint
          ? [`${targetSprint.name}${targetSprint.goal ? ` — ${targetSprint.goal}` : ""}`, ...nextList.map(line)].join("\n")
          : "Tickets non terminés renvoyés au backlog : à replanifier.",
      });
    }
    setClosingSprint(null);
  };

  // ─── Chargement initial ──────────────────────────────────────
  if (ticketsHook.tickets === null && ticketsHook.loading) return <FullScreenBowtie />;
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
        <div style={{ color: C.textMuted, fontSize: 13, maxWidth: 420 }}>{ticketsHook.error}</div>
        <Btn variant="champagne" onClick={ticketsHook.refetch}>↻ Réessayer</Btn>
      </div>
    );
  }

  const userEmail = session.user?.email;
  const nav = { view, setView, userEmail, onSignOut, me, setMe, liveStatus };

  const planningError = ticketsHook.error || sprintsHook.error;
  const clearPlanningError = () => { ticketsHook.clearError(); sprintsHook.clearError(); };

  const resultsError = kpisHook.error || decisionsHook.error || reviewsHook.error;
  const clearResultsError = () => {
    kpisHook.clearError();
    decisionsHook.clearError();
    reviewsHook.clearError();
  };

  const sprintProps = {
    nav, tickets, sprints, me, onOpenTicket,
    onQuickAdd: (sprintId) => quickAdd(sprintId),
    onNewSprint, onCreateWeeklySprint, onStartSprint,
    onEditSprint: setEditingSprint,
    onRequestClose: setClosingSprint,
    error: planningError, clearError: clearPlanningError,
  };

  const openTicket = tickets.find((t) => t.id === openTicketId);

  return (
    <>
      {view === "sprint" && <SprintBoard {...sprintProps} updateTicket={ticketsHook.updateTicket} />}

      {view === "backlog" && <Backlog {...sprintProps} moveTickets={ticketsHook.moveTickets} />}

      {view === "workspace" && (
        <Workspace
          nav={nav}
          tickets={tickets}
          sprints={sprints}
          onOpenTicket={onOpenTicket}
          onQuickAdd={(defaults) => quickAdd(null, defaults)}
          updateTicket={ticketsHook.updateTicket}
          resetToDefaults={ticketsHook.resetToDefaults}
          error={planningError}
          clearError={clearPlanningError}
        />
      )}

      {view === "results" && (
        <Results
          nav={nav}
          openTicket={onOpenTicket}
          tickets={tickets}
          kpis={kpisHook.kpis}
          addKpi={kpisHook.addKpi}
          updateKpi={kpisHook.updateKpi}
          deleteKpi={kpisHook.deleteKpi}
          decisions={decisionsHook.decisions}
          addDecision={decisionsHook.addDecision}
          updateDecision={decisionsHook.updateDecision}
          deleteDecision={decisionsHook.deleteDecision}
          reviews={reviewsHook.reviews}
          addReview={reviewsHook.addReview}
          updateReview={reviewsHook.updateReview}
          deleteReview={reviewsHook.deleteReview}
          error={resultsError}
          clearError={clearResultsError}
        />
      )}

      {/* ═══ MODALES GLOBALES ═══ */}
      {openTicket && (
        <TicketModal
          ticket={openTicket}
          sprints={sprints}
          me={me}
          userEmail={userEmail}
          onClose={() => setOpenTicketId(null)}
          onSave={ticketsHook.updateTicket}
          onDelete={ticketsHook.deleteTicket}
        />
      )}

      {editingSprint && (
        <SprintModal
          sprint={editingSprint}
          onClose={() => setEditingSprint(null)}
          onSave={onSaveSprint}
          onDelete={onDeleteSprint}
        />
      )}

      {closingSprint && (
        <CloseSprintModal
          sprint={closingSprint}
          tickets={tickets}
          sprints={sprints}
          reviewExists={reviewExists(closingSprint)}
          onClose={() => setClosingSprint(null)}
          onConfirm={onConfirmClose}
        />
      )}
    </>
  );
}

const FullScreenBowtie = () => (
  <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
    <AlfredBowtie size={60} withText />
  </div>
);
