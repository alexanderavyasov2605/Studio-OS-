"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function AdminLogout() {
  const [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  async function exit() {
    setBusy(true); setFailed(false);
    try {
      const response = await fetch("/api/admin/auth/logout", { method: "POST", credentials: "same-origin" });
      if (!response.ok) throw new Error("Logout failed");
      // Full navigation discards all cached privileged UI after session revocation.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/admin/login");
    } catch { setFailed(true); setBusy(false); }
  }
  return <div><Button variant="secondary" onClick={exit} loading={busy}>Выйти</Button>{failed && <p role="alert" className="field__error">Не удалось выйти. Попробуйте ещё раз.</p>}</div>;
}
