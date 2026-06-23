"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getStoredPlayer } from "@/lib/client";

export default function RequestsAdmin() {
  const [admin, setAdmin] = useState(null);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");

  async function refresh() {
    const stored = getStoredPlayer();
    setAdmin(stored);
    if (!stored?.phone) return;
    const data = await api(`/api/admin/requests?adminPhone=${encodeURIComponent(stored.phone)}`);
    setRequests(data.requests || []);
  }

  useEffect(() => {
    refresh().catch((err) => setMessage(err.message));
  }, []);

  async function decide(requestId, status) {
    await api("/api/admin/requests", {
      method: "PATCH",
      body: JSON.stringify({ adminPhone: admin.phone, requestId, status }),
    });
    await refresh();
  }

  return (
    <main className="app-page">
      <section className="surface">
        <header className="topbar">
          <div>
            <p className="eyebrow">בקשות ממתינות</p>
            <h1>אישורי הצטרפות</h1>
            {message ? <p className="mini">{message}</p> : null}
          </div>
          <Link className="button secondary" href="/admin">חזרה לאדמין</Link>
        </header>
        <div className="field-wrap">
          <div className="list">
            {requests.length ? requests.map((request) => (
              <div className="list-row" key={request._id}>
                <div className="avatar">{request.playerId?.imageUrl ? <img src={request.playerId.imageUrl} alt={request.playerId.name} /> : request.playerId?.name?.[0]}</div>
                <div>
                  <strong>{request.playerId?.name}</strong>
                  <div className="mini muted">מבקש קבוצה: {request.requestedTeamId}</div>
                </div>
                <div className="inline-actions">
                  <button className="button" onClick={() => decide(request._id, "approved")}>אשר</button>
                  <button className="button danger" onClick={() => decide(request._id, "rejected")}>דחה</button>
                </div>
              </div>
            )) : <div className="empty">אין בקשות ממתינות</div>}
          </div>
        </div>
      </section>
    </main>
  );
}
