import { useState } from "react";
import { C, inputStyle } from "../constants.js";
import { supabase } from "../lib/supabase.js";
import { AlfredBowtie, Btn } from "./ui.jsx";

// Regex basique : tolère les domaines courts mais filtre les saisies
// vraiment incomplètes. Supabase fait la validation finale côté serveur.
const EMAIL_RE = /.+@.+\..+/;

// Logo Google officiel — SVG inline 4 couleurs, zéro dépendance.
const GoogleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// LOGIN — écran d'authentification (Google OAuth + Magic Link)
// ═══════════════════════════════════════════════════════════════
export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(null); // null | "magic" | "google"
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const isLoading = loading !== null;
  const valid = EMAIL_RE.test(email.trim());
  const canSubmitMagic = valid && !isLoading;

  const onSubmitMagic = async (e) => {
    e.preventDefault();
    if (!canSubmitMagic) return;
    setError(null);
    setLoading("magic");
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
      setLoading(null);
    }
  };

  const onGoogleSignIn = async () => {
    if (isLoading) return;
    setError(null);
    setLoading("google");
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (err) {
        setError(err.message);
        setLoading(null);
      }
      // Si pas d'erreur, le browser redirige vers Google → on garde
      // loading="google" pour éviter un re-clic pendant le délai de redirection.
    } catch (err) {
      setError(err?.message || "Erreur inattendue, réessaie dans un instant.");
      setLoading(null);
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
          Choisis ta méthode de connexion.
        </div>

        {/* Bouton Google — toujours visible, même quand sent=true */}
        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={isLoading}
          title="Continuer avec Google"
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: C.bgPanel, color: C.text, border: `1px solid ${C.borderStrong}`,
            borderRadius: 6, padding: "10px 16px", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading && loading !== "google" ? 0.5 : 1,
            transition: "all 0.15s ease",
          }}
        >
          <GoogleIcon size={18} />
          {loading === "google" ? "Redirection…" : "Continuer avec Google"}
        </button>

        {/* Séparateur "ou" */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ color: C.textDim, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>ou</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* Form Magic Link OU bandeau "envoyé" */}
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
          <form onSubmit={onSubmitMagic}>
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
              disabled={isLoading}
              style={{ ...inputStyle, padding: "10px 14px", fontSize: 14 }}
            />

            <div style={{ marginTop: 14 }}>
              <Btn
                variant="champagne"
                size="lg"
                disabled={!canSubmitMagic}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {loading === "magic" ? "Envoi…" : "Recevoir un lien magique"}
              </Btn>
            </div>
          </form>
        )}

        {/* Bandeau d'erreur partagé entre les 2 méthodes — bas de la card */}
        {error && (
          <div style={{
            marginTop: 14, padding: "10px 12px", background: "rgba(199,62,71,0.08)",
            color: "#C73E47", border: "1px solid rgba(199,62,71,0.3)", borderRadius: 6,
            fontSize: 12, lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
