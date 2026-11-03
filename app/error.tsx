"use client";

import { Alert, Button, Card } from "@/components/ui";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="main" className="container public-main"><Card className="card-pad stack">
    <Alert tone="danger" title="Не удалось открыть страницу">Попробуйте ещё раз. Если ошибка повторяется, вернитесь позже.</Alert>
    <div><Button variant="secondary" onClick={reset}>Попробовать снова</Button></div>
  </Card></main>;
}
