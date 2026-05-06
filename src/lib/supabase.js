import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════
// CLIENT SUPABASE — instance unique partagée par toute l'app
//
// Les variables d'environnement viennent de .env (gitignoré).
// Voir .env.example pour le format attendu.
// ═══════════════════════════════════════════════════════════════
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Variables Supabase manquantes : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY. " +
    "Copie .env.example vers .env et remplis les valeurs (Project Settings → API)."
  );
}

export const supabase = createClient(url, anonKey);
