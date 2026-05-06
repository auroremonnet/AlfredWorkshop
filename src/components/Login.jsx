import { useState } from "react";
import { C, inputStyle } from "../constants.js";
import { supabase } from "../lib/supabase.js";
import { AlfredBowtie, Btn } from "./ui.jsx";

// Regex basique : tolère les domaines courts mais filtre les saisies
// vraiment incomplètes. Supabase fait la validation finale côté serveur.
const EMAIL_RE = /.+@.+\..+/;

// ═══════════════════════════════════════════════════════════════
// LOGIN — écran d'authentification Magic Link
// ═══════════════════════════════════════════════════════════════
export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const valid = EMAIL_RE.test(email.trim());
  const canSubmit = valid && !loading;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim() });
      if (err) {
        setError(err.message);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError(err?.message || "Erreur inattendue, réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: C.bgPanel, border: `1px solid ${C.borderStrong}`, borderRadius: 12,
        width: "100%", maxWidth: 420, padding: "32px 36px",
        boxShadow: `0 20px 60px rgba(15,27,45,0.12), 0 0 0 1px ${C.champagne}30`,
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <AlfredBowtie size={48} withText />
        </div>

        <div style={{ textAlign: "center", color: C.encre, fontSize: 20, fontWeight: 700, fontFamily: "'Georgia', serif", marginBottom: 6 }}>
          Connexion à l'espace Alfred
        </div>
        <div style={{ textAlign: "center", color: C.textMuted, fontSize: 12, lineHeight: 1.5, marginBottom: 22 }}>
          Saisis ton email — nous t'enverrons un lien de connexion sécurisé.
        </div>

        {sent ? (
          <div style={{
            padding: "14px 16px", background: `${C.emeraude}10`, color: C.emeraude,
            border: `1px solid ${C.emeraude}40`, borderRadius: 8, fontSize: 13, lineHeight: 1.5,
          }}>
            ✓ Vérifie ta boîte mail — un lien de connexion vient d'être envoyé à <strong>{email.trim()}</strong>.
            <div style={{ color: C.textMuted, fontSize: 11, marginTop: 8 }}>
              Pas reçu ? Regarde dans les spams, ou{" "}
              <button onClick={() => { setSent(false); setError(null); }} style={{
                background: "transparent", border: "none", padding: 0, cursor: "pointer",
                color: C.emeraude, textDecoration: "underline", fontFamily: "inherit", fontSize: 11,
              }}>réessaie</button>.
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <label style={{ color: C.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              autoFocus
              required
              disabled={loading}
              style={{ ...inputStyle, padding: "10px 14px", fontSize: 14 }}
            />

            {error && (
              <div style={{
                marginTop: 12, padding: "10px 12px", background: "rgba(199,62,71,0.08)",
                color: "#C73E47", border: "1px solid rgba(199,62,71,0.3)", borderRadius: 6,
                fontSize: 12, lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: 18 }}>
              <Btn
                variant="champagne"
                size="lg"
                disabled={!canSubmit}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {loading ? "Envoi…" : "Recevoir un lien magique"}
              </Btn>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
