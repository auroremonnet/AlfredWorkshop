import { useState, useRef, useEffect } from "react";
import { C, MEMBERS, memberById } from "../constants.js";
import { AlfredBowtie, Btn, Avatar } from "./ui.jsx";

// ═══════════════════════════════════════════════════════════════
// HEADER — logo + titre + onglets + « Je suis » + live + slot d'actions
//
// Toutes les vues reçoivent un objet `nav` depuis le shell et le
// passent tel quel : <Header {...nav} title=… subtitle=…>actions</Header>
// ═══════════════════════════════════════════════════════════════
export const VIEWS = [
  { id: "sprint",    label: "Sprint",    icon: "🏃" },
  { id: "backlog",   label: "Backlog",   icon: "🗂" },
  { id: "workspace", label: "Roadmap",   icon: "📋" },
  { id: "results",   label: "Résultats", icon: "📊" },
];

const LIVE = {
  live:       { color: "#1F6B4A", label: "Synchro live" },
  connecting: { color: "#D4A95C", label: "Connexion…" },
  off:        { color: "#8B92A3", label: "Synchro au retour sur l'onglet" },
};

export const Header = ({
  view, setView, title, subtitle, userEmail, onSignOut,
  me, setMe, liveStatus = "connecting", children,
}) => {
  const live = LIVE[liveStatus] || LIVE.off;
  return (
    <header style={{
      borderBottom: `1px solid ${C.border}`, background: `${C.bgPanel}F0`, backdropFilter: "blur(12px)",
      position: "sticky", top: 0, zIndex: 50, padding: "12px 28px",
      display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
    }}>
      <AlfredBowtie size={34} withText />
      <div style={{ borderLeft: `1px solid ${C.borderSubtle}`, paddingLeft: 14 }}>
        <div style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700 }}>{title}</div>
        <div style={{ color: C.encre, fontSize: 13, fontWeight: 600, marginTop: 2 }}>{subtitle}</div>
      </div>

      <nav style={{ display: "flex", gap: 4, padding: 3, background: C.bgSubtle, borderRadius: 6, marginLeft: 6 }}>
        {VIEWS.map((v) => (
          <button key={v.id} onClick={() => setView(v.id)} aria-current={view === v.id ? "page" : undefined} style={{
            padding: "6px 12px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
            background: view === v.id ? C.bgPanel : "transparent",
            color: view === v.id ? C.encre : C.textMuted,
            boxShadow: view === v.id ? `0 1px 3px rgba(15,27,45,0.1)` : "none",
          }}>{v.icon} {v.label}</button>
        ))}
      </nav>

      <span title={live.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.textDim, fontSize: 11 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: live.color }} />
        {liveStatus === "live" ? "Live" : ""}
      </span>

      <div style={{ flex: 1, minWidth: 12 }} />
      {children}
      {setMe && <MePicker me={me} setMe={setMe} userEmail={userEmail} onSignOut={onSignOut} />}
    </header>
  );
};

// ═══════════════════════════════════════════════════════════════
// « JE SUIS » — identité locale (par navigateur) : sert à signer les
// commentaires, au filtre « Mes tickets » et au bouton « Je prends ».
// ═══════════════════════════════════════════════════════════════
const MePicker = ({ me, setMe, userEmail, onSignOut }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const m = me ? memberById(me) : null;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "4px 10px 4px 4px", borderRadius: 99,
        border: `1px solid ${m ? C.border : C.borderGold}`, background: m ? C.bgPanel : `${C.champagne}18`,
        cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: C.text,
      }}>
        <Avatar assigneeId={me || "unassigned"} size={24} />
        {m ? m.name : "Qui es-tu ?"}
        <span style={{ color: C.textDim, fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 6px)", minWidth: 230, zIndex: 60,
          background: C.bgPanel, border: `1px solid ${C.borderStrong}`, borderRadius: 10, padding: 6,
          boxShadow: "0 12px 32px rgba(15,27,45,0.18)",
        }}>
          <div style={{ padding: "6px 10px", color: C.textDim, fontSize: 11 }}>Je suis…</div>
          {MEMBERS.map((x) => (
            <button key={x.id} onClick={() => { setMe(x.id); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "7px 10px", borderRadius: 6,
              border: "none", background: me === x.id ? C.bgHover : "transparent", cursor: "pointer",
              fontFamily: "inherit", textAlign: "left",
            }}>
              <Avatar assigneeId={x.id} size={24} />
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text }}>{x.name}</span>
                <span style={{ display: "block", fontSize: 11, color: C.textDim }}>{x.role}</span>
              </span>
              {me === x.id && <span style={{ color: C.emeraude }}>✓</span>}
            </button>
          ))}
          {userEmail && onSignOut && (
            <div style={{ borderTop: `1px solid ${C.borderSubtle}`, marginTop: 6, paddingTop: 6 }}>
              <div style={{ padding: "4px 10px", color: C.textDim, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</div>
              <Btn variant="ghost" size="sm" onClick={onSignOut} style={{ width: "100%", textAlign: "left" }}>↪ Se déconnecter</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
