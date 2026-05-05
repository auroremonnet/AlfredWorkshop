import { useState } from "react";
import Workspace from "./views/Workspace.jsx";
import Results from "./views/results/Results.jsx";

export default function AlfredWorkspace() {
  const [view, setView] = useState("workspace");
  const [pendingTicketId, setPendingTicketId] = useState(null);

  const openTicket = (id) => {
    setPendingTicketId(id);
    setView("workspace");
  };

  return view === "workspace" ? (
    <Workspace
      view={view}
      setView={setView}
      pendingTicketId={pendingTicketId}
      clearPendingTicket={() => setPendingTicketId(null)}
    />
  ) : (
    <Results view={view} setView={setView} openTicket={openTicket} />
  );
}
