"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import LineupBoard from "./LineupBoard";

export default function PublicView({ gameId }) {
  const [game, setGame] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/game/${gameId}`)
      .then((data) => {
        setGame(data.game);
        setPendingRequests(data.pendingRequests || []);
      })
      .catch((err) => setError(err.message));
  }, [gameId]);

  return (
    <main className="app-page">
      <div className="surface">
        {error ? (
          <div className="empty">{error}</div>
        ) : game ? (
          <LineupBoard game={game} pendingRequests={pendingRequests} publicOnly />
        ) : (
          <div className="empty">טוען הרכבים...</div>
        )}
      </div>
      <div style={{ maxWidth: 1480, margin: "12px auto 0" }}>
        <Link className="button secondary" href="/">חזרה לאפליקציה</Link>
      </div>
    </main>
  );
}
