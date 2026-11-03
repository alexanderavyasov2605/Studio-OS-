"use client";
import { useState } from "react";
import { Alert, Button } from "@/components/ui";

export function TelegramLogin({ available }: { available: boolean }) {
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  async function begin() {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/auth/telegram/start", { method: "POST", credentials: "same-origin", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Login unavailable");
      const body = await response.json();
      const url = new URL(body.url);
      if (url.origin !== "https://oauth.telegram.org" || url.pathname !== "/auth") throw new Error("Invalid destination");
      window.location.assign(url.href);
    } catch { setError("Не удалось начать вход. Повторите позже."); setPending(false); }
  }
  return <div className="stack">
    <Button type="button" onClick={begin} disabled={!available} loading={pending}>Войти через Telegram</Button>
    {error && <Alert tone="danger" title="Вход не выполнен">{error}</Alert>}
    <p className="text-muted">Подтвердите вход через @StudiaOSBot. Пароль Telegram на сайте не запрашивается.</p>
    {!available && <p role="status" className="preview-note">Вход через Telegram ещё не подключён. Настройка выполняется владельцем студии.</p>}
  </div>;
}
