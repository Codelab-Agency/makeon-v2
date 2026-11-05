"use client";

import { useEffect, useState } from "react";

type Notification = { id: number; status: string; audience?: string; state: string; error: string | null; sentAt: string | null; createdAt: string; leaseUntil: string | null };
const statusLabels: Record<string, string> = { new: "Nouă", processing: "În pregătire", shipped: "Expediată", delivered: "Livrată" };
const emailLabels: Record<string, string> = { pending: "În așteptare", sending: "Se trimite", sent: "Trimis", failed: "Neconfirmat", blocked: "Necesită verificare", skipped: "Netrimis" };

export default function OrderStatusNotifications({ orderID, updatedAt }: { orderID: number; updatedAt: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const endpoint = `/api/orders/status-email?orderID=${orderID}`;
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        if (active) { setNotifications(body.notifications); setError(""); }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Notificările nu pot fi verificate.");
      }
    };
    void refresh();
    const interval = setInterval(refresh, 2500);
    const stop = setTimeout(() => clearInterval(interval), 15000);
    return () => { active = false; controller.abort(); clearInterval(interval); clearTimeout(stop); };
  }, [endpoint, updatedAt]);
  const pending = notifications.some(item => item.state === "pending" || item.state === "failed" ||
    (item.state === "sending" && item.leaseUntil && new Date(item.leaseUntil).getTime() < Date.now()));
  return (
    <section className="makeon-order-panel makeon-status-emails" aria-label="Notificări email">
      <h3>Notificări email</h3>
      <p>Comenzile noi sunt trimise echipei Makeon, iar schimbările de status sunt trimise clientului. „Trimis” confirmă acceptarea de către serviciul de email.</p>
      {error && <p role="alert">{error}</p>}
      {!notifications.length && !error && <p>Nu există notificări pentru această comandă.</p>}
      <ul>{notifications.map(item => <li key={item.id}>
        <div><strong>{item.audience === "merchant" ? "Echipa Makeon · Comandă nouă" : `Client · ${statusLabels[item.status]}`}</strong><span>{emailLabels[item.state]}</span></div>
        {item.error && <p>{item.error}</p>}
      </li>)}</ul>
      {pending && <button type="button" className="btn btn--style-primary" disabled={busy} onClick={async () => {
        setBusy(true); setError("");
        try {
          const response = await fetch(endpoint, { method: "POST" });
          const body = await response.json();
          if (!response.ok) throw new Error(body.error);
          setNotifications(body.notifications);
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Reîncearcă mai târziu."); }
        finally { setBusy(false); }
      }}>{busy ? "Se verifică…" : "Reîncearcă notificările"}</button>}
    </section>
  );
}
