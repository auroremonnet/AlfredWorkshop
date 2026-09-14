import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";

// ═══════════════════════════════════════════════════════════════
// useRealtime — écoute les changements Postgres (tickets, sprints)
// faits par les autres membres et déclenche un refetch silencieux.
//
// + filet de sécurité : refetch au retour sur l'onglet, au cas où
//   le realtime ne serait pas activé côté Supabase.
// Retourne le statut de connexion : "connecting" | "live" | "off".
// ═══════════════════════════════════════════════════════════════
export function useRealtime(handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const timers = {};
    const debounced = (key) => () => {
      clearTimeout(timers[key]);
      timers[key] = setTimeout(() => handlersRef.current[key]?.(), 350);
    };

    const channel = supabase
      .channel("alfred-workspace-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, debounced("tickets"))
      .on("postgres_changes", { event: "*", schema: "public", table: "sprints" }, debounced("sprints"))
      .subscribe((s) => {
        if (s === "SUBSCRIBED") setStatus("live");
        else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") setStatus("off");
      });

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        handlersRef.current.tickets?.();
        handlersRef.current.sprints?.();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      Object.values(timers).forEach(clearTimeout);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, []);

  return status;
}
