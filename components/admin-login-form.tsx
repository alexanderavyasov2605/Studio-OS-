"use client";

import { useState, type FormEvent } from "react";
import { Alert, Button, Input } from "@/components/ui";

export function AdminLoginForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setPending(true); setError("");
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fields.get("email"), password: fields.get("password") }),
      });
      if (response.ok) {
        // Full navigation discards the pre-authentication client route cache.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/admin");
        return;
      }
      setError(response.status === 429 ? "Слишком много попыток. Повторите позже." : "Не удалось войти. Проверьте email и пароль или повторите позже.");
    } catch { setError("Не удалось войти. Попробуйте позже."); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="stack">
    <Input label="Email" name="email" type="email" autoComplete="username" required maxLength={254} disabled={pending} />
    <Input label="Пароль" name="password" type="password" autoComplete="current-password" required disabled={pending} />
    {error && <Alert tone="danger" title="Вход не выполнен">{error}</Alert>}
    <Button type="submit" loading={pending}>{pending ? "Проверяем…" : "Войти"}</Button>
  </form>;
}
