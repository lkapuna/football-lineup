"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LoginCard from "@/components/LoginCard";
import LineupBoard from "@/components/LineupBoard";
import { api, clearStoredPlayer, getStoredPlayer } from "@/lib/client";
import { APP_VERSION } from "@/lib/version";

export default function HomePage() {
  const [player, setPlayer] = useState(null);
  const [game, setGame] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function refresh() {
    try {
      setLoadError("");
      const data = await api("/api/game");
      setGame(data.game);
      setPendingRequests(data.pendingRequests || []);
    } catch (error) {
      setLoadError(error.message);
    }
  }

  useEffect(() => {
    setPlayer(getStoredPlayer());
    refresh().finally(() => setLoading(false));
  }, []);

  function logout() {
    clearStoredPlayer();
    setPlayer(null);
  }

  return (
    <main className="app-page">
      <div className="app-shell">
        <aside className="panel">
          <div className="brand">
            <p className="eyebrow">מערכת הרכבים v{APP_VERSION}</p>
            <h1>הרכבי כדורגל שבועיים</h1>
          </div>
          <LoginCard currentPlayer={player} onLogin={setPlayer} />
          {player ? (
            <section className="card">
              <h2 className="card-title">המשתמש שלי</h2>
              <div className="list-row">
                <div className="avatar">{player.imageUrl ? <img src={player.imageUrl} alt={player.name} /> : player.name?.[0]}</div>
                <div>
                  <strong>{player.name}</strong>
                  <div className="mini muted">{player.phone}</div>
                </div>
                <button className="button danger" onClick={logout}>יציאה</button>
              </div>
              {player.isAdmin ? <Link className="button" href="/admin">ניהול אדמין</Link> : null}
            </section>
          ) : null}
        </aside>
        {loading ? <section className="surface empty">טוען...</section> : loadError ? (
          <section className="surface empty">
            <div>
              <strong>טעינת ההרכבים נכשלה</strong>
              <p>{loadError}</p>
              <p className="mini muted">בדוק את משתני הסביבה ב-Render ואת חיבור MongoDB.</p>
            </div>
          </section>
        ) : (
          <LineupBoard game={game} currentPlayer={player} pendingRequests={pendingRequests} onRefresh={refresh} />
        )}
      </div>
    </main>
  );
}
