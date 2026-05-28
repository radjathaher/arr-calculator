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
          <p>How big can a subscription app get on a credit line? · auto-extends to $1M ARR</p>
        </div>
        <div className="tabs">
          <button className={tab === "explain" ? "on" : ""} onClick={() => setTab("explain")}>
            Explainer
          </button>
          <button className={tab === "model" ? "on" : ""} onClick={() => setTab("model")}>
            Model
          </button>
        </div>
      </header>
      {tab === "explain" ? <ExplainerTab /> : <ModelTab />}
    </div>
  );
}
