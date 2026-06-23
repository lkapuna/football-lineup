"use client";

import { useMemo, useRef, useState } from "react";
import { Share2, FileDown, MessageCircle } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { api } from "@/lib/client";
import PlayerCard from "./PlayerCard";

export default function LineupBoard({ game, currentPlayer, pendingRequests = [], onRefresh, publicOnly = false }) {
  const exportRef = useRef(null);
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

  async function copyShare() {
    const url = `${window.location.origin}/view/${game._id}`;
    await navigator.clipboard.writeText(url);
    setMessage("הלינק הועתק");
  }

  function shareWhatsapp() {
    const url = `${window.location.origin}/view/${game._id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`הרכבי כדורגל שבועיים: ${url}`)}`, "_blank");
  }

  async function exportPdf() {
    const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const pdf = new jsPDF("p", "mm", "a4");
    const width = 210;
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, width, Math.min(height, 297));
    pdf.save(`football-lineups-${new Date().toISOString().slice(0, 10)}.pdf`);
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
              <button className="button secondary" onClick={copyShare}><Share2 size={16} /> שתף לינק</button>
              <button className="button secondary" onClick={shareWhatsapp}><MessageCircle size={16} /> וואטסאפ</button>
            </>
          ) : null}
          <button className="button secondary" onClick={exportPdf}><FileDown size={16} /> ייצא PDF</button>
        </div>
      </header>

      <div ref={exportRef} className="field-wrap">
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
                      <button className="button danger" onClick={leave}>עזוב קבוצה</button>
                    ) : (
                      <button className="button" disabled={game.locked} onClick={() => join(team)}>
                        {isFull ? "בקש להיכנס" : "הצטרף לקבוצה"}
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
