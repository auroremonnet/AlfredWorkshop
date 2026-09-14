import { useState, useMemo } from "react";
import { C, PHASES, QUADRANTS, STATUSES, MEMBERS, selectStyle } from "../constants.js";
import { formatRange } from "../lib/dates.js";
import { Btn, Avatar, FibBadge, StatusPill, ErrorBanner } from "../components/ui.jsx";
import { Header } from "../components/Header.jsx";
import { Velocity } from "../components/SprintCharts.jsx";
import { Panel } from "./SprintBoard.jsx";

// ═══════════════════════════════════════════════════════════════
// BACKLOG — planification (façon Jira)
//
// Sprint actif · sprints planifiés · backlog. On remplit le sprint de
// la semaine en glissant des tickets, via le menu « Déplacer » de
// chaque ligne, ou en sélection multiple.
// ═══════════════════════════════════════════════════════════════
const pts = (list) => list.reduce((s, t) => s + (t.fib || 0), 0);
const QUAD_ORDER = Object.fromEntries(QUADRANTS.map((q, i) => [q.id, i]));
const PHASE_ORDER = Object.fromEntries(PHASES.map((p, i) => [p.id, i]));

const SORTS = {
  priority: (a, b) => (QUAD_ORDER[a.quadrant] - QUAD_ORDER[b.quadrant]) || (PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase]) || a.id.localeCompare(b.id),
  phase: (a, b) => (PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase]) || (QUAD_ORDER[a.quadrant] - QUAD_ORDER[b.quadrant]) || a.id.localeCompare(b.id),
  id: (a, b) => a.id.localeCompare(b.id),
};

