import { useState, useEffect, useMemo } from "react";
import {
  C, STATUSES, QUADRANTS, TEAM, PHASES, FIB_VALUES, FIB_LABEL,
  DEFAULT_TICKETS, selectStyle,
} from "../constants.js";
import { AlfredBowtie, Btn, FibBadge, Avatar, StatCard } from "../components/ui.jsx";
import { TicketModal } from "../components/TicketModal.jsx";
import { TicketRow } from "../components/TicketRow.jsx";
import { EisenhowerView } from "../components/EisenhowerView.jsx";

// ═══════════════════════════════════════════════════════════════
// WORKSPACE — vue tickets (liste + matrice Eisenhower)
// ═══════════════════════════════════════════════════════════════
export default function Workspace() {
  const [tickets, setTickets] = useState(DEFAULT_TICKETS);
  const [loading, setLoading] = useState(true);
  const [editingTicket, setEditingTicket] = useState(null);
  const [filterPhase, setFilterPhase] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterQuadrant, setFilterQuadrant] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list"); // "list" | "matrix"
  const [exported, setExported] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("alfred-tickets-v2");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) setTickets(parsed);
      }
    } catch (e) {
      console.warn("Could not load saved tickets:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    try {
      localStorage.setItem("alfred-tickets-v2", JSON.stringify(tickets));
    } catch (e) {
      console.warn("Could not save tickets:", e);
    }
  }, [tickets, loading]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (filterPhase !== "all" && t.phase !== filterPhase) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterAssignee !== "all" && t.assignee !== filterAssignee) return false;
      if (filterQuadrant !== "all" && t.quadrant !== filterQuadrant) return false;
      if (search && !`${t.id} ${t.title} ${t.desc}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tickets, filterPhase, filterStatus, filterAssignee, filterQuadrant, search]);

  const stats = useMemo(() => {
    const byStatus = STATUSES.reduce((acc, s) => ({ ...acc, [s.id]: tickets.filter((t) => t.status === s.id).length }), {});
    const byAssignee = TEAM.reduce((acc, m) => ({ ...acc, [m.id]: tickets.filter((t) => t.assignee === m.id).length }), {});
    const totalFib = tickets.reduce((s, t) => s + t.fib, 0);
    const doneFib = tickets.filter((t) => t.status === "done").reduce((s, t) => s + t.fib, 0);
    return { total: tickets.length, byStatus, byAssignee, totalFib, doneFib, progress: totalFib ? Math.round((doneFib / totalFib) * 100) : 0 };
  }, [tickets]);

  const saveTicket = (t) => setTickets((prev) => prev.map((x) => (x.id === t.id ? t : x)));
  const deleteTicket = (id) => setTickets((prev) => prev.filter((t) => t.id !== id));
  const cycleStatus = (t) => {
    const idx = STATUSES.findIndex((s) => s.id === t.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    saveTicket({ ...t, status: next.id });
  };
  const addTicket = () => {
    const ids = tickets.map((t) => parseInt(t.id.replace(/\D/g, ""))).filter((n) => !isNaN(n));
    const nextNum = ids.length ? Math.max(...ids) + 1 : 1;
    const newT = {
      id: `T${String(nextNum).padStart(3, "0")}`,
      phase: filterPhase !== "all" ? filterPhase : "p0",
      title: "Nouveau ticket", desc: "",
      fib: 3, status: "todo", deps: "",
      quadrant: filterQuadrant !== "all" ? filterQuadrant : "schedule",
      assignee: filterAssignee !== "all" ? filterAssignee : "unassigned",
    };
    setTickets((prev) => [...prev, newT]);
    setEditingTicket(newT);
  };

  const exportMarkdown = () => {
    let md = `# Alfred — Roadmap Tickets\n\n`;
    md += `> Exporté le ${new Date().toLocaleDateString("fr-FR")} • ${tickets.length} tickets • ${stats.totalFib} pts Fib • ${stats.progress}% complété\n\n`;
    md += `## Équipe\n\n`;
    TEAM.filter(m => m.id !== "unassigned").forEach(m => { md += `- **${m.name}** : ${stats.byAssignee[m.id] || 0} tickets\n`; });
    md += `\n## Matrice d'Eisenhower\n\n`;
    QUADRANTS.forEach(q => {
      const list = tickets.filter(t => t.quadrant === q.id);
      md += `### ${q.emoji} ${q.label} (${list.length})\n*${q.desc}*\n\n`;
    });
    md += `\n---\n\n## Tickets par phase\n`;
    PHASES.forEach((phase) => {
      const ph = tickets.filter((t) => t.phase === phase.id);
      if (!ph.length) return;
      md += `\n### ${phase.label}\n*${phase.period}*\n\n`;
      md += `| ID | Titre | Assigné | Quadrant | Statut | Fib | Description |\n|---|---|---|---|---|---|---|\n`;
      ph.forEach((t) => {
        const status = STATUSES.find((s) => s.id === t.status)?.label || "—";
        const member = TEAM.find((m) => m.id === t.assignee)?.name || "—";
        const quad = QUADRANTS.find((q) => q.id === t.quadrant)?.short || "—";
        const desc = (t.desc || "—").replace(/\n/g, " ").replace(/\|/g, "\\|");
        md += `| ${t.id} | **${t.title}** | ${member} | ${quad} | ${status} | ${t.fib} | ${desc} |\n`;
      });
    });
    setExported(md);
  };

  const resetData = () => {
    if (confirm("Réinitialiser tous les tickets aux valeurs par défaut ?")) setTickets(DEFAULT_TICKETS);
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <AlfredBowtie size={60} withText />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* ═══ HEADER ═══ */}
      <header style={{
        borderBottom: `1px solid ${C.border}`, background: `${C.bgPanel}F0`, backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50, padding: "14px 28px",
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        <AlfredBowtie size={36} withText />
        <div style={{ borderLeft: `1px solid ${C.borderSubtle}`, paddingLeft: 16, marginLeft: 4 }}>
          <div style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700 }}>Roadmap Tickets</div>
          <div style={{ color: C.encre, fontSize: 13, fontWeight: 600, marginTop: 2 }}>Workspace stratégique</div>
        </div>
        <div style={{ flex: 1, minWidth: 20 }} />
        <Btn variant="secondary" size="sm" onClick={exportMarkdown}>📄 Export</Btn>
        <Btn variant="ghost" size="sm" onClick={resetData}>↻ Reset</Btn>
        <Btn variant="champagne" size="sm" onClick={addTicket}>+ Nouveau ticket</Btn>
      </header>

      <div style={{ padding: "20px 28px", maxWidth: 1400, margin: "0 auto" }}>
        {/* ═══ STATS BAR ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
          <StatCard label="Tickets total" value={stats.total} accent={C.encre} />
          <StatCard label="Points Fibonacci" value={stats.totalFib} sub={`${stats.doneFib} terminés`} accent={C.champagneDeep} />
          <StatCard label="Avancement" value={`${stats.progress}%`} sub="basé sur les points" accent={C.emeraude} />
          {STATUSES.slice(0, 3).map((s) => <StatCard key={s.id} label={s.label} value={stats.byStatus[s.id] || 0} accent={s.color} />)}
        </div>

        {/* ═══ TEAM WORKLOAD ═══ */}
        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
          padding: "12px 18px", background: C.bgPanel, border: `1px solid ${C.border}`,
          borderRadius: 8, marginBottom: 16,
        }}>
          <span style={{ color: C.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 8 }}>Équipe</span>
          {TEAM.filter(m => m.id !== "unassigned").map((m) => (
            <button key={m.id} onClick={() => setFilterAssignee(filterAssignee === m.id ? "all" : m.id)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "5px 12px 5px 5px", borderRadius: 99, cursor: "pointer",
              background: filterAssignee === m.id ? `${m.color}15` : C.bgSubtle,
              border: `1px solid ${filterAssignee === m.id ? m.color : C.border}`,
              fontFamily: "inherit", color: C.text, fontSize: 12, fontWeight: 600,
              transition: "all 0.15s",
            }}>
              <Avatar assigneeId={m.id} size={22} />
              {m.name}
              <span style={{ color: m.color, fontWeight: 800, fontFamily: "'Georgia', serif", fontSize: 13, marginLeft: 2 }}>{stats.byAssignee[m.id] || 0}</span>
            </button>
          ))}
          {filterAssignee !== "all" && (
            <button onClick={() => setFilterAssignee("all")} style={{
              padding: "5px 12px", borderRadius: 99, cursor: "pointer",
              background: "transparent", color: C.textMuted, border: `1px solid ${C.border}`,
              fontFamily: "inherit", fontSize: 12,
            }}>Tout afficher</button>
          )}
        </div>

        {/* ═══ VIEW SWITCH + FILTERS ═══ */}
        <div style={{
          display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
          padding: "12px 16px", background: C.bgPanel, border: `1px solid ${C.border}`,
          borderRadius: 8, marginBottom: 16,
        }}>
          <div style={{ display: "flex", gap: 4, padding: 3, background: C.bgSubtle, borderRadius: 6 }}>
            <button onClick={() => setView("list")} style={{
              padding: "6px 14px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
              background: view === "list" ? C.bgPanel : "transparent",
              color: view === "list" ? C.encre : C.textMuted,
              boxShadow: view === "list" ? `0 1px 3px rgba(15,27,45,0.1)` : "none",
            }}>📋 Liste</button>
            <button onClick={() => setView("matrix")} style={{
              padding: "6px 14px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
              background: view === "matrix" ? C.bgPanel : "transparent",
              color: view === "matrix" ? C.encre : C.textMuted,
              boxShadow: view === "matrix" ? `0 1px 3px rgba(15,27,45,0.1)` : "none",
            }}>🎯 Matrice</button>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Rechercher..."
            style={{
              flex: 1, minWidth: 180, background: C.bgInput, color: C.text,
              border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 14px",
              fontSize: 13, outline: "none", fontFamily: "inherit",
            }}
          />
          <select value={filterPhase} onChange={(e) => setFilterPhase(e.target.value)} style={selectStyle}>
            <option value="all">Toutes les phases</option>
            {PHASES.map((p) => <option key={p.id} value={p.id}>{p.short}</option>)}
          </select>
          <select value={filterQuadrant} onChange={(e) => setFilterQuadrant(e.target.value)} style={selectStyle}>
            <option value="all">Tous les quadrants</option>
            {QUADRANTS.map((q) => <option key={q.id} value={q.id}>{q.emoji} {q.short}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
            <option value="all">Tous les statuts</option>
            {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <span style={{ color: C.textDim, fontSize: 12, fontWeight: 600 }}>{filtered.length} / {tickets.length}</span>
        </div>

        {/* ═══ MAIN VIEW ═══ */}
        {view === "matrix" ? (
          <EisenhowerView tickets={filtered} onTicketClick={setEditingTicket} />
        ) : (
          <>
            {filterPhase !== "all" && (() => {
              const ph = PHASES.find((p) => p.id === filterPhase);
              if (!ph) return null;
              return (
                <div style={{
                  padding: "14px 20px", background: `${ph.color}08`, border: `1px solid ${ph.color}30`,
                  borderLeft: `3px solid ${ph.color}`, borderRadius: 8, marginBottom: 14,
                }}>
                  <div style={{ color: ph.color, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>{ph.short} • {ph.period}</div>
                  <div style={{ color: C.encre, fontSize: 17, fontWeight: 700, fontFamily: "'Georgia', serif", marginTop: 3 }}>{ph.label}</div>
                </div>
              );
            })()}

            <div>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: C.textDim }}>
                  <div style={{ fontSize: 36, opacity: 0.4, marginBottom: 12 }}>🔍</div>
                  Aucun ticket ne correspond à tes filtres
                </div>
              ) : (
                filtered.map((t) => (
                  <TicketRow key={t.id} t={t} onClick={() => setEditingTicket(t)} onStatusCycle={cycleStatus} />
                ))
              )}
            </div>
          </>
        )}

        {/* ═══ FOOTER LEGEND ═══ */}
        <div style={{ marginTop: 30, padding: "16px 20px", background: C.bgPanel, border: `1px solid ${C.borderSubtle}`, borderRadius: 8 }}>
          <div style={{ color: C.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Échelle Fibonacci de complexité</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {FIB_VALUES.map((n) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <FibBadge n={n} size="sm" />
                <span style={{ color: C.textMuted }}>{FIB_LABEL[n]}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16, padding: 14, color: C.textDim, fontSize: 11, textAlign: "center", lineHeight: 1.6 }}>
          Modifications <strong style={{ color: C.champagneDeep }}>sauvegardées automatiquement</strong> • Clique sur un ticket pour l'éditer • Clique sur le statut pour le faire avancer • Bouton Export pour Notion
        </div>
      </div>

      {/* ═══ EDIT MODAL ═══ */}
      {editingTicket && (
        <TicketModal ticket={editingTicket} onClose={() => setEditingTicket(null)} onSave={saveTicket} onDelete={deleteTicket} />
      )}

      {/* ═══ EXPORT MODAL ═══ */}
      {exported && (
        <div onClick={() => setExported(null)} style={{
          position: "fixed", inset: 0, background: "rgba(15,27,45,0.5)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: C.bgPanel, border: `1px solid ${C.borderStrong}`, borderRadius: 12,
            width: "100%", maxWidth: 800, maxHeight: "90vh", display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: C.encre, fontSize: 16, fontWeight: 700, fontFamily: "'Georgia', serif" }}>📄 Export Markdown — pour Notion</span>
              <div style={{ flex: 1 }} />
              <Btn variant="champagne" size="sm" onClick={() => { navigator.clipboard.writeText(exported); }}>📋 Copier</Btn>
              <Btn variant="ghost" size="sm" onClick={() => setExported(null)}>✕</Btn>
            </div>
            <textarea value={exported} readOnly style={{
              flex: 1, padding: 20, background: C.bgSubtle, color: C.text, border: "none", outline: "none",
              fontFamily: "monospace", fontSize: 12, lineHeight: 1.5, resize: "none",
            }} />
            <div style={{ padding: "12px 24px", borderTop: `1px solid ${C.borderSubtle}`, color: C.textDim, fontSize: 12, lineHeight: 1.5 }}>
              <strong style={{ color: C.encre }}>Pour importer dans Notion :</strong> copie ce texte → Notion : <code style={{ background: C.bgSubtle, padding: "1px 6px", borderRadius: 3, fontSize: 11 }}>/markdown</code> et colle, ou nouvelle page → "···" → Import → Markdown
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
