import { useState } from "react";
import { ModelTab } from "./model/ModelTab";
import { ExplainerTab } from "./explainer/ExplainerTab";

type Tab = "explain" | "model";

export function App() {
  const [tab, setTab] = useState<Tab>("explain");
  return (
    <div className="app">
      <header className="hdr">
        <div>
          <h1>Cash &amp; ARR Studio</h1>
          <p>A subscription app, from $0 to a three-statement model · Jun 2026 → Dec 2030</p>
        </div>
      </header>
      <nav className="pillnav">
        <div className="pillnav-inner">
          <button className={tab === "explain" ? "on" : ""} onClick={() => setTab("explain")}>
            Explainer
          </button>
          <button className={tab === "model" ? "on" : ""} onClick={() => setTab("model")}>
            Model
          </button>
        </div>
      </nav>
      {tab === "explain" ? <ExplainerTab /> : <ModelTab />}
    </div>
  );
}
