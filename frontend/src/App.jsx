import { useEffect, useState } from "react";

export default function App() {
  const [health, setHealth] = useState("checking");

  useEffect(() => {
    fetch("/api/health")
      .then((response) => {
        if (!response.ok) throw new Error("Backend did not respond");
        return response.json();
      })
      .then((data) => setHealth(data.status === "ok" ? "connected" : "error"))
      .catch(() => setHealth("error"));
  }, []);

  return (
    <main className="page">
      <p className="subject">CSE3CWA Assignment 4</p>
      <h1>Autonomous Supermarket</h1>
      <p className="status">
        Backend: <strong>{health}</strong>
      </p>
      <p className="hint">
        The store simulation, 60-day report, daily view, and assurance checks
        are not built yet.
      </p>
    </main>
  );
}
