import { useEffect, useState } from "react";
import AssuranceView from "./AssuranceView.jsx";
import DailyView from "./DailyView.jsx";
import FindingsView from "./FindingsView.jsx";
import ModelView from "./ModelView.jsx";
import OperationsView from "./OperationsView.jsx";
import PerformanceView from "./PerformanceView.jsx";

const VIEWS = [
  ["model", "Model"],
  ["performance", "60-day report"],
  ["operations", "Operations"],
  ["findings", "Findings"],
  ["daily", "Daily"],
  ["assurance", "Assurance"],
];

export default function App() {
  const [view, setView] = useState("performance");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/run")
      .then((response) => {
        if (!response.ok) throw new Error("The submitted run could not be loaded");
        return response.json();
      })
      .then(setReport)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="subject">CSE3CWA Assignment 4 · Submitted run {report ? report.runId : "…"}</p>
          <h1>Autonomous supermarket</h1>
          <p className="lede">
            Swanston Street prototype, {report ? report.startDate : "…"} for {report ? report.dayCount : 60} days.
          </p>
        </div>
      </header>
      <nav className="nav">
        {VIEWS.map(([id, label]) => (
          <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)} type="button">
            {label}
          </button>
        ))}
      </nav>
      <main>
        {error && <p className="error">{error}</p>}
        {!report && !error && <p>Loading the submitted run…</p>}
        {report && view === "model" && <ModelView report={report} />}
        {report && view === "performance" && <PerformanceView report={report} />}
        {report && view === "operations" && <OperationsView report={report} />}
        {report && view === "findings" && <FindingsView report={report} />}
        {report && view === "daily" && <DailyView />}
        {report && view === "assurance" && <AssuranceView report={report} />}
      </main>
    </div>
  );
}
