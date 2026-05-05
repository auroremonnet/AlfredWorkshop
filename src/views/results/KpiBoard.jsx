import { useState, useEffect } from "react";
import { C, inputStyle, lblStyle, todayISO, formatDateShort } from "../../constants.js";
import { usePersistedState } from "../../hooks/usePersistedState.js";
import { Btn } from "../../components/ui.jsx";

// ═══════════════════════════════════════════════════════════════
// SEED — 5 KPIs business par défaut, valeur 0, history vide
// ═══════════════════════════════════════════════════════════════
const SEED_KPIS = [
  { id: "kpi-seed-1", name: "Entretiens utilisateurs / semaine", unit: "interviews", value: 0, history: [] },
  { id: "kpi-seed-2", name: "Inscriptions waitlist", unit: "personnes", value: 0, history: [] },
  { id: "kpi-seed-3", name: "Beta-testeurs recrutés", unit: "personnes", value: 0, history: [] },
  { id: "kpi-seed-4", name: "MRR", unit: "€", value: 0, history: [] },
  { id: "kpi-seed-5", name: "Churn", unit: "%", value: 0, history: [] },
];

// ═══════════════════════════════════════════════════════════════
// SPARKLINE — SVG inline minimaliste, sans dépendance
// ═══════════════════════════════════════════════════════════════
const Sparkline = ({ history, currentValue, width = 140, height = 32 }) => {
  const points = [...history.map((h) => h.value), currentValue].map(Number).filter((n) => !isNaN(n));
  if (points.length < 2) {
    return <div style={{ height, color: C.textDim, fontSize: 11, fontStyle: "italic", display: "flex", alignItems: "center" }}>Pas encore d'historique</div>;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = 3;
  const xs = points.map((_, i) => pad + (i * (width - 2 * pad)) / (points.length - 1));
  const ys = points.map((v) => height - pad - ((v - min) * (height - 2 * pad)) / range);
  const path = points.map((_, i) => `${i === 0 ? "M" : "L"} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path d={path} fill="none" stroke={C.emeraude} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={2.5} fill={C.emeraude} />
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════
// MODALE — création ou édition d'un KPI
// ═══════════════════════════════════════════════════════════════
const KpiModal = ({ kpi, onClose, onSave }) => {
  const [k, setK] = useState(kpi);
  useEffect(() => setK(kpi), [kpi]);
  if (!k) return null;
  const isNew = !k.id;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,27,45,0.45)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.bgPanel, border: `1px solid ${C.borderStrong}`, borderRadius: 12,
        width: "100%", maxWidth: 480, padding: "24px 28px",
        boxShadow: `0 20px 60px rgba(15,27,45,0.25), 0 0 0 1px ${C.champagne}30`,
      }}>
        <div style={{ color: C.encre, fontSize: 18, fontWeight: 700, fontFamily: "'Georgia', serif", marginBottom: 16 }}>
          {isNew ? "Nouveau KPI" : "Éditer KPI"}
        </div>
        <label style={{ ...lblStyle, marginBottom: 6, display: "block" }}>Nom</label>
        <input value={k.name} onChange={(e) => setK({ ...k, name: e.target.value })} placeholder="Ex: Inscriptions waitlist" style={inputStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
          <div>
            <label style={{ ...lblStyle, marginBottom: 6, display: "block" }}>Valeur courante</label>
            <input type="number" value={k.value} onChange={(e) => setK({ ...k, value: Number(e.target.value) })} style={inputStyle} />
          </div>
          <div>
            <label style={{ ...lblStyle, marginBottom: 6, display: "block" }}>Unité</label>
            <input value={k.unit} onChange={(e) => setK({ ...k, unit: e.target.value })} placeholder="€, %, personnes…" style={inputStyle} />
          </div>
        </div>
        {!isNew && k.value !== kpi.value && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: `${C.emeraude}10`, color: C.emeraude, fontSize: 11, borderRadius: 6, border: `1px solid ${C.emeraude}30` }}>
            ✓ La valeur précédente ({kpi.value}) sera ajoutée à l'historique en date du {formatDateShort(todayISO())}.
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
          <Btn variant="primary" onClick={() => { onSave(k); onClose(); }}>Sauvegarder</Btn>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// CARD KPI
// ═══════════════════════════════════════════════════════════════
const KpiCard = ({ kpi, onEdit, onDelete }) => {
  const recent = [...kpi.history].slice(-3).reverse();
  return (
    <div style={{
      background: C.bgPanel, border: `1px solid ${C.borderSubtle}`, borderTop: `2px solid ${C.champagneDeep}`,
      borderRadius: 8, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.text, fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{kpi.name}</div>
          {kpi.unit && <div style={{ color: C.textDim, fontSize: 11, marginTop: 2 }}>{kpi.unit}</div>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ color: C.champagneDeep, fontSize: 28, fontWeight: 800, fontFamily: "'Georgia', serif", lineHeight: 1 }}>{kpi.value}</span>
        {kpi.unit && <span style={{ color: C.textMuted, fontSize: 12, fontWeight: 600 }}>{kpi.unit}</span>}
      </div>

      <Sparkline history={kpi.history} currentValue={kpi.value} />

      {recent.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {recent.map((h, i) => (
            <span key={i} style={{
              fontSize: 10, padding: "2px 7px", borderRadius: 99,
              background: C.bgSubtle, color: C.textMuted, border: `1px solid ${C.borderSubtle}`,
            }}>
              {formatDateShort(h.date)} · {h.value}{kpi.unit ? ` ${kpi.unit}` : ""}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
        <Btn variant="secondary" size="sm" onClick={onEdit}>✎ Mettre à jour</Btn>
        <Btn variant="ghost" size="sm" onClick={onDelete}>🗑</Btn>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// KPI BOARD — section principale
// ═══════════════════════════════════════════════════════════════
export default function KpiBoard() {
  const [kpis, setKpis] = usePersistedState("alfred-kpis-v1", SEED_KPIS);
  const [editing, setEditing] = useState(null);

  const saveKpi = (k) => {
    if (!k.id) {
      const newK = { ...k, id: `kpi-${Date.now()}`, history: [] };
      setKpis((prev) => [...prev, newK]);
      return;
    }
    setKpis((prev) => prev.map((x) => {
      if (x.id !== k.id) return x;
      const valueChanged = x.value !== k.value;
      const newHistory = valueChanged ? [...x.history, { date: todayISO(), value: x.value }] : x.history;
      return { ...k, history: newHistory };
    }));
  };

  const deleteKpi = (id) => {
    if (confirm("Supprimer ce KPI et son historique ?")) {
      setKpis((prev) => prev.filter((k) => k.id !== id));
    }
  };

  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <h2 style={{ color: C.encre, fontSize: 18, fontWeight: 700, fontFamily: "'Georgia', serif", margin: 0 }}>📊 Indicateurs business</h2>
        <span style={{ color: C.textDim, fontSize: 12 }}>{kpis.length} KPI{kpis.length > 1 ? "s" : ""}</span>
        <div style={{ flex: 1 }} />
        <Btn variant="champagne" size="sm" onClick={() => setEditing({ name: "", unit: "", value: 0 })}>+ KPI</Btn>
      </div>

      {kpis.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.textDim, background: C.bgPanel, border: `1px solid ${C.borderSubtle}`, borderRadius: 8 }}>
          Aucun KPI pour le moment.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {kpis.map((k) => (
            <KpiCard key={k.id} kpi={k} onEdit={() => setEditing(k)} onDelete={() => deleteKpi(k.id)} />
          ))}
        </div>
      )}

      {editing && <KpiModal kpi={editing} onClose={() => setEditing(null)} onSave={saveKpi} />}
    </section>
  );
}
