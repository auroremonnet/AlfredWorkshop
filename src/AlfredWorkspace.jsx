import { useState } from "react";
import Workspace from "./views/Workspace.jsx";
import Results from "./views/results/Results.jsx";

export default function AlfredWorkspace() {
  const [view, setView] = useState("workspace");
  return view === "workspace"
    ? <Workspace view={view} setView={setView} />
    : <Results view={view} setView={setView} />;
}
