import { useState } from "react";
import { C, FIB_COLORS, FIB_LABEL, STATUSES, QUADRANTS, TEAM } from "../constants.js";

// ═══════════════════════════════════════════════════════════════
// ALFRED LOGO — Bowtie (charte officielle)
// ═══════════════════════════════════════════════════════════════
export const AlfredBowtie = ({ size = 36, withText = false, dark = false }) => {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.25 }}>
      <svg width={size * 1.4} height={size * 0.7} viewBox="0 0 140 70" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
        {/* Left wing */}
        <path d="M 5 12 L 60 35 L 5 58 Z" fill={dark ? C.ivoire : C.encre} />
        {/* Right wing */}
        <path d="M 135 12 L 80 35 L 135 58 Z" fill={dark ? C.ivoire : C.encre} />
        {/* Center knot */}
        <rect x="61" y="22" width="18" height="26" rx="2" fill={C.champagne} />
      </svg>
      {withText && (
        <span style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: size * 0.85,
          fontWeight: 400,
          color: dark ? C.ivoire : C.encre,
          letterSpacing: "-0.02em",
          fontStyle: "italic",
        }}>alfred</span>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════
export const Btn = ({ onClick, children, variant = "primary", size = "md", style = {}, disabled, title }) => {
  const variants = {
    primary:   { bg: C.encre,       color: C.ivoire,    border: C.encre,             hover: C.encreLight },
    champagne: { bg: C.champagne,   color: C.encre,     border: C.champagne,         hover: C.champagneLight },
    secondary: { bg: "transparent", color: C.encre,     border: C.borderStrong,      hover: C.bgHover },
    ghost:     { bg: "transparent", color: C.textMuted, border: "transparent",       hover: C.bgHover },
    danger:    { bg: "transparent", color: "#C73E47",   border: "rgba(199,62,71,0.3)", hover: "rgba(199,62,71,0.08)" },
  };
  const sizes = {
    sm: { padding: "6px 12px", fontSize: 12 },
    md: { padding: "8px 16px", fontSize: 13 },
    lg: { padding: "12px 22px", fontSize: 14 },
  };
  const v = variants[variant];
  const s = sizes[size];
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover && !disabled ? v.hover : v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontWeight: 600,
        fontFamily: "inherit",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        ...s,
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export const FibBadge = ({ n, size = "md" }) => {
  const sizes = { sm: { p: "2px 7px", f: 11 }, md: { p: "3px 9px", f: 12 } };
  const s = sizes[size];
  return (
    <span title={`Fibonacci ${n} — ${FIB_LABEL[n]}`} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: `${FIB_COLORS[n]}1A`, color: FIB_COLORS[n],
      border: `1px solid ${FIB_COLORS[n]}40`, borderRadius: 4,
      padding: s.p, fontSize: s.f, fontWeight: 800, fontFamily: "'Georgia', serif",
    }}>
      <span style={{ fontSize: s.f - 2, opacity: 0.7 }}>fib</span>
      {n}
    </span>
  );
};

export const StatusPill = ({ statusId, onClick }) => {
  const s = STATUSES.find((x) => x.id === statusId) || STATUSES[0];
  return (
    <span onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      cursor: onClick ? "pointer" : "default",
      background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}40`,
      borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      <span style={{ fontSize: 10 }}>{s.icon}</span>{s.label}
    </span>
  );
};

export const QuadrantPill = ({ quadrantId }) => {
  const q = QUADRANTS.find((x) => x.id === quadrantId) || QUADRANTS[3];
  return (
    <span title={q.label} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: `${q.color}12`, color: q.color, border: `1px solid ${q.color}40`,
      borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 700,
    }}>
      <span style={{ fontSize: 11 }}>{q.emoji}</span>{q.short}
    </span>
  );
};

export const Avatar = ({ assigneeId, size = 28, showName = false }) => {
  const m = TEAM.find((t) => t.id === assigneeId) || TEAM[TEAM.length - 1];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <div title={m.name} style={{
        width: size, height: size, borderRadius: "50%",
        background: m.color, color: m.id === "hippo" ? C.encre : C.ivoire,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: size * 0.42, fontFamily: "'Georgia', serif",
        border: `2px solid ${C.bgPanel}`,
        boxShadow: `0 0 0 1px ${C.border}`,
      }}>
        {m.initials}
      </div>
      {showName && <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{m.name}</span>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════
export const StatCard = ({ label, value, sub, accent = C.encre }) => (
  <div style={{
    background: C.bgPanel, border: `1px solid ${C.borderSubtle}`, borderTop: `2px solid ${accent}`,
    borderRadius: 8, padding: "14px 18px",
  }}>
    <div style={{ color: accent, fontSize: 26, fontWeight: 800, fontFamily: "'Georgia', serif", lineHeight: 1.1 }}>{value}</div>
    <div style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
    {sub && <div style={{ color: C.textDim, fontSize: 10, marginTop: 2 }}>{sub}</div>}
  </div>
);
