import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// usePersistedState — synchronise un state avec localStorage
//
// Retourne [state, setState, loading]. `loading` reste true tant
// que le chargement initial depuis localStorage n'a pas eu lieu,
// pour éviter d'écraser le storage avec la valeur initiale au mount.
// ═══════════════════════════════════════════════════════════════
export function usePersistedState(key, initialValue) {
  const [state, setState] = useState(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed !== null && parsed !== undefined) setState(parsed);
      }
    } catch (e) {
      console.warn(`Could not load "${key}":`, e);
    }
    setLoading(false);
  }, [key]);

  useEffect(() => {
    if (loading) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn(`Could not save "${key}":`, e);
    }
  }, [state, loading, key]);

  return [state, setState, loading];
}
