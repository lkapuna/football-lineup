"use client";

import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { api } from "@/lib/client";
import PlayerCard from "./PlayerCard";

export default function LineupBoard({ game, currentPlayer, pendingRequests = [], onRefresh, publicOnly = false }) {
  const [message, setMessage] = useState("");

  const playerTeam = useMemo(() => {
    if (!currentPlayer || !game) return null;
    return game.teams.find((team) =>
      team.players.some((player) => String(player._id) === String(currentPlayer._id))
    );
  }, [currentPlayer, game]);

  const pendingByTeam = useMemo(() => {
    const map = new Map();
    pendingRequests.forEach((request) => {
      if (!map.has(request.requestedTeamId)) map.set(request.requestedTeamId, []);
      map.get(request.requestedTeamId).push(request.playerId);
    });
    return map;
  }, [pendingRequests]);

  async function join(team) {
    if (!currentPlayer) {
      setMessage("צריך להיכנס לפני הצטרפות");
      return;
    }
    try {
      const data = await api("/api/team/join", {
        method: "POST",
        body: JSON.stringify({ playerId: currentPlayer._id, teamId: team.id }),
      });
      setMessage(data.status === "pending" ? "נשלחה בקשה לאישור אדמין" : `שובצת ב${team.name}`);
      onRefresh?.();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function leave() {
    if (!currentPlayer) return;
    await api("/api/team/leave", {
      method: "POST",
      body: JSON.stringify({ playerId: currentPlayer._id }),
    });
    setMessage("יצאת מהקבוצה");
    onRefresh?.();
  }

  function shareLineupsWhatsapp() {
    const url = `${window.location.origin}/view/${game._id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`הרכבי כדורגל שבועיים: ${url}`)}`, "_blank");
  }

  function shareAppWhatsapp() {
    const url = `${window.location.origin}/login`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`הצטרפו לאפליקציית הרכבי הכדורגל השבועיים: ${url}`)}`,
      "_blank"
    );
  }

  if (!game) return <div className="empty">טוען הרכבים...</div>;

  return (
    <section className="surface">
      <header className="topbar">
        <div>
          <p className="eyebrow">{game.locked ? "הרכבים נעולים" : "הרכבים פתוחים"}</p>
          <h1>{game.title || "הרכבי כדורגל שבועיים"}</h1>
          {playerTeam ? <p className="muted">אתה משובץ ב{playerTeam.name}</p> : null}
          {message ? <p className="mini">{message}</p> : null}
        </div>
        <div className="topbar-actions">
          {!publicOnly ? (
            <>
              <button className="button secondary" onClick={shareAppWhatsapp}>
                <MessageCircle size={16} /> שתף אפליקציה
              </button>
              <button className="button secondary" onClick={shareLineupsWhatsapp}>
                <MessageCircle size={16} /> שתף הרכבים
              </button>
              <a
                className="button secondary promo-button icon-only"
                href="https://romi-drawing-game.onrender.com"
                target="_blank"
                rel="noreferrer"
                aria-label="פתח משחק מציירים ביחד"
                title="פתח משחק מציירים ביחד"
              >
                <span className="drawing-logo" aria-hidden="true" />
              </a>
            </>
          ) : null}
        </div>
      </header>

      <div className="field-wrap">
        <div className="teams-grid">
          {game.teams.map((team) => {
            const isFull = team.players.length >= team.maxPlayers;
            const pendingPlayers = pendingByTeam.get(team.id) || [];
            return (
              <article key={team.id} className="half-field">
                <div className="team-heading">
                  <strong>{team.name}</strong>
                  <span className="mini">{team.players.length}/{team.maxPlayers}</span>
                </div>
                <div className="player-field-grid">
                  {team.players.map((player) => (
                    <PlayerCard key={player._id} player={player} teamColor={team.color} />
                  ))}
                  {pendingPlayers.map((player) => (
                    <PlayerCard key={`pending-${player._id}`} player={player} teamColor={team.color} pending />
                  ))}
                </div>
                {!publicOnly ? (
                  <div className="team-footer">
                    {playerTeam?.id === team.id ? (
                      <button className="icon-button danger" aria-label="צא מהקבוצה" title="צא מהקבוצה" onClick={leave}>-</button>
                    ) : (
                      <button
                        className="icon-button add"
                        disabled={game.locked}
                        aria-label={isFull ? "בקש להיכנס" : "הצטרף לקבוצה"}
                        title={isFull ? "בקש להיכנס" : "הצטרף לקבוצה"}
                        onClick={() => join(team)}
                      >
                        +
                      </button>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
