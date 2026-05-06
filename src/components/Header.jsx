import { C } from "../constants.js";
import { AlfredBowtie, Btn } from "./ui.jsx";

// ═══════════════════════════════════════════════════════════════
// HEADER — logo + titre + onglets de nav + bouton session + slot d'actions
// ═══════════════════════════════════════════════════════════════
const VIEWS = [
  { id: "workspace", label: "Workspace", icon: "📋" },
  { id: "results",   label: "Résultats", icon: "📊" },
];

const truncateEmail = (email, max = 24) => {
  if (!email) return "";
  return email.length > max ? email.slice(0, max - 1) + "…" : email;
};

export const Header = ({ view, setView, title, subtitle, userEmail, onSignOut, children }) => {
  return (
    <header style={{
      borderBottom: `1px solid ${C.border}`, background: `${C.bgPanel}F0`, backdropFilter: "blur(12px)",
      position: "sticky", top: 0, zIndex: 50, padding: "14px 28px",
      display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
    }}>
      <AlfredBowtie size={36} withText />
      <div style={{ borderLeft: `1px solid ${C.borderSubtle}`, paddingLeft: 16, marginLeft: 4 }}>
        <div style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700 }}>{title}</div>
        <div style={{ color: C.encre, fontSize: 13, fontWeight: 600, marginTop: 2 }}>{subtitle}</div>
      </div>

      <div style={{ display: "flex", gap: 4, padding: 3, background: C.bgSubtle, borderRadius: 6, marginLeft: 12 }}>
        {VIEWS.map((v) => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: "6px 14px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
            background: view === v.id ? C.bgPanel : "transparent",
            color: view === v.id ? C.encre : C.textMuted,
            boxShadow: view === v.id ? `0 1px 3px rgba(15,27,45,0.1)` : "none",
          }}>{v.icon} {v.label}</button>
        ))}
      </div>

      {userEmail && onSignOut && (
        <Btn variant="ghost" size="sm" onClick={onSignOut} title={`Se déconnecter (${userEmail})`}>
          ↪ {truncateEmail(userEmail)}
        </Btn>
      )}

      <div style={{ flex: 1, minWidth: 20 }} />
      {children}
    </header>
  );
};
