"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, fileToDataUrl, getStoredPlayer } from "@/lib/client";
import PlayerCard from "./PlayerCard";

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [dragPlayerId, setDragPlayerId] = useState("");
  const [message, setMessage] = useState("");
  const [quickAddTeamId, setQuickAddTeamId] = useState("");
  const [quickAddPlayerId, setQuickAddPlayerId] = useState("");
  const [newPlayer, setNewPlayer] = useState({ name: "", phone: "", imageUrl: "", teamId: "" });

  async function refresh() {
    const stored = getStoredPlayer();
    setAdmin(stored);
    if (!stored?.phone) return;
    const [gameData, playersData] = await Promise.all([
      api("/api/game"),
      api(`/api/admin/players?adminPhone=${encodeURIComponent(stored.phone)}`),
    ]);
    setGame(gameData.game);
    setPlayers(playersData.players);
  }

  useEffect(() => {
    refresh().catch((err) => setMessage(err.message));
  }, []);

  async function movePlayer(playerId, teamId, overrideLimit = false) {
    try {
      await api("/api/admin/move", {
        method: "POST",
        body: JSON.stringify({ adminPhone: admin.phone, playerId, teamId, overrideLimit }),
      });
      await refresh();
    } catch (err) {
      if (err.message.includes("נדרש אישור")) {
        if (confirm("הקבוצה מלאה. לשבץ בכל זאת?")) {
          await movePlayer(playerId, teamId, true);
        }
      } else {
        setMessage(err.message);
      }
    }
  }

  async function updateTeam(team, patch) {
    await api("/api/admin/game", {
      method: "PATCH",
      body: JSON.stringify({ adminPhone: admin.phone, action: "updateTeam", teamId: team.id, ...patch }),
    });
    await refresh();
  }

  async function addPlayer(event) {
    event.preventDefault();
    await api("/api/admin/players", {
      method: "POST",
      body: JSON.stringify({ adminPhone: admin.phone, ...newPlayer }),
    });
    setNewPlayer({ name: "", phone: "", imageUrl: "", teamId: "" });
    await refresh();
  }

  async function updatePlayer(playerId, patch) {
    await api("/api/admin/players", {
      method: "PATCH",
      body: JSON.stringify({ adminPhone: admin.phone, playerId, ...patch }),
    });
    await refresh();
  }

  async function deletePlayer(playerId) {
    if (!confirm("למחוק שחקן לגמרי מהמערכת?")) return;
    await api("/api/admin/players", {
      method: "DELETE",
      body: JSON.stringify({ adminPhone: admin.phone, playerId }),
    });
    await refresh();
  }

  async function gameAction(action, extra = {}) {
    await api("/api/admin/game", {
      method: "PATCH",
      body: JSON.stringify({ adminPhone: admin.phone, action, ...extra }),
    });
    await refresh();
  }

  async function createNewGame() {
    await api("/api/admin/game", {
      method: "POST",
      body: JSON.stringify({ adminPhone: admin.phone, title: "משחק שבועי", copyPlayers: false }),
    });
    await refresh();
  }

  async function handleNewPlayerFile(event) {
    const imageUrl = await fileToDataUrl(event.target.files?.[0]);
    setNewPlayer((current) => ({ ...current, imageUrl }));
  }

  async function quickAddToTeam(event) {
    event.preventDefault();
    if (!quickAddTeamId || !quickAddPlayerId) return;
    await movePlayer(quickAddPlayerId, quickAddTeamId);
    setQuickAddPlayerId("");
  }

  const assignedIds = new Set(game?.teams.flatMap((team) => team.players.map((player) => String(player._id))) || []);
  const outsidePlayers = players.filter((player) => !assignedIds.has(String(player._id)));

  if (!admin) return <main className="app-page"><div className="empty">צריך להיכנס כאדמין במסך הראשי</div></main>;

  return (
    <main className="app-page">
      <div className="surface">
        <header className="topbar">
          <div>
            <p className="eyebrow">ניהול אדמין</p>
            <h1>ניהול הרכבים ושחקנים</h1>
            {message ? <p className="mini">{message}</p> : null}
          </div>
          <div className="topbar-actions">
            <Link className="button secondary" href="/">מסך ראשי</Link>
            <Link className="button secondary" href="/admin/requests">בקשות</Link>
            <button className="button secondary" onClick={() => gameAction("lock", { locked: !game?.locked })}>
              {game?.locked ? "פתח הרכבים" : "נעל הרכבים"}
            </button>
            <button className="button warning" onClick={() => gameAction("reset")}>אפס הרכבים</button>
            <button className="button" onClick={createNewGame}>משחק חדש</button>
          </div>
        </header>

        <div className="field-wrap">
          <div className="teams-grid">
            {game?.teams.map((team) => (
              <article
                key={team.id}
                className="half-field"
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dragPlayerId && movePlayer(dragPlayerId, team.id)}
              >
                <div className="team-heading">
                  <input
                    className="input"
                    value={team.name}
                    onChange={(event) => updateTeam(team, { name: event.target.value })}
                  />
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={team.maxPlayers}
                    onChange={(event) => updateTeam(team, { maxPlayers: event.target.value })}
                  />
                </div>
                <div className="player-field-grid">
                  {team.players.map((player) => (
                    <div key={player._id} draggable onDragStart={() => setDragPlayerId(player._id)}>
                      <PlayerCard
                        player={player}
                        teamColor={team.color}
                        adminActions={
                          <div className="inline-actions">
                            <button className="button danger mini" onClick={() => movePlayer(player._id, "outside")}>הוצא</button>
                          </div>
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="team-footer">
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => {
                      setQuickAddTeamId(team.id);
                      setQuickAddPlayerId("");
                    }}
                  >
                    + הוסף לקבוצה
                  </button>
                </div>
              </article>
            ))}
          </div>

          {quickAddTeamId ? (
            <form className="quick-add-panel" onSubmit={quickAddToTeam}>
              <div>
                <strong>הוסף שחקן לקבוצה</strong>
                <div className="mini muted">
                  {game?.teams.find((team) => team.id === quickAddTeamId)?.name}
                </div>
              </div>
              <select
                className="select"
                value={quickAddPlayerId}
                onChange={(event) => setQuickAddPlayerId(event.target.value)}
                required
              >
                <option value="">בחר שחקן</option>
                {players.map((player) => (
                  <option key={player._id} value={player._id}>
                    {player.name} - {player.phone}
                  </option>
                ))}
              </select>
              <div className="inline-actions">
                <button className="button">הוסף</button>
                <button className="button secondary" type="button" onClick={() => setQuickAddTeamId("")}>
                  סגור
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>

      <div className="admin-grid" style={{ marginTop: 14 }}>
        <section className="card">
          <h2 className="card-title">שחקנים בחוץ</h2>
          <div className="list" onDragOver={(event) => event.preventDefault()} onDrop={() => dragPlayerId && movePlayer(dragPlayerId, "outside")}>
            {outsidePlayers.length ? outsidePlayers.map((player) => (
              <div className="admin-player-row" key={player._id} draggable onDragStart={() => setDragPlayerId(player._id)}>
                <div className="avatar">{player.imageUrl ? <img src={player.imageUrl} alt={player.name} /> : player.name?.[0]}</div>
                <div>
                  <input className="input" value={player.name} onChange={(e) => updatePlayer(player._id, { name: e.target.value })} />
                  <div className="mini muted">{player.phone}</div>
                </div>
                <div className="inline-actions">
                  <select
                    className="select compact-select"
                    defaultValue=""
                    onChange={(event) => {
                      if (event.target.value) movePlayer(player._id, event.target.value);
                      event.target.value = "";
                    }}
                  >
                    <option value="">שבץ</option>
                    {game?.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                  <button className="button danger" onClick={() => deletePlayer(player._id)}>מחק</button>
                </div>
              </div>
            )) : <div className="empty">אין שחקנים בחוץ</div>}
          </div>
        </section>

        <section className="card">
          <h2 className="card-title">כל השחקנים</h2>
          <div className="list">
            {players.map((player) => (
              <div className="admin-player-row" key={player._id}>
                <div className="avatar">{player.imageUrl ? <img src={player.imageUrl} alt={player.name} /> : player.name?.[0]}</div>
                <div>
                  <strong>{player.name}</strong>
                  <div className="mini muted">{player.phone}</div>
                </div>
                <button className="button danger" onClick={() => deletePlayer(player._id)}>מחק</button>
              </div>
            ))}
          </div>
        </section>

        <section className="card add-player-card">
          <h2 className="card-title">הוסף שחקן חדש</h2>
          <form className="form-grid" onSubmit={addPlayer}>
            <input className="input" placeholder="שם" value={newPlayer.name} onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })} required />
            <input className="input" placeholder="טלפון" value={newPlayer.phone} onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })} required />
            <input className="input" type="file" accept="image/*" onChange={handleNewPlayerFile} />
            <select className="select" value={newPlayer.teamId} onChange={(e) => setNewPlayer({ ...newPlayer, teamId: e.target.value })}>
              <option value="">ללא קבוצה</option>
              {game?.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            <button className="button">הוסף שחקן</button>
          </form>
        </section>
      </div>
    </main>
  );
}