export default function Backlog({
  nav, tickets, sprints, me,
  onOpenTicket, moveTickets, onQuickAdd, onNewSprint, onEditSprint, onStartSprint, onRequestClose,
  error, clearError,
}) {
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState("all");
  const [member, setMember] = useState("all");
  const [quadrant, setQuadrant] = useState("all");
  const [showDone, setShowDone] = useState(false);
  const [sort, setSort] = useState("priority");
  const [collapsed, setCollapsed] = useState(() => new Set(["closed"]));
  const [selected, setSelected] = useState(() => new Set());
  const [bulkTarget, setBulkTarget] = useState("");
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null);

  const active = sprints.find((s) => s.status === "active");
  const planned = sprints.filter((s) => s.status === "planned");
  const closed = sprints.filter((s) => s.status === "closed").slice().reverse();
  const openSprints = [active, ...planned].filter(Boolean);
  const sprintIds = new Set(sprints.map((s) => s.id));

  const recentClosed = sprints.filter((s) => s.status === "closed").slice(-3);
  const avgVelocity = recentClosed.length
    ? Math.round(recentClosed.reduce((s, x) => s + (x.completedPoints || 0), 0) / recentClosed.length)
    : null;

  const matches = useMemo(() => (t) => {
    if (phase !== "all" && t.phase !== phase) return false;
    if (quadrant !== "all" && t.quadrant !== quadrant) return false;
    if (member === "me" && t.assignee !== me) return false;
    if (member !== "all" && member !== "me" && t.assignee !== member) return false;
    if (search && !`${t.id} ${t.title} ${t.desc}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }, [phase, quadrant, member, search, me]);

  const listFor = (sprintId) => tickets
    .filter((t) => (sprintId ? t.sprintId === sprintId : !t.sprintId || !sprintIds.has(t.sprintId)))
    .filter((t) => (sprintId ? true : showDone || t.status !== "done"))
    .filter(matches)
    .sort(SORTS[sort]);

  const toggle = (key) => setCollapsed((prev) => {
    const n = new Set(prev);
    if (n.has(key)) n.delete(key); else n.add(key);
    return n;
  });

  const toggleSelect = (id) => setSelected((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const move = (ids, target) => moveTickets(ids, target === "backlog" || !target ? null : target);

  const dropZone = (key, target) => ({
    onDragOver: (e) => { e.preventDefault(); if (over !== key) setOver(key); },
    onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); },
    onDrop: (e) => {
      e.preventDefault();
      setOver(null);
      const id = e.dataTransfer.getData("text/plain") || dragId;
      setDragId(null);
      const t = tickets.find((x) => x.id === id);
      if (!t) return;
      const dest = target === "backlog" ? null : target;
      if ((t.sprintId || null) === dest) return;
      // Glisser un ticket sélectionné déplace toute la sélection
      const ids = selected.has(id) ? [...selected] : [id];
      move(ids, target);
      if (selected.has(id)) setSelected(new Set());
    },
  });

  const destinations = [
    ...openSprints.map((s) => ({ id: s.id, label: `${s.status === "active" ? "● " : ""}${s.name} (${formatRange(s.startDate, s.endDate)})` })),
    { id: "backlog", label: "Backlog" },
  ];

  const row = (t, currentKey) => (
    <div key={t.id}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "move"; setDragId(t.id); }}
      onDragEnd={() => { setDragId(null); setOver(null); }}
      style={{
        display: "grid", gridTemplateColumns: "18px 22px 52px minmax(0,1fr) auto auto auto auto 150px",
        gap: 10, alignItems: "center", padding: "7px 10px",
        background: selected.has(t.id) ? `${C.champagne}14` : C.bgCard,
        borderBottom: `1px solid ${C.borderSubtle}`, opacity: dragId === t.id ? 0.4 : 1,
      }}
      className="bl-row"
    >
      <span title="Glisser pour déplacer" style={{ cursor: "grab", color: C.textDim, fontSize: 12, userSelect: "none" }}>⋮⋮</span>
      <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} aria-label={`Sélectionner ${t.id}`} />
      <button onClick={() => onOpenTicket(t.id)} style={{ ...plainBtn, color: C.champagneDeep, fontWeight: 700, fontFamily: "'Georgia', serif", fontSize: 11, textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.id}</button>
      <button onClick={() => onOpenTicket(t.id)} style={{ ...plainBtn, textAlign: "left", color: C.text, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.title}>
        {t.title}
      </button>
      <span title={QUADRANTS.find((q) => q.id === t.quadrant)?.label} style={{ fontSize: 12 }}>{QUADRANTS.find((q) => q.id === t.quadrant)?.emoji}</span>
      <Avatar assigneeId={t.assignee} size={22} />
      <FibBadge n={t.fib} size="sm" />
      <StatusPill statusId={t.status} />
      <select value={currentKey} onChange={(e) => move([t.id], e.target.value)} aria-label={`Déplacer ${t.id}`}
        style={{ ...selectStyle, padding: "4px 6px", fontSize: 11 }}>
        {destinations.map((d) => <option key={d.id} value={d.id}>{d.id === currentKey ? `↳ ${d.label}` : `→ ${d.label}`}</option>)}
      </select>
    </div>
  );

  const section = ({ key, target, title, meta, sprint, list, actions }) => {
    const isCollapsed = collapsed.has(key);
    const byMember = MEMBERS.map((m) => ({ m, p: pts(list.filter((t) => t.assignee === m.id)) })).filter((x) => x.p > 0);
    return (
      <section key={key} {...dropZone(key, target)} style={{
        background: C.bgPanel, borderRadius: 10, marginBottom: 14, overflow: "hidden",
        border: `1px ${over === key ? "dashed" : "solid"} ${over === key ? C.champagne : sprint?.status === "active" ? C.encre : C.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", flexWrap: "wrap", background: over === key ? `${C.champagne}10` : "transparent" }}>
          <button onClick={() => toggle(key)} aria-expanded={!isCollapsed} style={{ ...plainBtn, fontSize: 12, color: C.textMuted, width: 16 }}>{isCollapsed ? "▸" : "▾"}</button>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.encre, fontFamily: "'Georgia', serif" }}>{title}</h2>
          {sprint?.status === "active" && <span style={{ fontSize: 10, fontWeight: 800, color: C.ivoire, background: C.emeraude, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.05em" }}>EN COURS</span>}
          <span style={{ color: C.textDim, fontSize: 12 }}>{meta}</span>
          <span style={{ color: C.textMuted, fontSize: 12 }}>{list.length} tickets · <strong>{pts(list)} pts</strong></span>
          {sprint && avgVelocity != null && sprint.status === "planned" && (
            <span style={{ fontSize: 11, color: pts(list) > avgVelocity * 1.2 ? "#C73E47" : C.textDim }}>
              vélocité moy. {avgVelocity}
            </span>
          )}
          <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
            {byMember.map(({ m, p }) => (
              <span key={m.id} title={`${m.name} : ${p} pts`} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: C.textMuted }}>
                <Avatar assigneeId={m.id} size={18} />{p}
              </span>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          {actions}
        </div>
        {sprint?.goal && !isCollapsed && (
          <div style={{ padding: "0 14px 10px 40px", color: C.textMuted, fontSize: 12, fontStyle: "italic" }}>🎯 {sprint.goal}</div>
        )}
        {!isCollapsed && (
          <div style={{ borderTop: `1px solid ${C.borderSubtle}` }}>
            {list.length === 0 ? (
              <div style={{ padding: "18px 14px", color: C.textDim, fontSize: 12, textAlign: "center" }}>
                {target === "backlog" ? "Backlog vide pour ces filtres." : "Glisse des tickets ici, ou utilise « Déplacer » sur une ligne du backlog."}
              </div>
            ) : list.map((t) => row(t, target))}
          </div>
        )}
      </section>
    );
  };

  const backlogList = listFor(null);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Header {...nav} title="Backlog & planification" subtitle={`${openSprints.length} sprint${openSprints.length > 1 ? "s" : ""} ouvert${openSprints.length > 1 ? "s" : ""} · ${backlogList.length} tickets au backlog`}>
        <Btn variant="secondary" size="sm" onClick={() => onQuickAdd(null)}>+ Ticket</Btn>
        <Btn variant="champagne" size="sm" onClick={onNewSprint}>+ Sprint</Btn>
      </Header>
      <ErrorBanner error={error} onDismiss={clearError} />

      <div style={{ padding: "20px 28px 90px", maxWidth: 1400, margin: "0 auto" }}>
        {closed.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <Panel title="Vélocité" hint={`Gris : engagé · Vert : livré${avgVelocity != null ? ` · moyenne ${avgVelocity} pts sur les ${recentClosed.length} derniers sprints` : ""}`}>
              <div style={{ maxWidth: 620 }}><Velocity sprints={sprints} /></div>
            </Panel>
          </div>
        )}

        {/* ═══ FILTRES ═══ */}
        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "10px 14px",
          background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 14,
          position: "sticky", top: 62, zIndex: 20,
        }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Rechercher un ticket…" aria-label="Rechercher"
            style={{ flex: 1, minWidth: 180, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 12px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
          <select value={member} onChange={(e) => setMember(e.target.value)} style={selectStyle} aria-label="Membre">
            <option value="all">Tous les membres</option>
            {me && <option value="me">Mes tickets</option>}
            {MEMBERS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            <option value="unassigned">Non assignés</option>
          </select>
          <select value={phase} onChange={(e) => setPhase(e.target.value)} style={selectStyle} aria-label="Phase">
            <option value="all">Toutes les phases</option>
            {PHASES.map((p) => <option key={p.id} value={p.id}>{p.short}</option>)}
          </select>
          <select value={quadrant} onChange={(e) => setQuadrant(e.target.value)} style={selectStyle} aria-label="Priorité">
            <option value="all">Toutes priorités</option>
            {QUADRANTS.map((q) => <option key={q.id} value={q.id}>{q.emoji} {q.short}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={selectStyle} aria-label="Tri">
            <option value="priority">Tri : priorité</option>
            <option value="phase">Tri : phase</option>
            <option value="id">Tri : n° ticket</option>
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textMuted, cursor: "pointer" }}>
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Terminés au backlog
          </label>
        </div>

        {/* ═══ SPRINTS OUVERTS ═══ */}
        {openSprints.map((s) => section({
          key: s.id, target: s.id, sprint: s, list: listFor(s.id),
          title: s.name, meta: formatRange(s.startDate, s.endDate),
          actions: (
            <>
              <Btn size="sm" variant="ghost" onClick={() => onQuickAdd(s.id)}>+ Ticket</Btn>
              <Btn size="sm" variant="ghost" onClick={() => onEditSprint(s)}>✎ Modifier</Btn>
              {s.status === "planned" && (
                <Btn size="sm" variant="primary" onClick={() => onStartSprint(s)} disabled={!!active || !tickets.some((t) => t.sprintId === s.id)}
                  title={active ? `Termine d'abord « ${active.name} »` : !tickets.some((t) => t.sprintId === s.id) ? "Ajoute au moins un ticket" : ""}>▶ Démarrer</Btn>
              )}
              {s.status === "active" && (
                <Btn size="sm" variant="champagne" onClick={() => onRequestClose(s)}>Terminer</Btn>
              )}
            </>
          ),
        }))}

        {openSprints.length === 0 && (
          <div style={{
            padding: "18px 20px", marginBottom: 14, borderRadius: 10, border: `1px dashed ${C.borderGold}`,
            display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: `${C.champagne}0D`,
          }}>
            <span style={{ flex: 1, fontSize: 14, color: C.encre }}>Aucun sprint ouvert. Crée celui de la semaine puis glisse-y les tickets à finir.</span>
            <Btn variant="champagne" onClick={onNewSprint}>+ Créer le sprint de la semaine</Btn>
          </div>
        )}

        {/* ═══ BACKLOG ═══ */}
        {section({
          key: "backlog", target: "backlog", list: backlogList,
          title: "Backlog", meta: showDone ? "tous statuts" : "hors terminés",
          actions: <Btn size="sm" variant="ghost" onClick={() => onQuickAdd(null)}>+ Ticket</Btn>,
        })}

        {/* ═══ SPRINTS CLOS ═══ */}
        {closed.length > 0 && (
          <section style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <button onClick={() => toggle("closed")} aria-expanded={!collapsed.has("closed")} style={{ ...plainBtn, display: "flex", gap: 10, alignItems: "center", width: "100%", padding: "12px 14px" }}>
              <span style={{ fontSize: 12, color: C.textMuted, width: 16 }}>{collapsed.has("closed") ? "▸" : "▾"}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.encre, fontFamily: "'Georgia', serif" }}>Sprints terminés</span>
              <span style={{ fontSize: 12, color: C.textDim }}>{closed.length}</span>
            </button>
            {!collapsed.has("closed") && closed.map((s) => {
              const list = tickets.filter((t) => t.sprintId === s.id);
              const rate = s.committedPoints ? Math.round(((s.completedPoints || 0) / s.committedPoints) * 100) : null;
              return (
                <details key={s.id} style={{ borderTop: `1px solid ${C.borderSubtle}`, padding: "10px 14px 10px 40px" }}>
                  <summary style={{ cursor: "pointer", fontSize: 13, color: C.text, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
                    <strong>{s.name}</strong>
                    <span style={{ color: C.textDim, fontSize: 12 }}>{formatRange(s.startDate, s.endDate)}</span>
                    <span style={{ color: C.emeraude, fontSize: 12, fontWeight: 700 }}>{s.completedPoints ?? 0} / {s.committedPoints ?? 0} pts{rate != null ? ` (${rate} %)` : ""}</span>
                    {s.goal && <span style={{ color: C.textMuted, fontSize: 12, fontStyle: "italic" }}>🎯 {s.goal}</span>}
                  </summary>
                  <div style={{ marginTop: 8 }}>
                    {list.length === 0
                      ? <span style={{ fontSize: 12, color: C.textDim }}>Aucun ticket rattaché.</span>
                      : list.map((t) => (
                        <button key={t.id} onClick={() => onOpenTicket(t.id)} style={{ ...plainBtn, display: "flex", gap: 10, padding: "3px 0", fontSize: 12, color: C.text, textAlign: "left" }}>
                          <span style={{ color: C.champagneDeep, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{t.id}</span>
                          <span>{t.title}</span>
                          <span style={{ color: STATUSES.find((x) => x.id === t.status)?.color }}>{STATUSES.find((x) => x.id === t.status)?.icon}</span>
                        </button>
                      ))}
                  </div>
                </details>
              );
            })}
          </section>
        )}

        <p style={{ color: C.textDim, fontSize: 11, textAlign: "center", marginTop: 20 }}>
          Astuce : coche plusieurs tickets puis glisse-en un pour tout déplacer d'un coup.
        </p>
      </div>

      {/* ═══ BARRE DE SÉLECTION MULTIPLE ═══ */}
      {selected.size > 0 && (
        <div role="region" aria-label="Actions sur la sélection" style={{
          position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", zIndex: 70,
          display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12,
          background: C.encre, color: C.ivoire, boxShadow: "0 12px 32px rgba(15,27,45,0.3)", flexWrap: "wrap",
        }}>
          <strong style={{ fontSize: 13 }}>{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</strong>
          <span style={{ fontSize: 12, opacity: 0.7 }}>{pts(tickets.filter((t) => selected.has(t.id)))} pts</span>
          <select value={bulkTarget} onChange={(e) => setBulkTarget(e.target.value)} style={{ ...selectStyle, padding: "5px 8px", fontSize: 12 }} aria-label="Destination">
            <option value="">Déplacer vers…</option>
            {destinations.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
          <Btn size="sm" variant="champagne" disabled={!bulkTarget} onClick={async () => {
            const ok = await move([...selected], bulkTarget);
            if (ok) { setSelected(new Set()); setBulkTarget(""); }
          }}>Déplacer</Btn>
          <Btn size="sm" variant="ghost" style={{ color: C.ivoire }} onClick={() => setSelected(new Set())}>Annuler</Btn>
        </div>
      )}

      <style>{`@media (max-width: 820px) {
        .bl-row { grid-template-columns: 18px 22px 48px minmax(0,1fr) auto auto !important; }
        .bl-row > :nth-child(5), .bl-row > :nth-child(8) { display: none; }
        .bl-row > select { grid-column: 3 / -1; }
      }`}</style>
    </div>
  );
}

const plainBtn = { border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: "inherit" };
