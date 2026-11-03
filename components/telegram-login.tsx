import { Button } from "@/components/ui";

export function TelegramLogin({ available }: { available: boolean }) {
  return <div className="stack">
    <form action="/api/auth/telegram/start" method="post"><Button type="submit" disabled={!available}>Войти через Telegram</Button></form>
    <p className="text-muted">Подтвердите вход через @StudiaOSBot. Пароль Telegram на сайте не запрашивается.</p>
    {!available && <p role="status" className="preview-note">Вход через Telegram ещё не подключён. Настройка выполняется владельцем студии.</p>}
  </div>;
}
